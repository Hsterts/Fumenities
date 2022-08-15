// const { decoder, encoder } = require('tetris-fumen');

function splitFumen() {
    var fumenCodes = [];
    results = [];
    input = document.getElementById('input').value;
    for (let rawInput of input.split("\t")) {
        fumenCodes.push(...rawInput.split(/\s/));
    }

    for (let code of fumenCodes) {
        try {
            let inputPages = decoder.decode(code);
            for (let i = 0; i < inputPages.length; i++) {
                if (inputPages[0].flags.colorize) inputPages[i].flags.colorize = true;
                results.push(encoder.encode([inputPages[i]]));
            }
        } catch (error) { console.log(code, error); }
    }
    console.log(results.join(' '));
    document.getElementById("output").value = results.join(delimiter);
}