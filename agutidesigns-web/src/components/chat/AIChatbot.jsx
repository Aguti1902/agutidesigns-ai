import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2 } from 'lucide-react';
import { sendChatMessage, qualifyLead } from '../../services/aiService';
import './AIChatbot.css';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: `¡Hola! 👋 Soy **Guti AI**, el asistente virtual de Agutidesigns.\n\nEstoy aquí para ayudarte a encontrar la solución web + IA perfecta para tu negocio. Puedo:\n\n- 🌐 Contarte sobre nuestros packs\n- 💰 Darte información de precios\n- 🤖 Explicarte cómo funciona la IA\n- 📋 Ayudarte con el proceso\n\n¿En qué puedo ayudarte?`,
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leadData, setLeadData] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Cualificar lead cada 5 mensajes
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0 && userMessages.length % 3 === 0) {
      qualifyLead(messages).then(data => {
        setLeadData(data);
        console.log('[Lead Qualification]', data);
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(conversationHistory, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ups, ha habido un problemilla técnico. ¿Puedes intentarlo de nuevo? Si persiste, escríbenos a hola@agutidesigns.com 😊',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chatbot__toggle"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <MessageCircle size={24} />
            <span className="chatbot__toggle-badge">
              <Sparkles size={10} />
              IA
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`chatbot ${isMinimized ? 'chatbot--minimized' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="chatbot__header">
              <div className="chatbot__header-info">
                <div className="chatbot__avatar">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="chatbot__name">Guti AI</h4>
                  <span className="chatbot__status">
                    <span className="chatbot__status-dot" />
                    Online — Responde al instante
                  </span>
                </div>
              </div>
              <div className="chatbot__header-actions">
                <button onClick={() => setIsMinimized(!isMinimized)} aria-label="Minimizar">
                  <Minimize2 size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} aria-label="Cerrar">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="chatbot__messages">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`chatbot__message chatbot__message--${msg.role}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="chatbot__message-avatar">
                        {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                      </div>
                      <div
                        className="chatbot__message-content"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      className="chatbot__message chatbot__message--assistant"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="chatbot__message-avatar">
                        <Bot size={14} />
                      </div>
                      <div className="chatbot__typing">
                        <span /><span /><span />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="chatbot__input-area">
                  <div className="chatbot__input-wrapper">
                    <textarea
                      ref={inputRef}
                      className="chatbot__input"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe tu mensaje..."
                      rows={1}
                      disabled={isLoading}
                    />
                    <button
                      className="chatbot__send"
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isLoading}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <p className="chatbot__disclaimer">
                    Powered by IA · agutidesigns.com
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
