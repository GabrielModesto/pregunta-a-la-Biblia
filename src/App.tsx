import React, { useState, useEffect } from 'react';
import { BibleChat } from './components/BibleChat';
import { LiveVoice } from './components/LiveVoice';
import { TeachingsView } from './components/TeachingsView';
import { SettingsModal } from './components/SettingsModal';
import { Book, Mic, Library, Info, Github, User, Settings } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'chat' | 'voice' | 'teachings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSelectTeaching = (prompt: string) => {
    setInitialPrompt(prompt);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-paper text-ink font-sans selection:bg-olive selection:text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[30dvh] bg-gradient-to-b from-sidebar to-transparent opacity-40 pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Dynamic Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <div className="flex-1 h-full w-full max-w-3xl mx-auto flex flex-col overflow-hidden px-4">
                {activeTab === 'chat' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                     <BibleChat initialPrompt={initialPrompt} />
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {activeTab === 'voice' && <LiveVoice />}
                  {activeTab === 'teachings' && (
                    <div className="mb-24 pt-6">
                      <TeachingsView onSelect={handleSelectTeaching} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Bottom Nav - The primary interaction hub */}
        <nav className="flex items-center justify-around bg-sidebar/80 backdrop-blur-xl border-t border-olive/5 px-2 py-3 safe-bottom shrink-0 z-50 rounded-t-[32px] shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)]">
          <MobileNavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={Book} 
            label="Biblia" 
          />
          <MobileNavButton 
            active={activeTab === 'voice'} 
            onClick={() => {
              setActiveTab('voice');
              setInitialPrompt(null);
            }} 
            icon={Mic} 
            label="Voz" 
          />
          <MobileNavButton 
            active={activeTab === 'teachings'} 
            onClick={() => setActiveTab('teachings')} 
            icon={Library} 
            label="Lecciones" 
          />
          <MobileNavButton 
            active={isSettingsOpen} 
            onClick={() => setIsSettingsOpen(true)} 
            icon={Settings} 
            label="Ajustes" 
          />
        </nav>
      </div>

      <InstallPrompt />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label, desc }: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
  desc: string;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
        active 
          ? "bg-olive text-white shadow-xl shadow-olive/20" 
          : "hover:bg-sidebar-accent text-muted-ink"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-xl transition-colors",
        active ? "bg-white/20" : "bg-sidebar border border-olive/5"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <p className="font-bold text-sm leading-none mb-1">{label}</p>
        <p className={cn("text-[10px] font-medium opacity-60", active ? "text-white" : "text-muted-ink")}>
          {desc}
        </p>
      </div>
    </button>
  );
}

function MobileNavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center py-2 transition-all active:scale-90",
        active ? "text-olive" : "text-muted-ink/40"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-2xl transition-all duration-500 mb-1 flex items-center justify-center",
        active ? "bg-olive text-white shadow-xl shadow-olive/20" : "bg-transparent"
      )}>
        <Icon className={cn("w-5 h-5", active ? "scale-110" : "scale-100")} />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.1em]">
        {label}
      </span>
    </button>
  );
}

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-20 left-4 right-4 md:right-auto md:w-[350px] bg-olive text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Book className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm">Instalar Lumen</p>
          <p className="text-[10px] opacity-80">Accede más rápido a la Palabra.</p>
        </div>
      </div>
      <button 
        onClick={handleInstall}
        className="px-4 py-2 bg-white text-olive rounded-xl font-bold text-xs"
      >
        Instalar
      </button>
    </motion.div>
  );
}
