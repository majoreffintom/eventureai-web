"use client";

import { Send, Bot, Sparkles, Terminal, Loader2, Code, Eye } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";

type Message = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  toolCalls?: any[];
};

export function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am the EventureAI Swarm Orchestrator (v2-autobuild). I have specialized agents ready to build rosebudveneer.com. How shall we begin?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<any[]>([]);
  
  // Zustand store state and actions
  const { elements, addElement, updateElement, removeElement } = useEditorStore();

  // Sync ref with state for use in callbacks
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToolResult = async (result: any) => {
    if (!result || typeof result !== 'object') return;

    const { action, data } = result;
    
    switch (action) {
      case "add_component":
        addElement({
          id: data.id,
          type: data.type,
          props: data.props || {},
          children: data.type === 'container' ? [] : undefined
        }, data.parentId);
        break;
      
      case "update_component":
        updateElement(data.id, { props: data.props });
        break;
      
      case "remove_component":
        removeElement(data.id);
        break;
      
      case "publish":
        fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ elements: elementsRef.current, env: data.env }),
        })
        .then(res => res.json())
        .then(res => console.log("Swarm published app:", res))
        .catch(err => console.error("Swarm publish failed:", err));
        break;

      case "capture_screenshot":
        if (data.screenshot) {
          console.log("📸 Vision Tool: Screenshot received.");
          const screenshotMsg: Message = {
            role: "user",
            content: "Visual Audit: Here is the current render. Reconcile this with the design requirements.",
            images: [data.screenshot]
          };
          setMessages(prev => [...prev, screenshotMsg]);
          // Use a small timeout to let state update before next submission
          setTimeout(() => {
            handleSubmit("", [...messages, screenshotMsg]);
          }, 500);
        }
        break;

      case "diagnose_report":
        console.log("🩺 System Health Report:", data);
        break;
    }
  };

  const handleSubmit = async (overrideInput?: string, overrideMessages?: Message[]) => {
    const textToSubmit = overrideInput !== undefined ? overrideInput : input;
    const currentMessages = overrideMessages || messages;
    
    if (!textToSubmit.trim() && !overrideMessages) return;
    if (isLoading && !overrideMessages) return;

    let newMessages = currentMessages;
    if (textToSubmit.trim()) {
      const userMessage = { role: "user" as const, content: textToSubmit.trim() };
      newMessages = [...currentMessages, userMessage];
    }
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          context: { elements: elementsRef.current }
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const event = JSON.parse(line.slice(6));
                
                if (event.type === "delta") {
                  assistantMessage += event.text;
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last.role === "assistant") {
                      return [...prev.slice(0, -1), { ...last, content: assistantMessage }];
                    }
                    return prev;
                  });
                } else if (event.type === "tool_result") {
                  handleToolResult(event.result);
                }
              } catch (e) {
                // Partial chunk
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Imperative Audit failed. Check logs." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoBuild = () => {
    const powerPrompt = "RECREATE SITE: rosebudveneer.com. Analyze, build, capture, and audit. Go.";
    handleSubmit(powerPrompt);
  };

  return (
    <div className="w-80 flex flex-col bg-zinc-900 border-l border-zinc-800 shrink-0 h-full">
      <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-indigo-400" />
          <span className="text-sm font-medium">Swarm Intelligence</span>
        </div>
        {isLoading && <Loader2 size={14} className="animate-spin text-zinc-500" />}
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === "assistant" ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"
            }`}>
              {msg.role === "assistant" ? <Sparkles size={16} /> : <Terminal size={16} />}
            </div>
            <div className={`rounded-lg p-3 text-sm flex-1 whitespace-pre-wrap overflow-hidden ${
              msg.role === "assistant" ? "bg-zinc-800/50 text-zinc-300" : "bg-indigo-500/10 text-zinc-200 border border-indigo-500/20"
            }`}>
              {msg.content}
              {msg.images && msg.images.map((img, idx) => (
                <div key={idx} className="mt-2 relative group">
                  <img src={img} alt="Render Audit" className="rounded-md border border-zinc-700 shadow-xl w-full h-auto grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                  <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 shrink-0 bg-zinc-900">
        <div className="relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Imperative command..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-100 placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all focus:border-indigo-500/50"
            rows={3}
          />
          <button 
            onClick={() => handleSubmit()}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 bottom-3 w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <Send size={14} className="ml-0.5" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button 
            onClick={handleAutoBuild}
            disabled={isLoading}
            className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400 flex items-center justify-center gap-1 transition-colors border border-transparent hover:border-zinc-700 font-medium"
          >
            <Bot size={12} />
            Auto-Build
          </button>
          <button 
            onClick={() => handleSubmit("Audit the current live preview.")}
            disabled={isLoading}
            className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-400 flex items-center justify-center gap-1 transition-colors border border-transparent hover:border-zinc-700"
          >
            <Eye size={12} />
            Visual Audit
          </button>
        </div>
      </div>
    </div>
  );
}
