"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Mic, Brain, Circle, Settings } from "lucide-react";

export default function AIOperatingSystem() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-focus the input on load
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Scroll to bottom when conversation updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Fetch system status and proactive insights on load
  const { data: systemStatus } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const response = await fetch("/api/system/status");
      if (!response.ok) return null;
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // AI conversation mutation
  const conversationMutation = useMutation({
    mutationFn: async (userMessage) => {
      const response = await fetch("/api/ai/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: {
            conversation_history: conversation.slice(-10), // Last 10 messages
            system_status: systemStatus,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      if (!response.ok) throw new Error("AI conversation failed");
      return response.json();
    },
    onMutate: (userMessage) => {
      setIsThinking(true);
      setConversation((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
      setMessage("");
    },
    onSuccess: (aiResponse) => {
      setIsThinking(false);
      setConversation((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          content: aiResponse.response,
          actions: aiResponse.suggested_actions,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    onError: (error) => {
      setIsThinking(false);
      console.error("Conversation error:", error);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    conversationMutation.mutate(message);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Proactive AI greeting on first load
  useEffect(() => {
    if (systemStatus && conversation.length === 0) {
      const greeting = generateProactiveGreeting(systemStatus);
      if (greeting) {
        setConversation([
          {
            id: Date.now(),
            type: "ai",
            content: greeting,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
  }, [systemStatus]);

  const generateProactiveGreeting = (status) => {
    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    let greeting = `Good ${timeOfDay}. `;

    // Add contextual information based on system status
    if (status?.pending_items > 0) {
      greeting += `I have ${status.pending_items} items that need your attention. `;
    }

    if (status?.overnight_activity) {
      greeting += `Overnight: ${status.overnight_activity}. `;
    }

    greeting += "What would you like to focus on?";

    return greeting;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Status indicator and Navigation */}
      <div className="fixed top-4 right-4 z-10">
        <div className="flex items-center gap-2">
          {/* Navigation to other pages */}
          <div className="flex items-center gap-2">
            <a
              href="/eventureai"
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-150"
              title="EventureAI Integration"
            >
              <Brain size={16} />
              <span className="text-xs">EventureAI</span>
            </a>
            <a
              href="/memory"
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-all duration-150"
              title="Memory System"
            >
              <Settings size={16} />
              <span className="text-xs">Memory</span>
            </a>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-black/5 backdrop-blur-sm rounded-full">
            <Circle
              size={8}
              className={`${systemStatus?.health === "healthy" ? "text-green-500 fill-current" : "text-red-500 fill-current"}`}
            />
            <span className="text-xs text-gray-600">
              {systemStatus?.health === "healthy"
                ? "All systems operational"
                : "System issues detected"}
            </span>
          </div>
        </div>
      </div>

      {/* Conversation area */}
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        {conversation.length === 0 && !systemStatus ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Brain size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                Initializing your AI operating system...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-3xl ${msg.type === "user" ? "ml-12" : "mr-12"}`}
                >
                  {msg.type === "ai" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={16} className="text-gray-600" />
                      <span className="text-xs text-gray-500">
                        AI Operating System
                      </span>
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl ${
                      msg.type === "user"
                        ? "bg-black text-white ml-auto"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        <p className="text-sm font-medium text-gray-600 mb-3">
                          Suggested actions:
                        </p>
                        {msg.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() =>
                              conversationMutation.mutate(action.query)
                            }
                            className="block w-full text-left px-3 py-2 text-sm bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-150"
                          >
                            {action.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="max-w-3xl mr-12">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={16} className="text-gray-600" />
                    <span className="text-xs text-gray-500">
                      AI Operating System
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What would you like to work on today?"
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white/90 backdrop-blur-sm"
                rows={1}
                style={{
                  minHeight: "50px",
                  maxHeight: "200px",
                  height: `${Math.min(50 + (message.split("\n").length - 1) * 24, 200)}px`,
                }}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || conversationMutation.isPending}
              className="p-3 bg-black text-white rounded-2xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-150 flex-shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
