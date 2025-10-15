import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# UserCreate schema is not directly used, json payloads are dicts
from app.db.models import User  # To verify DB state
from app.config import get_settings

settings = get_settings()
API_PREFIX = settings.API_PREFIX


@pytest.mark.asyncio
async def test_register_new_user_success(test_client: AsyncClient, db_session: AsyncSession):
    """Test successful user registration."""
    user_data = {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "strongpassword123",
    }
    response = await test_client.post(f"{API_PREFIX}/auth/register", json=user_data)

    assert response.status_code == 200  # Or 201 if you prefer for creation
    response_data = response.json()
    assert response_data["email"] == user_data["email"]
    assert response_data["username"] == user_data["username"]
    assert "id" in response_data
    assert "created_at" in response_data
    assert "updated_at" in response_data

    # Verify user in database
    stmt = select(User).where(User.email == user_data["email"])
    result = await db_session.execute(stmt)
    db_user = result.scalar_one_or_none()
    assert db_user is not None
    assert db_user.username == user_data["username"]


@pytest.mark.asyncio
async def test_register_user_email_exists(test_client: AsyncClient, db_session: AsyncSession):
    """Test registration fails if email already exists."""
    # First, create a user
    existing_user_data = {
        "email": "existing@example.com",
        "username": "existinguser",
        "password": "password123",
    }
    await test_client.post(f"{API_PREFIX}/auth/register", json=existing_user_data)

    # Attempt to register with the same email
    new_user_data = {
        "email": "existing@example.com",
        "username": "newuser",
        "password": "newpassword456",
    }
    response = await test_client.post(f"{API_PREFIX}/auth/register", json=new_user_data)

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


@pytest.mark.asyncio
async def test_register_user_username_exists(test_client: AsyncClient, db_session: AsyncSession):
    """Test registration fails if username already exists."""
    # First, create a user
    existing_user_data = {
        "email": "another@example.com",
        "username": "existingusername",
        "password": "password123",
    }
    await test_client.post(f"{API_PREFIX}/auth/register", json=existing_user_data)

    # Attempt to register with the same username
    new_user_data = {
        "email": "newemail@example.com",
        "username": "existingusername",
        "password": "newpassword456",
    }
    response = await test_client.post(f"{API_PREFIX}/auth/register", json=new_user_data)

    assert response.status_code == 400
    assert response.json()["detail"] == "Username already taken"


@pytest.mark.asyncio
async def test_login_success(test_client: AsyncClient, db_session: AsyncSession):
    """Test successful user login."""
    user_data = {
        "email": "loginuser@example.com",
        "username": "loginuser",
        "password": "strongpassword123",
    }
    # Register user first
    await test_client.post(f"{API_PREFIX}/auth/register", json=user_data)

    login_payload = {"email": user_data["email"], "password": user_data["password"]}
    response = await test_client.post(f"{API_PREFIX}/auth/login", json=login_payload)

    assert response.status_code == 200
    response_data = response.json()
    assert "access_token" in response_data
    assert response_data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_incorrect_password(test_client: AsyncClient, db_session: AsyncSession):
    """Test login fails with incorrect password."""
    user_data = {
        "email": "loginfail@example.com",
        "username": "loginfailuser",
        "password": "correctpassword",
    }
    await test_client.post(f"{API_PREFIX}/auth/register", json=user_data)

    login_payload = {"email": user_data["email"], "password": "wrongpassword"}
    response = await test_client.post(f"{API_PREFIX}/auth/login", json=login_payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_login_user_not_found(test_client: AsyncClient):
    """Test login fails if user does not exist."""
    login_payload = {"email": "nonexistent@example.com", "password": "anypassword"}
    response = await test_client.post(f"{API_PREFIX}/auth/login", json=login_payload)

    assert (
        response.status_code == 401
    )  # Or 404, depending on desired behavior for non-existent user
    assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_me_endpoint_returns_user(test_client: AsyncClient):
    # Register and login
    user_data = {
        "email": "meuser@example.com",
        "username": "meuser",
        "password": "strongpassword123",
    }
    await test_client.post(f"{API_PREFIX}/auth/register", json=user_data)
    login_payload = {"email": user_data["email"], "password": user_data["password"]}
    login_resp = await test_client.post(f"{API_PREFIX}/auth/login", json=login_payload)
    token = login_resp.json()["access_token"]

    resp = await test_client.get(f"{API_PREFIX}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == user_data["email"]
    assert data["username"] == user_data["username"]


@pytest.mark.asyncio
async def test_password_reset_flow(test_client: AsyncClient, db_session: AsyncSession):
    # Register
    user_data = {
        "email": "resetme@example.com",
        "username": "resetme",
        "password": "oldpassword",
    }
    await test_client.post(f"{API_PREFIX}/auth/register", json=user_data)

    # Request reset via query param (EmailStr as query parameter)
    req_resp = await test_client.post(
        f"{API_PREFIX}/auth/request-password-reset", params={"email": user_data["email"]}
    )
    assert req_resp.status_code == 200

    # Fetch token from DB
    result = await db_session.execute(select(User).where(User.email == user_data["email"]))
    user = result.scalar_one()
    assert user.reset_token is not None

    # Reset password via query params
    new_password = "newpassword123"
    reset_resp = await test_client.post(
        f"{API_PREFIX}/auth/reset-password",
        params={"token": user.reset_token, "new_password": new_password},
    )
    assert reset_resp.status_code == 200

    # Login with the new password
    login_payload = {"email": user_data["email"], "password": new_password}
    login_resp = await test_client.post(f"{API_PREFIX}/auth/login", json=login_payload)
    assert login_resp.status_code == 200
