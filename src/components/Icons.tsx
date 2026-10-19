// 직접 그린 일러스트 아이콘 (기기마다 모양이 다른 이모지 대신 사용)
import type { FruitId } from '../game/types'

const STROKE = { strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

function Banana() {
  return (
    <>
      <path
        d="M12 16c-3 16 6 34 28 40 6 1.6 12 .5 14-2 1-1.4 0-2.6-1.6-2.8C34 48 22 36 20 17c-.3-3-7.5-4-8-1z"
        fill="#FFD43B"
        stroke="#B7791F"
        {...STROKE}
      />
      <path d="M20 21c2 13 10 23 25 29" fill="none" stroke="#F59F00" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <path d="M11 17l.5-6.5 6.5 1-1 6.5z" fill="#7C4A1E" stroke="#5C3714" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 24c0 8 3 15 8 20" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    </>
  )
}

const SEEDS = [
  [24, 30], [32, 28], [40, 30], [20, 38], [28, 37], [36, 37], [44, 38], [25, 45], [32, 46], [39, 45], [32, 53],
]

function Strawberry() {
  return (
    <>
      <path
        d="M32 58C17 50 9 37 11 27c2-8 10-10 21-6 11-4 19-2 21 6 2 10-6 23-21 31z"
        fill="#F03E3E"
        stroke="#A61E1E"
        {...STROKE}
      />
      {SEEDS.map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.3" ry="2" fill="#FFE066" />
      ))}
      <ellipse cx="19" cy="31" rx="2.5" ry="5.5" fill="#fff" opacity="0.45" transform="rotate(20 19 31)" />
      <path
        d="M32 26 21 19h7l-3-8 7 5 7-5-3 8h7z"
        fill="#51CF66"
        stroke="#2B8A3E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </>
  )
}

function Lemon() {
  return (
    <>
      <path
        d="M7 34c0-3 2-5 4-6 4-9 12-14 21-14s17 5 21 14c2 1 4 3 4 6s-2 5-4 6c-4 9-12 14-21 14s-17-5-21-14c-2-1-4-3-4-6z"
        fill="#FCC419"
        stroke="#B08900"
        {...STROKE}
      />
      <ellipse cx="22" cy="27" rx="7" ry="3" fill="#fff" opacity="0.55" transform="rotate(-20 22 27)" />
      <circle cx="26" cy="38" r="1" fill="#E8A800" />
      <circle cx="38" cy="42" r="1" fill="#E8A800" />
      <circle cx="42" cy="32" r="1" fill="#E8A800" />
      <path d="M33 14c2-6 8-9 15-8-1 6-8 10-15 8z" fill="#51CF66" stroke="#2B8A3E" strokeWidth="2" strokeLinejoin="round" />
    </>
  )
}

const BERRIES = [
  [20, 25], [32, 25], [44, 25], [20, 40], [44, 40], [26, 36], [38, 36], [32, 47],
]

function Grape() {
  return (
    <>
      <path d="M32 18V8" stroke="#7C4A1E" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 11c4-5 11-6 16-3-3 5-10 6-16 3z" fill="#51CF66" stroke="#2B8A3E" strokeWidth="2" strokeLinejoin="round" />
      {BERRIES.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="7.5" fill="#9775FA" stroke="#5F3DC4" strokeWidth="2.2" />
          <circle cx={x - 2.5} cy={y - 2.5} r="2" fill="#fff" opacity="0.55" />
        </g>
      ))}
    </>
  )
}

const FRUIT_ART: Record<FruitId, () => React.JSX.Element> = { banana: Banana, strawberry: Strawberry, lemon: Lemon, grape: Grape }

interface IconProps {
  size?: number
  className?: string
}

export function FruitIcon({ fruit, size = 24, className = '' }: IconProps & { fruit: FruitId }) {
  const Art = FRUIT_ART[fruit]
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <Art />
    </svg>
  )
}

// 로고/카드 뒷면용 종 마크
export function BellMark({ size = 24, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <rect x="5" y="49" width="54" height="8" rx="4" fill="#8B4A1C" stroke="#4A2509" strokeWidth="2.5" />
      <path d="M10 50Q10 21 32 19q22 2 22 31z" fill="#FCC419" stroke="#B08900" {...STROKE} />
      <rect x="29" y="11" width="6" height="9" rx="2" fill="#868E96" stroke="#495057" strokeWidth="2" />
      <ellipse cx="32" cy="10" rx="7" ry="3.5" fill="#FCC419" stroke="#B08900" strokeWidth="2" />
      <ellipse cx="22" cy="33" rx="3.5" ry="8" fill="#fff" opacity="0.55" transform="rotate(25 22 33)" />
    </svg>
  )
}

// 종을 내려치는 손 (손가락이 위를 향함)
interface HandArtProps {
  width: number
  sleeve?: string
  sleeveDark?: string
}

export function HandArt({ width, sleeve = '#339AF0', sleeveDark = '#1C7ED6' }: HandArtProps) {
  const skin = { fill: '#FFD8A8', stroke: '#C2803C', strokeWidth: 3, strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 100 130" width={width} height={width * 1.3} aria-hidden className="drop-shadow-[0_6px_6px_rgba(0,0,0,.35)]">
      <rect x="2" y="56" width="16" height="38" rx="8" transform="rotate(-32 10 75)" {...skin} />
      <rect x="21" y="14" width="15" height="52" rx="7.5" {...skin} />
      <rect x="37" y="5" width="15" height="60" rx="7.5" {...skin} />
      <rect x="53" y="9" width="15" height="56" rx="7.5" {...skin} />
      <rect x="69" y="22" width="14" height="44" rx="7" {...skin} />
      <rect x="18" y="48" width="67" height="58" rx="24" {...skin} />
      <path d="M30 60h0M46 58h0M62 60h0" stroke="#E8A87C" strokeWidth="3" strokeLinecap="round" />
      <rect x="20" y="100" width="63" height="28" rx="6" fill={sleeve} stroke={sleeveDark} strokeWidth="3" />
      <path d="M20 108h63" stroke={sleeveDark} strokeWidth="3" />
    </svg>
  )
}
