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
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-16 pb-32">
      <div className="text-center space-y-3">
        <h2 className="font-serif text-5xl font-bold text-olive italic leading-tight">Voz de Fe</h2>
        <p className="text-lg text-muted-ink leading-relaxed max-w-xs mx-auto font-serif italic text-balance">Habla con el Maestro por voz. Escucha reflexiones y enseñanzas de manera clara.</p>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Animated background rings */}
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
          disabled={status === 'connecting'}
          className={cn(
            "relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-700 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]",
            isActive 
              ? "bg-olive text-white scale-105 shadow-olive/30" 
              : "bg-white text-olive hover:shadow-olive/10 group"
          )}
        >
          <div className={cn(
            "p-6 rounded-3xl transition-all duration-500",
            isActive ? "bg-white/20" : "bg-olive/5 group-hover:bg-olive/10"
          )}>
            {isActive ? (
               <AudioLines className="w-8 h-8 md:w-12 md:h-12 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8 md:w-12 md:h-12" />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            {isActive ? 'En vivo' : 'Pulsa para hablar'}
          </span>
        </button>
      </div>

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {isActive && transcription && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 bg-sidebar/50 backdrop-blur-sm border border-olive/5 rounded-[40px] text-center shadow-inner"
            >
              <p className="text-xl font-serif italic text-olive leading-relaxed">
                "{transcription.slice(-150)}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isActive && (
          <div className="text-center space-y-4 opacity-40">
            <div className="flex justify-center gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-olive/30" />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-ink">Listo para conversar</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-muted-ink text-[11px] font-bold uppercase tracking-widest opacity-40 italic">
        <Info className="w-4 h-4" />
        <span>Busca un lugar en paz</span>
      </div>
    </div>
  );
}
