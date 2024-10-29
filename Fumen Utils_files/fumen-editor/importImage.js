import { inRange, emptyBoard, boardSize } from "../global-utils.js";
import { bookState } from "./EditorState.js";

export default async function importImage(blob) {
    // Create an abstract canvas and get context

    // Create an image
    var img = new Image();

    // Once the image loads, render the img on the canvas
    img.onload = function () {
        console.log(this)
        // console.log(this.width, this.height);
        let numcols = boardSize[0];
        let scale = this.width / numcols;
        let numrows = Math.min(Math.round(this.height / scale), 20);
        // console.log(numcols, numrows);

        let mycanvas = document.createElement('canvas');
        mycanvas.width = this.width;
        mycanvas.height = this.height;

        // Draw image on canvas and convert to pixel data
        let ctx = mycanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false // no anti-aliasing
        ctx.drawImage(img, 0, 0, this.width, this.height);
        let data = Object.values(ctx.getImageData(0, 0, this.width, this.height).data);

        let tempBoard = emptyBoard()

        for (let row = 0; row < numrows; row++) {
            for (let col = 0; col < numcols; col++) {
                // get median value of pixels that should correspond to [row col] mino
                // if this is too computationally expensive maybe switch to mean
                let minoPixelsR = [];
                let minoPixelsG = [];
                let minoPixelsB = [];

                //get all rgb values of the pixels in this cell 
                for (let pixelRow = Math.floor(row * scale); pixelRow < row * scale + scale; pixelRow++) {
                    for (let pixelCol = Math.floor(col * scale); pixelCol < col * scale + scale; pixelCol++) {
                        let index = (pixelRow * this.width + pixelCol) * 4;
                        minoPixelsR.push(data[index]);
                        minoPixelsG.push(data[index + 1]);
                        minoPixelsB.push(data[index + 2]);
                    }
                }

                let hsv = rgb2hsv(median(minoPixelsR), median(minoPixelsG), median(minoPixelsB));
                // console.log(hsv, nearestMinoRepresentation(...hsv)); // debugging purposes
                console.log(boardSize[1] - numrows + row, col)
                console.log(tempBoard[boardSize[1] - numrows + row][col])
                tempBoard[boardSize[1] - numrows + row][col] = nearestMinoRepresentation(...hsv)
            }
        }
        /* // old alg from just scaling it down to x by y pixels
        let nDat = [];
        for (let i = 0; i < data.length / 4; i++) {
            //nDat.push(data[i*4] + data[(i*4)+1] + data[(i*4)+2] < 382?1:0)
            var hsv = rgb2hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
            console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
            nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
        }*/
        bookState.updateCurrentPage({ board: tempBoard })
    };

    var URLObj = window.URL || window.webkitURL;
    img.src = URLObj.createObjectURL(blob);
}

function median(values) {
    if (values.length === 0)
        throw new Error('No inputs');

    values.sort(function (a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

function rgb2hsv(r, g, b) {
    let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function nearestMinoRepresentation(h, s, v) {
    if (inRange(h, 0, 30) && inRange(s, 0, 1) && (inRange(v, 133, 135) || inRange(v, 63, 88)))
        return { t: 1, c: 'X' }; // attempted manual override specifically for four.lol idk
    if (inRange(h, 220, 225) && inRange(s, 0, 0.2) && v == 65)
        return { t: 0, c: '' };

    if (s <= 0.2 && v / 2.55 >= 55)
        return { t: 1, c: 'X' };
    if (v / 2.55 <= 55)
        return { t: 0, c: '' };

    if (inRange(h, 0, 16) || inRange(h, 325, 360))
        return { t: 1, c: 'Z' };
    else if (inRange(h, 17, 41))
        return { t: 1, c: 'L' };
    else if (inRange(h, 42, 70))
        return { t: 1, c: 'O' };
    else if (inRange(h, 71, 149))
        return { t: 1, c: 'S' };
    else if (inRange(h, 150, 200))
        return { t: 1, c: 'I' };
    else if (inRange(h, 201, 266))
        return { t: 1, c: 'J' };
    else if (inRange(h, 267, 325))
        return { t: 1, c: 'T' };
    return { t: 0, c: '' };
}