# LLMOps Pipeline — Production-Ready Multi-Document Conversational RAG System

A production-focused Conversational RAG (Retrieval-Augmented Generation) system built using FastAPI, LangChain, FAISS, Groq/Gemini LLMs, and Docker.

The system supports:
- Multi-document ingestion
- Conversational memory
- Semantic retrieval using MMR
- LangSmith evaluation
- CI/CD automation
- AWS ECS Fargate deployment

---

# Features

- Multi-document chat support (`PDF`, `DOCX`, `TXT`)
- Conversational RAG with chat history
- FAISS vector database
- MMR (Maximal Marginal Relevance) retrieval
- Groq + Gemini LLM support
- HuggingFace embeddings
- FastAPI REST API
- LangSmith evaluation pipeline
- Dockerized deployment
- CI/CD using GitHub Actions
- AWS ECS Fargate deployment
- Structured logging using Structlog
- Session-based indexing
- Modular enterprise-level architecture
- Unit & integration testing using Pytest

---

# System Architecture

```text
User Uploads Documents
        ↓
Document Ingestion
        ↓
Chunking using RecursiveCharacterTextSplitter
        ↓
Embeddings Generation
        ↓
FAISS Vector Store
        ↓
Retriever (MMR / Similarity)
        ↓
LLM (Groq / Gemini)
        ↓
Conversational RAG Response
```

---

# Tech Stack

## Backend

- FastAPI
- LangChain
- LangSmith
- FAISS
- Structlog
- Pydantic

## LLM Providers

- Groq (`openai/gpt-oss-20b`)
- Google Gemini

## Embeddings

- HuggingFace Sentence Transformers
- `sentence-transformers/all-MiniLM-L6-v2`

## DevOps

- Docker
- GitHub Actions
- AWS ECS Fargate
- Amazon ECR
- AWS Secrets Manager

## Testing

- Pytest
- FastAPI TestClient

---

# Project Structure

```text
LLMOps-pipeline/
│
├── main.py
├── run_evaluations.py
├── Dockerfile
├── pyproject.toml
│
├── multi_doc_chat/
│   ├── config/
│   ├── exception/
│   ├── logger/
│   ├── model/
│   ├── prompts/
│   ├── src/
│   │   ├── document_chat/
│   │   └── document_ingestion/
│   └── utils/
│
├── tests/
│   ├── integration/
│   └── unit/
│
├── .github/workflows/
│   ├── ci.yml
│   ├── aws.yml
│   └── task_definition.json
```

---

# Retrieval Strategy

The system supports:

## Similarity Search

Retrieves the most semantically similar chunks.

## MMR Search (Recommended)

Balances:
- Relevance
- Diversity

Prevents duplicate or overly similar chunks from being retrieved.

```python
search_type="mmr"
fetch_k=20
lambda_mult=0.5
```

---

# Local Setup

## 1. Clone Repository

```bash
git clone https://github.com/Ahamed-Safnas/LLMOps-pipeline.git
cd LLMOps-pipeline
```

---

## 2. Create Environment

```bash
uv venv
```

Activate:

### Windows

```bash
.venv\Scripts\activate
```

### Linux / Mac

```bash
source .venv/bin/activate
```

---

## 3. Install Dependencies

```bash
uv sync
```

---

## 4. Configure Environment Variables

Create `.env`

```env
GROQ_API_KEY=your_key
GOOGLE_API_KEY=your_key
LANGSMITH_API_KEY=your_key

LLM_PROVIDER=groq
```

---

## 5. Run Application

```bash
uvicorn main:app --reload
```

---

# API Endpoints

## Health Check

```http
GET /health
```

---

## Upload Documents

```http
POST /upload
```

Uploads documents and creates FAISS index.

Returns:

```json
{
  "session_id": "session_xxx",
  "indexed": true
}
```

---

## Chat Endpoint

```http
POST /chat
```

Request:

```json
{
  "session_id": "session_xxx",
  "message": "What is RAG?"
}
```

---

# Docker Deployment

## Build Docker Image

```bash
docker build -t llmops-pipeline .
```

## Run Container

```bash
docker run -p 8080:8080 llmops-pipeline
```

---

# AWS ECS Fargate Deployment

The project includes complete CI/CD deployment automation using:

- GitHub Actions
- Amazon ECR
- ECS Fargate

Deployment Flow:

```text
Push Code
    ↓
GitHub Actions CI
    ↓
Docker Build
    ↓
Push to Amazon ECR
    ↓
Render ECS Task Definition
    ↓
Deploy to ECS Fargate
```

---

# LangSmith Evaluation

Supports:

- Custom LLM-as-a-Judge evaluators
- Built-in LangChain evaluators
- CoT QA evaluation

Run evaluations:

```bash
python run_evaluations.py --dataset AgenticAIReportGoldens --evaluator correctness
```

---

# Testing

Run tests:

```bash
uv run pytest
```

Includes:

- Unit Tests
- Integration Tests
- API Route Tests
- Retrieval Tests
- Ingestion Tests

---

# Security

- AWS Secrets Manager integration
- Environment-based configuration
- No hardcoded credentials
- IAM-based AWS authentication support

---

# Logging

Structured JSON logging using Structlog.

Example:

```json
{
  "timestamp": "...",
  "level": "info",
  "event": "FAISS retriever loaded successfully"
}
```

---

# Future Improvements

- Hybrid Search
- Reranking Layer
- PostgreSQL + pgvector
- Redis Chat Memory
- Multi-user authentication
- Streaming responses
- Guardrails integration
- Observability dashboards

---

# Author

## Ahamed Safnas

AI/ML Engineer focused on:
- Production ML Systems
- LLMOps
- RAG Pipelines
- MLOps
- AI Infrastructure

GitHub: https://github.com/Ahamed-Safnas

---

# License

MIT License