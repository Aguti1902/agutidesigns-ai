import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const AgentsContext = createContext({});

export function AgentsProvider({ children }) {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load agents
  useEffect(() => {
    if (user) loadAgents();
    else { setAgents([]); setActiveAgent(null); setLoading(false); }
  }, [user]);

  async function loadAgents() {
    setLoading(true);
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const agentsList = data || [];
    setAgents(agentsList);

    // Set first agent as active if none selected
    if (agentsList.length > 0 && !activeAgent) {
      setActiveAgent(agentsList[0]);
    } else if (activeAgent) {
      // Refresh active agent data
      const updated = agentsList.find(a => a.id === activeAgent.id);
      if (updated) setActiveAgent(updated);
    }
    setLoading(false);
  }

  const switchAgent = useCallback((agentId) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) setActiveAgent(agent);
  }, [agents]);

  const createAgent = useCallback(async (name) => {
    if (!user) return null;
    const { data, error } = await supabase.from('agents').insert({
      user_id: user.id,
      name: name || `Agente ${agents.length + 1}`,
    }).select().single();

    if (error) { console.error(error); return null; }
    await loadAgents();
    setActiveAgent(data);
    return data;
  }, [user, agents]);

  const refreshAgents = useCallback(() => {
    if (user) loadAgents();
  }, [user]);

  return (
    <AgentsContext.Provider value={{
      agents, activeAgent, loading, switchAgent, createAgent, refreshAgents, setActiveAgent
    }}>
      {children}
    </AgentsContext.Provider>
  );
}

export const useAgents = () => useContext(AgentsContext);
