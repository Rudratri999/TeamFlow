from uuid import uuid4


def test_create_task(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password" : "password123"
        }
    )
    org_response = client.post(
        "/organizations/create-organization",
        json={
            "name": "Task Test Organization"
        }
    )
    organization_id = org_response.json()["id"]
    proj_response = client.post(
       f"/projects/organizations/{organization_id}/projects",
        json={
            "name" : "Test Project2",
            "description": "Test Project For Task",
            "organization_id": organization_id
        }
    )
    project_id = proj_response.json()["id"]
    response = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id" : project_id,
            "title" : "Test Task",
            "description" : "Test For Task",
            "status" : "todo",
            "priority" : "medium",
        }
    )
    assert response.status_code == 200

def test_create_task_without_login(client):
    response = client.post(
        "/tasks/organizations/1/projects/1/tasks",
        json={
            "project_id": 1,
            "title": "Unauthorized Task",
            "description": "Should fail",
            "status": "todo",
            "priority": "medium"
        }
    )

    assert response.status_code == 401

def test_get_project_tasks(client):
    email = f"project-tasks-{uuid4()}@example.com"
    registration_response = client.post(
        "/auth/register",
        json={
            "name": "Project Tasks User",
            "email": email,
            "password": "password123"
        }
    )
    assert registration_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "password123"
        }
    )
    assert login_response.status_code == 200

    organization_response = client.post(
        "/organizations/create-organization",
        json={"name": "Project Tasks Organization"}
    )
    assert organization_response.status_code == 200
    organization_id = organization_response.json()["id"]

    project_response = client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={
            "name": "Project Tasks Project",
            "description": "Project details task list regression test",
            "organization_id": organization_id
        }
    )
    assert project_response.status_code == 200
    project_id = project_response.json()["id"]

    task_response = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id": project_id,
            "title": "Visible project task",
            "description": "Task returned by the project details endpoint",
            "status": "todo",
            "priority": "medium"
        }
    )
    assert task_response.status_code == 200

    response = client.get(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks"
    )

    assert response.status_code == 200
    assert [task["title"] for task in response.json()] == ["Visible project task"]

def test_update_task(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password" : "password123"
        }
    )
    org_response = client.post(
        "/organizations/create-organization",
        json={
            "name": "Task Test Organization"
        }
    )
    organization_id = org_response.json()["id"]
    proj_response = client.post(
       f"/projects/organizations/{organization_id}/projects",
        json={
            "name" : "Test Project2",
            "description": "Test Project For Task",
            "organization_id": organization_id
        }
    )
    project_id = proj_response.json()["id"]
    task_response = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id" : project_id,
            "title" : "Test Task",
            "description" : "Test For Task",
            "status" : "todo",
            "priority" : "medium",
        }
    )
    task_id = task_response.json()["id"]
    response = client.put(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}",
        json={
            "task_id": task_id,
            "title" : "Test Task2",
            "status": "done"
        }
    )
    assert response.status_code == 200


def test_update_task_clears_assignee_when_null(client):
    email = f"clear-task-assignee-{uuid4()}@example.com"
    registration_response = client.post(
        "/auth/register",
        json={
            "name": "Clear Assignee User",
            "email": email,
            "password": "password123"
        }
    )
    assert registration_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "password123"
        }
    )
    assert login_response.status_code == 200

    organization_response = client.post(
        "/organizations/create-organization",
        json={"name": "Clear Assignee Organization"}
    )
    assert organization_response.status_code == 200
    organization_id = organization_response.json()["id"]
    user_id = registration_response.json()["id"]

    project_response = client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={
            "name": "Clear Assignee Project",
            "organization_id": organization_id
        }
    )
    assert project_response.status_code == 200
    project_id = project_response.json()["id"]

    task_response = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id": project_id,
            "title": "Assigned task",
            "status": "todo",
            "priority": "medium",
            "assignee_id": user_id
        }
    )
    assert task_response.status_code == 200
    task_id = task_response.json()["id"]

    response = client.put(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}",
        json={"assignee_id": None}
    )

    assert response.status_code == 200
    assert response.json()["assignee_id"] is None


