import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Msg = { role: "user" | "assistant"; content: string };

interface ConversationState {
  conversationId: string | null;
  messages: Msg[];
  isLoadingHistory: boolean;
}

export function useConversation(agentId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<ConversationState>({
    conversationId: null,
    messages: [],
    isLoadingHistory: true,
  });

  // Load or create conversation for this user+agent
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const init = async () => {
      setState((s) => ({ ...s, isLoadingHistory: true }));

      // Find existing conversation
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("agent_id", agentId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (conv) {
        // Load messages
        const { data: msgs } = await supabase
          .from("messages")
          .select("role, content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });

        if (cancelled) return;
        setState({
          conversationId: conv.id,
          messages: (msgs || []) as Msg[],
          isLoadingHistory: false,
        });
      } else {
        setState({ conversationId: null, messages: [], isLoadingHistory: false });
      }
    };

    init();
    return () => { cancelled = true; };
  }, [agentId, user]);

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (state.conversationId) return state.conversationId;
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, agent_id: agentId })
      .select("id")
      .single();

    if (error) throw error;
    setState((s) => ({ ...s, conversationId: data.id }));
    return data.id;
  }, [state.conversationId, user, agentId]);

  const addMessage = useCallback(async (msg: Msg) => {
    const convId = await ensureConversation();
    await supabase.from("messages").insert({
      conversation_id: convId,
      role: msg.role,
      content: msg.content,
    });
    // Update conversation timestamp
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
  }, [ensureConversation]);

  const setMessages = useCallback((updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
    setState((s) => ({
      ...s,
      messages: typeof updater === "function" ? updater(s.messages) : updater,
    }));
  }, []);

  const resetConversation = useCallback(async () => {
    if (state.conversationId) {
      // Delete conversation (cascades to messages)
      await supabase.from("conversations").delete().eq("id", state.conversationId);
    }
    setState({ conversationId: null, messages: [], isLoadingHistory: false });
  }, [state.conversationId]);

  return {
    messages: state.messages,
    setMessages,
    addMessage,
    resetConversation,
    isLoadingHistory: state.isLoadingHistory,
    conversationId: state.conversationId,
  };
}
