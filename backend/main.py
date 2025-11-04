from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_core import rag_answer, get_top_apis

# Initialize FastAPI app
app = FastAPI(
    title="API Discovery RAG Backend",
    description="Backend service that helps developers discover existing APIs using semantic search and LLM reasoning.",
    version="1.0.0"
)

# Allow local frontend or web app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/demo simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check route
@app.get("/")
def health():
    return {"status": "ok", "message": "API Discovery RAG backend is running"}

# Request model for endpoints
class QueryRequest(BaseModel):
    query: str

# Main RAG endpoint (with LLM reasoning)
@app.post("/query")
async def query_api(request: QueryRequest):
    query = request.query
    response = rag_answer(query)
    return {"query": query, "response": response}

# Simple retrieval endpoint (top FAISS results only)
@app.post("/top_apis")
async def top_apis(request: QueryRequest):
    query = request.query
    matches = get_top_apis(query)
    return {"query": query, "top_matches": matches}
