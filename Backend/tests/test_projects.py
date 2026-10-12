def test_create_project(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )
    org_response = client.post(
        "/organizations/create-organization",
        json={"name": "Project Test Organization"}
    )
    print(org_response.status_code)
    print(org_response.json())
    organization_id = org_response.json()["id"]
    response = client.post(
        f"/projects/organizations/{organization_id}/projects",
        json={
            "name": "Test Project",
            "description": "Project for testing",
            "organization_id": organization_id
        }
    )
    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test Project"
    assert data["organization_id"] == organization_id

def test_create_project_without_login(client):
    response = client.post(
        "/projects/organizations/1/projects",
        json={
            "name": "Unauthorized Project",
            "description": "Should fail",
            "organization_id": 1
        }
    )

    assert response.status_code == 401