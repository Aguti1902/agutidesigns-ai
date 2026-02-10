import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { MessageCircle, FileText, Paintbrush, Rocket, Bot, ArrowRight } from 'lucide-react';
import { fadeInUp, staggerContainer } from '../../hooks/useScrollAnimation';
import './Process.css';

const steps = [
  {
    number: '01',
    icon: <MessageCircle size={24} />,
    title: 'Hablamos',
    desc: 'La IA te atiende al instante por el chat o puedes rellenar el formulario de presupuesto. Sin esperas.',
    tag: 'Automático con IA',
    color: 'primary',
  },
  {
    number: '02',
    icon: <FileText size={24} />,
    title: 'Presupuesto IA',
    desc: 'La IA analiza tus necesidades y genera un presupuesto detallado al instante. Si te encaja, seguimos.',
    tag: 'Automático con IA',
    color: 'primary',
  },
  {
    number: '03',
    icon: <Paintbrush size={24} />,
    title: 'Diseño y Desarrollo',
    desc: 'Aquí entra Guti en acción. Diseño tu web a medida con toda la IA integrada. Tú validar, yo creo.',
    tag: 'Manual por Guti',
    color: 'accent',
  },
  {
    number: '04',
    icon: <Rocket size={24} />,
    title: 'Lanzamiento',
    desc: 'Tu web sale a la luz con chatbot, emails automáticos y todo funcionando. La IA empieza a trabajar para ti.',
    tag: 'Automático con IA',
    color: 'primary',
  },
];

const aiAutomations = [
  'Chatbot atendiendo clientes 24/7',
  'Emails automáticos de seguimiento',
  'Cualificación de leads automática',
  'Presupuestos generados por IA',
  'Informes de rendimiento semanales',
  'Respuestas personalizadas a cada cliente',
];

export default function Process() {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <section id="proceso" className="process section" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="process__header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge--primary">
            <Bot size={12} />
            Proceso
          </span>
          <h2 className="process__title">
            De idea a web con IA
            <span className="text-primary"> en 4 pasos</span>
          </h2>
          <p className="process__subtitle">
            La mayor parte del proceso está automatizado con IA. Solo el diseño lo hago yo
            (porque para eso me encanta).
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="process__steps"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="process__step"
              variants={fadeInUp}
            >
              <div className="process__step-line">
                <div className={`process__step-dot process__step-dot--${step.color}`}>
                  {step.icon}
                </div>
                {i < steps.length - 1 && <div className="process__step-connector" />}
              </div>
              <div className="process__step-content">
                <span className="process__step-number">{step.number}</span>
                <h3 className="process__step-title">{step.title}</h3>
                <p className="process__step-desc">{step.desc}</p>
                <span className={`process__step-tag process__step-tag--${step.color}`}>
                  {step.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Automations Card */}
        <motion.div
          className="process__ai-card"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="process__ai-card-header">
            <Bot size={24} />
            <h3>Lo que la IA hace por ti automáticamente</h3>
          </div>
          <div className="process__ai-list">
            {aiAutomations.map((item, i) => (
              <div key={i} className="process__ai-item">
                <ArrowRight size={14} className="text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
