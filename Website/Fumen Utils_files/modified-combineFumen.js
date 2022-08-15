// const { decoder, encoder } = require('tetris-fumen');

function combineFumen() {
    var fumenCodes = [];
    input = document.getElementById('input').value;
    for (let rawInput of input.split("\t")) {
        fumenCodes.push(...rawInput.split(/\s/));
    }

    combined = [];

    for (let code of fumenCodes) {
        try {
            let inputPages = decoder.decode(code);
            for (let i = 0; i < inputPages.length; i++) {
                combined.push(inputPages[i]);
            }
        } catch (error) { console.log(code, error); }
    }

    result = encoder.encode(combined);
    console.log(result);
    document.getElementById("output").value = result;
}