# Use official Python image
FROM python:3.11-slim

# Set environment variables 
# this will remove files _pycache_ and prevent Python from writing .pyc files, which can save disk space and reduce clutter in the container.
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set workdir
WORKDIR /app

# Install OS dependencies
RUN apt-get update && apt-get install -y build-essential poppler-utils curl && rm -rf /var/lib/apt/lists/*

# Install uv (Python package/dependency manager)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"
ENV UV_LINK_MODE=copy
ENV PYTHONPATH="/app:/app/multi_doc_chat"

# Copy dependency manifests for better layer caching
COPY pyproject.toml uv.lock README.md ./
COPY multi_doc_chat ./multi_doc_chat

# Install project dependencies into the system interpreter
RUN uv pip install --system .

# Copy project files
COPY . .


# Expose port
EXPOSE 8080

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
