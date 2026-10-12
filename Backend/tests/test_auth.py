from uuid import uuid4


def test_register_user(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"

def test_register_duplicate_email(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "Test User",
            "email":"test@example.com",
            "password":"password123"
        }
    )
    response = client.post(
        "/auth/register",
        json={
            "name": "Test User2",
            "email":"test@example.com",
            "password":"password456"
        }
    )
    assert response.status_code == 400

# Login Test
def test_login(client):
    response = client.post(
        "/auth/login",
        json=
        {
           
            "email" : "test@example.com",
            "password" : "password123"
        }
    )
    assert response.status_code == 200
    assert "access_token" in client.cookies
    assert "refresh_token" in client.cookies
    assert "access_token" not in response.json()
    assert "HttpOnly" in response.headers.get("set-cookie", "")

def test_login_invalid_password(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword"
        }
    )

    assert response.status_code == 401

# Test without login
def test_get_current_user(client):
    response = client.get("/auth/profile")

    assert response.status_code == 401

# Test with login
def test_get_current_user_with_login(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
                  )

    response = client.get("/auth/profile")

    assert response.status_code == 200

# test Refresh token
def test_refresh_token(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )

# Save the current access_tokenbefore refreshing
    old_access_token = client.cookies.get("access_token")
    # Call the refresh endpoint to get new access token
    response = client.post("/auth/refresh")

# check if refresh endpoint return 200 
    assert response.status_code == 200
# then get the new access token from the cooikes
    new_access_token = client.cookies.get("access_token")

    assert new_access_token is not None

# -----Logout Test------
def test_logout(client):
    client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )

    response = client.post("/auth/logout")
    assert response.status_code == 200
# token gets deleted from cookies after successful logout
    assert "access_token" not in client.cookies
    assert "refresh_token" not in client.cookies


def test_refresh_token_cannot_access_protected_route(client):
    email = f"refresh-token-{uuid4()}@example.com"
    registration = client.post(
        "/auth/register",
        json={
            "name": "Refresh Token User",
            "email": email,
            "password": "password123"
        }
    )
    assert registration.status_code == 200

    login = client.post(
        "/auth/login",
        json={"email": email, "password": "password123"}
    )
    assert login.status_code == 200
    assert client.get("/auth/profile").json()["id"] == registration.json()["id"]

    refresh_token = client.cookies.get("refresh_token")
    client.cookies.set("access_token", refresh_token)
    assert client.get("/auth/profile").status_code == 401


def test_refresh_without_cookie_returns_unauthorized(client):
    assert client.post("/auth/refresh").status_code == 401