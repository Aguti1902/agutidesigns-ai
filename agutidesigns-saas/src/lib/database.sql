-- =============================================
-- AGUTIDESIGNS SaaS - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 days'),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phone numbers used for trials (prevents reuse)
CREATE TABLE public.used_trial_phones (
  phone TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.used_trial_phones ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a phone is used (needed for signup validation)
CREATE POLICY "Anyone can check phone" ON public.used_trial_phones FOR SELECT USING (true);
-- Only the system inserts (via function)
CREATE POLICY "Service role inserts" ON public.used_trial_phones FOR INSERT WITH CHECK (true);

-- Function to check and register trial phone
CREATE OR REPLACE FUNCTION public.register_trial_phone(p_phone TEXT, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  phone_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.used_trial_phones WHERE phone = p_phone) INTO phone_exists;
  IF phone_exists THEN
    RETURN FALSE;
  END IF;
  INSERT INTO public.used_trial_phones (phone, user_id) VALUES (p_phone, p_user_id);
  UPDATE public.profiles SET phone = p_phone WHERE id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Businesses (the user's business info for AI context)
CREATE TABLE public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sector TEXT,
  description TEXT,
  services TEXT,
  prices TEXT,
  schedule TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  faq TEXT,
  extra_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (WhatsApp AI agent configuration)
CREATE TABLE public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Mi Agente IA',
  whatsapp_number TEXT,
  whatsapp_instance TEXT,
  whatsapp_connected BOOLEAN DEFAULT FALSE,
  system_prompt TEXT,
  personality TEXT DEFAULT 'profesional y cercano',
  language TEXT DEFAULT 'es',
  is_active BOOLEAN DEFAULT FALSE,
  total_messages INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (tracked chats)
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  is_lead BOOLEAN DEFAULT FALSE,
  lead_score INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'bug', 'billing', 'whatsapp', 'agent', 'feature')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Messages (thread)
CREATE TABLE public.ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('user', 'admin')) NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own businesses" ON public.businesses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own agents" ON public.agents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own conversations" ON public.conversations FOR ALL USING (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view own messages" ON public.messages FOR ALL USING (
  conversation_id IN (
    SELECT c.id FROM public.conversations c
    JOIN public.agents a ON c.agent_id = a.id
    WHERE a.user_id = auth.uid()
  )
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tickets" ON public.tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own ticket messages" ON public.ticket_messages FOR ALL USING (
  ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
