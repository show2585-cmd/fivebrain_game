import { motion } from 'motion/react'

// 탁상용 호출벨. ringCount가 바뀔 때마다 눌리는 애니메이션과 파동이 재생됨
interface BellProps {
  size: number
  ringCount: number
  disabled: boolean
  onRing: () => void
}

export default function Bell({ size, ringCount, disabled, onRing }: BellProps) {
  const pressed = ringCount > 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {pressed &&
        [0, 0.12].map((delay) => (
          <motion.span
            key={`${ringCount}-${delay}`}
            className="pointer-events-none absolute inset-0 rounded-full border-4 border-yellow-200"
            initial={{ scale: 0.7, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          />
        ))}
      <button
        type="button"
        aria-label="종 치기"
        disabled={disabled}
        onPointerDown={disabled ? undefined : onRing}
        className="relative block size-full cursor-pointer touch-none rounded-full outline-none disabled:cursor-default"
      >
        <svg viewBox="0 0 120 110" className="size-full overflow-visible drop-shadow-[0_8px_8px_rgba(0,0,0,.45)]">
          <defs>
            <linearGradient id="bell-silver" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.45" stopColor="#d4d9e1" />
              <stop offset="1" stopColor="#6b7280" />
            </linearGradient>
            <linearGradient id="bell-wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9a4a1c" />
              <stop offset="1" stopColor="#5a2a0e" />
            </linearGradient>
          </defs>
          {/* 받침 */}
          <ellipse cx="60" cy="96" rx="56" ry="13" fill="#2e1607" />
          <ellipse cx="60" cy="90" rx="56" ry="13" fill="url(#bell-wood)" />
          {/* 버튼(누름쇠) */}
          <motion.g
            key={`plunger-${ringCount}`}
            animate={pressed ? { y: [0, 9, 0] } : { y: 0 }}
            transition={{ duration: 0.28, times: [0, 0.3, 1] }}
          >
            <rect x="55" y="12" width="10" height="22" rx="2" fill="#4b5563" />
            <ellipse cx="60" cy="13" rx="13" ry="6" fill="url(#bell-silver)" stroke="#6b7280" strokeWidth="1" />
          </motion.g>
          {/* 돔 */}
          <motion.g
            key={`dome-${ringCount}`}
            animate={pressed ? { y: [0, 3, 0], rotate: [0, -2, 2, 0] } : { y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ originX: '60px', originY: '86px' }}
          >
            <path d="M12 87 Q12 33 60 30 Q108 33 108 87 Z" fill="url(#bell-silver)" />
            <ellipse cx="60" cy="87" rx="48" ry="7" fill="#9ca3af" />
            <ellipse cx="42" cy="52" rx="9" ry="15" fill="#fff" opacity="0.55" transform="rotate(25 42 52)" />
          </motion.g>
        </svg>
      </button>
    </div>
  )
}
