# from dotenv import load_dotenv
# import os, json, requests, faiss
# import numpy as np
# from sentence_transformers import SentenceTransformer
# load_dotenv()  # loads .env file

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# INDEX_DIR = os.path.join(BASE_DIR, "../data/faiss_index")
# MODEL_NAME = "all-MiniLM-L6-v2"
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# GROQ_MODEL = "llama-3.3-70b-versatile"

# _model = None
# _index = None
# _metadata = None

# def load_resources():
#     global _model, _index, _metadata
#     if _model is None:
#         _model = SentenceTransformer(MODEL_NAME)
#     if _index is None:
#         _index = faiss.read_index(f"{INDEX_DIR}/api_faiss.index")
#     if _metadata is None:
#         with open(f"{INDEX_DIR}/metadata.json") as f:
#             _metadata = json.load(f)
#     return _model, _index, _metadata


# def retrieve_apis(query, k=5):
#     model, index, metadata = load_resources()
#     q_emb = model.encode([query], convert_to_numpy=True)
#     faiss.normalize_L2(q_emb)
#     scores, ids = index.search(q_emb, k)
#     results = [metadata[i] for i in ids[0] if i != -1]
#     return results

# def build_prompt(query, apis):
#     """
#     Builds a structured, markdown-friendly prompt for the LLM.
#     Expects `apis` to contain keys: title, description, and score (0–1 float).
#     """

#     # Format the context block
#     context_blocks = []
#     for a in apis:
#         score_percent = round(a.get("score", 0) * 100, 1)
#         formatted_text = (
#             f"### {a['title']} — {score_percent}% match\n"
#             f"**Description:** {a['description']}"
#         )
#         context_blocks.append(formatted_text)

#     context = "\n\n".join(context_blocks)

#     # Prompt body
#     return f"""
# You are an assistant that helps developers discover whether an API already exists for their use case.

# User query:
# > {query}

# Existing APIs (with similarity scores between 0–100%):
# {context}

# ---

# Please respond in **Markdown format** with clear sections using headings and bullet points.
# Your response should include:

# 1. **API Existence** — Whether a similar API already exists based on the similarity percentages.
# 2. **Relevant APIs** — List APIs sorted by similarity (highest first), showing percentage match and explaining why they are relevant.
# 3. **Closest Match and Differences** — If no exact match, describe the closest API and how it differs.
# 4. **Conclusion** — Give a short, actionable summary.

# Format your answer cleanly for readability — use headings (##), bold for key points, and bullet lists.
# Be sure to **accurately reference the similarity percentages** provided above.
# """


# def query_groq(prompt):
#     headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
#     payload = {
#         "model": GROQ_MODEL,
#         "messages": [{"role": "user", "content": prompt}],
#     }
#     r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
#     data = r.json()
#     if "choices" in data:
#         return data["choices"][0]["message"]["content"]
#     else:
#         return f"Error: {data.get('error', 'Unknown error')}"


# def rag_answer(query):
#     apis = retrieve_apis(query)
#     prompt = build_prompt(query, apis)
#     return query_groq(prompt)

# def get_top_apis(query, top_k=5):
#     """
#     Returns top_k most similar APIs (without LLM reasoning).
#     """
#     model, index, metadata = load_resources()
#     query_embedding = model.encode([query])
#     distances, indices = index.search(np.array(query_embedding).astype('float32'), top_k)
    
#     top_results = []
#     for idx, dist in zip(indices[0], distances[0]):
#         if idx < len(metadata):
#             api = metadata[idx]
#             top_results.append({
#                 "title": api.get("title", "Untitled API"),
#                 "description": api.get("description", "No description"),
#                 "score": float(1 - dist)  # normalize similarity
#             })
#     print(f"Top {len(top_results)} APIs for query: \"{query}\"")
#     print(top_results)
#     return top_results




# def build_prompt(query, apis):
#     context_blocks = []
#     for a in apis:
#         endpoints_preview = [f"{e.get('method')} {e.get('path')}" for e in a['endpoints'][:3]]
#         formatted_text = (
#             f"API: {a['title']}\n"
#             f"Description: {a['description']}\n"
#             f"Endpoints: {endpoints_preview}"
#         )
#         context_blocks.append(formatted_text)

