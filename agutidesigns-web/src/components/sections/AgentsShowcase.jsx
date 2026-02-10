import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  MessageCircle, UserCheck, Calculator, CalendarCheck,
  Mail, HelpCircle, RefreshCw, Star, Bot, X, Play,
  User, ArrowRight, Sparkles
} from 'lucide-react';
import { agents } from '../../data/agents';
import { fadeInUp, staggerContainer } from '../../hooks/useScrollAnimation';
import './AgentsShowcase.css';

const iconMap = {
  MessageCircle: <MessageCircle size={22} />,
  UserCheck: <UserCheck size={22} />,
  Calculator: <Calculator size={22} />,
  CalendarCheck: <CalendarCheck size={22} />,
  Mail: <Mail size={22} />,
  HelpCircle: <HelpCircle size={22} />,
  RefreshCw: <RefreshCw size={22} />,
  Star: <Star size={22} />,
};

const iconMapSmall = {
  MessageCircle: <MessageCircle size={16} />,
  UserCheck: <UserCheck size={16} />,
  Calculator: <Calculator size={16} />,
  CalendarCheck: <CalendarCheck size={16} />,
  Mail: <Mail size={16} />,
  HelpCircle: <HelpCircle size={16} />,
  RefreshCw: <RefreshCw size={16} />,
  Star: <Star size={16} />,
};

/* ══════════════════════════════════
   Mini Chat Demo — always visible
   ══════════════════════════════════ */
