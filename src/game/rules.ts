import { DIFFICULTIES } from './ai'
import type { Difficulty } from './types'

export const DANGER_CARDS = 5 // 덱이 이 장수 이하면 위기 모드
export const BIG_POT = 10 // 판돈이 이 이상이면 긴장 연출 시작
export const HUGE_POT = 16 // 판돈 폭발
export const PHOTO_FINISH_MS = 300 // AI보다 이 시간 이내로 앞서면 "간발의 차"

// 게임이 진행될수록 빨라짐: 뒤집은 카드 48장에서 최대 1.5배
export function tempo(flips: number): number {
  return 1 + (Math.min(flips, 48) / 48) * 0.5
}

// 내 차례 제한시간(ms)
export function turnLimit(difficulty: Difficulty, flips: number): number {
  return Math.max(1500, DIFFICULTIES[difficulty].turnLimit / tempo(flips))
}
