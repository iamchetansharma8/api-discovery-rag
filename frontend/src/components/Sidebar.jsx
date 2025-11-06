// src/components/Sidebar.jsx
import { motion } from "framer-motion";

export default function Sidebar({ matches }) {
  if (!matches?.length) return null;

  return (
    <motion.aside
      initial={{ x: 200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:block w-72 bg-white/90 backdrop-blur-md border-l border-gray-200 shadow-lg p-5 overflow-y-auto"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        🔍 Top Matches
      </h2>

      {matches.map((api, i) => (
        <div key={i} className="mb-4">
          <p className="font-medium text-gray-700">
            {i + 1}️⃣ {api.title}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{api.score}%</span>
          </div>

          {/* progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className={`h-2 rounded-full ${
                i === 0
                  ? "bg-blue-600"
                  : i === 1
                  ? "bg-indigo-500"
                  : "bg-purple-400"
              }`}
              style={{ width: `${api.score}%` }}
            ></div>
          </div>
        </div>
      ))}
    </motion.aside>
  );
}
