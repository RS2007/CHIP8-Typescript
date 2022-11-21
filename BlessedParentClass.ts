import blessed from 'blessed'
export class BlessedParentClass {
	blessed
	screen: blessed.Widgets.Screen
	static instance: BlessedParentClass
	constructor() {
		this.blessed = blessed
		this.screen = blessed.screen({ smartCSR: true })
	}

	public static getInstance(): BlessedParentClass {
		if (!this.instance) {
			this.instance = new BlessedParentClass()
			return this.instance
		} else {
			return this.instance
		}
	}
}
