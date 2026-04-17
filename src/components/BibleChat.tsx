import React, { useState, useEffect, useRef } from 'react';
import { ai, SYSTEM_PROMPT } from '../lib/gemini';
import { GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, BookOpen, Search, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
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

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customInput) setInput('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })), { role: 'user', parts: [{ text: textToSend }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
        },
      });

      const modelText = response.text || "Lo siento, no pude procesar tu solicitud.";
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: modelText,
        groundingMetadata 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "Hubo un error al conectar con el Maestro. Por favor, intenta de nuevo." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white shadow-xl shadow-black/5 border border-olive/15 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-olive/15 bg-sidebar flex items-center gap-4">
        <div className="p-2.5 bg-olive rounded-xl shadow-sm">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-serif font-bold text-olive text-lg">Pregunta a la Palabra</h2>
          <p className="text-[10px] text-muted-ink font-bold uppercase tracking-widest opacity-80">Explora las Sagradas Escrituras</p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth bg-white"
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
              "flex flex-col max-w-[85%]",
              message.role === 'user' ? "ml-auto items-end" : "items-start"
            )}
          >
            <div 
              className={cn(
                "p-4 rounded-xl shadow-sm leading-relaxed",
                message.role === 'user' 
                  ? "bg-[#eeeae4] text-ink rounded-tr-none border border-olive/5" 
                  : "bg-paper border border-olive/15 text-ink rounded-tl-none"
              )}
            >
              <div className="prose prose-sm max-w-none prose-stone">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            </div>
            
            {message.groundingMetadata?.groundingChunks && (
              <div className="mt-3 space-y-1.5 px-1">
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

      {/* Input */}
      <div className="p-5 bg-sidebar border-t border-olive/15">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu pregunta sobre la Biblia..."
            className="w-full px-5 py-3.5 bg-white border border-olive/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive/10 font-sans text-sm shadow-inner placeholder:text-muted-ink/40"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 px-5 py-2 bg-olive text-white rounded-lg hover:bg-olive/90 disabled:opacity-50 transition-all font-bold text-sm shadow-md active:scale-95"
          >
            Consultar
          </button>
        </div>
      </div>
    </div>

  );
}
