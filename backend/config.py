from pydantic_settings import BaseSettings
from typing import List, Union
import json

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GOOGLE_API_KEY: str
    CORS_ORIGINS: Union[List[str], str] = []

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            try:
                return json.loads(self.CORS_ORIGINS)
            except json.JSONDecodeError:
                return [self.CORS_ORIGINS]
        return self.CORS_ORIGINS

    class Config:
        env_file = [".env", "backend/.env"]
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
