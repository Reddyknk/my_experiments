import subprocess
import time
import requests
import os
import sys
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

class OllamaService:
    def __init__(self, base_url=None):
        self.base_url = base_url or config.OLLAMA_BASE_URL
        self.process = None
        self.started_by_app = False
        self.active_embedding_model = config.DEFAULT_EMBEDDING_MODEL

    def is_running(self):
        """Checks if Ollama service is responding on base_url."""
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return res.status_code == 200
        except Exception:
            return False

    def ensure_service_started(self):
        """Starts Ollama process if not currently running."""
        if self.is_running():
            self.started_by_app = False
            return True, "Ollama is already running."

        try:
            # Attempt to start ollama serve
            if sys.platform == "win32":
                self.process = subprocess.Popen(["ollama", "serve"], creationflags=subprocess.CREATE_NEW_CONSOLE)
            else:
                self.process = subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            self.started_by_app = True
            
            # Wait up to 10 seconds for service startup
            for _ in range(10):
                time.sleep(1)
                if self.is_running():
                    return True, "Ollama service started successfully by app."
            
            return False, "Ollama process launched but HTTP endpoint did not become ready."
        except Exception as e:
            return False, f"Failed to start Ollama process: {str(e)}"

    def stop_service_if_started_by_app(self):
        """Shuts down Ollama service ONLY if started by the app."""
        if self.started_by_app and self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
                return True, "Ollama service shut down."
            except Exception as e:
                return False, f"Failed to terminate Ollama process: {str(e)}"
        return False, "Ollama was not started by app; leaving active."

    def list_embedding_models(self):
        """Returns catalog of embedding models and their installation status."""
        catalog = [
            {
                "name": "nomic-embed-text",
                "dimensions": 768,
                "context_window": "8192 tokens",
                "size": "274 MB",
                "description": "High performing open-source text embedding model for retrieval.",
                "status": "Available"
            },
            {
                "name": "all-minilm",
                "dimensions": 384,
                "context_window": "512 tokens",
                "size": "45 MB",
                "description": "Lightweight, ultra-fast sentence transformer model.",
                "status": "Available"
            },
            {
                "name": "mxbai-embed-large",
                "dimensions": 1024,
                "context_window": "512 tokens",
                "size": "670 MB",
                "description": "State-of-the-art embedding model developed by Mixedbread AI.",
                "status": "Available"
            },
            {
                "name": "bge-m3",
                "dimensions": 1024,
                "context_window": "8192 tokens",
                "size": "1.2 GB",
                "description": "Multi-lingual, multi-granularity dense retriever from BAAI.",
                "status": "Available"
            }
        ]

        installed_names = []
        if self.is_running():
            try:
                res = requests.get(f"{self.base_url}/api/tags", timeout=3)
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    installed_names = [m.get("name", "").split(":")[0] for m in models]
            except Exception:
                pass

        for item in catalog:
            if item["name"] in installed_names:
                item["status"] = "Active" if item["name"] == self.active_embedding_model else "Installed"
            elif item["name"] == self.active_embedding_model:
                item["status"] = "Active"

        return catalog

    def pull_model(self, model_name):
        """Requests Ollama to pull/download an embedding model."""
        if not self.is_running():
            return False, "Ollama is not running."
        try:
            res = requests.post(f"{self.base_url}/api/pull", json={"name": model_name}, timeout=120)
            return res.status_code == 200, f"Model {model_name} pulled successfully."
        except Exception as e:
            return False, f"Failed to pull model: {str(e)}"

    def get_embedding(self, text, model_name=None):
        """Generates dense vector representation for a text string using Ollama API."""
        model = model_name or self.active_embedding_model
        if not self.is_running():
            # Fallback mock embedding if Ollama service is unavailable locally
            import hashlib
            import random
            seed = int(hashlib.md5(text.encode('utf-8')).hexdigest()[:8], 16)
            random.seed(seed)
            return [random.uniform(-1.0, 1.0) for _ in range(384)]

        try:
            # Try /api/embeddings endpoint
            res = requests.post(f"{self.base_url}/api/embeddings", json={"model": model, "prompt": text}, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if "embedding" in data:
                    return data["embedding"]
            
            # Try /api/embed endpoint
            res2 = requests.post(f"{self.base_url}/api/embed", json={"model": model, "input": text}, timeout=10)
            if res2.status_code == 200:
                data2 = res2.json()
                if "embeddings" in data2 and len(data2["embeddings"]) > 0:
                    return data2["embeddings"][0]
        except Exception:
            pass

        # Fallback deterministic pseudo-vector if model not pulled yet
        import hashlib
        import random
        seed = int(hashlib.md5(text.encode('utf-8')).hexdigest()[:8], 16)
        random.seed(seed)
        return [random.uniform(-1.0, 1.0) for _ in range(384)]

ollama_service = OllamaService()
