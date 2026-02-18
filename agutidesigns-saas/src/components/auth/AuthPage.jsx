import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Mail, Lock, User, ArrowRight, Eye, EyeOff, Zap, CheckCircle, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import './AuthPage.css';

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, checkPhoneAvailable, registerTrialPhone } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
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

        // Wait for profile to be created by trigger, then register phone
        if (data?.user?.id) {
          let profileReady = false;
          for (let i = 0; i < 8; i++) {
            await new Promise(r => setTimeout(r, 500));
            const { data: p } = await supabase.from('profiles').select('id').eq('id', data.user.id).single();
            if (p) { profileReady = true; break; }
          }
          if (profileReady) {
            try { await registerTrialPhone(form.phone, data.user.id); } catch (e) { console.warn('Phone registration:', e.message); }
          }
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

          {/* Google OAuth button */}
          <button
            type="button"
            className="auth__google-btn"
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err) {
                setError(err.message || 'Error al conectar con Google');
              }
            }}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.183l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.335z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.462.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <div className="auth__divider">
            <span>o</span>
          </div>

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

          {mode === 'register' && (
            <p className="auth__terms">
              Al registrarte, aceptas nuestros <a href="https://agutidesigns.io/terminos.html" target="_blank" rel="noopener">Términos de Servicio</a> y nuestra <a href="https://agutidesigns.io/privacidad.html" target="_blank" rel="noopener">Política de Privacidad</a>.
            </p>
          )}

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
