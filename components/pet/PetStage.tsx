'use client';

import { SHOP_MAP } from '@/lib/shop';
import type { Inventory, Pet } from '@/lib/types';
import { PetSprite } from './PetSprite';

const SCENE_BG: Record<string, string> = {
  'scene-reef': 'from-teal/30 via-aqua/20 to-primary/30',
  'scene-sunset': 'from-sun/30 via-love/20 to-primary/30'
};

interface Props {
  pet: Pet;
  inventory: Inventory;
  reaction?: { id: number; emoji: string } | null;
}

export function PetStage({ pet, inventory, reaction }: Props) {
  const scene = inventory.equipped.scene;
  const grad = (scene && SCENE_BG[scene]) || 'from-aqua/25 via-primary/10 to-teal/20';
  const sceneEmoji = scene ? SHOP_MAP[scene]?.emoji : null;

  return (
    <div className={`relative overflow-hidden rounded-card bg-gradient-to-b ${grad}`}>
      {/* water line + decor */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 h-1/3 w-full bg-gradient-to-t from-primary/25 to-transparent" />
        {sceneEmoji && <span className="absolute bottom-2 left-3 text-3xl opacity-80">{sceneEmoji}</span>}
        <span className="absolute right-4 top-3 text-2xl opacity-50">☀️</span>
        <span className="absolute left-6 top-6 text-xl opacity-40">☁️</span>
      </div>

      <div className="relative flex flex-col items-center py-4">
        <PetSprite pet={pet} inventory={inventory} reaction={reaction} size={110} />
        <div className="-mt-1 text-center">
          <div className="font-display text-xl font-bold text-deep dark:text-aqua">{pet.name}</div>
        </div>
      </div>
    </div>
  );
}
