import React, { useState, useEffect, useRef } from 'react';
import { SYSTEM_PROMPT } from '../lib/gemini';
import Groq from 'groq-sdk';
import { Mic, MicOff, PhoneOff, AudioLines, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function LiveVoice() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [responseText, setResponseText] = useState<string>("");
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscription(text);
        processIntent(text);
      };

      recognitionRef.current.onend = () => {
        if (isActive && !isLoading) {
          // Restart recognition if still active and not waiting for AI
          // However, we usually wait for AI response before listening again
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        stopLive();
      };
    }

    return () => {
      stopLive();
    };
  }, []);

  const getGoogleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Prefer Google natural voices in Spanish
    const googleVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.startsWith('es'));
    return googleVoice || voices.find(v => v.lang.startsWith('es'));
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getGoogleVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (isActive) {
        // Ready to listen again after speaking if desired, 
        // but for this simple loop we start listening manually or automatically
        recognitionRef.current?.start();
      }
    };

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const processIntent = async (text: string) => {
    setIsLoading(true);
    try {
      const currentGroqKey = localStorage.getItem('groq_api_key')?.trim();
      const currentModel = localStorage.getItem('groq_model') || 'llama-3.3-70b-versatile';

      if (!currentGroqKey) {
        setResponseText("Por favor, configura tu API Key de Groq en los ajustes.");
        speak("Por favor, configura tu clave de API en los ajustes para que pueda escucharte.");
        setIsLoading(false);
        return;
      }

      const groq = new Groq({ apiKey: currentGroqKey, dangerouslyAllowBrowser: true });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + " Estás en una conversación de voz. Sé breve, cálido y directo. No uses formatos de texto complejos como negritas o listas largas." },
          { role: 'user', content: text }
        ],
        model: currentModel,
        temperature: 0.7,
      });

      const aiResponse = chatCompletion.choices?.[0]?.message?.content || "No pude entender tu mensaje claramente.";
      setResponseText(aiResponse);
      speak(aiResponse);
    } catch (error) {
      console.error("Error en procesamiento de voz:", error);
      setResponseText("Lo siento, hubo un error al procesar tu sabiduría.");
      speak("Lo siento, tuve un problema al conectarme con los cielos digitales.");
    } finally {
      setIsLoading(false);
    }
  };

  const startLive = () => {
    setIsActive(true);
    setTranscription("");
    setResponseText("");
    recognitionRef.current?.start();
  };

  const stopLive = () => {
    setIsActive(false);
    setIsLoading(false);
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-16 pb-32">
      <div className="text-center space-y-3">
        <h2 className="font-serif text-5xl font-bold text-olive italic leading-tight">Voz de Fe</h2>
        <p className="text-lg text-muted-ink leading-relaxed max-w-xs mx-auto font-serif italic">Conversa con Lumen. Escucha la sabiduría con voces naturales.</p>
      </div>

      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {isActive && (
            <>
              <motion.div 
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 border-2 border-olive/10 rounded-full"
              />
              <motion.div 
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 2.8, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 border-2 border-olive/5 rounded-full"
              />
            </>
          )}
        </AnimatePresence>

        <button
          onClick={isActive ? stopLive : startLive}
          disabled={isLoading}
          className={cn(
            "relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-700 shadow-2xl",
            isActive 
              ? "bg-olive text-white scale-105" 
              : "bg-white text-olive hover:shadow-olive/10 group"
          )}
        >
          <div className={cn(
            "p-6 rounded-3xl transition-all duration-500",
            isActive ? "bg-white/20" : "bg-olive/5 group-hover:bg-olive/10"
          )}>
            {isLoading ? (
               <Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
            ) : isActive ? (
               <AudioLines className="w-8 h-8 md:w-12 md:h-12 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8 md:w-12 md:h-12" />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            {isLoading ? 'Escuchando...' : isActive ? 'En vivo' : 'Pulsa para hablar'}
          </span>
        </button>
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-paper border border-olive/10 rounded-2xl text-center"
            >
              <p className="text-sm text-muted-ink italic">Tú: "{transcription}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {responseText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-sidebar/50 backdrop-blur-sm border border-olive/5 rounded-[40px] text-center shadow-inner"
            >
              <p className="text-xl font-serif italic text-olive leading-relaxed">
                {responseText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 text-muted-ink text-[11px] font-bold uppercase tracking-widest opacity-40 italic">
        <Info className="w-4 h-4" />
        <span>Usa Chrome o Edge para mejores voces naturales</span>
      </div>
    </div>
  );
}
