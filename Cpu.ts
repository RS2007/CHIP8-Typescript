import { appendFileSync, readFileSync } from 'fs'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './constants'
import { Decoder } from './Decoder'
import { font } from './font'
import { Keyboard } from './Keyboard'
import { Monitor } from './Monitor'
import { decoderOut } from './types'

export class Cpu {
	ram: Uint8Array
	registerFile: Uint8Array
	I: number
	stack: Uint16Array
	programCounter: number
	stackPointer: number
	delayTimer: number
	stall: boolean
	soundTimer: number
	monitor: Monitor
	keyboard: Keyboard

	reset() {
		this.ram = new Uint8Array(4096)
		this.registerFile = new Uint8Array(16)
		this.I = 0 //(JALR register)
		// Special Purpose registers
		this.delayTimer = 0
		this.soundTimer = 0
		// pseudo registers
		this.stack = new Uint16Array(16)
		// 16 recursive calls possible
		this.programCounter = 0x200
		this.stackPointer = -1
		this.stall = false
		// monitor
		this.monitor = new Monitor()
		//Keyboard
		this.keyboard = new Keyboard()
	}

	loadROM(romName: string) {
		this.reset()

		font.forEach((e, i) => {
			this.ram[i] = e
		})

		const rom = readFileSync(`roms/${romName}`)
		if (!rom) throw new Error('Rom not found in directory')
		for (let i = 0; i < rom.length; ++i) {
			this.ram[i + 0x200] = rom[i]
		}
	}

	instructionFetch(): number {
		// All instructions are 2 bytes long
		// MSB first(big endian number)
		// first byte of each instruction should be located at even address
		let ins = (this.ram[this.programCounter] << 8) | this.ram[this.programCounter + 1]
		if (this.ram[this.programCounter] === 0x0) {
			ins = this.ram[this.programCounter + 1]
		}
		appendFileSync('./debug.txt', ins.toString(16) + '\n')
		return ins
	}

	incrementPC() {
		this.programCounter += 2
	}
	// This is quite frequent in the CHIP8 ISA
	jumpAnInstruction() {
		this.programCounter += 4
	}

	stallProcessor() {
		this.stall = true
	}

	decrementTimer() {
		if (this.delayTimer > 0) {
			this.delayTimer--
		}
	}

	step() {
		if (this.programCounter > 4094) {
			throw new Error('out of bounds')
		}
		const opcode = this.instructionFetch()
		const decodedInstruction = this.decode(opcode)
		this.execute(decodedInstruction)
	}

	decode(opcode: number) {
		return Decoder.decode(opcode)
	}

