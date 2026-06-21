import type { ChapterSoundscape } from '@/types'
import { chapterSoundscapes } from '@/data/chapters'

const DEFAULT_SOUNDSCAPE: ChapterSoundscape = {
  droneBase: 130.81,
  droneHarmonic: 196.00,
  droneGain: 0.08,
  harmonicGain: 0.04,
  droneAnimCycle: 8,
  scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
  melodyInterval: 3500,
  melodyAttack: 2,
  melodyDecay: 4,
  melodyPeakGain: 0.04,
  melodySkipChance: 0.3,
  melodyTypes: ['triangle', 'sine'],
  octaveShifts: [0.5, 1],
  pluckFreqMultiplier: 1.5,
  pluckDecay: 0.3,
  successNotes: [523.25, 659.25, 783.99],
  successNoteGap: 120,
  milestoneChime: [523.25, 659.25, 783.99, 1046.50],
  label: '默认'
}

export class AmbientMusicPlayer {
  private audioContext: AudioContext | null = null
  private oscillators: OscillatorNode[] = []
  private gains: GainNode[] = []
  private masterGain: GainNode | null = null
  private isPlaying = false
  private intervalId: number | null = null
  private volume = 0.3
  private currentChapterId: string | null = null
  private currentSoundscape: ChapterSoundscape = DEFAULT_SOUNDSCAPE
  private crossfadeGain: GainNode | null = null
  private droneAnimTimers: number[] = []

