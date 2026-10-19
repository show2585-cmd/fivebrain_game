// Web Audio로 합성하는 효과음 (사운드 파일 없음)
let ctx: AudioContext | null = null
let muted = false
let noiseBuffer: AudioBuffer | null = null

try {
  muted = localStorage.getItem('ogam-muted') === '1'
} catch {
  // 저장소 접근 불가 시 기본값 사용
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  try {
    localStorage.setItem('ogam-muted', value ? '1' : '0')
  } catch {
    // 무시
  }
}

// 브라우저 정책상 사용자 제스처 안에서 한 번 호출해야 소리가 남
export function unlockAudio(): void {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

// 소리를 낼 수 있으면 AudioContext, 아니면 null
function audio(): AudioContext | null {
  return ctx && !muted ? ctx : null
}

function getNoise(ac: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

function envGain(ac: AudioContext, start: number, peak: number, duration: number): GainNode {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(peak, start + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  g.connect(ac.destination)
  return g
}

function osc(ac: AudioContext, type: OscillatorType, freq: number, start: number, duration: number, peak: number) {
  const o = ac.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  o.connect(envGain(ac, start, peak, duration))
  o.start(start)
  o.stop(start + duration + 0.05)
}

function swish(ac: AudioContext, start: number, peak = 0.35, freq = 2800) {
  const src = ac.createBufferSource()
  src.buffer = getNoise(ac)
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(freq, start)
  filter.frequency.exponentialRampToValueAtTime(freq * 0.5, start + 0.09)
  filter.Q.value = 0.9
  src.connect(filter).connect(envGain(ac, start, peak, 0.09))
  src.start(start)
  src.stop(start + 0.12)
}

export const sfx = {
  // 탁상용 호출벨: 비조화 배음 + 긴 감쇠
  ding() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    const base = 1760
    const partials: [ratio: number, peak: number, dur: number][] = [
      [1, 0.35, 1.8],
      [2.76, 0.16, 1.1],
      [5.4, 0.08, 0.6],
      [8.93, 0.04, 0.35],
    ]
    for (const [ratio, peak, dur] of partials) osc(ac, 'sine', base * ratio, t, dur, peak)
    swish(ac, t, 0.15, 6000) // 타격음
  },
  // 종을 내려칠 때의 묵직한 타격음
  impact() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    const o = ac.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(140, t)
    o.frequency.exponentialRampToValueAtTime(40, t + 0.25)
    o.connect(envGain(ac, t, 0.6, 0.3))
    o.start(t)
    o.stop(t + 0.35)
  },
  // 두근-두근
  heartbeat() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    for (const [delay, peak] of [
      [0, 0.55],
      [0.17, 0.4],
    ]) {
      const o = ac.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(70, t + delay)
      o.frequency.exponentialRampToValueAtTime(38, t + delay + 0.14)
      o.connect(envGain(ac, t + delay, peak, 0.16))
      o.start(t + delay)
      o.stop(t + delay + 0.2)
    }
  },
  // 제한시간 째깍
  tick(urgent = false) {
    const ac = audio()
    if (!ac) return
    osc(ac, 'square', urgent ? 2200 : 1600, ac.currentTime, 0.035, 0.07)
  },
  // 콤보가 높을수록 높은 음
  combo(n: number) {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    const base = 660 * Math.pow(2, Math.min(n - 2, 6) / 12)
    ;[1, 1.25, 1.5, 2].forEach((r, i) => osc(ac, 'triangle', base * r, t + i * 0.055, 0.18, 0.18))
  },
  flip() {
    const ac = audio()
    if (!ac) return
    swish(ac, ac.currentTime)
  },
  deal(count = 14) {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    for (let i = 0; i < count; i++) swish(ac, t + i * 0.1, 0.15, 2400 + Math.random() * 800)
  },
  collect(count: number) {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    for (let i = 0; i < Math.min(count, 8); i++) swish(ac, t + i * 0.045, 0.25, 2000 + i * 150)
  },
  buzz() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    osc(ac, 'square', 110, t, 0.35, 0.12)
    osc(ac, 'square', 116, t, 0.35, 0.1)
  },
  win() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => osc(ac, 'triangle', f, t + i * 0.12, 0.4, 0.25))
  },
  lose() {
    const ac = audio()
    if (!ac) return
    const t = ac.currentTime
    ;[392, 330, 262].forEach((f, i) => osc(ac, 'triangle', f, t + i * 0.18, 0.45, 0.22))
  },
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // 미지원 기기
  }
}
