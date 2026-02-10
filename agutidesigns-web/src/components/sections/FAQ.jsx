import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { fadeInUp, staggerContainer } from '../../hooks/useScrollAnimation';
import './FAQ.css';

const faqs = [
  {
    question: '¿Qué incluyen los packs de Web + IA?',
    answer: 'Cada pack incluye diseño web profesional + funcionalidades de Inteligencia Artificial integradas. El Pack Starter incluye landing page + chatbot básico. El Business añade web multipágina, automatización de emails y CRM. El Premium incluye todo lo anterior + IA personalizada, dashboard analytics y soporte 24/7.',
  },
  {
    question: '¿Cómo funciona el chatbot IA?',
    answer: 'El chatbot se integra en tu web y atiende a tus visitantes 24/7. Está entrenado con la información de tu negocio, responde preguntas frecuentes, cualifica leads y recopila datos de contacto automáticamente. Puedes personalizarlo con tu tono de voz y estilo.',
  },
  {
    question: '¿Necesito conocimientos técnicos?',
    answer: '¡Para nada! Ese es todo el punto. Yo me encargo de todo el diseño y la configuración técnica. La IA trabaja automáticamente una vez configurada. Y si necesitas cambiar algo, te doy videotutoriales y soporte para que puedas gestionarlo de forma sencilla.',
  },
  {
    question: '¿Cuánto tardan en crear mi web?',
    answer: 'Depende del pack y la complejidad. Una landing page (Pack Starter) puede estar lista en 1-2 semanas. Una web multipágina (Business) en 2-3 semanas. Un proyecto Premium en 3-4 semanas. Los proyectos personalizados varían según las necesidades.',
  },
  {
    question: '¿Puedo personalizar la IA de mi web?',
    answer: 'Sí, especialmente en los packs Business y Premium. El chatbot se entrena con la información de tu negocio, puedes definir respuestas específicas, el tono de comunicación, y los flujos de automatización se adaptan a tu proceso de ventas.',
  },
  {
    question: '¿Qué pasa si quiero cancelar el mantenimiento?',
    answer: 'Puedes cancelar el mantenimiento mensual cuando quieras. Tu web seguirá funcionando, pero perderás el hosting incluido, las actualizaciones, el soporte y las funcionalidades de IA que requieran servidor. Te damos todas las facilidades para la transición.',
  },
  {
    question: '¿Qué tecnologías utilizáis?',
    answer: 'Trabajamos principalmente con WordPress para webs, combinado con APIs de inteligencia artificial (OpenAI, etc.) para las automatizaciones. Usamos hosting premium optimizado, certificados SSL gratuitos, y todas las herramientas necesarias para que tu web vuele.',
  },
  {
    question: '¿Cómo funciona el presupuesto automático?',
    answer: 'Nuestra IA analiza las respuestas que das en el formulario de presupuesto (tipo de web, funcionalidades, plazos, etc.) y genera un presupuesto detallado al instante. Es un presupuesto orientativo que luego refinamos juntos en una videollamada gratuita.',
  },
  {
    question: '¿Ofrecéis garantía?',
    answer: 'Sí. Trabajamos con revisiones y tu aprobación en cada fase del proyecto. Si algo no te convence del diseño, lo ajustamos. Queremos que estés 100% satisfecho con el resultado. Además, el soporte continuo está incluido en el mantenimiento mensual.',
  },
];

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <motion.div
      className={`faq__item ${isOpen ? 'faq__item--open' : ''}`}
      variants={fadeInUp}
    >
      <button className="faq__question" onClick={onToggle}>
        <span>{faq.question}</span>
        <ChevronDown size={20} className={`faq__chevron ${isOpen ? 'faq__chevron--open' : ''}`} />
      </button>
      <motion.div
        className="faq__answer-wrapper"
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <p className="faq__answer">{faq.answer}</p>
      </motion.div>
    </motion.div>
  );
}

export default function FAQ() {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="faq section" ref={ref}>
      <div className="container container--narrow">
        {/* Header */}
        <motion.div
          className="faq__header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge--primary">
            <HelpCircle size={12} />
            FAQ
          </span>
          <h2 className="faq__title">
            Preguntas
            <span className="text-primary"> frecuentes</span>
          </h2>
          <p className="faq__subtitle">
            Si no encuentras tu respuesta aquí, nuestro chatbot IA puede ayudarte
            o puedes contactarnos directamente.
          </p>
        </motion.div>

        {/* Items */}
        <motion.div
          className="faq__list"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
