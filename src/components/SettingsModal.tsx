import React, { useState, useEffect } from 'react';
import { X, Save, Key, Cpu, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
  { id: 'llama3-8b-8192', name: 'Llama 3 8B' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState<'gemini' | 'groq'>('gemini');
  const [groqKey, setGroqKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(GROQ_MODELS[0].id);

  useEffect(() => {
    const savedProvider = localStorage.getItem('llm_provider') as 'gemini' | 'groq';
    const savedKey = localStorage.getItem('groq_api_key');
    const savedModel = localStorage.getItem('groq_model');

    if (savedProvider) setProvider(savedProvider);
    if (savedKey) setGroqKey(savedKey);
    if (savedModel) setSelectedModel(savedModel);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('llm_provider', provider);
    localStorage.setItem('groq_api_key', groqKey.trim());
    localStorage.setItem('groq_model', selectedModel);
    onClose();
    // Trigger a refresh of the app if needed, or just let components React-ively handle it via state/prop updates if we were passing them down.
    // For now, since we're using localStorage, the components will pick it up on next use.
    window.dispatchEvent(new Event('llm_settings_changed'));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-olive/10 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-olive" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-olive italic">Ajustes</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-olive/10 rounded-full transition-colors text-muted-ink/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 space-y-10">
            {/* Provider Selection */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-ink opacity-40 ml-1">Motor de Sabiduría</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-paper/50 border border-olive/5 rounded-2xl">
                <button 
                  onClick={() => setProvider('gemini')}
                  className={cn(
                    "py-3 rounded-xl text-xs font-bold transition-all",
                    provider === 'gemini' ? "bg-white text-olive shadow-sm" : "text-muted-ink/50 hover:text-muted-ink"
                  )}
                >
                  Google Gemini
                </button>
                <button 
                  onClick={() => setProvider('groq')}
                  className={cn(
                    "py-3 rounded-xl text-xs font-bold transition-all",
                    provider === 'groq' ? "bg-white text-olive shadow-sm" : "text-muted-ink/50 hover:text-muted-ink"
                  )}
                >
                  Groq Cloud
                </button>
              </div>
            </div>

            {/* Groq Settings */}
            <AnimatePresence>
              {provider === 'groq' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-8 overflow-hidden"
                >
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-ink opacity-40 ml-1">
                      <Key className="w-3.5 h-3.5" /> Clave Secreta
                    </label>
                    <input 
                      type="password"
                      value={groqKey}
                      onChange={e => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full px-5 py-4 bg-paper/50 border border-olive/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-olive/5 text-sm font-mono placeholder:text-muted-ink/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-ink opacity-40 ml-1">
                      <Cpu className="w-3.5 h-3.5" /> Modelo Seleccionado
                    </label>
                    <select 
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      className="w-full px-5 py-4 bg-paper/50 border border-olive/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-olive/5 text-sm appearance-none cursor-pointer text-muted-ink"
                    >
                      {GROQ_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-4">
              <button 
                onClick={handleSave}
                className="w-full py-5 bg-olive text-white rounded-[24px] font-bold text-xs uppercase tracking-widest shadow-2xl shadow-olive/20 hover:bg-olive/90 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
