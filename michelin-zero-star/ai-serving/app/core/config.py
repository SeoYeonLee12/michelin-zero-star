import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "MZS-AI")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    ES_URL: str = os.getenv("ES_URL", "http://localhost:9200") 
       
settings = Settings()