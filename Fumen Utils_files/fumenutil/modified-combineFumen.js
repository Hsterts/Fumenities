const { decoder, encoder } = require('tetris-fumen');
import { LineTerminator } from "../global-utils.js";

export default function combineFumen() {
    var input = document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@')
    var fumenCodes = input.trim().split(LineTerminator)

    let combined = fumenCodes.flatMap((fumenCode) => {
        try {
            return decoder.decode(fumenCode);
        } catch (error) { console.log(fumenCode, error); }
    })

    let result = encoder.encode(combined);
    console.log(result);
    document.getElementById("output").value = result;
}