/**
 * Repeatable "random" numbers. The same text always gives the same sequence, so anything placed
 * "at random" (like the ducks on the waves) lands in the same spot on every visit and every rebuild,
 * while still looking scattered from page to page.
 *
 *   const rand = seeded('/news/|wave-2');
 *   rand(); // 0.42…  (always 0.42… for that text)
 */
export function seeded(text: string): () => number {
  // FNV-1a hash of the text → 32-bit seed
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // mulberry32 generator
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one item from a list, the same one every time for the same text. */
export const pick = <T>(list: T[], text: string): T | undefined => (list.length ? list[Math.floor(seeded(text)() * list.length)] : undefined);
