from typing import Optional
import os
import structlog
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
from PIL import Image
import pytesseract

from src.core.exceptions import DocumentProcessingError

logger = structlog.get_logger()


class DocumentProcessor:
    """Process exam documents (PDF and images) to extract text"""
    
    def __init__(self):
        self.supported_image_types = ["image/jpeg", "image/png", "image/tiff"]
        self.supported_pdf_types = ["application/pdf"]
    
    async def process_document(self, file_path: str, content_type: str) -> str:
        """
        Process a document and extract text
        
        Args:
            file_path: Path to the document file
            content_type: MIME type of the document
            
        Returns:
            Extracted text content
        """
        logger.info("Processing exam document", file_path=file_path, content_type=content_type)
        
        try:
            if content_type in self.supported_pdf_types:
                text = await self._process_pdf(file_path)
            elif content_type in self.supported_image_types:
                text = await self._process_image(file_path)
            else:
                raise DocumentProcessingError(
                    f"Unsupported content type: {content_type}",
                    details={"content_type": content_type}
                )
            
            if not text or len(text.strip()) < 10:
                raise DocumentProcessingError(
                    "No text could be extracted from the document",
                    details={"file_path": file_path}
                )
            
            logger.info(
                "Exam document processed successfully",
                file_path=file_path,
                text_length=len(text)
            )
            
            return text
            
        except DocumentProcessingError:
            raise
        except Exception as e:
            logger.error("Document processing failed", error=str(e), file_path=file_path)
            raise DocumentProcessingError(
                f"Failed to process document: {str(e)}",
                details={"file_path": file_path, "error": str(e)}
            )
    
    async def _process_pdf(self, file_path: str) -> str:
        """
        Extract text from PDF file
        Uses PyPDF2 for text extraction and OCR as fallback
        """
        text_parts = []
        
        try:
            # Try text extraction first
            reader = PdfReader(file_path)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text_parts.append(page_text)
                else:
                    # Fallback to OCR if no text found
                    logger.debug(f"No text in page {page_num}, using OCR")
                    ocr_text = await self._ocr_pdf_page(file_path, page_num)
                    if ocr_text:
                        text_parts.append(ocr_text)
            
            return "\n\n".join(text_parts)
            
        except Exception as e:
            logger.warning(f"PDF text extraction failed, trying OCR: {str(e)}")
            # Full OCR fallback
            return await self._ocr_pdf(file_path)
    
    async def _ocr_pdf(self, file_path: str) -> str:
        """Convert PDF to images and perform OCR page by page to reduce memory use."""
        try:
            reader = PdfReader(file_path)
            total_pages = len(reader.pages)
            text_parts = []

            # Cap OCR to a reasonable upper bound to avoid runaway processing on huge files
            max_pages = 100
            pages_to_process = min(total_pages, max_pages)

            for page_index in range(pages_to_process):
                page_num = page_index + 1
                logger.debug(f"OCR processing page {page_num}/{pages_to_process}")

                # Convert only the current page to an image (avoids loading whole PDF into RAM)
                images = convert_from_path(
                    file_path,
                    first_page=page_num,
                    last_page=page_num,
                    fmt="jpeg",
                    dpi=200,
                )

                if not images:
                    continue

                text = pytesseract.image_to_string(images[0], lang='fra+eng')
                if text.strip():
                    text_parts.append(text)

            if total_pages > max_pages:
                logger.warning(
                    "OCR truncated due to page limit",
                    processed_pages=pages_to_process,
                    total_pages=total_pages,
                )

            return "\n\n".join(text_parts)

        except Exception as e:
            raise DocumentProcessingError(
                f"OCR processing failed: {str(e)}",
                details={"file_path": file_path}
            )
    
    async def _ocr_pdf_page(self, file_path: str, page_num: int) -> Optional[str]:
        """OCR a single PDF page"""
        try:
            images = convert_from_path(file_path, first_page=page_num + 1, last_page=page_num + 1)
            if images:
                text = pytesseract.image_to_string(images[0], lang='fra+eng')
                return text
            return None
        except Exception as e:
            logger.error(f"OCR failed for page {page_num}: {str(e)}")
            return None
    
    async def _process_image(self, file_path: str) -> str:
        """
        Extract text from image using OCR
        """
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image, lang='fra+eng')
            
            if not text or len(text.strip()) < 5:
                raise DocumentProcessingError(
                    "No text could be extracted from image",
                    details={"file_path": file_path}
                )
            
            return text
            
        except Exception as e:
            raise DocumentProcessingError(
                f"Image OCR failed: {str(e)}",
                details={"file_path": file_path}
            )
    
    def validate_file(self, file_path: str) -> bool:
        """Validate that file exists and is readable"""
        if not os.path.exists(file_path):
            raise DocumentProcessingError(
                f"File not found: {file_path}",
                details={"file_path": file_path}
            )
        
        if not os.path.isfile(file_path):
            raise DocumentProcessingError(
                f"Path is not a file: {file_path}",
                details={"file_path": file_path}
            )
        
        if not os.access(file_path, os.R_OK):
            raise DocumentProcessingError(
                f"File is not readable: {file_path}",
                details={"file_path": file_path}
            )
        
        return True