def test_delete_task(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password" : "password123"
        }
    )
    org_response = client.post(
        "/organizations/create-organization",
        json={
            "name": "Task Test Organization"
        }
    )
    organization_id = org_response.json()["id"]
    proj_response = client.post(
       f"/projects/organizations/{organization_id}/projects",
        json={
            "name" : "Test Project2",
            "description": "Test Project For Task",
            "organization_id": organization_id
        }
    )
    project_id = proj_response.json()["id"]
    task_response = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id" : project_id,
            "title" : "Test Task",
            "description" : "Test For Task",
            "status" : "todo",
            "priority" : "medium",
        }
    )
    task_id = task_response.json()["id"]
    response = client.delete(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}",
    )
    assert response.status_code == 200

def test_update_task_without_login(client):
    response = client.put(
        "/tasks/organizations/1/projects/1/tasks/1",
        json={
            "title": "Unauthorized Update",
            "status": "done"
        }
    )

    assert response.status_code == 401


def test_assign_and_unassign_task(client):
    email = f"task-assignment-{uuid4()}@example.com"
    registration_response = client.post(
        "/auth/register",
        json={
            "name": "Task Assignment User",
            "email": email,
            "password": "password123"
        }
    )
    assert registration_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "password123"
        }
    )
    assert login_response.status_code == 200

    profile_response = client.get("/auth/profile")
    user_id = profile_response.json()["id"]
    organization_response = client.post(
        "/organizations/create-organization",
        json={"name": f"Assignment Organization {uuid4()}"}
    )
    organization_id = organization_response.json()["id"]

    project_response = client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={
            "name": "Assignment Project",
            "description": "Project for assignment test",
            "organization_id": organization_id
        }
    )
    project_id = project_response.json()["id"]

    task_response = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id": project_id,
            "title": "Assignment Test Task",
            "status": "todo",
            "priority": "medium"
        }
    )
    task_id = task_response.json()["id"]

    assign_response = client.patch(
        f"/organizations/organizations/{organization_id}/projects/{project_id}/task/{task_id}/assignee",
        json={"user_id": user_id}
    )
    assert assign_response.status_code == 200
    assert assign_response.json()["assignee_id"] == user_id

    unassign_response = client.patch(
        f"/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/unassign"
    )
    assert unassign_response.status_code == 200
    assert unassign_response.json()["assignee_id"] is None


def test_task_status_and_priority_updates_broadcast_websocket_events(client):
    email = f"task-websocket-{uuid4()}@example.com"
    registration = client.post(
        "/auth/register",
        json={
            "name": "Task WebSocket User",
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
        json={"name": f"WebSocket Organization {uuid4()}"}
    )
    assert organization.status_code == 200
    organization_id = organization.json()["id"]
    project = client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={"name": "WebSocket Project", "organization_id": organization_id}
    )
    assert project.status_code == 200
    project_id = project.json()["id"]
    task = client.post(
        f"/tasks/organizations/{organization_id}/projects/{project_id}/tasks",
        json={
            "project_id": project_id,
            "title": "WebSocket Task",
            "status": "todo",
            "priority": "medium"
        }
    )
    assert task.status_code == 200
    task_id = task.json()["id"]

    with client.websocket_connect(f"/ws/{organization_id}") as websocket:
        status_response = client.patch(
            f"/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/status",
            json={"status": "in_progress"}
        )
        assert status_response.status_code == 200
        status_event = websocket.receive_json()
        assert status_event["event"] == "Task Updated"
        assert status_event["data"]["id"] == task_id
        assert status_event["data"]["status"] == "in_progress"

        priority_response = client.patch(
            f"/organizations/organizations/{organization_id}/projects/{project_id}/tasks/{task_id}/priority",
            json={"priority": "high"}
        )
        assert priority_response.status_code == 200
        priority_event = websocket.receive_json()
        assert priority_event["event"] == "Task Updated"
        assert priority_event["data"]["priority"] == "high"