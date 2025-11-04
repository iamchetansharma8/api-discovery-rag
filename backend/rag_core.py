import os, json, requests, faiss
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_DIR = os.path.join(BASE_DIR, "../data/faiss_index")
MODEL_NAME = "all-MiniLM-L6-v2"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

_model = None
_index = None
_metadata = None

def load_resources():
    global _model, _index, _metadata
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    if _index is None:
        _index = faiss.read_index(f"{INDEX_DIR}/api_faiss.index")
    if _metadata is None:
        with open(f"{INDEX_DIR}/metadata.json") as f:
            _metadata = json.load(f)
    return _model, _index, _metadata


def retrieve_apis(query, k=5):
    model, index, metadata = load_resources()
    q_emb = model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    scores, ids = index.search(q_emb, k)
    results = [metadata[i] for i in ids[0] if i != -1]
    return results


def build_prompt(query, apis):
    context_blocks = []
    for a in apis:
        endpoints_preview = [f"{e.get('method')} {e.get('path')}" for e in a['endpoints'][:3]]
        formatted_text = (
            f"API: {a['title']}\n"
            f"Description: {a['description']}\n"
            f"Endpoints: {endpoints_preview}"
        )
        context_blocks.append(formatted_text)

    context = "\n\n".join(context_blocks)

    return f"""
You are an assistant that helps developers find if an API already exists.

User query:
\"{query}\"

Existing APIs:
{context}

Answer concisely:
1. Does a similar API already exist?
2. Which ones match best and why?
3. If not exact, which APIs come closest?
"""



def query_groq(prompt):
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
    }
    r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
    data = r.json()
    if "choices" in data:
        return data["choices"][0]["message"]["content"]
    else:
        return f"Error: {data.get('error', 'Unknown error')}"


def rag_answer(query):
    apis = retrieve_apis(query)
    prompt = build_prompt(query, apis)
    return query_groq(prompt)

def get_top_apis(query, top_k=5):
    """
    Returns top_k most similar APIs (without LLM reasoning).
    """
    model, index, metadata = load_resources()
    query_embedding = model.encode([query])
    distances, indices = index.search(np.array(query_embedding).astype('float32'), top_k)
    
    top_results = []
    for idx, dist in zip(indices[0], distances[0]):
        if idx < len(metadata):
            api = metadata[idx]
            top_results.append({
                "title": api.get("title", "Untitled API"),
                "description": api.get("description", "No description"),
                "score": float(1 - dist)  # normalize similarity
            })
    return top_results
