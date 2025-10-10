import type { ConfirmationPort } from "./confirmation";

interface AgentPort {
  answerInstruction(
    instruction: string,
    options?: {
      confirmationPort?: ConfirmationPort;
      sourceId?: string;
    }
  ): Promise<{ answer: string }>;
}

type AgentChatParams = {
  messages: AgentMsg[];
  tools?: Tool[];
};

type AgentMsg =
  | { role: "system" | "user" | "assistant"; content: string }
  // Ollama accepts a 'tool' role to return tool outputs
  | { role: "tool"; content: string; name: string };

type ChatResp = {
  message: {
    role: "assistant";
    content: string;
    tool_calls?: ToolCall[];
  };
  done: boolean;
};

type ToolCall = {
  function: { name: string; arguments?: Record<string, unknown> };
};

type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
};

export type { AgentPort, AgentChatParams, AgentMsg, ChatResp, ToolCall, Tool };
