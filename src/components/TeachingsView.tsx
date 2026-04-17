import React from 'react';
import { BookMarked, Sparkles, Heart, Compass, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const TEACHINGS = [
  {
    title: "El Hijo Pródigo",
    ref: "Lucas 15:11-32",
    theme: "Arrepentimiento y Perdón",
    icon: Heart,
    color: "bg-red-50 text-red-600 border-red-100",
    desc: "Aprende sobre el amor incondicional y la capacidad de Dios para recibirnos siempre de vuelta."
  },
  {
    title: "El Buen Samaritano",
    ref: "Lucas 10:25-37",
    theme: "El Amor al Prójimo",
    icon: Compass,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    desc: "Quién es realmente nuestro prójimo y cómo la compasión rompe barreras sociales."
  },
  {
    title: "La Oveja Perdida",
    ref: "Mateo 18:12-14",
    theme: "El Cuidado Individual",
    icon: ShieldCheck,
    color: "bg-green-50 text-green-600 border-green-100",
    desc: "Reflexiona sobre cómo cada persona es valiosa a los ojos de Dios y ningúna es olvidada."
  },
  {
    title: "El Sembrador",
    ref: "Marcos 4:1-20",
    theme: "Receptividad Espiritual",
    icon: Sparkles,
    color: "bg-amber-50 text-amber-600 border-amber-100",
    desc: "Las diferentes formas en que recibimos la palabra y cómo cultivar un corazón fértil."
  }
];

interface TeachingsViewProps {
  onSelect: (topic: string) => void;
}

export function TeachingsView({ onSelect }: TeachingsViewProps) {
  return (
    <div className="h-full space-y-16 pb-32">
      <div className="space-y-3">
        <h2 className="font-serif text-5xl font-bold text-olive italic leading-tight">Piedras Angulares</h2>
        <p className="text-lg text-muted-ink leading-relaxed max-w-md font-serif italic">Sabiduría profunda para iluminar tu camino diario.</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {TEACHINGS.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => onSelect(`Cuéntame sobre la enseñanza de ${item.title} (${item.ref}) y qué consejos prácticos me da para mi vida actual.`)}
            className="group flex flex-col text-left space-y-6"
          >
            <div className="flex items-center gap-6">
              <div className={cn("p-5 rounded-[22px] shadow-sm transform transition-transform group-hover:scale-105 group-hover:shadow-md", item.color)}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth opacity-60">{item.theme}</p>
                <h3 className="font-serif text-3xl font-bold text-olive">{item.title}</h3>
              </div>
            </div>
            <p className="text-lg text-muted-ink leading-relaxed font-serif italic pl-20">{item.desc}</p>
            <div className="pl-20 flex items-center gap-2 text-[11px] font-bold text-muted-ink/40 uppercase tracking-widest">
              <div className="w-4 h-px bg-olive/10" />
              <span>{item.ref}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="relative group p-12 bg-white rounded-[40px] border border-olive/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-olive/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="space-y-6 relative z-10 text-center max-w-sm mx-auto">
          <BookMarked className="w-10 h-10 text-olive mx-auto opacity-30" />
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-olive">Reflexión Diaria</h3>
            <p className="text-xl font-serif italic text-muted-ink leading-relaxed">
              "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."
            </p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-olive/40">— Salmo 119:105</p>
          </div>
          <button 
            onClick={() => onSelect("Dáme una reflexión bíblica para hoy basada en los Salmos.")}
            className="w-full py-4 bg-olive text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl shadow-olive/10 hover:bg-olive/90 transition-all active:scale-95"
          >
            Inspirame hoy
          </button>
        </div>
      </div>
    </div>
  );
}
