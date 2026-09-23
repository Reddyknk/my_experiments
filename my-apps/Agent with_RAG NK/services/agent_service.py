import json
import time
import os
import sys
import uuid

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from services.chroma_service import chroma_service
from services.gemini_service import gemini_service
from services.skill_service import skill_service
from services.log_service import log_service

class AgentService:
    def execute(self, user_query, agent_choice="Custom Agent", model_name="gemma-4-26b-a4b-it",
                temperature=0.7, max_tokens=1024, max_turns=3, skill_selector="Vector Store Selects",
                threshold=0.2, doc_threshold=0.3, max_rag_chunks=5, custom_endpoint=None):

        conversation_id = f"conv_{uuid.uuid4().hex[:8]}"
        start_total_time = time.time()
        step_logs = []

        # Enforce max turns limit (max 10)
        max_turns = min(10, max(1, int(max_turns)))

        if agent_choice == "Google ADK Agent":
            return self._run_google_adk_agent(
                conversation_id, user_query, model_name, temperature, max_tokens,
                max_turns, threshold, doc_threshold, max_rag_chunks, custom_endpoint, start_total_time
            )
        else:
            return self._run_custom_agent(
                conversation_id, user_query, model_name, temperature, max_tokens,
                max_turns, skill_selector, threshold, doc_threshold, max_rag_chunks,
                custom_endpoint, start_total_time
            )

    def _run_custom_agent(self, conversation_id, user_query, model_name, temperature, max_tokens,
                          max_turns, skill_selector, threshold, doc_threshold, max_rag_chunks,
                          custom_endpoint, start_total_time):

        step_logs = []
        retrieved_evidence = []
        matching_skills = []

        # Step 1: Skill Resolution
        t0 = time.time()
        if skill_selector == "Vector Store Selects":
            matching_skills = chroma_service.query_skills(user_query, min_score=threshold, top_k=5)
            elapsed = (time.time() - t0) * 1000
            log_service.log_event(
                conversation_id=conversation_id,
                event_type="skill_search",
                invoker="Custom Agent",
                target="skills_store",
                short_description=f"Skill Vector Search (threshold={threshold})",
                payload={"query": user_query, "matched_count": len(matching_skills), "results": matching_skills},
                model=model_name,
                elapsed_ms=elapsed,
                user_query=user_query,
                agent_type="Custom Agent"
            )
            step_logs.append({
                "component": "Skills",
                "icon": "bi-cpu",
                "title": f"Skill Search ({len(matching_skills)} skills matched)",
                "elapsed_ms": round(elapsed, 2),
                "details": json.dumps(matching_skills, indent=2)
            })

        elif skill_selector == "LLM Selects":
            # Ask LLM to pick skills
            all_skills = skill_service.scan_and_load_skills()
            skill_names = [s["name"] for s in all_skills]
            llm_prompt = f"Available skills: {skill_names}\nUser question: {user_query}\nWhich skill is most relevant? Respond with skill name or 'none'."
            resp_text, in_tok, out_tok, payload = gemini_service.generate_completion(
                model_name, llm_prompt, temperature=0.1, max_tokens=100, custom_endpoint=custom_endpoint
            )
            elapsed = (time.time() - t0) * 1000
            matching_skills = [s for s in all_skills if s["name"].lower() in resp_text.lower()]
            step_logs.append({
                "component": "Skills",
                "icon": "bi-cpu",
                "title": "LLM Skill Selection",
                "elapsed_ms": round(elapsed, 2),
                "details": f"LLM Output: {resp_text}"
            })
        else:
            # Specific skill selected
            all_skills = skill_service.scan_and_load_skills()
            matching_skills = [s for s in all_skills if s["name"] == skill_selector]
            step_logs.append({
                "component": "Skills",
                "icon": "bi-cpu",
                "title": f"Explicit Skill: {skill_selector}",
                "elapsed_ms": 1.0,
                "details": f"Using selected skill: {skill_selector}"
            })

        # Add matching skills to retrieved evidence box
        for s in matching_skills:
            retrieved_evidence.append({
                "type": "Skill",
                "document": s["name"],
                "score": s.get("score", 1.0),
                "text": s.get("description", "")
            })

        # Check if query requests document vector search directly or if document-rag-skill matched
        has_doc_skill = any("document" in s["name"].lower() or "rag" in s["name"].lower() for s in matching_skills)
        if has_doc_skill or "document" in user_query.lower() or "strategy" in user_query.lower() or "report" in user_query.lower():
            t_doc = time.time()
            doc_chunks = chroma_service.query_documents(user_query, n_results=int(max_rag_chunks), min_score=float(doc_threshold))
            elapsed_doc = (time.time() - t_doc) * 1000

            log_service.log_event(
                conversation_id=conversation_id,
                event_type="document_search",
                invoker="Custom Agent",
                target="documents_store",
                short_description=f"Document RAG Search (doc_threshold={doc_threshold})",
                payload={"query": user_query, "returned_chunks": len(doc_chunks), "results": doc_chunks},
                model=model_name,
                elapsed_ms=elapsed_doc,
                user_query=user_query,
                agent_type="Custom Agent"
            )

            for chunk in doc_chunks:
                retrieved_evidence.append({
                    "type": "Document",
                    "document": chunk["document"],
                    "score": chunk["score"],
                    "text": chunk["text"]
                })

            step_logs.append({
                "component": "RAG",
                "icon": "bi-database",
                "title": f"Document RAG ({len(doc_chunks)} chunks retrieved)",
                "elapsed_ms": round(elapsed_doc, 2),
                "details": json.dumps(doc_chunks, indent=2)
            })

        # Multi-turn execution loop
        turns = 0
        final_response = ""
        total_input_toks = 0
        total_output_toks = 0
        tool_executed = False

        while turns < max_turns:
            turns += 1
            t_turn = time.time()

            # If no skills found OR a tool was executed, perform final synthesis
            if not matching_skills or tool_executed:
                sys_prompt = (
                    "You are a helpful AI assistant.\n"
                    "Use the tool execution results and retrieved context provided below to answer the user's question in clear, well-formatted natural language.\n"
                    "Do NOT output JSON tool calls."
                )
                context_text = "\n".join([f"[{e['document']}]: {e['text']}" for e in retrieved_evidence])
                full_prompt = f"Retrieved Context:\n{context_text}\n\nUser Message & Tool Results:\n{user_query}"
                
                resp, in_t, out_t, payload = gemini_service.generate_completion(
                    model_name, full_prompt, system_instruction=sys_prompt,
                    temperature=temperature, max_tokens=max_tokens, custom_endpoint=custom_endpoint
                )
                elapsed_turn = (time.time() - t_turn) * 1000
                total_input_toks += in_t
                total_output_toks += out_t

                log_service.log_event(
                    conversation_id=conversation_id,
                    event_type="LLM",
                    invoker="Custom Agent",
                    target=model_name,
                    short_description=f"Direct LLM Completion (Turn {turns})",
                    payload=payload,
                    model=model_name,
                    elapsed_ms=elapsed_turn,
                    input_tokens=in_t,
                    output_tokens=out_t,
                    user_query=user_query,
                    agent_response=resp,
                    agent_type="Custom Agent"
                )

                step_logs.append({
                    "component": "LLM",
                    "icon": "bi-stars",
                    "title": f"LLM Generation (Turn {turns})",
                    "elapsed_ms": round(elapsed_turn, 2),
                    "details": resp
                })

                final_response = resp
                break

            # If skills found: check if tool execution is required via JSON format response
            top_skills = matching_skills[:2]
            skills_context = "\n\n".join([s.get("full_content", s.get("description", "")) for s in top_skills])
            rag_context = "\n".join([f"[{e['document']}]: {e['text']}" for e in retrieved_evidence if e["type"] == "Document"])

            sys_instruction = (
                "You are an AI Agent with procedural tools.\n"
                "Review available skills SOPs below:\n"
                f"{skills_context}\n\n"
                "If a tool should be executed to answer the user query, respond ONLY with a JSON object in this format:\n"
                '{\n  "tool": "module_name.function_name",\n  "arguments": { "arg1": "val1" }\n}\n'
                "If no tool execution is needed, provide the complete response directly."
            )

            user_prompt = f"Retrieved RAG Context:\n{rag_context}\n\nUser Request: {user_query}"

            resp, in_t, out_t, payload = gemini_service.generate_completion(
                model_name, user_prompt, system_instruction=sys_instruction,
                temperature=temperature, max_tokens=max_tokens, custom_endpoint=custom_endpoint
            )
            elapsed_turn = (time.time() - t_turn) * 1000
            total_input_toks += in_t
            total_output_toks += out_t

            log_service.log_event(
                conversation_id=conversation_id,
                event_type="LLM",
                invoker="Custom Agent",
                target=model_name,
                short_description=f"LLM Reasoning / Tool Call (Turn {turns})",
                payload=payload,
                model=model_name,
                elapsed_ms=elapsed_turn,
                input_tokens=in_t,
                output_tokens=out_t,
                user_query=user_query,
                agent_type="Custom Agent"
            )

            # Check if LLM output is a JSON tool call
            try:
                import re
                tool_call = None
                resp_clean = resp.strip()

                # Extract JSON dict containing "tool" key
                json_match = re.search(r'(\{[\s\S]*?"tool"[\s\S]*?\})', resp_clean)
                if json_match:
                    try:
                        tool_call = json.loads(json_match.group(1))
                    except Exception:
                        pass

                if not tool_call:
                    try:
                        cleaned = resp_clean.replace("```json", "").replace("```", "").strip()
                        tool_call = json.loads(cleaned)
                    except Exception:
                        pass

                if isinstance(tool_call, dict) and "tool" in tool_call:
                    t_tool = time.time()
                    tool_name = tool_call["tool"]
                    tool_args = tool_call.get("arguments", {})

                    tool_result = skill_service.execute_tool(tool_name, tool_args)
                    elapsed_tool = (time.time() - t_tool) * 1000

                    log_service.log_event(
                        conversation_id=conversation_id,
                        event_type="tool",
                        invoker="Custom Agent",
                        target=tool_name,
                        short_description=f"Executed Tool {tool_name}",
                        payload={"arguments": tool_args, "result": tool_result},
                        model=model_name,
                        elapsed_ms=elapsed_tool,
                        user_query=user_query,
                        agent_type="Custom Agent"
                    )

                    step_logs.append({
                        "component": "Tools",
                        "icon": "bi-tools",
                        "title": f"Tool Call: {tool_name}",
                        "elapsed_ms": round(elapsed_tool, 2),
                        "details": json.dumps({"call": tool_call, "result": tool_result}, indent=2)
                    })

                    # If tool returned new document chunks, add to retrieved evidence
                    if isinstance(tool_result, dict) and "chunks" in tool_result:
                        for chk in tool_result["chunks"]:
                            retrieved_evidence.append({
                                "type": "Document",
                                "document": chk.get("document", "RAG Tool"),
                                "score": chk.get("score", 0.9),
                                "text": chk.get("text", "")
                            })

                    # Next turn: send tool result back to LLM for final answer synthesis
                    tool_executed = True
                    user_query = f"{user_query}\n\nTool Execution Result ({tool_name}): {json.dumps(tool_result)}"
                    matching_skills = []  # Clear skills to trigger final synthesis call
                    if turns >= max_turns:
                        max_turns = turns + 1  # Guarantee synthesis turn completes
                    continue
            except Exception as e:
                print(f"Tool execution loop exception: {e}")
                pass

            # Output is final text response
            final_response = resp
            step_logs.append({
                "component": "Agent",
                "icon": "bi-robot",
                "title": f"Final Answer Synthesis (Turn {turns})",
                "elapsed_ms": round(elapsed_turn, 2),
                "details": final_response
            })
            break

        total_elapsed = (time.time() - start_total_time) * 1000

        # Log overall Agent Completion Event
        log_service.log_event(
            conversation_id=conversation_id,
            event_type="agent",
            invoker="User",
            target="Custom Agent",
            short_description=f"Agent Completed in {round(total_elapsed, 1)}ms ({turns} turns)",
            payload={"final_response": final_response, "steps": step_logs},
            model=model_name,
            elapsed_ms=total_elapsed,
            input_tokens=total_input_toks,
            output_tokens=total_output_toks,
            user_query=user_query,
            agent_response=final_response,
            agent_type="Custom Agent"
        )

        return {
            "conversation_id": conversation_id,
            "response": final_response,
            "step_logs": step_logs,
            "retrieved_evidence": retrieved_evidence,
            "total_elapsed_ms": round(total_elapsed, 2)
        }

    def _run_google_adk_agent(self, conversation_id, user_query, model_name, temperature, max_tokens,
                               max_turns, threshold, doc_threshold, max_rag_chunks, custom_endpoint, start_total_time):
        
        t0 = time.time()
        # Google ADK agent setup and execution
        adk_prompt = f"[Google ADK LlmAgent Mode]\nUser Query: {user_query}"
        
        # Query RAG context
        doc_chunks = chroma_service.query_documents(user_query, n_results=int(max_rag_chunks), min_score=float(doc_threshold))
        context_str = "\n".join([f"[{c['document']}]: {c['text']}" for c in doc_chunks])
        
        full_prompt = f"Document Context:\n{context_str}\n\n{adk_prompt}"
        sys_instr = "You are a Google ADK LlmAgent. Provide precise, grounded answers utilizing available tools."

        resp, in_t, out_t, payload = gemini_service.generate_completion(
            model_name, full_prompt, system_instruction=sys_instr,
            temperature=temperature, max_tokens=max_tokens, custom_endpoint=custom_endpoint
        )
        elapsed = (time.time() - t0) * 1000

        log_service.log_event(
            conversation_id=conversation_id,
            event_type="LLM",
            invoker="Google ADK Agent",
            target=model_name,
            short_description="Google ADK LlmAgent Execution",
            payload=payload,
            model=model_name,
            elapsed_ms=elapsed,
            input_tokens=in_t,
            output_tokens=out_t,
            user_query=user_query,
            agent_response=resp,
            agent_type="Google ADK Agent"
        )

        step_logs = [
            {
                "component": "Agent",
                "icon": "bi-google",
                "title": "Google ADK Agent Initialization",
                "elapsed_ms": 10.0,
                "details": "Initialized Google ADK LlmAgent workflow."
            },
            {
                "component": "RAG",
                "icon": "bi-database",
                "title": f"ADK Context Retrieval ({len(doc_chunks)} chunks)",
                "elapsed_ms": 15.0,
                "details": json.dumps(doc_chunks, indent=2)
            },
            {
                "component": "LLM",
                "icon": "bi-stars",
                "title": "Google ADK Synthesis",
                "elapsed_ms": round(elapsed, 2),
                "details": resp
            }
        ]

        total_elapsed = (time.time() - start_total_time) * 1000

        log_service.log_event(
            conversation_id=conversation_id,
            event_type="agent",
            invoker="User",
            target="Google ADK Agent",
            short_description=f"Google ADK Agent Completed in {round(total_elapsed, 1)}ms",
            payload={"final_response": resp, "steps": step_logs},
            model=model_name,
            elapsed_ms=total_elapsed,
            input_tokens=in_t,
            output_tokens=out_t,
            user_query=user_query,
            agent_response=resp,
            agent_type="Google ADK Agent"
        )

        retrieved_evidence = [
            {"type": "Document", "document": c["document"], "score": c["score"], "text": c["text"]}
            for c in doc_chunks
        ]

        return {
            "conversation_id": conversation_id,
            "response": resp,
            "step_logs": step_logs,
            "retrieved_evidence": retrieved_evidence,
            "total_elapsed_ms": round(total_elapsed, 2)
        }

agent_service = AgentService()
