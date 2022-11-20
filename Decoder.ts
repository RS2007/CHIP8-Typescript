import { decoderOut } from './types'
export class Decoder {
	/*Class inspired from the risc-v decoder*/
	/*takes an instruction(in binary) and converts it into usable fragments*/

	static decode(opcode: number): decoderOut {
		return {
			opcode,
			nnn: opcode & 0xfff,
			n: opcode & 0x00f,
			x: (opcode & 0x0f00) >>> 8,
			y: (opcode & 0x00f0) >>> 4,
			kk: opcode & 0x00ff,
			firstFourBits: opcode >>> 12,
		}
	}
}
