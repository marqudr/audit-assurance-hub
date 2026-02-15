
-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can only access their own
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (user_id = auth.uid());

-- Messages: access only via own conversations
CREATE POLICY "Users can view messages of own conversations"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages to own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages of own conversations"
  ON public.messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_conversations_user_agent ON public.conversations(user_id, agent_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);

-- Trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
