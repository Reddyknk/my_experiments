import hashlib
import os
import shutil
import sys
from pathlib import Path
import chromadb
from chromadb.config import Settings
import urllib.parse
import requests
from bs4 import BeautifulSoup

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from services.ollama_service import ollama_service

class ChromaEmbeddingFunction:
    """Custom embedding function bridging ChromaDB with Ollama Service."""
    def __init__(self, model_name=None):
        self.model_name = model_name

    def __call__(self, input):
        if isinstance(input, str):
            input = [input]
        embeddings = []
        for text in input:
            vec = ollama_service.get_embedding(text, model_name=self.model_name)
            embeddings.append(vec)
        return embeddings

class ChromaService:
    def __init__(self, db_dir=None):
        self.db_dir = db_dir or config.DATABASE_DIR
        self.client = None
        self.skills_col = None
        self.docs_col = None
        self._init_db()

    def _init_db(self):
        """Initializes ChromaDB persistent client and collections."""
        self.client = chromadb.PersistentClient(path=str(self.db_dir / "chroma"))
        emb_fn = ChromaEmbeddingFunction()
        
        self.skills_col = self.client.get_or_create_collection(
            name="skills_store",
            metadata={"hnsw:space": "cosine"}
        )
        self.docs_col = self.client.get_or_create_collection(
            name="documents_store",
            metadata={"hnsw:space": "cosine"}
        )

    def reset_database(self):
        """Wipes and re-initializes all collections in ChromaDB."""
        try:
            self.client.delete_collection("skills_store")
            self.client.delete_collection("documents_store")
        except Exception:
            pass
        self._init_db()
        return True

    def get_stats(self):
        """Calculates total chunks, ingested docs, and DB folder size in MB."""
        doc_count = 0
        chunk_count = 0
        try:
            chunk_count = self.docs_col.count()
            # Unique document names in metadata
            results = self.docs_col.get(include=["metadatas"])
            if results and results.get("metadatas"):
                unique_docs = set(m.get("source", "unknown") for m in results["metadatas"] if m)
                doc_count = len(unique_docs)
        except Exception:
            pass

        # Calculate DB folder size in MB
        size_bytes = 0
        chroma_folder = self.db_dir / "chroma"
        if chroma_folder.exists():
            for root, dirs, files in os.walk(chroma_folder):
                for f in files:
                    fp = os.path.join(root, f)
                    if os.path.exists(fp):
                        size_bytes += os.path.getsize(fp)

        size_mb = round(size_bytes / (1024 * 1024), 2)

        return {
            "num_chunks": chunk_count,
            "num_documents": doc_count,
            "db_size_mb": size_mb
        }

    def ingest_skills(self, skills_list):
        """
        Ingests skill SOPs into skills_store collection.
        skills_list: array of dicts {'name': ..., 'description': ..., 'full_content': ..., 'path': ...}
        """
        for skill in skills_list:
            name = skill['name']
            text_to_embed = f"Skill Name: {name}\nDescription: {skill['description']}"
            skill_id = f"skill_{name}"
            vec = ollama_service.get_embedding(text_to_embed)

            # Check if skill already present
            existing = self.skills_col.get(ids=[skill_id])
            if existing and existing.get("ids") and len(existing["ids"]) > 0:
                continue

            self.skills_col.add(
                ids=[skill_id],
                embeddings=[vec],
                documents=[skill['full_content']],
                metadatas=[{
                    "name": name,
                    "description": skill['description'],
                    "path": skill.get('path', '')
                }]
            )

    def query_skills(self, query_text, min_score=0.2, top_k=5):
        """Queries skills_store for matching skills above min_score threshold."""
        vec = ollama_service.get_embedding(query_text)
        res = self.skills_col.query(
            query_embeddings=[vec],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        matches = []
        if res and res.get("ids") and len(res["ids"][0]) > 0:
            ids = res["ids"][0]
            docs = res["documents"][0]
            metas = res["metadatas"][0]
            dists = res["distances"][0]

            for i in range(len(ids)):
                # Convert cosine distance to similarity score
                similarity = round(1.0 - (dists[i] if dists[i] is not None else 1.0), 3)
                # Normalizing score bounded between 0 and 1
                score = max(0.0, min(1.0, similarity))

                if score >= float(min_score):
                    matches.append({
                        "name": metas[i].get("name", ids[i]),
                        "description": metas[i].get("description", ""),
                        "score": score,
                        "full_content": docs[i]
                    })

        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches

    def ingest_text_document(self, source_name, content, chunk_size=500, chunk_overlap=50):
        """Chunks and ingests document content with hash deduplication."""
        # Simple text chunking by characters
        chunks = []
        start = 0
        text_len = len(content)

        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunk = content[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start += (chunk_size - chunk_overlap)
            if chunk_size <= chunk_overlap:
                break

        added_chunks = 0
        for idx, chunk in enumerate(chunks):
            # Compute hash for deduplication
            chunk_hash = hashlib.md5(f"{source_name}_{chunk}".encode('utf-8')).hexdigest()
            chunk_id = f"doc_{chunk_hash}"

            # Deduplication check
            existing = self.docs_col.get(ids=[chunk_id])
            if existing and existing.get("ids") and len(existing["ids"]) > 0:
                continue

            vec = ollama_service.get_embedding(chunk)
            self.docs_col.add(
                ids=[chunk_id],
                embeddings=[vec],
                documents=[chunk],
                metadatas=[{
                    "source": source_name,
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                    "char_count": len(chunk)
                }]
            )
            added_chunks += 1

        return len(chunks), added_chunks

    def ingest_url_or_path(self, target, chunk_size=500, chunk_overlap=50):
        """Ingests documents from URL or local directory / file path."""
        target_str = str(target).strip()

        if target_str.startswith("http://") or target_str.startswith("https://"):
            try:
                res = requests.get(target_str, timeout=10)
                if res.status_code == 200:
                    soup = BeautifulSoup(res.text, "html.parser")
                    # Strip scripts & styles
                    for s in soup(["script", "style", "nav", "footer"]):
                        s.extract()
                    text_content = soup.get_text(separator="\n")
                    total_chunks, added = self.ingest_text_document(
                        source_name=target_str,
                        content=text_content,
                        chunk_size=chunk_size,
                        chunk_overlap=chunk_overlap
                    )
                    return True, f"Successfully ingested URL {target_str} ({added} new chunks)."
                return False, f"HTTP Error {res.status_code} fetching URL."
            except Exception as e:
                return False, f"Failed to ingest URL: {str(e)}"

        p = Path(target_str)
        if not p.is_absolute():
            p = config.BASE_DIR / p

        if p.is_file():
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                total_chunks, added = self.ingest_text_document(
                    source_name=p.name,
                    content=content,
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap
                )
                return True, f"Successfully ingested file {p.name} ({added} new chunks)."
            except Exception as e:
                return False, f"Failed to read file: {str(e)}"

        elif p.is_dir():
            total_added = 0
            processed_files = 0
            for root, dirs, files in os.walk(p):
                for file in files:
                    if file.endswith((".txt", ".md", ".csv", ".json", ".html", ".py")):
                        fp = Path(root) / file
                        try:
                            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                                c = f.read()
                            _, added = self.ingest_text_document(
                                source_name=fp.name,
                                content=c,
                                chunk_size=chunk_size,
                                chunk_overlap=chunk_overlap
                            )
                            total_added += added
                            processed_files += 1
                        except Exception:
                            pass
            return True, f"Ingested {processed_files} files from directory ({total_added} new chunks)."
        else:
            return False, f"Target path {target_str} does not exist."

    def list_documents(self):
        """Lists ingested documents with chunk count and total characters."""
        docs_summary = {}
        try:
            results = self.docs_col.get(include=["metadatas"])
            if results and results.get("metadatas"):
                for m in results["metadatas"]:
                    if not m:
                        continue
                    src = m.get("source", "unknown")
                    if src not in docs_summary:
                        docs_summary[src] = {"source": src, "chunk_count": 0, "total_chars": 0}
                    docs_summary[src]["chunk_count"] += 1
                    docs_summary[src]["total_chars"] += m.get("char_count", 0)
        except Exception:
            pass

        return list(docs_summary.values())

    def delete_document(self, source_name):
        """Deletes all chunks belonging to a specific document source."""
        try:
            results = self.docs_col.get(include=["metadatas"])
            ids_to_delete = []
            if results and results.get("ids") and results.get("metadatas"):
                for idx, m in enumerate(results["metadatas"]):
                    if m and m.get("source") == source_name:
                        ids_to_delete.append(results["ids"][idx])

            if ids_to_delete:
                self.docs_col.delete(ids=ids_to_delete)
                return True, f"Deleted {len(ids_to_delete)} chunks for document {source_name}."
            return False, f"No chunks found for document {source_name}."
        except Exception as e:
            return False, f"Error deleting document: {str(e)}"

    def query_documents(self, query, n_results=5, min_score=0.3):
        """Queries documents_store for RAG chunks above min_score threshold."""
        vec = ollama_service.get_embedding(query)
        res = self.docs_col.query(
            query_embeddings=[vec],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )

        matches = []
        if res and res.get("ids") and len(res["ids"][0]) > 0:
            ids = res["ids"][0]
            docs = res["documents"][0]
            metas = res["metadatas"][0]
            dists = res["distances"][0]

            for i in range(len(ids)):
                similarity = round(1.0 - (dists[i] if dists[i] is not None else 1.0), 3)
                score = max(0.0, min(1.0, similarity))

                if score >= float(min_score):
                    matches.append({
                        "document": metas[i].get("source", "Unknown Doc"),
                        "chunk_index": metas[i].get("chunk_index", 0),
                        "score": score,
                        "text": docs[i]
                    })

        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches

chroma_service = ChromaService()
