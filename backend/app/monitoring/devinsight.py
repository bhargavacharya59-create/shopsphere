"""Non-blocking forwarding of ShopSphere server errors to DevInsight AI."""
import logging
from typing import Any, Dict

import httpx

from app.core.config import settings

logger = logging.getLogger("shopsphere.devinsight")


async def forward_error_event(event: Dict[str, Any]) -> None:
    """Send one 5xx event to DevInsight; never affect the customer response."""
    base_url = settings.DEVINSIGHT_INGEST_URL.rstrip("/")
    api_key = settings.DEVINSIGHT_INGEST_API_KEY
    if not base_url or not api_key:
        return

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(2.0)) as client:
            response = await client.post(
                f"{base_url}/errors",
                json=event,
                headers={"X-API-Key": api_key},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        # Do not log request payloads or credentials.
        logger.warning("Could not forward error event to DevInsight: %s", type(exc).__name__)
