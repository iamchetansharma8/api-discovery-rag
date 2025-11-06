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
                The dataset includes <strong>real Open Banking APIs</strong>{" "}
                from NatWest’s “Bank of APIs” and other enterprise systems,
                embedded with <code>all-MiniLM-L6-v2</code> to enable
                meaning-based matching — not just keyword search.
              </p>
              <p className="mb-4 leading-relaxed">
                Together, this stack enables true{" "}
                <strong>semantic API discovery</strong> — understanding what
                developers mean, not just what they type.
              </p>
              <p className="text-sm text-gray-500 mt-6">
                © {new Date().getFullYear()} API Sense · Built with 💙 by Team
                Spark <br /> Powered by{" "}
                <strong>FastAPI · FAISS · Groq LLM</strong>
              </p>
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

// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import ChatMessage from "./components/ChatMessage";
// import Sidebar from "./components/Sidebar";
// import { queryBackend } from "./api";

// export default function App() {
//   const [activePage, setActivePage] = useState("home");
//   const [messages, setMessages] = useState([]);
//   const [matches, setMatches] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const messagesEndRef = useRef(null);

//   const sendMessage = async () => {
//     if (!input.trim()) return;
//     const userMessage = { sender: "user", text: input };
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");
//     setLoading(true);

//     try {
//       const response = await queryBackend(input);

//       const matchRegex = /\|\s*\d+\s*\|\s*\*\*(.*?)\*\*\s*\|\s*([\d.]+)%/g;
//       const found = [];
//       let m;
//       while ((m = matchRegex.exec(response))) {
//         found.push({ title: m[1], score: parseFloat(m[2]) });
//       }
//       setMatches(found.slice(0, 3));

