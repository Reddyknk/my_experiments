def search_document_vector_db(query, max_chunks=5, threshold=0.3):
    """
    Retrieves document chunks from ChromaDB document store using vector search.
    """
    try:
        from services.chroma_service import chroma_service
        results = chroma_service.query_documents(query=query, n_results=max_chunks, min_score=threshold)
        return {
            "status": "success",
            "query": query,
            "threshold": threshold,
            "total_chunks_returned": len(results),
            "chunks": results
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to search document vector DB: {str(e)}"}

if __name__ == "__main__":
    print(search_document_vector_db("marketing strategy"))
