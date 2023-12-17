const { decoder, encoder } = require('tetris-fumen');
import { getDelimiter, LineTerminator } from '../global-utils.js'

export default function removeComments() {
    var input = document.getElementById('input').value.replace(/[Ddm]115@/gm, 'v115@')
    var fumenCodes = input.trim().split(LineTerminator)

    var results = fumenCodes.map(fumenCode => {
        try {
            let pages = decoder.decode(fumenCode);

            pages.forEach((page, index, pages) => {
                page.comment = ''
                page.quiz = false
                pages[index] = page
            })

            return encoder.encode(pages)
        } catch (error) { console.log(fumenCode, error); }
    })

    console.log(results.join(' '));
    document.getElementById("output").value = results.join(getDelimiter());
}