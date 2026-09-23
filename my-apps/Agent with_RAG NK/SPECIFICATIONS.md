# Agent With RAG Specification & System Architecture

Build a web application to manage an AI Agent with RAG capability, multi-turn reasoning loops, local vector search via Ollama and ChromaDB, Google AI Studio integration, real-time telemetry metrics, and detailed audit log event inspection.

## 📂 Directory Architecture
The layout isolates domain procedural logic into standard structural boundaries:
```
Agent-with-RAG/
├── database/                   # Persistent ChromaDB collections & log.json
├── sample_docs/                # Pre-populated markdown and text documents
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
│   ├── time-weather-skill/
│   │   ├── SKILL.md            # Metadata & SOP for Time/Weather skill
│   │   └── scripts/
│   │       └── env_tools.py    # Public Open-Meteo & wttr.in time/weather tool
│   ├── person-information-skill/
│   │   ├── SKILL.md            # Metadata & SOP for Person Registry skill
│   │   ├── data/
│   │   │   └── registry.csv    # 20 flat-file employee registry records
│   │   └── scripts/
│   │       └── person_search.py# Personnel registry lookup tool
│   ├── stock-market-skill/
│   │   ├── SKILL.md            # Metadata & SOP for Stock Market skill
│   │   └── scripts/
│   │       └── stock_search.py # Stock gainers/losers market tool
│   └── document-rag-skill/
│       ├── SKILL.md            # Metadata & SOP for Document RAG skill
│       └── scripts/
│           └── doc_search.py   # Document vector DB search tool
├── static/                     # Web static assets
│   ├── css/
│   │   ├── styles.css          # Main modern CSS styling (clean white browser theme)
│   │   └── style.css           # High-contrast stylesheet
│   ├── images/
│   │   ├── app-icon.gif        # Main header app brand icon
│   │   └── tab-icon.gif        # Browser tab favicon icon
│   └── js/
│       └── main.js             # SPA frontend logic, shutdown controller & Chart.js integration
├── templates/
│   └── index.html              # Single Page Application HTML (4 tabs)
├── tests/                      # Unit & integration tests
├── app.py                      # Flask main entry point & REST endpoints
├── config.py                   # Environment configuration & defaults
├── requirements.txt            # Package declarations
└── README.md                   # System documentation & user guide
```

---

## GUI Architecture & Specifications

The App features 4 pages switchable via top navigation tabs:
- **Favicon & Iconography**: Uses `static/images/tab-icon.gif` for tab icon and `static/images/app-icon.gif` on the left of the main title.
- **Clean White Browser Theme**: Main viewport background set to clean white (`#ffffff`).
- **Header Shutdown Button**: Light-red button at top-right. Click opens warning modal requiring exact confirmation text `"Shutdown the service"` (case-insensitive). Upon confirmation, issues `/api/shutdown`, stops background services, terminates the Flask server, and updates the modal UI to display **"Services Shut Down Successfully"**.
- **Backend Status Monitor**: Periodically queries `/api/health` to monitor agent, Ollama, ChromaDB, and Gemini API statuses.

### 1. First Page: "Chat & Knowledge Synthesis"
- **Top Controls Bar**:
  - **Temperature**: Configurable float parameter (0.0 to 2.0).
  - **Max Tokens**: Configurable integer parameter (capped to model max).
  - **LLM Model Dropdown**: Lists active text-generation models from Google AI Studio (`gemma-4-26b-a4b-it`, `gemini-2.5-flash`, etc.) plus a `"Custom Model"` option. Selecting Custom Model shows an API Endpoint text box (default `http://127.0.0.1:8000/v1/chat/completions`).
- **Left Card: "Chat with the Agent"**:
  - **Agent Dropdown**: Choose between `"Custom Agent"` and `"Google ADK Agent"`.
  - **Max Turns**: Configurable loop limit (default 3, max 10).
  - **Skill Selector**: `"Vector Store Selects"` (default, displays similarity threshold box, default `0.2`), `"LLM Selects"`, or specific skill selection.
  - **Max RAG Chunks**: Configurable retrieval limit (default 5).
  - **Chat Area**: Displays chat message history. Response includes a **"Show Logs"** expander toggle button anchored at top-right of the detail box, displaying step component bubbles, icons, elapsed times, and scrollable step logs.
- **Right Card: "Retrieved Context Evidence"**:
  - **Doc Threshold Box**: Document retrieval similarity score cutoff (default `0.3`).
  - Displays retrieved skill and document vector matches grouped by document with matching similarity scores.

