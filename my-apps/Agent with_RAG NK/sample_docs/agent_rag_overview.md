# AI Agents and Retrieval-Augmented Generation (RAG) Overview

## Introduction to AI Agents
An AI Agent is an autonomous entity that perceives its environment, makes decisions, and executes procedural tools to achieve specific goals. Unlike standalone Large Language Models (LLMs) that respond solely to static training data, AI agents operate in dynamic loops. They can decompose complex prompts into smaller steps, choose appropriate tools (such as database queries, web API requests, or vector retrievals), evaluate intermediate outcomes, and iterate until a final answer is synthesized.

## Retrieval-Augmented Generation (RAG) Architecture
Retrieval-Augmented Generation bridges external knowledge repositories with generative neural networks. Standard LLMs suffer from knowledge cutoff limits and potential hallucination when answering domain-specific or confidential questions. RAG addresses this by converting textual documents into dense mathematical vectors (embeddings) stored in high-performance spatial databases like ChromaDB.

### Core Steps in the RAG Pipeline:
1. **Document Ingestion & Chunking**: Unstructured documents (PDFs, Markdown, Webpages) are broken into semantic chunks of controlled size and overlap.
2. **Dense Embedding**: Each text chunk is passed through an embedding model (e.g., Ollama's `nomic-embed-text`) to create high-dimensional vector representations.
3. **Similarity Search**: When a user submits a prompt, the system embeds the query and retrieves the top-K nearest neighbors from the vector database based on cosine or L2 distance.
4. **Context Injection**: Retrieved passages are injected into the system prompt sent to the LLM, enabling accurate, grounded generation.

## Agent + RAG Synergy
When combined, AI Agents do not blindly run RAG on every input. Instead, the agent inspects available skill catalogs, determines if document context is required for a user's request, invokes document search tools on demand, and correlates facts across multiple sources.
