import hashlib
import os
import json
import secrets
from typing import Optional, Dict
from pydantic import BaseModel, EmailStr

USERS_DB_FILE = os.path.join(os.path.dirname(__file__), "users.json")

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str

class AuthResponse(BaseModel):
    token: str
    user: UserProfile
    message: str

def _hash_password(password: str, salt: str = "decision_mirror_salt") -> str:
    return hashlib.sha256(f"{password}:{salt}".encode()).hexdigest()

def _load_users() -> Dict[str, dict]:
    if os.path.exists(USERS_DB_FILE):
        try:
            with open(USERS_DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Default initial users
    default_users = {
        "demo@decisionmirror.ai": {
            "id": "usr_demo_01",
            "name": "Demo Explorer",
            "email": "demo@decisionmirror.ai",
            "password_hash": _hash_password("demo1234"),
            "created_at": "2026-10-04T00:00:00Z"
        }
    }
    _save_users(default_users)
    return default_users

def _save_users(users: Dict[str, dict]):
    try:
        with open(USERS_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Failed to save users: {e}")

# In-memory active tokens map: token -> email
ACTIVE_SESSIONS: Dict[str, str] = {}

def register_user(data: UserRegister) -> AuthResponse:
    email_clean = data.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise ValueError("Invalid email address format.")
    if len(data.password) < 4:
        raise ValueError("Password must be at least 4 characters long.")

    users = _load_users()
    if email_clean in users:
        raise ValueError("An account with this email already exists.")

    user_id = f"usr_{secrets.token_hex(4)}"
    new_user = {
        "id": user_id,
        "name": data.name.strip() or "Anonymous User",
        "email": email_clean,
        "password_hash": _hash_password(data.password),
        "created_at": "2026-10-04T00:00:00Z"
    }

    users[email_clean] = new_user
    _save_users(users)

    token = f"dm_tok_{secrets.token_urlsafe(32)}"
    ACTIVE_SESSIONS[token] = email_clean

    return AuthResponse(
        token=token,
        user=UserProfile(id=user_id, name=new_user["name"], email=email_clean),
        message="Registration successful"
    )

def login_user(data: UserLogin) -> AuthResponse:
    email_clean = data.email.strip().lower()
    users = _load_users()

    if email_clean not in users:
        raise ValueError("Invalid email or password.")

    user = users[email_clean]
    if user["password_hash"] != _hash_password(data.password):
        raise ValueError("Invalid email or password.")

    token = f"dm_tok_{secrets.token_urlsafe(32)}"
    ACTIVE_SESSIONS[token] = email_clean

    return AuthResponse(
        token=token,
        user=UserProfile(id=user["id"], name=user["name"], email=email_clean),
        message="Login successful"
    )

def get_current_user_from_token(token: str) -> Optional[UserProfile]:
    if not token or token not in ACTIVE_SESSIONS:
        return None
    email = ACTIVE_SESSIONS[token]
    users = _load_users()
    if email not in users:
        return None
    user = users[email]
    return UserProfile(id=user["id"], name=user["name"], email=email)
