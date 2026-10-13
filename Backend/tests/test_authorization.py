from uuid import uuid4


def test_member_permissions_and_my_projects(client, monkeypatch):
    owner_email = f"owner-{uuid4()}@example.com"
    owner_registration = client.post(
        "/auth/register",
        json={
            "name": "Organization Owner",
            "email": owner_email,
            "password": "password123"
        }
    )
    assert owner_registration.status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": owner_email, "password": "password123"}
    ).status_code == 200

    organization_response = client.post(
        "/organizations/create-organization",
        json={"name": "Authorization Test Organization"}
    )
    assert organization_response.status_code == 200
    organization_id = organization_response.json()["id"]

    member_email = f"member-{uuid4()}@example.com"
    member_registration = client.post(
        "/auth/register",
        json={
            "name": "Organization Member",
            "email": member_email,
            "password": "password123"
        }
    )
    assert member_registration.status_code == 200
    member_id = member_registration.json()["id"]

    add_member_response = client.post(
        f"/organizations/organizations/{organization_id}/members",
        json={"user_id": member_id}
    )
    assert add_member_response.status_code == 200

    project_response = client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={
            "name": "Member Assigned Project",
            "organization_id": organization_id
        }
    )
    assert project_response.status_code == 200
    project_id = project_response.json()["id"]

    second_project_response = client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={
            "name": "Owner Assigned Project",
            "organization_id": organization_id
        }
    )
    assert second_project_response.status_code == 200
    second_project_id = second_project_response.json()["id"]

    def create_task(task_project_id, title, assignee_id):
        return client.post(
            f"/tasks/organizations/{organization_id}/projects/{task_project_id}/tasks",
            json={
                "project_id": task_project_id,
                "title": title,
                "status": "todo",
                "priority": "medium",
                "assignee_id": assignee_id
            }
        )

    first_member_task = create_task(project_id, "Member task one", member_id)
    second_member_task = create_task(project_id, "Member task two", member_id)
    owner_task = create_task(
        second_project_id,
        "Owner task",
        owner_registration.json()["id"]
    )
    assert first_member_task.status_code == 200
    assert second_member_task.status_code == 200
    assert owner_task.status_code == 200

    assert client.post("/auth/login", json={
        "email": member_email,
        "password": "password123"
    }).status_code == 200

    from app.routers.websocket import manager
    broadcast_events = []

    async def capture_broadcast(*args):
        broadcast_events.append(args)

    monkeypatch.setattr(manager, "broadcast", capture_broadcast)

    assert client.get(
        f"/projects/organizations/{organization_id}/projects"
    ).status_code == 200
    assert client.get(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks"
    ).status_code == 200

    my_tasks_response = client.get(
        f"/organizations/organizations/{organization_id}/my_tasks"
    )
    assert my_tasks_response.status_code == 200
    assert {task["id"] for task in my_tasks_response.json()} == {
        first_member_task.json()["id"],
        second_member_task.json()["id"]
    }

    my_projects_response = client.get(
        f"/organizations/organizations/{organization_id}/my_projects"
    )
    assert my_projects_response.status_code == 200
    assert [project["id"] for project in my_projects_response.json()] == [project_id]

    assert client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={"name": "Member project", "organization_id": organization_id}
    ).status_code == 403
    assert client.patch(
        f"/projects/organizations/{organization_id}/projects/{project_id}",
        json={"name": "Member edit"}
    ).status_code == 403
    assert client.delete(
        f"/projects/organizations/{organization_id}/projects/{project_id}"
    ).status_code == 403

    unassigned_task = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id": project_id,
            "title": "Member-created unassigned task",
            "status": "todo",
            "priority": "low"
        }
    )
    assert unassigned_task.status_code == 403
    assert client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id": project_id,
            "title": "Member attempts assignment",
            "status": "todo",
            "priority": "low",
            "assignee_id": member_id
        }
    ).status_code == 403

    assert broadcast_events == []
    current_project_tasks = client.get(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks"
    )
    assert {task["id"] for task in current_project_tasks.json()} == {
        first_member_task.json()["id"],
        second_member_task.json()["id"]
    }

    assert client.put(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks/{first_member_task.json()['id']}",
        json={"title": "Member updated own task"}
    ).status_code == 200

    broadcast_events.clear()

    task_url = (
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks/"
        f"{first_member_task.json()['id']}"
    )
    rejected_mass_assignment = client.put(
        task_url,
        json={
            "title": "Unauthorized title change",
            "assignee_id": owner_registration.json()["id"]
        }
    )
    assert rejected_mass_assignment.status_code == 403
    unchanged_task = client.get(task_url)
    assert unchanged_task.status_code == 200
    assert unchanged_task.json()["title"] == "Member updated own task"
    assert unchanged_task.json()["assignee_id"] == member_id

    assert client.put(
        task_url,
        json={"assignee_id": None}
    ).status_code == 403
    assert client.put(
        f"/tasks/organizations/{organization_id}/projects/{second_project_id}/tasks/{owner_task.json()['id']}",
        json={"title": "Member updates another user's task"}
    ).status_code == 403
    assert client.patch(
        f"/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{first_member_task.json()['id']}/status",
        json={"status": "done"}
    ).status_code == 403
    broadcast_events.clear()
    assert client.patch(
        f"/organizations/organizations/{organization_id}/projects/{second_project_id}/tasks/{owner_task.json()['id']}/priority",
        json={"priority": "high"}
    ).status_code == 403
    assert client.delete(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks/{first_member_task.json()['id']}"
    ).status_code == 403

    assert client.patch(
        f"/organizations/organizations/{organization_id}/projects/{second_project_id}/task/{owner_task.json()['id']}/assignee",
        json={"user_id": member_id}
    ).status_code == 403
    assert client.patch(
        f"/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{first_member_task.json()['id']}/unassign"
    ).status_code == 403
    assert client.get(
        f"/organizations/organizations/{organization_id}/users/{owner_registration.json()['id']}/tasks"
    ).status_code == 403
    assert broadcast_events == []

    current_project_tasks = client.get(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks"
    )
    assert {task["id"] for task in current_project_tasks.json()} == {
        first_member_task.json()["id"],
        second_member_task.json()["id"]
    }


