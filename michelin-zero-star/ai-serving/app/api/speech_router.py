import os
import time
import requests
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/speech", tags=["speech"])

_cached_token = None
_cached_expire_ts = 0

@router.get("/token")
def issue_token():
    global _cached_token, _cached_expire_ts

    speech_key = os.getenv("SPEECH_KEY")
    speech_region = os.getenv("SPEECH_REGION")

    if not speech_key or not speech_region:
        raise HTTPException(status_code=500, detail="SPEECH_KEY or SPEECH_REGION env missing")

    now = int(time.time())
    if _cached_token and now < (_cached_expire_ts - 60):
        return {"token": _cached_token, "region": speech_region}

    url = f"https://{speech_region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
    headers = {
        "Ocp-Apim-Subscription-Key": speech_key,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    try:
        r = requests.post(url, headers=headers, data="", timeout=10)
        r.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Token issuance failed: {e}")

    _cached_token = r.text
    _cached_expire_ts = now + 9 * 60 

    return {"token": _cached_token, "region": speech_region}
