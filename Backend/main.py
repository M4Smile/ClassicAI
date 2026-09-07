import base64
import datetime
import logging
import os
import tempfile
import uuid
from pathlib import Path

import jwt as pyjwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from ai_compos import main_pipeline
from llm import GPT
from music_gen import audio_to_audio


logger = logging.getLogger(__name__)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

app = FastAPI(
    title="AllegroCode API",
    description="Backend for the ClassicAI hackathon prototype.",
)

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./allegrocode.db")
engine_options = {}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

SECRET_KEY = os.getenv("JWT_SECRET", "")
if len(SECRET_KEY) < 32 or SECRET_KEY.startswith("change-me"):
    raise RuntimeError(
        "JWT_SECRET must contain at least 32 non-placeholder characters"
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)


Base.metadata.create_all(bind=engine)


class UserCreate(BaseModel):
    password: str
    email: EmailStr
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GPTRequest(BaseModel):
    prompt: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(email: str) -> str:
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": email, "exp": expire}
    return pyjwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except pyjwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def read_upload(file: UploadFile, allowed_suffixes: set[str]) -> tuple[bytes, str]:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed_suffixes:
        allowed = ", ".join(sorted(allowed_suffixes))
        raise HTTPException(status_code=400, detail=f"Allowed file types: {allowed}")

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File size must be less than 10 MB")
    return contents, suffix


@app.post("/signup")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=f"user_{uuid.uuid4().hex[:12]}",
        hashed_password=pwd_context.hash(user.password),
        email=user.email,
        name=user.name,
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail="Invalid input data") from exc

    return {
        "msg": "User created successfully",
        "username": new_user.username,
        "access_token": create_access_token(new_user.email),
        "token_type": "bearer",
    }


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {
        "access_token": create_access_token(db_user.email),
        "token_type": "bearer",
    }


@app.get("/userinfo")
def userinfo(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "name": current_user.name,
    }


@app.post("/chat")
def gpt(
    request: GPTRequest,
    _current_user: User = Depends(get_current_user),
):
    assistant = GPT(request.prompt, None, "yandex")
    return {"answer": assistant.generate()}


@app.get("/test-connection")
def test_connection(
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {"msg": "Connection successful", "users_count": db.query(User).count()}


@app.post("/upload-audio")
async def upload_audio(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    _current_user: User = Depends(get_current_user),
):
    contents, suffix = await read_upload(file, {".mp3"})
    try:
        with tempfile.TemporaryDirectory(prefix="allegrocode-audio-") as work_dir:
            input_path = Path(work_dir) / f"input{suffix}"
            input_path.write_bytes(contents)
            transformed_audio = audio_to_audio(str(input_path), prompt)
        return {
            "audio_base64": base64.b64encode(transformed_audio).decode("ascii")
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Audio processing failed")
        raise HTTPException(status_code=500, detail="Audio processing failed") from exc


@app.post("/simplify_music")
async def upload_midi(
    file: UploadFile = File(...),
    _current_user: User = Depends(get_current_user),
):
    contents, suffix = await read_upload(file, {".mid", ".midi"})
    try:
        with tempfile.TemporaryDirectory(prefix="allegrocode-midi-") as work_dir:
            input_path = Path(work_dir) / f"input{suffix}"
            input_path.write_bytes(contents)
            pdf_result = main_pipeline(str(input_path), work_dir)
        return {"message": "OK", "pdf": pdf_result}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("MIDI processing failed")
        raise HTTPException(status_code=500, detail="MIDI processing failed") from exc
