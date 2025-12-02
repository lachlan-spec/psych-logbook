"""
Authentication Azure Function
Handles all /api/auth/* endpoints
"""

import azure.functions as func
import json
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
import aiohttp
import asyncio

from shared_code.database import get_database
from shared_code.auth import hash_password, verify_password

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Handle all auth routes: /api/auth/*
    Routes: login, signup, session, complete-signup, me, logout
    """
    route = req.route_params.get('route', '')
    method = req.method
    
    logger.info(f'{method} /api/auth/{route}')
    
    try:
        # Get database connection
        db = get_database()
        
        # Route to handlers
        if route == 'login' and method == 'POST':
            return handle_login(req, db)
        elif route == 'signup' and method == 'POST':
            return handle_signup(req, db)
        elif route == 'session' and method == 'POST':
            return handle_session(req, db)
        elif route == 'complete-signup' and method == 'POST':
            return handle_complete_signup(req, db)
        elif route == 'me' and method == 'GET':
            return handle_get_me(req, db)
        elif route == 'logout' and method == 'POST':
            return handle_logout(req, db)
        else:
            return func.HttpResponse(
                json.dumps({"error": f"Route not found: {method} /api/auth/{route}"}),
                status_code=404,
                mimetype="application/json"
            )
            
    except Exception as e:
        logger.error(f"Error in auth function: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            mimetype="application/json"
        )


def handle_login(req: func.HttpRequest, db) -> func.HttpResponse:
    """Handle POST /api/auth/login"""
    try:
        body = req.get_json()
        email = body.get('email')
        password = body.get('password')
        
        if not email or not password:
            return func.HttpResponse(
                json.dumps({"detail": "Email and password required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Find user
        user_doc = db.users.find_one({"email": email}, {"_id": 0})
        if not user_doc:
            return func.HttpResponse(
                json.dumps({"detail": "Invalid credentials"}),
                status_code=401,
                mimetype="application/json"
            )
        
        # Check if user has password field
        if "password" not in user_doc:
            return func.HttpResponse(
                json.dumps({"detail": "Please use Google login for this account"}),
                status_code=401,
                mimetype="application/json"
            )
        
        # Verify password
        if not verify_password(password, user_doc["password"]):
            return func.HttpResponse(
                json.dumps({"detail": "Invalid credentials"}),
                status_code=401,
                mimetype="application/json"
            )
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        user_session = {
            "user_id": user_doc["id"],
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.user_sessions.insert_one(user_session)
        
        # Remove password from response
        user_doc.pop("password", None)
        
        # Create response with cookie
        response = func.HttpResponse(
            json.dumps({"user": user_doc, "session_token": session_token}),
            status_code=200,
            mimetype="application/json"
        )
        
        # Set cookie
        response.headers['Set-Cookie'] = (
            f'session_token={session_token}; '
            f'HttpOnly; Secure; SameSite=None; '
            f'Max-Age={7 * 24 * 60 * 60}; Path=/'
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"detail": "Login failed"}),
            status_code=500,
            mimetype="application/json"
        )


def handle_signup(req: func.HttpRequest, db) -> func.HttpResponse:
    """Handle POST /api/auth/signup"""
    try:
        body = req.get_json()
        email = body.get('email')
        password = body.get('password')
        name = body.get('name')
        role = body.get('role')
        
        if not email or not password or not name or not role:
            return func.HttpResponse(
                json.dumps({"detail": "Email, password, name, and role are required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        if role not in ["psychologist", "supervisor"]:
            return func.HttpResponse(
                json.dumps({"detail": "Role must be 'psychologist' or 'supervisor'"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Check if user already exists
        existing_user = db.users.find_one({"email": email}, {"_id": 0})
        if existing_user:
            return func.HttpResponse(
                json.dumps({"detail": "Email already registered"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = hash_password(password)
        
        new_user = {
            "id": user_id,
            "email": email,
            "name": name,
            "role": role,
            "password": hashed_password,
            "picture": f"https://api.dicebear.com/7.x/avataaars/svg?seed={name.replace(' ', '')}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.users.insert_one(new_user)
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        user_session = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.user_sessions.insert_one(user_session)
        
        # Return user without password
        new_user.pop("password", None)
        
        # Create response with cookie
        response = func.HttpResponse(
            json.dumps({"user": new_user, "session_token": session_token}),
            status_code=200,
            mimetype="application/json"
        )
        
        # Set cookie
        response.headers['Set-Cookie'] = (
            f'session_token={session_token}; '
            f'HttpOnly; Secure; SameSite=None; '
            f'Max-Age={7 * 24 * 60 * 60}; Path=/'
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"detail": "Signup failed"}),
            status_code=500,
            mimetype="application/json"
        )


def handle_session(req: func.HttpRequest, db) -> func.HttpResponse:
    """Handle POST /api/auth/session - OAuth session exchange"""
    try:
        body = req.get_json()
        session_id = body.get('session_id')
        
        if not session_id:
            return func.HttpResponse(
                json.dumps({"detail": "session_id is required"}),
                status_code=422,
                mimetype="application/json"
            )
        
        logger.info(f"Exchanging session_id: {session_id[:20]}...")
        
        # Call OAuth service (synchronously for Azure Functions)
        import requests
        import os
        
        oauth_url = os.environ.get("OAUTH_SERVICE_URL", "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data")
        
        try:
            resp = requests.get(
                oauth_url,
                headers={"X-Session-ID": session_id},
                timeout=10
            )
            
            if resp.status_code != 200:
                logger.error(f"OAuth service error: {resp.status_code} - {resp.text}")
                return func.HttpResponse(
                    json.dumps({"detail": "Could not verify OAuth session. Please try signing in again."}),
                    status_code=400,
                    mimetype="application/json"
                )
            
            data = resp.json()
            
            # Validate required fields
            if not data.get("email") or not data.get("session_token"):
                logger.error(f"Missing required fields in OAuth response")
                return func.HttpResponse(
                    json.dumps({"detail": "Invalid OAuth data"}),
                    status_code=500,
                    mimetype="application/json"
                )
                
        except requests.RequestException as e:
            logger.error(f"OAuth service connection error: {str(e)}")
            return func.HttpResponse(
                json.dumps({"detail": "Unable to connect to authentication service"}),
                status_code=500,
                mimetype="application/json"
            )
        
        # Check if user exists
        existing_user = db.users.find_one({"email": data["email"]}, {"_id": 0})
        
        if not existing_user:
            # New user - need role selection
            logger.info(f"New OAuth user: {data['email']}")
            return func.HttpResponse(
                json.dumps({
                    "needs_role": True,
                    "user_data": {
                        "email": data["email"],
                        "name": data.get("name", ""),
                        "picture": data.get("picture")
                    },
                    "session_token": data["session_token"]
                }),
                status_code=200,
                mimetype="application/json"
            )
        
        # Existing user - create session
        logger.info(f"Existing OAuth user: {existing_user['email']}")
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        user_session = {
            "user_id": existing_user["id"],
            "session_token": data["session_token"],
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.user_sessions.insert_one(user_session)
        
        # Create response with cookie
        response = func.HttpResponse(
            json.dumps({
                "needs_role": False,
                "user": existing_user
            }),
            status_code=200,
            mimetype="application/json"
        )
        
        # Set cookie
        response.headers['Set-Cookie'] = (
            f'session_token={data["session_token"]}; '
            f'HttpOnly; Secure; SameSite=None; '
            f'Max-Age={7 * 24 * 60 * 60}; Path=/'
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Session creation error: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"detail": "Authentication error"}),
            status_code=500,
            mimetype="application/json"
        )


def handle_complete_signup(req: func.HttpRequest, db) -> func.HttpResponse:
    """Handle POST /api/auth/complete-signup"""
    try:
        body = req.get_json()
        
        # Create new user
        user_id = str(uuid.uuid4())
        new_user = {
            "id": user_id,
            "email": body["email"],
            "name": body["name"],
            "picture": body.get("picture"),
            "role": body["role"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.users.insert_one(new_user)
        
        # Create session
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        user_session = {
            "user_id": user_id,
            "session_token": body["session_token"],
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        db.user_sessions.insert_one(user_session)
        
        # Create response with cookie
        response = func.HttpResponse(
            json.dumps({"user": new_user}),
            status_code=200,
            mimetype="application/json"
        )
        
        # Set cookie
        response.headers['Set-Cookie'] = (
            f'session_token={body["session_token"]}; '
            f'HttpOnly; Secure; SameSite=None; '
            f'Max-Age={7 * 24 * 60 * 60}; Path=/'
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Complete signup error: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"detail": "Signup completion failed"}),
            status_code=500,
            mimetype="application/json"
        )


def handle_get_me(req: func.HttpRequest, db) -> func.HttpResponse:
    """Handle GET /api/auth/me"""
    try:
        # Get session token from cookie or Authorization header
        session_token = None
        
        # Check cookie
        cookies = req.headers.get('Cookie', '')
        for cookie in cookies.split('; '):
            if cookie.startswith('session_token='):
                session_token = cookie.split('=', 1)[1]
                break
        
        # Check Authorization header
        if not session_token:
            auth_header = req.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                session_token = auth_header[7:]
        
        if not session_token:
            return func.HttpResponse(
                json.dumps({"detail": "Not authenticated"}),
                status_code=401,
                mimetype="application/json"
            )
        
        # Find session
        session = db.user_sessions.find_one({"session_token": session_token})
        if not session:
            return func.HttpResponse(
                json.dumps({"detail": "Invalid session"}),
                status_code=401,
                mimetype="application/json"
            )
        
        # Check expiry
        expires_at = datetime.fromisoformat(session["expires_at"])
        if expires_at < datetime.now(timezone.utc):
            db.user_sessions.delete_one({"session_token": session_token})
            return func.HttpResponse(
                json.dumps({"detail": "Session expired"}),
                status_code=401,
                mimetype="application/json"
            )
        
        # Get user
        user_doc = db.users.find_one({"id": session["user_id"]}, {"_id": 0})
        if not user_doc:
            return func.HttpResponse(
                json.dumps({"detail": "User not found"}),
                status_code=404,
                mimetype="application/json"
            )
        
        # Remove password from response
        user_doc.pop("password", None)
        
        return func.HttpResponse(
            json.dumps(user_doc),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logger.error(f"Get me error: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"detail": "Failed to get user"}),
            status_code=500,
            mimetype="application/json"
        )


def handle_logout(req: func.HttpRequest, db) -> func.HttpResponse:
    """Handle POST /api/auth/logout"""
    try:
        # Get session token from cookie
        session_token = None
        cookies = req.headers.get('Cookie', '')
        for cookie in cookies.split('; '):
            if cookie.startswith('session_token='):
                session_token = cookie.split('=', 1)[1]
                break
        
        if session_token:
            db.user_sessions.delete_one({"session_token": session_token})
        
        # Create response with deleted cookie
        response = func.HttpResponse(
            json.dumps({"message": "Logged out successfully"}),
            status_code=200,
            mimetype="application/json"
        )
        
        # Delete cookie
        response.headers['Set-Cookie'] = (
            'session_token=; '
            'HttpOnly; Secure; SameSite=None; '
            'Max-Age=0; Path=/'
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"message": "Logout completed"}),
            status_code=200,
            mimetype="application/json"
        )
