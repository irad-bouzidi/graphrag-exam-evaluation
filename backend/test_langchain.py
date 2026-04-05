import asyncio
import json
import os
from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import pytesseract
from PIL import Image

async def test_langchain_pipeline():
    # Step 1: OCR
    print("=== STEP 1: OCR EXTRACTION ===")
    image_path = "/Users/hamzamac/Documents/Projects/GraphRAG-Fraud-Detection/graphrag-exam-evaluation/exams-sample/exam math.png"
    image = Image.open(image_path)
    ocr_text = pytesseract.image_to_string(image, lang='eng')
    print(f"OCR extracted {len(ocr_text)} chars")
    print(ocr_text[:300])
    print("...\n")
    
    # Step 2: LLM via LangChain
    print("=== STEP 2: LLM via LangChain (gpt-5-nano) ===")
    
    api_key = os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("OPENAI_MODEL", "gpt-5-nano")
    
    print(f"Model: {model_name}")
    
    # Reasoning models don't support temperature
    llm = ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        max_tokens=16000,  # High for reasoning
    )
    
    prompt = f"""Extract this exam into JSON. Return ONLY valid JSON.

OCR Text:
{ocr_text[:800]}

Return: {{"title": "...", "grade_level": 5, "questions": [{{"number": 1, "text": "...", "type": "multiple_choice"}}]}}"""

    messages = [
        SystemMessage(content="You are an expert at analyzing exams. Respond with valid JSON only."),
        HumanMessage(content=prompt)
    ]
    
    print("Calling LLM (may take 30-90 seconds for reasoning model)...")
    
    try:
        response = await llm.ainvoke(messages)
        content = response.content
        
        print(f"\n=== LLM OUTPUT ===")
        print(content[:1500] if content else "EMPTY")
        
        if content:
            # Try to parse
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                data = json.loads(content)
                print(f"\n=== PARSED ===")
                print(f"Title: {data.get('title')}")
                print(f"Questions: {len(data.get('questions', []))}")
            except Exception as e:
                print(f"Parse error: {e}")
                
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

asyncio.run(test_langchain_pipeline())
