from fastapi import FastAPI, APIRouter, Depends, HTTPException, Response, Cookie, Header, status
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlparse
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import aiohttp
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

ROOT_DIR = Path(__file__).parent

# Logging setup first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env only if not in production (production sets env vars directly)
if not os.environ.get('MONGO_URL'):
    load_dotenv(ROOT_DIR / '.env')
    logger.info("Loaded .env file for local development")
else:
    logger.info("Using production environment variables")

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# FIXED: Use environment variable for database name (Emergent manages this)
db_name = os.environ.get('DB_NAME', 'psychology_portal')
logger.info(f"=" * 80)
logger.info(f"✅ DATABASE CONFIGURATION")
logger.info(f"  Database name: {db_name} (from environment)")
logger.info(f"  Connection: {'MongoDB Atlas' if 'mongodb.net' in mongo_url or 'mongodb+srv' in mongo_url else 'Local MongoDB'}")
logger.info(f"=" * 80)

try:
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    logger.info(f"=" * 80)
    logger.info(f"✅ FINAL DATABASE CONFIGURATION")
    logger.info(f"  Database name: {db_name}")
    logger.info(f"  Connection: {'MongoDB Atlas' if 'mongodb.net' in mongo_url or 'mongodb+srv' in mongo_url else 'Local MongoDB'}")
    logger.info(f"=" * 80)
    
    # Create hardcoded admin users (graceful failure if permissions are limited)
    async def create_admin_users():
        """Create hardcoded admin users for single-user system - graceful failure"""
        try:
            # Check if admin user exists
            admin_exists = await db.users.find_one({"email": "admin"})
            if not admin_exists:
                import uuid
                admin_user = {
                    "id": str(uuid.uuid4()),
                    "email": "admin",
                    "name": "Administrator",
                    "role": "psychologist",
                    "password": hash_password("admin"),
                    "picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=Administrator",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(admin_user)
                logger.info("✅ Created admin user: username=admin, password=admin")
            else:
                logger.info("✅ Admin user already exists")
            
            logger.info("✅ Simple login ready: admin/admin")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not create admin users (database permissions limited): {str(e)}")
            logger.info("💡 Admin users may need to be created manually or through signup process")
            logger.info("💡 This is normal for managed MongoDB deployments with restricted permissions")
    
    # Schedule admin user creation for after startup
    import asyncio
    asyncio.create_task(create_admin_users())
except Exception as e:
    logger.error(f"Failed to create MongoDB client: {e}")
    # Don't crash the server, let it start and fail on first request
    client = None
    db = None

app = FastAPI()
api_router = APIRouter(prefix="/api")

# =========================
# MODELS
# =========================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: str  # "psychologist" or "supervisor"
    password: Optional[str] = None  # Only for email/password auth users
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Connection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    psychologist_id: str
    supervisor_id: str
    status: str  # "pending", "accepted", "rejected"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LogbookYear(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    year: str
    start_date: str
    end_date: str
    target_direct_client: float = 0.0
    target_supervision_individual: float = 0.0
    target_supervision_group: float = 0.0
    target_peer_consultation: float = 0.0
    target_cpd: float = 0.0
    target_other: float = 0.0
    # Legacy field for backwards compatibility
    target_supervision: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LogbookEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    logbook_id: str
    date: str
    duration: float
    activity_type: str
    notes: str
    reflections: Optional[str] = ""
    supervisor_comment: Optional[str] = ""
    supervisor_comment_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LogbookSignature(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logbook_id: str
    signature_data: str
    week_start: str  # ISO date of Monday
    signed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CPDYear(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    year: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    cpd_hours_required: int = 30
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CPDActivity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    year_id: str
    activity_type: str
    hours: float
    description: str
    reflection: Optional[str] = ""
    date: str
    tags: Optional[List[str]] = []  # CPD tags for tracking competency areas (e.g., cultural_competence, trauma_informed)
    linked_goal_id: Optional[str] = None
    supervisor_comment: Optional[str] = ""
    supervisor_comment_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CPDGoal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    goal: str
    what_to_learn: str
    expected_outcomes: str
    target_date: Optional[str] = ""
    status: str = "active"  # "active", "completed"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CPDPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    year_id: str
    start_date: str  # Dec 1
    end_date: str    # Nov 30
    goals: List[CPDGoal] = []
    is_finished: bool = False
    supervisor_comments: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PeerConsultation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    year_id: str
    date: str
    minutes_spent: float
    activity_description: str
    linked_goal_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CompetencyJournal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    competency_id: str  # "0" to "5"
    entry: str
    date: str
    supervisor_comment: Optional[str] = ""
    supervisor_comment_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    content: str
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    type: str
    read: bool = False
    path: Optional[str] = "/"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# =========================
# AUTH DEPENDENCIES
# =========================

async def get_current_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Get current user from session_token cookie or Authorization header"""
    token = session_token
    
    # Fallback to Authorization header
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

# =========================
# AUTH ENDPOINTS
# =========================

# Password hashing
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

@api_router.post("/auth/login")
async def login_email_password(credentials: dict, response: Response):
    """Simple login with username and password"""
    username = credentials.get("email")  # Frontend sends as 'email' but we treat as username
    password = credentials.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    # Find user by email field (which contains username for our simple system)
    user_doc = await db.users.find_one({"email": username}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    import secrets
    session_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        user_id=user_doc["id"],
        session_token=session_token,
        expires_at=expires_at.isoformat()
    )
    
    await db.user_sessions.insert_one(user_session.model_dump())
    
    # Remove password from response
    user_doc.pop("password", None)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=True,
        secure=True,
        samesite="none"
    )
    
    logger.info(f"✅ User logged in: {user_doc['name']} ({user_doc['role']})")
    return {"user": user_doc, "session_token": session_token}


# FALLBACK SIGNUP: Enable if admin user auto-creation fails due to DB permissions
@api_router.post("/auth/signup")
async def signup_fallback(signup_data: dict, response: Response):
    """Fallback signup for creating admin user if auto-creation failed"""
    email = signup_data.get("email")
    password = signup_data.get("password") 
    name = signup_data.get("name")
    role = signup_data.get("role")
    
    # Only allow specific admin accounts
    if email not in ["admin", "supervisor"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin and supervisor accounts allowed. Use admin/admin to login if account exists."
        )
    
    if not password or len(password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
    
    if role not in ["psychologist", "supervisor"]:
        raise HTTPException(status_code=400, detail="Role must be 'psychologist' or 'supervisor'")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists. Try logging in instead.")
    
    # Create user
    import uuid
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "email": email,
        "name": name or ("Administrator" if email == "admin" else "Supervisor"),
        "role": "psychologist" if email == "admin" else role,
        "password": hash_password(password),
        "picture": f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(new_user)
    
    # Create session
    import secrets
    session_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_sessions.insert_one(user_session)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none"
    )
    
    # Return user without password
    new_user.pop("password", None)
    logger.info(f"✅ Fallback signup successful: {email}")
    
    return {"user": new_user, "session_token": session_token}
    
# SIMPLIFIED SYSTEM: OAUTH DISABLED - Session endpoint not needed
@api_router.post("/auth/session")
async def session_disabled():
    """OAuth session disabled for single-user system"""
    raise HTTPException(
        status_code=403, 
        detail="OAuth disabled. Use admin@admin.com/admin123 or supervisor@supervisor.com/super123 to login."
    )


# SIMPLIFIED SYSTEM: COMPLETE-SIGNUP DISABLED - Not needed for hardcoded users
@api_router.post("/auth/complete-signup")
async def complete_signup_disabled():
    """Complete signup disabled for single-user system"""
    raise HTTPException(
        status_code=403, 
        detail="Complete signup disabled. Use admin@admin.com/admin123 or supervisor@supervisor.com/super123 to login."
    )


@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    user_dict = current_user.model_dump()
    user_dict.pop("password", None)  # Remove password from response
    return user_dict

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# =========================
# USER ENDPOINTS
# =========================

@api_router.get("/users/search")
async def search_users(email: str, current_user: User = Depends(get_current_user)):
    """Search users by email"""
    users = await db.users.find(
        {"email": {"$regex": email, "$options": "i"}},
        {"_id": 0}
    ).limit(10).to_list(10)
    return users

# =========================
# CONNECTION ENDPOINTS
# =========================

@api_router.post("/connections")
async def create_connection(connection_data: dict, current_user: User = Depends(get_current_user)):
    """Create supervisor connection"""
    connection = Connection(
        psychologist_id=current_user.id if current_user.role == "psychologist" else connection_data["psychologist_id"],
        supervisor_id=connection_data["supervisor_id"] if current_user.role == "psychologist" else current_user.id,
        status="pending"
    )
    
    await db.connections.insert_one(connection.model_dump())
    
    # Create notification for supervisor
    notification = Notification(
        user_id=connection.supervisor_id,
        title="New Connection Request",
        content=f"{current_user.name} wants to connect with you",
        type="connection",
        path="/connections"
    )
    await db.notifications.insert_one(notification.model_dump())
    
    return connection.model_dump()

@api_router.get("/connections")
async def get_connections(current_user: User = Depends(get_current_user)):
    """Get all connections"""
    field = "supervisor_id" if current_user.role == "supervisor" else "psychologist_id"
    connections = await db.connections.find({field: current_user.id}, {"_id": 0}).to_list(1000)
    
    # Populate user data
    for conn in connections:
        other_id = conn["supervisor_id"] if current_user.role == "psychologist" else conn["psychologist_id"]
        other_user = await db.users.find_one({"id": other_id}, {"_id": 0})
        if other_user:
            conn["other_user"] = other_user
    
    return connections

@api_router.patch("/connections/{connection_id}")
async def update_connection(connection_id: str, status: str, current_user: User = Depends(get_current_user)):
    """Accept/reject connection"""
    await db.connections.update_one(
        {"id": connection_id},
        {"$set": {"status": status}}
    )
    
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if status == "accepted":
        # Notify psychologist
        notification = Notification(
            user_id=connection["psychologist_id"],
            title="Connection Accepted",
            content=f"{current_user.name} accepted your connection request",
            type="connection",
            path="/connections"
        )
        await db.notifications.insert_one(notification.model_dump())
    
    return connection

# =========================
# LOGBOOK ENDPOINTS
# =========================

@api_router.post("/logbook/years")
async def create_logbook_year(year_data: dict, current_user: User = Depends(get_current_user)):
    """Create logbook year"""
    logbook_year = LogbookYear(
        user_id=current_user.id,
        year=year_data["year"],
        start_date=year_data["start_date"],
        end_date=year_data["end_date"]
    )
    
    await db.logbook_years.insert_one(logbook_year.model_dump())
    return logbook_year.model_dump()

@api_router.get("/logbook/years")
async def get_logbook_years(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get logbook years"""
    target_user_id = user_id if user_id else current_user.id
    years = await db.logbook_years.find({"user_id": target_user_id}, {"_id": 0}).to_list(1000)
    return years

@api_router.patch("/logbook/years/{year_id}")
async def update_logbook_year(year_id: str, year_data: dict, current_user: User = Depends(get_current_user)):
    """Update logbook year"""
    await db.logbook_years.update_one(
        {"id": year_id, "user_id": current_user.id},
        {"$set": year_data}
    )
    
    year = await db.logbook_years.find_one({"id": year_id}, {"_id": 0})
    return year

@api_router.delete("/logbook/years/{year_id}")
async def delete_logbook_year(year_id: str, current_user: User = Depends(get_current_user)):
    """Delete logbook year and all associated entries"""
    # Delete all entries for this logbook period
    await db.logbook_entries.delete_many({"logbook_id": year_id, "user_id": current_user.id})
    # Delete all signatures for this logbook period  
    await db.logbook_signatures.delete_many({"logbook_id": year_id})
    # Delete the logbook period itself
    await db.logbook_years.delete_one({"id": year_id, "user_id": current_user.id})
    return {"message": "Logbook period deleted"}

@api_router.post("/logbook/entries")
async def create_logbook_entry(entry_data: dict, current_user: User = Depends(get_current_user)):
    """Create logbook entry"""
    entry = LogbookEntry(
        user_id=current_user.id,
        logbook_id=entry_data["logbook_id"],
        date=entry_data["date"],
        duration=entry_data["duration"],
        activity_type=entry_data["activity_type"],
        notes=entry_data["notes"],
        reflections=entry_data.get("reflections", "")
    )
    
    await db.logbook_entries.insert_one(entry.model_dump())
    return entry.model_dump()

@api_router.get("/logbook/entries")
async def get_logbook_entries(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get all logbook entries"""
    target_user_id = user_id if user_id else current_user.id
    entries = await db.logbook_entries.find({"user_id": target_user_id}, {"_id": 0}).to_list(1000)
    return entries

@api_router.patch("/logbook/entries/{entry_id}")
async def update_logbook_entry(entry_id: str, entry_data: dict, current_user: User = Depends(get_current_user)):
    """Update logbook entry"""
    await db.logbook_entries.update_one(
        {"id": entry_id, "user_id": current_user.id},
        {"$set": entry_data}
    )
    
    entry = await db.logbook_entries.find_one({"id": entry_id}, {"_id": 0})
    return entry

@api_router.delete("/logbook/entries/{entry_id}")
async def delete_logbook_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    """Delete logbook entry"""
    await db.logbook_entries.delete_one({"id": entry_id, "user_id": current_user.id})
    return {"message": "Entry deleted"}

@api_router.get("/logbook/stats/{logbook_id}")
async def get_logbook_stats(logbook_id: str, current_user: User = Depends(get_current_user)):
    """Get statistics for a logbook period by category"""
    entries = await db.logbook_entries.find({"logbook_id": logbook_id, "user_id": current_user.id}, {"_id": 0}).to_list(10000)
    
    stats = {
        "Direct Client Contact": 0,
        "Supervision - Individual": 0,
        "Supervision - Group": 0,
        "CPD": 0,  # Includes both CPD and Peer Consultation
        "Other": 0,
        "total": 0
    }
    
    for entry in entries:
        activity_type = entry["activity_type"]
        duration = entry["duration"]
        
        # Map activity types to stats categories
        if activity_type == "Direct Client Contact":
            stats["Direct Client Contact"] += duration
        elif activity_type == "Supervision - Individual":
            stats["Supervision - Individual"] += duration
        elif activity_type == "Supervision - Group":
            stats["Supervision - Group"] += duration
        elif activity_type == "Supervision":  # Legacy support
            stats["Supervision - Individual"] += duration  # Map old supervision to individual
        elif activity_type == "CPD" or activity_type == "Peer Consultation":
            stats["CPD"] += duration  # Combine CPD and Peer Consultation
        elif activity_type == "Other":
            stats["Other"] += duration
        else:
            stats["Other"] += duration  # Unknown types go to Other
        
        stats["total"] += duration
    
    return stats

@api_router.post("/logbook/signatures")
async def create_signature(signature_data: dict, current_user: User = Depends(get_current_user)):
    """Create logbook signature"""
    signature = LogbookSignature(
        logbook_id=signature_data["logbook_id"],
        signature_data=signature_data["signature_data"],
        week_start=signature_data["week_start"]
    )
    
    await db.logbook_signatures.insert_one(signature.model_dump())
    return signature.model_dump()

@api_router.get("/logbook/signatures")
async def get_signatures(logbook_id: str, current_user: User = Depends(get_current_user)):
    """Get signatures for logbook"""
    signatures = await db.logbook_signatures.find({"logbook_id": logbook_id}, {"_id": 0}).to_list(1000)
    return signatures


@api_router.get("/supervisor/logbook-entries")
async def get_supervised_logbook_entries(current_user: User = Depends(get_current_user)):
    """Get logbook entries from all connected psychologists for supervisor view"""
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can access this endpoint")
    
    # Get all accepted connections where current user is the supervisor
    connections = await db.connections.find({
        "supervisor_id": current_user.id,
        "status": "accepted"
    }, {"_id": 0}).to_list(1000)
    
    psychologist_ids = [conn["psychologist_id"] for conn in connections]
    
    # Get all logbook entries from connected psychologists
    entries = await db.logbook_entries.find({
        "user_id": {"$in": psychologist_ids}
    }, {"_id": 0}).to_list(10000)
    
    # Enrich entries with psychologist info
    for entry in entries:
        psychologist = await db.users.find_one({"id": entry["user_id"]}, {"_id": 0, "password_hash": 0})
        entry["psychologist_name"] = psychologist.get("name", "Unknown") if psychologist else "Unknown"
        entry["psychologist_email"] = psychologist.get("email", "") if psychologist else ""
    
    return sorted(entries, key=lambda x: x.get("date", ""), reverse=True)

@api_router.patch("/supervisor/logbook-entries/{entry_id}/comment")
async def add_supervisor_comment(entry_id: str, comment_data: dict, current_user: User = Depends(get_current_user)):
    """Add or update supervisor comment on a logbook entry"""
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can add comments")
    
    # Get the entry to verify the psychologist is connected to this supervisor
    entry = await db.logbook_entries.find_one({"id": entry_id}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Verify connection
    connection = await db.connections.find_one({
        "supervisor_id": current_user.id,
        "psychologist_id": entry["user_id"],
        "status": "accepted"
    }, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=403, detail="Not authorized to comment on this entry")
    
    # Update the entry with supervisor comment
    await db.logbook_entries.update_one(
        {"id": entry_id},
        {"$set": {
            "supervisor_comment": comment_data.get("comment", ""),
            "supervisor_comment_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_entry = await db.logbook_entries.find_one({"id": entry_id}, {"_id": 0})
    return updated_entry

# =========================
# CPD ENDPOINTS
# =========================

@api_router.post("/cpd/years")
async def create_cpd_year(year_data: dict, current_user: User = Depends(get_current_user)):
    """Create CPD year"""
    cpd_year = CPDYear(
        user_id=current_user.id,
        year=year_data["year"],
        cpd_hours_required=year_data.get("cpd_hours_required", 30)
    )
    
    await db.cpd_years.insert_one(cpd_year.model_dump())
    return cpd_year.model_dump()

@api_router.get("/cpd/years")
async def get_cpd_years(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get CPD years"""
    target_user_id = user_id if user_id else current_user.id
    years = await db.cpd_years.find({"user_id": target_user_id}, {"_id": 0}).to_list(1000)
    return years


@api_router.patch("/cpd/years/{year_id}")
async def update_cpd_year(year_id: str, year_data: dict, current_user: User = Depends(get_current_user)):
    """Update CPD year"""
    await db.cpd_years.update_one(
        {"id": year_id, "user_id": current_user.id},
        {"$set": year_data}
    )
    
    year = await db.cpd_years.find_one({"id": year_id}, {"_id": 0})
    return year

@api_router.delete("/cpd/years/{year_id}")
async def delete_cpd_year(year_id: str, current_user: User = Depends(get_current_user)):
    """Delete CPD year"""
    await db.cpd_years.delete_one({"id": year_id, "user_id": current_user.id})
    return {"message": "CPD year deleted"}


@api_router.post("/cpd/activities")
async def create_cpd_activity(activity_data: dict, current_user: User = Depends(get_current_user)):
    """Create CPD activity"""
    activity = CPDActivity(
        user_id=current_user.id,
        year_id=activity_data["year_id"],
        activity_type=activity_data["activity_type"],
        hours=activity_data["hours"],
        description=activity_data["description"],
        reflection=activity_data.get("reflection", ""),
        date=activity_data["date"],
        linked_goal_id=activity_data.get("linked_goal_id")
    )
    
    await db.cpd_activities.insert_one(activity.model_dump())
    return activity.model_dump()

@api_router.get("/cpd/activities")
async def get_cpd_activities(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get CPD activities"""
    target_user_id = user_id if user_id else current_user.id
    activities = await db.cpd_activities.find({"user_id": target_user_id}, {"_id": 0}).to_list(1000)
    return activities

@api_router.patch("/cpd/activities/{activity_id}")
async def update_cpd_activity(activity_id: str, activity_data: dict, current_user: User = Depends(get_current_user)):
    """Update CPD activity"""
    await db.cpd_activities.update_one(
        {"id": activity_id, "user_id": current_user.id},
        {"$set": activity_data}
    )
    
    activity = await db.cpd_activities.find_one({"id": activity_id}, {"_id": 0})
    return activity

@api_router.delete("/cpd/activities/{activity_id}")
async def delete_cpd_activity(activity_id: str, current_user: User = Depends(get_current_user)):
    """Delete CPD activity"""
    await db.cpd_activities.delete_one({"id": activity_id, "user_id": current_user.id})
    return {"message": "Activity deleted"}

# CPD Plans
@api_router.post("/cpd/plans")
async def create_cpd_plan(plan_data: dict, current_user: User = Depends(get_current_user)):
    """Create CPD learning plan"""
    plan = CPDPlan(
        user_id=current_user.id,
        year_id=plan_data["year_id"],
        start_date=plan_data["start_date"],
        end_date=plan_data["end_date"],
        goals=[]
    )
    
    await db.cpd_plans.insert_one(plan.model_dump())
    return plan.model_dump()

@api_router.get("/cpd/plans")
async def get_cpd_plans(user_id: Optional[str] = None, year_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get CPD plans"""
    target_user_id = user_id if user_id else current_user.id
    query = {"user_id": target_user_id}
    if year_id:
        query["year_id"] = year_id
    plans = await db.cpd_plans.find(query, {"_id": 0}).to_list(1000)
    return plans

@api_router.patch("/cpd/plans/{plan_id}")
async def update_cpd_plan(plan_id: str, plan_data: dict, current_user: User = Depends(get_current_user)):
    """Update CPD plan"""
    await db.cpd_plans.update_one(
        {"id": plan_id},
        {"$set": plan_data}
    )
    
    plan = await db.cpd_plans.find_one({"id": plan_id}, {"_id": 0})
    return plan

@api_router.post("/cpd/plans/{plan_id}/goals")
async def add_goal_to_plan(plan_id: str, goal_data: dict, current_user: User = Depends(get_current_user)):
    """Add goal to CPD plan"""
    goal = CPDGoal(
        goal=goal_data["goal"],
        what_to_learn=goal_data["what_to_learn"],
        expected_outcomes=goal_data["expected_outcomes"],
        target_date=goal_data.get("target_date", "")
    )
    
    await db.cpd_plans.update_one(
        {"id": plan_id},
        {"$push": {"goals": goal.model_dump()}}
    )
    
    plan = await db.cpd_plans.find_one({"id": plan_id}, {"_id": 0})
    return plan

@api_router.patch("/cpd/plans/{plan_id}/goals/{goal_id}")
async def update_goal(plan_id: str, goal_id: str, goal_data: dict, current_user: User = Depends(get_current_user)):
    """Update a specific goal"""
    plan = await db.cpd_plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    goals = plan.get("goals", [])
    for i, goal in enumerate(goals):
        if goal["id"] == goal_id:
            goals[i].update(goal_data)
            break
    
    await db.cpd_plans.update_one(
        {"id": plan_id},
        {"$set": {"goals": goals}}
    )
    
    updated_plan = await db.cpd_plans.find_one({"id": plan_id}, {"_id": 0})
    return updated_plan

@api_router.post("/cpd/plans/{plan_id}/comments")
async def add_supervisor_comment(plan_id: str, comment_data: dict, current_user: User = Depends(get_current_user)):
    """Add supervisor comment to plan"""
    comment = {
        "id": str(uuid.uuid4()),
        "author_id": current_user.id,
        "author_name": current_user.name,
        "content": comment_data["content"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cpd_plans.update_one(
        {"id": plan_id},
        {"$push": {"supervisor_comments": comment}}
    )
    
    plan = await db.cpd_plans.find_one({"id": plan_id}, {"_id": 0})
    return plan

# Peer Consultations
@api_router.post("/cpd/consultations")
async def create_consultation(consultation_data: dict, current_user: User = Depends(get_current_user)):
    """Create peer consultation"""
    consultation = PeerConsultation(
        user_id=current_user.id,
        year_id=consultation_data["year_id"],
        date=consultation_data["date"],
        minutes_spent=consultation_data["minutes_spent"],
        activity_description=consultation_data["activity_description"],
        linked_goal_id=consultation_data.get("linked_goal_id")
    )
    
    await db.peer_consultations.insert_one(consultation.model_dump())
    return consultation.model_dump()

@api_router.get("/cpd/consultations")
async def get_consultations(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get peer consultations"""
    target_user_id = user_id if user_id else current_user.id
    consultations = await db.peer_consultations.find({"user_id": target_user_id}, {"_id": 0}).to_list(1000)
    return consultations

@api_router.patch("/cpd/consultations/{consultation_id}")
async def update_consultation(consultation_id: str, consultation_data: dict, current_user: User = Depends(get_current_user)):
    """Update peer consultation"""
    await db.peer_consultations.update_one(
        {"id": consultation_id, "user_id": current_user.id},
        {"$set": consultation_data}
    )
    
    consultation = await db.peer_consultations.find_one({"id": consultation_id}, {"_id": 0})
    return consultation

@api_router.delete("/cpd/consultations/{consultation_id}")
async def delete_consultation(consultation_id: str, current_user: User = Depends(get_current_user)):
    """Delete peer consultation"""
    await db.peer_consultations.delete_one({"id": consultation_id, "user_id": current_user.id})
    return {"message": "Consultation deleted"}


# =========================
# SUPERVISOR CPD ENDPOINTS
# =========================

@api_router.get("/supervisor/cpd-activities")
async def get_supervised_cpd_activities(current_user: User = Depends(get_current_user)):
    """Get CPD activities from all connected psychologists for supervisor view"""
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can access this endpoint")
    
    # Get all accepted connections where current user is the supervisor
    connections = await db.connections.find({
        "supervisor_id": current_user.id,
        "status": "accepted"
    }, {"_id": 0}).to_list(1000)
    
    psychologist_ids = [conn["psychologist_id"] for conn in connections]
    
    # Get all CPD activities from connected psychologists
    activities = await db.cpd_activities.find({
        "user_id": {"$in": psychologist_ids}
    }, {"_id": 0}).to_list(10000)
    
    # Enrich activities with psychologist info
    for activity in activities:
        psychologist = await db.users.find_one({"id": activity["user_id"]}, {"_id": 0, "password_hash": 0})
        activity["psychologist_name"] = psychologist.get("name", "Unknown") if psychologist else "Unknown"
        activity["psychologist_email"] = psychologist.get("email", "") if psychologist else ""
    
    return sorted(activities, key=lambda x: x.get("date", ""), reverse=True)

@api_router.patch("/supervisor/cpd-activities/{activity_id}/comment")
async def add_supervisor_comment_cpd(activity_id: str, comment_data: dict, current_user: User = Depends(get_current_user)):
    """Add or update supervisor comment on a CPD activity"""
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can add comments")
    
    # Get the activity to verify the psychologist is connected to this supervisor
    activity = await db.cpd_activities.find_one({"id": activity_id}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Verify connection
    connection = await db.connections.find_one({
        "supervisor_id": current_user.id,
        "psychologist_id": activity["user_id"],
        "status": "accepted"
    }, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=403, detail="Not authorized to comment on this activity")
    
    # Update the activity with supervisor comment
    await db.cpd_activities.update_one(
        {"id": activity_id},
        {"$set": {
            "supervisor_comment": comment_data.get("comment", ""),
            "supervisor_comment_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_activity = await db.cpd_activities.find_one({"id": activity_id}, {"_id": 0})
    return updated_activity

# =========================
# COMPETENCY ENDPOINTS
# =========================

@api_router.post("/competencies/journals")
async def create_competency_journal(journal_data: dict, current_user: User = Depends(get_current_user)):
    """Create competency journal"""
    journal = CompetencyJournal(
        user_id=current_user.id,
        competency_id=journal_data["competency_id"],
        entry=journal_data["entry"],
        date=journal_data["date"]
    )
    
    await db.competency_journals.insert_one(journal.model_dump())
    return journal.model_dump()

@api_router.get("/competencies/journals")
async def get_competency_journals(user_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get competency journals"""
    target_user_id = user_id if user_id else current_user.id
    journals = await db.competency_journals.find({"user_id": target_user_id}, {"_id": 0}).to_list(1000)
    return journals

@api_router.patch("/competencies/journals/{journal_id}")
async def update_competency_journal(journal_id: str, journal_data: dict, current_user: User = Depends(get_current_user)):
    """Update competency journal"""
    await db.competency_journals.update_one(
        {"id": journal_id, "user_id": current_user.id},
        {"$set": journal_data}
    )
    
    journal = await db.competency_journals.find_one({"id": journal_id}, {"_id": 0})
    return journal

@api_router.delete("/competencies/journals/{journal_id}")
async def delete_competency_journal(journal_id: str, current_user: User = Depends(get_current_user)):
    """Delete competency journal"""
    await db.competency_journals.delete_one({"id": journal_id, "user_id": current_user.id})
    return {"message": "Journal deleted"}


@api_router.patch("/supervisor/competencies/{journal_id}/comment")
async def add_supervisor_comment_competency(journal_id: str, comment_data: dict, current_user: User = Depends(get_current_user)):
    """Add or update supervisor comment on a competency journal"""
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can add comments")
    
    # Get the journal to verify the psychologist is connected to this supervisor
    journal = await db.competency_journals.find_one({"id": journal_id}, {"_id": 0})
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    
    # Verify connection
    connection = await db.connections.find_one({
        "supervisor_id": current_user.id,
        "psychologist_id": journal["user_id"],
        "status": "accepted"
    }, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=403, detail="Not authorized to comment on this journal")
    
    # Update the journal with supervisor comment
    await db.competency_journals.update_one(
        {"id": journal_id},
        {"$set": {
            "supervisor_comment": comment_data.get("comment", ""),
            "supervisor_comment_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_journal = await db.competency_journals.find_one({"id": journal_id}, {"_id": 0})
    return updated_journal


@api_router.patch("/supervisor/consultations/{consultation_id}/comment")
async def add_supervisor_comment_consultation(consultation_id: str, comment_data: dict, current_user: User = Depends(get_current_user)):
    """Add or update supervisor comment on a peer consultation"""
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can add comments")
    
    # Get the consultation to verify the psychologist is connected to this supervisor
    consultation = await db.peer_consultations.find_one({"id": consultation_id}, {"_id": 0})
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # Verify connection
    connection = await db.connections.find_one({
        "supervisor_id": current_user.id,
        "psychologist_id": consultation["user_id"],
        "status": "accepted"
    }, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=403, detail="Not authorized to comment on this consultation")
    
    # Update the consultation with supervisor comment
    await db.peer_consultations.update_one(
        {"id": consultation_id},
        {"$set": {
            "supervisor_comment": comment_data.get("comment", ""),
            "supervisor_comment_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_consultation = await db.peer_consultations.find_one({"id": consultation_id}, {"_id": 0})
    return updated_consultation

@api_router.patch("/supervisor/goals/{goal_id}/comment")
async def add_supervisor_comment_goal(goal_id: str, comment_data: dict, current_user: User = Depends(get_current_user)):
    """Add or update supervisor comment on a learning goal"""
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can add comments")
    
    # Find the plan containing this goal
    plan = await db.cpd_plans.find_one(
        {"goals.id": goal_id},
        {"_id": 0}
    )
    
    if not plan:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Verify connection
    connection = await db.connections.find_one({
        "supervisor_id": current_user.id,
        "psychologist_id": plan["user_id"],
        "status": "accepted"
    }, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=403, detail="Not authorized to comment on this goal")
    
    # Update the specific goal within the plan
    await db.cpd_plans.update_one(
        {"goals.id": goal_id},
        {"$set": {
            "goals.$.supervisor_comment": comment_data.get("comment", ""),
            "goals.$.supervisor_comment_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_plan = await db.cpd_plans.find_one({"goals.id": goal_id}, {"_id": 0})
    return updated_plan


# =========================
# MESSAGE ENDPOINTS
# =========================

@api_router.post("/messages")
async def send_message(message_data: dict, current_user: User = Depends(get_current_user)):
    """Send message"""
    message = Message(
        from_user_id=current_user.id,
        to_user_id=message_data["to_user_id"],
        content=message_data["content"]
    )
    
    await db.messages.insert_one(message.model_dump())
    
    # Create notification
    notification = Notification(
        user_id=message_data["to_user_id"],
        title="New Message",
        content=f"{current_user.name} sent you a message",
        type="message",
        path="/messages"
    )
    await db.notifications.insert_one(notification.model_dump())
    
    return message.model_dump()

@api_router.get("/messages")
async def get_messages(other_user_id: str, current_user: User = Depends(get_current_user)):
    """Get messages between two users"""
    messages = await db.messages.find(
        {
            "$or": [
                {"from_user_id": current_user.id, "to_user_id": other_user_id},
                {"from_user_id": other_user_id, "to_user_id": current_user.id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Mark as read
    await db.messages.update_many(
        {"from_user_id": other_user_id, "to_user_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

@api_router.get("/messages/conversations")
async def get_conversations(current_user: User = Depends(get_current_user)):
    """Get all conversations"""
    messages = await db.messages.find(
        {
            "$or": [
                {"from_user_id": current_user.id},
                {"to_user_id": current_user.id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Group by conversation
    conversations = {}
    for msg in messages:
        other_id = msg["to_user_id"] if msg["from_user_id"] == current_user.id else msg["from_user_id"]
        
        if other_id not in conversations:
            other_user = await db.users.find_one({"id": other_id}, {"_id": 0})
            if other_user:
                unread_count = await db.messages.count_documents({
                    "from_user_id": other_id,
                    "to_user_id": current_user.id,
                    "read": False
                })
                
                conversations[other_id] = {
                    "other_user": other_user,
                    "last_message": msg,
                    "unread_count": unread_count
                }
    
    return list(conversations.values())

# =========================
# NOTIFICATION ENDPOINTS
# =========================

@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Get notifications"""
    notifications = await db.notifications.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return notifications

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

# =========================
# PDF EXPORT
# =========================

@api_router.get("/export/logbook/{year_id}")
async def export_logbook_pdf(year_id: str, current_user: User = Depends(get_current_user)):
    """Export logbook as PDF"""
    # Get year
    year = await db.logbook_years.find_one({"id": year_id}, {"_id": 0})
    if not year:
        raise HTTPException(status_code=404, detail="Year not found")
    
    # Get entries
    entries = await db.logbook_entries.find(
        {"logbook_id": year_id},
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2563eb'),
        alignment=TA_CENTER
    )
    elements.append(Paragraph(f"Practice Logbook - {year['year']}", title_style))
    elements.append(Spacer(1, 0.5*inch))
    
    # User info
    elements.append(Paragraph(f"<b>Psychologist:</b> {current_user.name}", styles['Normal']))
    elements.append(Paragraph(f"<b>Period:</b> {year['start_date']} to {year['end_date']}", styles['Normal']))
    elements.append(Spacer(1, 0.5*inch))
    
    # Entries table
    table_data = [['Date', 'Activity', 'Duration (hrs)', 'Notes']]
    total_hours = 0
    
    for entry in entries:
        table_data.append([
            entry['date'],
            entry['activity_type'],
            str(entry['duration']),
            Paragraph(entry['notes'][:100] + '...' if len(entry['notes']) > 100 else entry['notes'], styles['Normal'])
        ])
        total_hours += entry['duration']
    
    table_data.append(['', '', f"<b>{total_hours}</b>", ''])
    
    table = Table(table_data, colWidths=[1.5*inch, 2*inch, 1.2*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=logbook_{year['year']}.pdf"}
    )

@api_router.get("/export/cpd/{year_id}")
async def export_cpd_pdf(year_id: str, current_user: User = Depends(get_current_user)):
    """Export CPD activities as PDF"""
    # Get year
    year = await db.cpd_years.find_one({"id": year_id}, {"_id": 0})
    if not year:
        raise HTTPException(status_code=404, detail="Year not found")
    
    # Get activities
    activities = await db.cpd_activities.find(
        {"year_id": year_id},
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#10b981'),
        alignment=TA_CENTER
    )
    elements.append(Paragraph(f"CPD Activities - {year['year']}", title_style))
    elements.append(Spacer(1, 0.5*inch))
    
    # User info
    elements.append(Paragraph(f"<b>Psychologist:</b> {current_user.name}", styles['Normal']))
    elements.append(Paragraph(f"<b>Required Hours:</b> {year['cpd_hours_required']}", styles['Normal']))
    elements.append(Spacer(1, 0.5*inch))
    
    # Activities table
    table_data = [['Date', 'Type', 'Hours', 'Description']]
    total_hours = 0
    
    for activity in activities:
        table_data.append([
            activity['date'],
            activity['activity_type'],
            str(activity['hours']),
            Paragraph(activity['description'][:100] + '...' if len(activity['description']) > 100 else activity['description'], styles['Normal'])
        ])
        total_hours += activity['hours']
    
    table_data.append(['', '', f"<b>{total_hours}</b>", ''])
    
    table = Table(table_data, colWidths=[1.5*inch, 2*inch, 1*inch, 3.2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cpd_{year['year']}.pdf"}
    )

# HEALTH CHECK ENDPOINTS
@app.get("/health")  # Kubernetes health probe
async def health_check_k8s():
    """Health check endpoint for Kubernetes probes"""
    return {"status": "healthy"}

@app.get("/api/health")  # API health check
async def health_check():
    """API health check"""
    try:
        # Test database connection
        await db.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
