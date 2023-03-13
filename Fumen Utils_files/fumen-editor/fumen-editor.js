const { Field } = require('tetris-fumen');
import { fullEncode, encode } from "./fumen-editor-buttons.js";
import { boardSize, cellSize } from '../global-utils.js'
import { renderBoard } from '../rendering/board-render.js';

//BOARD
//TODO: contain all of these globals inside this module
var board = []
var book = []
var undoLog = []
var redoLog = []
var operation // {type: 'I', rotation: 'reverse', x: 4, y: 0}
var flags = {lock: true}

//MAKING FIRST EMPTY BOARD
const aRow = []
const emptyBoard = []
for (let i = 0; i < boardSize[0]; i++) {aRow.push({ t: 0, c: '' })}
for (let i = 0; i < boardSize[1]; i++) {emptyBoard.push(aRow)}

var board = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy
var minoModeBoard = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy

var bookPos = 0
book = [{board: JSON.stringify(emptyBoard), comment: '', operation: undefined, minoBoard: JSON.stringify(emptyBoard), flags},]
settoPage(bookPos)
updateBook()
window.requestAnimationFrame(renderBoard)

// CANVAS
// var ctx = document.getElementById('b').getContext('2d')
document.getElementById('b').height = boardSize[1] * cellSize
document.getElementById('b').width = boardSize[0] * cellSize
document.getElementById('b').style.outline = '2px solid #ffffffcc'

//INITIALIZATION
setPositionDisplay(bookPos, book.length)

//SHORTCUTS
Mousetrap.bind({
	'esc': function() { decreaseResetLevel(); decreaseseClearInputLevel();},
	'=': expandSidebars,
	'-': retractSideBars,
})

//mousetrap-exclusive bindings
function decreaseResetLevel() {
	document.getElementById('reset').classList.remove('confirm-delete-data')
}

function decreaseseClearInputLevel() {
	document.getElementById('clear-input').classList.remove('confirm-delete-data')
}

function expandSidebars() {
	var fumenSidebar = document.getElementById('fumenSidebar')
	var settingsSidebar = document.getElementById('settingsSidebar')
	let fumenSidebarVisible = !fumenSidebar.classList.contains('hide-element')
	if (fumenSidebarVisible) { //make arrow state agree with current state
		let settingsButton = document.getElementsByClassName('option-left')[0]
		let openLogo = document.getElementById('openFumenSettings')
		let closeLogo = document.getElementById('closeFumenSettings')
		settingsSidebar.classList.remove('hide-element')
		settingsButton.style.right = '459px'
		settingsButton.style.borderBottomLeftRadius = '0px'
		settingsButton.style.borderBottomRightRadius = '10px'
	    openLogo.style.display = 'none'
	    closeLogo.style.display = 'block'
	}
	settingsSidebar.classList.toggle('hide-element', !fumenSidebarVisible)
	fumenSidebar.classList.remove('hide-element')
}

function retractSideBars() {
	var fumenSidebar = document.getElementById('fumenSidebar')
	var settingsSidebar = document.getElementById('settingsSidebar')
	let settingsSidebarVisible = !settingsSidebar.classList.contains('hide-element')
	if (settingsSidebarVisible) {//make arrow state agree with current state
		let settingsButton = document.getElementsByClassName('option-left')[0]
		let openLogo = document.getElementById('openFumenSettings')
		let closeLogo = document.getElementById('closeFumenSettings')
		settingsSidebar.classList.add('hide-element')
		settingsButton.style.right = '500px'
		settingsButton.style.borderBottomRightRadius = '0px'
		settingsButton.style.borderBottomLeftRadius = '10px'
	    openLogo.style.display = 'block'
	    closeLogo.style.display = 'none'
	}
	fumenSidebar.classList.toggle('hide-element', !settingsSidebarVisible)
	settingsSidebar.classList.add('hide-element')
}


export function autoEncode() {
    if (document.getElementById('autoEncode').checked == false) return;

    let encodingType = document.getElementById('encodingType').value;

    if (encodingType == 'fullFumen') fullEncode();
    else if (encodingType == 'currentFumenPage') encode();
}

//from io.js
export function toField(board) { //only reads color of minos, ignoring the type
    FieldString = ''
	for (let row of board) {
		for (let cell of row) {
			FieldString += (cell.c == '' ? '_' : cell.c)
		}
	}
    return Field.create(FieldString)
}

// Updates all of the board properties: board, minoBoard, operation, comments
export function updateBook() { //temporary export, might not be necessary
	bookPos = getCurrentPosition()
	book[bookPos] = {
		board: JSON.stringify(board),
		minoBoard: JSON.stringify(minoModeBoard),
		comment: document.getElementById('commentBox').value,
		operation: operation,
		flags: {lock: document.getElementById('lockFlagInput').checked},
	}
	document.getElementById('commentBox').value = (book[bookPos]['comment'] != undefined ? book[bookPos]['comment'] : '')

	undoLog.push(JSON.stringify(book))
	//Limit undos to 100 entries
	if(undoLog.length > 100){
		undoLog.shift()
	}

	//Clearing redo if branch is overwritten
	redoLog = [];

	setPositionDisplay(bookPos, book.length)
	updateAutoColor()
	updateRowFillInput()
	window.requestAnimationFrame(renderBoard)
}

export function settoPage(newPagePos) {
	// Bound bookPos to existing pages
	newPagePos = Math.max(Math.min(book.length-1, newPagePos), 0)

	setPositionDisplay(newPagePos, book.length)
	board = JSON.parse(book[newPagePos]['board'])
	minoModeBoard = JSON.parse(book[newPagePos]['minoBoard'])
	document.getElementById('commentBox').value = book[newPagePos]['comment']
	operation = book[newPagePos]['operation']
	document.getElementById('lockFlagInput').checked = book[newPagePos]['flags']['lock']
}

export function setPositionDisplay(pageIndex, totalPageNum) { //temporary export, might not be necessary
	document.getElementById('positionDisplay').value = pageIndex+1
	document.getElementById('positionDisplayOver').value = '/' + totalPageNum
}

export function getCurrentPosition() {
	let Position = parseInt(document.getElementById('positionDisplay').value) - 1;
	if (isNaN(Position))
		return 0;
	else
		return Position;
}

import "./fumen-editor-buttons.js"
import "./fumen-editor-mouse.js"