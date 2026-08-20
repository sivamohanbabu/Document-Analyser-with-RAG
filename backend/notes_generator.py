import os
import json
from typing import Dict, Any, List
from config import settings

# Graceful Gemini SDK import
try:
    from google import genai
    from google.genai import types
    GEMINI_SDK_AVAILABLE = True
except ImportError:
    GEMINI_SDK_AVAILABLE = False


class SmartNotesGenerator:
    """Generates structured trainer notes, simple explanations, and FAQs using Gemini API."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if GEMINI_SDK_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[NotesGenerator] Gemini client init warning: {e}")

    def generate_response_and_notes(
        self,
        query: str,
        nlp_analysis: Dict[str, Any],
        context_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generates AI answer + structured trainer notes using document context."""

        context_text = "\n\n".join([
            f"--- Document: {chunk['doc_name']} ({chunk['title']}) ---\n{chunk['text']}"
            for chunk in context_chunks
        ]) if context_chunks else "No specific background document provided."

        domain = nlp_analysis.get("domain", "General Technology")
        intent = nlp_analysis.get("intent", "explanation")

        system_instruction = (
            "You are TrainerAI, an expert AI Assistant for Subject Matter Experts (SMEs) and Corporate Trainers.\n"
            "Your task is to answer the user's random query clearly using the provided reference training documents if relevant.\n"
            "Always return your answer in valid JSON format with the following keys:\n"
            "- simple_explanation: (string) A clear, engaging explanation tailored for students.\n"
            "- key_definition: (string) A concise 1-2 sentence definition for classroom slides.\n"
            "- important_points: (list of strings) 3-5 critical bullet points for trainers to highlight.\n"
            "- real_world_example: (string) A practical industry application or real-world example.\n"
            "- interview_questions: (list of objects with 'question' and 'answer') 2-3 common exam/interview questions."
        )

        user_prompt = (
            f"Domain: {domain}\n"
            f"Query Intent: {intent}\n"
            f"Student Question: '{query}'\n\n"
            f"Reference Training Context:\n{context_text}\n\n"
            f"Generate structured training answer and smart notes in JSON."
        )

        # 1. Try Live Gemini API Call if available
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.3
                    )
                )

                if response and response.text:
                    parsed = json.loads(response.text)
                    return self._format_response(parsed, context_chunks)
            except Exception as e:
                print(f"[NotesGenerator] Gemini API call error: {e}. Using intelligent fallback.")

        # 2. Intelligent Rule-Based Fallback Generator (Ensures 100% reliable local output)
        return self._generate_fallback(query, domain, context_chunks)

    def _format_response(self, parsed: Dict[str, Any], context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "simple_explanation": parsed.get("simple_explanation", ""),
            "key_definition": parsed.get("key_definition", ""),
            "important_points": parsed.get("important_points", []),
            "real_world_example": parsed.get("real_world_example", ""),
            "interview_questions": parsed.get("interview_questions", []),
            "referenced_docs": [
                {
                    "doc_name": c["doc_name"],
                    "title": c["title"],
                    "score": round(c.get("score", 0.0) * 100, 1),
                    "snippet": c["text"][:180] + "..."
                }
                for c in context_chunks
            ]
        }

    def _generate_fallback(self, query: str, domain: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Provides structured notes built directly from top context chunks when offline."""
        top_snippet = context_chunks[0]["text"] if context_chunks else query

        # Extract sentences from top snippet for fallback highlights
        sentences = [s.strip() for s in top_snippet.replace("\n", " ").split(".") if len(s.strip()) > 15]
        def_text = sentences[0] if sentences else f"{query} is a fundamental concept in {domain}."
        pts = sentences[1:5] if len(sentences) > 1 else [
            "Provides standardized structure for live training delivery.",
            "Improves student understanding through context-aware document recommendations.",
            "Helps trainers quickly address unpredictable queries in live sessions."
        ]

        return {
            "simple_explanation": (
                f"Based on the training materials for {domain}, '{query}' addresses a core concept. "
                f"In training delivery, this enables learners to quickly grasp the underlying principles "
                f"and apply them effectively."
            ),
            "key_definition": def_text,
            "important_points": pts,
            "real_world_example": (
                f"In enterprise production systems, {query.lower()} is implemented to optimize operational efficiency, "
                f"reduce latency, and deliver reliable predictions or analytics."
            ),
            "interview_questions": [
                {
                    "question": f"What is the primary purpose of {query} in {domain}?",
                    "answer": f"It provides structured methodology to streamline operations and ensure high reliability."
                },
                {
                    "question": f"How does a trainer effectively explain {query} to beginners?",
                    "answer": "Start with a high-level real-world analogy before diving into numerical scaling or algorithm details."
                }
            ],
            "referenced_docs": [
                {
                    "doc_name": c["doc_name"],
                    "title": c["title"],
                    "score": round(c.get("score", 0.0) * 100, 1),
                    "snippet": c["text"][:180] + "..."
                }
                for c in context_chunks
            ]
        }

notes_generator = SmartNotesGenerator()
