/* =============================================
   AGUTIDESIGNS - Calculadora de Precios
   Calcula precio real en base a las selecciones
   ============================================= */

const WEB_BASE_PRICES = {
  landing: 497,
  corporativa: 997,
  ecommerce: 1497,
  portfolio: 697,
  blog: 597,
  webapp: 1997,
  otra: 997,
};

const PAGE_EXTRA = {
  '1': 0,
  '1-3': 150,
  '3-5': 400,
  '5-10': 800,
  '10+': 1200,
  'no-se': 300,
};

const AI_FEATURE_PRICES = {
  'chatbot-web': 250,
  'chatbot': 250,
  'chatbot-wa': 350,
  'emails': 200,
  'seo': 250,
  'analytics': 200,
  'presupuestos': 300,
  'quotes': 300,
  'crm': 250,
  'content': 200,
  'translations': 150,
};

const EXTRA_FEATURE_PRICE = 120; // per extra feature

const TIMELINE_MULTIPLIER = {
  urgente: 1.25,
  normal: 1,
  flexible: 0.95,
  'sin-prisa': 0.9,
};

const MONTHLY_BASE = {
  landing: 35,
  corporativa: 55,
  ecommerce: 75,
  portfolio: 45,
  blog: 45,
  webapp: 95,
  otra: 55,
};

const AI_MONTHLY_EXTRA = 15; // per AI feature per month

export function calculatePrice(formData) {
  // Base web price
  const webBase = WEB_BASE_PRICES[formData.webType] || 997;

  // Pages extra
  const pagesExtra = PAGE_EXTRA[formData.pages] || 0;

  // AI features
  const aiFeatures = formData.aiFeatures || [];
  const aiTotal = aiFeatures.reduce((sum, f) => sum + (AI_FEATURE_PRICES[f] || 150), 0);

  // Extra features
  const extras = formData.extraFeatures || [];
  const extrasTotal = extras.length * EXTRA_FEATURE_PRICE;

  // Subtotal before timeline
  const subtotal = webBase + pagesExtra + aiTotal + extrasTotal;

  // Timeline multiplier
  const multiplier = TIMELINE_MULTIPLIER[formData.timeline] || 1;
  const total = Math.round(subtotal * multiplier);

  // Monthly
  const monthlyBase = MONTHLY_BASE[formData.webType] || 55;
  const monthlyAi = aiFeatures.length * AI_MONTHLY_EXTRA;
  const monthly = monthlyBase + monthlyAi;

  // Breakdown
  const breakdown = [];
  breakdown.push({ label: `Diseño web (${formData.webType || 'estándar'})`, price: webBase });
  if (pagesExtra > 0) breakdown.push({ label: `Páginas adicionales (${formData.pages})`, price: pagesExtra });
  aiFeatures.forEach(f => {
    const names = {
      'chatbot-web': 'Chatbot IA web',
      'chatbot': 'Chatbot IA web',
      'chatbot-wa': 'WhatsApp IA',
      'emails': 'Automatización emails',
      'seo': 'SEO con IA',
      'analytics': 'Dashboard analytics',
      'presupuestos': 'Presupuestos automáticos',
      'quotes': 'Presupuestos automáticos',
      'crm': 'CRM inteligente',
      'content': 'Generación de contenido',
      'translations': 'Traducciones automáticas',
    };
    breakdown.push({ label: names[f] || f, price: AI_FEATURE_PRICES[f] || 150 });
  });
  if (extrasTotal > 0) breakdown.push({ label: `${extras.length} funcionalidades extra`, price: extrasTotal });
  if (multiplier !== 1) {
    const diff = total - subtotal;
    const label = multiplier > 1 ? 'Recargo urgencia' : 'Descuento flexibilidad';
    breakdown.push({ label, price: diff });
  }

  return {
    total,
    monthly,
    breakdown,
    webBase,
    aiTotal,
    extrasTotal,
  };
}

export function formatPrice(n) {
  return n.toLocaleString('es-ES');
}
