'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ParticleField } from '@/components/ui/ParticleField';
import { useToast } from '@/components/providers/ToastProvider';
import { CoupleHeader } from '@/components/room/CoupleHeader';
import { ActionGrid } from '@/components/room/ActionGrid';
import { StatsCard } from '@/components/room/StatsCard';
import { EventLog } from '@/components/room/EventLog';
import { ThemePicker } from '@/components/room/ThemePicker';
import { CustomActions } from '@/components/room/CustomActions';
import { MediaUpload } from '@/components/room/MediaUpload';
import { FeedbackCard } from '@/components/room/FeedbackCard';
import { IncomingPopup, type Incoming } from '@/components/room/IncomingPopup';
import { AquariumStage } from '@/components/aquarium/AquariumStage';
import { PetStatsPanel } from '@/components/pet/PetStatsPanel';
import { PetActions } from '@/components/pet/PetActions';
import { PetCustomize } from '@/components/pet/PetCustomize';
import { LevelUpBurst } from '@/components/pet/LevelUpBurst';
import { Shop } from '@/components/shop/Shop';
import { MemoryTimeline } from '@/components/timeline/MemoryTimeline';
import { PushToggle } from '@/components/push/PushToggle';
import { SeasonBanner } from '@/components/ui/SeasonBanner';
import { useClientId } from '@/hooks/useClientId';
import { useLiveRoom } from '@/hooks/useLiveRoom';
import { useSeason } from '@/hooks/useSeason';
import { api } from '@/lib/api-client';
import { readPrefs } from '@/lib/storage';
import { themeCssVars } from '@/lib/theme';
import type { PetActionKey, Room, RoomAction, RoomBackground, ThemeConfig } from '@/lib/types';

type Tab = 'home' | 'pet' | 'shop' | 'memory' | 'settings';

const TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'home', label: 'Tương tác', icon: '💌' },
  { value: 'pet', label: 'Thú cưng', icon: '🐾' },
  { value: 'shop', label: 'Cửa hàng', icon: '🛍️' },
  { value: 'memory', label: 'Kỷ niệm', icon: '📖' },
  { value: 'settings', label: 'Tùy chỉnh', icon: '⚙️' }
];

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const roomId = String(params.roomId || '').toUpperCase();
  const clientId = useClientId();
  const season = useSeason();
  const { room, events, loading, presence, applyRoom, pokeEvents } = useLiveRoom(roomId, clientId);

  const [tab, setTab] = useState<Tab>('home');
  const [needName, setNeedName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [reaction, setReaction] = useState<{ id: number; emoji: string } | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  const [busyPet, setBusyPet] = useState(false);
  const [showWaiting, setShowWaiting] = useState(true);

  const joinAttempted = useRef(false);
  const seenEventId = useRef<number | null>(null);
  const prevLevel = useRef<number | null>(null);

  // ---- membership / auto-join ----
  useEffect(() => {
    if (!room || !clientId || joinAttempted.current) return;
    const isMember = room.creatorClientId === clientId || room.partnerClientId === clientId;
    if (isMember) {
      joinAttempted.current = true;
      return;
    }
    if (room.partnerClientId && room.partnerClientId !== clientId) {
      setFatalError('Room này đã đủ 2 người rồi 🥲');
      joinAttempted.current = true;
      return;
    }
    const prefName = readPrefs().name;
    if (prefName) {
      joinAttempted.current = true;
      api
        .joinRoom(roomId, prefName, clientId)
        .then((res) => applyRoom(res.room))
        .catch((e) => setFatalError(e.message));
    } else {
      setNeedName(true);
    }
  }, [room, clientId, roomId, applyRoom]);

  async function confirmJoin() {
    if (!nameInput.trim()) return toast('Nhập tên của bạn nhé', 'warn');
    try {
      const res = await api.joinRoom(roomId, nameInput.trim(), clientId);
      applyRoom(res.room);
      setNeedName(false);
      joinAttempted.current = true;
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  // ---- detect incoming partner actions ----
  useEffect(() => {
    if (!events.length) return;
    const latest = events[events.length - 1];
    if (seenEventId.current === null) {
      seenEventId.current = latest.id;
      return;
    }
    if (latest.id > seenEventId.current) {
      const fresh = events.filter((e) => e.id > (seenEventId.current as number));
      seenEventId.current = latest.id;
      const partnerAction = [...fresh].reverse().find((e) => e.event_type === 'action.sent' && e.actor_name && e.actor_name !== presence.myName);
      if (partnerAction) {
        setIncoming({ id: partnerAction.id, emoji: partnerAction.emoji || '💕', message: partnerAction.message });
        navigator.vibrate?.(40);
        setTimeout(() => setIncoming((cur) => (cur?.id === partnerAction.id ? null : cur)), 3500);
      }
    }
  }, [events, presence.myName]);

  // ---- detect level up ----
  useEffect(() => {
    if (!room) return;
    if (prevLevel.current !== null && room.pet.level > prevLevel.current) {
      setLevelUp(room.pet.level);
      setTimeout(() => setLevelUp(null), 2200);
    }
    prevLevel.current = room.pet.level;
  }, [room]);

  // hide waiting overlay once partner present
  useEffect(() => {
    if (room?.partnerClientId) setShowWaiting(false);
  }, [room?.partnerClientId]);

  const effectiveTheme: ThemeConfig | undefined = useMemo(() => {
    if (!room) return undefined;
    if (room.sessionThemeConfig && room.sessionThemeExpiresAt && new Date(room.sessionThemeExpiresAt).getTime() > Date.now()) {
      return room.sessionThemeConfig;
    }
    return room.themeConfig;
  }, [room]);

  const accentVars = useMemo(() => themeCssVars(effectiveTheme), [effectiveTheme]) as React.CSSProperties;
  const background = effectiveTheme?.background || null;

  // ---- mutations ----
  const sendAction = useCallback(
    async (action: RoomAction) => {
      try {
        const res = await api.sendAction(roomId, action, presence.myName, clientId);
        applyRoom(res.room);
        pokeEvents();
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    },
    [roomId, presence.myName, clientId, applyRoom, pokeEvents, toast]
  );

  const carePet = useCallback(
    async (action: PetActionKey) => {
      if (busyPet) return;
      setBusyPet(true);
      const emojiMap: Record<string, string> = { feed: '🍙', drink: '💧', walk: '🚶', bath: '🫧', sleep: '💤', play: '🎾', pet: '💗' };
      setReaction({ id: Date.now(), emoji: emojiMap[action] || '💕' });
      try {
        const res = await api.carePet(roomId, action, presence.myName, clientId);
        applyRoom(res.room);
        pokeEvents();
      } catch (e) {
        toast((e as Error).message, 'error');
      } finally {
        setTimeout(() => setBusyPet(false), 350);
      }
    },
    [roomId, presence.myName, clientId, busyPet, applyRoom, pokeEvents, toast]
  );

  const doBuy = useCallback(
    async (itemId: string) => {
      try {
        const res = await api.buyItem(roomId, itemId, presence.myName);
        applyRoom(res.room);
        toast('Đã mua thành công 🎉', 'success');
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    },
    [roomId, presence.myName, applyRoom, toast]
  );

  const doEquip = useCallback(
    async (slot: 'hat' | 'outfit' | 'scene', itemId: string | null) => {
      try {
        const res = await api.equip(roomId, slot, itemId);
        applyRoom(res.room);
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    },
    [roomId, applyRoom, toast]
  );

  const savePet = useCallback(
    async (patch: { name?: string; petType?: string }) => {
      try {
        const res = await api.updatePet(roomId, patch);
        applyRoom(res.room);
        toast('Đã lưu thú cưng 💾', 'success');
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    },
    [roomId, applyRoom, toast]
  );

  const setTheme = useCallback(
    async (cfg: ThemeConfig) => {
      try {
        const merged = { ...cfg, background: effectiveTheme?.background || null };
        const res = await api.setTheme(roomId, merged, true);
        applyRoom(res.room);
        toast('Đã đổi giao diện room 🎨', 'success');
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    },
    [roomId, applyRoom, toast, effectiveTheme]
  );

  const saveActions = useCallback(
    async (actions: RoomAction[]) => {
      try {
        const res = await api.setActions(roomId, actions);
        applyRoom(res.room);
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    },
    [roomId, applyRoom, toast]
  );

  const saveBackground = useCallback(
    async (bg: RoomBackground) => {
      if (!effectiveTheme) return;
      try {
        const res = await api.setTheme(roomId, { ...effectiveTheme, background: bg }, true);
        applyRoom(res.room);
      } catch (e) {
        toast((e as Error).message, 'error');
      }
    },
    [roomId, applyRoom, toast, effectiveTheme]
  );

  async function leave() {
    if (clientId) await api.leave(roomId, clientId);
    router.push('/');
  }

  // ---- render guards ----
  if (fatalError) {
    return (
      <Centered>
        <Card className="max-w-sm text-center">
          <div className="mb-2 text-5xl">🫧</div>
          <p className="mb-4 font-bold">{fatalError}</p>
          <Link href="/">
            <Button variant="primary">Về trang chủ</Button>
          </Link>
        </Card>
      </Centered>
    );
  }

  if (needName) {
    return (
      <Centered>
        <Card className="w-full max-w-sm">
          <CardTitle icon="💕">Vào room {roomId}</CardTitle>
          <p className="mb-3 text-sm text-muted">Nhập tên của bạn để cùng chăm thú cưng nhé!</p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={20}
            placeholder="Tên của bạn"
            className="mb-3 w-full rounded-2xl border border-border bg-surface-2/60 px-4 py-2.5 font-bold outline-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && confirmJoin()}
          />
          <Button variant="primary" fullWidth onClick={confirmJoin}>
            Vào room 💕
          </Button>
        </Card>
      </Centered>
    );
  }

  if (loading || !room) {
    return (
      <Centered>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 1.4, repeat: Infinity }} className="text-6xl">
          🦭
        </motion.div>
        <p className="mt-3 font-bold text-muted">Đang lặn xuống room...</p>
      </Centered>
    );
  }

  const waiting = presence.iAmCreator && !room.partnerClientId && showWaiting;

  return (
    <div style={accentVars} className="relative min-h-dvh pb-24 sm:pb-6">
      <ParticleField kind={effectiveTheme?.particles || 'bubbles'} count={14} glyphs={season?.glyphs} />
      {background && <BackgroundMedia bg={background} />}

      <CoupleHeader room={room} presence={presence} onLeave={leave} />

      <main className="relative z-10 mx-auto max-w-6xl px-3 py-4 sm:px-4">
        <SeasonBanner season={season} />
        {/* presence banner */}
        <AnimatePresence>
          {presence.bothOnline && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 flex items-center justify-center gap-2 rounded-pill bg-teal/15 py-1.5 text-sm font-bold text-teal"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal" /> Cả hai đang online — khoảnh khắc bên nhau 💞
            </motion.div>
          )}
        </AnimatePresence>

        {/* desktop tab bar */}
        <div className="mb-4 hidden gap-1 rounded-pill bg-surface/70 p-1 backdrop-blur sm:flex">
          {TABS.map((t) => (
            <TabButton key={t.value} active={tab === t.value} onClick={() => setTab(t.value)} {...t} />
          ))}
          <Link href="/ranking" className="ml-auto">
            <Button variant="soft" size="sm">🏆 Bảng xếp hạng</Button>
          </Link>
        </div>

        {/* content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'home' && (
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-4">
                  <ActionGrid room={room} onSend={sendAction} />
                  <StatsCard room={room} />
                </div>
                <div className="lg:max-h-[calc(100dvh-12rem)]">
                  <EventLog events={events} />
                </div>
              </div>
            )}

            {tab === 'pet' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <Card>
                    <AquariumStage pet={room.pet} inventory={room.inventory} reaction={reaction} />
                    <div className="mt-4">
                      <PetActions onAction={carePet} busy={busyPet} />
                    </div>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardTitle icon="📈">Chỉ số của bé</CardTitle>
                    <PetStatsPanel room={room} />
                  </Card>
                  <Card>
                    <CardTitle icon="✏️">Tùy chỉnh thú cưng</CardTitle>
                    <PetCustomize pet={room.pet} onSave={savePet} />
                  </Card>
                </div>
              </div>
            )}

            {tab === 'shop' && (
              <Card>
                <Shop room={room} onBuy={doBuy} onEquip={doEquip} />
              </Card>
            )}

            {tab === 'memory' && (
              <Card>
                <CardTitle icon="📖">Nhật ký kỷ niệm</CardTitle>
                <MemoryTimeline events={events} />
              </Card>
            )}

            {tab === 'settings' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardTitle icon="🎨">Giao diện Room</CardTitle>
                  <ThemePicker current={effectiveTheme?.templateId || 'ocean'} onSelect={setTheme} />
                  <div className="mt-4">
                    <MediaUpload roomId={roomId} onUploaded={saveBackground} />
                  </div>
                </Card>
                <Card>
                  <CardTitle icon="✨">Hành động tuỳ chỉnh</CardTitle>
                  <CustomActions actions={room.actions} onSave={saveActions} />
                </Card>
                <Card>
                  <CardTitle icon="🔔">Thông báo</CardTitle>
                  <p className="mb-3 text-sm text-muted">Nhận thông báo khi người yêu gửi cảm xúc hoặc thú cưng lên cấp — kể cả khi đóng tab.</p>
                  <PushToggle roomId={roomId} clientId={clientId} />
                </Card>
                <Card className="lg:col-span-2">
                  <CardTitle icon="💬">Góp ý cải thiện</CardTitle>
                  <FeedbackCard roomId={roomId} />
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-surface/90 backdrop-blur-md sm:hidden">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`focus-ring flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.65rem] font-bold transition-colors ${
                tab === t.value ? 'text-primary' : 'text-muted'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <IncomingPopup incoming={incoming} />
      <LevelUpBurst level={levelUp} />

      {/* waiting overlay */}
      <AnimatePresence>{waiting && <WaitingOverlay roomId={roomId} onDismiss={() => setShowWaiting(false)} />}</AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring relative rounded-pill px-4 py-2 text-sm font-bold transition-colors ${
        active ? 'text-white' : 'text-muted hover:text-text'
      }`}
    >
      {active && <motion.span layoutId="room-tab" className="grad-primary absolute inset-0 rounded-pill shadow-pop" />}
      <span className="relative z-10">
        {icon} {label}
      </span>
    </button>
  );
}

function BackgroundMedia({ bg }: { bg: RoomBackground }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-30">
      {bg.type === 'video' ? (
        <video src={bg.url} autoPlay loop muted playsInline className="h-full w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bg.url} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

function WaitingOverlay({ roomId, onDismiss }: { roomId: string; onDismiss: () => void }) {
  const toast = useToast();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-bg/80 px-4 backdrop-blur-md"
    >
      <Card className="w-full max-w-sm text-center">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="mb-3 text-5xl">
          💞
        </motion.div>
        <h2 className="mb-1 font-display text-xl font-bold">Đang chờ người yêu...</h2>
        <p className="mb-4 text-sm text-muted">Gửi mã này cho người ấy nhé:</p>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(roomId).catch(() => {});
            toast(`📋 Đã copy: ${roomId}`, 'success');
          }}
          className="focus-ring mb-4 w-full rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 py-3 font-display text-3xl font-bold tracking-[0.3em] text-primary"
        >
          {roomId}
        </button>
        <Button variant="soft" fullWidth onClick={onDismiss}>
          Vào xem trước phòng →
        </Button>
      </Card>
    </motion.div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4">
      <ParticleField kind="bubbles" count={12} />
      <div className="relative z-10 flex flex-col items-center">{children}</div>
    </main>
  );
}
