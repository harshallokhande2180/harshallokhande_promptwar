import fastapi
import pydantic
import anthropic
from dotenv import load_dotenv
import os

load_dotenv()

print("--- Environment Check ---")
print("FastAPI version:", fastapi.__version__)
print("Pydantic version:", pydantic.__version__)
print("Anthropic SDK version:", anthropic.__version__)
print("Environment loaded successfully!")