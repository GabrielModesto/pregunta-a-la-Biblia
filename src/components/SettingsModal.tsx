import React, { useState, useEffect } from 'react';
import { X, Save, Key, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Versátil)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instantáneo)' },
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
    localStorage.setItem('groq_api_key', groqKey);
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
          className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-olive/15 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-olive/10 flex items-center justify-between bg-sidebar">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-olive rounded-xl text-white">
                <Save className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-xl font-bold text-olive">Configuración de IA</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-olive/10 rounded-full transition-colors text-muted-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Provider Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-ink opacity-60">Proveedor de Inteligencia</label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-paper rounded-2xl border border-olive/10">
                <button 
                  onClick={() => setProvider('gemini')}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-bold transition-all",
                    provider === 'gemini' ? "bg-white text-olive shadow-sm border border-olive/10" : "text-muted-ink opacity-70 hover:opacity-100"
                  )}
                >
                  Google Gemini (Default)
                </button>
                <button 
                  onClick={() => setProvider('groq')}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-bold transition-all",
                    provider === 'groq' ? "bg-white text-olive shadow-sm border border-olive/10" : "text-muted-ink opacity-70 hover:opacity-100"
                  )}
                >
                  Groq (LLama/Mixtral)
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
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-ink opacity-60">
                      <Key className="w-3 h-3" /> API Key de Groq
                    </label>
                    <input 
                      type="password"
                      value={groqKey}
                      onChange={e => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full px-4 py-3 bg-paper border border-olive/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive/10 text-sm font-mono"
                    />
                    <p className="text-[10px] text-muted-ink opacity-60 italic">Se guarda localmente en tu navegador.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-ink opacity-60">
                      <Cpu className="w-3 h-3" /> Modelo de Groq
                    </label>
                    <select 
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                      className="w-full px-4 py-3 bg-paper border border-olive/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive/10 text-sm appearance-none cursor-pointer"
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
                className="w-full py-4 bg-olive text-white rounded-2xl font-bold text-sm shadow-xl shadow-olive/20 hover:bg-olive/90 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Configuración
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
