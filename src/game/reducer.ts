import { createDeck, fiveFruit, fruitTotals, hasFive, shuffle, withJitter } from './deck'
import { PHOTO_FINISH_MS } from './rules'
import type { Action, GameState, Stats, Who } from './types'

export const other = (who: Who): Who => (who === 'player' ? 'ai' : 'player')

const emptyStats: Stats = {
  hits: 0,
  falses: 0,
  reactions: [],
  aiHits: 0,
  aiFalses: 0,
  bestCombo: 0,
  photoFinishes: 0,
}

export const initialState: GameState = {
  phase: 'menu',
  difficulty: 'normal',
  decks: { player: [], ai: [] },
  piles: { player: [], ai: [] },
  turn: 'player',
  flipId: 0, // 테이블 상황이 바뀔 때마다 증가 (AI 판단 트리거)
  lock: false, // 종이 울린 뒤 결과를 처리하는 동안 true
  result: null,
  ringCount: 0,
  fiveAt: null, // 5개가 테이블에 나타난 시각 (반응속도 측정용)
  stats: emptyStats,
  winner: null,
  gameId: 0, // 새 판마다 증가 (테이블을 새로 마운트해 카드 나누기 애니메이션 재생)
  flips: 0,
  combo: 0,
  autoFlipId: -1,
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      const deck = createDeck()
      return {
        ...initialState,
        phase: 'dealing',
        difficulty: action.difficulty,
        gameId: state.gameId + 1,
        // 한 장씩 번갈아 나눠주기
        decks: {
          player: deck.filter((_, i) => i % 2 === 0),
          ai: deck.filter((_, i) => i % 2 === 1),
        },
      }
    }

    case 'GO':
      return state.phase === 'dealing' ? { ...state, phase: 'playing', flipId: state.flipId + 1 } : state

    case 'FLIP': {
      const { who } = action
      if (state.phase !== 'playing' || state.lock || state.turn !== who) return state
      const [card, ...rest] = state.decks[who]
      if (!card) return state
      const piles = { ...state.piles, [who]: [...state.piles[who], card] }
      return {
        ...state,
        decks: { ...state.decks, [who]: rest },
        piles,
        turn: other(who),
        flipId: state.flipId + 1,
        flips: state.flips + 1,
        autoFlipId: action.auto ? state.flipId + 1 : state.autoFlipId,
        fiveAt: hasFive(piles) ? action.at : null,
      }
    }

    case 'RING': {
      const { who } = action
      if (state.phase !== 'playing' || state.lock) return state
      const fruit = fiveFruit(state.piles)
      const valid = fruit !== null
      const reaction = valid && state.fiveAt != null ? action.at - state.fiveAt : null
      // AI가 치기 직전에 먼저 쳤다면 간발의 차
      const m = action.margin
      const margin = who === 'player' && valid && m != null && m > 0 && m <= PHOTO_FINISH_MS ? m : null
      // 플레이어 성공 → 콤보 +1, 플레이어 헛종이나 AI 성공 → 콤보 끊김
      const combo = who === 'player' ? (valid ? state.combo + 1 : 0) : valid ? 0 : state.combo
      const s = state.stats
      return {
        ...state,
        lock: true,
        ringCount: state.ringCount + 1,
        combo,
        result: {
          who,
          valid,
          fruit,
          totals: fruitTotals(state.piles),
          reaction,
          margin,
          combo,
          resolved: false,
          gained: 0,
        },
        stats:
          who === 'player'
            ? {
                ...s,
                hits: s.hits + (valid ? 1 : 0),
                falses: s.falses + (valid ? 0 : 1),
                reactions: reaction != null ? [...s.reactions, reaction] : s.reactions,
                bestCombo: Math.max(s.bestCombo, combo),
                photoFinishes: s.photoFinishes + (margin != null ? 1 : 0),
              }
            : { ...s, aiHits: s.aiHits + (valid ? 1 : 0), aiFalses: s.aiFalses + (valid ? 0 : 1) },
      }
    }

    // 결과를 잠깐 보여준 뒤 실제로 카드를 옮김
    case 'RESOLVE': {
      const r = state.result
      if (!r || r.resolved) return state
      const { who } = r
      const opp = other(who)

      if (r.valid) {
        const won = shuffle([...state.piles.player, ...state.piles.ai]).map(withJitter)
        return {
          ...state,
          decks: { ...state.decks, [who]: [...state.decks[who], ...won] },
          piles: { player: [], ai: [] },
          turn: who,
          fiveAt: null,
          result: { ...r, resolved: true, gained: won.length },
        }
      }

      // 헛종: 상대에게 카드 1장
      const [penalty, ...rest] = state.decks[who]
      if (!penalty) return { ...state, result: { ...r, resolved: true } }
      return {
        ...state,
        decks: { ...state.decks, [who]: rest, [opp]: [...state.decks[opp], penalty] },
        result: { ...r, resolved: true, gained: 1 },
      }
    }

    case 'UNLOCK':
      return { ...state, lock: false, result: null, flipId: state.flipId + 1 }

    case 'LOSE':
      if (state.phase !== 'playing') return state
      return { ...state, phase: 'over', winner: other(action.who) }

    case 'MENU':
      return { ...initialState, difficulty: state.difficulty, gameId: state.gameId }

    default:
      return state
  }
}
