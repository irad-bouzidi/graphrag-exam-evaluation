import asyncio
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
load_dotenv()

async def test_extraction():
    api_key = os.getenv("OPENAI_API_KEY")
    
    client = AsyncOpenAI(api_key=api_key)
    
    prompt = """Extract this exam into JSON:

Math Quiz
Q1: What is 2+2?
A) 3  B) 4  C) 5

Return: {"title": "...", "questions": [...]}"""

    # Test with gpt-4o-mini (fast, non-reasoning)
    print("--- Testing gpt-4o-mini ---")
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        print(f"finish_reason: {response.choices[0].finish_reason}")
        print(f"Content: '{response.choices[0].message.content}'")
        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

asyncio.run(test_extraction())