	execute(instruction: decoderOut) {
		// appendFileSync('./debug.txt', `${JSON.stringify({...instruction,opcode:instruction.opcode.toString(16)})}\n`)
		const { opcode, nnn, n, x, y, kk, firstFourBits } = instruction
		switch (firstFourBits) {
			case 0x0:
				switch (n) {
					case 0x0:
						// clear the screen
						this.monitor.clearDisplay()
						this.incrementPC()
						break
					case 0xe:
						// return from subroutine
						this.programCounter = this.stack[this.stackPointer]
						this.stackPointer -= 1
						break
					default:
						if (opcode == 0) {
							this.incrementPC()
						} else {
							console.error('Invalid opcode: 0x0')
							this.incrementPC()
						}
						break
				}
				break
			case 0x1:
				// Unconditional jump to nnn
				this.programCounter = nnn
				break
			case 0x2:
				// call subroutine at nnn
				this.stackPointer += 1
				this.stack[this.stackPointer] = this.programCounter + 2
				this.programCounter = nnn
				break
			case 0x3:
				// conditional jump to next adress
				if (this.registerFile[x] == kk) this.jumpAnInstruction()
				else this.incrementPC()
				break
			case 0x4:
				// conditional jump to next address
				if (this.registerFile[x] != kk) this.jumpAnInstruction()
				else this.incrementPC()
				break
			case 0x5:
				// conditional jump to next address
				if (this.registerFile[x] == this.registerFile[y]) this.jumpAnInstruction()
				else this.incrementPC()
				break
			case 0x6:
				// load immediate value to register
				this.registerFile[x] = kk
				this.incrementPC()
				break
			case 0x7:
				// add immediate
				this.registerFile[x] += kk
				this.incrementPC()
				break
			case 0x8:
				switch (n) {
					case 0x0:
						// load register value in another(load)
						this.registerFile[x] = this.registerFile[y]
						this.incrementPC()
						break
					case 0x1:
						// or
						this.registerFile[x] |= this.registerFile[y]
						this.incrementPC()
						break
					case 0x2:
						//and
						this.registerFile[x] &= this.registerFile[y]
						this.incrementPC()
						break
					case 0x3:
						this.registerFile[x] ^= this.registerFile[y]
						this.incrementPC()
						break
					case 0x4:
						this.registerFile[x] += this.registerFile[y]
						if (this.registerFile[x] > 255) {
							this.registerFile[0xf] = 1
						} else {
							this.registerFile[0xf] = 0
						}
						this.incrementPC()
						break
					case 0x5:
						if (this.registerFile[x] > this.registerFile[y]) {
							this.registerFile[0xf] = 1
						} else {
							this.registerFile[0xf] = 0
						}
						this.registerFile[x] -= this.registerFile[y]
						this.incrementPC()
						break
					case 0x6:
						if (this.registerFile[x] % 2) {
							this.registerFile[0xf] = 1
						} else {
							this.registerFile[0xf] = 0
						}
						this.registerFile[x] >>= 1
						this.incrementPC()
						break
					case 0x7:
						if (this.registerFile[y] > this.registerFile[x]) {
							this.registerFile[0xf] = 1
						} else {
							this.registerFile[0xf] = 0
						}
						this.incrementPC()
						break
					case 0xe:
						if (this.registerFile[x] >> 15) {
							this.registerFile[0xf] = 1
						} else {
							this.registerFile[0xf] = 0
						}
						this.registerFile[x] <<= 1
						this.incrementPC()
						break
					default:
						console.error('Invalid opcode')
						this.incrementPC()
						break
				}
				break
			case 0x9:
				// conditional jump
				if (this.registerFile[x] != this.registerFile[y]) this.jumpAnInstruction()
				else this.incrementPC()
				break
			case 0xa:
				this.I = nnn
				this.incrementPC()
				break
			case 0xb:
				this.programCounter = nnn + this.registerFile[0]
				break
			case 0xc:
				this.registerFile[x] = Math.floor(Math.random() * 255) & kk
				this.incrementPC()
				break
			case 0xd:
				for (let i = this.I; i < this.I + n; ++i) {
					for (let j = 0; j < 8; ++j) {
						const bit = this.ram[i] & (1 << (7 - j)) ? 1 : 0
						const xMod = (this.registerFile[x] + j) % SCREEN_WIDTH
						const yMod = (this.registerFile[y] + i - this.I) % SCREEN_HEIGHT
						const collision = this.monitor.drawPixel(xMod, yMod, bit)
						this.registerFile[0xf] = collision ? 1 : 0
					}
				}
				this.incrementPC()
				break
			case 0xe:
				switch ((y << 4) | n) {
					case 0x9e:
						// skip next instruction if key registerFile[x] is pressed
						if (this.keyboard.keys == this.registerFile[x]) this.jumpAnInstruction()
						else this.incrementPC()
						break
					case 0xa1:
						if (this.keyboard.keys != this.registerFile[x]) this.jumpAnInstruction()
						else {
							this.incrementPC()
						}
						// skip next instruction if key registerFile[x] is not pressed
						break
					default:
						console.error('Invalid opcode')
						this.incrementPC()
						break
				}
				break
			case 0xf:
				switch ((y << 4) | n) {
					case 0x07:
						this.registerFile[x] = this.delayTimer
						this.incrementPC()
						break
					case 0x0a: {
						const keyPress = this.keyboard.waitForKeyPress()
						if (!keyPress && typeof(keyPress) != "number"){
              console.log("in")
              return
            }
						this.registerFile[x] = keyPress
						this.incrementPC()
						break
					}

					case 0x15:
						this.delayTimer = this.registerFile[x]
						this.incrementPC()
						break

					case 0x18:
						this.soundTimer = this.registerFile[x]
						this.incrementPC()
						break

					case 0x1e:
						this.I += this.registerFile[x]
						this.incrementPC()
						break

					case 0x29:
						this.I = this.registerFile[x] * 5
						this.incrementPC()
						break

					case 0x33:
						this.ram[this.I] = Math.floor(this.registerFile[x] / 100) % 10
						this.ram[this.I + 1] = Math.floor(this.registerFile[x] / 10) % 10
						this.ram[this.I + 2] = this.registerFile[x] % 10
						this.incrementPC()
						break
					case 0x55:
						for (let i = 0; i < x + 1; ++i) {
							this.ram[this.I + i] = this.registerFile[i]
						}
						this.incrementPC()
						break
					case 0x65:
						for (let i = 0; i < x + 1; ++i) {
							this.registerFile[i] = this.ram[this.I + i]
						}
						this.incrementPC()
						break
				}
				break
		}
	}
}
