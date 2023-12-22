const { Mino } = require('tetris-fumen')
import { inRange, shape_table, cellSize, boardSize } from "../global-utils.js";
import { bookState, displayState } from "./EditorState.js";
import { isModeAutoColor, isModeMinoMode, isModeRowFill } from "./fumen-editor-buttons.js";

function paintbucketColor() {
	for (let colorOption of document.paintbucket) {
		if (colorOption.checked) {
			return colorOption.id;
		}
	}
}

function drawnMinos(someBoard, cellMatch) {
	return someBoard.reduce((count, row) => {
		return count += row.reduce((tval, cell) => {
			return tval += cellMatch(cell)
		}, 0)
	}, 0)
}

//FUMEN EDITOR BINDINGS
var mouseHeld = false;
var drawMode = true; // 0 for erasing, 1 for painting a cell
document.getElementById('b').addEventListener('mousedown', (e) => {
	let mode = document.getElementById('editorMode').value;
	let rect = document.getElementById('b').getBoundingClientRect();
	let cellRow = Math.floor((e.clientY - rect.top) / cellSize);
	let cellCol = Math.floor((e.clientX - rect.left) / cellSize);

	// drawMode is 0 (remove) if you a) right click, or b) left click on a filled cell with the same color as the paintbucket color, or c) left click on a filled mino cell
	drawMode = !(e.button !== 0 || displayState.board[cellRow][cellCol].c === paintbucketColor() || displayState.minoModeBoard[cellRow][cellCol].t === 1);

	let autoColorCount = drawnMinos(displayState.board, cell => cell.t === 2)
	if (isModeAutoColor(mode) && drawMode && autoColorCount == 4) {
		bookState.solidifyBoard()
	}
	drawCanvasCell(cellRow, cellCol);
	mouseHeld = true;
})

document.getElementById('b').addEventListener('mousemove', (e) => {
	let rect = document.getElementById('b').getBoundingClientRect();

	let cellRow = Math.floor((e.clientY - rect.top) / cellSize);
	let cellCol = Math.floor((e.clientX - rect.left) / cellSize);

	let marginX = (e.clientX - rect.left) % cellSize;
	let marginY = (e.clientY - rect.top) % cellSize;

	let inSameCell = inRange(marginX - e.movementX, 0, cellSize - 1) && inRange(marginY - e.movementY, 0, cellSize - 1); // check if previous position crossed cell boundary

	// now triggers even when re-entering the same cell, but the effect is inconsequential
	let updateCanvas = mouseHeld && !inSameCell;
	if (!updateCanvas) return

	drawCanvasCell(cellRow, cellCol);
})

function drawCanvasCell(cellRow, cellCol) {
	let mode = document.getElementById('editorMode').value;
	if (isModeMinoMode(mode)) {
		drawCanvasMinoMode();
	} else if (isModeAutoColor(mode)) {
		drawCanvasAutoColorMode();
	} else {
		drawCanvasNormalMode(isModeRowFill(mode));
	}

	function drawCanvasMinoMode() {
		let currentMinoModeBoard = displayState.minoModeBoard
		let drawnCount = drawnMinos(currentMinoModeBoard, cell => cell.t === 1);

		if (drawMode && drawnCount < 4 && displayState.board[cellRow][cellCol].t == 0) { // draw if a) drawing, b) not exceeding 4 minos, and c) not drawing over existing minos
			//TODO: this probably calls for a combined board instead of a board for normal and glued cells
			currentMinoModeBoard[cellRow][cellCol] = { t: 1, c: 'X' };
		}

		if (!drawMode) { // erase
			currentMinoModeBoard[cellRow][cellCol] = { t: 0, c: '' };
			//remove colors when there are four minos and user deletes one
			if (drawnCount == 4) {
				for (let row in currentMinoModeBoard) {
					for (let col in currentMinoModeBoard[row]) {
						if (currentMinoModeBoard[row][col].t != 0) {
							currentMinoModeBoard[row][col].c = 'X';
						}
					}
				}
			}
		}
		bookState.updateCurrentPage({ minoModeBoard: currentMinoModeBoard })
	}

	function drawCanvasNormalMode(rowFill) {
		let currentBoard = displayState.board
		if (rowFill) { //TODO: im bad at organising this flow
			for (let col in currentBoard[cellRow]) {
				currentBoard[cellRow][col] = (drawMode && displayState.minoModeBoard[cellRow][col].t != 1 ? { t: 1, c: paintbucketColor() } : { t: 0, c: '' }); //so not draw if over a glued mino
			}
			currentBoard[cellRow][cellCol] = { t: 0, c: '' };
		} else {
			currentBoard[cellRow][cellCol] = (drawMode && displayState.minoModeBoard[cellRow][cellCol].t != 1 ? { t: 1, c: paintbucketColor() } : { t: 0, c: '' });
		}
		bookState.updateCurrentPage({ board: currentBoard })
	}

	function drawCanvasAutoColorMode() {
		//auto color is basically mino mode and normal combined.
		let currentBoard = displayState.board
		if (drawMode) {
			//recognise piece
			let positions = [];
			for (let row = 0; row < boardSize[1]; row++) {
				for (let col = 0; col < boardSize[0]; col++) {
					if (currentBoard[row][col].t == 2) {
						positions.push([row, col]);
					}
				}
			}

			if (positions.length < 4 && displayState.minoModeBoard[cellRow][cellCol].t != 1) {
				currentBoard[cellRow][cellCol] = { t: 2, c: 'X' };
				positions.push([cellRow, cellCol]);
			}

			if (positions.length === 4) {
				let pieceMino = readPiece(positions, true);
				if (pieceMino !== undefined) {
					for (let position of positions) {
						currentBoard[position[0]][position[1]].c = pieceMino.type;
					}
				}
			}
		} else {
			currentBoard[cellRow][cellCol] = { t: 0, c: '' };
		}
		bookState.updateCurrentPage({ board: currentBoard })
	}
}

