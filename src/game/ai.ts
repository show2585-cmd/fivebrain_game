import type { Difficulty } from './types'

type Range = readonly [min: number, max: number]

export interface DifficultyConfig {
  label: string
  desc: string
  reaction: Range // 5개를 알아채고 종을 치기까지(ms)
  miss: number // 5개를 놓칠 확률
  falseRing: number // 5개가 아닌데 헛종을 칠 확률
  flipDelay: Range // AI 차례에 카드를 뒤집는 시간(ms)
  turnLimit: number // 내 차례 제한시간(ms, 템포에 따라 줄어듦)
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: '쉬움',
    desc: '느긋한 AI. 자주 놓쳐요.',
    reaction: [1100, 1800],
    miss: 0.3,
    falseRing: 0.04,
    flipDelay: [900, 1300],
    turnLimit: 4500,
  },
  normal: {
    label: '보통',
    desc: '적당히 빠르고 가끔 실수해요.',
    reaction: [650, 1100],
    miss: 0.12,
    falseRing: 0.02,
    flipDelay: [700, 1000],
    turnLimit: 3500,
  },
  hard: {
    label: '어려움',
    desc: '번개 같은 반응속도.',
    reaction: [380, 620],
    miss: 0.03,
    falseRing: 0.005,
    flipDelay: [500, 800],
    turnLimit: 2500,
  },
}

export function randomBetween([min, max]: Range): number {
  return min + Math.random() * (max - min)
}