function MiniChatDemo({ agent }) {
  const [currentStep, setCurrentStep] = useState(0);
  const messages = agent.demoMessages || [];
  const visibleMessages = messages.slice(0, currentStep + 1);

  const handleNext = () => {
    setCurrentStep(prev => (prev < messages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="demo-chat">
      <div className="demo-chat__header">
        <div className="demo-chat__header-info">
          <div className="demo-chat__avatar"><Bot size={14} /></div>
          <div>
            <span className="demo-chat__header-name">{agent.shortName}</span>
            <span className="demo-chat__header-status">
              <span className="demo-chat__status-dot" /> Online
            </span>
          </div>
        </div>
        <span className="demo-chat__badge">DEMO</span>
      </div>
      <div className="demo-chat__body">
        {visibleMessages.map((msg, i) => (
          <motion.div
            key={`${currentStep}-${i}`}
            className={`demo-chat__msg demo-chat__msg--${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
          >
            <div className="demo-chat__msg-bubble">{msg.content}</div>
          </motion.div>
        ))}
      </div>
      <button className="demo-chat__next" onClick={handleNext}>
        {currentStep < messages.length - 1 ? (
          <><MessageCircle size={13} /> Siguiente mensaje <ArrowRight size={12} /></>
        ) : (
          <><RefreshCw size={13} /> Reiniciar demo</>
        )}
      </button>
    </div>
  );
}

/* ══════════════════════════════════
   Simulation Demo — full visual flow
   ══════════════════════════════════ */
function SimulationDemo({ agent }) {
  const steps = agent.simulationSteps || [];

  return (
    <div className="demo-sim">
      <div className="demo-sim__header">
        <Sparkles size={14} />
        <span>Flujo automático</span>
      </div>
      <div className="demo-sim__flow">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className={`demo-sim__step demo-sim__step--${step.type}`}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.3 }}
          >
            <div className="demo-sim__connector">
              <div className="demo-sim__dot" />
              {i < steps.length - 1 && <div className="demo-sim__line" />}
            </div>
            <div className="demo-sim__card">
              <span className="demo-sim__label">{step.label}</span>
              <span className="demo-sim__time">{step.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   Modal Demo
   ══════════════════════════════════ */
function ModalDemo({ agent, isOpen, onClose }) {
  const [chatStep, setChatStep] = useState(0);
  const messages = agent.demoMessages || [];
  const visibleMessages = messages.slice(0, chatStep + 1);

  const handleNext = () => {
    setChatStep(prev => (prev < messages.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="agent-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="agent-modal__card"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        <div className="agent-modal__header">
          <div className="agent-modal__header-left">
            <div className="agent-modal__icon">{iconMapSmall[agent.icon]}</div>
            <div>
              <h3>{agent.name}</h3>
              <span className="agent-modal__price">{agent.price}€/mes</span>
            </div>
          </div>
          <button className="agent-modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="agent-modal__desc">{agent.description}</p>

        <div className="agent-modal__chat">
          <div className="agent-modal__messages">
            {visibleMessages.map((msg, i) => (
              <motion.div
                key={i}
                className={`agent-modal__msg agent-modal__msg--${msg.role}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="agent-modal__msg-avatar">
                  {msg.role === 'assistant' ? <Bot size={12} /> : <User size={12} />}
                </div>
                <div
                  className="agent-modal__msg-text"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </motion.div>
            ))}
          </div>
          <button className="agent-modal__next" onClick={handleNext}>
            {chatStep < messages.length - 1 ? 'Siguiente mensaje' : 'Reiniciar demo'}
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="agent-modal__footer">
          <span>Esta es una demo interactiva del agente</span>
        </div>
      </motion.div>
      <div className="agent-modal__overlay" onClick={onClose} />
    </motion.div>
  );
}

/* ══════════════════════════════════
   Modal Preview (for modal-type)
   ══════════════════════════════════ */
function ModalPreview({ agent, onOpen }) {
  const firstMsg = agent.demoMessages?.[0];
  return (
    <div className="demo-preview">
      <div className="demo-preview__window">
        <div className="demo-preview__header">
          <div className="demo-preview__header-info">
            <div className="demo-preview__avatar"><Bot size={14} /></div>
            <span>{agent.shortName}</span>
          </div>
          <span className="demo-preview__badge">DEMO</span>
        </div>
        <div className="demo-preview__body">
          {firstMsg && (
            <div className="demo-preview__msg">
              <div className="demo-preview__msg-bubble">
                {firstMsg.content.length > 100 ? firstMsg.content.slice(0, 100) + '...' : firstMsg.content}
              </div>
            </div>
          )}
          <div className="demo-preview__blur" />
        </div>
      </div>
      <button className="demo-preview__btn" onClick={onOpen}>
        <Play size={16} />
        Probar demo interactiva
      </button>
    </div>
  );
}

/* ══════════════════════════════════
   Agent Panel (replaces AgentCard)
   ══════════════════════════════════ */
function AgentPanel({ agent }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <motion.div className="agent-panel" variants={fadeInUp}>
        {/* Info side */}
        <div className="agent-panel__info">
          <div className="agent-panel__top">
            <div className="agent-panel__icon">{iconMap[agent.icon]}</div>
            <span className="agent-panel__category">{agent.category}</span>
          </div>
          <h3 className="agent-panel__name">{agent.name}</h3>
          <p className="agent-panel__desc">{agent.description}</p>
          <div className="agent-panel__price">
            <span className="agent-panel__price-amount">{agent.price}€</span>
            <span className="agent-panel__price-period">/mes</span>
          </div>
        </div>

        {/* Demo side */}
        <div className="agent-panel__demo">
          {agent.demoType === 'mini-chat' && <MiniChatDemo agent={agent} />}
          {agent.demoType === 'simulation' && <SimulationDemo agent={agent} />}
          {agent.demoType === 'modal' && (
            <ModalPreview agent={agent} onOpen={() => setModalOpen(true)} />
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <ModalDemo agent={agent} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════
   Main Section
   ══════════════════════════════════ */
export default function AgentsShowcase() {
  const [ref, inView] = useInView({ threshold: 0.03, triggerOnce: true });

  return (
    <section id="agentes" className="agents section" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="agents__header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge--primary">
            <Bot size={12} />
            Agentes IA
          </span>
          <h2 className="agents__title">
            Agentes inteligentes que
            <span className="text-primary"> trabajan por ti</span>
          </h2>
          <p className="agents__subtitle">
            Cada agente es una pieza de IA especializada que se integra en tu web.
            Pruébalos aquí mismo y elige los que necesites.
          </p>
        </motion.div>

        {/* Grid — 2 columns, spacious panels */}
        <motion.div
          className="agents__grid"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {agents.map((agent) => (
            <AgentPanel key={agent.id} agent={agent} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
