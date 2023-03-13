import { inRange, shape_table } from "../global-utils.js";
import { renderBoard } from "../rendering/board-render.js";
import { autoEncode, updateBook, getCurrentPosition } from "./fumen-editor.js";

function paintbucketColor() {
	for (i = 0; i < document.paintbucket.length; i++) {
		if (document.paintbucket[i].checked) {
			return document.paintbucket[i].id;
		}
	}
}

//FUMEN EDITOR BINDINGS
var mouseHeld = false;
var drawMode = true;
document.getElementById('b').onmousedown = function mousedown(e) {
	var autoColorBool = document.getElementById('autoColorInput').checked;
	bookPos = getCurrentPosition();
	let rect = document.getElementById('b').getBoundingClientRect();
	let cellRow = Math.floor((e.clientY - rect.top) / cellSize);
	let cellCol = Math.floor((e.clientX - rect.left) / cellSize);

	drawMode = (e.button === 0 && board[cellRow][cellCol]['c'] !== paintbucketColor() && minoModeBoard[cellRow][cellCol]['t'] === 0);

	let positions = [];
	for (let row in board) {
		for (let col in board[row]) {
			if (board[row][col].t == 2) {
				positions.push([row, col]);
			}
		}
	}
	if (drawMode && autoColorBool && positions.length == 4) {
		//solidify piece
		for (let position of positions) {
			board[position[0]][position[1]].t = 1;
		}
	}
	drawCanvasCell(cellRow, cellCol);

	updateBook();
	autoEncode();
	requestAnimationFrame(renderBoard);
	mouseHeld = true;
};

document.getElementById('b').onmousemove = function mousemove(e) {
	bookPos = getCurrentPosition();
	rect = document.getElementById('b').getBoundingClientRect();

	let cellRow = Math.floor((e.clientY - rect.top) / cellSize);
	let cellCol = Math.floor((e.clientX - rect.left) / cellSize);

	let marginX = (e.clientX - rect.left) % cellSize;
	let marginY = (e.clientY - rect.top) % cellSize;

	let inSameCell = inRange(marginX - e.movementX, 0, cellSize - 1) && inRange(marginY - e.movementY, 0, cellSize - 1); // check if previous position crossed cell boundary

	// now triggers even when re-entering the same cell, but the effect is inconsequential
	let updateCanvas = mouseHeld && !inSameCell;
	if (!updateCanvas)
		return;

	drawCanvasCell(cellRow, cellCol);

	updateBook();
	autoEncode();
	requestAnimationFrame(renderBoard);
};

function drawCanvasCell(cellRow, cellCol) {
	var minoMode = document.getElementById('minoModeInput').checked;
	var autoColorBool = document.getElementById('autoColorInput').checked;
	if (minoMode) {
		drawCanvasMinoMode();
	} else if (autoColorBool) {
		drawCanvasAutoColorMode();
	} else {
		drawCanvasNormalMode();
	}

	function drawCanvasMinoMode() {
		let drawnCount = drawnMinos(minoModeBoard, (cell) => cell.t !== 0); //should be equivalent to cell.t == 1

		if (drawMode && drawnCount < 4 && board[cellRow][cellCol].t == 0) {
			minoModeBoard[cellRow][cellCol] = { t: 1, c: 'X' };
		}

		if (!drawMode) {
			minoModeBoard[cellRow][cellCol] = { t: 0, c: '' };
			//remove colors when there are four minos and user deletes one
			if (drawnCount == 4) {
				for (let row in minoModeBoard) {
					for (let col in minoModeBoard[row]) {
						if (minoModeBoard[row][col].t != 0) {
							minoModeBoard[row][col].c = 'X';
						}
					}
				}
			}
		}

		function drawnMinos(someBoard, cellMatch) {
			return someBoard.reduce((count,row) => {
				return count += row.reduce((tval,cell) => {
					return tval += cellMatch(cell)
				}, 0)
			}, 0)
		}
	}

	function drawCanvasNormalMode() {
		let rowFill = document.getElementById('rowFillInput').checked;
		if (rowFill) {
			for (let col in board[cellRow]) {
				board[cellRow][col] = (drawMode ? { t: 1, c: paintbucketColor() } : { t: 0, c: '' });
			}
			board[cellRow][cellCol] = { t: 0, c: '' };
		} else {
			board[cellRow][cellCol] = (drawMode ? { t: 1, c: paintbucketColor() } : { t: 0, c: '' });
		}
	}

	function drawCanvasAutoColorMode() {
		//auto color is basically mino mode and normal combined.
		if (drawMode) {
			//recognise piece
			let positions = [];
			for (let row = 0; row < boardSize[1]; row++) {
				for (let col = 0; col < boardSize[0]; col++) {
					if (board[row][col].t == 2) {
						positions.push([row, col]);
					}
				}
			}

			if (positions.length < 4) {
				board[cellRow][cellCol] = { t: 2, c: 'X' };
				positions.push([cellRow, cellCol]);
			}

			if (positions.length === 4) {
				let pieceMino = readPiece(positions, true);
				if (pieceMino === undefined)
					return; // remain gray

				for (let position of positions) {
					board[position[0]][position[1]].c = pieceMino.type;
				}
			}
		} else {
			board[cellRow][cellCol] = { t: 0, c: '' };
		}
	}
}

