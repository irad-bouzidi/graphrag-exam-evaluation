import asyncio
import sys
sys.path.insert(0, '.')

from openai import AsyncOpenAI
import os

# Load env
from dotenv import load_dotenv
load_dotenv()

async def test_extraction():
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-5-nano")
    
    print(f"Using model: {model}")
    print(f"API Key: {api_key[:20]}..." if api_key else "No API key!")
    
    client = AsyncOpenAI(api_key=api_key)
    
    # Test with simple prompt
    prompt = """Extract the following exam text into JSON format:

Exam: Math Quiz
Question 1: What is 2+2?
A) 3
B) 4
C) 5

Return JSON with title, subject, and questions array."""

    print("\n--- Testing API call ---")
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=1000
        )
        
        print(f"Response object: {response}")
        print(f"\nChoices: {response.choices}")
        print(f"\nMessage: {response.choices[0].message}")
        print(f"\nContent: {response.choices[0].message.content}")
        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

asyncio.run(test_extraction())
