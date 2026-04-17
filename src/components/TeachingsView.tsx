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
    <div className="h-full p-4 overflow-y-auto space-y-10">
      <div className="space-y-2">
        <h2 className="font-serif text-4xl font-bold text-olive">Piedras Angulares</h2>
        <p className="text-sm text-muted-ink leading-relaxed max-w-lg">Encuentra sabiduría en las enseñanzas más profundas de Jesús para guiarnos en el día a día.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEACHINGS.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => onSelect(`Cuéntame sobre la enseñanza de ${item.title} (${item.ref}) y qué consejos prácticos me da para mi vida actual.`)}
            className="flex flex-col p-8 bg-white border border-olive/15 rounded-3xl hover:border-olive hover:shadow-2xl transition-all text-left group"
          >
            <div className={cn("p-4 rounded-2xl w-fit mb-5 transition-transform group-hover:scale-110 shadow-sm", item.color)}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-earth">{item.theme}</p>
              <h3 className="font-serif text-2xl font-bold text-olive">{item.title}</h3>
            </div>
            <p className="text-sm text-muted-ink leading-relaxed flex-1">{item.desc}</p>
            <div className="mt-6 pt-5 border-t border-olive/10 text-[10px] font-mono text-muted-ink opacity-60">
              {item.ref}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-olive text-white p-10 rounded-3xl space-y-5 shadow-2xl shadow-olive/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <BookMarked className="w-10 h-10 opacity-40" />
        <div className="space-y-2 relative z-10">
          <h3 className="font-serif text-2xl font-bold">Inspiración Diaria</h3>
          <p className="text-base font-serif italic opacity-90 leading-relaxed max-w-md">
            "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."
          </p>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">— Salmo 119:105</p>
        </div>
        <button 
          onClick={() => onSelect("Dáme una reflexión bíblica para hoy basada en los Salmos.")}
          className="relative z-10 px-8 py-3 bg-white text-olive rounded-xl text-sm font-bold shadow-xl hover:bg-paper transition-all active:scale-95"
        >
          Obtener reflexión
        </button>
      </div>
    </div>

  );
}