  init(): void {
    if (this.audioContext) return
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.audioContext.destination)
      this.crossfadeGain = this.audioContext.createGain()
      this.crossfadeGain.gain.value = 1
      this.crossfadeGain.connect(this.masterGain)
    } catch (e) {
      console.error('Failed to init audio context:', e)
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }
  }

  switchChapter(chapterId: string): void {
    if (this.currentChapterId === chapterId) return
    this.currentChapterId = chapterId
    this.currentSoundscape = chapterSoundscapes[chapterId] || DEFAULT_SOUNDSCAPE

    if (this.isPlaying) {
      this.crossfadeToSoundscape()
    }
  }

  private crossfadeToSoundscape(): void {
    if (!this.crossfadeGain || !this.audioContext) return

    const now = this.audioContext.currentTime
    this.crossfadeGain.gain.setValueAtTime(1, now)
    this.crossfadeGain.gain.linearRampToValueAtTime(0.01, now + 1.5)

    setTimeout(() => {
      this.stopInternal()
      this.startDrone()
      this.startMelody()
      if (this.crossfadeGain && this.audioContext) {
        const t = this.audioContext.currentTime
        this.crossfadeGain.gain.setValueAtTime(0.01, t)
        this.crossfadeGain.gain.linearRampToValueAtTime(1, t + 1.5)
      }
    }, 1500)
  }

  play(): void {
    if (!this.audioContext || this.isPlaying) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    this.isPlaying = true
    this.startDrone()
    this.startMelody()
  }

  stop(): void {
    this.isPlaying = false
    this.stopInternal()
  }

  private stopInternal(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.droneAnimTimers.forEach(id => clearTimeout(id))
    this.droneAnimTimers = []
    this.oscillators.forEach(osc => {
      try { osc.stop() } catch (e) {}
    })
    this.oscillators = []
    this.gains = []
  }

  private startDrone(): void {
    if (!this.audioContext || !this.crossfadeGain) return

    const sc = this.currentSoundscape
    const droneOsc1 = this.audioContext.createOscillator()
    const droneGain1 = this.audioContext.createGain()
    droneOsc1.type = 'sine'
    droneOsc1.frequency.value = sc.droneBase
    droneGain1.gain.value = sc.droneGain
    droneOsc1.connect(droneGain1)
    droneGain1.connect(this.crossfadeGain)
    droneOsc1.start()

    const droneOsc2 = this.audioContext.createOscillator()
    const droneGain2 = this.audioContext.createGain()
    droneOsc2.type = 'sine'
    droneOsc2.frequency.value = sc.droneHarmonic
    droneGain2.gain.value = sc.harmonicGain
    droneOsc2.connect(droneGain2)
    droneGain2.connect(this.crossfadeGain)
    droneOsc2.start()

    this.oscillators.push(droneOsc1, droneOsc2)
    this.gains.push(droneGain1, droneGain2)

    this.animateDrone(droneGain1, droneGain2)
  }

  private animateDrone(gain1: GainNode, gain2: GainNode): void {
    if (!this.audioContext || !this.isPlaying) return
    const sc = this.currentSoundscape
    const now = this.audioContext.currentTime
    const cycle = sc.droneAnimCycle

    gain1.gain.setValueAtTime(sc.droneGain, now)
    gain1.gain.linearRampToValueAtTime(sc.droneGain * 1.5, now + cycle / 2)
    gain1.gain.linearRampToValueAtTime(sc.droneGain, now + cycle)

    gain2.gain.setValueAtTime(sc.harmonicGain, now)
    gain2.gain.linearRampToValueAtTime(sc.harmonicGain * 1.75, now + cycle * 0.625)
    gain2.gain.linearRampToValueAtTime(sc.harmonicGain, now + cycle * 1.25)

    const timer = window.setTimeout(() => this.animateDrone(gain1, gain2), cycle * 1000)
    this.droneAnimTimers.push(timer)
  }

  private startMelody(): void {
    if (!this.audioContext || !this.crossfadeGain || !this.isPlaying) return

    const playNote = () => {
      if (!this.audioContext || !this.crossfadeGain || !this.isPlaying) return
      const sc = this.currentSoundscape
      if (Math.random() < sc.melodySkipChance) return

      const freq = sc.scale[Math.floor(Math.random() * sc.scale.length)]
      const octaveShift = sc.octaveShifts[Math.floor(Math.random() * sc.octaveShifts.length)]
      const actualFreq = freq * octaveShift

      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.type = sc.melodyTypes[Math.floor(Math.random() * sc.melodyTypes.length)]
      osc.frequency.value = actualFreq

      const now = this.audioContext.currentTime
      const attack = sc.melodyAttack
      const decay = sc.melodyDecay
      const peakGain = sc.melodyPeakGain + Math.random() * sc.melodyPeakGain * 0.75

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(peakGain, now + attack)
      gain.gain.linearRampToValueAtTime(0, now + attack + decay)

      osc.connect(gain)
      gain.connect(this.crossfadeGain)
      osc.start(now)
      osc.stop(now + attack + decay + 0.1)
    }

    playNote()
    this.intervalId = window.setInterval(() => {
      if (this.isPlaying) playNote()
    }, this.currentSoundscape.melodyInterval)
  }

  playPluckSound(): void {
    if (!this.audioContext || !this.crossfadeGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const sc = this.currentSoundscape
    const freq = sc.scale[Math.floor(Math.random() * sc.scale.length)] * sc.pluckFreqMultiplier

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + sc.pluckDecay)

    osc.connect(gain)
    gain.connect(this.crossfadeGain)
    osc.start(now)
    osc.stop(now + sc.pluckDecay + 0.05)
  }

  playPlaceSound(): void {
    if (!this.audioContext || !this.crossfadeGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const sc = this.currentSoundscape
    const baseFreq = sc.scale[Math.floor(Math.random() * sc.scale.length)]
    const harmonicFreq = baseFreq * 1.5

    const osc1 = this.audioContext.createOscillator()
    const gain1 = this.audioContext.createGain()
    osc1.type = 'triangle'
    osc1.frequency.value = baseFreq
    const now = this.audioContext.currentTime
    gain1.gain.setValueAtTime(0.08, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc1.connect(gain1)
    gain1.connect(this.crossfadeGain)
    osc1.start(now)
    osc1.stop(now + 0.45)

    const osc2 = this.audioContext.createOscillator()
    const gain2 = this.audioContext.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = harmonicFreq
    gain2.gain.setValueAtTime(0, now)
    gain2.gain.linearRampToValueAtTime(0.04, now + 0.05)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc2.connect(gain2)
    gain2.connect(this.crossfadeGain)
    osc2.start(now)
    osc2.stop(now + 0.55)
  }

  playRemoveSound(): void {
    if (!this.audioContext || !this.crossfadeGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const sc = this.currentSoundscape
    const freq = sc.scale[Math.floor(Math.random() * sc.scale.length)] * 0.75

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain)
    gain.connect(this.crossfadeGain)
    osc.start(now)
    osc.stop(now + 0.25)
  }

  playSnapSound(): void {
    if (!this.audioContext || !this.crossfadeGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const sc = this.currentSoundscape
    const freq = sc.scale[Math.floor(Math.random() * sc.scale.length)] * 2

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.connect(gain)
    gain.connect(this.crossfadeGain)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  playSuccessSound(): void {
    if (!this.audioContext || !this.crossfadeGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const sc = this.currentSoundscape
    sc.successNotes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.audioContext || !this.crossfadeGain) return
        const osc = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const now = this.audioContext.currentTime
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05)
        gain.gain.linearRampToValueAtTime(0, now + 0.5)
        osc.connect(gain)
        gain.connect(this.crossfadeGain)
        osc.start(now)
        osc.stop(now + 0.55)
      }, i * sc.successNoteGap)
    })
  }

  playSaveChime(): void {
    if (!this.audioContext || !this.crossfadeGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const sc = this.currentSoundscape
    const now = this.audioContext.currentTime

    const padOsc = this.audioContext.createOscillator()
    const padGain = this.audioContext.createGain()
    padOsc.type = 'sine'
    padOsc.frequency.value = sc.droneBase * 2
    padGain.gain.setValueAtTime(0, now)
    padGain.gain.linearRampToValueAtTime(0.06, now + 0.3)
    padGain.gain.linearRampToValueAtTime(0, now + 2)
    padOsc.connect(padGain)
    padGain.connect(this.crossfadeGain)
    padOsc.start(now)
    padOsc.stop(now + 2.1)

    sc.successNotes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.audioContext || !this.crossfadeGain) return
        const t = this.audioContext!.currentTime
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.1, t + 0.04)
        gain.gain.linearRampToValueAtTime(0, t + 0.7)
        osc.connect(gain)
        gain.connect(this.crossfadeGain!)
        osc.start(t)
        osc.stop(t + 0.75)
      }, 200 + i * sc.successNoteGap)
    })
  }

  playMilestoneChime(level: 'bronze' | 'silver' | 'gold'): void {
    if (!this.audioContext || !this.crossfadeGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const sc = this.currentSoundscape
    const notes = sc.milestoneChime
    const count = level === 'gold' ? notes.length : level === 'silver' ? Math.min(3, notes.length) : Math.min(2, notes.length)
    const noteGain = level === 'gold' ? 0.1 : level === 'silver' ? 0.08 : 0.06
    const gap = level === 'gold' ? 100 : level === 'silver' ? 120 : 150
    const duration = level === 'gold' ? 0.8 : level === 'silver' ? 0.6 : 0.45

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.audioContext || !this.crossfadeGain) return
        const t = this.audioContext.currentTime
        const osc = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()
        osc.type = 'sine'
        osc.frequency.value = notes[i]
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(noteGain, t + 0.03)
        gain.gain.linearRampToValueAtTime(0, t + duration)
        osc.connect(gain)
        gain.connect(this.crossfadeGain)
        osc.start(t)
        osc.stop(t + duration + 0.05)
      }, i * gap)
    }

    if (level === 'gold') {
      setTimeout(() => {
        if (!this.audioContext || !this.crossfadeGain) return
        const t = this.audioContext.currentTime
        const shimmer = this.audioContext.createOscillator()
        const shimmerGain = this.audioContext.createGain()
        shimmer.type = 'triangle'
        shimmer.frequency.value = sc.droneBase * 4
        shimmerGain.gain.setValueAtTime(0, t)
        shimmerGain.gain.linearRampToValueAtTime(0.04, t + 0.1)
        shimmerGain.gain.linearRampToValueAtTime(0, t + 1.5)
        shimmer.connect(shimmerGain)
        shimmerGain.connect(this.crossfadeGain)
        shimmer.start(t)
        shimmer.stop(t + 1.6)
      }, count * gap)
    }
  }

  getSoundscapeLabel(): string {
    return this.currentSoundscape.label
  }

  destroy(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export const musicPlayer = new AmbientMusicPlayer()
