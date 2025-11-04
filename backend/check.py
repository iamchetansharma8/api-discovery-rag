import faiss
index = faiss.read_index("../data/faiss_index/api_faiss.index")
print(index.metric_type)
