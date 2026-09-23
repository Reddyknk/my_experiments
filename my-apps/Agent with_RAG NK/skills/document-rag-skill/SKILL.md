---
name: document-rag-skill
description: Get the list of text chunks from the document vector database. Search ingested corporate documents, financial reports, marketing strategies, and RAG technology guides.
trigger_queries:
  - "Search documents for financial report information"
  - "Get text chunks about marketing strategy"
  - "Query vector database for RAG concepts"
---

# Document RAG Skill
This tool searches the document vector database (ChromaDB) for semantic text chunks related to user queries.

## Executable Tool Function
- Python Function: `doc_search.search_document_vector_db(query, max_chunks, threshold)`
- Arguments:
  - `query` (string): Search query string.
  - `max_chunks` (integer, optional): Maximum number of text chunks to retrieve (default 5).
  - `threshold` (float, optional): Minimum similarity threshold (default 0.3).
