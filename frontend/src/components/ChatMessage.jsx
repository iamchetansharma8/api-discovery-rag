import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import "highlight.js/styles/github-dark.css";
import hljs from "highlight.js";

export default function ChatMessage({ sender, text }) {
  const isUser = sender === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] p-4 rounded-2xl shadow-lg text-left break-words transition-all duration-300 ${
          isUser
            ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white rounded-br-none"
            : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-indigo-600 mt-3 mb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-blue-700 mt-3 mb-1">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-gray-800 mt-2 mb-1">
                {children}
              </h3>
            ),

            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              if (!inline) {
                const codeHtml = hljs.highlightAuto(String(children)).value;
                return (
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-sm my-2">
                    <code
                      dangerouslySetInnerHTML={{ __html: codeHtml }}
                      {...props}
                    />
                  </pre>
                );
              }
              return (
                <code className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm">
                  {children}
                </code>
              );
            },

            // ✅ Stylish, modern tables
            table({ children }) {
              return (
                <div className="overflow-x-auto my-3 rounded-md border border-gray-300">
                  <table className="min-w-full text-sm border-collapse">
                    {children}
                  </table>
                </div>
              );
            },
            thead({ children }) {
              return (
                <thead className="bg-gradient-to-r from-indigo-100 to-blue-200 text-indigo-900 font-semibold border-b border-blue-300 shadow-sm">
                  {children}
                </thead>
              );
            },
            th({ children }) {
              return (
                <th className="px-4 py-2 text-left font-semibold border border-gray-300">
                  {children}
                </th>
              );
            },
            tr({ children }) {
              return (
                <tr className="odd:bg-white even:bg-gray-100 hover:bg-blue-50 transition-colors duration-150">
                  {children}
                </tr>
              );
            },
            td({ children }) {
              return (
                <td className="px-4 py-2 border border-gray-300 text-gray-800">
                  {children}
                </td>
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}