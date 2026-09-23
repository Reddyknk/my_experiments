document.addEventListener("DOMContentLoaded", () => {
    // App State
    let activeTab = "chat-page";
    let chartCallsInstance = null;
    let chartTokensInstance = null;
    let pendingEmbedderModel = null;
    let selectedConversationId = null;

    // Elements
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPages = document.querySelectorAll(".tab-page");

    // Initialize
    initTabs();
    initHealthCheck();
    initChatPage();
    initIngestionPage();
    initTelemetryPage();
    initAuditPage();
    initShutdownModal();

    // Periodic Health Check every 10 seconds
    setInterval(checkHealth, 10000);

    /* ----------------------------------------------------
       TABS NAVIGATION
    ---------------------------------------------------- */
    function initTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-tab");
                tabBtns.forEach(b => b.classList.remove("active"));
                tabPages.forEach(p => p.classList.remove("active"));

                btn.classList.add("active");
                const pageEl = document.getElementById(target);
                if (pageEl) pageEl.classList.add("active");
                activeTab = target;

                // Tab specific refresh hooks
                if (target === "ingestion-page") refreshIngestionPage();
                if (target === "telemetry-page") refreshTelemetryData();
                if (target === "audit-page") refreshAuditPage();
            });
        });
    }

    /* ----------------------------------------------------
       HEALTH STATUS & SHUTDOWN MODAL
    ---------------------------------------------------- */
    async function checkHealth() {
        try {
            const res = await fetch("/api/health");
            const data = await res.json();
            const box = document.getElementById("healthStatusBox");
            const text = document.getElementById("healthStatusText");
            const ind = box.querySelector(".status-indicator");

            if (data.status === "healthy") {
                ind.className = "status-indicator online";
                text.textContent = `Active | Ollama: ${data.ollama_status} | DB: OK`;
            } else {
                ind.className = "status-indicator offline";
                text.textContent = "Services Degraded";
            }
        } catch (e) {
            const text = document.getElementById("healthStatusText");
            const ind = document.getElementById("healthStatusBox").querySelector(".status-indicator");
            if (ind) ind.className = "status-indicator offline";
            if (text) text.textContent = "Offline";
        }
    }

    function initHealthCheck() {
        checkHealth();
    }

    function initShutdownModal() {
        const trigger = document.getElementById("btnShutdownTrigger");
        const modal = document.getElementById("shutdownModal");
        const cancel = document.getElementById("btnCancelShutdown");
        const confirm = document.getElementById("btnConfirmShutdown");
        const input = document.getElementById("shutdownConfirmInput");

        trigger.addEventListener("click", () => {
            input.value = "";
            confirm.disabled = true;
            modal.classList.add("active");
        });

        cancel.addEventListener("click", () => modal.classList.remove("active"));

        input.addEventListener("input", () => {
            const typed = input.value.trim().toLowerCase();
            confirm.disabled = (typed !== "shutdown the service");
        });

        confirm.addEventListener("click", async () => {
            confirm.disabled = true;
            confirm.textContent = "Shutting down...";
            try {
                await fetch("/api/shutdown", { method: "POST" });
            } catch (e) {}

            document.getElementById("shutdownModal").querySelector(".modal-body").innerHTML = `
                <div style="text-align: center; color: #ef4444; padding: 20px;">
                    <i class="bi bi-power" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                    <h3 style="margin-top: 10px; font-weight: 700; color: #f8fafc;">Services Shut Down Successfully</h3>
                    <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 8px;">The Flask application and supporting services have been terminated. You can safely close this browser window.</p>
                </div>`;
            document.getElementById("btnCancelShutdown").style.display = "none";
            confirm.style.display = "none";
        });
    }

    /* ----------------------------------------------------
       PAGE 1: CHAT & SYNTHESIS
    ---------------------------------------------------- */
    function initChatPage() {
        const modelSelect = document.getElementById("modelSelect");
        const customGroup = document.getElementById("customEndpointGroup");
        const skillSelector = document.getElementById("skillSelector");
        const skillThreshGroup = document.getElementById("skillThresholdGroup");
        const chatInput = document.getElementById("chatInput");
        const btnSend = document.getElementById("btnSendChat");

        // Fetch Google AI Studio active models
        fetchModels();
        fetchSkillOptions();

        modelSelect.addEventListener("change", () => {
            if (modelSelect.value === "Custom Model") {
                customGroup.style.display = "flex";
            } else {
                customGroup.style.display = "none";
            }
        });

        skillSelector.addEventListener("change", () => {
            if (skillSelector.value === "Vector Store Selects") {
                skillThreshGroup.style.display = "flex";
            } else {
                skillThreshGroup.style.display = "none";
            }
        });

        btnSend.addEventListener("click", sendChatMessage);
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendChatMessage();
        });
    }

    async function fetchModels() {
        const modelSelect = document.getElementById("modelSelect");
        try {
            const res = await fetch("/api/models");
            const data = await res.json();
            modelSelect.innerHTML = "";

            data.models.forEach(m => {
                const opt = document.createElement("option");
                opt.value = m;
                opt.textContent = m;
                if (m === data.default) opt.selected = true;
                modelSelect.appendChild(opt);
            });

            // Add Custom Model option
            const customOpt = document.createElement("option");
            customOpt.value = "Custom Model";
            customOpt.textContent = "Custom Model (API Endpoint)";
            modelSelect.appendChild(customOpt);
        } catch (e) {
            modelSelect.innerHTML = '<option value="gemma-4-26b-a4b-it">gemma-4-26b-a4b-it</option><option value="Custom Model">Custom Model</option>';
        }
    }

    async function fetchSkillOptions() {
        const skillSelector = document.getElementById("skillSelector");
        try {
            const res = await fetch("/api/skills");
            const data = await res.json();
            
            // Keep first two static options
            const currentOpts = Array.from(skillSelector.options).slice(0, 2);
            skillSelector.innerHTML = "";
            currentOpts.forEach(o => skillSelector.appendChild(o));

            data.skills.forEach(skillName => {
                const opt = document.createElement("option");
                opt.value = skillName;
                opt.textContent = skillName;
                skillSelector.appendChild(opt);
            });
        } catch (e) {}
    }

    async function sendChatMessage() {
        const chatInput = document.getElementById("chatInput");
        const query = chatInput.value.trim();
        if (!query) return;

        chatInput.value = "";
        const messagesContainer = document.getElementById("chatMessages");

        // Clear placeholder
        const placeholder = messagesContainer.querySelector(".chat-placeholder");
        if (placeholder) placeholder.remove();

        // Render User Message Bubble
        const userBubble = document.createElement("div");
        userBubble.className = "chat-bubble user";
        userBubble.textContent = query;
        messagesContainer.appendChild(userBubble);

        // Render Agent Loading Indicator
        const loadingBubble = document.createElement("div");
        loadingBubble.className = "chat-bubble agent loading";
        loadingBubble.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Agent synthesising reasoning plan...';
        messagesContainer.appendChild(loadingBubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Gather Parameters
        const payload = {
            query: query,
            model: document.getElementById("modelSelect").value,
            temperature: parseFloat(document.getElementById("temperatureInput").value),
            max_tokens: parseInt(document.getElementById("maxTokensInput").value),
            custom_endpoint: document.getElementById("customEndpointInput").value,
            agent_choice: document.getElementById("agentChoiceSelect").value,
            max_turns: parseInt(document.getElementById("maxTurnsInput").value),
            skill_selector: document.getElementById("skillSelector").value,
            threshold: parseFloat(document.getElementById("skillThresholdInput").value),
            doc_threshold: parseFloat(document.getElementById("docThresholdInput").value),
            max_rag_chunks: parseInt(document.getElementById("maxRagChunksSelect").value)
        };

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            loadingBubble.remove();

            // Render Agent Response Bubble with Detail Expand Box
            const agentBubble = document.createElement("div");
            agentBubble.className = "chat-bubble agent";

            let html = `<div>${data.response || "No response received."}</div>`;

            // Specification requirement: Detail box with "Show Logs" button top-right toggling expandable log steps
            if (data.step_logs && data.step_logs.length > 0) {
                const logBoxId = `logBox_${Date.now()}`;
                const contentId = `logContent_${Date.now()}`;

                let bubblesHtml = "";
                let detailsText = "";

                data.step_logs.forEach(step => {
                    bubblesHtml += `
                        <div class="step-bubble">
                            <i class="bi ${step.icon}"></i>
                            <span>${step.title}</span>
                            <span class="step-elapsed">${step.elapsed_ms}ms</span>
                        </div>`;
                    detailsText += `[${step.component}] ${step.title} (${step.elapsed_ms}ms)\n${step.details}\n\n`;
                });

                html += `
                    <div class="log-detail-box" id="${logBoxId}">
                        <button class="btn-show-logs" onclick="toggleLogDetails('${contentId}', this)">Show Logs</button>
                        <div class="steps-bubbles-row">${bubblesHtml}</div>
                        <div class="logs-expanded-content" id="${contentId}">${escapeHtml(detailsText)}</div>
                    </div>`;
            }

            agentBubble.innerHTML = html;
            messagesContainer.appendChild(agentBubble);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Render Context Evidence Panel
            renderRetrievedEvidence(data.retrieved_evidence);

        } catch (e) {
            loadingBubble.remove();
            const errBubble = document.createElement("div");
            errBubble.className = "chat-bubble agent danger";
            errBubble.textContent = "Error invoking Agent: " + e.message;
            messagesContainer.appendChild(errBubble);
        }
    }

    window.toggleLogDetails = function(contentId, btn) {
        const content = document.getElementById(contentId);
        if (content.style.display === "block") {
            content.style.display = "none";
            btn.textContent = "Show Logs";
        } else {
            content.style.display = "block";
            btn.textContent = "Hide Logs";
        }
    };

    function renderRetrievedEvidence(evidenceList) {
        const container = document.getElementById("evidenceScrollArea");
        container.innerHTML = "";

        if (!evidenceList || evidenceList.length === 0) {
            container.innerHTML = '<div class="empty-evidence"><i class="bi bi-search"></i><p>No matches met distance threshold.</p></div>';
            return;
        }

        evidenceList.forEach(item => {
            const group = document.createElement("div");
            group.className = "evidence-group";
            group.innerHTML = `
                <div class="evidence-group-header">
                    <span><i class="bi ${item.type === 'Skill' ? 'bi-cpu-fill' : 'bi-file-earmark-text-fill'}"></i> ${item.document}</span>
                    <span class="score-badge">Score: ${item.score}</span>
                </div>
                <div class="evidence-text">${escapeHtml(item.text)}</div>`;
            container.appendChild(group);
        });
    }

    /* ----------------------------------------------------
       PAGE 2: VECTOR DB INGESTION
    ---------------------------------------------------- */
    function initIngestionPage() {
        const btnUpdateSkills = document.getElementById("btnUpdateSkillsDB");
        const btnPopulateDB = document.getElementById("btnPopulateDB");
        const btnResetDB = document.getElementById("btnResetDB");
        const embedderSelect = document.getElementById("embedderSelect");

        btnUpdateSkills.addEventListener("click", updateSkillsDatabase);
        btnPopulateDB.addEventListener("click", populateVectorDB);
        btnResetDB.addEventListener("click", resetDatabase);

        // Preset button clicks
        document.querySelectorAll(".btn-preset").forEach(btn => {
            btn.addEventListener("click", () => {
                document.getElementById("ingestSourceInput").value = btn.getAttribute("data-url");
            });
        });

        // Embedder change confirmation modal
        embedderSelect.addEventListener("change", (e) => {
            pendingEmbedderModel = embedderSelect.value;
            const modal = document.getElementById("embedderWarningModal");
            const input = document.getElementById("embedderConfirmInput");
            const confirm = document.getElementById("btnConfirmEmbedderDelete");

            input.value = "";
            confirm.disabled = true;
            modal.classList.add("active");
        });

        document.getElementById("btnCancelEmbedderChange").addEventListener("click", () => {
            document.getElementById("embedderWarningModal").classList.remove("active");
            refreshIngestionPage(); // Reset dropdown
        });

        document.getElementById("embedderConfirmInput").addEventListener("input", (e) => {
            const confirm = document.getElementById("btnConfirmEmbedderDelete");
            confirm.disabled = (e.target.value.trim() !== "DELETE ALL DATA");
        });

        document.getElementById("btnConfirmEmbedderDelete").addEventListener("click", async () => {
            const modal = document.getElementById("embedderWarningModal");
            modal.classList.remove("active");
            try {
                await fetch("/api/embedding-models/select", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model_name: pendingEmbedderModel })
                });
                refreshIngestionPage();
                alert("Database reset and embedding model updated.");
            } catch (e) {
                alert("Failed to update embedder model.");
            }
        });
    }

    async function refreshIngestionPage() {
        // Fetch stats
        try {
            const res = await fetch("/api/ingest/stats");
            const stats = await res.json();
            document.getElementById("statChunks").textContent = stats.num_chunks;
            document.getElementById("statDocs").textContent = stats.num_documents;
            document.getElementById("statDbSize").textContent = stats.db_size_mb + " MB";
        } catch (e) {}

        // Fetch ingested docs
        try {
            const res = await fetch("/api/ingest/docs");
            const docs = await res.json();
            renderIngestedDocs(docs);
        } catch (e) {}

        // Fetch Ollama embedding models catalog
        try {
            const res = await fetch("/api/embedding-models");
            const catalog = await res.json();
            renderEmbeddingModels(catalog);
        } catch (e) {}
    }

    function renderIngestedDocs(docs) {
        const container = document.getElementById("docListContainer");
        container.innerHTML = "";

        if (!docs || docs.length === 0) {
            container.innerHTML = '<div class="empty-docs">No ingested documents in vector database.</div>';
            return;
        }

        docs.forEach(doc => {
            const row = document.createElement("div");
            row.className = "doc-item-row";
            row.innerHTML = `
                <div class="doc-info">
                    <span class="doc-name">${doc.source}</span>
                    <span class="doc-meta">${doc.chunk_count} chunks | ${doc.total_chars} total characters</span>
                </div>
                <button class="btn-danger-sm" onclick="deleteDoc('${escapeHtml(doc.source)}')">
                    <i class="bi bi-trash"></i> Delete
                </button>`;
            container.appendChild(row);
        });
    }

    window.deleteDoc = async function(sourceName) {
        if (!confirm(`Delete all vector chunks for "${sourceName}"?`)) return;
        try {
            await fetch("/api/ingest/docs/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source_name: sourceName })
            });
            refreshIngestionPage();
        } catch (e) {
            alert("Failed to delete document.");
        }
    };

    async function populateVectorDB() {
        const sourceInput = document.getElementById("ingestSourceInput");
        const target = sourceInput.value.trim();
        if (!target) return alert("Please enter a URL or local file directory.");

        const progress = document.getElementById("ingestionProgress");
        progress.style.display = "flex";

        const payload = {
            target: target,
            chunk_size: parseInt(document.getElementById("chunkSizeInput").value),
            chunk_overlap: parseInt(document.getElementById("chunkOverlapInput").value)
        };

        try {
            const res = await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            progress.style.display = "none";
            alert(data.message);
            sourceInput.value = "";
            refreshIngestionPage();
        } catch (e) {
            progress.style.display = "none";
            alert("Error populating vector DB: " + e.message);
        }
    }

    async function updateSkillsDatabase() {
        try {
            const res = await fetch("/api/skills/update", { method: "POST" });
            const data = await res.json();
            alert(data.message);
            fetchSkillOptions();
            refreshIngestionPage();
        } catch (e) {
            alert("Error updating skills database.");
        }
    }

    async function resetDatabase() {
        if (!confirm("Are you sure you want to reset all document and skill vector databases?")) return;
        try {
            await fetch("/api/ingest/reset", { method: "POST" });
            refreshIngestionPage();
            alert("Vector databases successfully reset.");
        } catch (e) {
            alert("Error resetting database.");
        }
    }

    function renderEmbeddingModels(catalog) {
        const select = document.getElementById("embedderSelect");
        const grid = document.getElementById("embeddingModelsGrid");

        select.innerHTML = "";
        grid.innerHTML = "";

        catalog.forEach(item => {
            // Populate select dropdown
            const opt = document.createElement("option");
            opt.value = item.name;
            opt.textContent = `${item.name} (${item.status})`;
            if (item.status === "Active") opt.selected = true;
            select.appendChild(opt);

            // Populate cards grid
            const card = document.createElement("div");
            card.className = `model-card ${item.status === 'Active' ? 'active-model' : ''}`;
            card.innerHTML = `
                <div class="model-card-header">
                    <h3>${item.name}</h3>
                    <span class="badge-status ${item.status}">${item.status}</span>
                </div>
                <div class="model-desc">${item.description}</div>
                <div class="model-specs">
                    <span>Dims: ${item.dimensions}</span>
                    <span>Context: ${item.context_window}</span>
                    <span>Size: ${item.size}</span>
                </div>`;
            grid.appendChild(card);
        });
    }

    /* ----------------------------------------------------
       PAGE 3: TELEMETRY
    ---------------------------------------------------- */
    function initTelemetryPage() {
        document.getElementById("btnRefreshTelemetry").addEventListener("click", refreshTelemetryData);
        document.getElementById("telemetryModelSelect").addEventListener("change", refreshTelemetryData);
        document.getElementById("intervalSelect").addEventListener("change", refreshTelemetryData);
        document.getElementById("timeRangeSelect").addEventListener("change", refreshTelemetryData);
    }

    async function refreshTelemetryData() {
        const model = document.getElementById("telemetryModelSelect").value;
        const interval = document.getElementById("intervalSelect").value;
        const timeRange = document.getElementById("timeRangeSelect").value;

        try {
            const res = await fetch(`/api/telemetry?model=${encodeURIComponent(model)}&interval=${encodeURIComponent(interval)}&time_range=${encodeURIComponent(timeRange)}`);
            const data = await res.json();

            // Populate filter models
            const modelSelect = document.getElementById("telemetryModelSelect");
            if (data.used_models && data.used_models.length > 0) {
                const currentVal = modelSelect.value;
                modelSelect.innerHTML = '<option value="All Models">All Models</option>';
                data.used_models.forEach(m => {
                    const opt = document.createElement("option");
                    opt.value = m; opt.textContent = m;
                    if (m === currentVal) opt.selected = true;
                    modelSelect.appendChild(opt);
                });
            }

            // KPIs
            document.getElementById("kpiPrompts").textContent = data.total_prompts;
            document.getElementById("kpiResponses").textContent = data.total_responses;
            document.getElementById("kpiErrors").textContent = data.total_errors;
            document.getElementById("kpiInputTokens").textContent = data.total_input_tokens;
            document.getElementById("kpiOutputTokens").textContent = data.total_output_tokens;

            // Low perf metrics
            if (data.low_perf_metrics) {
                document.getElementById("metricTTFT").textContent = data.low_perf_metrics.ttft_ms + " ms";
                document.getElementById("metricITL").textContent = data.low_perf_metrics.itl_ms + " ms";
                document.getElementById("metricTPS").textContent = data.low_perf_metrics.tps + " tok/s";
                document.getElementById("metricTPOT").textContent = data.low_perf_metrics.tpot_ms + " ms";
            }

            // Render Charts
            renderTelemetryCharts(data.time_series);
        } catch (e) {}
    }

    function renderTelemetryCharts(tsData) {
        if (!tsData) return;

        const ctxCalls = document.getElementById("chartCalls").getContext("2d");
        const ctxTokens = document.getElementById("chartTokens").getContext("2d");

        if (chartCallsInstance) chartCallsInstance.destroy();
        if (chartTokensInstance) chartTokensInstance.destroy();

        chartCallsInstance = new Chart(ctxCalls, {
            type: "line",
            data: {
                labels: tsData.labels,
                datasets: [
                    { label: "Prompts", data: tsData.prompts, borderColor: "#3b82f6", tension: 0.3, fill: false },
                    { label: "Responses", data: tsData.responses, borderColor: "#10b981", tension: 0.3, fill: false },
                    { label: "Errors", data: tsData.errors, borderColor: "#ef4444", tension: 0.3, fill: false }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#94a3b8" } } } }
        });

        chartTokensInstance = new Chart(ctxTokens, {
            type: "line",
            data: {
                labels: tsData.labels,
                datasets: [
                    { label: "Input Tokens", data: tsData.input_tokens, borderColor: "#8b5cf6", tension: 0.3, fill: false },
                    { label: "Output Tokens", data: tsData.output_tokens, borderColor: "#f59e0b", tension: 0.3, fill: false }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#94a3b8" } } } }
        });
    }

    /* ----------------------------------------------------
       PAGE 4: AUDIT LOG & EVENTS
    ---------------------------------------------------- */
    function initAuditPage() {
        document.getElementById("btnRefreshAudit").addEventListener("click", refreshAuditPage);
        document.getElementById("btnClearAuditLogs").addEventListener("click", clearAuditLogs);
        document.getElementById("btnCloseEventModal").addEventListener("click", () => {
            document.getElementById("eventDetailModal").classList.remove("active");
        });
    }

    async function refreshAuditPage() {
        // Fetch Audit Stats
        try {
            const res = await fetch("/api/audit-logs/stats");
            const stats = await res.json();
            const summary = document.getElementById("auditStatsSummary");
            summary.innerHTML = `
                <span>Prompts: <b>${stats.total_user_prompts}</b></span>
                <span>Model Calls: <b>${stats.model_calls}</b></span>
                <span>Embeds: <b>${stats.ollama_embeds}</b></span>
                <span>Avg Latency: <b>${stats.avg_call_latency_ms}ms</b></span>`;
        } catch (e) {}

        // Fetch Conversations
        try {
            const res = await fetch("/api/audit-logs/conversations");
            const convs = await res.json();
            renderConversationsTable(convs);
        } catch (e) {}
    }

    function renderConversationsTable(convs) {
        const tbody = document.getElementById("conversationsTable").querySelector("tbody");
        tbody.innerHTML = "";

        if (!convs || convs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No conversations recorded yet.</td></tr>';
            return;
        }

        convs.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.timestamp_local}</td>
                <td><code>${c.conversation_id}</code></td>
                <td>${escapeHtml(c.user_query || "-")}</td>
                <td>${escapeHtml((c.agent_response || "").substring(0, 60))}...</td>
                <td>${c.agent_type}</td>
                <td><span class="badge-status Installed">${c.num_events} events</span></td>`;

            tr.addEventListener("click", () => {
                document.querySelectorAll("#conversationsTable tbody tr").forEach(r => r.classList.remove("selected-row"));
                tr.classList.add("selected-row");
                selectedConversationId = c.conversation_id;
                loadEventsForConversation(c.conversation_id);
            });

            tbody.appendChild(tr);
        });
    }

    async function loadEventsForConversation(convId) {
        document.getElementById("eventsTableTitle").innerHTML = `<i class="bi bi-list-stars"></i> Events for Conversation <code>${convId}</code>`;
        try {
            const res = await fetch(`/api/audit-logs/events?conv_id=${convId}`);
            const events = await res.json();
            renderEventsTable(events);
        } catch (e) {}
    }

    function renderEventsTable(events) {
        const tbody = document.getElementById("eventsTable").querySelector("tbody");
        tbody.innerHTML = "";

        if (!events || events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No events found for this conversation.</td></tr>';
            return;
        }

        events.forEach(evt => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${evt.timestamp_local}</td>
                <td><span class="badge-status ${evt.is_error ? 'danger' : 'Active'}">${evt.event_type}</span></td>
                <td>${evt.invoker}</td>
                <td>${evt.target}</td>
                <td>${escapeHtml(evt.short_description)}</td>`;

            tr.addEventListener("click", () => openEventJSONViewer(evt));
            tbody.appendChild(tr);
        });
    }

    function openEventJSONViewer(evt) {
        const modal = document.getElementById("eventDetailModal");
        const title = document.getElementById("eventDetailTitle");
        const pills = document.getElementById("eventDetailMetaPills");
        const viewer = document.getElementById("eventJsonViewer");

        title.innerHTML = `<i class="bi bi-code-square"></i> Event Detail: ${evt.event_type} (${evt.invoker} &rarr; ${evt.target})`;
        pills.innerHTML = `
            <span class="step-bubble"><i class="bi bi-clock"></i> ${evt.timestamp_local}</span>
            <span class="step-bubble"><i class="bi bi-stopwatch"></i> ${evt.elapsed_ms}ms</span>
            <span class="step-bubble"><i class="bi bi-cpu"></i> ${evt.model}</span>`;

        viewer.textContent = JSON.stringify(evt, null, 2);
        modal.classList.add("active");
    }

    async function clearAuditLogs() {
        if (!confirm("Are you sure you want to clear all audit and event logs?")) return;
        try {
            await fetch("/api/audit-logs/clear", { method: "POST" });
            refreshAuditPage();
            document.getElementById("eventsTable").querySelector("tbody").innerHTML = '<tr><td colspan="5" class="text-center">Select a conversation row to view event log sequence.</td></tr>';
            alert("Audit logs cleared.");
        } catch (e) {
            alert("Failed to clear logs.");
        }
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
});
