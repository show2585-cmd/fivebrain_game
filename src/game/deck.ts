import type { Card, FruitId, FruitTotals, Piles } from './types'

export const FRUITS: { id: FruitId; name: string }[] = [
  { id: 'banana', name: '바나나' },
  { id: 'strawberry', name: '딸기' },
  { id: 'lemon', name: '레몬' },
  { id: 'grape', name: '포도' },
]

export const FRUIT_BY_ID = Object.fromEntries(FRUITS.map((f) => [f.id, f])) as Record<
  FruitId,
  (typeof FRUITS)[number]
>

// 과일 1종당 14장: 1개×5, 2개×3, 3개×3, 4개×2, 5개×1
const COUNTS = [1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5]

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 펼친 카드 더미에 놓일 때의 자연스러운 비뚤어짐
export function withJitter<T extends Omit<Card, 'rot' | 'dx' | 'dy'>>(card: T): T & Card {
  return {
    ...card,
    rot: Math.random() * 16 - 8,
    dx: Math.random() * 10 - 5,
    dy: Math.random() * 10 - 5,
  }
}

export function createDeck(): Card[] {
  let id = 0
  const cards = FRUITS.flatMap((f) => COUNTS.map((count) => withJitter({ id: id++, fruit: f.id, count })))
  return shuffle(cards)
}

export function visibleCards(piles: Piles): Card[] {
  return [piles.player.at(-1), piles.ai.at(-1)].filter((c): c is Card => c !== undefined)
}

// 펼쳐진 맨 위 카드들의 과일별 합계
export function fruitTotals(piles: Piles): FruitTotals {
  const totals: FruitTotals = {}
  for (const card of visibleCards(piles)) {
    totals[card.fruit] = (totals[card.fruit] ?? 0) + card.count
  }
  return totals
}

// 합이 정확히 5개인 과일 (없으면 null)
export function fiveFruit(piles: Piles): FruitId | null {
  const hit = (Object.entries(fruitTotals(piles)) as [FruitId, number][]).find(([, n]) => n === 5)
  return hit ? hit[0] : null
}

export function hasFive(piles: Piles): boolean {
  return fiveFruit(piles) !== null
}
