# Server Monitoring Dashboard

A modern, lightweight, real-time web dashboard to monitor your Ubuntu VPS.

## Features
- **Real-time Stats:** CPU, RAM, Swap, and Disk usage updated every 2 seconds via WebSockets.
- **Top Processes:** View the top 10 most resource-intensive processes.
- **Modern UI:** Built with Tailwind CSS and Chart.js for beautiful data visualization.
- **Secure:** Protected by Basic Authentication.

## Local Development
1. Install dependencies: `pip install -r requirements.txt`
2. Run the server: `python main.py`
3. Access at: `http://localhost:5000` (User: `admin`, Pass: `password`)

## Deployment on VPS using PM2

Since you are using FTP to upload files, follow these steps on your VPS:

### 1. Upload Files
Upload all files from this directory to your VPS (e.g., `/home/user/server-dashboard`).

### 2. Install Dependencies
On your VPS terminal, navigate to the folder and run:
```bash
pip install -r requirements.txt
```

### 3. Start with PM2
Run the following command to start the dashboard and ensure it stays running:
```bash
pm2 start uvicorn --name "server-dashboard" --interpreter python3 -- main:app --host 0.0.0.0 --port 5000
```

### 4. PM2 Management Commands
- **View logs:** `pm2 logs server-dashboard`
- **Restart:** `pm2 restart server-dashboard`
- **Stop:** `pm2 stop server-dashboard`
- **Status:** `pm2 status`

### 5. Security Note
Don't forget to change the `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` in `main.py` before deploying!
