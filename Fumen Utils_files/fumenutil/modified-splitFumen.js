const { decoder, encoder } = require('tetris-fumen');
import { getDelimiter, LineTerminator } from '../global-utils.js'

export default function splitFumen() {
    var input = document.getElementById('input').value.replace(/[Ddm]115@/gm, 'v115@')
    var fumenCodes = input.trim().split(LineTerminator);

    let results = fumenCodes.flatMap(fumenCode => {
        try {
            let inputPages = decoder.decode(fumenCode);
            let colorize = inputPages[0].flags.colorize

            return inputPages.map(inputPage => {
                inputPage.flags.colorize = colorize
                return encoder.encode([inputPage])
            })
        } catch (error) { console.log(fumenCode, error); }
    });

    console.log(results.join(' '));
    document.getElementById("output").value = results.join(getDelimiter());
}