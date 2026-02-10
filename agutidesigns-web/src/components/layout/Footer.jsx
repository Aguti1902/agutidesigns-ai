import { ArrowUpRight, Mail, Instagram, Linkedin, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        {/* Top CTA */}
        <div className="footer__cta">
          <h2 className="footer__cta-title">
            ¿Listo para llevar tu negocio al <span className="text-primary">siguiente nivel</span>?
          </h2>
          <p className="footer__cta-text">
            Diseñemos juntos tu web con IA. El primer paso es hablar.
          </p>
          <a href="#presupuesto" className="footer__cta-button">
            Empezar ahora <ArrowUpRight size={20} />
          </a>
        </div>

        <div className="footer__divider" />

        {/* Main Footer */}
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/images/Logo.png" alt="Agutidesigns" className="footer__logo-img" />
            </div>
            <p className="footer__brand-desc">
              Diseño web profesional potenciado con Inteligencia Artificial. Creamos experiencias digitales que convierten.
            </p>
            <div className="footer__socials">
              <a href="https://instagram.com/agutidesigns" target="_blank" rel="noopener noreferrer" className="footer__social" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://linkedin.com/in/agutidesigns" target="_blank" rel="noopener noreferrer" className="footer__social" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="mailto:hola@agutidesigns.com" className="footer__social" aria-label="Email">
                <Mail size={18} />
              </a>
            </div>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Servicios</h4>
            <ul className="footer__col-list">
              <li><a href="#servicios">Web + IA</a></li>
              <li><a href="#packs">Packs</a></li>
              <li><a href="#presupuesto">Presupuesto</a></li>
              <li><a href="#proceso">Proceso</a></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Empresa</h4>
            <ul className="footer__col-list">
              <li><a href="#sobre-mi">Sobre Guti</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="mailto:hola@agutidesigns.com">Contacto</a></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Contacto</h4>
            <ul className="footer__col-list">
              <li>
                <a href="mailto:hola@agutidesigns.com">
                  hola@agutidesigns.com
                </a>
              </li>
              <li className="footer__availability">
                <span className="footer__status-dot" />
                Disponible para proyectos
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__divider" />

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} Agutidesigns. Hecho con <Heart size={14} className="footer__heart" /> y mucha IA.
          </p>
          <button className="footer__back-top" onClick={scrollToTop}>
            Volver arriba ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
