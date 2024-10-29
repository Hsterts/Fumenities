const { Field, encoder, decoder } = require('tetris-fumen');
import { getDelimiter, shape_table, emptyBoard, emptyRow } from "../global-utils.js"
import { autoEncode } from "./fumen-editor.js"
import importImage from "./importImage.js"
import { pageToBoard } from "../rendering/board-render.js"
import { bookState, displayState, historyState } from "./EditorState.js"

//INITIALIZATION
updateToolTips()
updateAutoEncoding()
window.requestAnimationFrame(() => displayState.display()) // render board

//SHORTCUTS
Mousetrap.bind({
	'N': function () { setEditorMode('normal') },
	'M m': function () { setEditorMode('minoMode') },
	'A c': function () { setEditorMode('autoColor') },
	'R f': function () { setEditorMode('rowFill') },

	'1': function () { setPaintBucket(0) },
	'2': function () { setPaintBucket(1) },
	'3': function () { setPaintBucket(2) },
	'4': function () { setPaintBucket(3) },
	'5': function () { setPaintBucket(4) },
	'6': function () { setPaintBucket(5) },
	'7': function () { setPaintBucket(6) },
	'8': function () { setPaintBucket(7) },

	'left': prevPage,
	'mod+left': startPage,
	'right': nextPage,
	'mod+right': endPage,

	'shift+up': function () { shift('up') },
	'shift+down': function () { shift('down') },
	'shift+left': function () { shift('left') },
	'shift+right': function () { shift('right') },

	'M p': mirror,
	'M f': fullMirror,
	'G p': grayoutPage,
	'G f': grayoutFumen,
	'D p': dupliPage,
	'alt+backspace': clearPage,
	'del': deletePage,
	'r': increaseResetLevel,

	// Import image already binded to paste
	'ins': insertFumen,
	'I f': importFumen,
	'E p': exportPage,
	'E f': exportFumen,
	'+': addToInput,

	'A e': toggleAutoEncoding,

	'l': toggleLock,

	'T t': toggleToolTips,
	'# d': toggle3dSetting,
	'U d': toggleStyle,

	'mod+z': undo,
	'mod+y': redo,
})

//mousetrap-exclusive bindings
function setPaintBucket(index) {
	document.paintbucket[index].checked = true;
}

function setEditorMode(value) {
	document.getElementById('editorMode').value = value;
	updateEditorMode()
}

function toggleAutoEncoding() {
	document.getElementById('autoEncode').checked = !document.getElementById('autoEncode').checked
	updateAutoEncoding()
}

function toggleLock() {
	document.getElementById('lockFlagInput').checked = !document.getElementById('lockFlagInput').checked
	updateLockFlag()
}

function toggleToolTips() {
	document.getElementById('tooltipSetting').checked = !document.getElementById('tooltipSetting').checked
	updateToolTips()
}

function toggle3dSetting() {
	document.getElementById('3dSetting').checked = !document.getElementById('3dSetting').checked
	update3dSetting()
}

function toggleStyle() {
	document.getElementById('defaultRenderInput').checked = !document.getElementById('defaultRenderInput').checked
	updateStyle()
}

//cosmetic bindings
for (let fumenOption of document.getElementsByClassName('fumen-option')) {
	fumenOption.addEventListener("click", () => fumenOption.blur)
}

//html bindings

// avoid having to use check the string value directly in other modules, a limitation from not having enums.
export function isModeNormal(mode) {
	return mode == 'normal'
}

export function isModeAutoColor(mode) {
	return mode == 'autoColor'
}

export function isModeRowFill(mode) {
	return mode == 'rowFill'
}

export function isModeMinoMode(mode) {
	return mode == 'minoMode'
}

