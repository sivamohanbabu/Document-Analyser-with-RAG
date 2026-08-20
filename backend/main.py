import os
import io
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings
from vector_store import vector_store
from nlp_pipeline import nlp_engine
from notes_generator import notes_generator

# PyPDF2 for PDF text extraction
try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Context-Aware NLP Assistant API for Trainers & SMEs"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request & Response Data Models
class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class QueryResponse(BaseModel):
    query: str
    nlp_analysis: Dict[str, Any]
    ai_answer: Dict[str, Any]
    latency_ms: Dict[str, float]

# Startup Event: Index Sample Documents
@app.on_event("startup")
async def startup_event():
    print("[TrainerAI API] Initializing Vector Database Knowledge Base...")
    sample_dir = settings.DATA_DIR
    if os.path.exists(sample_dir):
        for filename in os.listdir(sample_dir):
            file_path = os.path.join(sample_dir, filename)
            if os.path.isfile(file_path) and (filename.endswith(".txt") or filename.endswith(".md")):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    vector_store.add_document(filename, content)
                except Exception as e:
                    print(f"Error loading sample file {filename}: {e}")
    print(f"[TrainerAI API] Startup complete. Indexed {len(vector_store.chunks)} document chunks.")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "indexed_chunks": len(vector_store.chunks),
        "indexed_documents": len(vector_store.get_indexed_documents()),
        "gemini_api_configured": bool(settings.GEMINI_API_KEY)
    }

@app.post("/api/query", response_model=QueryResponse)
async def process_student_query(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    total_start = time.time()

    # Step 1: NLP Intent & Domain Analysis
    nlp_start = time.time()
    nlp_analysis = nlp_engine.analyze_query(req.query)
    nlp_latency = round((time.time() - nlp_start) * 1000.0, 2)

    # Step 2: Context Retrieval from FAISS Vector Store
    retrieval_start = time.time()
    context_chunks, vector_latency = vector_store.search(
        query=nlp_analysis["expanded_query"],
        top_k=req.top_k or settings.TOP_K_DOCS
    )

    # Step 3: AI Answer & Smart Notes Generation
    gen_start = time.time()
    ai_answer = notes_generator.generate_response_and_notes(
        query=req.query,
        nlp_analysis=nlp_analysis,
        context_chunks=context_chunks
    )
    gen_latency = round((time.time() - gen_start) * 1000.0, 2)

    total_latency = round((time.time() - total_start) * 1000.0, 2)

    return {
        "query": req.query,
        "nlp_analysis": nlp_analysis,
        "ai_answer": ai_answer,
        "latency_ms": {
            "nlp_analysis": nlp_latency,
            "vector_retrieval": vector_latency,
            "ai_generation": gen_latency,
            "total_latency": total_latency
        }
    }

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename
    content_type = file.content_type
    
    extracted_text = ""
    try:
        file_bytes = await file.read()
        
        if filename.endswith(".pdf") or content_type == "application/pdf":
            if not PDF_SUPPORT:
                raise HTTPException(status_code=400, detail="PyPDF2 library not available for PDF processing.")
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for i, page in enumerate(pdf_reader.pages):
                txt = page.extract_text()
                if txt:
                    pages_text.append(txt)
            extracted_text = "\n\n".join(pages_text)
        else:
            # Assume text/markdown file
            extracted_text = file_bytes.decode("utf-8", errors="ignore")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from uploaded document.")

        chunks_added = vector_store.add_document(filename, extracted_text)

        return {
            "status": "success",
            "message": f"Successfully indexed '{filename}'.",
            "chunks_indexed": chunks_added,
            "total_chunks_in_db": len(vector_store.chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.get("/api/documents")
async def list_documents():
    return {
        "documents": vector_store.get_indexed_documents(),
        "total_chunks": len(vector_store.chunks)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
