"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
type Message = {
  sender: "user" | "ai"; // restrict sender
  text: string;
};

export default function AIPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;
   const newMessage: Message = { sender: "user", text: input }; // ✅ typed properly
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    const res = await fetch("https://synthora-backend.onrender.com/api/askai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newMessage.text }),
    });

    const data = await res.json();
    console.log(data)
    setMessages((prev) => [...prev, { sender: "ai", text: data.answer }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <header className="p-4 text-center font-extrabold text-2xl text-orange-700 shadow-sm">
        🧠 Synthora AI Assistant
      </header>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`max-w-xl p-4 rounded-2xl  shadow-md ${
              msg.sender === "user"
                ? "ml-auto bg-orange-600 text-white rounded-br-none"
                : "mr-auto bg-white border border-orange-200 text-gray-800 rounded-bl-none"
            }`}
          >
            {msg.text}
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mr-auto bg-white border border-orange-200 p-4 rounded-2xl shadow-sm flex gap-2"
          >
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-150"></span>
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-300"></span>
          </motion.div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-orange-200 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="💬 Ask me anything about hiring, resumes, or HR..."
          className="flex-1 p-3 rounded-xl border-2 border-orange-300 focus:ring-2 focus:ring-orange-500 outline-none"
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-xl shadow-md transition-all disabled:bg-orange-300"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