### 2. Second Page: "Vector DB Ingestion"
- **Top Controls & Statistics Bar**:
  - Ingestion stats: Total chunks, ingested documents, DB size in MByte.
  - **"Update Skills Database"** button: Scans `skills/` folder and loads new skills into `skills_store`.
  - **Active Embedder Dropdown**: Select Ollama embedding model (`nomic-embed-text`, `all-minilm`, etc.). Selecting a new model opens a warning modal requiring confirmation text `"DELETE ALL DATA"` to wipe database collections and switch embedder.
- **Left Card: "Populate Vector Database"**:
  - URL or local file directory input box.
  - 5 preset sample web URL / document buttons.
  - Collapsible **"Advanced Chunking Parameters"** sub-card (Chunk size and overlap in characters).
  - **"Populate Vector Database"** button with deduplication checks.
- **Right Card: "Vector Storage Status"**:
  - **"Reset DB"** button, ingestion progress indicator, list of ingested documents (chunk count, total characters, per-document delete button).
- **Bottom Section: "Available Embedding Models"**:
  - Catalog of Ollama embedding models with dimensions, context window, size, description, and status (*Active*, *Installed*, *Available*).

### 3. Third Page: "Telemetry"
- **Header Controls**: Model filter dropdown (*All Models* + used models list), **"Refresh Telemetry"** button.
- **Summary KPI Counters**: Total Prompts, Total Responses, Total Errors, Input Tokens, Output Tokens.
- **Top Card: "System Throughput & Token Velocity"**:
  - Aggregation interval dropdown (`1 min`, `15 min` [default], `1 hr`, `1 day`).
  - Time range dropdown (`Last hr`, `1 day` [default], `Week`, `Month`, `Custom`).
  - Two Chart.js line plots: (1) Prompts, Responses & Errors per interval, (2) Input & Output Tokens per interval.
- **Bottom Card: "Advanced Low-Level Latency Metrics"**:
  - Metrics display for Time to First Token (TTFT), Inter-Token Latency (ITL), Tokens Per Second (TPS), and Time Per Output Token (TPOT).

### 4. Fourth Page: "Audit Log & Event"
- **Header Controls**: **"Refresh"** button, **"Clear Logs"** button with confirmation modal.
- **Top Table: "User Conversations"**:
  - Displays user conversations (Timestamp, Conversation ID, User Query, Agent Response, Agent Type, Event Count).
  - Paginated / scrollable (5 visible rows max). Click highlights row and filters bottom event sequence table.
- **Bottom Table: "Events for Conversation"**:
  - Chronological event sequence (Time & Date, Event Type, Invoker, Target, Short Description).
  - Click row opens modal viewer displaying detailed log payload in formatted JSON viewer mode.

---

## ⚙️ Backend Requirements & Logic

### Configuration & Environment
- Imports `GEMINI_API_KEY`, `GEMINI_MODEL`, and `PORT` from `.env`.
- Default `PORT` is `8005` (from `.env`) or `5000` (overridable via `--port` CLI argument).
- Default LLM model is `DEFAULT_LLM_MODEL = 'gemma-4-26b-a4b-it'`.
- Background Ollama service process checking on startup; started automatically if not running and shut down on app exit if started by app.

### Custom Agent Execution Flow
1. Sets `agent_type` to `"Custom Agent"`.
2. Queries `skills_store` vector collection for matching skills above threshold.
3. If no skills found, executes simple prompt LLM completion.
4. If skills found, passes top skills SOPs to LLM asking if procedural tool execution is required in JSON format:
   ```json
   {
     "tool": "module_name.function_name",
     "arguments": { "arg1": "val1" }
   }
   ```
5. Executes tool dynamically via `skill_service.execute_tool`, appends tool output to context, sets `tool_executed = True`, and executes a final synthesis turn using explicit plain-text system prompt instructions to produce the formatted final answer.

### Google ADK Agent
1. Sets `agent_type` to `"Google ADK Agent"`.
2. Uses Google ADK `LlmAgent` workflow leveraging available skills/tools and model selected in Chat page, recording structured step logs and audit events.

### Audit Payload Logging
- Logs stored in `database/log.json` in JSON format.
- API keys redacted with `"****"`.
- Records time, event type (`agent`, `skill_search`, `document_search`, `tool`, `LLM`, `ollama_embed`), invoker, target, payload, input/output tokens, and latency.
