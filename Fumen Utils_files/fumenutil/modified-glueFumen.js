"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var tetris_fumen_1 = require("tetris-fumen");
import { getDelimiter, LineTerminator } from '../global-utils.js';
var HEIGHT = 20;
var WIDTH = 10;
var TETROMINO = 4;
var pieceMappings = {
    "T": [
        [[1, 0], [0, 0], [1, 1], [2, 0]],
        [[0, 1], [0, 0], [1, 1], [0, 2]],
        [[0, 1], [0, 0], [-1, 1], [1, 1]],
        [[0, 1], [0, 0], [-1, 1], [0, 2]],
    ],
    "I": [
        [[1, 0], [0, 0], [2, 0], [3, 0]],
        [[0, 2], [0, 0], [0, 1], [0, 3]],
    ],
    "L": [
        [[1, 0], [0, 0], [2, 0], [2, 1]],
        [[0, 1], [0, 0], [1, 0], [0, 2]],
        [[1, 1], [0, 0], [0, 1], [2, 1]],
        [[0, 1], [0, 0], [0, 2], [-1, 2]],
    ],
    "J": [
        [[1, 0], [0, 0], [0, 1], [2, 0]],
        [[0, 1], [0, 0], [0, 2], [1, 2]],
        [[-1, 1], [0, 0], [-2, 1], [0, 1]],
        [[1, 1], [0, 0], [1, 0], [1, 2]],
    ],
    "S": [
        [[1, 0], [0, 0], [1, 1], [2, 1]],
        [[-1, 1], [0, 0], [0, 1], [-1, 2]]
    ],
    "Z": [
        [[0, 0], [1, 0], [-1, 1], [0, 1]],
        [[0, 1], [0, 0], [1, 1], [1, 2]]
    ],
    "O": [
        [[0, 0], [1, 0], [0, 1], [1, 1]]
    ]
};
function height(field) {
    for (var y = HEIGHT - 1; y >= 0; y--) {
        for (var x = 0; x < WIDTH; x++) {
            if ("TILJSZOX".includes(field.at(x, y))) {
                return y + 1;
            }
        }
    }
    return 0;
}
function isInside(height, x, y) {
    return (0 <= x && x < WIDTH) && (0 <= y && y < height);
}
function isFloating(field, minoPositions) {
    // if there's a 'X' under any of the minos
    return minoPositions.every(pos =>
        // not on floor
        pos.y != 0 && field.at(pos.x, pos.y - 1) != 'X'
    );
}
function centerMino(minoPositions) {
    return minoPositions[0];
}
function parsePieceName(piece) {
    switch (piece) {
        case 1 /* Piece.I */:
            return 'I';
        case 2 /* Piece.L */:
            return 'L';
        case 3 /* Piece.O */:
            return 'O';
        case 4 /* Piece.Z */:
            return 'Z';
        case 5 /* Piece.T */:
            return 'T';
        case 6 /* Piece.J */:
            return 'J';
        case 7 /* Piece.S */:
            return 'S';
        case 8 /* Piece.Gray */:
            return 'X';
        case 0 /* Piece.Empty */:
            return '_';
    }
}
function parsePiece(piece) {
    switch (piece.toUpperCase()) {
        case 'I':
            return 1 /* Piece.I */;
        case 'L':
            return 2 /* Piece.L */;
        case 'O':
            return 3 /* Piece.O */;
        case 'Z':
            return 4 /* Piece.Z */;
        case 'T':
            return 5 /* Piece.T */;
        case 'J':
            return 6 /* Piece.J */;
        case 'S':
            return 7 /* Piece.S */;
        case 'X':
            return 8 /* Piece.Gray */;
        case '_':
            return 0 /* Piece.Empty */;
    }
    throw new Error("Unknown piece: ".concat(piece));
}
function parseRotationName(rotation) {
    switch (rotation) {
        case 0 /* Rotation.Spawn */:
            return 'spawn';
        case 3 /* Rotation.Left */:
            return 'left';
        case 1 /* Rotation.Right */:
            return 'right';
        case 2 /* Rotation.Reverse */:
            return 'reverse';
    }
}
function parseRotation(rotation) {
    switch (rotation.toLowerCase()) {
        case 'spawn':
            return 0 /* Rotation.Spawn */;
        case 'left':
            return 3 /* Rotation.Left */;
        case 'right':
            return 1 /* Rotation.Right */;
        case 'reverse':
            return 2 /* Rotation.Reverse */;
    }
    throw new Error("Unknown rotation: ".concat(rotation));
}
function placePiece(field, minoPositions, piece) {
    if (piece === void 0) { piece = 'X'; }
    for (const pos of minoPositions) {
        field.set(pos.x, pos.y, piece);
    }
}
function removeLineClears(field) {
    // line clearing is done internally by tetris-fumen in PlayField
    // but here we want to only clear rows that are all `X`s

    // to avoid serializing the field, we directly alter the field
    var newField = field.copy();
    var currentRow = 0;
    var sourceRow = 0;
    var linesCleared = [];

    while (sourceRow < HEIGHT) {
        var greyRow = true;
        for (var x = 0; x < WIDTH; x++) {
            if (field.at(x, sourceRow) !== "X") {
                greyRow = false;
                break;
            }
        }

        if (greyRow) {
            // ignore this source row, use the row above as source instead

            // record cleared line, since all rows below are filled, 
            // currentRow is exactly the relative line number of the cleared row
            linesCleared.push(currentRow);
            sourceRow++;
        } else {
            // only need to copy from sourceRow when the rows are different
            if (currentRow != sourceRow) {
                // copy from source to current
                for (var x = 0; x < WIDTH; x++) {
                    newField.set(x, currentRow, newField.at(x, sourceRow))
                }
            }
            // move to the next row above
            currentRow++;
            sourceRow++;
        }
    }
    // blank out remaining rows
    for (var y = currentRow + 1; y < HEIGHT; y++) {
        for (var x = 0; x < WIDTH; x++) {
            newField.set(x, y, "_");
        }
    }

    return {
        field: newField,
        linesCleared: linesCleared // relative line clear positions ex: [0, 0] (bottommost two lines)
    };
}
// encode operations for faster comparisons
function encodeOp(operation) {
    // encode into 15 bit
    // type has 9 possible (4 bits)
    // rotation has 4 possible (2 bits)
    // x has WIDTH (10) possible (4 bits)
    // absY has height (20) possible (5 bits)
    // y has height (20) possible (5 bits)
    var ct = parsePiece(operation.type);
    ct = (ct << 2) + parseRotation(operation.rotation);
    ct = (ct << 4) + operation.x;
    ct = (ct << 5) + operation.absY;
    ct = (ct << 5) + operation.y;
    return ct;
}
function decodeOp(ct) {
    var y = ct & 0x1F;
    ct >>= 5;
    ct >>= 5; // remove the absolute Y position
    var x = ct & 0xF;
    ct >>= 4;
    var rotation = parseRotationName(ct & 0x3);
    ct >>= 2;
    var type = parsePieceName(ct);
    return {
        type: type,
        rotation: rotation,
        x: x,
        y: y
    };
}
function anyColoredMinos(field) {
    for (var y = 0; y < HEIGHT; y++) {
        for (var x = 0; x < WIDTH; x++) {
            if ("TILJSZO".includes(field.at(x, y))) {
                return true;
            }
        }
    }
    return false;
}
function makeEmptyField(field) {
    var emptyField = field.copy();
    var fieldHeight = height(field);
    for (var y = 0; y < fieldHeight; y++) {
        for (var x = 0; x < WIDTH; x++) {
            var piece = emptyField.at(x, y);
            if (piece.match(/[TILJSZO]/)) {
                emptyField.set(x, y, "_");
            }
        }
    }
    return emptyField;
}
function getMinoPositions(field, fieldHeight, x, y, piece, rotationState, visualizeArr) {
    if (visualizeArr === void 0) { visualizeArr = null; }
    var minoPositions = [];
    // empty the field of all colored minos
    var visualizeField = null;
    if (visualizeArr !== null) {
        // create fumen of trying to put piece there
        visualizeField = makeEmptyField(field);
    }
    // for each position of a mino from rotation state
    for (const pos of rotationState) {
        var px = x + pos[0];
        var py = y + pos[1];
        if (isInside(fieldHeight, px, py)) {
            // add piece mino to field to visualize what it tried
            if (visualizeField !== null) {
                visualizeField.set(px, py, piece);
            }
            // mino matches the piece
            if (field.at(px, py) === piece) {
                minoPositions.push({ x: px, y: py });
            }
        }
    }
    // add page of it trying this piece and rotation
    if (visualizeField !== null && visualizeArr !== null) {
        visualizeArr.push({ field: visualizeField });
    }
    return minoPositions;
}
function duplicateGlue(subArr, arrays) {
    // check if duplicate
    var duplicate = false;
    // new array without y but keep absolute y
    var absSubArr = subArr.map(function (x) { return x >> 5; });
    var arrSet = new Set(absSubArr);
    for (const arr of arrays) {
        // check if the two arrays are the same length
        if (subArr.length !== arr.length) {
            duplicate = false;
            break;
        }
        // check if two arrays are permutations
        var absArr = arr.map(function (x) { return x >> 5; });
        if (absArr.every(function (x) { return arrSet.has(x); })) {
            duplicate = true;
            break;
        }
    }
    return duplicate;
}
function glue(x0, y0, field, piecesArr, allPiecesArr, totalLinesCleared, visualizeArr, visualize) {
    var fieldHeight = height(field);
    // scan through board for any colored minos
    for (var y = y0; y < fieldHeight; y++) {
        for (var x = (y == y0) ? x0 : 0; x < WIDTH; x++) {
            // if it is a piece
            var piece = field.at(x, y);
            if (piece.match(/[TILJSZO]/)) {
                // checking if one of the rotations works
                var rotationStates = pieceMappings[piece];
                for (var state = 0; state < rotationStates.length; state++) {
                    var newPiecesArr = __spreadArray([], piecesArr, true);
                    var minoPositions = getMinoPositions(field, fieldHeight, x, y, piece, rotationStates[state], (visualize) ? visualizeArr : null);
                    // if there's less than minos
                    if (minoPositions.length < TETROMINO || isFloating(field, minoPositions)) {
                        continue;
                    }
                    // place piece
                    var newField = field.copy();
                    placePiece(newField, minoPositions);
                    // clear lines
                    var thisLinesCleared = void 0;
                    var data = removeLineClears(newField);
                    newField = data.field;
                    thisLinesCleared = data.linesCleared;
                    // determine the absolute position of the piece
                    var absY = centerMino(minoPositions).y;
                    for (var i = 0; i < totalLinesCleared.length && totalLinesCleared[i] <= absY; i++) {
                        absY++;
                    }
                    // check if a line clear occurred
                    var startx = Math.max(x - 1, 0);
                    var starty = Math.max(y - 1, 0);
                    // merge new relative position line numbers to previous absolute position line numbers
                    var newTotalLinesCleared = __spreadArray([], totalLinesCleared, true);
                    if (thisLinesCleared.length > 0) {
                        // start position to 0 otherwise it's where we left off scanning the field
                        startx = 0;
                        starty = 0;
                        // determine the absolute position of the line numbers
                        for (const lineNum of thisLinesCleared) {
                            var lineNumCopy = lineNum;
                            var i = void 0;
                            for (i = 0; i < newTotalLinesCleared.length && newTotalLinesCleared[i] <= lineNum; i++) {
                                lineNumCopy++;
                            }
                            newTotalLinesCleared.splice(i, 0, lineNumCopy);
                        }
                    }
                    // a rotation that works
                    var operPiece = {
                        type: piece,
                        rotation: parseRotationName(state),
                        x: centerMino(minoPositions).x,
                        y: centerMino(minoPositions).y,
                        absY: absY,
                    };
                    newPiecesArr.push(encodeOp(operPiece));
                    glue(startx, starty, newField, newPiecesArr, allPiecesArr, newTotalLinesCleared, visualizeArr, visualize);
                    // continue on with possiblity another piece could be placed instead of this one
                }
            }
        }
    }
    // if the field doesn't have any more pieces it's good
    if (!anyColoredMinos(field) && !duplicateGlue(piecesArr, allPiecesArr)) {
        allPiecesArr.push(piecesArr);
    }
}
function glueFumenInner(inputPages, visualize, visualizeArr) {
    var start = performance.now();
    var thisGlueFumens = []; // holds the glue fumens for this fumenCode
    // glue each page
    for (const page of inputPages) {
        var field = page.field;
        var emptyField = makeEmptyField(field);
        var allPiecesArr = [];
        // try to glue this field and put into all pieces arr
        glue(0, 0, field, [], allPiecesArr, [], visualizeArr, visualize);
        // couldn't glue
        if (allPiecesArr.length == 0) {
            console.log(code + " couldn't be glued");
            fumenIssues++;
        }
        // each sequence of pieces
        for (const piecesArr of allPiecesArr) {
            var pages = [];
            pages.push({
                field: emptyField,
                operation: decodeOp(piecesArr[0])
            });
            for (var i = 1; i < piecesArr.length; i++) {
                pages.push({
                    operation: decodeOp(piecesArr[i])
                });
            }
            // add the final glue fumens to visualization
            if (visualize)
                visualizeArr.push.apply(visualizeArr, pages);
            // the glued fumen for this inputted page
            var pieceFumen = tetris_fumen_1.encoder.encode(pages);
            thisGlueFumens.push(pieceFumen);
        }
        // multiple fumens from one page
        if (allPiecesArr.length > 1) {
            // multiple outputs warning
            console.log("Warning: " + code + " led to " + allPiecesArr.length + " outputs");
        }
    }

    var end = performance.now();
    console.log(`decoding one code took ${end - start}`);

    return thisGlueFumens;
}

export default function glueFumen() {
    var visualize = false;

    var input = document.getElementById('input').value.replace(/[Ddm]115@/gm, 'v115@')
    var inputFumenCodes = input.trim().split(LineTerminator)

    // all "global" variables
    var allFumens = [];
    var visualizeArr = [];
    var fumenIssues = 0;

    // for each fumen
    for (const code of inputFumenCodes) {
        var inputPages = tetris_fumen_1.decoder.decode(code);
        var thisGlueFumens = glueFumenInner(inputPages, visualize, visualizeArr);
        // add the glue fumens for this code to all the fumens
        allFumens.push.apply(allFumens, thisGlueFumens);
    }
    if (inputFumenCodes.length > allFumens.length) {
        console.log("Warning: " + fumenIssues + " fumens couldn't be glued");
    }

    let output = allFumens.join(getDelimiter());
    document.getElementById('output').value = output;
}
