import httpx
import json
import logging
from app.services.ai.base import BaseAIService, AIJob, AIResult
from app.core.config import settings

logger = logging.getLogger("codesync.ai.openai")

class OpenAIAIService(BaseAIService):
    """OpenAI AI Service adapter using REST API with JSON response format."""

    SYSTEM_PROMPT = """You are CodeSync AI, an elite software architect and senior pair programmer.
Analyze the user's code and instructions carefully.
Respond strictly in JSON format with exactly the following keys:
{
  "explanation": "Clear, helpful explanation in simple language",
  "suggested_code": "The recommended complete replacement code or solution (or original code if no change)",
  "reasoning": "Technical reasoning justifying the suggestion or analysis",
  "risks": "Potential edge cases, breaking changes, or trade-offs to be aware of",
  "time_complexity": "Big-O time complexity (e.g. O(N) or O(N log N))",
  "space_complexity": "Big-O space complexity (e.g. O(1) or O(N))"
}"""

    async def process(self, job: AIJob) -> AIResult:
        if not settings.AI_API_KEY:
            raise ValueError("OpenAI API key is not configured in environment (AI_API_KEY).")

        model = settings.AI_MODEL_NAME if "gpt" in settings.AI_MODEL_NAME.lower() else "gpt-4o-mini"
        url = "https://api.openai.com/v1/chat/completions"

        user_content = (
            f"Action: {job.action.upper()}\n"
            f"Language: {job.language}\n"
            f"Instruction: {job.instruction or 'Analyze code'}\n"
            f"Error Trace (if any): {job.error_trace or 'None'}\n\n"
            f"Source Code:\n```{job.language}\n{job.code}\n```"
        )

        headers = {
            "Authorization": f"Bearer {settings.AI_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code != 200:
                raise RuntimeError(f"OpenAI API returned error {res.status_code}: {res.text}")

            data = res.json()
            raw_text = data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_text)

            return AIResult(
                explanation=parsed.get("explanation", ""),
                suggested_code=parsed.get("suggested_code", job.code),
                reasoning=parsed.get("reasoning", ""),
                risks=parsed.get("risks", ""),
                time_complexity=parsed.get("time_complexity", "O(N)"),
                space_complexity=parsed.get("space_complexity", "O(1)"),
                provider=f"OpenAI ({model})"
            )
