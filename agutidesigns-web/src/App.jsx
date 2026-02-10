import { useState, useCallback } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AIChatbot from './components/chat/AIChatbot';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Services from './components/sections/Services';
import Pricing from './components/sections/Pricing';
import PackCheckout from './components/sections/PackCheckout';
import QuoteForm from './components/sections/QuoteForm';
import FAQ from './components/sections/FAQ';
import './App.css';

export default function App() {
  const [selectedPack, setSelectedPack] = useState(null);

  const handleSelectPack = useCallback((pack) => {
    setSelectedPack(pack);
  }, []);

  const handleChangePack = useCallback(() => {
    setSelectedPack(null);
    setTimeout(() => {
      const el = document.getElementById('packs');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  return (
    <div className="app">
      <div className="noise-overlay" />
      <Navbar />

      <main>
        <Hero />
        <About />
        <Services />
        <Pricing onSelectPack={handleSelectPack} />
        <PackCheckout selectedPack={selectedPack} onChangePack={handleChangePack} />
        <QuoteForm />
        <FAQ />
      </main>

      <Footer />
      <AIChatbot />
    </div>
  );
}