#     context = "\n\n".join(context_blocks)

#     return f"""
# You are an assistant that helps developers find if an API already exists.

# User query:
# \"{query}\"

# Existing APIs:
# {context}

# Answer concisely:
# 1. Does a similar API already exist?
# 2. Which ones match best and why?
# 3. If not exact, which APIs come closest?
# """

# def build_prompt(query, apis):
#     context_blocks = []
#     for a in apis:
#         endpoints_preview = "\n".join(
#             [f"- {e.get('method', '').upper()} {e.get('path', '')}" for e in a.get('endpoints', [])[:3]]
#         )
#         formatted_text = (
#             f"API Name: {a.get('title', 'N/A')}\n"
#             f"Description: {a.get('description', 'No description provided.')}\n"
#             f"Endpoints:\n{endpoints_preview}\n"
#         )
#         context_blocks.append(formatted_text.strip())

#     context = "\n\n---\n\n".join(context_blocks)

#     return f"""
# You are an expert API discovery assistant that helps developers determine whether an API already exists.

# ### Developer Query
# "{query}"

# ### Retrieved APIs (context)
# {context}

# ### Your Task
# Based only on the above information:
# 1. State whether a similar API already exists.
# 2. List the most relevant APIs, explaining *why* they are similar.
# 3. If no exact match exists, suggest which APIs come closest and what differences they have.
# 4. Be concise, structured, and avoid restating context unnecessarily.
# """

# def build_prompt(query, apis):
#     context_blocks = []
#     for a in apis:
#         endpoints_preview = [f"{e.get('method')} {e.get('path')}" for e in a['endpoints'][:3]]
#         formatted_text = (
#             f"### API: {a['title']}\n"
#             f"**Description:** {a['description']}\n"
#             f"**Endpoints (sample):** {', '.join(endpoints_preview)}"
#         )
#         context_blocks.append(formatted_text)

#     context = "\n\n".join(context_blocks)

#     return f"""
# You are an assistant that helps developers discover if an API already exists for their use case.

# User query:
# > {query}

# Existing APIs:
# {context}

# Please respond in **Markdown format** using clear headings and bullet points.
# Your response **must** include:
# 1. **API Existence** — whether a similar API already exists.
# 2. **Relevant APIs** — list the most relevant APIs and explain why.
# 3. **Closest Match and Differences** — if no exact match, describe the closest one and how it differs.
# 4. **Conclusion** — short summary or suggestion.

# Format your response using Markdown, with headings (##, ###), bullet points (-), and bold text for clarity.
# """


# from dotenv import load_dotenv
# import os, json, requests, faiss
# import numpy as np
# from sentence_transformers import SentenceTransformer

# load_dotenv()  # loads .env file

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# INDEX_DIR = os.path.join(BASE_DIR, "../data/faiss_index")
# MODEL_NAME = "all-MiniLM-L6-v2"
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# GROQ_MODEL = "llama-3.3-70b-versatile"

# _model = None
# _index = None
# _metadata = None


# def load_resources():
#     global _model, _index, _metadata
#     if _model is None:
#         _model = SentenceTransformer(MODEL_NAME)
#     if _index is None:
#         _index = faiss.read_index(f"{INDEX_DIR}/api_faiss.index")
#     if _metadata is None:
#         with open(f"{INDEX_DIR}/metadata.json") as f:
#             _metadata = json.load(f)
#     return _model, _index, _metadata


# def retrieve_apis(query, k=5):
#     model, index, metadata = load_resources()
#     q_emb = model.encode([query], convert_to_numpy=True)
#     faiss.normalize_L2(q_emb)
#     scores, ids = index.search(q_emb, k)
#     results = [metadata[i] for i in ids[0] if i != -1]
#     return results


# def build_prompt(query, apis):
#     """
#     Builds a structured, markdown-friendly prompt for the LLM.
#     Expects `apis` to contain keys: title, description, and normalized score (0–100 float).
#     """
#     context_blocks = []
#     for a in apis:
#         score_percent = round(a.get("score", 0), 1)
#         formatted_text = (
#             f"### {a['title']} — {score_percent}% match\n"
#             f"**Description:** {a['description']}"
#         )
#         context_blocks.append(formatted_text)

