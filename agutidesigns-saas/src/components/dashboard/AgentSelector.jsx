import { useState } from 'react';
import { Smartphone, ChevronDown, Plus, Check, Bot, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAgents } from '../../hooks/useAgents';
import './AgentSelector.css';

export default function AgentSelector() {
  const { agents, activeAgent, switchAgent, createAgent, maxAgents } = useAgents();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [limitError, setLimitError] = useState(false);

  const atLimit = maxAgents !== Infinity && agents.length >= maxAgents;
  const canAddMore = maxAgents === Infinity || agents.length < maxAgents;

  // Hide if single agent AND plan only allows 1 (no point showing it)
  if (agents.length <= 1 && maxAgents === 1 && !creating) return null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const result = await createAgent(newName);
    if (result?.error === 'limit_reached') {
      setLimitError(true);
      setCreating(false);
      return;
    }
    setNewName('');
    setCreating(false);
    setLimitError(false);
  };

  const planLabel = maxAgents === 1 ? 'Starter' : maxAgents === 3 ? 'Pro' : 'Agency';

  return (
    <div className="agent-sel">
      <div className="agent-sel__current" onClick={() => setOpen(!open)}>
        <div className="agent-sel__icon"><Bot size={14} /></div>
        <div className="agent-sel__info">
          <span className="agent-sel__label">
            Agente activo
            {maxAgents !== Infinity && (
              <span className="agent-sel__count"> · {agents.length}/{maxAgents}</span>
            )}
          </span>
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

          {atLimit ? (
            <div className="agent-sel__limit">
              <Lock size={13} />
              <span>Límite de {maxAgents} agentes ({planLabel})</span>
              <Link to="/app/billing" className="agent-sel__upgrade" onClick={() => setOpen(false)}>
                Mejorar plan <ArrowRight size={12} />
              </Link>
            </div>
          ) : !creating ? (
            <button className="agent-sel__add" onClick={() => { setCreating(true); setLimitError(false); }}>
              <Plus size={14} /> Añadir nuevo agente
              {maxAgents !== Infinity && (
                <span className="agent-sel__add-slots"> ({maxAgents - agents.length} disponible{maxAgents - agents.length !== 1 ? 's' : ''})</span>
              )}
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

          {limitError && (
            <div className="agent-sel__limit-err">
              Has alcanzado el límite de tu plan.{' '}
              <Link to="/app/billing" onClick={() => setOpen(false)}>Mejora tu plan</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
