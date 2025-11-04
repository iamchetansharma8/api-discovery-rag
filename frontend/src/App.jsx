// src/App.jsx
import { useState } from "react";
import ChatMessage from "./components/ChatMessage";
import { queryBackend } from "./api";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await queryBackend(input);
      const botMessage = { sender: "bot", text: response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        sender: "bot",
        text: "⚠️ Error fetching response.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow p-4 text-center font-semibold text-xl">
        API Discovery Assistant
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} sender={msg.sender} text={msg.text} />
        ))}
        {loading && (
          <div className="text-gray-500 text-sm text-center mt-2 animate-pulse">
            Thinking...
          </div>
        )}
      </main>

      <footer className="p-4 bg-white border-t flex items-center gap-2">
        <textarea
          className="flex-1 border rounded-lg p-2 resize-none h-12 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Ask something like 'Do we have an API to check account balance?'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