#     context = "\n\n".join(context_blocks)

#     return f"""
# You are an assistant that helps developers determine whether an API already exists for their use case.

# User query:
# > {query}

# Existing APIs (with similarity scores between 0–100%):
# {context}

# ---

# Respond in **Markdown** with these sections:
# 1. **API Existence** — Whether a similar API exists based on the scores.
# 2. **Relevant APIs** — Rank by percentage and explain why each is relevant.
# 3. **Closest Match and Differences** — If none are exact, discuss the closest and what differs.
# 4. **Conclusion** — A short summary with an actionable recommendation.

# Use headings (##), bold text for key points, and bullet lists.
# """


# def query_groq(prompt):
#     headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
#     payload = {
#         "model": GROQ_MODEL,
#         "messages": [{"role": "user", "content": prompt}],
#     }
#     r = requests.post(
#         "https://api.groq.com/openai/v1/chat/completions",
#         headers=headers,
#         json=payload,
#     )
#     data = r.json()
#     if "choices" in data:
#         return data["choices"][0]["message"]["content"]
#     else:
#         return f"Error: {data.get('error', 'Unknown error')}"


# def rag_answer(query):
#     apis = get_top_apis(query, top_k=5)  # use normalized top APIs
#     prompt = build_prompt(query, apis)
#     return query_groq(prompt)

# def get_top_apis(query, top_k=5):
#     """
#     Returns top_k most similar APIs using actual cosine similarity (0–1 scaled to %).
#     """
#     model, index, metadata = load_resources()
#     q_emb = model.encode([query], convert_to_numpy=True)
#     faiss.normalize_L2(q_emb)
#     scores, ids = index.search(q_emb, top_k * 3)

#     # Aggregate duplicates by title and keep highest similarity
#     results_by_title = {}
#     for idx, score in zip(ids[0], scores[0]):
#         if idx < len(metadata):
#             api = metadata[idx]
#             title = api.get("title", "Untitled API")
#             sim = round(score * 100, 1)  # directly use cosine similarity (0–1 → %)
#             if title not in results_by_title or sim > results_by_title[title]["score"]:
#                 results_by_title[title] = {
#                     "title": title,
#                     "description": api.get("description", "No description"),
#                     "score": sim
#                 }

#     # Sort and select top_k unique APIs
#     top_results = sorted(results_by_title.values(), key=lambda x: x["score"], reverse=True)[:top_k]

#     print(f"Top {len(top_results)} APIs for query: \"{query}\"")
#     print(top_results)
#     return top_results


# def get_top_apis(query, top_k=5):
#     """
#     Returns top_k most similar APIs with normalized scores (0–100%).
#     """
#     model, index, metadata = load_resources()
#     query_embedding = model.encode([query])
#     distances, indices = index.search(np.array(query_embedding).astype("float32"), top_k)

#     raw_scores = []
#     top_results = []
#     for idx, dist in zip(indices[0], distances[0]):
#         if idx < len(metadata):
#             api = metadata[idx]
#             raw_score = float(1 - dist)  # similarity proxy
#             raw_scores.append(raw_score)
#             top_results.append({
#                 "title": api.get("title", "Untitled API"),
#                 "description": api.get("description", "No description"),
#                 "raw_score": raw_score
#             })

#     # Normalize to 0–100%
#     if raw_scores:
#         min_score, max_score = min(raw_scores), max(raw_scores)
#         for a in top_results:
#             if max_score > min_score:
#                 normalized = (a["raw_score"] - min_score) / (max_score - min_score)
#             else:
#                 normalized = 0.0
#             a["score"] = round(normalized * 100, 1)
#             del a["raw_score"]

#     return top_results

# def get_top_apis(query, top_k=5):
#     """
#     Returns top_k most similar APIs based on actual FAISS cosine similarity scores.
#     """
#     model, index, metadata = load_resources()
#     query_embedding = model.encode([query])
#     distances, indices = index.search(np.array(query_embedding).astype('float32'), top_k * 3)

