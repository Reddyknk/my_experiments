import argparse
import os
import sys
import threading
import time
from flask import Flask, render_template, request, jsonify

# Add root directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import config
from services.ollama_service import ollama_service
from services.chroma_service import chroma_service
from services.gemini_service import gemini_service
from services.skill_service import skill_service
from services.agent_service import agent_service
from services.log_service import log_service

app = Flask(__name__)

# --- STARTUP HOOKS ---
def perform_startup_tasks():
    print("Performing startup checks...")
    # 1. Check & start Ollama service if not running
    status, msg = ollama_service.ensure_service_started()
    print(f"[Ollama Service] {msg}")

    # 2. Scan and load skills into ChromaDB skills_store
    scanned_skills = skill_service.scan_and_load_skills()
    print(f"[Skill Service] Ingested/verified {len(scanned_skills)} skills into vector database.")

    # 3. Auto-ingest sample_docs if documents_store is empty
    stats = chroma_service.get_stats()
    if stats["num_chunks"] == 0 and config.SAMPLE_DOCS_DIR.exists():
        print("[Chroma Service] Ingesting default sample_docs/...")
        chroma_service.ingest_url_or_path(config.SAMPLE_DOCS_DIR)

# --- ROUTES ---

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/health", methods=["GET"])
def health_check():
    ollama_ok = ollama_service.is_running()
    return jsonify({
        "status": "healthy" if ollama_ok else "degraded",
        "ollama_status": "running" if ollama_ok else "stopped",
        "chroma_status": "active",
        "gemini_status": "configured" if config.GEMINI_API_KEY else "missing_key"
    })

@app.route("/api/models", methods=["GET"])
def get_models():
    active_models = gemini_service.list_active_models()
    return jsonify({
        "models": active_models,
        "default": config.DEFAULT_LLM_MODEL
    })

@app.route("/api/skills", methods=["GET"])
def get_skills():
    names = skill_service.get_all_skill_names()
    return jsonify({"skills": names})

@app.route("/api/chat", methods=["POST"])
def handle_chat():
    data = request.json or {}
    query = data.get("query", "")
    if not query:
        return jsonify({"error": "User query is required."}), 400

    result = agent_service.execute(
        user_query=query,
        agent_choice=data.get("agent_choice", "Custom Agent"),
        model_name=data.get("model", config.DEFAULT_LLM_MODEL),
        temperature=data.get("temperature", 0.7),
        max_tokens=data.get("max_tokens", 1024),
        max_turns=data.get("max_turns", 3),
        skill_selector=data.get("skill_selector", "Vector Store Selects"),
        threshold=data.get("threshold", 0.2),
        doc_threshold=data.get("doc_threshold", 0.3),
        max_rag_chunks=data.get("max_rag_chunks", 5),
        custom_endpoint=data.get("custom_endpoint")
    )
    return jsonify(result)

# Ingestion Routes
@app.route("/api/ingest/stats", methods=["GET"])
def get_ingest_stats():
    return jsonify(chroma_service.get_stats())

@app.route("/api/ingest/docs", methods=["GET"])
def get_ingested_docs():
    return jsonify(chroma_service.list_documents())

@app.route("/api/ingest/docs/delete", methods=["POST"])
def delete_ingested_doc():
    data = request.json or {}
    src = data.get("source_name")
    if not src:
        return jsonify({"error": "Source name required."}), 400
    success, msg = chroma_service.delete_document(src)
    return jsonify({"success": success, "message": msg})

@app.route("/api/ingest", methods=["POST"])
def ingest_data():
    data = request.json or {}
    target = data.get("target")
    chunk_size = int(data.get("chunk_size", 500))
    chunk_overlap = int(data.get("chunk_overlap", 50))

    if not target:
        return jsonify({"error": "Target URL or path required."}), 400

    success, msg = chroma_service.ingest_url_or_path(target, chunk_size, chunk_overlap)
    return jsonify({"success": success, "message": msg})

@app.route("/api/ingest/reset", methods=["POST"])
def reset_db():
    chroma_service.reset_database()
    skill_service.scan_and_load_skills()
    return jsonify({"success": True, "message": "Vector database reset."})

@app.route("/api/skills/update", methods=["POST"])
def update_skills_db():
    skills = skill_service.scan_and_load_skills()
    return jsonify({"success": True, "message": f"Scanned and updated {len(skills)} skills in database."})

# Embedding Models Routes
@app.route("/api/embedding-models", methods=["GET"])
def get_embedding_models():
    return jsonify(ollama_service.list_embedding_models())

@app.route("/api/embedding-models/select", methods=["POST"])
def select_embedding_model():
    data = request.json or {}
    model_name = data.get("model_name")
    if not model_name:
        return jsonify({"error": "Model name required."}), 400

    # Wipe vector databases as embedding dimension change invalidates existing vectors
    chroma_service.reset_database()
    ollama_service.active_embedding_model = model_name
    skill_service.scan_and_load_skills()
    return jsonify({"success": True, "message": f"Active embedding model changed to {model_name} and database reset."})

# Telemetry Routes
@app.route("/api/telemetry", methods=["GET"])
def get_telemetry():
    model = request.args.get("model", "All Models")
    interval = request.args.get("interval", "15 min")
    time_range = request.args.get("time_range", "1 day")

    stats = log_service.get_telemetry_stats(
        selected_model=model,
        interval=interval,
        time_range=time_range
    )
    return jsonify(stats)

# Audit Log Routes
@app.route("/api/audit-logs/stats", methods=["GET"])
def get_audit_stats():
    return jsonify(log_service.get_audit_summary())

@app.route("/api/audit-logs/conversations", methods=["GET"])
def get_audit_conversations():
    return jsonify(log_service.get_conversations())

@app.route("/api/audit-logs/events", methods=["GET"])
def get_audit_events():
    conv_id = request.args.get("conv_id")
    if not conv_id:
        return jsonify([])
    return jsonify(log_service.get_events_for_conversation(conv_id))

@app.route("/api/audit-logs/clear", methods=["POST"])
def clear_audit_logs():
    log_service.clear_logs()
    return jsonify({"success": True, "message": "All audit logs cleared."})

@app.route("/api/shutdown", methods=["POST"])
def shutdown_service():
    print("Shutdown request received from web UI...")
    try:
        ollama_service.stop_service_if_started_by_app()
    except Exception as e:
        print(f"Error stopping Ollama service: {e}")

    def kill_server():
        time.sleep(0.5)
        print("Terminating server process...")
        os._exit(0)

    threading.Thread(target=kill_server).start()
    return jsonify({"success": True, "message": "Server shutting down..."})

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Agent with RAG Web Application")
    parser.add_argument("--port", type=int, default=config.PORT, help="Port to run Flask app on")
    args = parser.parse_args()

    perform_startup_tasks()

    print(f"Starting Agent with RAG server on port {args.port}...")
    app.run(host="0.0.0.0", port=args.port, debug=False)
