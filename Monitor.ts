import { SCREEN_HEIGHT, SCREEN_WIDTH } from './constants'
import blessed from 'blessed'
import { BlessedParentClass } from './BlessedParentClass'

export class Monitor extends BlessedParentClass {
	frameBuffer: number[][]
	screen: blessed.Widgets.Screen
	constructor() {
		super()
		this.frameBuffer = Array.from(new Array(SCREEN_HEIGHT), () => new Array(SCREEN_WIDTH))
		this.screen = blessed.screen({ smartCSR: true })
	}

	clearDisplay() {
		this.frameBuffer = Array.from(new Array(SCREEN_HEIGHT), () => new Array(SCREEN_WIDTH))
		this.screen.clearRegion(0, SCREEN_WIDTH, 0, SCREEN_HEIGHT)
	}
}