document.getElementById("editorMode").addEventListener("change", updateEditorMode)
let editorMode = document.getElementById("editorMode").value; // used by function below to keep track of previous mode before switching
function updateEditorMode() {
	// console.log(document.getElementById("editorMode").value);
	// cleaning up when exiting a mode
	switch (editorMode) {
		case 'autoColor':
			bookState.solidifyBoard()
			break;
		case 'minoMode':
			// clear minoModeBoard without a glued piece when exiting minoMode
			if (displayState.operation == undefined) bookState.updateCurrentPage({ minoModeBoard: emptyBoard() })
			break;
		default:
			console.error("Unknown editor mode: " + editorMode); i
		// no cleanup necessary
		case 'normal':
		case 'rowFill':
			break;
	}

	// update to new mode
	editorMode = document.getElementById("editorMode").value;

	let disablePaintBucket = isModeMinoMode(editorMode) || isModeAutoColor(editorMode);
	document.getElementsByClassName("paint-bucket")[0].classList.toggle('disabled', disablePaintBucket);
}

document.getElementById("startPage").addEventListener("click", startPage)
function startPage() {
	bookState.solidifyBoard()
	bookState.displayBookPage(0)
}

document.getElementById("prevPage").addEventListener("click", prevPage)
function prevPage() {
	bookState.solidifyBoard()
	bookState.displayBookPage(bookState.bookPos - 1)
}

document.getElementById("positionDisplay").addEventListener("focusout", gotoPage)
function gotoPage() {
	bookState.solidifyBoard()
	bookState.displayBookPage(getCurrentPosition())

	function getCurrentPosition() {
		let Position = parseInt(document.getElementById('positionDisplay').value) - 1; //convert to zero-indexed
		return (isNaN(Position) ? 0 : Position)
	}
}

function insertFollowingPage() {
	//push minomode onto current board
	let board = displayState.board
	if (displayState.operation != undefined) {
		for (let row in board) {
			for (let col in board[row]) {
				let minoCell = displayState.minoModeBoard[row][col]
				if (minoCell.t != 0) {
					board[row][col] = minoCell
				}
			}
		}
	}

	//Line clears if flag lock is on
	if (displayState.flags.lock === true) {
		let isFilled = (cell) => cell.t != 0
		let filteredBoard = board.filter((row) => !row.every(isFilled))
		board = [...Array.from({ length: board.length - filteredBoard.length }, () => emptyRow()), ...filteredBoard]
	}

	let currentBook = bookState.book
	let newPage = {
		board: JSON.stringify(board),
		minoModeBoard: JSON.stringify(emptyBoard()),
		comment: displayState.comment, //only works since we don't care about quiz mode
		operation: undefined,
		flags: { lock: displayState.flags.lock },
	}

	currentBook.splice(bookState.bookPos + 1, 0, newPage)
	bookState.setBook(currentBook)
}

document.getElementById("nextPage").addEventListener("click", nextPage)
function nextPage() {
	bookState.solidifyBoard()
	if (bookState.bookPos == bookState.book.length - 1) { // Create new page when at the last page
		insertFollowingPage()
	}

	bookState.displayBookPage(bookState.bookPos + 1) // next page
}

document.getElementById("endPage").addEventListener("click", endPage)
function endPage() {
	bookState.solidifyBoard()
	bookState.displayBookPage(bookState.book.length - 1)
}

document.getElementById("shiftLeft").addEventListener("click", function () { shift('left') })
document.getElementById("shiftUp").addEventListener("click", function () { shift('up') })
document.getElementById("shiftDown").addEventListener("click", function () { shift('down') })
document.getElementById("shiftRight").addEventListener("click", function () { shift('right') })
function shift(direction) {
	let board = displayState.board
	switch (direction) {
		case 'left':
			board.map((y) => {
				y.shift()
				y.push({ t: 0, c: '' })
			})
			break;
		case 'up':
			board.shift()
			board.push(emptyRow())
			break;
		case 'down':
			board.unshift(emptyRow())
			board.pop()
			break;
		case 'right':
			board.map((y) => {
				y.unshift({ t: 0, c: '' })
				y.pop()
			})
			break;
	}
	bookState.updateCurrentPage({ board: board })
}

