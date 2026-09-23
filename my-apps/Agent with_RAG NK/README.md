# Agent with RAG Operations Center

An enterprise-grade web application for orchestrating AI Agents with Retrieval-Augmented Generation (RAG) capabilities, local vector databases via Ollama and ChromaDB, multi-turn procedural tool execution, real-time telemetry metrics, and detailed audit log inspection.

---

## 📂 Project Architecture

```
Agent-with-RAG/
├── database/                   # Persistent ChromaDB storage & log.json
├── sample_docs/                # Sample markdown/text documents
│   ├── agent_rag_overview.md
│   ├── company_marketing_strategy.md
│   └── financial_report_2025.md
├── services/                   # Modular backend service layer
│   ├── agent_service.py        # Custom Agent & Google ADK Agent orchestrator
│   ├── chroma_service.py       # ChromaDB persistent vector database manager
│   ├── gemini_service.py       # Google genai SDK & active model provider
│   ├── log_service.py          # JSON payload logger & telemetry computer
│   ├── ollama_service.py       # Local Ollama process lifecycle & embedder
│   └── skill_service.py        # Dynamic skill scanner & tool dispatcher
├── skills/                     # Domain skills & executable tools
│   ├── time-weather-skill/     # Time zone & Open-Meteo weather tool
│   ├── person-information-skill/# Employee CSV registry search tool (20 records)
│   ├── stock-market-skill/     # Financial stock gainers/losers market tool
│   └── document-rag-skill/     # Document vector database search tool
├── static/                     # Web static assets (CSS, JS, Icons)
│   ├── css/
│   │   ├── styles.css          # Clean white browser background theme CSS
│   │   └── style.css           # High-contrast alternative stylesheet
│   ├── images/
│   │   ├── app-icon.gif        # Application logo
│   │   └── tab-icon.gif        # Browser favicon
│   └── js/
│       └── main.js              # SPA frontend controller, shutdown logic & Chart.js integration
├── templates/index.html        # Single Page Application HTML (4 tabs)
├── app.py                      # Flask main entry point & REST API endpoints
├── config.py                   # Environment configuration & defaults
├── requirements.txt            # Python package requirements
├── SPECIFICATIONS.md           # Full system specifications document
└── README.md                   # System documentation & user guide
```

---

## 🚀 Features Overview

- **Multi-Agent Architecture**: Choose between **Custom Agent** (multi-turn reasoning loop with tool calls) and **Google ADK Agent** (`LlmAgent`).
- **Dynamic Skill Dispatcher**: Automatic discovery and vector indexing of `skills/` subfolders (`SKILL.md` SOP parsing & dynamic script loading).
- **Hybrid RAG Vector Engine**: Persistent ChromaDB collections (`skills_store` & `documents_store`), hash deduplication, character chunking, and similarity thresholding.
- **Google AI Studio Models**: Dynamic model listing (`gemma-4-26b-a4b-it`, `gemini-2.5-flash`, etc.) and support for custom OpenAI-compatible API endpoints.
- **Real-Time Telemetry & Charts**: Chart.js time-series plots for call volumes, prompt/response counts, error tracking, token velocity, and low-level latency metrics (TTFT, ITL, TPS, TPOT).
- **Audit Log Inspector**: Complete JSON payload logging with API key redaction (`****`), conversation grouping (top 5 scrollable rows), event sequence filtering, and interactive modal JSON viewer.
- **Clean UI & Reliable Shutdown**: Clean white browser theme and case-insensitive Web UI shutdown controller with visual completion feedback.

---

## 💻 Installation & Setup

### Prerequisites
- **Python 3.10+** installed
- **Ollama** installed locally (optional; app will auto-manage service process if installed)

### Quick Start
1. Clone or navigate to the repository:
   ```bash
   cd "c:\Users\nkonr\Documents\AI Agents\Agentic_Engineering\my_experiments\my-apps\Agent with_RAG NK"
   ```

2. Activate your virtual environment:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Verify or update your `.env` configuration file:
   ```env
   GEMINI_API_KEY=your_google_ai_studio_api_key_here
   GEMINI_MODEL=gemma-4-26b-a4b-it
   PORT=8005
   ```

---

## 🏃 Starting & Stopping Services

### Starting the Web App
Run the application using Python:
```bash
python app.py
```

To run on a custom port (e.g. port 5000):
```bash
python app.py --port 5000
```

