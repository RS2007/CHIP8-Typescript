import { BlessedParentClass } from './BlessedParentClass'
import blessed from 'blessed'

export class Keyboard {
	_keys: number
	_keyPressed: number
	screen: blessed.Widgets.Screen
	constructor() {
		this._keys = 0
		this._keyPressed = undefined
		this.screen = BlessedParentClass.getInstance().screen

		this.screen.key(['C-c'], () => {
			// graceful exit
			process.exit(0)
		})

		this.screen.on('keypress', (key) => {
			// set key = value
			const keyValue = 0x5 // TODO: to be assigned properly later
			this.setKey(keyValue)

			console.log({key})
		})
	}

	get keys() {
		return this._keys
	}

	waitForKeyPress() {
		const keyPressed = this._keyPressed
		this._keyPressed = undefined
		return keyPressed
	}

	// TODO: shot in the dark,rewrite properly
	setKey(keyValue: number) {
		this._keys = keyValue
		this._keyPressed = keyValue
	}
}
