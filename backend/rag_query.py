import os, json, requests, numpy as np, faiss
from sentence_transformers import SentenceTransformer

INDEX_DIR = "data/faiss_index"
MODEL = "all-MiniLM-L6-v2"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # set this once in your terminal

def load_resources():
    idx = faiss.read_index(os.path.join(INDEX_DIR, "api_faiss.index"))
    with open(os.path.join(INDEX_DIR, "metadata.json")) as f:
        meta = json.load(f)
    model = SentenceTransformer(MODEL)
    return idx, meta, model

def retrieve_apis(query, k=5):
    idx, meta, model = load_resources()
    q_emb = model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    scores, ids = idx.search(q_emb, k)
    results = []
    for score, i in zip(scores[0], ids[0]):
        if i == -1: continue
        results.append(meta[i])
    return results

def build_prompt(user_query, retrieved):
    context_parts = []
    for r in retrieved:
        endpoint_summaries = [
            f"{e.get('method', '')} {e.get('path', '')}"
            for e in r.get("endpoints", [])[:3]
        ]
        context_parts.append(
            f"API: {r.get('title', '')}\n"
            f"Description: {r.get('description', '')}\n"
            f"Endpoints: {endpoint_summaries}"
        )
    context = "\n\n".join(context_parts)

    return f"""
You are an assistant that helps developers find if an API already exists or if they need to build one.

User query:
\"{user_query}\"

Here are the most relevant existing APIs:
{context}

Answer concisely:
1. Does a similar API already exist?
2. Which one(s) match best, and why?
3. If not exact, suggest which existing APIs are closest.
"""


def ask_groq(prompt):
    if not GROQ_API_KEY:
        raise ValueError("❌ Missing GROQ_API_KEY environment variable.")
    
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    payload = {
        "model": "llama-3.3-70b-versatile",   # ✅ updated model
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=headers,
        json=payload
    )

    try:
        data = response.json()
    except Exception as e:
        print("❌ Failed to parse JSON:", e)
        print(response.text)
        return "Error parsing API response."

    if "error" in data:
        print("❌ Groq API returned an error:", data["error"])
        return f"Groq API error: {data['error']}"

    if "choices" not in data:
        print("⚠️ Unexpected response structure:", data)
        return "Groq API did not return a valid completion."

    return data["choices"][0]["message"]["content"]



if __name__ == "__main__":
    q = input("🔍 Enter your API query: ")
    results = retrieve_apis(q)
    prompt = build_prompt(q, results)
    answer = ask_groq(prompt)
    print("\n🤖 Assistant Response:\n")
    print(answer)
