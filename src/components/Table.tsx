import { AlarmClock, Bot, Flame, Gauge, Layers, Timer, User } from 'lucide-react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { BIG_POT, DANGER_CARDS, HUGE_POT, tempo } from '../game/rules'
import useElementSize from '../hooks/useElementSize'
import Bell from './Bell'
import type { ReactNode } from 'react'
import type { Card, FruitId, FruitTotals, GameState, RingResult, Who } from '../game/types'
import { FruitIcon, HandArt } from './Icons'
import TableCard, { type Glow, type TableCardProps } from './TableCard'

const DEAL_STEP = 0.035 // 카드 한 장 나눠주는 간격(초)
export const DEAL_MS = 56 * DEAL_STEP * 1000 + 700

type Point = { x: number; y: number }
type PlacedCard = Omit<TableCardProps, 'width' | 'height' | 'origin' | 'delay'> & { dealIndex?: number }

interface Toast {
  tone: 'good' | 'bad'
  title: ReactNode
  sub: ReactNode
}

function Totals({ totals }: { totals: FruitTotals }) {
  const entries = Object.entries(totals) as [FruitId, number][]
  if (entries.length === 0) return '펼쳐진 카드가 없어요'
  return (
    <span className="inline-flex items-center gap-2">
      {entries.map(([f, n]) => (
        <span key={f} className="inline-flex items-center gap-0.5">
          <FruitIcon fruit={f} size={16} />
          {n}
        </span>
      ))}
    </span>
  )
}

function Five({ fruit }: { fruit: FruitId }) {
  return (
    <span className="inline-flex items-center gap-1">
      <FruitIcon fruit={fruit} size={20} />
      5개!
    </span>
  )
}

const sec = (ms: number) => `${(ms / 1000).toFixed(2)}초`

function resultToast(result: RingResult): Toast {
  const { who, fruit, totals, reaction, margin } = result
  if (who === 'player' && fruit)
    return {
      tone: 'good',
      title: (
        <>
          <Five fruit={fruit} /> 정답
        </>
      ),
      sub:
        margin != null
          ? `AI보다 ${sec(margin)} 빨랐어요!`
          : reaction != null
            ? `반응 ${sec(reaction)}`
            : null,
    }
  if (who === 'ai' && fruit)
    return {
      tone: 'bad',
      title: 'AI가 먼저 쳤어요!',
      sub: (
        <>
          <Five fruit={fruit} />
          {reaction != null && ` · AI 반응 ${sec(reaction)}`}
        </>
      ),
    }
  if (who === 'player')
    return {
      tone: 'bad',
      title: '땡! 5개가 아니에요',
      sub: (
        <>
          <Totals totals={totals} /> → AI에게 1장
        </>
      ),
    }
  return {
    tone: 'good',
    title: 'AI가 헛종을 쳤어요!',
    sub: (
      <>
        <Totals totals={totals} /> → 1장 획득
      </>
    ),
  }
}

function CountBadge({ x, y, count }: Point & { count: number }) {
  return (
    <div
      className="pointer-events-none absolute z-[450] -translate-x-1/2 rounded-full bg-black/70 px-2.5 pb-0.5 pt-1 font-display text-sm leading-none text-white ring-1 ring-white/20"
      style={{ left: x, top: y }}
    >
      {count}장
    </div>
  )
}

function GainChip({ x, y, text, good }: Point & { text: string; good: boolean }) {
  return (
    <motion.div
      className={`pointer-events-none absolute z-[460] -translate-x-1/2 font-display text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,.6)] ${good ? 'text-yellow-300' : 'text-rose-400'}`}
      style={{ left: x, top: y }}
      initial={{ y: 0, opacity: 0, scale: 0.6 }}
      animate={{ y: -40, opacity: [0, 1, 1, 0], scale: 1 }}
      transition={{ duration: 1.1, times: [0, 0.15, 0.7, 1] }}
    >
      {text}
    </motion.div>
  )
}

