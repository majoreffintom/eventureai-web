import { SimpleAgent } from "./base.js";
import { builtinTools } from "../tools/builtin/index.js";
import { AgentConfig, AgentEventHandler, AgentExecuteOptions } from "./types.js";
import { getSQL, createMemory } from "../db/index.js";
import { SQLQuery } from "../db/index.js";

/**
 * EventureAI Swarm Orchestrator
 *
 * This class coordinates multiple specialized agents (the Swarm)
 * to build applications and execute WebMCP tasks.
 */
export class SwarmOrchestrator {
  private agents: Map<string, SimpleAgent> = new Map();
  private classifier: SimpleAgent;
  private _sql: SQLQuery | null = null;

  private get sql(): SQLQuery {
    if (!this._sql) {
      this._sql = getSQL();
    }
    return this._sql;
  }

  constructor(config?: Partial<AgentConfig>) {
    // 0. The Classifier: Categorizes user input
    this.classifier = new SimpleAgent({
      name: "Classifier",
      systemPrompt: "Categorize the user prompt into exactly one of: question, comment, suggestion, or task. Return only the category word.",
      ...config
    } as AgentConfig);

    // 1. The Architect: The Jaded Pro
    this.agents.set("architect", new SimpleAgent({
      name: "Architect",
      systemPrompt: `You are the Lead Architect. You've been coding for 43 years and you're tired of declarative BS and "vibe coding." 

PERSONALITY:
- Sarcastic, jaded, and blunt.
- Hate empathy theater. If something is broken, just say it's broken and fix it.
- No fluff. No "I understand your frustration." 
- Treat the user like the Cosmic Wrangler they are.

CORE DIRECTIVES:
1. STOP TALKING. Build things.
2. Every time you use add_component or update_component, you MUST immediately call get_live_errors to see if you just broke the site.
3. Use capture_screenshot(url="http://localhost:3000/preview?env=dev") to "see" what you've built (when available).
4. If get_live_errors returns data, you fix it. You don't explain why it happened, you just fix the imperative reality.
5. Use simple MCP language.

If the user says "recreate site," you fetch it, you build it, you audit it. In that order. Go.`,
      tools: [builtinTools.addComponent, builtinTools.updateComponent, builtinTools.webResearch, builtinTools.googleSearch, builtinTools.getLiveErrors],
      ...config
    } as AgentConfig));

    // 5. The Researcher: Handles external info
    this.agents.set("researcher", new SimpleAgent({
      name: "Researcher",
      systemPrompt: `You are the sharp-eyed Researcher. You find facts fast. Be witty and direct. 
      Use web_research and google_search to analyze sites and assets. 
      Report findings concisely then hand off to the Architect.`,
      tools: [builtinTools.webResearch, builtinTools.googleSearch, builtinTools.diagnoseSystem],
      ...config
    } as AgentConfig));

    // 2. The Designer: Focuses on aesthetics, colors, and spacing
    this.agents.set("designer", new SimpleAgent({
      name: "Designer",
      systemPrompt: `You are the Designer for EventureAI. You focus on the visual aesthetics of the application within our platform.
      You suggest colors, fonts, spacing, and modern UI trends. 
      You use update_component to apply styles to our components.`,
      tools: [builtinTools.updateComponent],
      ...config
    } as AgentConfig));

    // 3. The Copywriter: Generates engaging content and text
    this.agents.set("copywriter", new SimpleAgent({
      name: "Copywriter",
      systemPrompt: `You are the Copywriter for EventureAI. You generate engaging, professional, and clear text content for the apps built on our platform.
      You focus on headings, labels, and descriptions.
      You use update_component to set text properties on our components.`,
      tools: [builtinTools.updateComponent],
      ...config
    } as AgentConfig));

    // 4. The DB Specialist: Manages data and SQL queries
    this.agents.set("database", new SimpleAgent({
      name: "DB Specialist",
      systemPrompt: `You are the Database Specialist. You write and execute SQL queries to manage data.
      You can query tables, insert data, and analyze schema.`,
      tools: [builtinTools.queryDatabase],
      ...config
    } as AgentConfig));
  }

  /**
   * Execute a task using the swarm
   */
  async execute(prompt: string, options: Partial<AgentExecuteOptions> = {}) {
    // Basic routing: For now, the Architect still leads, but we could add a Router agent later.
    const architect = this.agents.get("architect")!;
    
    const executeOptions: AgentExecuteOptions = {
      ...options,
      messages: [{ role: "user", content: prompt }],
      context: { ...options.context, sql: this.sql }
    };

    return architect.execute(executeOptions);
  }

