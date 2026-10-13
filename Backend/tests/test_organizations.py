from uuid import uuid4


# ------- Test - Create Organization -------
def test_organization_create(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )
    response = client.post(
        "/organizations/create-organization",
        json={
            "name": "Test Organization"
        }
        ) 
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Organization"

def test_organization_creator_is_owner(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )

    response = client.post(
        "/organizations/create-organization",
        json={"name": "Owner Test Org"}
    )

    assert response.status_code == 200

    organization_id = response.json()["id"]

    # Next we'll verify the membership in the database.

# ---------- Test org without login -------
def test_without_login(client):
    response = client.post(
        "/organizations/create-organization",
        json={
            "name":"Unauth Org"
        }
    )
    assert response.status_code == 401

# ----------- GET organization -----------
def test_get_org(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )

    client.post(
        "/organizations/create-organization",
        json={
            "name" : "Test Organization"
        }
    )

    response = client.get("/organizations/organizations")

    assert response.status_code == 200

    data = response.json()
    # Below assertion checks if the returned data is not empty, indicating that organizations were retrieved successfully.
    assert len(data) > 0
# Below assertion checks if the name of the first organization in the returned data matches the expected name.
    assert data[0]["name"] == "Test Organization"


# ------------------- Test Specific Organization -----------------
def test_get_specific_org(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )

    create_response = client.post(
        "/organizations/create-organization",
        json={
            "name" : "Test Organization"
        }
    )
