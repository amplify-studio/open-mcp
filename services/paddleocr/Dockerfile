# PaddleOCR Service Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install Python dependencies in a single layer for better caching
# Install core dependencies first, then remove cache
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        paddlepaddle \
        paddleocr \
        fastapi \
        uvicorn[standard] \
    && rm -rf /root/.cache/pip

# Copy service code
COPY ocr-service.py /app/

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"

# Run the service
CMD ["python", "ocr-service.py"]
