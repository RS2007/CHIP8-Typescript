import { Cpu } from './Cpu'

const core = new Cpu()
core.loadROM('test_opcode.ch8')

let timer = 0
function cycle() {
	timer++
	if (timer % 5 === 0) {
		core.decrementTimer()
		timer = 0
	}
	core.step()
	setTimeout(cycle, 3)
}
cycle()
