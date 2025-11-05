# 🤖 API Discovery Assistant

An intelligent **RAG-based (Retrieval-Augmented Generation)** system
that helps developers quickly determine whether an existing API already
fulfills their use case --- powered by **FAISS vector search**,
**Sentence Transformers**, and **Groq's Llama 3.3 70B model**.

------------------------------------------------------------------------

## 🚀 Overview

Developers in large organizations often rebuild APIs that already exist
but are poorly documented or hidden.\
This project solves that problem by allowing developers to **ask
questions in plain English** and instantly see if a relevant API already
exists.

### 🔧 How it works

1.  **Vector Search (FAISS)** --- Each API spec (from Swagger/OpenAPI)
    is embedded into dense vectors using Sentence Transformers.\
2.  **Similarity Search** --- When a query is received, it's compared to
    all stored APIs to find the most semantically similar ones.\
3.  **LLM Reasoning (Groq)** --- The top APIs are passed to Groq's Llama
    model, which analyzes relevance and returns a **structured Markdown
    report** explaining whether an API exists, which endpoints are
    relevant, and what gaps remain.

------------------------------------------------------------------------

## 🧠 Example Query → Response

### **Query:**

> "API to check transactions in account"

### **LLM Response:**

``` markdown
## 🏷️ API Analysis for "API to check transactions in account"

### 1️⃣ API Existence
A similar API exists — **Account and Transaction API Specification (55.3% match)** provides endpoints related to transactions.

### 2️⃣ Relevant Endpoints
- `GET /accounts/{AccountId}/transactions` — Retrieves transactions for a specific account.
- `GET /accounts` — Lists all accounts, which can be used before fetching transactions.
- `GET /accounts/{AccountId}` — Provides details about a specific account.

### 3️⃣ Differences / Gaps
The API lacks filtering by date or transaction type and doesn’t include analytics or summary views.

### 4️⃣ Conclusion
✅ You can reuse this API by adding transaction filters.  
⚙️ Extend with analytics endpoints if needed.
```

------------------------------------------------------------------------

## 🧩 Architecture

``` plaintext
                    ┌─────────────────────────────┐
                    │      React Frontend         │
                    │  - Chat UI with Markdown    │
                    │  - Sends query to backend   │
                    └────────────┬────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────┐
                    │        FastAPI Backend      │
                    │  - Loads FAISS index        │
                    │  - Searches top APIs        │
                    │  - Builds structured prompt │
                    │  - Calls Groq LLM           │
                    └────────────┬────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────┐
                    │        FAISS Index          │
                    │  - SentenceTransformer vecs │
                    │  - Metadata per API chunk   │
                    └─────────────────────────────┘
```

------------------------------------------------------------------------

## 🗂️ Project Structure

    api-discovery-assistant/
    ├── backend/
    │   ├── main.py                # FastAPI entry point
    │   ├── rag_core.py            # Vector search + LLM logic
    │   ├── requirements.txt       # Python dependencies
    │   ├── .env                   # Contains GROQ_API_KEY
    │   └── data/faiss_index/
    │       ├── api_faiss.index    # FAISS index file
    │       └── metadata.json      # Metadata of embedded APIs
    │
    ├── frontend/
    │   ├── src/
    │   │   ├── App.jsx            # Main React component
    │   │   ├── api.js             # API calls to backend
    │   │   └── components/
    │   │       └── ChatMessage.jsx
    │   ├── index.html
    │   ├── package.json
    │   ├── tailwind.config.js
    │   └── vite.config.js
    │
    ├── data/
    │   └── api_docs_clean.json    # Original API documentation
    │
    └── README.md

------------------------------------------------------------------------

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

``` bash
git clone https://github.com/iamchetansharma8/api-discovery-assistant.git
cd api-discovery-assistant
```

------------------------------------------------------------------------

### 2️⃣ Setup Backend

``` bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

``` bash
GROQ_API_KEY=your_groq_api_key_here
```

Run the backend:

``` bash
uvicorn main:app --reload --log-level debug
```

The backend will start at:

    http://localhost:8000

------------------------------------------------------------------------

### 3️⃣ Setup Frontend

``` bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at:

    http://localhost:5173

------------------------------------------------------------------------

## 🧮 Core Logic

### **1. Vector Search**

-   The `metadata.json` file contains all APIs (title, description,
    endpoints, etc.).
-   Queries are embedded via `SentenceTransformer('all-MiniLM-L6-v2')`.
-   FAISS performs a **cosine similarity** search to find the top APIs.

### **2. Prompt Construction**

Each top API is formatted like this before being sent to the LLM:

``` markdown
### 🔹 API 1: Account and Transaction API
**Similarity:** 55.3%  
**Description:** Provides account and transaction data endpoints.  

**Endpoints:**
- `GET /accounts/{AccountId}/transactions` — Retrieve transactions
- `GET /accounts` — List all accounts
```

### **3. LLM Analysis**

-   Uses **Groq's Llama 3.3 70B model**
-   Produces structured Markdown analysis following a fixed format.
-   If the query is **irrelevant to APIs**, it returns a short, polite
    message stating that.

------------------------------------------------------------------------

## 📊 Example Queries

  User Query                        Expected Behavior
  --------------------------------- ---------------------------
  `API to fetch ATM data`           Finds Open Data API
  `How to delete a user account?`   Responds as unrelated
  `Payment initiation endpoint`     Finds Payment Service API
  `List all bank branches`          Finds Branch Info API

------------------------------------------------------------------------

## 💡 Design Choices

-   **FAISS vector index** for fast semantic search\
-   **Merged metadata by title** ensures full API context\
-   **LLM prompt formatting** for clean Markdown output\
-   **Graceful handling of unrelated queries**

------------------------------------------------------------------------

## 🔬 Future Enhancements

-   ✅ Upload and auto-embed new OpenAPI specs\
-   ✅ Hybrid search with Elasticsearch ELSER\
-   ✅ Add feedback ranking from user interactions\
-   ✅ Implement API category filtering\
-   ✅ Add conversational context (session memory)

------------------------------------------------------------------------

## 📜 License

MIT License © 2025 [Chetan Sharma](https://github.com/iamchetansharma8)