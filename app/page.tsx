'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ParticleField } from '@/components/ui/ParticleField';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SeasonBanner } from '@/components/ui/SeasonBanner';
import { useToast } from '@/components/providers/ToastProvider';
import { api, genRoomId } from '@/lib/api-client';
import { useClientId } from '@/hooks/useClientId';
import { useSeason } from '@/hooks/useSeason';
import { readPrefs, writePrefs } from '@/lib/storage';

type Tab = 'create' | 'join';

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const clientId = useClientId();
  const season = useSeason();
  const [tab, setTab] = useState<Tab>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [genId, setGenId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = readPrefs();
    if (p.name) setName(p.name);
    if (p.lastRoom) setCode(p.lastRoom);
  }, []);

  async function handleCreate() {
    if (!name.trim()) return toast('⚠️ Nhập tên của bạn trước!', 'warn');
    if (!clientId) return;
    const id = genId || genRoomId();
    setBusy(true);
    try {
      await api.createRoom(id, name.trim(), clientId);
      writePrefs({ name: name.trim(), lastRoom: id });
      router.push(`/room/${id}`);
    } catch (e) {
      toast((e as Error).message, 'error');
      setBusy(false);
    }
  }

  function handleJoin() {
    if (!name.trim()) return toast('⚠️ Nhập tên của bạn trước!', 'warn');
    const c = code.trim().toUpperCase();
    if (c.length < 4) return toast('⚠️ Mã Room không hợp lệ!', 'warn');
    writePrefs({ name: name.trim(), lastRoom: c });
    router.push(`/room/${c}`);
  }

  function copyGen() {
    if (!genId) return;
    navigator.clipboard?.writeText(genId).catch(() => {});
    toast(`📋 Đã copy: ${genId}`, 'success');
  }

  return (
    <main className="relative min-h-dvh">
      <ParticleField kind="bubbles" count={16} glyphs={season?.glyphs} />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/ranking">
            <Button variant="soft" size="sm">🏆 BXH</Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-6 sm:pt-10">
        {season && (
          <div className="mb-2 w-full max-w-md">
            <SeasonBanner season={season} />
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 text-6xl sm:text-7xl">
            <motion.span
              className="inline-block"
              animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              🦭
            </motion.span>
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-5xl">
            <span className="grad-text">Yêu xa</span> thật gần
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Gửi cảm xúc theo thời gian thực, cùng nuôi một bé thú cưng biển và leo bảng xếp hạng cặp đôi 💙
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="card w-full max-w-md p-5 sm:p-6"
        >
          <SegmentedTabs<Tab>
            options={[
              { value: 'create', label: 'Tạo Room', icon: '✨' },
              { value: 'join', label: 'Vào Room', icon: '🔗' }
            ]}
            value={tab}
            onChange={setTab}
            layoutId="home-tabs"
          />

          <div className="mt-5 space-y-4">
            <Field label="Tên của bạn">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Ví dụ: Linh 🌸"
                className="lv-input"
              />
            </Field>

            <AnimatePresence mode="wait">
              {tab === 'create' ? (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="space-y-3"
                >
                  {genId && (
                    <button
                      onClick={copyGen}
                      className="focus-ring w-full rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-3 text-center"
                    >
                      <div className="font-display text-2xl font-bold tracking-[0.3em] text-primary">{genId}</div>
                      <div className="mt-1 text-xs text-muted">📋 Bấm để copy — gửi cho người yêu nhé!</div>
                    </button>
                  )}
                  <Button variant="soft" fullWidth onClick={() => setGenId(genRoomId())}>
                    🎲 Tạo mã Room ngẫu nhiên
                  </Button>
                  <Button variant="primary" size="lg" fullWidth onClick={handleCreate} disabled={busy}>
                    {busy ? 'Đang tạo...' : 'Tạo Room & chờ người yêu 💌'}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-3"
                >
                  <Field label="Mã Room" hint="Nhờ người yêu gửi mã 6 ký tự cho bạn">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      maxLength={8}
                      placeholder="VD: ABC123"
                      className="lv-input text-center text-xl font-bold tracking-[0.3em]"
                    />
                  </Field>
                  <Button variant="primary" size="lg" fullWidth onClick={handleJoin}>
                    Vào Room 💕
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted">
          Tên được lưu trên thiết bị này để dùng lần sau · Không cần đăng ký
        </p>
      </div>

      <style jsx global>{`
        .lv-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(var(--c-border));
          background: rgb(var(--c-surface-2) / 0.6);
          padding: 0.75rem 1rem;
          font-weight: 700;
          color: rgb(var(--c-text));
          outline: none;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .lv-input::placeholder {
          color: rgb(var(--c-muted) / 0.7);
          font-weight: 600;
        }
        .lv-input:focus {
          border-color: rgb(var(--c-primary));
          box-shadow: 0 0 0 4px rgb(var(--c-primary) / 0.2);
        }
      `}</style>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
