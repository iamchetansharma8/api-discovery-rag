# backend/build_faiss_index.py
import json
import os
from tqdm import tqdm
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

DATA_FILE = "data/api_docs_clean.json"  # your merged cleaned file
OUT_DIR = "data/faiss_index"
EMBED_MODEL = "all-MiniLM-L6-v2"  # small, fast, good for semantic search

os.makedirs(OUT_DIR, exist_ok=True)

print("Loading API data...")
with open(DATA_FILE, "r") as f:
    apis = json.load(f)

print(f"Found {len(apis)} API specs")

# 1) Convert each API into one "document text"
docs = []
meta = []
for i, api in enumerate(apis):
    title = api.get("title") or ""
    desc = api.get("description") or ""
    endpoints = api.get("endpoints", [])
    ep_text = []
    for e in endpoints:
        method = e.get("method", "")
        path = e.get("path", "")
        summary = e.get("summary", "") or ""
        ep_text.append(f"{method} {path} - {summary}")
    full_text = "\n".join([title, desc] + ep_text)
    docs.append(full_text)
    meta.append({
        "id": i,
        "title": title,
        "description": desc,
        "endpoints": endpoints,
        "raw": api
    })

# 2) Create embeddings
print("Loading embedding model:", EMBED_MODEL)
model = SentenceTransformer(EMBED_MODEL)

print("Computing embeddings...")
embs = model.encode(docs, show_progress_bar=True, convert_to_numpy=True)
# Normalize for cosine similarity using inner product
faiss.normalize_L2(embs)

d = embs.shape[1]
print(f"Embedding dimension: {d}")

# 3) Build FAISS index (IndexFlatIP for cosine similarity)
index = faiss.IndexFlatIP(d)
index.add(embs)
print(f"Indexed {index.ntotal} vectors")

# 4) Save index and metadata
faiss.write_index(index, os.path.join(OUT_DIR, "api_faiss.index"))
with open(os.path.join(OUT_DIR, "metadata.json"), "w") as f:
    json.dump(meta, f, indent=2)

print("Saved index to:", os.path.join(OUT_DIR, "api_faiss.index"))
print("Saved metadata to:", os.path.join(OUT_DIR, "metadata.json"))
print("Done.")
