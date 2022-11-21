import { SCREEN_HEIGHT, SCREEN_WIDTH } from './constants'
import blessed from 'blessed'
import { BlessedParentClass } from './BlessedParentClass'

export class Monitor extends BlessedParentClass {
	frameBuffer: number[][]
	screen
	constructor() {
		super()
		this.frameBuffer = Array.from(new Array(SCREEN_HEIGHT), () =>
			new Array(SCREEN_WIDTH).fill(0)
		)
		this.screen = blessed.screen({ smartCSR: true })
	}

	clearDisplay() {
		this.frameBuffer = Array.from(new Array(SCREEN_HEIGHT), () => new Array(SCREEN_WIDTH))
		this.screen.clearRegion(0, SCREEN_WIDTH, 0, SCREEN_HEIGHT)
	}

	drawPixel(x: number, y: number, bit: number): boolean {
		let collision = false
		if (this.frameBuffer[y][x] == 1 && bit == 1) {
			collision = true
		}
		this.frameBuffer[y][x] ^= bit
		if (this.frameBuffer[y][x]) {
			this.screen.fillRegion(blessed.helpers.attrToBinary({ fg: 2 }), '█', x, x + 1, y, y + 1)
		} else {
			this.screen.clearRegion(x, x + 1, y, y + 1)
		}
		this.screen.render()
		return collision
	}
}
