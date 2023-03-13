import { boardSize, cellSize } from './Fumen Utils_files/global-utils.js'
import { renderBoard } from './Fumen Utils_files/board-render.js';
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

// const { Field } = require('tetris-fumen');
// function toField(board) { //only reads color of minos, ignoring the type
//     var FieldString = ''
// 	for (let row of board) {
// 		for (let cell of row) {
// 			FieldString += (cell.c == '' ? '_' : cell.c)
// 		}
// 	}
//     return Field.create(FieldString)
// }