'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { ParticleField } from '@/components/ui/ParticleField';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { api } from '@/lib/api-client';
import { PET_EMOJI } from '@/lib/pet';
import type { RankMetric, RankPeriod, RankRow } from '@/lib/types';

export default function RankingPage() {
  const [metric, setMetric] = useState<RankMetric>('interactions');
  const [period, setPeriod] = useState<RankPeriod>('week');
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getRanking(metric, period)
      .then((d) => active && setRows(d.rows))
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [metric, period]);

  const unit = metric === 'interactions' ? 'tương tác' : 'cấp';
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <main className="relative min-h-dvh pb-16">
      <ParticleField kind="stars" count={14} />

      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="soft" size="sm">🏠 Trang chủ</Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <div className="mb-5 text-center">
          <h1 className="font-display text-3xl font-bold grad-text">🏆 Bảng xếp hạng</h1>
          <p className="mt-1 text-sm text-muted">Những cặp đôi gắn kết nhất 💞</p>
        </div>

        <div className="mb-3">
          <SegmentedTabs<RankMetric>
            options={[
              { value: 'interactions', label: 'Tương tác nhiều nhất', icon: '💌' },
              { value: 'petLevel', label: 'Level thú cưng', icon: '🐾' }
            ]}
            value={metric}
            onChange={setMetric}
            layoutId="rank-metric"
          />
        </div>

        {metric === 'interactions' && (
          <div className="mb-5">
            <SegmentedTabs<RankPeriod>
              options={[
                { value: 'week', label: 'Tuần' },
                { value: 'month', label: 'Tháng' },
                { value: 'all', label: 'Mọi lúc' }
              ]}
              value={period}
              onChange={setPeriod}
              size="sm"
              layoutId="rank-period"
            />
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-muted">Đang tải bảng xếp hạng...</div>
        ) : rows.length === 0 ? (
          <Card className="py-12 text-center text-muted">Chưa có dữ liệu — hãy là cặp đôi đầu tiên! 🌊</Card>
        ) : (
          <>
            {/* podium */}
            <div className="mb-4 grid grid-cols-3 items-end gap-2">
              {[1, 0, 2].map((idx) => {
                const r = podium[idx];
                if (!r) return <div key={idx} />;
                const heights = ['h-24', 'h-32', 'h-20'];
                const medals = ['🥈', '🥇', '🥉'];
                const order = idx === 0 ? 1 : idx === 1 ? 0 : 2;
                return (
                  <motion.div
                    key={r.roomId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="flex flex-col items-center"
                  >
                    <div className="mb-1 text-3xl">{PET_EMOJI[r.petType] || '🦭'}</div>
                    <div className="mb-1 max-w-full truncate px-1 text-center text-xs font-bold">{r.coupleName}</div>
                    <div className={`flex w-full ${heights[idx]} flex-col items-center justify-start rounded-t-2xl bg-gradient-to-b from-primary/30 to-teal/20 pt-2`}>
                      <span className="text-2xl">{medals[idx]}</span>
                      <span className="mt-1 font-display text-lg font-bold text-primary">{r.value}</span>
                      <span className="text-[0.6rem] text-muted">{unit}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* rest */}
            <div className="space-y-2">
              {rest.map((r, i) => (
                <motion.div
                  key={r.roomId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * i }}
                  className="flex items-center gap-3 rounded-2xl bg-surface/70 px-3 py-2.5 backdrop-blur"
                >
                  <span className="w-6 text-center font-display font-bold text-muted">{i + 4}</span>
                  <span className="text-2xl">{PET_EMOJI[r.petType] || '🦭'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{r.coupleName}</div>
                    <div className="text-xs text-muted">
                      {r.petName} · Lv.{r.petLevel}
                    </div>
                  </div>
                  <span className="font-display font-bold text-primary">
                    {r.value} <span className="text-xs font-normal text-muted">{unit}</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
