export class AmbientMusicPlayer {
  private audioContext: AudioContext | null = null
  private oscillators: OscillatorNode[] = []
  private gains: GainNode[] = []
  private masterGain: GainNode | null = null
  private isPlaying = false
  private intervalId: number | null = null
  private volume = 0.3

  private pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]

  init(): void {
    if (this.audioContext) return
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.audioContext.destination)
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
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.oscillators.forEach(osc => {
      try { osc.stop() } catch (e) {}
    })
    this.oscillators = []
    this.gains = []
  }

  private startDrone(): void {
    if (!this.audioContext || !this.masterGain) return

    const baseFreq = 130.81
    const harmonicFreq = 196.00

    const droneOsc1 = this.audioContext.createOscillator()
    const droneGain1 = this.audioContext.createGain()
    droneOsc1.type = 'sine'
    droneOsc1.frequency.value = baseFreq
    droneGain1.gain.value = 0.08
    droneOsc1.connect(droneGain1)
    droneGain1.connect(this.masterGain)
    droneOsc1.start()

    const droneOsc2 = this.audioContext.createOscillator()
    const droneGain2 = this.audioContext.createGain()
    droneOsc2.type = 'sine'
    droneOsc2.frequency.value = harmonicFreq
    droneGain2.gain.value = 0.04
    droneOsc2.connect(droneGain2)
    droneGain2.connect(this.masterGain)
    droneOsc2.start()

    this.oscillators.push(droneOsc1, droneOsc2)
    this.gains.push(droneGain1, droneGain2)

    this.animateDrone(droneGain1, droneGain2)
  }

  private animateDrone(gain1: GainNode, gain2: GainNode): void {
    if (!this.audioContext || !this.isPlaying) return
    const now = this.audioContext.currentTime
    gain1.gain.setValueAtTime(0.08, now)
    gain1.gain.linearRampToValueAtTime(0.12, now + 4)
    gain1.gain.linearRampToValueAtTime(0.08, now + 8)
    
    gain2.gain.setValueAtTime(0.04, now)
    gain2.gain.linearRampToValueAtTime(0.07, now + 5)
    gain2.gain.linearRampToValueAtTime(0.04, now + 10)

    setTimeout(() => this.animateDrone(gain1, gain2), 8000)
  }

  private startMelody(): void {
    if (!this.audioContext || !this.masterGain || !this.isPlaying) return

    const playNote = () => {
      if (!this.audioContext || !this.masterGain || !this.isPlaying) return
      if (Math.random() > 0.7) return

      const freq = this.pentatonicScale[Math.floor(Math.random() * this.pentatonicScale.length)]
      const octaveShift = Math.random() > 0.5 ? 0.5 : 1
      const actualFreq = freq * octaveShift

      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sine'
      osc.frequency.value = actualFreq

      const now = this.audioContext.currentTime
      const attack = 2
      const decay = 4
      const peakGain = 0.04 + Math.random() * 0.03

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(peakGain, now + attack)
      gain.gain.linearRampToValueAtTime(0, now + attack + decay)

      osc.connect(gain)
      gain.connect(this.masterGain)
      osc.start(now)
      osc.stop(now + attack + decay + 0.1)
    }

    playNote()
    this.intervalId = window.setInterval(() => {
      if (this.isPlaying) playNote()
    }, 3500)
  }

  playPluckSound(): void {
    if (!this.audioContext || !this.masterGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const freq = this.pentatonicScale[Math.floor(Math.random() * this.pentatonicScale.length)] * 1.5

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + 0.35)
  }

  playSuccessSound(): void {
    if (!this.audioContext || !this.masterGain) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.audioContext || !this.masterGain) return
        const osc = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const now = this.audioContext.currentTime
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05)
        gain.gain.linearRampToValueAtTime(0, now + 0.5)
        osc.connect(gain)
        gain.connect(this.masterGain)
        osc.start(now)
        osc.stop(now + 0.55)
      }, i * 120)
    })
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
