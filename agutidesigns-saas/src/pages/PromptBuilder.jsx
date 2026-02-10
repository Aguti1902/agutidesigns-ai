import { useState } from 'react';
import { Brain, Sparkles, Save, Check, Copy, RefreshCw } from 'lucide-react';
import './DashboardPages.css';

const PERSONALITIES = [
  { id: 'profesional', label: 'Profesional y serio' },
  { id: 'cercano', label: 'Cercano y amigable' },
  { id: 'formal', label: 'Formal y corporativo' },
  { id: 'divertido', label: 'Divertido y desenfadado' },
];

const CAPABILITIES = [
  { id: 'faq', label: 'Responder preguntas frecuentes' },
  { id: 'citas', label: 'Gestionar citas y reservas' },
  { id: 'leads', label: 'Captar datos de contacto' },
  { id: 'precios', label: 'Informar sobre precios' },
  { id: 'horarios', label: 'Informar sobre horarios' },
  { id: 'quejas', label: 'Gestionar quejas' },
  { id: 'productos', label: 'Recomendar productos/servicios' },
  { id: 'seguimiento', label: 'Hacer seguimiento de clientes' },
];

export default function PromptBuilder() {
  const [personality, setPersonality] = useState('cercano');
  const [capabilities, setCapabilities] = useState(['faq', 'leads', 'precios', 'horarios']);
  const [agentName, setAgentName] = useState('');
  const [customRules, setCustomRules] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [saved, setSaved] = useState(false);

  const toggleCap = (id) => {
    setCapabilities(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const generatePrompt = () => {
    const persLabel = PERSONALITIES.find(p => p.id === personality)?.label || 'cercano';
    const capsLabels = capabilities.map(c => CAPABILITIES.find(x => x.id === c)?.label).filter(Boolean);

    const prompt = `Eres ${agentName || 'un asistente virtual'}, el agente de atención al cliente por WhatsApp de este negocio.

PERSONALIDAD: ${persLabel}. Hablas en español, eres ${personality === 'cercano' ? 'amigable y cercano, como hablar con un amigo' : personality === 'divertido' ? 'divertido y desenfadado, con toques de humor' : personality === 'formal' ? 'formal y corporativo, muy profesional' : 'profesional pero accesible'}.

TUS FUNCIONES:
${capsLabels.map(c => `- ${c}`).join('\n')}

REGLAS:
- Responde siempre en español
- Sé conciso (máximo 2-3 párrafos por respuesta)
- Si no sabes algo, invita al cliente a llamar o dejar sus datos
- Siempre intenta recoger: nombre y teléfono del cliente
- No inventes información que no tengas en el contexto del negocio
${customRules ? `\nREGLAS ADICIONALES:\n${customRules}` : ''}

Usa la información del negocio proporcionada para responder con datos reales.`;

    setGeneratedPrompt(prompt);
  };

  const handleSave = () => {
    console.log('[Supabase] Guardar prompt:', generatedPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Configurar Agente IA</h1>
        <p>Define cómo quieres que se comporte tu agente. Genera un prompt optimizado automáticamente.</p>
      </div>

      <div className="card">
        {/* Agent Name */}
        <div className="form-field form-field--full">
          <label>Nombre de tu agente</label>
          <input
            type="text"
            placeholder="Ej: Asistente de Peluquería María"
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
          />
        </div>

        {/* Personality */}
        <div className="form-field form-field--full">
          <label>Personalidad</label>
          <div className="chips">
            {PERSONALITIES.map(p => (
              <button
                key={p.id}
                className={`chip ${personality === p.id ? 'chip--active' : ''}`}
                onClick={() => setPersonality(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div className="form-field form-field--full">
          <label>¿Qué puede hacer tu agente?</label>
          <div className="chips">
            {CAPABILITIES.map(c => (
              <button
                key={c.id}
                className={`chip ${capabilities.includes(c.id) ? 'chip--active' : ''}`}
                onClick={() => toggleCap(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Rules */}
        <div className="form-field form-field--full">
          <label>Reglas adicionales (opcional)</label>
          <textarea
            placeholder="Ej: No dar descuentos, siempre ofrecer la cita más próxima, mencionar la oferta de este mes..."
            value={customRules}
            onChange={e => setCustomRules(e.target.value)}
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <div className="form-actions">
          <button className="btn btn--primary" onClick={generatePrompt}>
            <Sparkles size={16} /> Generar prompt
          </button>
        </div>

        {/* Generated Prompt */}
        {generatedPrompt && (
          <div className="prompt-result">
            <div className="prompt-result__header">
              <h3><Brain size={16} /> Tu prompt generado</h3>
              <div className="prompt-result__actions">
                <button className="btn btn--outline btn--sm" onClick={copyPrompt}>
                  <Copy size={14} /> Copiar
                </button>
                <button className="btn btn--outline btn--sm" onClick={generatePrompt}>
                  <RefreshCw size={14} /> Regenerar
                </button>
              </div>
            </div>
            <pre className="prompt-result__code">{generatedPrompt}</pre>
            <button className="btn btn--primary" onClick={handleSave} style={{ marginTop: '1rem' }}>
              {saved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar como prompt activo</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