#     results_by_title = {}
#     for idx, dist in zip(indices[0], distances[0]):
#         if idx < len(metadata):
#             api = metadata[idx]
#             title = api.get("title", "Untitled API")
#             score = float(1 - dist) * 100  # convert FAISS distance to percentage similarity
#             if title not in results_by_title or score > results_by_title[title]["score"]:
#                 results_by_title[title] = {
#                     "title": title,
#                     "description": api.get("description", "No description"),
#                     "score": round(score, 1)
#                 }

#     # Sort and take top_k unique titles
#     top_results = sorted(results_by_title.values(), key=lambda x: x["score"], reverse=True)[:top_k]

#     print(f"Top {len(top_results)} APIs for query: \"{query}\"")
#     print(top_results)
#     return top_results

from dotenv import load_dotenv
import os, json, requests, faiss
import numpy as np
from sentence_transformers import SentenceTransformer

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_DIR = os.path.join(BASE_DIR, "data/faiss_index")

MODEL_NAME = "all-MiniLM-L6-v2"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

_model = None
_index = None
_metadata = None


# ---------------------------
# Load model, FAISS, metadata
# ---------------------------
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


# ---------------------------
# Retrieve Top APIs (Top 3)
# ---------------------------
def get_top_apis(query, top_k=3):
    """
    Returns top_k most similar APIs using cosine similarity (%), merging duplicates by title.
    """
    model, index, metadata = load_resources()
    q_emb = model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    scores, ids = index.search(q_emb, top_k * 3)  # fetch a few extra for deduplication

    results_by_title = {}
    for idx, score in zip(ids[0], scores[0]):
        if idx < len(metadata):
            api = metadata[idx]
            title = api.get("title", "Untitled API")
            sim = round(float(score) * 100, 1)
            if title not in results_by_title or sim > results_by_title[title]["score"]:
                results_by_title[title] = {
                    "title": title,
                    "description": api.get("description", "No description available."),
                    "score": sim,
                    "endpoints": api.get("endpoints", [])[:3],  # include only top 3 endpoints
                }

    top_results = sorted(results_by_title.values(), key=lambda x: x["score"], reverse=True)[:top_k]

    print(f"\nTop {len(top_results)} APIs for query: \"{query}\"")
    print(json.dumps(top_results, indent=2))
    return top_results


# ---------------------------
# Build LLM Prompt
# ---------------------------
def build_prompt(query, apis):
    """
    Builds a rich, markdown-friendly prompt for the LLM with endpoint context.
    """

    context_blocks = []
    for a in apis:
        endpoints = a.get("endpoints", [])
        score_percent = a.get("score", 0)
        if endpoints:
            endpoint_list = "\n".join([
                f"- `{e.get('method', 'GET')} {e.get('path', '')}` — {e.get('summary', '')}"
                for e in endpoints
            ])
        else:
            endpoint_list = "_No endpoint details available_"

        block = f"""
### {a['title']} — {score_percent}% match  
**Description:** {a['description']}  

**Example Endpoints:**  
{endpoint_list}
"""
        context_blocks.append(block.strip())

    context = "\n\n".join(context_blocks)

    return f"""
You are an API discovery assistant helping developers determine if an API already exists for their use case.

User Query:
> {query}

Existing APIs (Top 3 by similarity score):
{context}

---

Respond in **Markdown format** with clear structure and concise reasoning.

Your answer must include:

1. **API Existence** — Whether a similar API exists based on similarity scores.
2. **Relevant APIs** — Ranked list with percentage match and reasoning.
3. **Closest Match and Differences** — If none exact, discuss the closest and what differs.
4. **Conclusion** — A brief summary and actionable next step.

Focus especially on **endpoint names**, **methods**, and **summaries** to determine relevance.
"""


# ---------------------------
# Query Groq LLM
# ---------------------------
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


# ---------------------------
# Main RAG Answer
# ---------------------------
def rag_answer(query):
    apis = get_top_apis(query, top_k=3)
    prompt = build_prompt(query, apis)
    return query_groq(prompt)
