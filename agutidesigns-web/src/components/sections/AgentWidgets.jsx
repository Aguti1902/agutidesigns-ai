import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  MessageCircle, UserCheck, Calculator, CalendarCheck,
  Mail, HelpCircle, RefreshCw, Star, Plus, Check, Bot, Zap
} from 'lucide-react';
import { agents, getTotalAgentsPrice } from '../../data/agents';
import { fadeInUp, staggerContainer } from '../../hooks/useScrollAnimation';
import './AgentWidgets.css';

const iconMap = {
  MessageCircle: <MessageCircle size={18} />,
  UserCheck: <UserCheck size={18} />,
  Calculator: <Calculator size={18} />,
  CalendarCheck: <CalendarCheck size={18} />,
  Mail: <Mail size={18} />,
  HelpCircle: <HelpCircle size={18} />,
  RefreshCw: <RefreshCw size={18} />,
  Star: <Star size={18} />,
};

export default function AgentWidgets({ selectedAgents, onToggleAgent }) {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  const agentsCost = getTotalAgentsPrice(selectedAgents);
  const count = selectedAgents.length;

  return (
    <section id="agent-widgets" className="widgets section" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="widgets__header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge--primary">
            <Zap size={12} />
            Agentes IA — Upsell
          </span>
          <h2 className="widgets__title">
            Potencia tu web con
            <span className="text-primary"> agentes IA</span>
          </h2>
          <p className="widgets__subtitle">
            Añade los agentes que necesites a tu pack. Cada uno tiene un coste mensual extra
            y se integra directamente en tu web.
          </p>
        </motion.div>

        {/* Agent Toggle Grid */}
        <motion.div
          className="widgets__grid"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {agents.map((agent) => {
            const isSelected = selectedAgents.includes(agent.id);
            return (
              <motion.button
                key={agent.id}
                className={`widgets__card ${isSelected ? 'widgets__card--selected' : ''}`}
                variants={fadeInUp}
                onClick={() => onToggleAgent(agent.id)}
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="widgets__card-left">
                  <div className={`widgets__card-icon ${isSelected ? 'widgets__card-icon--active' : ''}`}>
                    {iconMap[agent.icon]}
                  </div>
                  <div className="widgets__card-info">
                    <span className="widgets__card-name">{agent.shortName}</span>
                    <span className="widgets__card-desc">{agent.description.slice(0, 60)}...</span>
                  </div>
                </div>
                <div className="widgets__card-right">
                  <span className="widgets__card-price">+{agent.price}€/mes</span>
                  <div className={`widgets__card-toggle ${isSelected ? 'widgets__card-toggle--on' : ''}`}>
                    {isSelected ? <Check size={12} /> : <Plus size={12} />}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Cost Summary Bar */}
        {count > 0 && (
          <motion.div
            className="widgets__summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="widgets__summary-left">
              <Bot size={18} />
              <span>
                <strong>{count} agente{count > 1 ? 's' : ''}</strong> seleccionado{count > 1 ? 's' : ''}
              </span>
            </div>
            <div className="widgets__summary-right">
              <span className="widgets__summary-label">Coste adicional:</span>
              <span className="widgets__summary-price">+{agentsCost}€/mes</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