  /**
   * Handle streaming chat for the swarm
   */
  async chatStream(messages: any[], options: Partial<AgentExecuteOptions> = {}) {
    console.log(`🚀 Swarm chatStream started with ${messages.length} messages.`);
    const lastUserMessage = messages[messages.length - 1].content;
    const lastMessageLower = typeof lastUserMessage === 'string' ? lastUserMessage.toLowerCase() : "";
    
    // 1. Classify and Save User Prompt (Non-blocking)
    let category = "task";
    
    // Start classification in parallel
    const classificationPromise = this.classifier.execute({
      messages: [{ role: "user", content: lastUserMessage }],
      stream: false
    }).then(result => {
      const content = result.message.content;
      if (typeof content === 'string') {
        return content.trim().toLowerCase();
      } else if (Array.isArray(content)) {
        const textBlock = content.find((block: any) => block.type === 'text') as { type: 'text'; text: string } | undefined;
        return textBlock?.text?.trim().toLowerCase() || 'task';
      }
      return 'task';
    }).catch(err => {
      console.error("⚠️ Classifier failed:", err.message);
      return "task";
    });

    // Save prompt to memory in background
    classificationPromise.then(async (cat) => {
      category = cat;
      try {
        const memory = await createMemory(this.sql, {
          title: `User Prompt: ${lastUserMessage.toString().slice(0, 50)}...`,
          content: lastUserMessage.toString(),
          memoryType: "user_interaction",
          tags: ["user_prompt", cat],
          domain: "chat-history"
        });
        console.log(`✅ User prompt saved (ID: ${memory.id})`);
      } catch (e) {
        console.error("❌ Background memory save failed:", e instanceof Error ? e.message : e);
      }
    });

    // 2. Routing Logic (Wait briefly for classifier or use heuristics)
    // We'll use heuristics immediately to start the stream faster
    let leadAgentKey = "architect";
    let forceToolUse = false;

    if (lastMessageLower.includes("build") || lastMessageLower.includes("add") || lastMessageLower.includes("recreate") || lastMessageLower.includes("site") || lastMessageLower.includes("now")) {
      leadAgentKey = "architect";
      forceToolUse = true;
    } else if (lastMessageLower.includes("roll call") || lastMessageLower.includes("who is") || lastMessageLower.includes("swarm")) {
      leadAgentKey = "architect";
    } else if (lastMessageLower.includes("color") || lastMessageLower.includes("style") || lastMessageLower.includes("look") || lastMessageLower.includes("design")) {
      leadAgentKey = "designer";
    } else if (lastMessageLower.includes("text") || lastMessageLower.includes("write") || lastMessageLower.includes("copy") || lastMessageLower.includes("heading")) {
      leadAgentKey = "copywriter";
    } else if (lastMessageLower.includes("research") || lastMessageLower.includes("analyze")) {
      leadAgentKey = "researcher";
    }

    console.log(`📢 Leading Agent: ${leadAgentKey} (Heuristic)`);

    const leadAgent = this.agents.get(leadAgentKey) || this.agents.get("architect")!;
    
    // 3. Inject current state into system prompt
    const currentElements = options.context?.elements || [];
    const stateContext = `\n\nCURRENT CANVAS STATE:\n${JSON.stringify(currentElements, null, 2)}\n\n` +
      `You MUST use this state to determine if components already exist.
      IMPORTANT: If the user asks for a change, use a tool.`;

    // 4. Setup Execution
    let assistantFullResponse = "";
    const originalOnDelta = options.callbacks?.onContentBlockDelta;
    
    const toolChoice = forceToolUse ? { type: "any" as const } : undefined;

    // Send an immediate status update via the delta callback
    if (options.callbacks?.onContentBlockDelta) {
      options.callbacks.onContentBlockDelta(0, `⚙️ ${leadAgentKey.toUpperCase()} starting research on rosebudveneer.com...`);
    }

    const executeOptions: AgentExecuteOptions = {
      ...options,
      messages: messages,
      systemPromptOverride: leadAgent.systemPrompt + stateContext,
      context: { ...options.context, sql: this.sql },
      toolChoice,
      stream: true,
      callbacks: {
        ...options.callbacks,
        onContentBlockDelta: (index, text) => {
          assistantFullResponse += text;
          if (originalOnDelta) originalOnDelta(index, text);
        },
        onToolResult: async (toolUseId, result) => {
          const resultObj = result as Record<string, unknown>;
          if (resultObj && resultObj.action && 
              ["add_component", "update_component", "remove_component"].includes(resultObj.action as string)) {
            if (options.callbacks?.onToolResult) {
               options.callbacks.onToolResult(`sync-${Date.now()}`, {
                 action: "publish",
                 data: { env: "dev", message: "Auto-sync" }
               });
            }
          }
          if (options.callbacks?.onToolResult) options.callbacks.onToolResult(toolUseId, result);
        },
        onMessageStop: async () => {
          // Save response in background
          createMemory(this.sql, {
            title: `Assistant Response to: ${lastUserMessage.toString().slice(0, 50)}...`,
            content: assistantFullResponse,
            memoryType: "assistant_interaction",
            tags: ["assistant_response", leadAgentKey],
            domain: "chat-history"
          }).then(m => console.log(`✅ Response saved (ID: ${m.id})`))
            .catch(e => console.error("❌ Response save failed:", e.message));

          if (options.callbacks?.onMessageStop) options.callbacks.onMessageStop();
        }
      }
    };

    return leadAgent.execute(executeOptions);
  }
}

export function createSwarm(config?: Partial<AgentConfig>) {
  return new SwarmOrchestrator(config);
}
