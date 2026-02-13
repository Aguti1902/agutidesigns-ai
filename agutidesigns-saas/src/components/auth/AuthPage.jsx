import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Lock, User, ArrowRight, Eye, EyeOff, Zap, CheckCircle, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './AuthPage.css';

export default function AuthPage() {
  const { signIn, signUp, checkPhoneAvailable, registerTrialPhone } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!form.name) throw new Error('Introduce tu nombre');
        if (!form.phone || form.phone.replace(/\s/g, '').length < 9) throw new Error('Introduce un número de teléfono válido');

        // Check if phone already used for a trial
        const phoneAvailable = await checkPhoneAvailable(form.phone);
        if (!phoneAvailable) {
          throw new Error('Este número de teléfono ya ha sido utilizado para una prueba gratuita. Si necesitas ayuda, contacta con soporte.');
        }

        const data = await signUp(form.email, form.password, form.name);

        // Register the phone for the trial
        if (data?.user?.id) {
          await registerTrialPhone(form.phone, data.user.id);
        }

        setEmailSent(true);
      } else {
        await signIn(form.email, form.password);
      }
    } catch (err) {
      setError(err.message || 'Ha habido un error');
    } finally {
      setLoading(false);
    }
  };

  // ── Email verification waiting screen ──
  if (emailSent) {
    return (
      <div className="auth">
        <div className="auth__left">
          <div className="auth__left-content">
            <div className="auth__logo">
              <img src="/images/Logoverde.png" alt="Agutidesigns" className="auth__logo-img" />
              <span className="auth__logo-badge">IA</span>
            </div>
            <h1>Tu agente de WhatsApp IA</h1>
            <p>Crea un asistente inteligente que atiende a tus clientes 24/7. Sin código, en minutos.</p>
          </div>
        </div>
        <div className="auth__right">
          <motion.div
            className="auth__verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="auth__verify-icon">
              <Mail size={32} />
            </div>
            <h2>Revisa tu email</h2>
            <p className="auth__verify-text">
              Hemos enviado un enlace de verificación a
            </p>
            <p className="auth__verify-email">{form.email}</p>
            <p className="auth__verify-hint">
              Haz clic en el enlace del email para activar tu cuenta. Puede tardar unos segundos en llegar.
            </p>
            <div className="auth__verify-tips">
              <span>¿No lo encuentras?</span>
              <ul>
                <li>Revisa la carpeta de spam</li>
                <li>Asegúrate de que el email es correcto</li>
              </ul>
            </div>
            <button
              className="auth__verify-btn"
              onClick={() => { setEmailSent(false); setMode('login'); }}
            >
              Ya he verificado, iniciar sesión <ArrowRight size={14} />
            </button>
            <button
              className="auth__verify-resend"
              onClick={async () => {
                try {
                  await signUp(form.email, form.password, form.name);
                } catch {}
              }}
            >
              Reenviar email
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth__left">
        <div className="auth__left-content">
          <div className="auth__logo">
            <img src="/images/Logoverde.png" alt="Agutidesigns" className="auth__logo-img" />
            <span className="auth__logo-badge">IA</span>
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
            <>
              <div className="auth__field">
                <label><User size={14} /> Nombre</label>
                <input type="text" placeholder="Tu nombre" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div className="auth__field">
                <label><Phone size={14} /> Teléfono / WhatsApp</label>
                <input type="tel" placeholder="+34 600 000 000" value={form.phone} onChange={e => update('phone', e.target.value)} />
                <span className="auth__field-hint">Este número se usará para vincular tu agente IA</span>
              </div>
            </>
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
