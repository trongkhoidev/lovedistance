import type { Inventory, Pet, PetStatKey, ShopItem } from './types';

export const SHOP_ITEMS: ShopItem[] = [
  // Food (consumables — restore stats instantly on buy)
  { id: 'food-fish', category: 'food', name: 'Cá tươi', emoji: '🐟', price: 8, description: '+40 độ no cho bé' },
  { id: 'food-cake', category: 'food', name: 'Bánh kem', emoji: '🍰', price: 14, description: '+30 no, +15 hạnh phúc' },
  { id: 'drink-juice', category: 'food', name: 'Nước ép', emoji: '🧃', price: 8, description: '+45 độ khát' },
  // Toys
  { id: 'toy-ball', category: 'toy', name: 'Bóng biển', emoji: '🏐', price: 18, description: '+25 hạnh phúc khi chơi' },
  { id: 'toy-duck', category: 'toy', name: 'Vịt cao su', emoji: '🦆', price: 22, description: '+20 hạnh phúc, +10 sạch' },
  // Hats (cosmetic)
  { id: 'hat-crown', category: 'hat', name: 'Vương miện', emoji: '👑', price: 60, description: 'Phụ kiện đội đầu', cosmetic: true, unlockLevel: 3 },
  { id: 'hat-cap', category: 'hat', name: 'Nón thủy thủ', emoji: '🧢', price: 35, description: 'Phụ kiện đội đầu', cosmetic: true },
  { id: 'hat-flower', category: 'hat', name: 'Hoa biển', emoji: '🌺', price: 30, description: 'Phụ kiện đội đầu', cosmetic: true },
  // Outfits (cosmetic)
  { id: 'outfit-scarf', category: 'outfit', name: 'Khăn quàng', emoji: '🧣', price: 40, description: 'Trang phục', cosmetic: true },
  { id: 'outfit-bowtie', category: 'outfit', name: 'Nơ cổ', emoji: '🎀', price: 45, description: 'Trang phục', cosmetic: true, unlockLevel: 2 },
  // Scenes (cosmetic — background of pet stage)
  { id: 'scene-reef', category: 'scene', name: 'Rạn san hô', emoji: '🪸', price: 80, description: 'Bối cảnh sân khấu', cosmetic: true, unlockLevel: 4 },
  { id: 'scene-sunset', category: 'scene', name: 'Hoàng hôn biển', emoji: '🌅', price: 70, description: 'Bối cảnh sân khấu', cosmetic: true, unlockLevel: 3 }
];

export const SHOP_MAP: Record<string, ShopItem> = SHOP_ITEMS.reduce(
  (acc, i) => {
    acc[i.id] = i;
    return acc;
  },
  {} as Record<string, ShopItem>
);

// Effects applied to pet stats when a consumable food item is bought
export const FOOD_EFFECTS: Record<string, Partial<Record<PetStatKey, number>>> = {
  'food-fish': { fullness: 40 },
  'food-cake': { fullness: 30, happiness: 15 },
  'drink-juice': { hydration: 45 },
  'toy-ball': { happiness: 25 },
  'toy-duck': { happiness: 20, cleanliness: 10 }
};

export const DEFAULT_INVENTORY: Inventory = {
  owned: [],
  equipped: { hat: null, outfit: null, scene: null }
};

export function normalizeInventory(raw: Partial<Inventory> | null | undefined): Inventory {
  const inv = raw || {};
  return {
    owned: Array.isArray(inv.owned) ? inv.owned.filter((x) => typeof x === 'string') : [],
    equipped: {
      hat: inv.equipped?.hat ?? null,
      outfit: inv.equipped?.outfit ?? null,
      scene: inv.equipped?.scene ?? null
    }
  };
}

export function canBuy(item: ShopItem, pet: Pet, coins: number): { ok: boolean; reason?: string } {
  if (coins < item.price) return { ok: false, reason: 'Không đủ xu' };
  if (item.unlockLevel && pet.level < item.unlockLevel) {
    return { ok: false, reason: `Cần pet đạt Lv.${item.unlockLevel}` };
  }
  return { ok: true };
}
