import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Building, Brain, Rocket, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './OnboardingFlow.css';

const STEPS = [
  { icon: <Rocket size={32} />, title: '¡Bienvenido a tu Agente IA!', desc: 'En 3 pasos tendrás tu asistente de WhatsApp funcionando. Es rápido, fácil y sin código.' },
  { icon: <MessageCircle size={32} />, title: 'Conecta tu WhatsApp', desc: 'En la sección "WhatsApp" podrás vincular tu número escaneando un QR. Tu agente usará ese número para responder.' },
  { icon: <Building size={32} />, title: 'Añade tu negocio', desc: 'En "Mi Negocio" introduce los datos de tu empresa: servicios, precios, horarios. La IA usará esta info para responder.' },
  { icon: <Brain size={32} />, title: 'Configura tu IA', desc: 'En "Prompt IA" defines cómo quieres que hable tu agente: tono, personalidad, qué puede y qué no puede decir.' },
];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const { updateProfile } = useAuth();

  const handleFinish = async () => {
    await updateProfile({ onboarding_completed: true });
    onComplete();
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="onboard">
      <div className="onboard__card">
        {/* Progress */}
        <div className="onboard__progress">
          {STEPS.map((_, i) => (
            <div key={i} className={`onboard__dot ${i <= step ? 'onboard__dot--active' : ''}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="onboard__step"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <div className="onboard__icon">{current.icon}</div>
            <h2>{current.title}</h2>
            <p>{current.desc}</p>
          </motion.div>
        </AnimatePresence>

        <div className="onboard__actions">
          {step > 0 && (
            <button className="onboard__btn onboard__btn--ghost" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={16} /> Anterior
            </button>
          )}
          <div style={{ flex: 1 }} />
          {!isLast ? (
            <button className="onboard__btn onboard__btn--primary" onClick={() => setStep(s => s + 1)}>
              Siguiente <ArrowRight size={16} />
            </button>
          ) : (
            <button className="onboard__btn onboard__btn--primary" onClick={handleFinish}>
              <Check size={16} /> ¡Empezar!
            </button>
          )}
        </div>

        <button className="onboard__skip" onClick={handleFinish}>
          Saltar tutorial
        </button>
      </div>
    </div>
  );
}
