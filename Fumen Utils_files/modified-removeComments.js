// const { decoder, encoder } = require('tetris-fumen');

function removeComments(input) {
    var fumenCodes = [];
    results = [];
    for (let rawInput of input.split("\t")) {
        fumenCodes.push(...rawInput.split(/\s/));
    }

    for (let code of fumenCodes) {
        try {
            let pages = decoder.decode(code);
            for (let i = 0; i < pages.length; i++) {
                pages[i].comment = '';
                pages[i].quiz = false;
            }
            results.push(encoder.encode(pages));

        } catch (error) { console.log(code, error); }
    }

    console.log(results.join(' '));
    document.getElementById("output").value = results.join(delimiter);
}