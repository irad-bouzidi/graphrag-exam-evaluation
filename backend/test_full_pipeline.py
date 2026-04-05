import asyncio
import json
from openai import AsyncOpenAI
import pytesseract
from PIL import Image
import os
from dotenv import load_dotenv
load_dotenv()

async def test_full_pipeline():
    # Step 1: OCR
    print("=== STEP 1: OCR EXTRACTION ===")
    image_path = "/Users/hamzamac/Documents/Projects/GraphRAG-Fraud-Detection/graphrag-exam-evaluation/exams-sample/exam math.png"
    image = Image.open(image_path)
    ocr_text = pytesseract.image_to_string(image, lang='eng')
    print(f"OCR extracted {len(ocr_text)} chars")
    print(ocr_text[:500])
    print("...")
    
    # Step 2: LLM Processing with gpt-5-nano
    print("\n=== STEP 2: LLM PROCESSING (gpt-5-nano) ===")
    api_key = os.getenv("OPENAI_API_KEY")
    client = AsyncOpenAI(api_key=api_key)
    
    prompt = f"""Extract this exam into JSON format. Return ONLY valid JSON, no markdown.

OCR Text:
{ocr_text}

Return JSON with structure:
{{"title": "...", "grade_level": 5, "questions": [{{"number": 1, "text": "...", "type": "multiple_choice", "options": ["A...", "B..."], "correct_answer": "..."}}]}}"""

    print("Calling gpt-5-nano (this may take 30-60 seconds for reasoning)...")
    
    try:
        response = await client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=16000  # High limit for reasoning model
        )
        
        content = response.choices[0].message.content
        reasoning_tokens = response.usage.completion_tokens_details.reasoning_tokens
        
        print(f"\nReasoning tokens used: {reasoning_tokens}")
        print(f"Finish reason: {response.choices[0].finish_reason}")
        print(f"\n=== LLM OUTPUT ===")
        print(content[:2000] if content else "EMPTY CONTENT")
        
        if content:
            # Try to parse JSON
            try:
                data = json.loads(content)
                print(f"\n=== PARSED JSON ===")
                print(f"Title: {data.get('title')}")
                print(f"Questions: {len(data.get('questions', []))}")
            except json.JSONDecodeError as e:
                print(f"\nJSON parse error: {e}")
        
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

asyncio.run(test_full_pipeline())
