from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_core import rag_answer

# Initialize FastAPI app
app = FastAPI(
    title="API Discovery RAG Backend",
    description="Backend service that helps developers discover existing APIs using semantic search and LLM reasoning.",
    version="1.0.0"
)

# Allow local frontend or web app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/demo simplicity; restrict later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check route
@app.get("/")
def health():
    return {"status": "ok", "message": "API Discovery RAG backend is running"}

# Request model for /query endpoint
class QueryRequest(BaseModel):
    query: str

# Main RAG endpoint
@app.post("/query")
async def query_api(request: QueryRequest):
    query = request.query
    if not query:
        return {"error": "Missing 'query' field"}
    response = rag_answer(query)
    return {"query": query, "response": response}