# Below Gets the organization ID from the create API response and stores it in organization_id.
    organization_id = create_response.json()["id"]

    response = client.get(
        f"/organizations/organizations/{organization_id}"
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Test Organization"

# ------------------- Test Specific Organization Without Login -------------------
def test_get_specific_org_without_login(client):

    response = client.get(
        f"/organizations/organizations/1"
    )

    assert response.status_code == 401

# --------------------- test get organization member ---------
def test_get_organization_members(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )
    create_response = client.post(
        "/organizations/create-organization",
        json={
            "name" : "Test Organization"
        }
    )
    organization_id = create_response.json()["id"]
    response = client.get(
        f"/organizations/organizations/{organization_id}/members"
    )

    assert response.status_code == 200


def test_get_organization_members_detail_includes_user_names(client):
    owner_email = f"member-details-owner-{uuid4()}@example.com"
    owner = client.post(
        "/auth/register",
        json={
            "name": "Member Details Owner",
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
        json={"name": "Member Details Organization"}
    )
    assert organization.status_code == 200
    organization_id = organization.json()["id"]

    member = client.post(
        "/auth/register",
        json={
            "name": "Named Dropdown Member",
            "email": f"named-member-{uuid4()}@example.com",
            "password": "password123"
        }
    )
    assert member.status_code == 200
    assert client.post(
        f"/organizations/organizations/{organization_id}/members",
        json={"user_id": member.json()["id"]}
    ).status_code == 200

    response = client.get(
        f"/organizations/organizations/{organization_id}/members/details"
    )

    assert response.status_code == 200
    named_member = next(
        row for row in response.json()
        if row["user_id"] == member.json()["id"]
    )
    assert named_member["user"]["name"] == "Named Dropdown Member"
    assert named_member["user"]["email"] == member.json()["email"]
    assert "password" not in named_member["user"]

# ----------- Test Add member -------------
# def test_add_member_to_org(client):
#     client.post(
#         "/auth/login",
#         json={
#             "email": "test@example.com",
#             "password": "password123"
#         }
#     )

#     create_response = client.post(
#         "/organizations/create-organization",
#         json={
#             "name": "Test Organization"
#         }
#     )

#     organization_id = create_response.json()["id"]

#     # Create a second user
#     user_response = client.post(
#         "/auth/register",
#         json={
#             "name": "Second User",
#             "email": "second3@example.com",
#             "password": "password123"
#         }
#     )

#     print(user_response.status_code)
#     print(user_response.json())

#     user_id = user_response.json()["id"]

#     # Add the second user to the organization
#     response = client.post(
#         f"/organizations/organizations/{organization_id}/members",
#         json={
#             "user_id": user_id,
#             "role": "member"
#         }
#     )

#     # Try adding the same user again
#     duplicate_response = client.post(
#         f"/organizations/organizations/{organization_id}/members",
#         json={
#             "user_id": user_id,
#             "role": "member"
#         }
#     )

#     assert duplicate_response.status_code == 409


# --------------- Remove member from organization ----------------
# def test_remove_member_from_org(client):
#     client.post(
#         "/auth/login",
#         json={
#             "email": "test@example.com",
#             "password": "password123"
#         }
#     )

#     create_response = client.post(
#         "/organizations/create-organization",
#         json={
#             "name": "Test Organization"
#         }
#     )

#     organization_id = create_response.json()["id"]

#     # Create a second user
#     user_response = client.post(
#         "/auth/register",
#         json={
#             "name": "Second User",
#             "email": "second3@example.com",
#             "password": "password123"
#         }
#     )
#     user_id = user_response.json()["id"]

#     response = client.delete(
#         "/organizations/organizations/{organization_id}/members/{user_id}"
#     )

#     assert response.status_code == 200


def test_owner_cannot_be_removed(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )

    create_response = client.post(
        "/organizations/create-organization",
        json={"name": "Owner Test Organization"}
    )

    organization_id = create_response.json()["id"]

    response = client.delete(
        f"/organizations/organizations/{organization_id}/members/1"
    )

    assert response.status_code == 403

    

def test_member_cannot_delete_organization(client):
    # Login as owner
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )

    # Create organization
    create_response = client.post(
        "/organizations/create-organization",
        json={"name": "RBAC Test Organization"}
    )

    organization_id = create_response.json()["id"]

    # Create another user
    client.post("/auth/logout")

    user_response = client.post(
        "/auth/register",
        json={
            "name": "RBAC Member",
            "email": "rbacmember@example.com",
            "password": "password123"
        }
    )

    # Login as the new user
    client.post(
        "/auth/login",
        json={
            "email": "rbacmember@example.com",
            "password": "password123"
        }
    )

    # Try to delete owner's organization
    response = client.delete(
        f"/organizations/organizations/{organization_id}"
    )

    assert response.status_code == 403


def test_organization_admin_member_lifecycle_and_ownership_transfer(client):
    owner_email = f"organization-owner-{uuid4()}@example.com"
    owner = client.post(
        "/auth/register",
        json={
            "name": "Organization Owner",
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
        json={"name": "Lifecycle Organization"}
    )
    assert organization.status_code == 200
    organization_id = organization.json()["id"]

    admin_email = f"organization-admin-{uuid4()}@example.com"
    admin = client.post(
        "/auth/register",
        json={
            "name": "Organization Admin",
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

    member_email = f"organization-member-{uuid4()}@example.com"
    member = client.post(
        "/auth/register",
        json={
            "name": "Organization Member",
            "email": member_email,
            "password": "password123"
        }
    )
    assert member.status_code == 200
    member_id = member.json()["id"]
    assert client.post(
        f"/organizations/organizations/{organization_id}/members",
        json={"user_id": member_id}
    ).status_code == 200

    assert client.post(
        "/auth/login",
        json={"email": admin_email, "password": "password123"}
    ).status_code == 200
    update_response = client.patch(
        f"/organizations/organizations/{organization_id}",
        json={"name": "Updated Lifecycle Organization"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated Lifecycle Organization"
    assert client.delete(
        f"/organizations/organizations/{organization_id}"
    ).status_code == 403
    assert client.patch(
        f"/organizations/organizations/{organization_id}/owner",
        json={"user_id": member_id}
    ).status_code == 403

    assert client.post(
        "/auth/login",
        json={"email": member_email, "password": "password123"}
    ).status_code == 200
    assert client.patch(
        f"/organizations/organizations/{organization_id}",
        json={"name": "Member edit"}
    ).status_code == 403
    assert client.delete(
        f"/organizations/organizations/{organization_id}/leave"
    ).status_code == 200
    assert client.get(
        f"/organizations/organizations/{organization_id}/membership"
    ).status_code == 403

    assert client.post(
        "/auth/login",
        json={"email": owner_email, "password": "password123"}
    ).status_code == 200
    assert client.patch(
        f"/organizations/organizations/{organization_id}/owner",
        json={"user_id": admin_id}
    ).status_code == 200
    old_owner_membership = client.get(
        f"/organizations/organizations/{organization_id}/membership"
    )
    assert old_owner_membership.status_code == 200
    assert old_owner_membership.json()["role"] == "admin"
    assert client.delete(
        f"/organizations/organizations/{organization_id}"
    ).status_code == 403

    assert client.post(
        "/auth/login",
        json={"email": admin_email, "password": "password123"}
    ).status_code == 200
    new_owner_membership = client.get(
        f"/organizations/organizations/{organization_id}/membership"
    )
    assert new_owner_membership.status_code == 200
    assert new_owner_membership.json()["role"] == "owner"
    assert client.delete(
        f"/organizations/organizations/{organization_id}"
    ).status_code == 200