import React, { useState } from 'react';
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
    <div className="flex flex-col h-screen bg-paper text-ink font-sans selection:bg-olive selection:text-white">
      {/* Sidebar / Mobile Nav */}
      <div className="flex flex-col md:flex-row h-full">
        <aside className="w-full md:w-[280px] bg-sidebar border-r border-olive/15 flex flex-col p-8 space-y-8 z-20">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-olive p-2.5 rounded-xl shadow-sm">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold leading-none italic text-olive">Lumen</h1>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-muted-ink">Bíblico Católico</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-3">
            <NavButton 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')}
              icon={Book}
              label="Inicio"
              desc="Consulta la Palabra"
            />
            <NavButton 
              active={activeTab === 'voice'} 
              onClick={() => {
                setActiveTab('voice');
                setInitialPrompt(null);
              }}
              icon={Mic}
              label="Voz en Vivo"
              desc="Guía espiritual"
            />
            <NavButton 
              active={activeTab === 'teachings'} 
              onClick={() => setActiveTab('teachings')}
              icon={Library}
              label="Enseñanzas"
              desc="Sabiduría y Parábolas"
            />
            
            <div className="pt-4">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white text-muted-ink transition-all group"
              >
                <div className="p-2 rounded-lg bg-sidebar group-hover:bg-olive/10 transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-none mb-1">Ajustes</p>
                  <p className="text-[10px] opacity-70 font-medium">Configura la IA</p>
                </div>
              </button>
            </div>
          </nav>


          <div className="pt-6 border-t border-olive/10 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white/40 rounded-2xl border border-olive/5">
              <div className="w-8 h-8 rounded-full bg-olive/10 flex items-center justify-center">
                <User className="w-4 h-4 text-olive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-ink">Estudiante</p>
                <p className="text-[9px] opacity-60 uppercase tracking-tighter text-muted-ink">Sesión activa</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-ink text-center italic opacity-70">
              "La Verdad os hará libres."
            </p>
          </div>
        </aside>


        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col pt-4 md:pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full overflow-hidden"
            >
              <div className="h-full w-full max-w-5xl mx-auto p-4 md:p-8">
                {activeTab === 'chat' && (
                  <div className="h-full flex flex-col">
                     <BibleChat initialPrompt={initialPrompt} />
                  </div>
                )}
                {activeTab === 'voice' && <LiveVoice />}
                {activeTab === 'teachings' && (
                  <TeachingsView onSelect={handleSelectTeaching} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Info (Mobile/Small Desktop) */}
      <div className="absolute top-4 right-4 z-50">
        <button className="p-2 bg-white rounded-full border border-[#e5e0d8] shadow-sm text-[#5a5a40] hover:bg-[#f5f5f0] transition-colors">
          <Info className="w-4 h-4" />
        </button>
      </div>
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
        "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 text-left group",
        active 
          ? "bg-olive text-white shadow-lg shadow-olive/20" 
          : "hover:bg-white text-muted-ink"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg transition-colors",
        active ? "bg-white/20" : "bg-sidebar group-hover:bg-olive/10"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-bold text-sm leading-none mb-1">{label}</p>
        <p className={cn("text-[10px] opacity-70 font-medium", active ? "text-white" : "text-muted-ink")}>
          {desc}
        </p>
      </div>
    </button>
  );
}

