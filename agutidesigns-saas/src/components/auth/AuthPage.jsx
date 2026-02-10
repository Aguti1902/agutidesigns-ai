import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Lock, User, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './AuthPage.css';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!form.name) throw new Error('Introduce tu nombre');
        await signUp(form.email, form.password, form.name);
      } else {
        await signIn(form.email, form.password);
      }
    } catch (err) {
      setError(err.message || 'Ha habido un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__left">
        <div className="auth__left-content">
          <div className="auth__logo">
            <MessageCircle size={28} />
            <span>Agutidesigns</span>
          </div>
          <h1>Tu agente de WhatsApp IA</h1>
          <p>Crea un asistente inteligente que atiende a tus clientes 24/7. Sin código, en minutos.</p>
          <div className="auth__features">
            <div><Zap size={16} /> 2 días de prueba gratis</div>
            <div><Zap size={16} /> Sin tarjeta de crédito</div>
            <div><Zap size={16} /> Activo en 5 minutos</div>
          </div>
        </div>
      </div>

      <div className="auth__right">
        <motion.form
          className="auth__form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
          <p className="auth__form-sub">
            {mode === 'login' ? 'Accede a tu dashboard' : 'Empieza tu prueba gratuita de 2 días'}
          </p>

          {mode === 'register' && (
            <div className="auth__field">
              <label><User size={14} /> Nombre</label>
              <input type="text" placeholder="Tu nombre" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
          )}

          <div className="auth__field">
            <label><Mail size={14} /> Email</label>
            <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>

          <div className="auth__field">
            <label><Lock size={14} /> Contraseña</label>
            <div className="auth__pw-wrapper">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
              <button type="button" className="auth__pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="auth__error">{error}</p>}

          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta gratis'}
            <ArrowRight size={16} />
          </button>

          <p className="auth__switch">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
