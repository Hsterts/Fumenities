const { Field, encoder } = require('tetris-fumen');
import { boardSize, cellSize, emptyBoard } from '../global-utils.js'
import { renderBoard } from '../rendering/board-render.js';
import { EditorState } from './EditorState.js';

//BOARD
//TODO: contain all of these globals inside this module
// var board = []
// var book = []
// var undoLog = []
// var redoLog = []
// var operation // {type: 'I', rotation: 'reverse', x: 4, y: 0}
// var flags = {lock: true}

//INITIALIZATION
updateAutoColor()
updateRowFillInput()

// var bookPos = 0
settoPage(0)
updateBook()
window.requestAnimationFrame(renderBoard)

// CANVAS
// var ctx = document.getElementById('b').getContext('2d')
document.getElementById('b').height = boardSize[1] * cellSize
document.getElementById('b').width = boardSize[0] * cellSize
document.getElementById('b').style.outline = '2px solid #ffffffcc'


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

function encodeFumen(...book) {
	var fullBook = []
	for (let pageNum in book) {
		let page = book[pageNum]
		fullBook.push({
			comment: page['comment'],
			operation: page['operation'],
			field: toField(JSON.parse(page['board'])),
			flags: {
				rise: false,
				mirror: false,
				colorize: true,
				comment: page['comment'],
				lock: page['flags']['lock'],
				piece: undefined,
			},
			index: pageNum, //necessary?
		});
	}
	return encoder.encode(fullBook)
}

export function encode() { //use current page instead of accessing book?
	document.getElementById('boardOutput').value = encodeFumen(EditorState.book[EditorState.bookPos]);
}

export function fullEncode() {
	document.getElementById('boardOutput').value = encodeFumen(...EditorState.book);
}

//from io.js
function toField(board) { //only reads color of minos, ignoring the type
    let FieldString = ''
	for (let row of board) {
		for (let cell of row) {
			FieldString += (cell.c == '' ? '_' : cell.c)
		}
	}
    return Field.create(FieldString)
}

// Updates all of the board properties: board, minoBoard, operation, comments
export function updateBook() { //temporary export, might not be necessary
	let currentBook = EditorState.book
	currentBook[EditorState.bookPos] = { //TODO: maybe alter the board in the EditorState, then push into the book, instead of setting the book yourself?
		board: JSON.stringify(EditorState.board),
		minoBoard: JSON.stringify(EditorState.minoModeBoard),
		operation: EditorState.operation,
		comment: document.getElementById('commentBox').value,
		flags: {lock: document.getElementById('lockFlagInput').checked},
	}
	EditorState.setBook(currentBook)
	document.getElementById('commentBox').value = EditorState.book[EditorState.bookPos]['comment'] ?? '' //use cuurent comment instead?

	EditorState.addLog()

	updateAutoColor()
	updateRowFillInput()
	autoEncode()
	window.requestAnimationFrame(renderBoard)
}

export function updateAutoColor() {
	var autoColorBool = document.getElementById('autoColorInput').checked
	var isAutoColorUsable = !document.getElementById('minoModeInput').checked
	document.getElementById('autoColorInput').classList.toggle('disabled', !isAutoColorUsable)
	
	if(!(isAutoColorUsable && autoColorBool)) EditorState.solidifyBoard()
}

export function updateRowFillInput() {
	var isRowFillUsable = !document.getElementById('minoModeInput').checked && !document.getElementById('autoColorInput').checked
	document.getElementById('rowFillInput').classList.toggle('disabled', !isRowFillUsable)
}

export function settoPage(newPagePos) { //move from book to board, minoboard and operation //TODO: move to EditorState?
	// Bound bookPos to existing pages
	newPagePos = Math.max(Math.min(EditorState.book.length-1, newPagePos), 0)

	EditorState.setBoard(JSON.parse(EditorState.book[newPagePos]['board']))
	EditorState.setMinoModeBoard(JSON.parse(EditorState.book[newPagePos]['minoBoard']))
	EditorState.setOperation(EditorState.book[newPagePos]['operation'])
	setPositionDisplay(newPagePos, EditorState.book.length)
	document.getElementById('commentBox').value = EditorState.book[newPagePos]['comment']
	document.getElementById('lockFlagInput').checked = EditorState.book[newPagePos]['flags']['lock']
}

function setPositionDisplay(pageIndex, totalPageNum) {
	document.getElementById('positionDisplay').value = pageIndex+1
	document.getElementById('positionDisplayOver').value = '/' + totalPageNum
}
// import "./fumen-editor-buttons.js"
// import "./fumen-editor-mouse.js"