import os
import json
import time
import re
import numpy as np
from typing import List, Dict, Any, Tuple
from config import settings

# Graceful import of heavy dependencies to guarantee zero-crash execution
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

class LightweightEmbedder:
    """Fast fallback embedder using TF-IDF / character n-gram hashing for instant zero-dependency vector matching."""
    def __init__(self, dim: int = 384):
        self.dim = dim

    def encode(self, texts: List[str]) -> np.ndarray:
        embeddings = []
        for text in texts:
            vec = np.zeros(self.dim, dtype=np.float32)
            words = re.findall(r'\w+', text.lower())
            for i, word in enumerate(words):
                hash_val = hash(word) % self.dim
                vec[hash_val] += 1.0 / (i + 1.0)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            embeddings.append(vec)
        return np.array(embeddings, dtype=np.float32)


class VectorStoreManager:
    def __init__(self):
        self.dim = 384
        self.chunks: List[Dict[str, Any]] = []
        self.index = None
        self.model = None

        # Initialize embedder model
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
                if hasattr(self.model, 'get_embedding_dimension'):
                    self.dim = self.model.get_embedding_dimension()
                else:
                    self.dim = self.model.get_sentence_embedding_dimension()
            except Exception as e:
                print(f"[VectorStore] SentenceTransformer init warning: {e}. Falling back to LightweightEmbedder.")
                self.model = LightweightEmbedder(self.dim)
        else:
            print("[VectorStore] SentenceTransformers not found. Using fast LightweightEmbedder.")
            self.model = LightweightEmbedder(self.dim)

        # Initialize FAISS Index
        if FAISS_AVAILABLE:
            self.index = faiss.IndexFlatIP(self.dim)  # Inner product (cosine similarity if normalized)
        else:
            self.vectors: List[np.ndarray] = []

    def _encode_text(self, texts: List[str]) -> np.ndarray:
        if hasattr(self.model, 'encode'):
            vecs = self.model.encode(texts, show_progress_bar=False)
            vecs = np.array(vecs, dtype=np.float32)
            # Normalize vectors for cosine similarity
            norms = np.linalg.norm(vecs, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            return vecs / norms
        else:
            return LightweightEmbedder(self.dim).encode(texts)

    def chunk_text(self, text: str, source_doc: str, chunk_size: int = None, overlap: int = None) -> List[Dict[str, Any]]:
        chunk_size = chunk_size or settings.CHUNK_SIZE
        overlap = overlap or settings.CHUNK_OVERLAP

        # Split by double newline / headers if possible
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + para
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = para

        if current_chunk:
            chunks.append(current_chunk)

        # Prepare metadata objects
        result_chunks = []
        for idx, chunk in enumerate(chunks):
            # Extract header/title if available
            first_line = chunk.split("\n")[0].replace("#", "").strip()
            title = first_line[:60] if first_line else f"Section {idx+1}"

            result_chunks.append({
                "chunk_id": f"{source_doc}_{idx}",
                "doc_name": source_doc,
                "title": title,
                "text": chunk,
                "idx": idx
            })

        return result_chunks

    def add_document(self, doc_name: str, content: str):
        """Indexes a document text into the vector database with microsecond speed."""
        new_chunks = self.chunk_text(content, doc_name)
        if not new_chunks:
            return 0

        texts = [c["text"] for c in new_chunks]
        embeddings = self._encode_text(texts)

        if FAISS_AVAILABLE and self.index is not None:
            self.index.add(embeddings)
        else:
            if not hasattr(self, 'vectors'):
                self.vectors = []
            for emb in embeddings:
                self.vectors.append(emb)

        self.chunks.extend(new_chunks)
        print(f"[VectorStore] Added '{doc_name}' ({len(new_chunks)} chunks). Total chunks: {len(self.chunks)}")
        return len(new_chunks)

    def search(self, query: str, top_k: int = 3) -> Tuple[List[Dict[str, Any]], float]:
        """Low-latency search returning top_k matched document chunks and query time."""
        start_time = time.time()
        if not self.chunks:
            return [], 0.0

        query_vec = self._encode_text([query])

        results = []
        if FAISS_AVAILABLE and self.index is not None and self.index.ntotal > 0:
            actual_k = min(top_k, self.index.ntotal)
            scores, indices = self.index.search(query_vec, actual_k)
            for score, idx in zip(scores[0], indices[0]):
                if idx >= 0 and idx < len(self.chunks):
                    item = dict(self.chunks[idx])
                    item["score"] = float(score)
                    results.append(item)
        elif hasattr(self, 'vectors') and len(self.vectors) > 0:
            vec_matrix = np.array(self.vectors)
            scores = np.dot(vec_matrix, query_vec[0])
            top_indices = np.argsort(scores)[::-1][:top_k]
            for idx in top_indices:
                if idx < len(self.chunks):
                    item = dict(self.chunks[idx])
                    item["score"] = float(scores[idx])
                    results.append(item)

        latency_ms = (time.time() - start_time) * 1000.0
        return results, round(latency_ms, 2)

    def get_indexed_documents(s):
        docs = {}
        for c in s.chunks:
            name = c["doc_name"]
            if name not in docs:
                docs[name] = {"name": name, "chunk_count": 0}
            docs[name]["chunk_count"] += 1
        return list(docs.values())

# Global instance
vector_store = VectorStoreManager()
