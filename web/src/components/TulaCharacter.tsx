import React from 'react';
import { motion } from 'motion/react';
import tulaImg from '../assets/images/tula_official_1783345752037.jpg';

interface TulaCharacterProps {
  mood?: 'welcome' | 'thinking' | 'chat' | 'inline' | 'reading' | 'celebrating';
  className?: string;
  style?: React.CSSProperties;
}

export default function TulaCharacter({
  mood = 'welcome',
  className = '',
  style
}: TulaCharacterProps) {
  
  // Custom definitions for the stylized vector Tula face
  const renderVectorFace = (sizeClass: string) => (
    <svg viewBox="0 0 100 100" className={`${sizeClass} select-none overflow-visible`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Colors matching her new official design perfectly */}
        <linearGradient id="tulaPlumageNew" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="60%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="tulaShieldNew" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="tulaBeakNew" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="tulaVestNew" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
      </defs>

      {/* 1. Neck & Shoulders (bottom) */}
      <path d="M 32 68 C 34 82 38 98 38 100 L 62 100 C 62 98 66 82 68 68 Z" fill="url(#tulaPlumageNew)" />
      
      {/* 2. Explorer Vest collar details */}
      <path d="M 33 76 L 67 76 L 72 100 L 28 100 Z" fill="url(#tulaVestNew)" />
      {/* Left/Right vest collar flaps */}
      <path d="M 33 76 L 47 88 L 47 100 L 28 100 Z" fill="#374151" />
      <path d="M 67 76 L 53 88 L 53 100 L 72 100 Z" fill="#374151" />
      {/* Small zipper pull */}
      <rect x="49" y="86" width="2" height="8" rx="1" fill="#9ca3af" />
      {/* Veeduría Distrital white logo on her chest */}
      <circle cx="61.5" cy="91" r="3" fill="#FFFFFF" />
      <circle cx="61.5" cy="91" r="1.8" fill="none" stroke="#1f2937" strokeWidth="0.5" />
      <path d="M 61.5 89.8 L 61.5 91" stroke="#1f2937" strokeWidth="0.5" />

      {/* 3. Head plumage base */}
      <circle cx="50" cy="46" r="25" fill="url(#tulaPlumageNew)" />
      
      {/* 4. Soft rosy blushing cheeks for maximum cuteness */}
      <ellipse cx="33" cy="54" rx="6" ry="4.5" fill="#f43f5e" opacity="0.35" />
      <ellipse cx="67" cy="54" rx="6" ry="4.5" fill="#f43f5e" opacity="0.35" />

      {/* 5. Bright Red Frontal Shield (glossy and premium) */}
      <path d="M 43.5 22 C 45 15 55 15 56.5 22 C 58 28 56 36 50 41 C 44 36 42 28 43.5 22 Z" fill="url(#tulaShieldNew)" />
      {/* Glossy highlight line */}
      <path d="M 45.5 21 Q 48 18 50 20" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* 6. Eyes (Cheerfully animated, custom-tailored expression for header/badges!) */}
      {/* Left eye: wide open, sparkling, curious */}
      <circle cx="34" cy="42" r="6.5" fill="#1e293b" />
      {/* Dual starburst reflections */}
      <circle cx="32" cy="40" r="2.2" fill="#FFFFFF" />
      <circle cx="36.5" cy="44" r="1.1" fill="#FFFFFF" />
      {/* Upper eyelash */}
      <path d="M 26 41.5 Q 33 34 41 41.5" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M 28 37.5 L 25 35" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />

      {/* Right eye: highly stylized happy closed wink! */}
      <path d="M 58 44 Q 64.5 35.5 71 44" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 68 39.5 L 71 36.5" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 64 38.5 L 65 35" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />

      {/* 7. Yellow-Orange Parted beak (smiling and friendly!) */}
      {/* Upper part */}
      <path d="M 43.5 42 C 46 41 54 41 56.5 42 C 58 48 54 54 50 54 C 46 54 42 48 43.5 42 Z" fill="url(#tulaBeakNew)" />
      {/* Open inner mouth displaying a happy red tongue */}
      <path d="M 45.5 48 C 47 55 53 55 54.5 48 Z" fill="#991b1b" />
      <path d="M 47.5 50.5 Q 50 54 52.5 50.5" fill="#f43f5e" />
      {/* Soft overlay lines for 3D depth */}
      <path d="M 43.5 42 Q 50 40 56.5 42" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  );

  // 1. CHAT HEADER AVATAR (Interactive, highly-polished animated vector winking face!)
  if (mood === 'chat') {
    return (
      <div 
        className={`relative rounded-full bg-slate-50 border border-neutral-200 flex-shrink-0 shadow-sm group cursor-pointer transition-transform duration-300 hover:scale-105 ${className}`} 
        style={{ width: '40px', height: '40px', ...style }}
      >
        <div className="w-full h-full p-0.5 overflow-hidden rounded-full">
          {renderVectorFace("w-full h-full transform scale-110 origin-center translate-y-0.5")}
        </div>
        {/* Active green dot badge */}
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
      </div>
    );
  }

  // 2. INLINE MINI BADGE (Even smaller vector circle for inline feedback cards!)
  if (mood === 'inline') {
    return (
      <div 
        className={`relative rounded-full bg-slate-50 border border-neutral-200 inline-block align-middle flex-shrink-0 ${className}`}
        style={{ width: '28px', height: '28px', ...style }}
      >
        <div className="w-full h-full p-0.5 overflow-hidden rounded-full">
          {renderVectorFace("w-full h-full transform scale-110 origin-center translate-y-0.5")}
        </div>
      </div>
    );
  }

  // 3. THINKING / EMPTY STATE (Tula with floating animated question marks)
  if (mood === 'thinking') {
    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`} style={style}>
        {/* Floating animated question marks */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-12 pointer-events-none z-10">
          <motion.span 
            className="absolute text-xl font-bold text-teal-600 bg-white shadow-md rounded-full px-2 py-0.5 border border-teal-100"
            style={{ left: '20%', top: '20%' }}
            animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          >
            ?
          </motion.span>
          <motion.span 
            className="absolute text-sm font-bold text-amber-500 bg-white shadow-md rounded-full px-1.5 py-0.5 border border-amber-100"
            style={{ left: '75%', top: '0%' }}
            animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.5 }}
          >
            ?
          </motion.span>
          <motion.span 
            className="absolute text-lg font-bold text-rose-500 bg-white shadow-md rounded-full px-1.5 py-0.5 border border-rose-100"
            style={{ left: '50%', top: '-20%' }}
            animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 1 }}
          >
            ¿
          </motion.span>
        </div>

        {/* Mascot Wrapper - pure blending! */}
        <motion.div 
          className="relative"
          animate={{ scale: [1, 0.98, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          style={{ mixBlendMode: 'multiply' }}
        >
          <img 
            src={tulaImg} 
            alt="Tula Pensando" 
            className="h-44 w-auto object-contain"
          />
        </motion.div>
        
        {/* Cute floor shadow */}
        <div className="w-24 h-2 bg-neutral-900/10 rounded-full blur-[2px] mt-1" />
      </div>
    );
  }

  // 4. READING / DATA ANALYSIS (Tula inspecting)
  if (mood === 'reading') {
    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`} style={{ minHeight: '160px', ...style }}>
        {/* Mascot Body - with explicit mix-blend-mode to avoid rendering the white bounding box! */}
        <motion.div 
          className="relative"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
          style={{ mixBlendMode: 'multiply' }}
        >
          <img 
            src={tulaImg} 
            alt="Tula Analizando" 
            className="h-36 w-auto object-contain"
          />
        </motion.div>

        {/* Floor shadow */}
        <div className="w-20 h-2 bg-neutral-900/10 rounded-full blur-[2px] mt-1" />
      </div>
    );
  }

  // 5. CELEBRATING (High-energy jump, rotating, confetti particles)
  if (mood === 'celebrating') {
    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`} style={style}>
        {/* Floating Confetti dots */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
          {[
            { color: 'bg-teal-500', size: 'w-2 h-2', left: '20%', top: '20%', delay: 0 },
            { color: 'bg-amber-500', size: 'w-1.5 h-1.5', left: '80%', top: '30%', delay: 0.2 },
            { color: 'bg-rose-500', size: 'w-2 h-2', left: '70%', top: '10%', delay: 0.4 },
            { color: 'bg-emerald-500', size: 'w-1.5 h-1.5', left: '30%', top: '60%', delay: 0.1 },
            { color: 'bg-teal-400', size: 'w-2 h-2', left: '85%', top: '70%', delay: 0.5 },
          ].map((c, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${c.color} ${c.size}`}
              style={{ left: c.left, top: c.top }}
              animate={{
                y: [0, -25, 0],
                x: [0, Math.sin(i) * 15, 0],
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + Math.sin(i),
                ease: 'easeInOut',
                delay: c.delay
              }}
            />
          ))}
        </div>

        {/* Mascot Body with exciting jumping & tilting animation */}
        <motion.div 
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, -3, 3, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.8, 
            ease: 'easeInOut' 
          }}
          style={{ mixBlendMode: 'multiply' }}
        >
          <img 
            src={tulaImg} 
            alt="Tula Celebrando" 
            className="h-44 w-auto object-contain"
          />
        </motion.div>

        {/* Floor shadow scales based on jump */}
        <motion.div 
          className="h-1.5 bg-neutral-900/10 rounded-full blur-[2px] mt-1"
          style={{ width: '80px' }}
          animate={{ 
            width: ['80px', '50px', '80px'],
            opacity: [0.15, 0.05, 0.15]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.8, 
            ease: 'easeInOut' 
          }}
        />
      </div>
    );
  }

  // 6. DEFAULT FULL STANDING HERO / WELCOME (Main mascot with full-body and floating idle animation)
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`} style={style}>
      {/* Decorative premium radial ambient light detrás de Tula */}
      <div className="absolute inset-x-0 bottom-6 top-12 bg-gradient-to-tr from-teal-500/10 via-amber-500/5 to-transparent rounded-full filter blur-3xl pointer-events-none -z-10 scale-110" />

      {/* Dynamic interactive greeting bubble on hover */}
      <motion.div 
        className="absolute -top-6 right-2 bg-neutral-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none z-20 border border-neutral-800"
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        whileHover={{ opacity: 1, scale: 1, y: 0 }}
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          y: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
          opacity: { duration: 0.2 }
        }}
      >
        ✨ ¡Hazme clic para hablar!
      </motion.div>

      {/* Die-cut sticker outline container with organic squash & stretch breath */}
      <motion.div 
        className="relative cursor-pointer"
        animate={{ 
          y: [3, -5, 3],
          scaleY: [1, 1.015, 0.985, 1.012, 1],
          scaleX: [1, 0.985, 1.015, 0.988, 1],
          rotate: [-0.4, 0.4, -0.4, 0.2, -0.4]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 5.5, 
          ease: 'easeInOut' 
        }}
        whileHover={{ 
          scale: 1.03,
          rotate: [0, -1.5, 1.5, -1, 0],
          transition: { duration: 0.4 }
        }}
        whileTap={{ 
          scale: 0.96,
          rotate: -2,
          transition: { duration: 0.1 }
        }}
        style={{ 
          mixBlendMode: 'multiply',
          transformOrigin: 'bottom center'
        }}
      >
        <img 
          src={tulaImg} 
          alt="Tula la Tingua" 
          className="h-80 w-auto object-contain"
        />

        {/* NEW Precise glass reflection & lens sweep limited strictly to her magnifying glass lens area! */}
        <div 
          className="absolute overflow-hidden rounded-full pointer-events-none"
          style={{
            top: '20%',
            left: '26.8%',
            width: '13.8%',
            height: '13.8%',
            boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.35)',
          }}
        >
          {/* Internal gradient reflection glass depth */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/15 to-white/5"
            animate={{
              opacity: [0.7, 0.9, 0.7]
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut'
            }}
          />
          {/* Sliding lens sweep shine bar */}
          <motion.div 
            className="absolute w-[35%] h-[150%] bg-white/40 skew-x-20"
            style={{
              top: '-25%',
              left: '-60%',
              filter: 'blur(0.5px)',
            }}
            animate={{
              left: ['-60%', '130%'],
            }}
            transition={{
              repeat: Infinity,
              repeatDelay: 4,
              duration: 1.2,
              ease: 'easeInOut'
            }}
          />
        </div>
      </motion.div>

      {/* Soft natural floor shadow under her feet dynamically scaling with breath */}
      <motion.div 
        className="h-2.5 bg-neutral-900/10 rounded-full blur-[3.5px] mt-1.5"
        animate={{ 
          width: ['105px', '125px', '105px'],
          opacity: [0.12, 0.22, 0.12],
          scaleX: [0.92, 1.08, 0.92]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 5.5, 
          ease: 'easeInOut' 
        }}
      />
    </div>
  );
}

