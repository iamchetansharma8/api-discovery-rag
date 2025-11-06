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

// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import { motion } from "framer-motion";
// import "highlight.js/styles/github-dark.css";
// import hljs from "highlight.js";

// // Highlight code blocks in Markdown
// export default function ChatMessage({ sender, text }) {
//   const isUser = sender === "user";

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.2 }}
//       className={`flex ${isUser ? "justify-end" : "justify-start"}`}
//     >
//       <div
//         className={`max-w-[80%] p-3 rounded-2xl shadow-md text-left prose prose-sm break-words ${
//           isUser
//             ? "bg-blue-600 text-white rounded-br-none"
//             : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
//         }`}
//       >
//         <ReactMarkdown
//           remarkPlugins={[remarkGfm]}
//           components={{
//             code({ node, inline, className, children, ...props }) {
//               const match = /language-(\w+)/.exec(className || "");
//               return !inline ? (
//                 <pre className="rounded-md bg-gray-900 text-gray-100 p-3 overflow-x-auto text-sm">
//                   <code
//                     dangerouslySetInnerHTML={{
//                       __html: hljs.highlightAuto(String(children)).value,
//                     }}
//                   />
//                 </pre>
//               ) : (
//                 <code className="bg-gray-200 rounded px-1 py-0.5 text-sm">
//                   {children}
//                 </code>
//               );
//             },
//           }}
//         >
//           {text}
//         </ReactMarkdown>
//       </div>
//     </motion.div>
//   );
// }

// src/components/ChatMessage.jsx
// import React from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeHighlight from "rehype-highlight";
// import "highlight.js/styles/github-dark.css"; // You can change theme

// export default function ChatMessage({ sender, text }) {
//   const isUser = sender === "user";
//   return (
//     <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
//       <div
//         className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
//           isUser
//             ? "bg-blue-600 text-white rounded-br-none"
//             : "bg-gray-100 text-gray-800 rounded-bl-none"
//         }`}
//       >
//         <ReactMarkdown
//           remarkPlugins={[remarkGfm]}
//           rehypePlugins={[rehypeHighlight]}
//           components={{
//             code({ inline, className, children, ...props }) {
//               return inline ? (
//                 <code
//                   className="bg-gray-200 text-sm text-gray-900 px-1 py-0.5 rounded"
//                   {...props}
//                 >
//                   {children}
//                 </code>
//               ) : (
//                 <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-3 overflow-x-auto">
//                   <code {...props}>{children}</code>
//                 </pre>
//               );
//             },
//             table({ children }) {
//               return (
//                 <div className="overflow-x-auto my-3">
//                   <table className="table-auto w-full border border-gray-300 text-sm">
//                     {children}
//                   </table>
//                 </div>
//               );
//             },
//             th({ children }) {
//               return (
//                 <th className="border px-2 py-1 bg-gray-200 text-gray-700 font-semibold text-left">
//                   {children}
//                 </th>
//               );
//             },
//             td({ children }) {
//               return <td className="border px-2 py-1">{children}</td>;
//             },
//           }}
//         >
//           {text}
//         </ReactMarkdown>
//       </div>
//     </div>
//   );
// }

// import React from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// export default function ChatMessage({ sender, text }) {
//   const isUser = sender === "user";

//   return (
//     <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
//       <div
//         className={`max-w-[70%] rounded-2xl px-4 py-2 ${
//           isUser
//             ? "bg-blue-600 text-white rounded-br-none"
//             : "bg-gray-200 text-gray-800 rounded-bl-none"
//         }`}
//       >
//         <ReactMarkdown
//           remarkPlugins={[remarkGfm]}
//           components={{
//             h2: ({ node, ...props }) => (
//               <h2 className="text-lg font-semibold mt-2" {...props} />
//             ),
//             ul: ({ node, ...props }) => (
//               <ul className="list-disc ml-5 space-y-1" {...props} />
//             ),
//             li: ({ node, ...props }) => <li {...props} />,
//             strong: ({ node, ...props }) => (
//               <strong className="font-semibold" {...props} />
//             ),
//             p: ({ node, ...props }) => (
//               <p className="mb-2 leading-relaxed" {...props} />
//             ),
//           }}
//         >
//           {text}
//         </ReactMarkdown>
//       </div>
//     </div>
//   );
// }
