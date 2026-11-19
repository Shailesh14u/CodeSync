import logging
from app.core.config import settings
from app.services.ai.base import BaseAIService, AIJob, AIResult
from app.services.ai.mock_service import MockAIService
from app.services.ai.gemini_service import GeminiAIService
from app.services.ai.openai_service import OpenAIAIService

logger = logging.getLogger("codesync.ai.manager")

class AIServiceManager:
    """
    Provider-independent AI Service Manager.
    Orchestrates the active AI provider (Gemini, OpenAI, Anthropic, or Mock).
    Gracefully falls back to heuristic MockAIService when keys are missing or provider APIs encounter errors.
    """

    def __init__(self):
        self.mock_service = MockAIService()
        self.gemini_service = GeminiAIService()
        self.openai_service = OpenAIAIService()

    def get_service(self, job: AIJob = None) -> BaseAIService:
        provider = ((job and job.provider) or settings.AI_PROVIDER or "mock").lower()
        key = ((job and job.api_key) or settings.AI_API_KEY or "").strip()
        
        # Check if key is absent or default placeholder
        if not key or key.startswith("your_") or key.startswith("your-") or provider == "mock":
            logger.info("Using offline heuristic MockAIService (key not set or provider=mock).")
            return self.mock_service

        if provider == "gemini":
            return self.gemini_service
        elif provider in ("openai", "gpt"):
            return self.openai_service
        else:
            return self.mock_service

    async def execute(self, job: AIJob) -> AIResult:
        service = self.get_service(job)
        try:
            return await service.process(job)
        except Exception as e:
            logger.warning(
                f"AI service '{type(service).__name__}' failed ({e}). Falling back to MockAIService."
            )
            result = await self.mock_service.process(job)
            result.provider = f"{result.provider} (Fallback: {str(e)[:40]}...)"
            return result

ai_manager = AIServiceManager()
