'use client';

import { AnimatePresence, motion } from 'framer-motion';

export interface FxEvent {
  id: number;
  key: string;
  emoji: string;
  mine: boolean; // true if I triggered it, false if partner
  actorName?: string;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Full-screen emotion effect played for both partners (sender immediately, receiver via SSE). */
export function EmotionFX({ fx, onDone }: { fx: FxEvent | null; onDone: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[170] overflow-hidden">
      <AnimatePresence>{fx && <Effect key={fx.id} fx={fx} onDone={onDone} />}</AnimatePresence>
    </div>
  );
}

function Effect({ fx, onDone }: { fx: FxEvent; onDone: () => void }) {
  const key = fx.key;
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => setTimeout(onDone, 1400)}
    >
      {key === 'kiss' && <Kiss />}
      {key === 'hug' && <Hug />}
      {key === 'hold-hand' && <HoldHandFx />}
      {key === 'heart' && <Hearts />}
      {key === 'miss' && <Miss />}
      {key === 'angry' && <Angry />}
      {!['kiss', 'hug', 'hold-hand', 'heart', 'miss', 'angry'].includes(key) && <Burst emoji={fx.emoji} />}

      {/* who sent it */}
      {!fx.mine && fx.actorName && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute inset-x-0 top-[18%] text-center"
        >
          <span className="rounded-pill bg-black/30 px-4 py-1.5 text-sm font-bold text-white backdrop-blur">
            từ {fx.actorName} 💌
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---------- individual effects ---------- */

function Center({ children, rotate }: { children: React.ReactNode; rotate?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.2, opacity: 0, rotate: rotate ? -rotate : 0 }}
      animate={{ scale: [0.2, 1.4, 1.1], opacity: [0, 1, 1], rotate: 0 }}
      exit={{ scale: 1.6, opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[7rem] drop-shadow-2xl sm:text-[10rem]"
    >
      {children}
    </motion.div>
  );
}

function Risers({ glyphs, count = 18 }: { glyphs: string[]; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const left = rand(2, 96);
        const size = rand(22, 52);
        const delay = rand(0, 0.5);
        const dur = rand(1.4, 2.4);
        return (
          <motion.span
            key={i}
            className="absolute bottom-[-10%] select-none"
            style={{ left: `${left}%`, fontSize: size }}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -window.innerHeight * rand(0.7, 1.05), opacity: [0, 1, 1, 0], scale: 1, x: rand(-40, 40) }}
            transition={{ duration: dur, delay, ease: 'easeOut' }}
          >
            {glyphs[i % glyphs.length]}
          </motion.span>
        );
      })}
    </>
  );
}

function Hearts() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-t from-love/20 to-transparent" />
      <Risers glyphs={['❤️', '💖', '💕', '💗', '🩷']} count={22} />
      <Center>❤️</Center>
    </>
  );
}

function Kiss() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, rgb(var(--c-love) / 0.18), transparent 60%)' }} />
      <Risers glyphs={['💋', '💕', '💗']} count={14} />
      <Center rotate={12}>💋</Center>
    </>
  );
}

function Hug() {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial={{ boxShadow: 'inset 0 0 0px rgba(251,113,133,0)' }}
        animate={{ boxShadow: ['inset 0 0 0px rgba(251,113,133,0)', 'inset 0 0 220px rgba(251,113,133,0.55)', 'inset 0 0 120px rgba(251,113,133,0.25)'] }}
        transition={{ duration: 1.1 }}
      />
      {/* arms closing in */}
      <motion.div initial={{ x: '-60%' }} animate={{ x: '-8%' }} transition={{ duration: 0.7, ease: 'easeOut' }} className="absolute left-0 top-1/2 -translate-y-1/2 text-[6rem] sm:text-[9rem]">🫂</motion.div>
      <Center>🤗</Center>
    </>
  );
}

function HoldHandFx() {
  return (
    <>
      <motion.div initial={{ x: '-80%' }} animate={{ x: '-2%' }} transition={{ duration: 0.6, ease: 'easeOut' }} className="absolute left-1/2 top-1/2 -translate-y-1/2 text-[5rem] sm:text-[8rem]">🤝</motion.div>
      <Risers glyphs={['✨', '💫', '💕']} count={12} />
    </>
  );
}

function Miss() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-primary/15 to-deep/10" />
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute top-[-5%] text-primary/60"
          style={{ left: `${rand(0, 100)}%`, fontSize: rand(10, 18) }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: window.innerHeight * 1.1, opacity: [0, 0.8, 0] }}
          transition={{ duration: rand(1, 1.8), delay: rand(0, 0.6) }}
        >
          💧
        </motion.span>
      ))}
      <Center>🥺</Center>
    </>
  );
}

function Angry() {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ x: [0, -14, 12, -8, 6, 0] }}
      transition={{ duration: 0.6 }}
    >
      <motion.div className="absolute inset-0 bg-red-500/20" animate={{ opacity: [0.4, 0] }} transition={{ duration: 0.8 }} />
      <Risers glyphs={['😤', '💢', '💨']} count={14} />
      <Center>😤</Center>
    </motion.div>
  );
}

function Burst({ emoji }: { emoji: string }) {
  return (
    <>
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = rand(120, 320);
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 text-4xl"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 1.4 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            {emoji}
          </motion.span>
        );
      })}
      <Center>{emoji}</Center>
    </>
  );
}
