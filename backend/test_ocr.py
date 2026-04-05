import pytesseract
from PIL import Image

# Test OCR on sample exam
image_path = "/Users/hamzamac/Documents/Projects/GraphRAG-Fraud-Detection/graphrag-exam-evaluation/exams-sample/exam math.png"
image = Image.open(image_path)
text = pytesseract.image_to_string(image, lang='eng')

print("=== OCR EXTRACTED TEXT ===")
print(text)
print(f"\n=== Text length: {len(text)} chars ===")
