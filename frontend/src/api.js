// src/api.js
// const isProd = import.meta.env.MODE === "production";
// export const BASE_URL = isProd
//   ? "https://api-discovery-rag.onrender.com" // Render backend URL
//   : "http://127.0.0.1:8000"; // Local dev

// export async function queryBackend(message) {
//   const res = await fetch(`${BASE_URL}/query`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ query: message }),
//   });

//   if (!res.ok) {
//     throw new Error("Backend request failed");
//   }

//   const data = await res.json();
//   return data.response;
// }
const isProd = import.meta.env.MODE === "production";

export const BASE_URL = isProd
  ? "https://api-discovery-rag.onrender.com"
  : "http://127.0.0.1:8000";

export async function queryBackend(message) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: message }),
  });

  if (!res.ok) {
    throw new Error("Backend request failed");
  }

  const data = await res.json();
  return data.response;
}
