export type Who = 'player' | 'ai'

export type FruitId = 'banana' | 'strawberry' | 'lemon' | 'grape'

export type Difficulty = 'easy' | 'normal' | 'hard'

export type Phase = 'menu' | 'dealing' | 'playing' | 'over'

export interface Card {
  id: number
  fruit: FruitId
  count: number
  // 펼친 카드 더미에서의 비뚤어짐
  rot: number
  dx: number
  dy: number
}

export type Piles = Record<Who, Card[]>

export type FruitTotals = Partial<Record<FruitId, number>>

export interface RingResult {
  who: Who
  valid: boolean
  fruit: FruitId | null
  totals: FruitTotals
  reaction: number | null // 종 친 사람의 반응속도(ms)
  margin: number | null // 플레이어가 AI보다 앞선 시간(ms) — 간발의 차일 때만
  combo: number // 이 종 이후 플레이어 연속 성공 수
  resolved: boolean // 카드 이동까지 끝났는지
  gained: number
}

export interface Stats {
  hits: number
  falses: number
  reactions: number[]
  aiHits: number
  aiFalses: number
  bestCombo: number
  photoFinishes: number
}

export interface GameState {
  phase: Phase
  difficulty: Difficulty
  decks: Piles
  piles: Piles
  turn: Who
  flipId: number
  lock: boolean
  result: RingResult | null
  ringCount: number
  fiveAt: number | null
  stats: Stats
  winner: Who | null
  gameId: number
  flips: number // 이번 판에서 뒤집은 카드 수 (템포 계산용)
  combo: number // 플레이어 연속 성공 수
  autoFlipId: number // 시간 초과로 자동으로 뒤집힌 flipId
}

export type Action =
  | { type: 'START'; difficulty: Difficulty }
  | { type: 'GO' }
  | { type: 'FLIP'; who: Who; at: number; auto?: boolean }
  | { type: 'RING'; who: Who; at: number; margin?: number | null }
  | { type: 'RESOLVE' }
  | { type: 'UNLOCK' }
  | { type: 'LOSE'; who: Who }
  | { type: 'MENU' }
