// Ingredient-language tables and tokenization, ported verbatim from the
// reference kitchen so pantry matching behaves identically. These are
// deliberately small and English-first; a fork may extend them for its locale.

export const DESCRIPTORS: Record<string, 1> = {
  dried: 1, fresh: 1, frozen: 1, canned: 1, raw: 1, ground: 1, organic: 1,
  whole: 1, cooked: 1, large: 1, small: 1, medium: 1, low: 1, sodium: 1,
  unsweetened: 1, plain: 1, natural: 1, gf: 1, gluten: 1, free: 1, vegan: 1,
};

export const MEASURES: Record<string, 1> = {
  tsp: 1, tbsp: 1, teaspoon: 1, teaspoons: 1, tablespoon: 1, tablespoons: 1,
  cup: 1, cups: 1, can: 1, cans: 1, oz: 1, ounce: 1, ounces: 1, lb: 1, pound: 1,
  pounds: 1, g: 1, kg: 1, ml: 1, l: 1, pinch: 1, handful: 1, of: 1, a: 1, an: 1,
  to: 1, taste: 1, heaping: 1, single: 1, serving: 1, warm: 1, cold: 1, hot: 1,
  block: 1, each: 1,
};

// Always-on-hand items that never belong on a shopping list.
export const STAPLES: Record<string, 1> = { water: 1, salt: 1, ice: 1 };

// Cookware that shows up in ingredient lines ("line the pan with foil") but is
// not something to buy or pantry-check.
export const EQUIPMENT: Record<string, 1> = {
  foil: 1, pan: 1, stone: 1, parchment: 1, press: 1, mold: 1, tin: 1,
  liners: 1, dish: 1, tray: 1, skillet: 1, wok: 1,
};

// Naive singularization: trailing "s" on tokens longer than 3 chars.
export function normTok(t: string): string {
  return t.length > 3 && t.slice(-1) === "s" ? t.slice(0, -1) : t;
}

export function tokens(s: string): string[] {
  return String(s || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // drop parenthetical asides
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

// "Chili powder: 1 tbsp" -> "1 tbsp"; a line with no "item: rest" prefix is
// returned unchanged.
export function bareLine(line: string): string {
  const s = String(line || "");
  const i = s.indexOf(": ");
  return i > 0 ? s.slice(i + 2) : s;
}
