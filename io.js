function toField(board) {
    FieldString = '';
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < 10; col++) {
            if (board[row][col]['t'] == 1 && board[row][col]['c'] != '') {
                FieldString += board[row][col]['c'];
            } else FieldString += '_';
        }
    }
    return Field.create(FieldString);
}

function decode(fumen) {
    histPos = document.getElementById('positionDisplay').value-1
    pages = decoder.decode(fumen);
    input = pages[0]['_field']['field']['pieces'];
    board = [];
    for (rowIndex = 0; rowIndex < 20; rowIndex++) {
        let row = [];
        for (colIndex = 0; colIndex < 10; colIndex++) {
            index = (20 - rowIndex - 1) * 10 + colIndex;
            colorIndex = input[index];
            if (colorIndex == 0) row.push({ t: 0, c: '' });
            else {
                letter = ' ILOZTJSX'[colorIndex];
                row.push({ t: 1, c: letter });
            }
        }
        board.push(row);
    }
    comment = pages[0]['comment'];
    page = {
        board, 
        comment: comment
    }
    return page;
};

function fullDecode(fumen) {
    pages = decoder.decode(fumen);
    console.log(pages);
    newHist = [];
    for (i = 0; i < pages.length; i++) {
        input = pages[i]['_field']['field']['pieces'];
        let tempBoard = [];
        for (rowIndex = 0; rowIndex < 20; rowIndex++) {
            let row = [];
            for (colIndex = 0; colIndex < 10; colIndex++) {
                index = (20 - rowIndex - 1) * 10 + colIndex;
                colorIndex = input[index];
                if (colorIndex == 0) row.push({ t: 0, c: '' });
                else {
                    letter = ' ILOZTJSX'[colorIndex];
                    row.push({ t: 1, c: letter });
                }
            }
            tempBoard.push(row);
        }

        currHist = {
            board: JSON.stringify(tempBoard),
            comment: pages[i]['comment'],
        };

        if (pages[i]['flags']['quiz'] && comment.substring(0, 3) == '#Q=') {
            bracketStart = comment.indexOf('[');
            bracketEnd = comment.indexOf(']');
            if (bracketStart >= 0 && bracketEnd == bracketStart + 2 && 'SZLJIOT'.includes(comment[bracketStart + 1])) {
                currHist['hold'] = comment[bracketStart + 1];
            } else currHist['hold'] = '';

            bracketStart = comment.indexOf('(');
            bracketEnd = comment.indexOf(')');
            if (bracketStart >= 0 && bracketEnd == bracketStart + 2 && 'SZLJIOT'.includes(comment[bracketStart + 1])) {
                currHist['piece'] = comment[bracketStart + 1];
            }

            currQueue = comment.substring(bracketEnd + 1);
            temp = [];
            for (j = 0; j < currQueue.length; j++) {
                //sanitization
                if ('SZLJIOT'.includes(currQueue[j])) temp.push(currQueue[j]);
            }
            temp.push('|');
            while (temp.length < 10) {
                var shuf = names.shuffle();
                shuf.map((p) => temp.push(p));
                temp.push('|');
            }
            currHist['queue'] = JSON.stringify(temp);

        }

        newHist.push(currHist);
    }
    return newHist;
};

function encode() {
	histPos = document.getElementById("positionDisplay").value-1
	pages = [];

	page = [];
	field = toField(JSON.parse(hist[histPos]['board']));
	flags = {
		rise: false,
		mirror: false,
		colorize: true,
		comment: hist[histPos]['comment'],
		lock: true,
		piece: undefined,
	}
	page = {
		comment: hist[histPos]['comment'],
		operation: hist[histPos]["operation"],
		field,
		flags: flags,
		index: histPos,
	}
	pages.push(page);

	var result = encoder.encode(pages);
	return result;
}

function fullEncode() {
	pages = [];
for (var i = 0; i < hist.length; i++){
	page = [];
	field = toField(JSON.parse(hist[i]['board']));
	flags = {
		rise: false,
		mirror: false,
		colorize: true,
		comment: hist[i]['comment'],
		lock: true,
		piece: undefined,
	}
		page = {
			comment: hist[i]['comment'],
			operation: hist[histPos]["operation"],
			field,
			flags: flags,
			index: i,
		}
	pages.push(page);
};
	var result = encoder.encode(pages);
	document.getElementById("boardOutput").value = result;
	return result;
}

// MAIN IO
async function importFumen() {
	histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	try {
		fumen = await document.getElementById("boardOutput").value;
	} catch (error) {
		fumen = prompt('fumen encoding');
	}
	result = decode(fumen);
	board = JSON.parse(JSON.stringify(result.board));
	hist.splice(histPos,0,{board: JSON.stringify(board)});
	document.getElementById("positionDisplayOver").value = "/"+hist.length;
	hist[histPos]['comment'] = result.comment;
	document.getElementById("commentBox").value = result.comment;
	window.requestAnimationFrame(render);
}

async function importFullFumen() {
	try {
		fumen = await document.getElementById("boardOutput").value;
	} catch (error) {
		fumen = prompt('fumen encoding');
	}
	result = fullDecode(fumen);
	hist = result;
	histPos = 0;
	board = JSON.parse(hist[histPos]['board']);
	comment = hist[histPos]['comment'];
	document.getElementById("commentBox").value = comment; 
	document.getElementById("positionDisplay").value = 1;
	document.getElementById("positionDisplayOver").value = "/"+hist.length;
	window.requestAnimationFrame(render);
}

