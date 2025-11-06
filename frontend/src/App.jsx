import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatMessage from "./components/ChatMessage";
import Sidebar from "./components/Sidebar";
import { queryBackend } from "./api";

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [messages, setMessages] = useState([]);
  const [matches, setMatches] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = async (messageOverride = null) => {
    const messageToSend = messageOverride || input.trim();
    if (!messageToSend) return;

    const userMessage = { sender: "user", text: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await queryBackend(messageToSend);

      // Extract top 3 matches
      const matchRegex = /\|\s*\d+\s*\|\s*\*\*(.*?)\*\*\s*\|\s*([\d.]+)%/g;
      const found = [];
      let m;
      while ((m = matchRegex.exec(response))) {
        found.push({ title: m[1], score: parseFloat(m[2]) });
      }
      setMatches(found.slice(0, 3));

      const botMessage = { sender: "bot", text: response };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Error fetching response. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.4 } },
    exit: { x: -50, opacity: 0, transition: { duration: 0.3 } },
  };

  const samplePrompts = [
    "API for bank ATM and branch locator data",
    "API for Open Banking customer consent processing",
    "Is there an API for refund processing?",
    "Which API lists merchant payouts?",
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 bg-[radial-gradient(circle_at_top_left,_#eef2ff_0%,_#f9fafb_100%)]">
      {/* ─── Header ─── */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <h1
            className="text-xl font-bold text-gray-800 cursor-pointer"
            onClick={() => setActivePage("home")}
          >
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              API Sense
            </span>
            <p className="text-xs text-gray-500 italic -mt-1">
              Discover existing APIs intelligently
            </p>
          </h1>

          <nav className="space-x-6 text-sm font-medium">
            <button
              onClick={() => setActivePage("home")}
              className={`transition ${
                activePage === "home"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActivePage("about")}
              className={`transition ${
                activePage === "about"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              About
            </button>
          </nav>
        </div>
      </header>

      {/* ─── Page Switch ─── */}
      <AnimatePresence mode="wait">
        {activePage === "home" ? (
          <motion.div
            key="home"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-1 overflow-hidden relative"
          >
            <main className="flex-1 overflow-y-auto px-6 py-6 relative">
              {/* 🧭 Welcome screen */}
              {messages.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center text-center mt-32"
                >
                  <div className="max-w-2xl bg-white/70 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl p-10">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                      Welcome to API Sense 🚀
                    </h2>
                    <p className="text-gray-700 mb-6">
                      Discover existing APIs intelligently using{" "}
                      <strong>semantic search</strong> and{" "}
                      <strong>LLM reasoning</strong>.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Try one of these examples:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {samplePrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(prompt)} // 🔥 directly triggers API request
                          className="text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-700 shadow-sm transition"
                        >
                          💡 {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Chat Messages */}
              <div className="w-full max-w-5xl mx-auto space-y-4">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} sender={msg.sender} text={msg.text} />
                ))}

                {loading && (
                  <div className="text-gray-500 text-sm text-center mt-2 animate-pulse">
                    Thinking...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </main>

            {/* Sidebar (only shows if matches exist) */}
            <AnimatePresence>
              {matches.length > 0 && (
                <motion.div
                  initial={{ x: 200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 200, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sidebar matches={matches} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          // ─── About Page ───
          <motion.main
            key="about"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center text-gray-700"
          >
            <div className="max-w-2xl bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
              <h2 className="text-3xl font-bold text-blue-700 mb-4">
                About API Sense
              </h2>

              <p className="mb-4 leading-relaxed">
                <strong>API Sense</strong> helps developers find existing APIs
                using <em>semantic search</em> + <em>LLM reasoning</em>. It
                leverages vector similarity via <strong>FAISS</strong> and
                contextual understanding powered by{" "}
                <strong>Groq Llama-3.3-70B</strong>.
              </p>

              <p className="mb-4 leading-relaxed">
                The dataset consists of{" "}
                <strong>39 real Open Banking APIs</strong> scraped from{" "}
                <strong>NatWest’s “Bank of API website”</strong>, embedded with{" "}
                <code>all-MiniLM-L6-v2</code> to enable meaning-based matching —
                not just keyword search.
              </p>

              <p className="mb-4 leading-relaxed">
                Together, this stack enables true{" "}
                <strong>semantic API discovery</strong> — understanding what
                developers mean, not just what they type.
              </p>

              <p className="text-sm text-gray-500 mt-6">
                © {new Date().getFullYear()} API Sense · Built with 💙 by Team
                Spark
                <br />
                Powered by <strong>FastAPI · FAISS · Groq LLM</strong>
              </p>

              {/* 🔗 GitHub Link */}
              <div className="mt-6">
                <a
                  href="https://github.com/iamchetansharma8/api-discovery-rag"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-indigo-700 font-medium transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.41 7.85 10.94.57.1.78-.25.78-.55v-2.15c-3.19.69-3.87-1.54-3.87-1.54-.52-1.31-1.28-1.66-1.28-1.66-1.05-.71.08-.7.08-.7 1.17.08 1.78 1.21 1.78 1.21 1.03 1.77 2.71 1.26 3.38.96.1-.75.4-1.26.72-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.44.12-3 0 0 .97-.31 3.18 1.18a10.9 10.9 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.64 1.56.24 2.71.12 3 .75.81 1.2 1.84 1.2 3.1 0 4.41-2.69 5.39-5.25 5.67.41.36.77 1.07.77 2.16v3.21c0 .3.21.66.79.55A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* ─── Input (Home Only) ─── */}
      {activePage === "home" && (
        <footer className="p-4 bg-white/80 backdrop-blur-md border-t flex items-center gap-2 shadow-inner sticky bottom-0">
          <textarea
            className="flex-1 border border-gray-300 rounded-lg p-3 resize-none h-14 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            placeholder="Got a creative spark? Search your ideal API functionality to confirm if it exists”"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !e.shiftKey &&
              (e.preventDefault(), sendMessage())
            }
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </footer>
      )}

      {/* ─── Footer ─── */}
      <footer className="text-center text-gray-400 text-xs py-3 bg-gray-50 border-t">
        Built with 💙 using FastAPI · FAISS · Groq LLM
      </footer>
    </div>
  );
}