document.getElementById("undo").addEventListener("click", undo)
function undo() {
	historyState.undo()
}

document.getElementById("redo").addEventListener("click", redo)
function redo() {
	historyState.redo()
}

document.getElementById("mirrorPage").addEventListener("click", mirror)
function flipBoard(board) {
	const reversed = { Z: 'S', L: 'J', O: 'O', S: 'Z', I: 'I', J: 'L', T: 'T', X: 'X' };

	let newBoard = JSON.parse(JSON.stringify(board))
	for (let row in newBoard) {
		newBoard[row].reverse(); //reverse cells in row
		for (let col in newBoard[row]) {
			if (newBoard[row][col].t == 1) newBoard[row][col].c = reversed[newBoard[row][col].c]; //reverse colors in row
		}
	}
	return newBoard
}
function mirror() {
	bookState.updateCurrentPage({ board: flipBoard(displayState.board) })
}

document.getElementById("mirrorFumen").addEventListener("click", fullMirror)
function fullMirror() {
	let currentBook = bookState.book
	for (let page in currentBook) {
		currentBook[page]['board'] = JSON.stringify(flipBoard(JSON.parse(currentBook[page]['board'])))
		currentBook[page]['minoModeBoard'] = JSON.stringify(flipBoard(JSON.parse(currentBook[page]['minoModeBoard'])))
	}
	bookState.setBook(currentBook)
}

document.getElementById("grayoutPage").addEventListener("click", grayoutPage)
function grayoutBoard(board) {
	let newBoard = JSON.parse(JSON.stringify(board))
	for (let row in newBoard) {
		for (let col in newBoard[row]) {
			newBoard[row][col].c = (newBoard[row][col].c == "" ? "" : "X")
		}
	}
	return newBoard
}
function grayoutPage() {
	bookState.updateCurrentPage({ board: grayoutBoard(displayState.board) })
}
document.getElementById("grayoutFumen").addEventListener("click", grayoutFumen)
function grayoutFumen() {
	let newBook = bookState.book
	for (let page in newBook) {
		newBook[page]['board'] = JSON.stringify(grayoutBoard(JSON.parse(newBook[page]['board'])))
	}
	bookState.setBook(newBook)
}

document.getElementById("duplicatePage").addEventListener("click", dupliPage)
function dupliPage() {
	bookState.solidifyBoard()
	insertFollowingPage()
}

document.getElementById("clearPage").addEventListener("click", clearPage)
function clearPage() {
	bookState.updateCurrentPage({
		board: emptyBoard(),
		minoModeBoard: emptyBoard(),
		comment: '',
		operation: undefined,
		flags: { lock: true }
	})
}

document.getElementById("deletePage").addEventListener("click", deletePage)
function deletePage() {
	if (bookState.book.length == 1) {
		clearPage()
	} else {
		let book = bookState.book
		book.splice(bookState.bookPos, 1)
		bookState.setBook(book)
	}
}

document.getElementById("reset").addEventListener("click", increaseResetLevel)
function increaseResetLevel() {
	let confirmedReset = document.getElementById('reset').classList.contains('confirm-delete-data')
	if (confirmedReset) bookState.resetBook()
	document.getElementById('reset').classList.toggle('confirm-delete-data')
}

function decodeFumen() {
	var fumen = document.getElementById('boardOutput').value;
	var pages = decoder.decode(fumen);
	var tempBook = pages.map(page => {
		return {
			board: JSON.stringify(pageToBoard(page)),
			minoModeBoard: JSON.stringify(decodeOperation(page['operation'])),
			operation: page['operation'],
			comment: page['comment'],
			flags: page['flags'],
		}
	});

	return tempBook;

	function decodeOperation(operation) {
		if (operation === undefined) return emptyBoard() //no operation

		var decodedMinoModeBoard = emptyBoard()
		let pieceColor = operation.type
		let rotation = operation.rotation
		let x = operation.x
		let y = 19 - operation.y //fumen has inverted y axis

		let piecePositions = shape_table[pieceColor][rotation]
		for (let piecePosition of piecePositions) {
			decodedMinoModeBoard[y + piecePosition[0]][x + piecePosition[1]] = { t: 1, c: pieceColor }
		}

		return decodedMinoModeBoard
	}
}

