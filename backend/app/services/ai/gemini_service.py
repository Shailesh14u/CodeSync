import httpx
import json
import logging
from app.services.ai.base import BaseAIService, AIJob, AIResult
from app.core.config import settings

logger = logging.getLogger("codesync.ai.gemini")

class GeminiAIService(BaseAIService):
    """Google Gemini AI Service adapter using REST API with structured JSON output."""

    SYSTEM_PROMPT = """You are CodeSync AI, a senior software architect and expert pair programmer.
Analyze the user's code and instructions carefully.
Respond strictly in JSON format with exactly the following keys:
{
  "explanation": "Clear, helpful explanation in simple language",
  "suggested_code": "The recommended complete replacement code or solution (or empty if not applicable)",
  "reasoning": "Technical reasoning justifying the suggestion or analysis",
  "risks": "Potential edge cases, breaking changes, or trade-offs to be aware of",
  "time_complexity": "Big-O time complexity (e.g. O(N) or O(N log N))",
  "space_complexity": "Big-O space complexity (e.g. O(1) or O(N))"
}"""

    async def process(self, job: AIJob) -> AIResult:
        if not settings.AI_API_KEY:
            raise ValueError("Gemini API key is not configured in environment (AI_API_KEY).")

        model = settings.AI_MODEL_NAME or "gemini-1.5-pro"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.AI_API_KEY}"

        user_content = (
            f"Action: {job.action.upper()}\n"
            f"Language: {job.language}\n"
            f"Instruction: {job.instruction or 'Analyze code'}\n"
            f"Error Trace (if any): {job.error_trace or 'None'}\n\n"
            f"Source Code:\n```{job.language}\n{job.code}\n```"
        )

        payload = {
            "system_instruction": {
                "parts": [{"text": self.SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "parts": [{"text": user_content}]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code != 200:
                raise RuntimeError(f"Gemini API returned error {res.status_code}: {res.text}")

            data = res.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)

            return AIResult(
                explanation=parsed.get("explanation", ""),
                suggested_code=parsed.get("suggested_code", job.code),
                reasoning=parsed.get("reasoning", ""),
                risks=parsed.get("risks", ""),
                time_complexity=parsed.get("time_complexity", "O(N)"),
                space_complexity=parsed.get("space_complexity", "O(1)"),
                provider=f"Google Gemini ({model})"
            )
