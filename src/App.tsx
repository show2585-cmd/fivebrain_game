import { ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
import GameOver from './components/GameOver'
import { BellMark } from './components/Icons'
import Menu from './components/Menu'
import Table, { DEAL_MS } from './components/Table'
import { DIFFICULTIES, randomBetween } from './game/ai'
import { hasFive, visibleCards } from './game/deck'
import { initialState, reducer } from './game/reducer'
import { BIG_POT, DANGER_CARDS, tempo, turnLimit } from './game/rules'
import type { Difficulty, GameState } from './game/types'
import { isMuted, setMuted, sfx, unlockAudio, vibrate } from './game/sound'

const SHOW_RESULT_MS = 700 // 종 결과를 보여준 뒤 카드를 옮기기까지
const UNLOCK_MS = 1700 // 종 이후 게임 재개까지
const EMPTY_GRACE_MS = 1500 // 덱이 빈 채로 차례가 오면 이 시간 뒤 패배

const pileCount =(s: GameState) => s.piles.player.length + s.piles.ai.length

// 상태 변화에 맞춰 효과음/진동 재생
function useGameSounds(state: GameState) {
  const prev = useRef(state)
  useEffect(() => {
    const p = prev.current
    prev.current = state
    if (p === state) return

    if (state.phase === 'dealing' && state.gameId !== p.gameId) sfx.deal()
    if (pileCount(state) > pileCount(p)) sfx.flip()
    if (state.ringCount > p.ringCount && state.result) {
      const { valid, combo, who } = state.result
      sfx.impact()
      sfx.ding()
      vibrate(valid ? 40 : [40, 60, 40])
      if (!valid) setTimeout(sfx.buzz, 160)
      else if (who === 'player' && combo >= 2) setTimeout(() => sfx.combo(combo), 180)
    }
    if (state.result?.resolved && !p.result?.resolved) {
      if (state.result.valid) sfx.collect(state.result.gained)
      else sfx.flip()
    }
    if (state.phase === 'over' && p.phase !== 'over') {
      if (state.winner === 'player') sfx.win()
      else sfx.lose()
    }
  }, [state])
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [muted, setMutedState] = useState(isMuted)
  const { phase, lock, turn, decks, difficulty } = state
  const playing = phase === 'playing'
  const canFlip = playing && !lock && turn === 'player' && decks.player.length > 0
  const limit = turnLimit(difficulty, state.flips)
  const pot = pileCount(state)
  const danger = decks.player.length <= DANGER_CARDS
  const tension = playing && !lock && (danger || pot >= BIG_POT)
  // AI가 정답 종을 치기로 예약한 시각 (간발의 차 판정용)
  const aiRingAt = useRef<number | null>(null)

  useGameSounds(state)

  // AI: 상황이 바뀔 때마다 종을 칠지 / 카드를 뒤집을지 결정
  useEffect(() => {
    if (state.phase !== 'playing' || state.lock) return
    const cfg = DIFFICULTIES[state.difficulty]
    const timers: ReturnType<typeof setTimeout>[] = []
    const cleanup = () => {
      timers.forEach(clearTimeout)
      aiRingAt.current = null
    }
    const ring = () => dispatch({ type: 'RING', who: 'ai', at: performance.now() })

    if (hasFive(state.piles)) {
      // 5개를 알아챘으면 카드를 뒤집지 않고 종부터 친다
      if (Math.random() > cfg.miss) {
        const delay = randomBetween(cfg.reaction)
        aiRingAt.current = performance.now() + delay
        timers.push(setTimeout(ring, delay))
        return cleanup
      }
    } else if (visibleCards(state.piles).length > 0 && Math.random() < cfg.falseRing) {
      timers.push(setTimeout(ring, randomBetween(cfg.reaction)))
    }

    if (state.turn === 'ai' && state.decks.ai.length > 0) {
      // 템포가 오를수록 AI가 빨리 뒤집는다
      const delay = randomBetween(cfg.flipDelay) / tempo(state.flips)
      timers.push(setTimeout(() => dispatch({ type: 'FLIP', who: 'ai', at: performance.now() }), delay))
    }
    return cleanup
  }, [state])

  // 내 차례 제한시간: 마지막 1초 째깍, 시간 초과 시 자동으로 뒤집힘
  useEffect(() => {
    if (!canFlip) return
    const timers = [
      setTimeout(() => sfx.tick(), limit - 1000),
      setTimeout(() => sfx.tick(), limit - 660),
      setTimeout(() => sfx.tick(true), limit - 330),
      setTimeout(() => dispatch({ type: 'FLIP', who: 'player', at: performance.now(), auto: true }), limit),
    ]
    return () => timers.forEach(clearTimeout)
  }, [canFlip, limit, state.flipId])

  // 위기 상황이나 판돈이 클 때 심장박동 (둘 다면 더 빠르게)
  const heartRate = danger && pot >= BIG_POT ? 600 : 850
  useEffect(() => {
    if (!tension) return
    sfx.heartbeat()
    const id = setInterval(() => sfx.heartbeat(), heartRate)
    return () => clearInterval(id)
  }, [tension, heartRate])

  // 카드 나누기 끝나면 시작
  useEffect(() => {
    if (phase !== 'dealing') return
    const t = setTimeout(() => dispatch({ type: 'GO' }), DEAL_MS)
    return () => clearTimeout(t)
  }, [phase])

  // 종 결과 표시 → 카드 이동 → 게임 재개
  useEffect(() => {
    if (!lock) return
    const t1 = setTimeout(() => dispatch({ type: 'RESOLVE' }), SHOW_RESULT_MS)
    const t2 = setTimeout(() => dispatch({ type: 'UNLOCK' }), UNLOCK_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [lock])

  // 차례인데 뒤집을 카드가 없으면 패배 (그 사이 종으로 카드를 얻으면 취소)
  useEffect(() => {
    if (!playing || lock || decks[turn].length > 0) return
    const t = setTimeout(() => dispatch({ type: 'LOSE', who: turn }), EMPTY_GRACE_MS)
    return () => clearTimeout(t)
  }, [playing, lock, turn, decks])

  const start = (level: Difficulty) => {
    unlockAudio()
    dispatch({ type: 'START', difficulty: level })
  }
  const menu = () => dispatch({ type: 'MENU' })
  const flip = () => {
    unlockAudio()
    dispatch({ type: 'FLIP', who: 'player', at: performance.now() })
  }
  const ring = () => {
    unlockAudio()
    const now = performance.now()
    const margin = aiRingAt.current != null ? aiRingAt.current - now : null
    dispatch({ type: 'RING', who: 'player', at: now, margin })
  }
  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
  }

  return (
    <div className={`h-dvh ${phase === 'menu' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      <div className={`mx-auto flex max-w-md flex-col px-3 py-3 ${phase === 'menu' ? 'min-h-full' : 'h-full'}`}>
        {phase === 'menu' ? (
          <Menu onStart={start} />
        ) : (
          <>
            <header className="mb-3 flex items-center justify-between gap-2 text-white">
              <button
                type="button"
                onClick={menu}
                aria-label="나가기"
                className="grid size-9 cursor-pointer place-items-center rounded-full bg-black/30 hover:bg-black/45"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
              <h1 className="flex items-center gap-1.5 font-display text-2xl leading-none text-[#fff4d6]">
                <BellMark size={26} />
                오감 브레인
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-black/30 px-3 pb-1.5 pt-2 font-display text-sm leading-none">
                  {DIFFICULTIES[difficulty].label}
                </span>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? '소리 켜기' : '소리 끄기'}
                  className="grid size-9 cursor-pointer place-items-center rounded-full bg-black/30 hover:bg-black/45"
                >
                  {muted ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
                </button>
              </div>
            </header>

            <Table
              key={state.gameId}
              state={state}
              canFlip={canFlip}
              turnLimit={limit}
              danger={playing && danger}
              heartRate={heartRate}
              onFlip={flip}
              onRing={ring}
            />
          </>
        )}

        {phase === 'over' && (
          <GameOver
            winner={state.winner}
            stats={state.stats}
            onRetry={() => start(difficulty)}
            onMenu={menu}
          />
        )}
      </div>
    </div>
  )
}

export default App
