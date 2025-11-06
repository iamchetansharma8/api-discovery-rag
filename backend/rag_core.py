from dotenv import load_dotenv
import os, json, requests, faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# ---------------------------
# Setup
# ---------------------------
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
# Retrieve and merge Top 3 APIs
# ---------------------------
def get_top_apis_with_full_context(query, top_k=3):
    """
    Retrieves top_k most similar APIs and merges all metadata entries by title.
    """
    model, index, metadata = load_resources()

    q_emb = model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    scores, ids = index.search(q_emb, top_k * 4)  # fetch extra for duplicates

    results_by_title = {}
    for idx, score in zip(ids[0], scores[0]):
        if idx >= len(metadata):
            continue
        api = metadata[idx]
        title = api.get("title", "Untitled API")
        sim = round(float(score) * 100, 1)

        # Merge endpoints and metadata for same API title
        if title not in results_by_title:
            results_by_title[title] = {
                "title": title,
                "description": api.get("description", ""),
                "base_urls": set(api.get("base_urls", [])),
                "endpoints": api.get("endpoints", []),
                "score": sim,
            }
        else:
            results_by_title[title]["base_urls"].update(api.get("base_urls", []))
            results_by_title[title]["endpoints"].extend(api.get("endpoints", []))
            results_by_title[title]["description"] += " " + api.get("description", "")
            results_by_title[title]["score"] = max(results_by_title[title]["score"], sim)

    # Convert base_urls from set to list, sort by score
    merged_results = [
        {
            "title": v["title"],
            "description": v["description"].strip() or "No description available.",
            "score": v["score"],
            "base_urls": list(v["base_urls"]),
            "endpoints": v["endpoints"][:10],
            "total_endpoints": len(v["endpoints"]),
        }
        for v in results_by_title.values()
    ]

    top_results = sorted(merged_results, key=lambda x: x["score"], reverse=True)[:top_k]

    print(f"\nTop {len(top_results)} APIs for '{query}':")
    print(json.dumps(top_results, indent=2))
    return top_results


# ---------------------------
# Build Prompt for LLM
# ---------------------------
def build_prompt(query, apis):
    """
    Builds a structured, markdown-friendly prompt giving Groq full context for 3 APIs,
    but instructs it to analyze only the one it deems most relevant.
    """

    # Create a Markdown table summarizing all top APIs
    summary_table = "| Rank | API Title | Match % | Description (short) |\n|------|------------|----------|----------------------|\n"
    for i, a in enumerate(apis, start=1):
        short_desc = a["description"][:80].replace("\n", " ") + ("..." if len(a["description"]) > 80 else "")
        summary_table += f"| {i} | **{a['title']}** | {a['score']}% | {short_desc} |\n"

    # Full context with endpoints
    context_blocks = []
    for i, a in enumerate(apis, start=1):
        endpoints = a.get("endpoints", [])
        endpoint_list = "\n".join([
            f"- **`{e.get('method', 'GET')} {e.get('path', '')}`** — {e.get('summary', '').strip()}"
            for e in endpoints
        ]) or "_No endpoints available_"

        block = f"""
---

### 🔹 API {i}: **{a['title']}**
**Similarity:** {a['score']}%  
**Description:** {a['description']}  

**Base URLs:**  
{', '.join(a.get('base_urls', [])) or 'N/A'}

**Total Endpoints:** {a.get('total_endpoints', len(endpoints))}

**Example Endpoints:**  
{endpoint_list}
"""
        context_blocks.append(block.strip())

    context = "\n\n".join(context_blocks)

    # Final prompt
    return f"""
You are an **API Discovery Assistant** that helps developers determine whether an existing API already fulfills their use case.

---

## 🧠 User Query
> {query}

---

## 📊 Summary of Top 3 APIs
These were retrieved using **semantic vector similarity**, which reflects how closely each API’s documentation matches the query.  
It is **not** a measure of exact functionality.

{summary_table}

---

## 📘 API Details
Below is detailed information for each of the top APIs:

{context}

---

## 🧭 Response Instructions

1. List the three APIs (already shown above) in your response summary.  
2. Then, analyze **only the API you believe is most relevant**, based on description and endpoints (not match %).  
3. If the query seems unrelated to APIs, respond naturally and state that it's outside the scope.

---

## 🧩 Response Format (for relevant queries, Note: Don't follow this format and give answer in 2-3 simple lines if you think query is irrelevant and politely decline)

### 🏷️ API Analysis for "{query}"

#### **1️⃣ API Existence**
Say whether a similar API exists and which one you find most relevant.

#### **2️⃣ Relevant Endpoints**
List the key endpoints and briefly explain their purpose.

#### **3️⃣ Differences / Gaps**
Describe any missing features or mismatches.

#### **4️⃣ Conclusion**
Provide a short recommendation — reuse, extend, or create new API.

#### **Data Used by LLM of Top 3 Matches**
List all three APIs with their titles and match percentages, as a short Markdown table. Make this table beautifully formatted.
---

🟢 **Formatting Rules**
- Use clear Markdown headings and bullet points.
- Highlight API names and endpoints in **bold** and `code` formatting.
- Be concise, factual, and developer-friendly.
- Do not justify similarity percentages — they’re only context.
- very very important: Don't follow this format if you think query is unrelated to APIs. Use your own words to politely decline.
"""


