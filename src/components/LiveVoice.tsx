import React, { useState, useEffect, useRef } from 'react';
import { ai, SYSTEM_PROMPT } from '../lib/gemini';
import { Mic, MicOff, PhoneOff, Volume2, AudioLines, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Modality } from "@google/genai";

export function LiveVoice() {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [transcription, setTranscription] = useState<string>("");
  
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);
  const session = useRef<any>(null);
  const nextStartTime = useRef<number>(0);

  const startLive = async () => {
    if (status === 'connecting' || status === 'active') return;
    
    try {
      setStatus('connecting');
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setStatus('active');
            setIsActive(true);
            nextStartTime.current = audioContext.current?.currentTime || 0;
            
            source.current = audioContext.current!.createMediaStreamSource(mediaStream.current!);
            processor.current = audioContext.current!.createScriptProcessor(4096, 1, 1);
            
            processor.current.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert to 16bit PCM
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              
              sessionPromise.then((s) => {
                s.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.current.connect(processor.current);
            processor.current.connect(audioContext.current!.destination);
          },
          onmessage: async (message: any) => {
            // Handle audio output
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  playAudio(part.inlineData.data);
                }
                if (part.text) {
                  setTranscription(prev => (prev.length > 300 ? prev.slice(-200) : prev) + " " + part.text);
                }
              }
            }
          },
          onerror: (err) => {
            console.error(err);
            setStatus('error');
          },
          onclose: () => {
            stopLive();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_PROMPT + " Estás en una conversación de voz. Habla con una voz masculina clara y en español neutral. Sé breve.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
        }
      });
      
      session.current = await sessionPromise;
    } catch (error) {
      console.error(error);
      setStatus('error');
      setIsActive(false);
    }
  };

  const playAudio = (base64Data: string) => {
    if (!audioContext.current) return;
    
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }
    
    // Output rate for Gemini is 24000Hz
    const buffer = audioContext.current.createBuffer(1, floatData.length, 24000);
    buffer.copyToChannel(floatData, 0);

    const audioSource = audioContext.current.createBufferSource();
    audioSource.buffer = buffer;
    audioSource.connect(audioContext.current.destination);
    
    const now = audioContext.current.currentTime;
    if (nextStartTime.current < now) {
      nextStartTime.current = now;
    }
    
    audioSource.start(nextStartTime.current);
    nextStartTime.current += buffer.duration;
  };

  const stopLive = () => {
    setIsActive(false);
    setStatus('idle');
    if (processor.current) processor.current.disconnect();
    if (source.current) source.current.disconnect();
    if (mediaStream.current) mediaStream.current.getTracks().forEach(t => t.stop());
    if (audioContext.current) audioContext.current.close().catch(() => {});
    if (session.current) session.current.close().catch(() => {});
    setTranscription("");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="font-serif text-4xl font-bold text-olive">Preguntas a la Biblia Católica</h2>
        <p className="text-muted-ink max-w-md mx-auto leading-relaxed">
          Conversa con el Maestro por voz. Escucha reflexiones y enseñanzas de manera clara y natural.
        </p>
      </div>


      <div className="relative">
        {/* Visualizer Circle */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
          <AnimatePresence>
            {isActive && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-olive opacity-5 rounded-full"
              />
            )}
          </AnimatePresence>
          
          <div className={cn(
            "w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl z-10",
            isActive ? "bg-olive scale-105 md:scale-110 shadow-olive/20" : "bg-white border-2 border-olive/15 "
          )}>
            {isActive ? (
              <AudioLines className="w-12 h-12 md:w-16 md:h-16 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 md:w-16 md:h-16 text-olive/40" />
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 bg-white border border-olive/15 rounded-full shadow-md flex items-center gap-2.5 whitespace-nowrap">
          <div className={cn("w-2 h-2 rounded-full", 
            status === 'active' ? "bg-green-500 animate-pulse" : 
            status === 'connecting' ? "bg-amber-400" : 
            status === 'error' ? "bg-red-500" : "bg-gray-300"
          )} />
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-ink">
            {status === 'active' ? "En vivo" : 
             status === 'connecting' ? "Conectando..." : 
             status === 'error' ? "Error de conexión" : "Desconectado"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {!isActive ? (
          <button 
            onClick={startLive}
            className="flex items-center gap-3 px-10 py-4 bg-olive text-white rounded-2xl shadow-xl shadow-olive/10 hover:bg-olive/90 transform hover:-translate-y-1 transition-all font-bold"
          >
            <Mic className="w-5 h-5" />
            Iniciar Conversación
          </button>
        ) : (
          <>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-4 rounded-xl shadow-sm transition-all border",
                isMuted ? "bg-red-50 text-red-600 border-red-100" : "bg-white border-olive/15 text-olive"
              )}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </button>
            <button 
              onClick={stopLive}
              className="px-10 py-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 font-bold flex items-center gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              Finalizar
            </button>
          </>
        )}
      </div>

      {/* Transcription Preview */}
      <AnimatePresence>
        {status === 'active' && transcription && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-sidebar p-5 rounded-2xl border border-olive/15 text-sm italic text-muted-ink text-center shadow-inner"
          >
            "{transcription.slice(-120)}..."
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-2.5 max-w-xs text-[11px] text-muted-ink opacity-60 italic text-center leading-relaxed">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-olive" />
        <p>Asegúrate de estar en un lugar tranquilo. El Maestro te responderá con sabiduría en tiempo real.</p>
      </div>
    </div>

  );
}
