'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PET_TYPES, PET_NAME_MAX } from '@/lib/pet';
import type { Pet, PetType } from '@/lib/types';

interface Props {
  pet: Pet;
  onSave: (patch: { name?: string; petType?: string }) => void;
}

export function PetCustomize({ pet, onSave }: Props) {
  const [name, setName] = useState(pet.name);
  const [type, setType] = useState<PetType>(pet.type);

  return (
    <div className="space-y-3">
      <div>
        <span className="mb-1.5 block text-sm font-bold text-muted">Tên thú cưng</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={PET_NAME_MAX}
          className="w-full rounded-2xl border border-border bg-surface-2/60 px-4 py-2.5 font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
        />
      </div>
      <div>
        <span className="mb-1.5 block text-sm font-bold text-muted">Loài</span>
        <div className="grid grid-cols-3 gap-2">
          {PET_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => setType(t.type)}
              className={`focus-ring flex flex-col items-center gap-0.5 rounded-2xl border-2 py-2 transition-colors ${
                type === t.type ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/40'
              }`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-[0.7rem] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <Button
        variant="primary"
        fullWidth
        onClick={() => onSave({ name: name.trim() || pet.name, petType: type })}
      >
        Lưu thú cưng 💾
      </Button>
    </div>
  );
}
