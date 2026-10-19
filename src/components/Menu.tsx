import { BookOpen, ChevronDown, CircleHelp, Rabbit, Sparkles, Turtle, Zap, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { DIFFICULTIES } from '../game/ai'
import { FAQ, SITE } from '../seo/content'
import type { Difficulty, FruitId } from '../game/types'
import { BellMark } from './Icons'
import { CardFront } from './TableCard'

const FAN: { id: string; fruit: FruitId; count: number }[] = [
  { id: 'a', fruit: 'strawberry', count: 2 },
  { id: 'b', fruit: 'banana', count: 5 },
  { id: 'c', fruit: 'grape', count: 3 },
]

const LEVEL_STYLE: Record<Difficulty, { Icon: LucideIcon; speed: number; badge: string }> = {
  easy: { Icon: Turtle, speed: 1, badge: 'bg-lime-100 text-lime-700 ring-lime-300' },
  normal: { Icon: Rabbit, speed: 2, badge: 'bg-sky-100 text-sky-700 ring-sky-300' },
  hard: { Icon: Zap, speed: 3, badge: 'bg-rose-100 text-rose-600 ring-rose-300' },
}

function LevelBadge({ level }: { level: Difficulty }) {
  const { Icon, badge } = LEVEL_STYLE[level]
  return (
    <span className={`grid size-12 place-items-center rounded-xl ring-2 ${badge}`}>
      <Icon size={26} strokeWidth={2.4} />
    </span>
  )
}

const LEVELS = Object.entries(DIFFICULTIES) as [Difficulty, (typeof DIFFICULTIES)[Difficulty]][]

export default function Menu({ onStart }: { onStart: (level: Difficulty) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-6 text-center text-white">
      {/* 카드 부채 */}
      <div className="relative mt-2 h-36 w-56">
        {FAN.map((card, i) => (
          <motion.div
            key={card.id}
            className="absolute left-1/2 top-0 h-32 w-[92px]"
            style={{ marginLeft: -46, originY: 1.1 }}
            initial={{ rotate: 0, y: 30, opacity: 0 }}
            animate={{ rotate: (i - 1) * 16, y: i === 1 ? -6 : 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 + i * 0.08 }}
          >
            <CardFront card={card} width={92} />
          </motion.div>
        ))}
      </div>

      <div>
        <motion.h1
          className="flex items-center justify-center gap-2 whitespace-nowrap font-display text-5xl leading-none text-[#fff4d6] drop-shadow-[0_4px_0_#7a3e14] sm:text-6xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.span
            className="inline-block"
            animate={{ rotate: [0, -18, 14, -8, 0] }}
            transition={{ duration: 0.7, delay: 0.6, repeat: Infinity, repeatDelay: 2.4 }}
          >
            <BellMark size={52} />
          </motion.span>
          오감 브레인
        </motion.h1>
        <p className="mt-3 inline-block rounded-full bg-amber-300 px-4 pb-1 pt-1.5 font-display text-lg leading-none text-[#5b3216]">
          AI와 겨루는 반응속도 두뇌게임
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {LEVELS.map(([key, d], i) => (
          <motion.button
            key={key}
            type="button"
            onClick={() => onStart(key)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex cursor-pointer items-center gap-4 rounded-2xl bg-[#fffdf6] px-5 py-3.5 text-left text-emerald-950 shadow-[0_5px_0_#c9b98f]"
          >
            <LevelBadge level={key} />
            <span className="flex-1">
              <span className="block font-display text-xl leading-tight">{d.label}</span>
              <span className="text-sm text-emerald-900/70">{d.desc}</span>
            </span>
            <span className="flex items-end gap-0.5" aria-hidden>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`w-1.5 rounded-sm ${n <= LEVEL_STYLE[key].speed ? 'bg-rose-500' : 'bg-emerald-900/15'}`}
                  style={{ height: 6 + n * 5 }}
                />
              ))}
            </span>
          </motion.button>
        ))}
      </div>

      <details className="group w-full rounded-2xl bg-black/25 p-4 text-left text-sm leading-relaxed">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-display text-base [&::-webkit-details-marker]:hidden">
          <BookOpen size={18} />
          게임 방법
          <ChevronDown size={18} className="ml-auto transition group-open:rotate-180" />
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-white/90">
          <li>번갈아 가며 내 덱을 탭해서 카드를 한 장씩 뒤집어요.</li>
          <li>
            펼쳐진 카드에서 한 과일의 합이 <b className="text-amber-200">정확히 5개</b>가 되면 종을 쳐요!
          </li>
          <li>먼저 친 사람이 펼쳐진 카드를 모두 가져가요.</li>
          <li>잘못 치면 상대에게 카드 1장을 줘요.</li>
          <li>내 차례에 뒤집을 카드가 없으면 패배!</li>
        </ul>
      </details>

      {/* 소개 + 자주 묻는 질문 (검색엔진이 읽는 본문이기도 함) */}
      <section className="w-full space-y-3 text-left text-sm leading-relaxed text-white/85">
        <h2 className="flex items-center gap-2 font-display text-base text-[#fff4d6]">
          <Sparkles size={18} />
          {SITE.name}은 어떤 게임?
        </h2>
        <p>{SITE.description}</p>

        <h2 className="flex items-center gap-2 pt-2 font-display text-base text-[#fff4d6]">
          <CircleHelp size={18} />
          자주 묻는 질문
        </h2>
        <div className="space-y-2">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-xl bg-black/20 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-white [&::-webkit-details-marker]:hidden">
                <h3 className="flex-1">{q}</h3>
                <ChevronDown size={16} className="shrink-0 transition group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-white/80">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="pb-2 text-xs text-white/45">
        © {SITE.name} · 설치 없이 즐기는 무료 미니게임
      </footer>
    </div>
  )
}
