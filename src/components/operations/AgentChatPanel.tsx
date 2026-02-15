import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Agent } from "@/hooks/useAgents";

export type ChatMsg = { role: "user" | "assistant"; content: string };

interface AgentChatPanelProps {
  projectId: string;
  phaseNumber: number;
  phaseName: string;
  agent: Agent | null;
  messages: ChatMsg[];
  onMessagesChange: (msgs: ChatMsg[]) => void;
  onCreateDocument: (content: string) => void;
}

export function AgentChatPanel({
  projectId,
  phaseNumber,
  phaseName,
  agent,
  messages,
  onMessagesChange,
  onCreateDocument,
}: AgentChatPanelProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    if (!agent) {
      toast({ title: "Selecione um agente primeiro", variant: "destructive" });
      return;
    }

    const newMessages: ChatMsg[] = [...messages, { role: "user", content: userMessage }];
    onMessagesChange(newMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: agent.persona || agent.instructions || "",
          model: (agent.model_config as any)?.model || "google/gemini-3-flash-preview",
          temperature: agent.temperature,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";
      let streamDone = false;

      // Add assistant placeholder
      const withAssistant: ChatMsg[] = [...newMessages, { role: "assistant", content: "" }];
      onMessagesChange(withAssistant);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              onMessagesChange([...newMessages, { role: "assistant", content: fullContent }]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      onMessagesChange([...newMessages, { role: "assistant", content: fullContent }]);
    } catch (err: any) {
      toast({ title: "Erro no chat", description: err.message, variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="text-sm font-semibold">Chat — {phaseName}</h3>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Envie uma mensagem ou execute o agente para iniciar.</p>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="shrink-0 rounded-full bg-primary/10 p-1.5 h-7 w-7 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === "assistant" && msg.content && !isStreaming && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] mt-1 -ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => onCreateDocument(msg.content)}
                  >
                    <FileDown className="h-3 w-3 mr-1" />
                    Criar Documento
                  </Button>
                )}
              </div>
              {msg.role === "user" && (
                <div className="shrink-0 rounded-full bg-secondary p-1.5 h-7 w-7 flex items-center justify-center">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Gerando resposta...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={agent ? "Digite sua mensagem..." : "Selecione um agente primeiro"}
            className="min-h-[40px] max-h-[120px] text-sm resize-none"
            disabled={!agent || isStreaming}
            rows={1}
          />
          <Button
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming || !agent}
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