def test_admin_retains_task_management_permissions(client):
    owner_email = f"task-admin-owner-{uuid4()}@example.com"
    owner = client.post(
        "/auth/register",
        json={
            "name": "Task Admin Test Owner",
            "email": owner_email,
            "password": "password123"
        }
    )
    assert owner.status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": owner_email, "password": "password123"}
    ).status_code == 200

    organization = client.post(
        "/organizations/create-organization",
        json={"name": "Task Admin Permissions"}
    )
    assert organization.status_code == 200
    organization_id = organization.json()["id"]

    admin_email = f"task-admin-{uuid4()}@example.com"
    admin = client.post(
        "/auth/register",
        json={
            "name": "Task Admin",
            "email": admin_email,
            "password": "password123"
        }
    )
    assert admin.status_code == 200
    admin_id = admin.json()["id"]
    assert client.post(
        f"/organizations/organizations/{organization_id}/members",
        json={"user_id": admin_id}
    ).status_code == 200
    assert client.patch(
        f"/organizations/organizations/{organization_id}/members/{admin_id}/role",
        json={"role": "admin"}
    ).status_code == 200

    assignee_email = f"task-admin-assignee-{uuid4()}@example.com"
    assignee = client.post(
        "/auth/register",
        json={
            "name": "Task Admin Assignee",
            "email": assignee_email,
            "password": "password123"
        }
    )
    assert assignee.status_code == 200
    assignee_id = assignee.json()["id"]
    assert client.post(
        f"/organizations/organizations/{organization_id}/members",
        json={"user_id": assignee_id}
    ).status_code == 200

    assert client.post("/auth/logout").status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": admin_email, "password": "password123"}
    ).status_code == 200

    project = client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={
            "name": "Admin-created project",
            "organization_id": organization_id
        }
    )
    assert project.status_code == 200
    project_id = project.json()["id"]

    task = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id": project_id,
            "title": "Admin-created task",
            "status": "todo",
            "priority": "medium",
            "assignee_id": assignee_id
        }
    )
    assert task.status_code == 200
    task_id = task.json()["id"]

    assign = client.patch(
        f"/organizations/organizations/{organization_id}/projects/{project_id}/task/{task_id}/assignee",
        json={"user_id": admin_id}
    )
    assert assign.status_code == 200
    assert assign.json()["assignee_id"] == admin_id

    unassign = client.patch(
        f"/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/unassign"
    )
    assert unassign.status_code == 200
    assert unassign.json()["assignee_id"] is None

    update = client.put(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}",
        json={"title": "Admin-updated task"}
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Admin-updated task"

    delete = client.delete(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}"
    )
    assert delete.status_code == 200


def test_member_cannot_read_task_from_another_organization(client):
    first_email = f"first-org-{uuid4()}@example.com"
    first_user = client.post(
        "/auth/register",
        json={
            "name": "First Organization User",
            "email": first_email,
            "password": "password123"
        }
    )
    assert first_user.status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": first_email, "password": "password123"}
    ).status_code == 200
    first_org = client.post(
        "/organizations/create-organization",
        json={"name": "First Organization"}
    )
    assert first_org.status_code == 200

    assert client.post("/auth/logout").status_code == 200
    second_email = f"second-org-{uuid4()}@example.com"
    second_user = client.post(
        "/auth/register",
        json={
            "name": "Second Organization User",
            "email": second_email,
            "password": "password123"
        }
    )
    assert second_user.status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": second_email, "password": "password123"}
    ).status_code == 200

    second_org = client.post(
        "/organizations/create-organization",
        json={"name": "Second Organization"}
    )
    assert second_org.status_code == 200
    second_organization_id = second_org.json()["id"]
    project = client.post(
        f"/projects/organizations/{second_organization_id}/projects",
        json={
            "name": "Private Project",
            "organization_id": second_organization_id
        }
    )
    assert project.status_code == 200
    project_id = project.json()["id"]
    task = client.post(
        f"/tasks/organizations/{second_organization_id}/projects/{project_id}/tasks",
        json={
            "project_id": project_id,
            "title": "Private Task",
            "status": "todo",
            "priority": "medium"
        }
    )
    assert task.status_code == 200

    assert client.post("/auth/logout").status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": first_email, "password": "password123"}
    ).status_code == 200

    response = client.get(
        f"/tasks/organizations/{first_org.json()['id']}/projects/{project_id}/tasks/{task.json()['id']}"
    )
    assert response.status_code == 404


def test_my_tasks_returns_empty_list_when_user_has_no_assigned_tasks(client):
    email = f"no-tasks-{uuid4()}@example.com"
    registration = client.post(
        "/auth/register",
        json={
            "name": "User Without Tasks",
            "email": email,
            "password": "password123"
        }
    )
    assert registration.status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": email, "password": "password123"}
    ).status_code == 200
    organization = client.post(
        "/organizations/create-organization",
        json={"name": "Organization Without Assigned Tasks"}
    )
    assert organization.status_code == 200

    response = client.get(
        f"/organizations/organizations/{organization.json()['id']}/my_tasks"
    )
    assert response.status_code == 200
    assert response.json() == []
