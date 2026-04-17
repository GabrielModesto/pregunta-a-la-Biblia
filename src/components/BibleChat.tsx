import React, { useState, useEffect, useRef } from 'react';
import { ai, SYSTEM_PROMPT } from '../lib/gemini';
import Groq from 'groq-sdk';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Loader2, 
  BookOpen, 
  Book,
  Search, 
  ExternalLink, 
  Cpu, 
  Share2, 
  Twitter, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Check,
  Copy,
  Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model' | 'assistant';
  text: string;
  groundingMetadata?: any;
}

interface BibleChatProps {
  initialPrompt?: string | null;
}

export function BibleChat({ initialPrompt }: BibleChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [provider, setProvider] = useState<'gemini' | 'groq'>('gemini');
  const [groqKey, setGroqKey] = useState<string | null>(null);
  const [groqModel, setGroqModel] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showShareFor, setShowShareFor] = useState<number | null>(null);

  const loadSettings = () => {
    setProvider((localStorage.getItem('llm_provider') as 'gemini' | 'groq') || 'gemini');
    setGroqKey(localStorage.getItem('groq_api_key'));
    setGroqModel(localStorage.getItem('groq_model'));
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('llm_settings_changed', loadSettings);
    return () => window.removeEventListener('llm_settings_changed', loadSettings);
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDailyReadings = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    });
    
    const prompt = `Por favor, muéstrame las lecturas de la misa de hoy, ${dateStr}, según el calendario litúrgico de la Iglesia Católica Romana. 
    Incluye:
    1. Primera Lectura (y segunda si corresponde).
    2. Salmo Responsorial.
    3. Evangelio del día.
    
    Para el Evangelio, incluye el texto (o un resumen fiel) y termina con una pequeña meditación personal que nos deje una enseñanza práctica para nuestra vida hoy.`;
    
    handleSend(prompt);
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customInput) setInput('');
    setIsLoading(true);

    try {
      if (provider === 'groq') {
        if (!groqKey) {
          throw new Error("GROQ_API_KEY_MISSING");
        }
        
        const groq = new Groq({ apiKey: groqKey, dangerouslyAllowBrowser: true });
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({
              role: m.role === 'model' ? 'assistant' as const : m.role as 'user' | 'assistant',
              content: m.text
            })),
            { role: 'user', content: textToSend }
          ],
          model: groqModel || 'llama-3.3-70b-versatile',
        });

        const modelText = chatCompletion.choices[0]?.message?.content || "No se recibió respuesta de Groq.";
        
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: modelText
        }]);
      } else {
        // Gemini
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [...messages.map(m => ({
            role: m.role === 'assistant' ? 'model' as const : (m.role as 'user' | 'model'),
            parts: [{ text: m.text }]
          })), { role: 'user', parts: [{ text: textToSend }] }],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: [{ googleSearch: {} }],
          },
        });

        const modelText = response.text || "Lo siento, no pude encontrar una respuesta clara en este momento.";
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

        setMessages(prev => [...prev, { 
          role: 'model', 
          text: modelText,
          groundingMetadata 
        }]);
      }
    } catch (error: any) {
      console.error("Error in BibleChat:", error);
      let errorMessage = "Hubo un problema al consultar la sabiduría bíblica. Por favor, intenta de nuevo en unos momentos.";
      
      if (error.message === "GROQ_API_KEY_MISSING") {
        errorMessage = "Falta la API Key de Groq. Por favor, configúrala en el menú de Ajustes.";
      } else if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorMessage = "El Maestro está atendiendo a muchas personas ahora mismo (límite de cuota). Por favor, espera unos segundos y vuelve a preguntar.";
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareActions = [
    { 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: 'bg-[#25D366]',
      action: (text: string) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    },
    { 
      name: 'X', 
      icon: Twitter, 
      color: 'bg-black',
      action: (text: string) => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
    },
    { 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'bg-[#1877F2]',
      action: (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        alert("¡Texto copiado! Abre Facebook y pega tu meditación para compartirla.");
        window.open('https://www.facebook.com/', '_blank');
      }
    },
    { 
      name: 'Instagram', 
      icon: Instagram, 
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
      action: (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        alert("¡Texto copiado para Instagram! Compártelo en tus historias o publicaciones.");
        window.open('https://www.instagram.com/', '_blank');
      }
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-paper relative overflow-hidden">
      {/* Search-style Input at the Top */}
      <div className="pt-8 pb-4 flex flex-col gap-6 flex-shrink-0 z-20">
        <header className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center shadow-lg shadow-olive/20">
              <Book className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-olive italic">Lumen</h1>
          </div>
          
          <button 
            onClick={handleDailyReadings}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-olive/5 border border-olive/10 rounded-full text-olive hover:bg-olive/10 transition-all font-bold text-[11px] uppercase tracking-widest disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lecturas</span>
          </button>
        </header>

        <div className="relative group">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="¿Qué buscas en la Palabra?..."
            className="w-full px-6 py-5 bg-white border border-olive/10 rounded-[32px] focus:outline-none focus:ring-4 focus:ring-olive/5 font-sans text-lg shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] transition-all placeholder:text-muted-ink/30 resize-none min-h-[64px] max-h-40"
            rows={1}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-3 p-3 bg-olive text-white rounded-full hover:bg-olive/90 disabled:opacity-10 transition-all shadow-xl shadow-olive/10 active:scale-95"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Results area - Clean and integrated */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-12 pb-24 px-2 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="py-20 flex flex-col items-center text-center space-y-4 opacity-40">
            <Search className="w-12 h-12 text-olive/50" />
            <p className="font-serif italic text-lg text-muted-ink uppercase tracking-widest">Inicia tu reflexión</p>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className="space-y-4"
          >
            {message.role === 'user' ? (
              <div className="flex items-center gap-3 border-l-2 border-olive/10 pl-6">
                <p className="text-muted-ink font-bold text-sm uppercase tracking-widest opacity-40">Tú preguntaste</p>
                <div className="flex-1 h-px bg-olive/5" />
              </div>
            ) : null}

            <div className={cn(
              "relative",
              message.role === 'user' ? "pl-6" : "pl-0"
            )}>
              <div className={cn(
                "prose max-w-none leading-relaxed",
                message.role === 'user' ? "text-muted-ink font-medium" : "text-ink"
              )}>
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>

              {message.role !== 'user' && (
                <div className="mt-8 flex items-center gap-4 border-t border-olive/5 pt-6">
                  <button 
                    onClick={() => handleCopy(message.text, idx)}
                    className="flex items-center gap-2 p-2 px-4 bg-sidebar/50 rounded-full text-olive hover:bg-olive hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                  >
                    {copiedId === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === idx ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button 
                    onClick={() => setShowShareFor(showShareFor === idx ? null : idx)}
                    className={cn(
                      "flex items-center gap-2 p-2 px-4 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest",
                      showShareFor === idx ? "bg-olive text-white shadow-lg shadow-olive/20" : "bg-sidebar/50 text-olive hover:bg-paper"
                    )}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartir</span>
                  </button>
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {showShareFor === idx && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {shareActions.map((social) => (
                    <button
                      key={social.name}
                      onClick={() => social.action(message.text, idx)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-white text-[10px] font-bold shadow-sm transition-all active:scale-95",
                        social.color
                      )}
                    >
                      <social.icon className="w-3.5 h-3.5" />
                      {social.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-4 text-olive animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-serif italic text-lg">Invocando sabiduría...</span>
          </div>
        )}
      </div>
    </div>
  );
}
