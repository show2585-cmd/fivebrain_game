import { motion, type Transition } from 'motion/react'
import { FRUIT_BY_ID } from '../game/deck'
import type { Card, FruitId } from '../game/types'
import { BellMark, FruitIcon } from './Icons'

// 3×3 칸 중 과일을 놓을 위치 (주사위 배치)
const LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
}

const FRAME: Record<FruitId, string> = {
  banana: 'border-yellow-400 bg-yellow-50',
  strawberry: 'border-rose-400 bg-rose-50',
  lemon: 'border-lime-400 bg-lime-50',
  grape: 'border-violet-400 bg-violet-50',
}

export type Glow = 'gold' | 'red'

const GLOW: Record<Glow, string> = {
  gold: 'shadow-[0_0_0_3px_#fde047,0_0_28px_8px_rgba(253,224,71,.85)]',
  red: 'shadow-[0_0_0_3px_#f43f5e,0_0_24px_6px_rgba(244,63,94,.7)]',
}

const SPRING: Transition = { type: 'spring', stiffness: 240, damping: 26, mass: 0.9 }

export function CardFront({ card, width }: { card: Pick<Card, 'fruit' | 'count'>; width: number }) {
  const fruit = FRUIT_BY_ID[card.fruit]
  const spots = LAYOUTS[card.count]
  return (
    <div className="absolute inset-0 rounded-[12%] bg-[#fffdf6] p-[6%] shadow-[0_2px_6px_rgba(0,0,0,.35)] backface-hidden">
      <div
        className={`grid h-full grid-cols-3 grid-rows-3 place-items-center rounded-[10%] border-2 ${FRAME[card.fruit]}`}
        aria-label={`${fruit.name} ${card.count}개`}
      >
        {Array.from({ length: 9 }, (_, i) =>
          spots.includes(i) ? (
            <FruitIcon key={i} fruit={card.fruit} size={width * 0.3} className="drop-shadow-[0_1px_1px_rgba(0,0,0,.2)]" />
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  )
}

export function CardBack({ width }: { width: number }) {
  return (
    <div className="absolute inset-0 rounded-[12%] border-[3px] border-amber-200 bg-rose-700 shadow-[0_2px_6px_rgba(0,0,0,.35)] backface-hidden rotate-y-180">
      <div className="absolute inset-[7%] grid place-items-center rounded-[9%] border border-amber-200/60 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.1)_0_6px,transparent_6px_12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.1)_0_6px,transparent_6px_12px)]">
        <div className="grid aspect-square w-[54%] place-items-center rounded-full border-2 border-amber-200 bg-rose-800 shadow-inner">
          <BellMark size={width * 0.34} />
        </div>
      </div>
    </div>
  )
}

export interface TableCardProps {
  card: Card
  x: number
  y: number
  rot: number
  z: number
  faceUp: boolean
  width: number
  height: number
  origin: { x: number; y: number }
  delay: number
  lift?: boolean
  glow?: Glow | null
}

export default function TableCard({
  card,
  x,
  y,
  rot,
  z,
  faceUp,
  width,
  height,
  origin,
  delay,
  lift,
  glow,
}: TableCardProps) {
  return (
    <motion.div
      className="absolute left-0 top-0 transform-3d"
      style={{ width, height, zIndex: z, transformPerspective: 900 }}
      initial={{ x: origin.x - width / 2, y: origin.y - height / 2, rotate: 0, rotateY: 180 }}
      animate={{
        x: x - width / 2,
        y: y - height / 2 - (lift ? 10 : 0),
        rotate: rot,
        rotateY: faceUp ? 0 : 180,
        scale: lift ? 1.04 : 1,
      }}
      transition={{
        default: { ...SPRING, delay },
        rotateY: { duration: 0.45, ease: [0.3, 0.7, 0.4, 1], delay },
      }}
    >
      <CardFront card={card} width={width} />
      <CardBack width={width} />
      {glow && <div className={`pointer-events-none absolute inset-0 rounded-[12%] ${GLOW[glow]}`} />}
    </motion.div>
  )
}
