import re
from typing import Dict, List, Any

# Optional spaCy integration for fine-grained NLP tokenization
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except Exception:
    SPACY_AVAILABLE = False
    nlp = None

class NLPPipeline:
    """Core NLP Engine for random student query understanding, domain tagging, and keyword extraction."""

    DOMAINS = {
        "Machine Learning": ["ml", "feature", "model", "training", "overfitting", "supervised", "classification", "regression", "metrics", "loss", "dataset"],
        "Deep Learning & AI": ["neural", "backpropagation", "weights", "bias", "activation", "relu", "sigmoid", "cnn", "transformer", "llm", "dropout", "embedding"],
        "Data Science & Analytics": ["pandas", "numpy", "statistics", "eda", "visualization", "imputation", "distribution", "variance", "outlier", "z-score"],
        "System Architecture": ["latency", "scaling", "feature store", "pipeline", "cache", "microservices", "fastapi", "deployment", "faiss", "vector"]
    }

    INTENTS = {
        "definition": ["what is", "define", "meaning of", "explain", "concept"],
        "comparison": ["difference between", "vs", "versus", "compare", "which is better"],
        "practical_application": ["how to use", "how to implement", "real world example", "best practices", "when to use"],
        "troubleshooting": ["why does", "issue", "error", "problem", "fix", "prevent overfitting"]
    }

    def analyze_query(self, query: str) -> Dict[str, Any]:
        query_clean = query.strip()
        query_lower = query_clean.lower()

        # 1. Intent Detection
        detected_intent = "general_explanation"
        for intent, patterns in self.INTENTS.items():
            if any(pat in query_lower for pat in patterns):
                detected_intent = intent
                break

        # 2. Domain Classification
        detected_domain = "General Technology"
        max_hits = 0
        for domain, keywords in self.DOMAINS.items():
            hits = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', query_lower))
            if hits > max_hits:
                max_hits = hits
                detected_domain = domain

        # 3. Keyword & Entity Extraction
        keywords = []
        if SPACY_AVAILABLE and nlp is not None:
            doc = nlp(query_clean)
            keywords = [token.text for token in doc if not token.is_stop and not token.is_punct and len(token.text) > 2]
        else:
            # Fast fallback keyword extraction
            words = re.findall(r'\b[a-zA-Z]{3,}\b', query_lower)
            stopwords = {"what", "is", "the", "how", "does", "can", "you", "explain", "for", "with", "this", "that", "and", "are"}
            keywords = [w for w in words if w not in stopwords]

        # Deduplicate keywords preserving order
        unique_keywords = list(dict.fromkeys(keywords))[:8]

        # 4. Query Expansion for boosted semantic vector retrieval
        expanded_query = f"{query_clean} {' '.join(unique_keywords)}"

        return {
            "original_query": query_clean,
            "intent": detected_intent,
            "domain": detected_domain,
            "keywords": unique_keywords,
            "expanded_query": expanded_query
        }

nlp_engine = NLPPipeline()
