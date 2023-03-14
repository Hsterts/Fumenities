const { decoder, encoder } = require('tetris-fumen');
import { LineTerminator, getDelimiter } from '../global-utils.js'

var gluePieces = {
    T: [
        [[0, 0], [0, -1], [0, 1], [1, 0]],
        [[0, 0], [0, 1], [1, 0], [-1, 0]],
        [[0, 0], [0, -1], [0, 1], [-1, 0]],
        [[0, 0], [0, -1], [1, 0], [-1, 0]]
    ],
    I: [
        [[0, 0], [0, -1], [0, 1], [0, 2]],
        [[0, 0], [1, 0], [-1, 0], [-2, 0]],
        [[0, 0], [0, -1], [0, -2], [0, 1]],
        [[0, 0], [1, 0], [2, 0], [-1, 0]]
    ],
    L: [
        [[0, 0], [0, -1], [0, 1], [1, 1]],
        [[0, 0], [1, 0], [-1, 0], [-1, 1]],
        [[0, 0], [0, -1], [0, 1], [-1, -1]],
        [[0, 0], [1, -1], [1, 0], [-1, 0]]
    ],
    J: [
        [[0, 0], [0, -1], [0, 1], [1, -1]],
        [[0, 0], [1, 0], [-1, 0], [1, 1]],
        [[0, 0], [0, -1], [0, 1], [-1, 1]],
        [[0, 0], [-1, -1], [1, 0], [-1, 0]]
    ],
    S: [
        [[0, 0], [0, -1], [1, 0], [1, 1]],
        [[0, 0], [1, 0], [0, 1], [-1, 1]],
        [[0, 0], [0, 1], [-1, 0], [-1, -1]],
        [[0, 0], [-1, 0], [0, -1], [1, -1]]
    ],
    Z: [
        [[0, 0], [0, 1], [1, 0], [1, -1]],
        [[0, 0], [-1, 0], [0, 1], [1, 1]],
        [[0, 0], [0, -1], [-1, 0], [-1, 1]],
        [[0, 0], [1, 0], [0, -1], [-1, -1]]
    ],
    O: [
        [[0, 0], [1, 0], [0, 1], [1, 1]],
        [[0, 0], [0, 1], [-1, 0], [-1, 1]],
        [[0, 0], [-1, 0], [0, -1], [-1, -1]],
        [[0, 0], [0, -1], [1, -1], [1, 0]]
    ]
}

var rotationMapping = {
    "spawn": 0,
    "right": 1,
    "reverse": 2,
    "left": 3
}

var colorMapping = {
    "S": 7,
    "J": 6,
    "T": 5,
    "Z": 4,
    "O": 3,
    "L": 2,
    "I": 1
}

function clearedOffset(rowsCleared, yIndex) {
    for (let row of rowsCleared) {
        if (yIndex >= row) yIndex++;
    }
    return yIndex;
}

export default function unglueFumen() {
    var input = document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@')
    var fumenCodes = input.trim().split(LineTerminator);
    var results = []
    
    for (let code of fumenCodes) {
        try {
            let inputPages = decoder.decode(code);
            console.log(inputPages);
            let toUnglueBoard = inputPages[0]["_field"]["field"]["pieces"];
            let rowsCleared = [];

            for (let inputPage of inputPages) {
                let op = inputPage["operation"];
                let piece = gluePieces[op["type"]][rotationMapping[op["rotation"]]];

                for (let mino of piece) {
                    let yIndex = op.y + mino[0];
                    yIndex = clearedOffset(rowsCleared, yIndex);
                    let xIndex = op.x + mino[1];
                    let index = yIndex * 10 + xIndex;
                    if (toUnglueBoard[index] != 0) { console.log("error"); } // some intersect with the toUnglueBoard
                    toUnglueBoard[index] = colorMapping[op["type"]];
                }

                let temp = [];

                for (let y = -2; y < 3; y++) { // rows in which the piece might have been
                    let yIndex = op.y + y;
                    yIndex = clearedOffset(rowsCleared, yIndex);
                    if (yIndex >= 0) { // sanity check
                        let currentRow = toUnglueBoard.slice(yIndex * 10, yIndex * 10 + 10)
                        
                        let rowCleared = currentRow.every(mino => mino != 0);
                        if (rowCleared) {
                            temp.push(yIndex);
                        }
                    }
                }

                for (let row of temp) {
                    if (!rowsCleared.includes(row)) {
                        rowsCleared.push(row);
                        rowsCleared.sort();
                    }
                }
            
            }

            let outputPages = [inputPages[0]]; // lazily generating output fumen by destructively modifying the input
            outputPages[0]["operation"] = undefined;
            outputPages[0]["_field"]["field"]["pieces"] = toUnglueBoard;

            results.push(encoder.encode(outputPages));
            
        } catch (error) { console.log(code, error); }
    }

    console.log(results.join(' '));
    document.getElementById("output").value = results.join(getDelimiter());
}