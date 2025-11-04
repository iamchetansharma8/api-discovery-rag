# backend/query_faiss.py
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import argparse
import os

INDEX_DIR = "data/faiss_index"
MODEL = "all-MiniLM-L6-v2"

def load_resources():
    idx = faiss.read_index(os.path.join(INDEX_DIR, "api_faiss.index"))
    with open(os.path.join(INDEX_DIR, "metadata.json"), "r") as f:
        meta = json.load(f)
    model = SentenceTransformer(MODEL)
    return idx, meta, model

def query(q, k=5):
    idx, meta, model = load_resources()
    q_emb = model.encode([q], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    scores, ids = idx.search(q_emb, k)
    results = []
    for score, i in zip(scores[0], ids[0]):
        if i == -1:
            continue
        m = meta[i]
        results.append({
            "score": float(score),
            "title": m.get("title"),
            "description": m.get("description"),
            "endpoints": m.get("endpoints")
        })
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--q", "-q", required=True, help="Query string")
    parser.add_argument("--k", "-k", type=int, default=5, help="Top K results")
    args = parser.parse_args()

    r = query(args.q, k=args.k)
    print(f"\n🔍 Top {len(r)} results for: \"{args.q}\"\n")
    for i, item in enumerate(r, start=1):
        print(f"{i}. {item['title']} (score={item['score']:.4f})")
        print(f"   desc: {(item['description'] or '')[:200].replace(chr(10),' ')}...")
        eps = [f"{e.get('method','')} {e.get('path','')}" for e in item.get('endpoints', [])]
        print(f"   endpoints: {eps[:5]}")
        print()