document.addEventListener('paste', (event) => {
	let items = (event.clipboardData || event.originalEvent.clipboardData).items;
	for (let item of items) {
		if (item.kind == 'file') importImage(item.getAsFile());
	}
});

document.getElementById("importImage").addEventListener("click", importImageButton)
async function importImageButton() {
	try {
		const clipboardItems = await navigator.clipboard.read(); //not supported on firefox
		for (const clipboardItem of clipboardItems) {
			for (const type of clipboardItem.types) {
				const blob = await clipboardItem.getType(type);

				importImage(blob);
			}
		}
	} catch (err) {
		console.log(err.message, "\nTry Ctrl V instead.");
	}
}

document.getElementById("insertFumen").addEventListener("click", insertFumen)
function insertFumen() {
	let book = bookState.book
	book.splice(bookState.bookPos, 0, ...decodeFumen())
	bookState.setBook(book)
};

document.getElementById("importFumen").addEventListener("click", importFumen)
function importFumen() {
	bookState.setBook(decodeFumen())
	bookState.displayBookPage(0)
};

document.getElementById("exportPage").addEventListener("click", exportPage)
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
export function exportPage() { //use current page instead of accessing book?
	document.getElementById('boardOutput').value = encodeFumen(bookState.book[bookState.bookPos]);
}

document.getElementById("exportFumen").addEventListener("click", exportFumen)
export function exportFumen() {
	document.getElementById('boardOutput').value = encodeFumen(...bookState.book);
}


document.getElementById("addToInput").addEventListener("click", addToInput)
function addToInput() {
	document.getElementById('input').value += getDelimiter() + document.getElementById('boardOutput').value
}


document.getElementById("encodingType").addEventListener("change", autoEncode)
document.getElementById("autoEncode").addEventListener("click", updateAutoEncoding)
function updateAutoEncoding() {
	var boardOutput = document.getElementById('boardOutput')
	var isAutoEncode = document.getElementById('autoEncode').checked
	document.getElementById('autoEncodeOptions').classList.toggle('hide-element', !isAutoEncode)
	if (isAutoEncode) {
		boardOutput.style.height = '50px'
		autoEncode()
	} else {
		boardOutput.style.height = '78px'
	}
}

//additional settings bindings
document.getElementById("lockFlagInput").addEventListener("click", updateLockFlag)
function updateLockFlag() {
	bookState.updateCurrentPage({ flags: { lock: document.getElementById('lockFlagInput').checked } })
}

document.getElementById("tooltipSetting").addEventListener("click", updateToolTips)
function updateToolTips() {
	var tooltipTextElements = document.getElementsByClassName('tooltiptext')
	var enableToolTips = document.getElementById('tooltipSetting').checked
	for (let tooltipTextElement of tooltipTextElements) {
		tooltipTextElement.classList.toggle('hide-element', !enableToolTips)
	}
}

document.getElementById("3dSetting").addEventListener("click", update3dSetting)
function update3dSetting() {
	window.requestAnimationFrame(() => displayState.display())
}

document.getElementById("defaultRenderInput").addEventListener("click", updateStyle)
function updateStyle() {
	document.getElementById('3dToggle').classList.toggle('disabled', document.getElementById('defaultRenderInput').checked)
	window.requestAnimationFrame(() => displayState.display())
}

//automatic update bindings
document.getElementById("commentBox").addEventListener("change", updateComment) //this guarentees that comments get automatically written to book
function updateComment() {
	bookState.updateCurrentPage({ comment: document.getElementById("commentBox").value })
}

