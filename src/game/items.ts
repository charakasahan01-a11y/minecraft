/**
 * Item definitions, inventory system, and cooking recipes
 */

export interface ItemDef {
  id: string;
  name: string;
  icon: string; // Emoji or visual representation
  category: 'weapon' | 'food' | 'raw_food' | 'material' | 'tool';
  maxStack: number;
  foodValue?: number; // Health/Hunger points restored
  cooksInto?: string; // Result item ID when cooked on fire
  damage?: number; // Weapon damage
  description: string;
}

export const ITEMS: Record<string, ItemDef> = {
  wooden_sword: {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    icon: '🗡️',
    category: 'weapon',
    maxStack: 1,
    damage: 4,
    description: 'Deals 4 damage. Click near animals to hunt them!',
  },
  bow: {
    id: 'bow',
    name: 'Hunting Bow',
    icon: '🏹',
    category: 'weapon',
    maxStack: 1,
    damage: 6,
    description: 'Use at the Village Game Station or hunt targets.',
  },
  raw_porkchop: {
    id: 'raw_porkchop',
    name: 'Raw Porkchop',
    icon: '🥩',
    category: 'raw_food',
    maxStack: 64,
    foodValue: 1,
    cooksInto: 'cooked_porkchop',
    description: 'Dropped by pigs. Cook at the campfire to make tasty chops!',
  },
  cooked_porkchop: {
    id: 'cooked_porkchop',
    name: 'Cooked Porkchop',
    icon: '🍖',
    category: 'food',
    maxStack: 64,
    foodValue: 4,
    description: 'Restores 4 hearts/hunger when eaten.',
  },
  raw_beef: {
    id: 'raw_beef',
    name: 'Raw Beef',
    icon: '🥩',
    category: 'raw_food',
    maxStack: 64,
    foodValue: 1,
    cooksInto: 'cooked_steak',
    description: 'Dropped by cows. Cook at the campfire into juicy steak!',
  },
  cooked_steak: {
    id: 'cooked_steak',
    name: 'Cooked Steak',
    icon: '🥩',
    category: 'food',
    maxStack: 64,
    foodValue: 5,
    description: 'Hearty steak! Restores 5 hearts/hunger.',
  },
  raw_mutton: {
    id: 'raw_mutton',
    name: 'Raw Mutton',
    icon: '🥩',
    category: 'raw_food',
    maxStack: 64,
    foodValue: 1,
    cooksInto: 'cooked_mutton',
    description: 'Dropped by sheep. Cook over the fire!',
  },
  cooked_mutton: {
    id: 'cooked_mutton',
    name: 'Cooked Mutton',
    icon: '🍗',
    category: 'food',
    maxStack: 64,
    foodValue: 4,
    description: 'Savory cooked mutton. Restores 4 hearts.',
  },
  apple: {
    id: 'apple',
    name: 'Red Apple',
    icon: '🍎',
    category: 'food',
    maxStack: 64,
    foodValue: 2,
    description: 'Sweet apple from village orchards. Restores 2 hearts.',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    icon: '💎',
    category: 'material',
    maxStack: 64,
    description: 'Valuable gem won from the Village Game Station!',
  },
  wood_planks: {
    id: 'wood_planks',
    name: 'Oak Planks',
    icon: '🪵',
    category: 'material',
    maxStack: 64,
    description: 'Building wood. Right-click to place blocks!',
  },
};

export interface InventorySlot {
  item: ItemDef;
  count: number;
}
