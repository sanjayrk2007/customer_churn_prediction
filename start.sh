#!/bin/bash

# Terminate background jobs on exit
trap "kill 0" EXIT

echo "🚀 Starting ChurnShield AI..."

# 1. Start FastAPI Backend
echo "📡 Starting FastAPI Backend on http://localhost:8000..."
PYTHONPATH=. .venv/bin/uvicorn src.main:app --host 127.0.0.1 --port 8000 &

# Wait for backend to be ready
sleep 2

# 2. Start Vite + React Frontend
echo "💻 Starting Vite React Frontend..."
npm run dev --prefix frontend &

# Keep script running
wait
