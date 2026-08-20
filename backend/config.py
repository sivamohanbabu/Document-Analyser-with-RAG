import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "TrainerAI - Context-Aware Intelligent Training Assistant"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # NLP & Vector Database Settings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 400
    CHUNK_OVERLAP: int = 80
    TOP_K_DOCS: int = 3
    SIMILARITY_THRESHOLD: float = 0.25
    
    # Storage Paths
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "sample_data")
    FAISS_INDEX_PATH: str = os.path.join(os.path.dirname(__file__), "storage", "faiss.index")
    METADATA_PATH: str = os.path.join(os.path.dirname(__file__), "storage", "metadata.json")
    
    # Low Latency Cache Configuration
    CACHE_EXPIRATION_SECONDS: int = 3600

settings = Settings()
