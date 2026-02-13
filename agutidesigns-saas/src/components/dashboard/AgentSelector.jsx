import { useState } from 'react';
import { Smartphone, ChevronDown, Plus, Check, Bot } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import './AgentSelector.css';

export default function AgentSelector() {
  const { agents, activeAgent, switchAgent, createAgent } = useAgents();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  if (agents.length <= 1 && !creating) return null; // Hide if only 1 agent

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createAgent(newName);
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="agent-sel">
      <div className="agent-sel__current" onClick={() => setOpen(!open)}>
        <div className="agent-sel__icon"><Bot size={14} /></div>
        <div className="agent-sel__info">
          <span className="agent-sel__label">Agente activo</span>
          <span className="agent-sel__name">{activeAgent?.name || 'Sin agente'}</span>
        </div>
        {activeAgent?.whatsapp_connected && (
          <span className="agent-sel__connected">
            <span className="agent-sel__dot" /> Conectado
          </span>
        )}
        <ChevronDown size={16} className={`agent-sel__chevron ${open ? 'agent-sel__chevron--open' : ''}`} />
      </div>

      {open && (
        <div className="agent-sel__dropdown">
          {agents.map(agent => (
            <button
              key={agent.id}
              className={`agent-sel__option ${activeAgent?.id === agent.id ? 'agent-sel__option--active' : ''}`}
              onClick={() => { switchAgent(agent.id); setOpen(false); }}
            >
              <Smartphone size={14} />
              <div className="agent-sel__option-info">
                <span className="agent-sel__option-name">{agent.name}</span>
                <span className="agent-sel__option-phone">
                  {agent.whatsapp_number || 'Sin número vinculado'}
                </span>
              </div>
              {activeAgent?.id === agent.id && <Check size={14} />}
            </button>
          ))}

          {!creating ? (
            <button className="agent-sel__add" onClick={() => setCreating(true)}>
              <Plus size={14} /> Añadir nuevo agente
            </button>
          ) : (
            <div className="agent-sel__create">
              <input
                type="text"
                placeholder="Nombre del agente"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <div className="agent-sel__create-actions">
                <button onClick={handleCreate} className="agent-sel__create-btn">Crear</button>
                <button onClick={() => setCreating(false)} className="agent-sel__create-cancel">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
