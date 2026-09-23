import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent
dotenv_path = BASE_DIR / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path)

# API Keys & Defaults
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# Specification requirement: DEFAULT_LLM_MODEL=gemma-4-26b-a4b-it in config.py
DEFAULT_LLM_MODEL = os.getenv("GEMINI_MODEL", "gemma-4-26b-a4b-it")

# Port default
PORT = int(os.getenv("PORT", 8005))

# System Directories
DATABASE_DIR = BASE_DIR / "database"
SKILLS_DIR = BASE_DIR / "skills"
SAMPLE_DOCS_DIR = BASE_DIR / "sample_docs"
LOG_FILE_PATH = DATABASE_DIR / "log.json"

# Ensure directories exist
DATABASE_DIR.mkdir(parents=True, exist_ok=True)
SKILLS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DOCS_DIR.mkdir(parents=True, exist_ok=True)

# Vector DB / Ollama settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
DEFAULT_EMBEDDING_MODEL = os.getenv("DEFAULT_EMBEDDING_MODEL", "nomic-embed-text")
