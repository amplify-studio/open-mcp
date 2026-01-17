"""
PaddleOCR FastAPI Service
OCR HTTP service for extracting text from images.
"""
import base64
import io
import logging
import re
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel
from paddleocr import PaddleOCR

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PaddleOCR Service", version="1.0.0")

# Global OCR instance (lazy-loaded to avoid startup delay)
_ocr_instance: Optional[PaddleOCR] = None


class OCRRequest(BaseModel):
    """OCR request payload."""
    image: str  # Base64 data URI only
    lang: str = "auto"  # auto, ch, en


class OCRResponse(BaseModel):
    """OCR response payload."""
    success: bool
    text: str
    confidence: float
    language: str
    blocks: list = []


class TextBlock(BaseModel):
    """Individual text block with bounding box."""
    text: str
    box: list
    confidence: float


def get_ocr() -> PaddleOCR:
    """Get or initialize the global OCR instance."""
    global _ocr_instance
    if _ocr_instance is None:
        logger.info("Initializing PaddleOCR...")
        _ocr_instance = PaddleOCR(
            use_angle_cls=True,
            lang='ch',  # Chinese mode supports auto-detection
            use_gpu=False,
            show_log=False
        )
        logger.info("PaddleOCR initialized successfully")
    return _ocr_instance


def image_array(image: Image.Image):
    """Convert PIL Image to numpy array for PaddleOCR."""
    import numpy as np
    return np.array(image)


def decode_base64_image(data_uri: str) -> Image.Image:
    """Decode a base64 data URI to a PIL Image."""
    if not data_uri.startswith('data:image'):
        raise HTTPException(
            status_code=400,
            detail="Only base64 data URIs are supported (format: data:image/...;base64,...)"
        )

    try:
        _, encoded = data_uri.split(',', 1)
        image_bytes = base64.b64decode(encoded)
        return Image.open(io.BytesIO(image_bytes))
    except (ValueError, IndexError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 image data: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to decode image: {e}"
        )


def detect_language(text: str) -> str:
    """Detect if text contains Chinese characters."""
    # Unicode range for Chinese characters
    chinese_pattern = re.compile(r'[\u4e00-\u9fff]')
    return 'ch' if chinese_pattern.search(text) else 'en'


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "paddleocr", "version": "1.0.0"}


@app.post("/ocr")
async def extract_text(request: OCRRequest) -> OCRResponse:
    """
    Extract text from an image using OCR.

    Accepts base64-encoded images and returns extracted text
    with confidence scores and bounding box information.
    """
    try:
        ocr_instance = get_ocr()
        image = decode_base64_image(request.image)

        logger.info(f"Processing image: {image.size[0]}x{image.size[1]}")
        result = ocr_instance.ocr(image_array(image), cls=True)

        if not result or len(result) == 0 or not result[0]:
            return OCRResponse(
                success=True,
                text="",
                confidence=0.0,
                language="unknown",
                blocks=[]
            )

        # Extract text lines and compute metrics
        text_lines = []
        blocks = []
        total_confidence = 0.0

        for line in result[0]:
            text, confidence_data = line[1]
            score = confidence_data[1]

            text_lines.append(text)
            total_confidence += score

            blocks.append({
                "text": text,
                "box": line[0],
                "confidence": round(score, 3)
            })

        full_text = '\n'.join(text_lines)
        avg_confidence = total_confidence / len(result[0])
        language = detect_language(full_text)

        return OCRResponse(
            success=True,
            text=full_text,
            confidence=round(avg_confidence, 2),
            language=language,
            blocks=blocks
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080, workers=1)
