import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatMessage({ sender, text }) {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ node, ...props }) => (
              <h2 className="text-lg font-semibold mt-2" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc ml-5 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => <li {...props} />,
            strong: ({ node, ...props }) => (
              <strong className="font-semibold" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-2 leading-relaxed" {...props} />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
