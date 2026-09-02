import os
import json
from datetime import datetime

from fastapi import APIRouter
from dotenv import load_dotenv
from groq import Groq


load_dotenv()

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


@router.post("/extract")
def extract_expense(message: str):

    prompt = f"""
You are an AI Expense Tracker assistant.

Extract expense information from the user's message.

Return ONLY valid JSON.

Required format:

{{
    "amount": 0,
    "category": "",
    "description": "",
    "date": ""
}}

Rules:

- amount must be a number.
- category should be one of:
  Food, Travel, Shopping, Bills, Entertainment, Other.
- If the user says "today", use today's date.
- If no date is mentioned, use today's date.
- Keep description short.
- Return ONLY JSON.

Today's date: {datetime.now().strftime("%d/%m/%Y")}

User message:
{message}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    content = response.choices[0].message.content

    content = (
        content
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    return json.loads(content)