# ---------------------------
# Query Groq
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
# Main RAG Function
# ---------------------------
def rag_answer(query):
    apis = get_top_apis_with_full_context(query, top_k=3)
    prompt = build_prompt(query, apis)
    print("-------prompt-------")
    print(prompt)
    return query_groq(prompt)


# from dotenv import load_dotenv
# import os, json, requests, faiss
# import numpy as np
# from sentence_transformers import SentenceTransformer

# # ---------------------------
# # Setup
# # ---------------------------
# load_dotenv()

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# INDEX_DIR = os.path.join(BASE_DIR, "data/faiss_index")

# MODEL_NAME = "all-MiniLM-L6-v2"
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# GROQ_MODEL = "llama-3.3-70b-versatile"

# _model = None
# _index = None
# _metadata = None


# # ---------------------------
# # Load model, FAISS, metadata
# # ---------------------------
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


# # ---------------------------
# # Retrieve Top API (with full metadata merged)
# # ---------------------------
# def get_top_api_with_full_context(query):
#     """
#     Finds the top API match and merges all metadata entries for the same title.
#     """
#     model, index, metadata = load_resources()

#     # Step 1: Encode and search
#     q_emb = model.encode([query], convert_to_numpy=True)
#     faiss.normalize_L2(q_emb)
#     scores, ids = index.search(q_emb, 5)  # fetch a few to handle duplicates

#     best_idx = int(ids[0][0])
#     best_score = float(scores[0][0])
#     best_api = metadata[best_idx]
#     best_title = best_api.get("title", "Untitled API")

#     # Step 2: Merge all chunks for the same API title
#     merged_endpoints = []
#     merged_descriptions = set()
#     base_urls = set()

#     for item in metadata:
#         if item.get("title") == best_title:
#             merged_endpoints.extend(item.get("endpoints", []))
#             desc = item.get("description")
#             if desc:
#                 merged_descriptions.add(desc)
#             for url in item.get("base_urls", []):
#                 base_urls.add(url)

#     # Step 3: Build the unified API object
#     merged_api = {
#         "title": best_title,
#         "description": " ".join(list(merged_descriptions)) or "No description available.",
#         "score": round(best_score * 100, 1),
#         "base_urls": list(base_urls),
#         "total_endpoints": len(merged_endpoints),
#         "endpoints": merged_endpoints[:10],  # limit to 10 for clarity
#     }

#     print(f"\nTop API for '{query}': {best_title} ({merged_api['score']}%) with {len(merged_endpoints)} endpoints")
#     return merged_api

# def build_prompt(query, apis):
#     """
#     Builds a clearly formatted, Markdown-enforced prompt for LLM with top API details.
#     """

#     context_blocks = []
#     for i, a in enumerate(apis, start=1):
#         endpoints = a.get("endpoints", [])
#         endpoint_list = "\n".join([
#             f"- **`{e.get('method', 'GET')} {e.get('path', '')}`** — {e.get('summary', '').strip()}"
#             for e in endpoints
#         ]) or "_No endpoints available_"

#         block = f"""
# ---

# ### 🔹 API {i}: **{a['title']}**
# **Similarity:** {a['score']}%  
# **Description:** {a['description']}  

# **Endpoints:**  
# {endpoint_list}
# """
#         context_blocks.append(block.strip())

#     context = "\n\n".join(context_blocks)

#     return f"""
# You are an **API Discovery Assistant** that helps developers determine whether an existing API already fulfills their use case.

# ---

# ## 🧠 User Query
# > {query}

# ---

# ## 📘 Top Relevant APIs (by vector similarity)
# {context}

# ---

# ### 🔍 Note on Similarity Scores
# Each percentage shown above represents **semantic similarity** between the query and the API documentation,  
# as computed by vector embeddings — not an exact measure of functional overlap.  
# Use this as a **contextual hint**, not as a strict determinant of relevance.

# ---

# ## 🧩 Response Instructions

# You must decide how to respond **based on the nature of the query**:

# 1. **If the query clearly relates to APIs, endpoints, data retrieval, or developer integration:**
#    - Follow the structured Markdown format below.

# 2. **If the query is unrelated to APIs (e.g., general questions, personal queries, etc.):**
#    - **Do not follow the structured format.**
#    - Instead, respond naturally with a short, polite message explaining that the query is outside the scope of API discovery.

# ---

# ## 📑 Structured Format (For Relevant Queries)

# ### 🏷️ API Analysis for "{query}"

# #### **1️⃣ API Existence**
# State whether a similar API exists.  
# You may reference the similarity percentage as context, but base your reasoning on endpoint details and descriptions.

# #### **2️⃣ Relevant Endpoints**
# List endpoints that align with the user’s intent:
# - `GET /example` — what it does and why it’s relevant.

# #### **3️⃣ Differences / Gaps**
# Describe what is missing or differs from the expected functionality.

# #### **4️⃣ Conclusion**
# Provide a concise recommendation — reuse, extend, or create a new API.

# ---

# 🟢 **Formatting rules:**
# - Use clear section headings (`##`, `###`), bullet points, and bold text.
# - Be concise, accurate, and developer-focused.
# - Avoid overexplaining similarity percentages.
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


# # ---------------------------
# # Main RAG Function
# # ---------------------------
# def rag_answer(query):
#     api = get_top_api_with_full_context(query)
#     prompt = build_prompt(query, [api])
#     return query_groq(prompt)