//       const botMessage = { sender: "bot", text: response };
//       setMessages((prev) => [...prev, botMessage]);
//     } catch {
//       setMessages((prev) => [
//         ...prev,
//         {
//           sender: "bot",
//           text: "⚠️ Error fetching response. Please try again.",
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const slideVariants = {
//     initial: { x: 50, opacity: 0 },
//     animate: { x: 0, opacity: 1, transition: { duration: 0.4 } },
//     exit: { x: -50, opacity: 0, transition: { duration: 0.3 } },
//   };

//   const samplePrompts = [
//     "Do we have an API to list bank branch and ATM locations?",
//     "Is there an API for customer to give consent to view his account data?",
//     "Is there an API for refund processing?",
//     "Show me APIs related to open banking.",
//   ];

//   return (
//     <div className="flex flex-col h-screen bg-gray-50 bg-[radial-gradient(circle_at_top_left,_#eef2ff_0%,_#f9fafb_100%)]">
//       {/* ─── Header ─── */}
//       <header className="bg-white border-b shadow-sm sticky top-0 z-10">
//         <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
//         <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
//           <h1
//             className="text-xl font-bold text-gray-800 cursor-pointer"
//             onClick={() => setActivePage("home")}
//           >
//             <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//               API Sense
//             </span>
//           </h1>

//           <nav className="space-x-6 text-sm font-medium">
//             <button
//               onClick={() => setActivePage("home")}
//               className={`transition ${
//                 activePage === "home"
//                   ? "text-blue-600 border-b-2 border-blue-600 pb-1"
//                   : "text-gray-600 hover:text-blue-600"
//               }`}
//             >
//               Home
//             </button>
//             <button
//               onClick={() => setActivePage("about")}
//               className={`transition ${
//                 activePage === "about"
//                   ? "text-blue-600 border-b-2 border-blue-600 pb-1"
//                   : "text-gray-600 hover:text-blue-600"
//               }`}
//             >
//               About
//             </button>
//           </nav>
//         </div>
//       </header>

//       {/* ─── Page Switch ─── */}
//       <AnimatePresence mode="wait">
//         {activePage === "home" ? (
//           <motion.div
//             key="home"
//             variants={slideVariants}
//             initial="initial"
//             animate="animate"
//             exit="exit"
//             className="flex flex-1 overflow-hidden relative"
//           >
//             <main className="flex-1 overflow-y-auto px-6 py-6 relative">
//               {/* 🧭 Welcome screen */}
//               {messages.length === 0 && !loading && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.5 }}
//                   className="flex flex-col items-center justify-center text-center mt-32"
//                 >
//                   <div className="max-w-2xl bg-white/70 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl p-10">
//                     <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
//                       Welcome to API Sense 🚀
//                     </h2>
//                     <p className="text-gray-700 mb-6">
//                       Discover existing APIs intelligently using{" "}
//                       <strong>semantic search</strong> and{" "}
//                       <strong>LLM reasoning</strong>.
//                     </p>
//                     <p className="text-sm text-gray-500 mb-4">
//                       Try one of these examples:
//                     </p>

//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                       {samplePrompts.map((prompt, i) => (
//                         <button
//                           key={i}
//                           onClick={() => setInput(prompt)}
//                           className="text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-700 shadow-sm transition"
//                         >
//                           💡 {prompt}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </motion.div>
//               )}

//               {/* Chat Messages */}
//               <div className="w-full max-w-5xl mx-auto space-y-4">
//                 {messages.map((msg, i) => (
//                   <ChatMessage key={i} sender={msg.sender} text={msg.text} />
//                 ))}

//                 {loading && (
//                   <div className="text-gray-500 text-sm text-center mt-2 animate-pulse">
//                     Thinking...
//                   </div>
//                 )}

//                 <div ref={messagesEndRef} />
//               </div>
//             </main>

//             {/* Sidebar (hidden initially, slides in when matches exist) */}
//             <AnimatePresence>
//               {matches.length > 0 && (
//                 <motion.div
//                   initial={{ x: 200, opacity: 0 }}
//                   animate={{ x: 0, opacity: 1 }}
//                   exit={{ x: 200, opacity: 0 }}
//                   transition={{ duration: 0.3 }}
//                 >
//                   <Sidebar matches={matches} />
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </motion.div>
//         ) : (
//           // ─── About Page ───
//           <motion.main
//             key="about"
//             variants={slideVariants}
//             initial="initial"
//             animate="animate"
//             exit="exit"
//             className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center text-gray-700"
//           >
//             <div className="max-w-2xl bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
//               <h2 className="text-3xl font-bold text-blue-700 mb-4">
//                 About API Sense
//               </h2>
//               <p className="mb-4 leading-relaxed">
//                 <strong>API Sense</strong> helps developers find existing APIs
//                 using <em>semantic search</em> + <em>LLM reasoning</em>. It
//                 leverages vector similarity via <strong>FAISS</strong> and
//                 contextual understanding powered by{" "}
//                 <strong>Groq Llama-3.3-70B</strong>.
//               </p>
//               <p className="mb-4 leading-relaxed">
//                 The dataset includes <strong>real Open Banking APIs</strong>{" "}
//                 from NatWest’s “Bank of APIs” and other enterprise systems,
//                 embedded with <code>all-MiniLM-L6-v2</code> to enable
//                 meaning-based matching — not just keyword search.
//               </p>
//               <p className="mb-4 leading-relaxed">
//                 Together, this stack enables true{" "}
//                 <strong>semantic API discovery</strong> — understanding what
//                 developers mean, not just what they type.
//               </p>
//               <p className="text-sm text-gray-500 mt-6">
//                 © {new Date().getFullYear()} API Sense · Built with 💙 by Team
//                 Spark <br /> Powered by{" "}
//                 <strong>FastAPI · FAISS · Groq LLM</strong>
//               </p>
//             </div>
//           </motion.main>
//         )}
//       </AnimatePresence>

//       {/* ─── Input (Home Only) ─── */}
//       {activePage === "home" && (
//         <footer className="p-4 bg-white/80 backdrop-blur-md border-t flex items-center gap-2 shadow-inner sticky bottom-0">
//           <textarea
//             className="flex-1 border border-gray-300 rounded-lg p-3 resize-none h-14 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
//             placeholder="Ask something like “Do we have an API to check account balance?”"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) =>
//               e.key === "Enter" &&
//               !e.shiftKey &&
//               (e.preventDefault(), sendMessage())
//             }
//           />
//           <button
//             onClick={sendMessage}
//             disabled={loading}
//             className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
//           >
//             {loading ? "..." : "Send"}
//           </button>
//         </footer>
//       )}

//       {/* ─── Footer ─── */}
//       <footer className="text-center text-gray-400 text-xs py-3 bg-gray-50 border-t">
//         Built with 💙 using FastAPI · FAISS · Groq LLM
//       </footer>
//     </div>
//   );
// }

// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import ChatMessage from "./components/ChatMessage";
// import Sidebar from "./components/Sidebar";
// import { queryBackend } from "./api";

// export default function App() {
//   const [activePage, setActivePage] = useState("home"); // track tab
//   const [messages, setMessages] = useState([]);
//   const [matches, setMatches] = useState([]); // Top APIs
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const messagesEndRef = useRef(null);

//   const sendMessage = async () => {
//     if (!input.trim()) return;
//     const userMessage = { sender: "user", text: input };
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");
//     setLoading(true);

//     try {
//       const response = await queryBackend(input);

//       // Extract Top 3 APIs table if present
//       const matchRegex = /\|\s*\d+\s*\|\s*\*\*(.*?)\*\*\s*\|\s*([\d.]+)%/g;
//       const found = [];
//       let m;
//       while ((m = matchRegex.exec(response))) {
//         found.push({ title: m[1], score: parseFloat(m[2]) });
//       }
//       setMatches(found.slice(0, 3));

//       const botMessage = { sender: "bot", text: response };
//       setMessages((prev) => [...prev, botMessage]);
//     } catch {
//       setMessages((prev) => [
//         ...prev,
//         {
//           sender: "bot",
//           text: "⚠️ Error fetching response. Please try again.",
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Slide animation variants
//   const slideVariants = {
//     initial: { x: 50, opacity: 0 },
//     animate: {
//       x: 0,
//       opacity: 1,
//       transition: { duration: 0.4, ease: "easeOut" },
//     },
//     exit: { x: -50, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
//   };

//   return (
//     // 🌤 Soft radial background
//     <div className="flex flex-col h-screen bg-gray-50 bg-[radial-gradient(circle_at_top_left,_#eef2ff_0%,_#f9fafb_100%)]">
//       {/* ───── HEADER ───── */}
//       <header className="bg-white border-b shadow-sm sticky top-0 z-10">
//         <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
//         <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
//           <h1
//             className="text-xl font-bold text-gray-800 cursor-pointer"
//             onClick={() => setActivePage("home")}
//           >
//             <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//               API Sense
//             </span>
//           </h1>

//           {/* Navigation Menu */}
//           <nav className="space-x-6 text-sm font-medium">
//             <button
//               onClick={() => setActivePage("home")}
//               className={`transition ${
//                 activePage === "home"
//                   ? "text-blue-600 border-b-2 border-blue-600 pb-1"
//                   : "text-gray-600 hover:text-blue-600"
//               }`}
//             >
//               Home
//             </button>
//             <button
//               onClick={() => setActivePage("about")}
//               className={`transition ${
//                 activePage === "about"
//                   ? "text-blue-600 border-b-2 border-blue-600 pb-1"
//                   : "text-gray-600 hover:text-blue-600"
//               }`}
//             >
//               About
//             </button>
//           </nav>
//         </div>
//       </header>

//       {/* ───── PAGE CONTENT WITH SLIDE ───── */}
//       <AnimatePresence mode="wait">
//         {activePage === "home" ? (
//           <motion.div
//             key="home"
//             variants={slideVariants}
//             initial="initial"
//             animate="animate"
//             exit="exit"
//             className="flex flex-1 overflow-hidden"
//           >
//             {/* Chat Window */}
//             <main className="flex-1 overflow-y-auto px-6 py-6">
//               <div className="w-full max-w-5xl mx-auto space-y-4">
//                 {messages.map((msg, i) => (
//                   <ChatMessage key={i} sender={msg.sender} text={msg.text} />
//                 ))}
//                 {loading && (
//                   <div className="text-gray-500 text-sm text-center mt-2 animate-pulse">
//                     Thinking...
//                   </div>
//                 )}
//                 <div ref={messagesEndRef} />
//               </div>
//             </main>

//             {/* Sidebar */}
//             <Sidebar matches={matches} />
//           </motion.div>
//         ) : (
//           <motion.main
//             key="about"
//             variants={slideVariants}
//             initial="initial"
//             animate="animate"
//             exit="exit"
//             className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center text-gray-700"
//           >
//             <div className="max-w-2xl bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
//               <h2 className="text-3xl font-bold text-blue-700 mb-4">
//                 About API Sense
//               </h2>

//               <p className="mb-4 leading-relaxed">
//                 <strong>API Sense</strong> is an AI-powered assistant that helps
//                 developers instantly discover whether an API already exists for
//                 their use case. It combines <em>semantic vector search</em> with{" "}
//                 <em>LLM reasoning</em> to analyze API documentation in a way
//                 that goes far beyond simple keyword matching.
//               </p>

//               <p className="mb-4 leading-relaxed">
//                 The system is built using <strong>FastAPI</strong>,{" "}
//                 <strong>FAISS</strong> for vector similarity search, and{" "}
//                 <strong>Groq LLM (Llama-3.3-70B)</strong> for deep contextual
//                 reasoning. The demo uses a curated dataset of
//                 <strong>
//                   {" "}
//                   real-world Open Banking and enterprise API specifications taken from NatWest Bank Of API website
//                 </strong>
//                 , processed into embeddings using <code>all-MiniLM-L6-v2</code>.
//               </p>

//               <p className="mb-4 leading-relaxed">
//                 Together, these components enable{" "}
//                 <strong>semantic API discovery</strong> — understanding what a
//                 developer wants, not just what they type.
//               </p>

//               <p className="text-sm text-gray-500 mt-6">
//                 © {new Date().getFullYear()} API Sense · Built with 💙 by Team Spark
//                 <br />
//                 Powered by <strong>FastAPI · FAISS · Groq LLM</strong>
//               </p>
//             </div>
//           </motion.main>
//         )}
//       </AnimatePresence>

//       {/* ───── INPUT (visible only on home) ───── */}
//       {activePage === "home" && (
//         <footer className="p-4 bg-white/80 backdrop-blur-md border-t flex items-center gap-2 shadow-inner sticky bottom-0">
//           <textarea
//             className="flex-1 border border-gray-300 rounded-lg p-3 resize-none h-14 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
//             placeholder="Ask something like “Do we have an API to check account balance?”"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) =>
//               e.key === "Enter" &&
//               !e.shiftKey &&
//               (e.preventDefault(), sendMessage())
//             }
//           />
//           <button
//             onClick={sendMessage}
//             disabled={loading}
//             className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
//           >
//             {loading ? "..." : "Send"}
//           </button>
//         </footer>
//       )}

//       {/* ───── FOOTER ───── */}
//       <footer className="text-center text-gray-400 text-xs py-3 bg-gray-50 border-t">
//         Built with 💙 using FastAPI · FAISS · Groq LLM
//       </footer>
//     </div>
//   );
// }
