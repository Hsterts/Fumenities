const { Mino/*, Field*/ } = require('tetris-fumen');
import { boardSize, cellSize, shape_table } from './Fumen Utils_files/global-utils.js'
import { renderBoardOnCanvas } from './Fumen Utils_files/board-render.js';
import { updateBook, settoPage } from './Fumen Utils_files/event-listeners.js';

//BOARD
var board = []
var book = []
var undoLog = []
var redoLog = []
var operation // {type: 'I', rotation: 'reverse', x: 4, y: 0}
var flags = {lock: true}

//MAKING FIRST EMPTY BOARD
const aRow = []
const emptyBoard = []
for(let i = 0; i < boardSize[0]; i++) {aRow.push({ t: 0, c: '' })}
for (let i = 0; i < boardSize[1]; i++) {emptyBoard.push(aRow)}

var board = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy
var minoModeBoard = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy

var bookPos = 0
book = [{board: JSON.stringify(emptyBoard), comment: '', operation: undefined, minoBoard: JSON.stringify(emptyBoard), flags},]
settoPage(bookPos)
updateBook()
window.requestAnimationFrame(renderBoard)

// CANVAS
var ctx = document.getElementById('b').getContext('2d')
document.getElementById('b').height = boardSize[1] * cellSize
document.getElementById('b').width = boardSize[0] * cellSize
document.getElementById('b').style.outline = '2px solid #ffffffcc'

//USER INPUT

//FUNCTIONS
function drawnMinos(someBoard, cellMatch) {
	return someBoard.reduce((count,row) => {
		return count += row.reduce((tval,cell) => {
			return tval += cellMatch(cell)
		}, 0)
	}, 0)
}

function setPositionDisplay(pageIndex, totalPageNum) {
	document.getElementById('positionDisplay').value = pageIndex+1
	document.getElementById('positionDisplayOver').value = '/' + totalPageNum
}

function paintbucketColor() {
	for (i = 0; i < document.paintbucket.length; i++) {
		if (document.paintbucket[i].checked) {
			return document.paintbucket[i].id;
		}
	}
}

function insertFollowingPage(currentBookPos) {
	//push minomode onto current board
	let board = JSON.parse(book[currentBookPos]['board'])
	if (book[currentBookPos]['operation'] != undefined) {
		for (let row in board){
			for (let col in board[row]) {
				if (minoModeBoard[row][col].t != 0){
					board[row][col] = minoModeBoard[row][col]
				}
			}
		}
	}

	//Line clears if flag lock is on
	if (book[currentBookPos]['flags']['lock'] === true) {
		//going top down guarentees all line clears are performed
		for (let row in board) {
			let isFilled = (cell) => cell.t != 0
			if (board[row].every(isFilled)) {
				board.splice(row, 1)
				board.unshift(aRow)
			}
		}
	}
	
	let newPage = {
		board: JSON.stringify(board),
		minoBoard: JSON.stringify(emptyBoard),
		comment: book[currentBookPos]['comment'], //only works since we don't care about quiz mode
		operation: undefined,
		flags: {lock: document.getElementById('lockFlagInput').checked},
	}

	book.splice(currentBookPos+1, 0, newPage)
}


function renderBoard() {  //renders board and minoModeBoard
	//combine board and minomodeBoard
	let canvasStyle = (document.getElementById('defaultRenderInput').checked ? 'fumen' : 'four')
	var combinedBoardStats = {
		board: JSON.parse(JSON.stringify(board)), 
		tileSize: cellSize, 
		style: canvasStyle,
		lockFlag: document.getElementById('lockFlagInput').checked,
		grid: {
			fillStyle: '#000000',
			strokeStyle: '#ffffff'
		},
	}
	for (let row in minoModeBoard) {
		for (let col in minoModeBoard[row]) {
			if (minoModeBoard[row][col].t === 1) combinedBoardStats.board[row][col] = { t: 2, c: minoModeBoard[row][col].c }
		}
	}

	var newCanvas = renderBoardOnCanvas(combinedBoardStats)
	ctx.drawImage(newCanvas, 0, 0)
}

//CONTRIBUTED BY CONFIDENTIAL (confidential#1288)
function readPiece(mino_positions, recognise_split_minos) {
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


//from io.js
function toField(board) { //only reads color of minos, ignoring the type
    FieldString = ''
	for (let row of board) {
		for (let cell of row) {
			FieldString += (cell.c == '' ? '_' : cell.c)
		}
	}
    return Field.create(FieldString)
}

// //gonna just leave this here, used it to convert wirelyre mino-board strings to fumens
// function wireEncode(){
// 	inputs = document.getElementById('input').value.split('\n')
// 	outputs = []
// 	for(let i = 0; i < inputs.length; i++){
// 		outputs.push(encodeString(inputs[i]))
// 	}
// 	document.getElementById('output').value = outputs.join('\n')
// }

// function encodeString(fieldString) {
// 	var pages = []
// 	var fieldArray = JSON.parse(JSON.stringify(emptyBoard))
// 	fieldArray.splice(16, 4)
// 	var rows = fieldString.split(',')

// 	for (let i = 0; i < 4; i++){
// 		let row = []
// 		for (let j = 0; j < 10; j++){
// 			let mino = {c: rows[i].split('')[j]}
// 			row.push(mino)
// 		}
// 		fieldArray.push(row)
// 	}

// 	var field = toField(fieldArray)
// 	var page = {field}
// 	pages.push(page)

// 	return encoder.encode(pages)
// }