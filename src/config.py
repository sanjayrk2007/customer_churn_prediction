import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Paths to models
MODEL_PATH = os.path.join(BASE_DIR, "churn_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")

# SQLite Database path
DATABASE_PATH = os.path.join(BASE_DIR, "data.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Gemini API Key (for risk explanations & recommendations)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Server Configuration
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")
