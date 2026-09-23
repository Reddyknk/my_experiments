import json
import os
import time
import datetime

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def redact_api_keys(data):
    """Recursively redact API keys from string or dict/list payload."""
    if isinstance(data, str):
        if config.GEMINI_API_KEY and config.GEMINI_API_KEY in data:
            data = data.replace(config.GEMINI_API_KEY, "****")
        return data
    elif isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            if "key" in k.lower() or "token" in k.lower() or "secret" in k.lower():
                new_dict[k] = "****"
            else:
                new_dict[k] = redact_api_keys(v)
        return new_dict
    elif isinstance(data, list):
        return [redact_api_keys(item) for item in data]
    return data

class LogService:
    def __init__(self, log_path=None):
        self.log_path = log_path or config.LOG_FILE_PATH

    def _read_logs(self):
        if not self.log_path.exists():
            return []
        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    return []
                return json.loads(content)
        except Exception:
            return []

    def _write_logs(self, logs):
        with open(self.log_path, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)

    def log_event(self, conversation_id, event_type, invoker, target, short_description, payload, model="gemma-4-26b-a4b-it", elapsed_ms=0, is_error=False, input_tokens=0, output_tokens=0, user_query="", agent_response="", agent_type="Custom Agent"):
        """Logs a discrete event into database/log.json."""
        cleaned_payload = redact_api_keys(payload)
        cleaned_query = redact_api_keys(user_query) if isinstance(user_query, str) else user_query
        cleaned_response = redact_api_keys(agent_response) if isinstance(agent_response, str) else agent_response

        timestamp_iso = datetime.datetime.now().isoformat()
        timestamp_local = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        entry = {
            "id": f"evt_{int(time.time()*1000)}",
            "timestamp": timestamp_iso,
            "timestamp_local": timestamp_local,
            "conversation_id": conversation_id,
            "event_type": event_type,  # 'agent', 'skill_search', 'document_search', 'tool', 'LLM', 'ollama_embed'
            "invoker": invoker,
            "target": target,
            "short_description": short_description,
            "payload": cleaned_payload,
            "model": model,
            "elapsed_ms": round(elapsed_ms, 2),
            "is_error": is_error,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "user_query": cleaned_query,
            "agent_response": cleaned_response,
            "agent_type": agent_type
        }

        logs = self._read_logs()
        logs.append(entry)
        self._write_logs(logs)
        return entry

    def clear_logs(self):
        """Deletes all logged events."""
        self._write_logs([])
        return True

    def get_audit_summary(self):
        """Returns overview statistics for Audit & Event page."""
        logs = self._read_logs()
        total_user_prompts = len(set(l['conversation_id'] for l in logs if l.get('user_query')))
        model_calls = len([l for l in logs if l.get('event_type') == 'LLM'])
        ollama_embeds = len([l for l in logs if l.get('event_type') in ('ollama_embed', 'skill_search', 'document_search')])
        latencies = [l['elapsed_ms'] for l in logs if l.get('elapsed_ms')]
        avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 0.0

        return {
            "total_user_prompts": total_user_prompts,
            "model_calls": model_calls,
            "ollama_embeds": ollama_embeds,
            "avg_call_latency_ms": avg_latency
        }

    def get_conversations(self):
        """Group events by conversation_id for Audit Log top table."""
        logs = self._read_logs()
        convs = {}
        for l in logs:
            cid = l.get("conversation_id")
            if not cid:
                continue
            if cid not in convs:
                convs[cid] = {
                    "conversation_id": cid,
                    "timestamp_local": l.get("timestamp_local", ""),
                    "user_query": "",
                    "agent_response": "",
                    "agent_type": l.get("agent_type", "Custom Agent"),
                    "num_events": 0,
                    "first_time": l.get("timestamp", "")
                }
            convs[cid]["num_events"] += 1
            if l.get("user_query") and not convs[cid]["user_query"]:
                convs[cid]["user_query"] = l["user_query"]
            if l.get("agent_response") and not convs[cid]["agent_response"]:
                convs[cid]["agent_response"] = l["agent_response"]
            if l.get("agent_type"):
                convs[cid]["agent_type"] = l["agent_type"]

        # Sort conversations by timestamp descending
        result = list(convs.values())
        result.sort(key=lambda x: x["first_time"], reverse=True)
        return result

    def get_events_for_conversation(self, conversation_id):
        """Returns events for a specific conversation ID sorted ascending by time."""
        logs = self._read_logs()
        matched = [l for l in logs if l.get("conversation_id") == conversation_id]
        matched.sort(key=lambda x: x.get("timestamp", ""))
        return matched

    def get_telemetry_stats(self, selected_model="All Models", interval="15 min", time_range="1 day", start_date=None, end_date=None):
        """Computes metrics and time-series line chart arrays for Telemetry page."""
        logs = self._read_logs()
        if selected_model and selected_model != "All Models":
            logs = [l for l in logs if l.get("model") == selected_model]

        total_prompts = len([l for l in logs if l.get("event_type") == "agent"])
        total_responses = len([l for l in logs if l.get("event_type") == "agent" and not l.get("is_error")])
        total_errors = len([l for l in logs if l.get("is_error")])
        total_input_tokens = sum(l.get("input_tokens", 0) for l in logs)
        total_output_tokens = sum(l.get("output_tokens", 0) for l in logs)

        # Used models list for filter dropdown
        used_models = sorted(list(set(l.get("model") for l in logs if l.get("model"))))

        # Time series grouping logic for graphs
        time_series = self._build_time_series(logs, interval)

        # Performance benchmarks / estimations for Low-Performance Computer card
        llm_logs = [l for l in logs if l.get("event_type") == "LLM" and l.get("elapsed_ms")]
        ttft_avg = 120.0  # Estimated ms
        itl_avg = 35.0    # Estimated ms per token
        tps_avg = 28.5    # Tokens per second
        tpot_avg = 35.0   # Time per output token ms

        if llm_logs:
            latencies = [l["elapsed_ms"] for l in llm_logs]
            avg_lat = sum(latencies) / len(latencies)
            out_toks = sum(l.get("output_tokens", 0) for l in llm_logs)
            if out_toks > 0:
                tps_avg = round(out_toks / (sum(latencies) / 1000.0), 2)
                tpot_avg = round(sum(latencies) / out_toks, 2)
                itl_avg = tpot_avg

        return {
            "used_models": used_models,
            "total_prompts": total_prompts,
            "total_responses": total_responses,
            "total_errors": total_errors,
            "total_input_tokens": total_input_tokens,
            "total_output_tokens": total_output_tokens,
            "time_series": time_series,
            "low_perf_metrics": {
                "ttft_ms": ttft_avg,
                "itl_ms": itl_avg,
                "tps": tps_avg,
                "tpot_ms": tpot_avg
            }
        }

    def _build_time_series(self, logs, interval="15 min"):
        """Groups logs into time intervals for Chart.js graphs."""
        if not logs:
            return {"labels": ["00:00"], "prompts": [0], "responses": [0], "errors": [0], "input_tokens": [0], "output_tokens": [0]}

        # Create time slots
        slots = {}
        for l in logs:
            ts_str = l.get("timestamp_local", "")[:16]  # "YYYY-MM-DD HH:MM"
            if not ts_str:
                continue
            if ts_str not in slots:
                slots[ts_str] = {"prompts": 0, "responses": 0, "errors": 0, "input_tokens": 0, "output_tokens": 0}
            if l.get("event_type") == "agent":
                slots[ts_str]["prompts"] += 1
                if not l.get("is_error"):
                    slots[ts_str]["responses"] += 1
            if l.get("is_error"):
                slots[ts_str]["errors"] += 1
            slots[ts_str]["input_tokens"] += l.get("input_tokens", 0)
            slots[ts_str]["output_tokens"] += l.get("output_tokens", 0)

        sorted_times = sorted(slots.keys())
        if not sorted_times:
            return {"labels": ["00:00"], "prompts": [0], "responses": [0], "errors": [0], "input_tokens": [0], "output_tokens": [0]}

        return {
            "labels": [t[-5:] for t in sorted_times],
            "prompts": [slots[t]["prompts"] for t in sorted_times],
            "responses": [slots[t]["responses"] for t in sorted_times],
            "errors": [slots[t]["errors"] for t in sorted_times],
            "input_tokens": [slots[t]["input_tokens"] for t in sorted_times],
            "output_tokens": [slots[t]["output_tokens"] for t in sorted_times]
        }

log_service = LogService()
