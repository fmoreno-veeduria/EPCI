import type { ViewType } from '../types';

const HREF: Record<string, string> = { welcome: '/', aula: '/aprende', explore: '/explora' };

// Cabecera común: enlaces entre la portada y los dos módulos independientes.
export default function Header({ view }: { view: ViewType }) {
  return (
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-neutral-900 px-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-teal-600 flex items-center justify-center font-bold font-serif text-sm text-white shadow-inner">
            E
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 leading-none mb-1">
              EPCI 2025 · Encuesta Distrital
            </div>
            <div className="font-serif text-sm font-bold leading-none tracking-tight">
              CONFIANZA CIUDADANA
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 md:gap-1.5 max-w-[58vw] overflow-x-auto bg-neutral-800/60 rounded-full p-1 border border-neutral-800">
          <a href={HREF['welcome']}
            className={`cursor-pointer rounded-full px-3 md:px-5 py-2 text-xs whitespace-nowrap font-semibold tracking-wide transition-all ${
              view === 'welcome'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            Inicio
          </a>
          <a href={HREF['aula']}
            className={`cursor-pointer rounded-full px-3 md:px-5 py-2 text-xs whitespace-nowrap font-semibold tracking-wide transition-all ${
              view === 'aula'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            Aprende con Tula
          </a>
          <a href={HREF['explore']}
            className={`cursor-pointer rounded-full px-3 md:px-5 py-2 text-xs whitespace-nowrap font-semibold tracking-wide transition-all ${
              view === 'explore'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            Explora la encuesta
          </a>
        </nav>

        {/* Veeduría Logo & Email block */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] font-bold text-neutral-200">Veeduría Distrital</span>
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">BOGOTÁ D.C.</span>
          </div>
          <div className="h-8 w-[1px] bg-neutral-800 hidden sm:block" />
          <div className="h-9 w-9 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
            VD
          </div>
        </div>
      </header>
  );
}
