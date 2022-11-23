import { Cpu } from './Cpu'

const core = new Cpu()
core.loadROM('pong.rom')

let count = 0
function run() {
	if (count % 2 == 0) {
		core.decrementTimer()
		count = 0
	} else {
		count++
	}
	core.step()
}
setInterval(run, 5)