//IMAGE IMPORT
async function importImage() {
	try {
		const clipboardItems = await navigator.clipboard.read();
		for (const clipboardItem of clipboardItems) {
			for (const type of clipboardItem.types) {
				const blob = await clipboardItem.getType(type);
				//console.log(URL.createObjectURL(blob));

				// Create an abstract canvas and get context
				var mycanvas = document.createElement('canvas');
				var ctx = mycanvas.getContext('2d');

				// Create an image
				var img = new Image();

				// Once the image loads, render the img on the canvas
				img.onload = function () {
					console.log(this.width, this.height);
					scale = this.width / 10.0;
					x = 10;
					y = Math.min(Math.round(this.height / scale), 22);
					console.log(x, y);
					mycanvas.width = this.width;
					mycanvas.height = this.height;

					// Draw the image
					ctx.drawImage(img, 0, 0, this.width, this.height);
					var data = Object.values(ctx.getImageData(0, 0, this.width, this.height).data);
					var nDat = [];
					for (row = 0; row < y; row++) {
						for (col = 0; col < 10; col++) {
							// get median value of pixels that should correspond to [row col] mino

							minoPixelsR = [];
							minoPixelsG = [];
							minoPixelsB = [];

							for (pixelRow = Math.floor(row * scale); pixelRow < row * scale + scale; pixelRow++) {
								for (pixelCol = Math.floor(col * scale); pixelCol < col * scale + scale; pixelCol++) {
									index = (pixelRow * this.width + pixelCol) * 4;
									minoPixelsR.push(data[index]);
									minoPixelsG.push(data[index + 1]);
									minoPixelsB.push(data[index + 2]);
								}
							}

							medianR = median(minoPixelsR);
							medianG = median(minoPixelsG);
							medianB = median(minoPixelsB);
							var hsv = rgb2hsv(medianR, medianG, medianB);
							console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
							nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
						}
					}
					/* // old alg from just scaling it down to x by y pixels
                    for (let i = 0; i < data.length / 4; i++) {
						//nDat.push(data[i*4] + data[(i*4)+1] + data[(i*4)+2] < 382?1:0)
						var hsv = rgb2hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
						console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
						nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
					}*/

					tempBoard = new Array(40 - y).fill(new Array(10).fill({ t: 0, c: '' })); // empty top [40-y] rows
					for (rowIndex = 0; rowIndex < y; rowIndex++) {
						let row = [];
						for (colIndex = 0; colIndex < 10; colIndex++) {
							index = rowIndex * 10 + colIndex;
							temp = nDat[index];
							if (temp == '.') row.push({ t: 0, c: '' });
							else row.push({ t: 1, c: temp });
						}
						tempBoard.push(row);
					}

					board = JSON.parse(JSON.stringify(tempBoard));

					xPOS = spawn[0];
					yPOS = spawn[1];
					rot = 0;
					clearActive();
					updateGhost();
					setShape();
					updateHistory();
				};

				var URLObj = window.URL || window.webkitURL;
				img.src = URLObj.createObjectURL(blob);
			}
		}
	} catch (err) {
		console.error(err.name, err.message);
	}
}

function rgb2hsv(r, g, b) {
	let v = Math.max(r, g, b),
		c = v - Math.min(r, g, b);
	let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
	return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function nearestColor(h, s, v) {
	if (inRange(h, 0, 30) && inRange(s, 0, 1) && (inRange(v, 133, 135) || inRange(v, 63, 88))) return 'X'; // attempted manual override specifically for four.lol idk
	if (inRange(h, 220, 225) && inRange(s, 0, 0.2) && v == 65) return '.';

	if (s <= 0.2 && v / 2.55 >= 55) return 'X';
	if (v / 2.55 <= 55) return '.';

	if (inRange(h, 0, 16) || inRange(h, 325, 360)) return 'Z';
	else if (inRange(h, 16, 41)) return 'L';
	else if (inRange(h, 41, 70)) return 'O';
	else if (inRange(h, 70, 149)) return 'S';
	else if (inRange(h, 149, 200)) return 'I';
	else if (inRange(h, 200, 266)) return 'J';
	else if (inRange(h, 266, 325)) return 'T';
	return '.';
}

function inRange(x, min, max) {
	return x >= min && x <= max;
}

function median(values) {
	// if this is too computationally expensive maybe switch to mean
	if (values.length === 0) throw new Error('No inputs');

	values.sort(function (a, b) {
		return a - b;
	});

	var half = Math.floor(values.length / 2);

	if (values.length % 2) return values[half];

	return (values[half - 1] + values[half]) / 2.0;
}

//MIRRORING
const reversed = {Z: 'S',L: 'J',O: 'O',S: 'Z',I: 'I',J: 'L',T: 'T',X: 'X'};

function mirror() {
	for (row = 0; row < board.length; row++) {
		board[row].reverse();
		for (i = 0; i < board[row].length; i++) {
			if (board[row][i].t == 1) board[row][i].c = reversed[board[row][i].c];
		}
	}
	updateHistory();
	window.requestAnimationFrame(render);
}

function fullMirror() {
	for (i = 0; i < hist.length; i++) {
		tempBoard = JSON.parse(hist[i]['board']);
		for (row = 0; row < tempBoard.length; row++) {
			tempBoard[row].reverse();
			for (j = 0; j < tempBoard[row].length; j++) {
				if (tempBoard[row][j].t == 1) tempBoard[row][j].c = reversed[tempBoard[row][j].c];
			}
		}
		hist[i]['board'] = JSON.stringify(tempBoard);
	}
	board = tempBoard;
	updateHistory();
	window.requestAnimationFrame(render);
}
