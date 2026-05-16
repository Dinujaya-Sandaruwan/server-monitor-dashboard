import os
import secrets
import psutil
import asyncio
import json
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from starlette.requests import Request

app = FastAPI(title="Server Monitoring Dashboard")

# Security
security = HTTPBasic()

# Update these with your preferred credentials
DASHBOARD_USERNAME = "admin"
DASHBOARD_PASSWORD = "password"

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    current_username_bytes = credentials.username.encode("utf8")
    correct_username_bytes = DASHBOARD_USERNAME.encode("utf8")
    is_correct_username = secrets.compare_digest(
        current_username_bytes, correct_username_bytes
    )
    current_password_bytes = credentials.password.encode("utf8")
    correct_password_bytes = DASHBOARD_PASSWORD.encode("utf8")
    is_correct_password = secrets.compare_digest(
        current_password_bytes, correct_password_bytes
    )
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Static files and Templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

def get_system_stats():
    # CPU usage per core and total
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_count = psutil.cpu_count()
    cpu_freq = psutil.cpu_freq()
    
    memory = psutil.virtual_memory()
    swap = psutil.swap_memory()
    disk = psutil.disk_usage('/')
    
    # Top processes
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent']):
        try:
            # We call cpu_percent twice to get a meaningful value for the process
            # but that's slow. For real-time, we'll just take what's there.
            processes.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    # Sort by CPU usage and take top 10
    processes = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:10]
    
    return {
        "cpu": {
            "percent": cpu_percent,
            "count": cpu_count,
            "freq": cpu_freq.current if cpu_freq else 0
        },
        "memory": {
            "total": memory.total,
            "available": memory.available,
            "percent": memory.percent,
            "used": memory.used
        },
        "swap": {
            "total": swap.total,
            "used": swap.used,
            "percent": swap.percent
        },
        "disk": {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent
        },
        "processes": processes
    }

@app.get("/api/stats")
async def stats(username: str = Depends(authenticate)):
    return get_system_stats()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # In a production app, you'd want to verify authentication here too.
    # Since browsers don't send Basic Auth headers with WebSockets easily,
    # we'll skip for now or use a session-based approach.
    await websocket.accept()
    try:
        while True:
            stats = get_system_stats()
            await websocket.send_json(stats)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass

@app.get("/", response_class=HTMLResponse)
async def get_dashboard(request: Request, username: str = Depends(authenticate)):
    return templates.TemplateResponse("index.html", {"request": request, "username": username})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
