const { Field, encoder, decoder } = require('tetris-fumen');
import { getDelimiter, shape_table, emptyBoard, emptyRow } from "../global-utils.js"
import { autoEncode, updateBook, settoPage } from "./fumen-editor.js"
import importImage from "./importImage.js"
import { pageToBoard, renderBoard } from "../rendering/board-render.js"
import { EditorState } from "./EditorState.js"

//INITIALIZATION
updateMinoMode()
updateAutoColor()
updateRowFillInput()
updateToolTips()
updateAutoEncoding()

//SHORTCUTS
Mousetrap.bind({
    '1': function() {setPaintBucket(0)},
	'2': function() {setPaintBucket(1)},
	'3': function() {setPaintBucket(2)},
	'4': function() {setPaintBucket(3)},
	'5': function() {setPaintBucket(4)},
	'6': function() {setPaintBucket(5)},
	'7': function() {setPaintBucket(6)},
	'8': function() {setPaintBucket(7)},
	'0': toggleMinoMode,
	
	'left': prevPage,
	'mod+left': startPage,
	'right': nextPage,
	'mod+right': endPage,
	
	'shift+up': function() {shift('up')},
	'shift+down': function() {shift('down')},
	'shift+left': function() {shift('left')},
	'shift+right': function() {shift('right')},
	
	'M p': mirror,
	'M f': fullMirror,
	'D p': dupliPage,
	'alt+backspace': clearPage,
	'del': deletePage,
	'r': increaseResetLevel,
	
	// Import image already binded to paste
	'ins': decodeInsert,
	'E p': encode,
	'I f': fullDecode,
	'E f': fullEncode,
	'+': addToInput,

	'A e': toggleAutoEncoding,
	
	'l': toggleLock,
	'A c': toggleAutoColor,
	'R f': toggleRowFillInput,
	
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

function toggleMinoMode() {
    document.getElementById('minoModeInput').checked = !document.getElementById('minoModeInput').checked
	updateMinoMode()
}

function toggleAutoEncoding() {
	document.getElementById('autoEncode').checked = !document.getElementById('autoEncode').checked
	updateAutoEncoding()
}

function toggleLock() {
	document.getElementById('lockFlagInput').checked = !document.getElementById('lockFlagInput').checked
	updateBook()
}

function toggleAutoColor() {
	document.getElementById('autoColorInput').checked = !document.getElementById('autoColorInput').checked
	updateAutoColor()
}
function updateAutoColor() {
	var autoColorBool = document.getElementById('autoColorInput').checked
	var isAutoColorUsable = !document.getElementById('minoModeInput').checked
	document.getElementById('autoColorInput').classList.toggle('disabled', !isAutoColorUsable)
	
	if(!(isAutoColorUsable && autoColorBool)) EditorState.solidifyBoard()
}

function toggleRowFillInput() {
	document.getElementById('rowFillInput').checked = !document.getElementById('rowFillInput').checked
	updateRowFillInput()
}
function updateRowFillInput() {
	var isRowFillUsable = !document.getElementById('minoModeInput').checked && !document.getElementById('autoColorInput').checked
	document.getElementById('rowFillInput').classList.toggle('disabled', !isRowFillUsable)
}

function toggleToolTips() {
	document.getElementById('tooltipSetting').checked = !document.getElementById('tooltipSetting').checked
	updateToolTips() 
}

function toggle3dSetting() {
	document.getElementById('3dSetting').checked = !document.getElementById('3dSetting').checked
	window.requestAnimationFrame(renderBoard)
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
document.getElementById("minoModeInput").addEventListener("click", updateMinoMode)
document.getElementById("minoModeInput").addEventListener("click", updateAutoColor)
document.getElementById("minoModeInput").addEventListener("click", updateRowFillInput)
function updateMinoMode() {
    let minoMode = document.getElementById('minoModeInput').checked
    if (!minoMode && EditorState.operation == undefined) { //clear minoModeBoard without a glued piece when exiting minoMode
		EditorState.setMinoModeBoard(emptyBoard())
		EditorState.setOperation(undefined)
		updateBook()
	}
}

document.getElementById("startPage").addEventListener("click", startPage)
function startPage() {
	EditorState.setBookPos(0)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("prevPage").addEventListener("click", prevPage)
function solidifyAutoColor(currentBookPos) { //turn autocolor cells into normal cells
	//TODO: alter board instead, and push changes to book?
	let currentBook = EditorState.book
	let currentBoard = JSON.parse(currentBook[currentBookPos]['board'])
	for (let row in currentBoard){
		for (let col in currentBoard[row]) {
			if (currentBoard[row][col].t === 2){
				currentBoard[row][col].t = 1
			}
		}
	}

	currentBook[currentBookPos]['board'] = JSON.stringify(currentBoard)
	EditorState.setBook(currentBook)
}
function prevPage() {
	solidifyAutoColor(EditorState.bookPos)
	EditorState.setBookPos(EditorState.bookPos-1)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}


document.getElementById("positionDisplay").addEventListener("focusout", gotoPage)
function gotoPage() {
	solidifyAutoColor(EditorState.bookPos)
	EditorState.setBookPos(getCurrentPosition())

	window.requestAnimationFrame(renderBoard)
	autoEncode()

	function getCurrentPosition() {
		let Position = parseInt(document.getElementById('positionDisplay').value) - 1;
		if (isNaN(Position))
			return 0;
		else
			return Position;
	}
}

function insertFollowingPage() { //TODO: move this into EditorState? or use the unpacked board instead of book
	let currentBookPos = EditorState.bookPos
	let currentBook = EditorState.book

	//push minomode onto current board
	let board = JSON.parse(currentBook[currentBookPos]['board'])
	if (currentBook[currentBookPos]['operation'] != undefined) {
		for (let row in board){
			for (let col in board[row]) {
				let minoCell = EditorState.minoModeBoard[row][col]
				if (minoCell.t != 0){
					board[row][col] = minoCell
				}
			}
		}
	}

	//Line clears if flag lock is on
	if (currentBook[currentBookPos]['flags']['lock'] === true) {
		//going top down guarentees all line clears are performed
		for (let row in board) {
			let isFilled = (cell) => cell.t != 0
			if (board[row].every(isFilled)) {
				board.splice(row, 1)
				board.unshift(emptyRow())
			}
		}
	}
	
	let newPage = {
		board: JSON.stringify(board),
		minoBoard: JSON.stringify(emptyBoard()),
		comment: currentBook[currentBookPos]['comment'], //only works since we don't care about quiz mode
		operation: undefined,
		flags: {lock: document.getElementById('lockFlagInput').checked},
	}

	currentBook.splice(currentBookPos+1, 0, newPage)
	EditorState.setBook(currentBook)
}

document.getElementById("nextPage").addEventListener("click", nextPage)
function nextPage() {
	if (EditorState.bookPos == EditorState.book.length-1) { // Create new page when at the last page
		solidifyAutoColor(EditorState.bookPos)
		insertFollowingPage()
	}
	
	EditorState.setBookPos(EditorState.bookPos + 1) // next page
	window.requestAnimationFrame(renderBoard)
	updateBook()
	autoEncode()
}

document.getElementById("endPage").addEventListener("click", endPage)
function endPage(){
	EditorState.setBookPos(EditorState.book.length-1)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}


document.getElementById("shiftLeft").addEventListener("click", function() {shift('left')} )
document.getElementById("shiftUp").addEventListener("click", function() {shift('up')} )
document.getElementById("shiftDown").addEventListener("click", function() {shift('down')} )
document.getElementById("shiftRight").addEventListener("click", function() {shift('right')} )
function shift(direction){
	switch(direction) {
		case 'left':		
				board.map((y) => {
					y.shift()
					y.push({t: 0, c: ''})
				})
			break;
		case 'up':
				board.shift()
				board.push(JSON.parse(JSON.stringify(emptyRow())))
			break;
		case 'down':
				board.unshift(JSON.parse(JSON.stringify(emptyRow())))
				board.pop()
			break;
		case 'right':
				board.map((y) => {
					y.unshift({t: 0, c: ''})
					y.pop()
				})
			break;
	}
	updateBook()
}

document.getElementById("undo").addEventListener("click", undo)
function undo() {
	EditorState.undo()
	window.requestAnimationFrame(renderBoard)
}

document.getElementById("redo").addEventListener("click", redo)
function redo() {
	EditorState.redo()
	window.requestAnimationFrame(renderBoard)
}

const reversed = {Z: 'S',L: 'J',O: 'O',S: 'Z',I: 'I',J: 'L',T: 'T',X: 'X'};
document.getElementById("mirrorPage").addEventListener("click", mirror)
function mirror() {
	for (row = 0; row < board.length; row++) {
		board[row].reverse();
		for (i = 0; i < board[row].length; i++) {
			if (board[row][i].t == 1) board[row][i].c = reversed[board[row][i].c];
		}
	}
	updateBook();
	window.requestAnimationFrame(renderBoard);
}

document.getElementById("mirrorFumen").addEventListener("click", fullMirror)
function fullMirror() {
	let currentBook = EditorState.book
	for (let page in currentBook) {
		var tempBoard = JSON.parse(currentBook[page]['board']);
		for (let row in tempBoard) {
			tempBoard[row].reverse();
			for (let col in tempBoard[row]) {
				if (tempBoard[row][col].t == 1) tempBoard[row][col].c = reversed[tempBoard[row][col].c];
			}
		}
		currentBook[page]['board'] = JSON.stringify(tempBoard);
	}
	EditorState.setBook(currentBook)
	EditorState.setBoard(tempBoard)
	updateBook();
	window.requestAnimationFrame(renderBoard);
}

document.getElementById("duplicatePage").addEventListener("click", dupliPage)
function dupliPage() {
	solidifyAutoColor(EditorState.bookPos)
	insertFollowingPage()
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("clearPage").addEventListener("click", clearPage)
function clearPage(){ //TODO: move to EditorState?
	let currentBook = EditorState.book
	currentBook[EditorState.bookPos] = {
		board: JSON.stringify(emptyBoard()),
		minoBoard: JSON.stringify(emptyBoard()),
		comment: '',
		operation: undefined,
		flags: {lock: true}
	}
	EditorState.setBook(currentBook)
	settoPage(EditorState.bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("deletePage").addEventListener("click", deletePage)
function deletePage(){ //TODO: move to EditorState?
	if (EditorState.book.length == 1) {
		clearPage()
	} else {
		let book = EditorState.book
		book.splice(EditorState.bookPos,1)
		EditorState.setBook(book)
		settoPage(EditorState.bookPos)
	}
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("reset").addEventListener("click", increaseResetLevel)
function increaseResetLevel() {
	let confirmedReset = document.getElementById('reset').classList.contains('confirm-delete-data')
	if (confirmedReset)  {
		EditorState.setBookPos(0)
		EditorState.setBoard(emptyBoard())
		EditorState.setMinoModeBoard(emptyBoard())
		EditorState.resetBook()
		document.getElementById('boardOutput').value = ''
		document.getElementById('commentBox').value = ''
		updateBook()
		autoEncode()
		window.requestAnimationFrame(renderBoard)
	}
	document.getElementById('reset').classList.toggle('confirm-delete-data')
}

function decodeFumen() {
	var fumen = document.getElementById('boardOutput').value;
    var pages = decoder.decode(fumen);
    var tempBook = pages.map(page => {
		return {
			board: JSON.stringify(pageToBoard(page)),
			operation: page['operation'],
			minoBoard: JSON.stringify(decodeOperation(page['operation'])),
			comment: page['comment'],
			flags: page['flags'],
		}
	});
	
	return tempBook;

    function decodeOperation(operation){
        if (operation === undefined) return emptyBoard() //no operation
    
        decodedMinoBoard = emptyBoard()
        let pieceColor = operation.type
        let rotation = operation.rotation
        let x = operation.x
        let y = 19 - operation.y //fumen has inverted y axis
        
        piecePositions = shape_table[pieceColor][rotation]
        for (let piecePosition of piecePositions) {
            decodedMinoBoard[y + piecePosition[0]][x + piecePosition[1]] = { t: 1, c: pieceColor }
        }
        
        return decodedMinoBoard
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

document.getElementById("insertFumen").addEventListener("click", decodeInsert)
function decodeInsert() {
    var bookInsert = decodeFumen()
	let book = EditorState.book
	book.splice(EditorState.bookPos, 0, ...bookInsert)
	EditorState.setBook(book)
	settoPage(EditorState.bookPos)
	updateBook()
	window.requestAnimationFrame(renderBoard)
};

document.getElementById("importFumen").addEventListener("click", fullDecode)
function fullDecode() {
	EditorState.setBook(decodeFumen())
	EditorState.setBookPos(0)
	window.requestAnimationFrame(renderBoard);
};

document.getElementById("exportPage").addEventListener("click", encode)
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
export function encode() { //use current page instead of accessing book?
	document.getElementById('boardOutput').value = encodeFumen(EditorState.book[EditorState.bookPos]);
}

document.getElementById("exportFumen").addEventListener("click", fullEncode)
export function fullEncode() {
	document.getElementById('boardOutput').value = encodeFumen(...EditorState.book);
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
		boardOutput.style.height = 50
		autoEncode()
	} else {
		boardOutput.style.height = 79
	}
}


document.getElementById("autoColorInput").addEventListener("click", updateAutoColor)

document.getElementById("tooltipSetting").addEventListener("click", updateToolTips)
function updateToolTips() {
	var tooltipTextElements = document.getElementsByClassName('tooltiptext')
	var enableToolTips = document.getElementById('tooltipSetting').checked
	for (let tooltipTextElement of tooltipTextElements) {
		tooltipTextElement.classList.toggle('hide-element', !enableToolTips)
	}
}

document.getElementById("defaultRenderInput").addEventListener("click", updateStyle)
function updateStyle() {
	document.getElementById('3dToggle').classList.toggle('disabled', document.getElementById('defaultRenderInput').checked)
	window.requestAnimationFrame(renderBoard)
}

//additional setting bindings
document.getElementById("autoColorInput").addEventListener("click", updateAutoColor)
document.getElementById("autoColorInput").addEventListener("click", updateRowFillInput)
document.getElementById("rowFillInput").addEventListener("click", updateRowFillInput)

//automatic update bindings
document.getElementById("commentBox").addEventListener("change", updateBook) //this guarentees that comments get automatically written to book
document.getElementById("lockFlagInput").addEventListener("click", updateBook)