//bindings to prevent overwriting boardOutput from mouseup
document.getElementById('insertFumen').addEventListener('mouseup', (e) => e.stopPropagation())
document.getElementById('importFumen').addEventListener('mouseup', (e) => e.stopPropagation())
document.getElementById('boardOutput').addEventListener('mouseup', (e) => e.stopPropagation())
document.addEventListener('mouseup', () => {
	let mode = document.getElementById('editorMode').value;
	if (isModeMinoMode(mode)) finishMinoMode();

	mouseHeld = false;

	function finishMinoMode() {
		let minoModeBoard = displayState.minoModeBoard
		var positions = [];
		//get all drawn cells + their coords
		for (let row in minoModeBoard) {
			for (let col in minoModeBoard[row]) {
				if (minoModeBoard[row][col].t != 0) {
					positions.push([row, col]);
				}
			}
		}

		if (positions.length != 4) return;

		let operation = readPiece(positions, false)

		if (operation != undefined) {
			//coloring in
			for (let position of positions) {
				minoModeBoard[position[0]][position[1]] = { t: 1, c: operation.type };
			}
		}

		bookState.updateCurrentPage({ operation: operation, minoModeBoard: minoModeBoard })
	}
})

//CONTRIBUTED BY CONFIDENTIAL (confidential#1288)
function readPiece(mino_positions, recognise_split_minos) { //this has been majorly reworked
	// if (mino_positions.length != 4){
	//     return 'X'
	// }

	//sort ascending by y then x
	mino_positions.sort((a, b) => a[0] - b[0] || a[1] - b[1])

	var positions = (recognise_split_minos ? unsplit_minos(mino_positions) : mino_positions)

	for (let [piece, piece_table] of Object.entries(shape_table)) {
		for (let [rotation, piece_positions] of Object.entries(piece_table)) {
			// if the offset matches, then all pieces should converge to a single origin
			let all_origins = []
			for (let i = 0; i < piece_positions.length; i++) {
				all_origins.push([positions[i][0] - piece_positions[i][0], positions[i][1] - piece_positions[i][1]])
			}

			if (agreed_origin(all_origins)) {
				return new Mino(piece, rotation, all_origins[0][1], 19 - all_origins[0][0]) //fumen has inverted y axis
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
			let y_increment = Math.min(1, mino_positions[i][0] - mino_positions[i - 1][0]) //clamp y increment per position to 1
			let previous_mino_position = unsplit_mino_positions[unsplit_mino_positions.length - 1]
			unsplit_mino_positions.push([previous_mino_position[0] + y_increment, mino_positions[i][1]])
		}
		return unsplit_mino_positions;
	}
}