Upon startup, the application automatically:
- Checks if local Ollama is running (and launches `ollama serve` if needed).
- Scans `skills/` directory and indexes skill SOPs into ChromaDB `skills_store`.
- Ingests default sample documents from `sample_docs/` if `documents_store` is empty.
- Serves the application UI at **http://localhost:8005**.

### Shutting Down Services
- **GUI Shutdown Button**: Click **"Shutdown"** in the top right header of the web app, type `shutdown the service` (case-insensitive) in the text box, and click **"Confirm Shutdown"**. The UI displays a success confirmation modal and terminates the Flask process and background Ollama service.
- **Terminal**: Press `Ctrl + C` in the console running `app.py`.

---

## 🌐 REST API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /` | `GET` | Serves SPA `index.html` interface |
| `GET /api/health` | `GET` | Health status of Agent, Ollama, ChromaDB, Gemini services |
| `GET /api/models` | `GET` | Lists active text-generation models from Google AI Studio |
| `GET /api/skills` | `GET` | Returns catalog of available skill names |
| `POST /api/chat` | `POST` | Dispatches query to Custom Agent or Google ADK Agent |
| `GET /api/ingest/stats` | `GET` | Vector DB chunk count, document count, and DB size in MB |
| `GET /api/ingest/docs` | `GET` | List ingested documents in vector database |
| `POST /api/ingest/docs/delete` | `POST` | Delete specific document from vector store |
| `POST /api/ingest` | `POST` | Ingest URL or local file path into vector database |
| `POST /api/ingest/reset` | `POST` | Resets all ChromaDB collections |
| `POST /api/skills/update` | `POST` | Rescans `skills/` folder and updates skills store |
| `GET /api/embedding-models` | `GET` | Lists Ollama embedding models catalog |
| `POST /api/embedding-models/select` | `POST` | Switches active embedder model and wipes DB |
| `GET /api/telemetry` | `GET` | Retrieves telemetry metrics & time-series chart arrays |
| `GET /api/audit-logs/stats` | `GET` | Audit summary overview metrics |
| `GET /api/audit-logs/conversations` | `GET` | Grouped user conversation history |
| `GET /api/audit-logs/events` | `GET` | Event sequence for specific conversation ID |
| `POST /api/audit-logs/clear` | `POST` | Clears all logged audit events |
| `POST /api/shutdown` | `POST` | Graceful shutdown of services and Flask server |

---

## 📖 User Guide

### 1. Chat & Knowledge Synthesis Tab
- **Model Controls**: Select model (`gemma-4-26b-a4b-it`, `gemini-2.5-flash`, etc.) or choose *Custom Model* to enter an API endpoint.
- **Skill Selector**: Choose *Vector Store Selects* (with configurable similarity threshold), *LLM Selects*, or a specific skill.
- **Submitting Queries**: Ask questions requiring real-time weather, personnel registry search, stock market analysis, or document RAG.
- **Log Expander**: Click **"Show Logs"** on any response bubble to view turn-by-turn elapsed times, component icons, and detailed tool output.
- **Evidence Panel**: Inspect matched vector chunks and scores in the right panel.

### 2. Vector DB Ingestion Tab
- **Ingest Documents/URLs**: Enter a URL or local file path, configure chunk size and overlap, and click **Populate Vector Database**.
- **Sample Presets**: Use preset buttons for quick loading of marketing strategies, financial reports, or RAG guides.
- **Document Management**: Inspect chunk counts and total characters per document, or delete individual files.
- **Embedder Selector**: View installed Ollama embedding models. Selecting a new model opens a confirmation modal requiring typing `DELETE ALL DATA`.

### 3. Telemetry Tab
- **KPI Summary**: Track total prompts, responses, errors, and token counts.
- **Model Filter**: View metrics for specific models or *All Models*.
- **Chart.js Graphs**: Interactive time-series plots for prompt calls and token consumption across configurable intervals (`1 min`, `15 min`, `1 hr`, `1 day`).
- **Latency Benchmarks**: Review TTFT, ITL, TPS, and TPOT metrics.

### 4. Audit Log & Events Tab
- **Conversations Table**: View user conversation history (top 5 visible rows with scrollbar). Click any row to view its event sequence.
- **Events Table**: View chronological events for the selected conversation (Invoker, Target, Description).
- **JSON Payload Viewer**: Click any event row to open a full raw JSON payload modal viewer.
