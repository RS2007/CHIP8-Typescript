import { Cpu } from './Cpu'

const core = new Cpu()
core.loadROM('chip8-test-suite.ch8')

let count = 0
function run() {
	if (count % 8 == 0) {
		core.decrementTimer()
		count = 0
	} else {
		count++
	}
	core.step()
}
setInterval(run, 2)
