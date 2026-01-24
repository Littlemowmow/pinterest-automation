from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import photos, tags, settings as settings_router, queue


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Pinterest Automation API starting...")
    yield
    # Shutdown
    print("Pinterest Automation API shutting down...")


app = FastAPI(
    title="Pinterest Automation API",
    description="Backend API for Pinterest pin automation tool",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(photos.router)
app.include_router(tags.router)
app.include_router(settings_router.router)
app.include_router(queue.router)


@app.get("/")
async def root():
    return {
        "message": "Pinterest Automation API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
