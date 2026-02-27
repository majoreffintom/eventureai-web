"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Bot,
  User,
  Brain,
  Zap,
  ArrowRight,
  Loader,
  MessageSquare,
} from "lucide-react";
import saveToMemoria from "@/utils/saveToMemoria";

export default function AIConversationPage() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const messagesEndRef = useRef(null);
  const threadIdRef = useRef(
    `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const turnIndexRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // AI Conversation mutation
  const conversationMutation = useMutation({
    mutationFn: async (userMessage) => {
      const response = await fetch("/api/ai/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: {
            conversation_history: conversation.slice(-6), // Last 6 messages
            system_status: {
              health: "optimal",
              pending_items: 3,
              suggested_focus: "memory optimization",
            },
          },
        }),
      });

      if (!response.ok) throw new Error("AI conversation failed");
      return response.json();
    },
    onSuccess: async (aiResponse, userMessage) => {
      // Add user message
      setConversation((prev) => [
        ...prev,
        { role: "user", content: userMessage, timestamp: new Date() },
      ]);

      // Add AI response with all the rich data
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiResponse.response,
          timestamp: new Date(),
          suggested_actions: aiResponse.suggested_actions,
          system_operations: aiResponse.system_operations,
          memory_capture: aiResponse.memory_capture,
        },
      ]);

      // persist this turn to Memoria (best-effort)
      try {
        const turnIndex = turnIndexRef.current;
        turnIndexRef.current = turnIndex + 1;

        const synthesisParts = [];
        if (
          Array.isArray(aiResponse?.suggested_actions) &&
          aiResponse.suggested_actions.length > 0
        ) {
          synthesisParts.push(
            `Suggested actions: ${aiResponse.suggested_actions
              .map((a) => a.title)
              .slice(0, 5)
              .join(", ")}`,
          );
        }
        if (
          Array.isArray(aiResponse?.system_operations) &&
          aiResponse.system_operations.length > 0
        ) {
          synthesisParts.push(
            `System ops: ${aiResponse.system_operations
              .map((o) => o.operation)
              .slice(0, 5)
              .join(", ")}`,
          );
        }
        if (aiResponse?.memory_capture) {
          synthesisParts.push(
            `Memory capture: ${aiResponse.memory_capture.importance} / ${aiResponse.memory_capture.context_type}`,
          );
        }

        const assistantSynthesis = synthesisParts.join("\n");

        await saveToMemoria(threadIdRef.current, [], {
          title: "AI Conversation",
          index: "Cross_App_Conversations",
          turn: {
            turnIndex,
            externalTurnId: `eventureai:${threadIdRef.current}:${turnIndex}`,
            userText: userMessage,
            // we cannot store private chain-of-thought, but we can store a safe summary of the work done
            assistantThinkingSummary:
              "Generated a response using recent chat context and system status; produced suggested actions and recorded memory metadata.",
            assistantSynthesis: assistantSynthesis || null,
            codeSummary: null,
            assistantResponse: aiResponse.response,
            metadata: {
              app: "eventureai",
              has_suggested_actions: !!aiResponse?.suggested_actions?.length,
              has_system_operations: !!aiResponse?.system_operations?.length,
            },
          },
        });
      } catch (err) {
        console.error("Memoria capture failed:", err);
      }

      setMessage("");
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    conversationMutation.mutate(message);
  };

  const handleSuggestedAction = (action) => {
    conversationMutation.mutate(action.query);
  };

  const quickPrompts = [
    "What's happening in my business right now?",
    "Show me recent memory patterns",
    "Help me plan my next project",
    "What needs my attention today?",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <MessageSquare
                size={32}
                className="text-[#0F172A] dark:text-white"
              />
              <div>
                <h1 className="font-bold text-[28px] leading-[1.2] text-[#0F172A] dark:text-white font-inter">
                  AI Operating System
                </h1>
                <p className="text-[14px] text-[#667085] dark:text-[#A1A1AA] font-inter">
                  Bidirectional AI communication with memory-aware intelligence
                </p>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Memory System Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] h-[600px] flex flex-col">
          {/* Conversation Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
                <Bot
                  size={48}
                  className="text-[#667085] dark:text-[#A1A1AA] mx-auto mb-4"
                />
                <h3 className="font-inter font-medium text-lg text-[#0F172A] dark:text-white mb-2">
                  Start a conversation with your AI Operating System
                </h3>
                <p className="text-[#667085] dark:text-[#A1A1AA] mb-6 max-w-md mx-auto">
                  This AI remembers your business context, can execute system
                  operations, and learns from every interaction.
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(prompt)}
                      className="p-3 text-left text-sm bg-[#F8F9FA] dark:bg-[#333333] hover:bg-[#F2F4F7] dark:hover:bg-[#404040] border border-[#E4E7EC] dark:border-[#505050] rounded-lg transition-all duration-150"
                    >
                      <span className="text-[#0F172A] dark:text-white">
                        {prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] ${msg.role === "user" ? "order-first" : ""}`}
                    >
                      <div
                        className={`p-4 rounded-lg ${
                          msg.role === "user"
                            ? "bg-[#0F172A] dark:bg-[#3B4251] text-white ml-auto"
                            : "bg-[#F8F9FA] dark:bg-[#333333] text-[#0F172A] dark:text-white"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className="text-xs opacity-70 mt-2">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>

                      {/* AI Response Extras */}
                      {msg.role === "assistant" && (
                        <div className="mt-3 space-y-3">
                          {/* Suggested Actions */}
                          {msg.suggested_actions?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-[#667085] dark:text-[#A1A1AA] mb-2">
                                Suggested Actions:
                              </p>
                              <div className="space-y-2">
                                {msg.suggested_actions.map(
                                  (action, actionIndex) => (
                                    <button
                                      key={actionIndex}
                                      onClick={() =>
                                        handleSuggestedAction(action)
                                      }
                                      disabled={conversationMutation.isPending}
                                      className={`w-full flex items-center justify-between p-3 bg-white dark:bg-[#262626] border border-[#E4E7EC] dark:border-[#404040] rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#333333] transition-all duration-150 text-left ${
                                        action.priority === "high"
                                          ? "border-l-4 border-l-red-500"
                                          : action.priority === "medium"
                                            ? "border-l-4 border-l-blue-500"
                                            : "border-l-4 border-l-green-500"
                                      }`}
                                    >
                                      <div>
                                        <div className="text-sm font-medium text-[#0F172A] dark:text-white">
                                          {action.title}
                                        </div>
                                        <div className="text-xs text-[#667085] dark:text-[#A1A1AA]">
                                          {action.query.slice(0, 60)}...
                                        </div>
                                      </div>
                                      <ArrowRight
                                        size={16}
                                        className="text-[#667085] dark:text-[#A1A1AA]"
                                      />
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {/* System Operations */}
                          {msg.system_operations?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-[#667085] dark:text-[#A1A1AA] mb-2">
                                System Operations Executed:
                              </p>
                              <div className="space-y-1">
                                {msg.system_operations.map((op, opIndex) => (
                                  <div
                                    key={opIndex}
                                    className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400"
                                  >
                                    <Zap size={12} />
                                    <span>{op.operation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Memory Capture */}
                          {msg.memory_capture && (
                            <div>
                              <p className="text-xs font-medium text-[#667085] dark:text-[#A1A1AA] mb-2">
                                Memory Captured:
                              </p>
                              <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                                <Brain size={12} />
                                <span>
                                  {msg.memory_capture.importance} priority •{" "}
                                  {msg.memory_capture.context_type}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 bg-[#667085] dark:bg-[#505050] rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {conversationMutation.isPending && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Loader size={16} className="text-white animate-spin" />
                    </div>
                    <div className="p-4 bg-[#F8F9FA] dark:bg-[#333333] rounded-lg">
                      <p className="text-sm text-[#667085] dark:text-[#A1A1AA]">
                        AI is thinking and accessing memory...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#EAECF0] dark:border-[#404040] p-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about your business, systems, or data..."
                  className="w-full p-3 border border-[#E4E7EC] dark:border-[#404040] rounded-lg bg-white dark:bg-[#262626] text-[#0F172A] dark:text-white placeholder-[#667085] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0F172A] dark:focus:ring-[#4C9BFF] resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={conversationMutation.isPending || !message.trim()}
                className={`px-6 py-3 rounded-lg transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 text-sm font-semibold font-inter ${
                  message.trim() && !conversationMutation.isPending
                    ? "bg-[#0F172A] hover:bg-[#17233A] text-white"
                    : "bg-[#F2F4F7] dark:bg-[#333333] text-[#667085] dark:text-[#A1A1AA] cursor-not-allowed"
                }`}
              >
                {conversationMutation.isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
