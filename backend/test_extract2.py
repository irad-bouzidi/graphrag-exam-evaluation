import asyncio
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
load_dotenv()

async def test_extraction():
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-5-nano")
    
    print(f"Using model: {model}")
    
    client = AsyncOpenAI(api_key=api_key)
    
    prompt = """Extract this exam into JSON:

Math Quiz
Q1: What is 2+2?
A) 3  B) 4  C) 5

Return: {"title": "...", "questions": [...]}"""

    print("\n--- Testing with higher token limit ---")
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=16000  # Much higher for reasoning model
        )
        
        print(f"finish_reason: {response.choices[0].finish_reason}")
        print(f"reasoning_tokens: {response.usage.completion_tokens_details.reasoning_tokens}")
        print(f"completion_tokens: {response.usage.completion_tokens}")
        print(f"\nContent: '{response.choices[0].message.content}'")
        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

asyncio.run(test_extraction())
