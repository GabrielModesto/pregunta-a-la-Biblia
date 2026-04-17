import React, { useState, useEffect, useRef } from 'react';
import { ai, SYSTEM_PROMPT } from '../lib/gemini';
import Groq from 'groq-sdk';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Loader2, 
  BookOpen, 
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
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white shadow-xl shadow-black/5 border border-olive/15 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-olive/15 bg-sidebar flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-olive rounded-xl shadow-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-olive text-lg">Pregunta a la Palabra</h2>
            <p className="text-[10px] text-muted-ink font-bold uppercase tracking-widest opacity-80">Explora las Sagradas Escrituras</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDailyReadings}
            disabled={isLoading}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-olive/5 border border-olive/20 rounded-xl text-olive hover:bg-olive/10 transition-all font-bold text-[11px] uppercase tracking-wider group shadow-sm disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            <span>Lecturas de hoy</span>
          </button>

          {provider === 'groq' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-earth/10 rounded-full border border-earth/20">
              <Cpu className="w-3.5 h-3.5 text-earth" />
              <span className="text-[10px] font-bold text-earth uppercase tracking-widest">{groqModel?.split('-')[0] || 'Groq'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-10 scroll-smooth bg-white"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-5">
            <div className="p-5 bg-paper border border-olive/15 rounded-full shadow-inner">
              <Search className="w-8 h-8 text-olive opacity-40" />
            </div>
            <div className="max-w-xs">
              <h3 className="font-serif text-xl font-bold text-olive">¿Qué deseas saber hoy?</h3>
              <p className="text-sm text-muted-ink leading-relaxed">Soy tu guía espiritual digital. Puedes preguntarme sobre cualquier libro, parábola o enseñanza.</p>
            </div>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex flex-col max-w-[90%]",
              message.role === 'user' ? "ml-auto items-end" : "items-start"
            )}
          >
            <div 
              className={cn(
                "p-4 md:p-5 rounded-2xl shadow-sm leading-relaxed relative group break-words overflow-hidden",
                message.role === 'user' 
                  ? "bg-[#eeeae4] text-ink rounded-tr-none border border-olive/5" 
                  : "bg-paper border border-olive/15 text-ink rounded-tl-none"
              )}
            >
              <div className="prose prose-sm max-w-none prose-stone break-words">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>

              {message.role !== 'user' && (
                <div className="absolute -bottom-8 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleCopy(message.text, idx)}
                    className="p-1.5 bg-white border border-olive/10 rounded-lg text-olive hover:bg-paper transition-colors shadow-sm"
                    title="Copiar texto"
                  >
                    {copiedId === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button 
                    onClick={() => setShowShareFor(showShareFor === idx ? null : idx)}
                    className={cn(
                      "p-1.5 border rounded-lg transition-all shadow-sm flex items-center gap-2",
                      showShareFor === idx ? "bg-olive text-white border-olive" : "bg-white border-olive/10 text-olive hover:bg-paper"
                    )}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {showShareFor === idx && <span className="text-[10px] font-bold font-sans">Compartir</span>}
                  </button>
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {showShareFor === idx && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-10 flex flex-wrap gap-2 px-1"
                >
                  {shareActions.map((social) => (
                    <button
                      key={social.name}
                      onClick={() => social.action(message.text, idx)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-[10px] font-bold shadow-sm hover:scale-105 transition-transform active:scale-95",
                        social.color
                      )}
                    >
                      <social.icon className="w-3 h-3" />
                      {social.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            {message.groundingMetadata?.groundingChunks && (
              <div className="mt-4 space-y-1.5 px-1">
                <p className="text-[9px] font-bold text-muted-ink uppercase tracking-wider opacity-60">Fuentes Consultadas:</p>
                <div className="flex flex-wrap gap-2">
                  {message.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                    chunk.web && (
                      <a 
                        key={i}
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[9px] font-bold bg-sidebar border border-olive/15 px-2.5 py-1 rounded-full text-olive hover:bg-paper transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        {chunk.web.title || "Referencia"}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-muted-ink text-sm font-medium italic animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-olive" />
            Consultando las escrituras...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 bg-sidebar border-t border-olive/15">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu pregunta sobre la Biblia..."
              className="w-full px-5 py-4 bg-white border border-olive/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-olive/10 font-sans text-sm shadow-inner placeholder:text-muted-ink/40 resize-none overflow-y-auto min-h-[56px] max-h-48 transition-all"
              rows={Math.min(5, input.split('\n').length || 1)}
            />
          </div>
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-6 h-[56px] bg-olive text-white rounded-2xl hover:bg-olive/90 disabled:opacity-50 transition-all font-bold text-sm shadow-xl shadow-olive/10 active:scale-95 whitespace-nowrap flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Consultar</span>
          </button>
        </div>
        <p className="mt-2 text-[9px] text-center text-muted-ink opacity-50 font-medium italic">
          Presiona Enter para consultar, Shift + Enter para nueva línea.
        </p>
      </div>
    </div>
  );
}