function Hand({ who, cx, cy, size }: { who: Who; cx: number; cy: number; size: number }) {
  const fromAi = who === 'ai'
  const dir = fromAi ? -1 : 1
  const h = size * 1.3
  // 손바닥 중앙(높이의 약 55%)이 종 위에 오도록
  const rest = fromAi ? cy - h * 0.45 : cy - h * 0.55
  const away = rest + dir * 240
  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-[500]"
      style={{ rotate: fromAi ? 180 : 0 }}
      initial={{ x: cx - size / 2, y: away, opacity: 0 }}
      animate={{ y: [away, rest + dir * 6, rest + dir * 6, away], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.85, times: [0, 0.14, 0.6, 1], ease: 'easeOut' }}
    >
      <HandArt
        width={size}
        sleeve={fromAi ? '#868E96' : '#339AF0'}
        sleeveDark={fromAi ? '#495057' : '#1C7ED6'}
      />
    </motion.div>
  )
}

// 내 차례 제한시간: 덱 둘레를 따라 줄어드는 테두리
function TurnTimer({ width, height, limit }: { width: number; height: number; limit: number }) {
  const pad = 6
  return (
    <svg
      className="pointer-events-none absolute overflow-visible"
      style={{ left: -pad, top: 14 - 10 - pad, width: width + pad * 2, height: height + pad * 2 }}
    >
      <rect
        x={0}
        y={0}
        width={width + pad * 2}
        height={height + pad * 2}
        rx={width * 0.12 + pad}
        fill="none"
        stroke="rgba(0,0,0,.35)"
        strokeWidth={5}
      />
      <motion.rect
        x={0}
        y={0}
        width={width + pad * 2}
        height={height + pad * 2}
        rx={width * 0.12 + pad}
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        initial={{ strokeDashoffset: 0, stroke: '#fde047' }}
        animate={{ strokeDashoffset: -1, stroke: ['#fde047', '#fde047', '#fb923c', '#f43f5e'] }}
        transition={{ duration: limit / 1000, ease: 'linear', stroke: { duration: limit / 1000, times: [0, 0.5, 0.75, 1] } }}
      />
    </svg>
  )
}

// 종을 칠 때 찍히는 큰 글자
function Stamp({ valid, x, y }: { valid: boolean; x: number; y: number }) {
  return (
    <motion.div
      className={`pointer-events-none absolute z-[520] -translate-x-1/2 -translate-y-1/2 font-display text-7xl ${
        valid ? 'text-yellow-300' : 'text-rose-500'
      } [text-shadow:0_4px_0_rgba(0,0,0,.45),0_0_24px_rgba(0,0,0,.35)]`}
      style={{ left: x, top: y }}
      initial={{ scale: 2.6, opacity: 0, rotate: -14 }}
      animate={{ scale: [2.6, 0.9, 1], opacity: [0, 1, 1, 0], rotate: -8 }}
      transition={{ duration: 0.7, times: [0, 0.18, 0.3, 1] }}
    >
      {valid ? '탁!' : '땡!'}
    </motion.div>
  )
}

const TABLE_VARIANTS: Variants = {
  idle: { x: 0, scale: 1 },
  hit: { x: 0, scale: [1, 1.04, 1], transition: { duration: 0.32 } },
  shake: { x: [0, -12, 12, -8, 8, -3, 0], scale: [1, 1.025, 1], transition: { duration: 0.45 } },
}

interface TableProps {
  state: GameState
  canFlip: boolean
  turnLimit: number
  danger: boolean
  heartRate: number
  onFlip: () => void
  onRing: () => void
}

const SEATS: Who[] = ['player', 'ai']

