import { Bot, CircleX, Flame, Hourglass, LayoutGrid, RotateCcw, Target, Timer, Trophy, Zap, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import type { Stats, Who } from '../game/types'

const CONFETTI_COLORS = ['#fde047', '#f43f5e', '#84cc16', '#8b5cf6', '#38bdf8', '#fb923c']

function makeConfetti() {
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.8 + Math.random() * 1.4,
    rotate: Math.random() * 720 - 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }))
}

function Confetti() {
  const [pieces] = useState(makeConfetti)
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 h-3 w-2 rounded-sm"
          style={{ left: `${p.left}%`, backgroundColor: p.color }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: p.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-900/5">
      <div className="flex items-center gap-1 text-xs font-medium text-emerald-900/60">
        <Icon size={13} strokeWidth={2.5} />
        {label}
      </div>
      <div className="font-display text-2xl leading-tight text-emerald-950">{value}</div>
    </div>
  )
}

const sec = (ms: number) => `${(ms / 1000).toFixed(2)}초`

interface GameOverProps {
  winner: Who | null
  stats: Stats
  onRetry: () => void
  onMenu: () => void
}

export default function GameOver({ winner, stats, onRetry, onMenu }: GameOverProps) {
  const won = winner === 'player'
  const { reactions } = stats
  const avg = reactions.length ? reactions.reduce((a, b) => a + b, 0) / reactions.length : null
  const best = reactions.length ? Math.min(...reactions) : null

  return (
    <motion.div
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {won && <Confetti />}
      <motion.div
        className="w-full max-w-sm rounded-3xl bg-[#fffdf6] p-6 text-center shadow-2xl"
        initial={{ scale: 0.7, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <motion.div
          className={`mx-auto grid size-24 place-items-center rounded-full ring-8 ${
            won ? 'bg-amber-300 text-amber-800 ring-amber-100' : 'bg-slate-300 text-slate-700 ring-slate-100'
          }`}
          animate={won ? { rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] } : { y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }}
        >
          {won ? <Trophy size={50} strokeWidth={2.2} /> : <Bot size={50} strokeWidth={2.2} />}
        </motion.div>
        <h2 className="mt-4 font-display text-3xl text-emerald-950">{won ? '승리했어요!' : 'AI가 이겼어요'}</h2>
        <p className="mt-1 text-sm text-emerald-900/70">
          {won ? 'AI가 뒤집을 카드가 없어요.' : '뒤집을 카드가 다 떨어졌어요.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 text-left">
          <Stat icon={Target} label="종 성공" value={`${stats.hits}회`} />
          <Stat icon={CircleX} label="헛종" value={`${stats.falses}회`} />
          <Stat icon={Timer} label="평균 반응속도" value={avg != null ? sec(avg) : '-'} />
          <Stat icon={Zap} label="최고 반응속도" value={best != null ? sec(best) : '-'} />
          <Stat icon={Flame} label="최대 콤보" value={`${stats.bestCombo}콤보`} />
          <Stat icon={Hourglass} label="간발의 차" value={`${stats.photoFinishes}회`} />
        </div>
        <p className="mt-2 text-xs text-emerald-900/60">
          AI: 종 성공 {stats.aiHits}회 · 헛종 {stats.aiFalses}회
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-900/20 pb-2.5 pt-3 font-display text-lg leading-none text-emerald-950 active:scale-95"
          >
            <LayoutGrid size={18} className="-mt-0.5" />
            난이도 선택
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-700 pb-2.5 pt-3 font-display text-lg leading-none text-white shadow-[0_4px_0_#064e3b] active:translate-y-0.5 active:shadow-[0_2px_0_#064e3b]"
          >
            <RotateCcw size={18} className="-mt-0.5" />
            다시 하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