document.onmouseup = function mouseup() {
	var minoMode = document.getElementById('minoModeInput').checked;
	bookPos = getCurrentPosition(); //used by program, only updates bookPos

	if (minoMode)
		finishMinoMode();

	mouseHeld = false;
	updateBook();
	//autoEncode() prevent overwriting text pasted into textboxes
	requestAnimationFrame(renderBoard);

	function finishMinoMode() {
		var positions = [];
		//get all drawn cells + their coords
		for (let row in minoModeBoard) {
			for (let col in minoModeBoard[row]) {
				if (minoModeBoard[row][col].t != 0) {
					positions.push([row, col]);
				}
			}
		}

		if (positions.length != 4)
			return;

		operation = readPiece(positions, false);
		if (operation === undefined)
			return;

		//coloring in
		for (let position of positions) {
			minoModeBoard[position[0]][position[1]].c = operation.type;
		}
	}
};

//CONTRIBUTED BY CONFIDENTIAL (confidential#1288)
function readPiece(mino_positions, recognise_split_minos) { //this has been majorly reworked
    // if (mino_positions.length != 4){
    //     return 'X'
    // }

	//sort ascending by y then x
	mino_positions.sort((a,b) => a[0] - b[0] || a[1] - b[1])
	
	var positions = (recognise_split_minos ? unsplit_minos(mino_positions) : mino_positions)
    
    for (let [piece, piece_table] of Object.entries(shape_table)) {
		for (let [rotation, piece_positions] of Object.entries(piece_table)) {
			// if the offset matches, then all pieces should converge to a single origin
			let all_origins = []
			for (let i = 0; i < piece_positions.length; i++) {
				all_origins.push([positions[i][0] - piece_positions[i][0], positions[i][1] - piece_positions[i][1]])
			}

			if (agreed_origin(all_origins)) {
				return new Mino(piece, rotation, all_origins[0][1], 19-all_origins[0][0]) //fumen has inverted y axis
			}
		}
    }
	return undefined //if none of the tables match, then it isn't a tetromino shape

	function agreed_origin(all_origins) {
		return all_origins.every((origin) => origin[0] == all_origins[0][0] && origin[1] == all_origins[0][1])
	}

	function unsplit_minos(mino_positions) { //assumed mino_positions is sorted by y then x, both ascending
		//or implement as sliding windows, only increasing y by at most 1 each time
		let unsplit_mino_positions = [mino_positions[0]]
		for (let i in mino_positions) {
			if (i == 0) continue;
			let y_increment = Math.min(1, mino_positions[i][0] - mino_positions[i-1][0]) //clamp y increment per position to 1
			let previous_mino_position = unsplit_mino_positions[unsplit_mino_positions.length-1]
			unsplit_mino_positions.push([previous_mino_position[0] + y_increment, mino_positions[i][1]])
		}
		return unsplit_mino_positions;
	}
}