export default function Table({ state, canFlip, turnLimit, danger, heartRate, onFlip, onRing }: TableProps) {
  const [ref, { width: w, height: h }] = useElementSize()
  const { decks, piles, phase, result, turn, lock } = state

  const ready = w > 0 && h > 0
  const cardW = Math.min(w * 0.33, (h * 0.25) / 1.4, 150)
  const cardH = cardW * 1.4
  const labelGap = 40
  const aiY = labelGap + cardH / 2
  const plY = h - labelGap - cardH / 2
  const center = { x: w / 2, y: h / 2 }
  const bellSize = Math.min(118, w * 0.3, h * 0.17)

  // AI는 맞은편에 앉아 있으므로 좌우가 반대
  const slots: Record<Who, { deck: Point; pile: Point }> = {
    ai: { deck: { x: w * 0.71, y: aiY }, pile: { x: w * 0.29, y: aiY } },
    player: { deck: { x: w * 0.29, y: plY }, pile: { x: w * 0.71, y: plY } },
  }

  const showing = result !== null && !result.resolved
  const glowFor = (card: Card): Glow | null => {
    if (!showing) return null
    if (!result.valid) return 'red'
    return card.fruit === result.fruit ? 'gold' : null
  }

  const placed: PlacedCard[] = []
  for (const who of SEATS) {
    const deck = decks[who]
    const n = deck.length
    deck.forEach((card, i) => {
      const depth = n - 1 - i // 맨 위 카드(i=0)가 가장 높이 쌓임
      placed.push({
        card,
        x: slots[who].deck.x,
        y: slots[who].deck.y - Math.min(depth, 30) * 0.45,
        rot: 0,
        z: n - i,
        faceUp: false,
        lift: who === 'player' && i === 0 && canFlip,
        dealIndex: (who === 'player' ? 0 : 1) + i * 2,
      })
    })
    const pile = piles[who]
    pile.forEach((card, i) => {
      placed.push({
        card,
        x: slots[who].pile.x + card.dx,
        y: slots[who].pile.y + card.dy,
        rot: card.rot,
        z: 100 + i,
        faceUp: true,
        glow: i === pile.length - 1 ? glowFor(card) : null,
      })
    })
  }
  // DOM 순서를 고정해 카드가 이동해도 다시 마운트되지 않도록
  placed.sort((a, b) => a.card.id - b.card.id)

  const toast = result ? resultToast(result) : null
  const deckTop = (who: Who) => slots[who].deck.y + cardH / 2 + 6
  const playing = phase === 'playing'
  const pot = piles.player.length + piles.ai.length
  const speed = tempo(state.flips)
  const aiChance = playing && decks.ai.length <= DANGER_CARDS
  const timedOut = state.autoFlipId === state.flipId

  return (
    <motion.div
      ref={ref}
      className="relative flex-1 overflow-hidden rounded-[28px] border-[10px] border-[#5b3216] bg-[radial-gradient(ellipse_at_center,#1f8a5b_0%,#136b45_55%,#0b4a30_100%)] shadow-[inset_0_0_60px_rgba(0,0,0,.55),0_10px_30px_rgba(0,0,0,.5)]"
      variants={TABLE_VARIANTS}
      initial="idle"
      animate={showing ? (result.valid ? 'hit' : 'shake') : 'idle'}
    >
      {/* 펠트 질감 */}
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[repeating-radial-gradient(circle_at_30%_30%,rgba(255,255,255,.06)_0_1px,transparent_1px_3px)]" />

      {ready && (
        <>
          {/* 자리 표시 */}
          {SEATS.flatMap((who) =>
            (['deck', 'pile'] as const).map((kind) => (
              <div
                key={`${who}-${kind}`}
                className="absolute rounded-[12%] border-2 border-dashed border-white/15"
                style={{
                  left: slots[who][kind].x - cardW / 2,
                  top: slots[who][kind].y - cardH / 2,
                  width: cardW,
                  height: cardH,
                }}
              />
            )),
          )}

          {/* 이름표 */}
          <div className="absolute inset-x-0 top-2 z-[450] flex justify-center">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 pb-1 pt-1.5 font-display text-base leading-none text-white ring-1 transition ${
                turn === 'ai' && !lock && phase === 'playing' ? 'bg-sky-600 ring-sky-300' : 'bg-black/35 ring-white/10'
              }`}
            >
              <Bot size={17} strokeWidth={2.5} className="-mt-0.5" />
              AI
              {aiChance && (
                <motion.span
                  className="rounded-full bg-yellow-300 px-1.5 pb-0.5 pt-1 text-xs leading-none text-emerald-950"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  마무리 찬스!
                </motion.span>
              )}
              {turn === 'ai' && !lock && phase === 'playing' && (
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-white"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-2 z-[450] flex justify-center">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 pb-1 pt-1.5 font-display text-base leading-none ring-1 transition ${
                canFlip ? 'bg-yellow-300 text-emerald-950 ring-yellow-100' : 'bg-black/35 text-white ring-white/10'
              }`}
            >
              <User size={17} strokeWidth={2.5} className="-mt-0.5" />
              {canFlip ? '내 차례! 덱을 탭하세요' : '나'}
              {danger && (
                <motion.span
                  className="rounded-full bg-rose-600 px-1.5 pb-0.5 pt-1 text-xs leading-none text-white"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: heartRate / 1000 }}
                >
                  위기!
                </motion.span>
              )}
            </div>
          </div>

          {/* 카드 */}
          {placed.map((p) => (
            <TableCard
              key={p.card.id}
              {...p}
              width={cardW}
              height={cardH}
              origin={center}
              delay={phase === 'dealing' ? (p.dealIndex ?? 0) * DEAL_STEP : 0}
            />
          ))}

          {/* 덱 장수 */}
          {phase !== 'dealing' && (
            <>
              <CountBadge x={slots.ai.deck.x} y={slots.ai.deck.y + cardH / 2 + 4} count={decks.ai.length} />
              <CountBadge x={slots.player.deck.x} y={slots.player.deck.y - cardH / 2 - 26} count={decks.player.length} />
            </>
          )}

          {/* 내 덱 탭 영역 */}
          <button
            type="button"
            aria-label="카드 뒤집기"
            disabled={!canFlip}
            onClick={onFlip}
            className="absolute z-[400] cursor-pointer rounded-[12%] outline-none disabled:cursor-default"
            style={{
              left: slots.player.deck.x - cardW / 2,
              top: slots.player.deck.y - cardH / 2 - 14,
              width: cardW,
              height: cardH + 14,
            }}
          >
            {canFlip && <TurnTimer key={state.flipId} width={cardW} height={cardH} limit={turnLimit} />}
          </button>

          {/* 시간 초과 */}
          {timedOut && (
            <motion.div
              key={`timeout-${state.flipId}`}
              className="pointer-events-none absolute z-[470] flex -translate-x-1/2 items-center gap-1 rounded-full bg-rose-600 px-2.5 pb-1 pt-1.5 font-display text-sm leading-none text-white"
              style={{ left: slots.player.deck.x, top: slots.player.deck.y - cardH / 2 - 34 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 1, 0], y: -10 }}
              transition={{ duration: 1.3, times: [0, 0.1, 0.75, 1] }}
            >
              <AlarmClock size={14} />
              시간 초과!
            </motion.div>
          )}

          {/* 템포 */}
          {playing && speed >= 1.1 && (
            <motion.div
              key={speed.toFixed(1)}
              className={`absolute left-2 top-2 z-[450] flex items-center gap-1 rounded-full px-2.5 pb-1 pt-1.5 font-display text-sm leading-none text-white ring-1 ${
                speed >= 1.4 ? 'bg-rose-600 ring-rose-300' : 'bg-orange-500 ring-orange-200'
              }`}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Gauge size={14} className="-mt-0.5" />x{speed.toFixed(1)}
            </motion.div>
          )}

          {/* 판돈 */}
          <AnimatePresence>
            {pot > 0 && !showing && (
              <motion.div
                className="pointer-events-none absolute z-[310] -translate-x-1/2"
                style={{ left: center.x, top: center.y - bellSize / 2 - 34 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
              >
                <motion.div
                  key={pot}
                  className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 pb-1 pt-1.5 font-display text-sm leading-none ring-1 ${
                    pot >= HUGE_POT
                      ? 'bg-rose-600 text-white ring-rose-300 shadow-[0_0_22px_6px_rgba(244,63,94,.6)]'
                      : pot >= BIG_POT
                        ? 'bg-orange-500 text-white ring-orange-200 shadow-[0_0_16px_4px_rgba(251,146,60,.5)]'
                        : 'bg-black/40 text-white ring-white/10'
                  }`}
                  initial={{ scale: 1.35 }}
                  animate={pot >= HUGE_POT ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={
                    pot >= HUGE_POT
                      ? { repeat: Infinity, duration: heartRate / 1000 }
                      : { type: 'spring', stiffness: 500, damping: 14 }
                  }
                >
                  {pot >= BIG_POT ? <Flame size={14} className="-mt-0.5" /> : <Layers size={14} className="-mt-0.5" />}
                  판돈 {pot}장{pot >= HUGE_POT && '!'}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 콤보 / 간발의 차 */}
          {showing && result.who === 'player' && result.valid && (
            <div
              className="pointer-events-none absolute inset-x-0 z-[515] flex justify-center gap-2"
              style={{ top: center.y - bellSize / 2 - 40 }}
            >
              {result.margin != null && (
                <motion.div
                  className="flex items-center gap-1 rounded-full bg-sky-500 px-3 pb-1 pt-1.5 font-display text-base leading-none text-white ring-2 ring-white shadow-lg"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: -4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 12, delay: 0.1 }}
                >
                  <Timer size={16} className="-mt-0.5" />
                  간발의 차!
                </motion.div>
              )}
              {result.combo >= 2 && (
                <motion.div
                  className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-3 pb-1 pt-1.5 font-display text-base leading-none text-white ring-2 ring-yellow-200 shadow-lg"
                  initial={{ scale: 0, rotate: 10 }}
                  animate={{ scale: [0, 1.25, 1], rotate: 4 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <Flame size={16} className="-mt-0.5" />
                  {result.combo} COMBO
                </motion.div>
              )}
            </div>
          )}

          {/* 위기 모드: 화면 가장자리가 심장박동처럼 붉게 */}
          {danger && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-[285] shadow-[inset_0_0_70px_20px_rgba(225,29,72,.75)]"
              animate={{ opacity: [0.35, 1, 0.5, 0.9, 0.35] }}
              transition={{ repeat: Infinity, duration: heartRate / 1000, times: [0, 0.12, 0.3, 0.42, 1] }}
            />
          )}

          {/* 종 */}
          <div
            className="absolute z-[300]"
            style={{ left: center.x - bellSize / 2, top: center.y - bellSize / 2 }}
          >
            <Bell
              size={bellSize}
              ringCount={state.ringCount}
              disabled={phase !== 'playing' || lock}
              onRing={onRing}
            />
          </div>

          {/* 종을 치는 손 + 큰 글자 */}
          {result && <Hand key={state.ringCount} who={result.who} cx={center.x} cy={center.y} size={bellSize * 0.75} />}
          {showing && <Stamp key={`stamp-${state.ringCount}`} valid={result.valid} x={center.x} y={center.y} />}

          {/* 카드 획득/손실 표시 */}
          {result?.resolved && result.gained > 0 && (
            <div key={`gain-${state.ringCount}`}>
              {result.valid ? (
                <GainChip
                  x={slots[result.who].deck.x}
                  y={result.who === 'ai' ? deckTop('ai') : slots.player.deck.y - cardH / 2 - 30}
                  text={`+${result.gained}`}
                  good={result.who === 'player'}
                />
              ) : (
                <>
                  <GainChip x={slots.player.deck.x} y={slots.player.deck.y - cardH / 2 - 30} text={result.who === 'player' ? '-1' : '+1'} good={result.who !== 'player'} />
                  <GainChip x={slots.ai.deck.x} y={deckTop('ai')} text={result.who === 'ai' ? '-1' : '+1'} good={result.who === 'ai'} />
                </>
              )}
            </div>
          )}

          {/* 결과 토스트 */}
          <div
            className="pointer-events-none absolute inset-x-0 z-[480] flex justify-center px-3"
            style={{ top: center.y + bellSize / 2 + 8 }}
          >
            <AnimatePresence>
              {toast && (
                <motion.div
                  key={state.ringCount}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className={`rounded-2xl px-4 py-2 text-center shadow-lg ${
                    toast.tone === 'good' ? 'bg-yellow-300 text-emerald-950' : 'bg-rose-600 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 font-display text-xl leading-tight">{toast.title}</div>
                  {toast.sub && (
                    <div className="flex items-center justify-center gap-1 text-xs font-semibold opacity-85">{toast.sub}</div>
                  )}
                </motion.div>
              )}
              {phase === 'dealing' && (
                <motion.div
                  key="dealing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-full bg-black/40 px-4 pb-1.5 pt-2 font-display text-base leading-none text-white"
                >
                  카드를 나누는 중…
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 정답/오답 화면 플래시 */}
          <AnimatePresence>
            {showing && (
              <motion.div
                key={`flash-${state.ringCount}`}
                className={`pointer-events-none absolute inset-0 z-[290] ${
                  result.valid
                    ? 'bg-[radial-gradient(circle_at_center,rgba(253,224,71,.35),transparent_60%)]'
                    : 'bg-rose-600/25'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.6] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}
