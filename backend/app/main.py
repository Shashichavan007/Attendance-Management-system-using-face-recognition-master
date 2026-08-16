import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.db.database import init_db
from backend.app.db.migrator import run_migration
from backend.app.api.router import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    init_db()
    run_migration()
    print("[AttendAI Backend] Database initialized & legacy CSV data migrated.")
    yield
    # Shutdown tasks if any

app = FastAPI(
    title="AttendAI API",
    description="Smart Face Recognition Attendance System API Backend",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup for Vite frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "online", "app": "AttendAI", "version": "2.0.0"}

# Include API Router
app.include_router(api_router, prefix="/api")

# Serve frontend build if dist folder exists
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static_frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
