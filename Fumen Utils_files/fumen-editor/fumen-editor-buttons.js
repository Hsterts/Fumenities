const { Field, encoder, decoder } = require('tetris-fumen');
import { getDelimiter, shape_table, emptyBoard, emptyRow } from "../global-utils.js"
import { autoEncode } from "./fumen-editor.js"
import importImage from "./importImage.js"
import { pageToBoard, renderBoard } from "../rendering/board-render.js"
import { bookState, displayState, historyState } from "./EditorState.js"

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
	updateAutoColor()
	updateRowFillInput()
}

function toggleAutoEncoding() {
	document.getElementById('autoEncode').checked = !document.getElementById('autoEncode').checked
	updateAutoEncoding()
}

function toggleLock() {
	document.getElementById('lockFlagInput').checked = !document.getElementById('lockFlagInput').checked
	updateLockFlag()
}

function toggleAutoColor() {
	document.getElementById('autoColorInput').checked = !document.getElementById('autoColorInput').checked
	updateAutoColor()
}
function updateAutoColor() {
	var isAutoColorUsable = !document.getElementById('minoModeInput').checked
	document.getElementById('autoColorInput').classList.toggle('disabled', !isAutoColorUsable)
	
	var autoColorBool = document.getElementById('autoColorInput').checked
	if(!(isAutoColorUsable && autoColorBool)) displayState.solidifyBoard()
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
document.getElementById("minoModeInput").addEventListener("click", updateMinoMode)
document.getElementById("minoModeInput").addEventListener("click", updateAutoColor)
document.getElementById("minoModeInput").addEventListener("click", updateRowFillInput)
function updateMinoMode() {
    let minoMode = document.getElementById('minoModeInput').checked
    if (!minoMode && displayState.operation == undefined) { //clear minoModeBoard without a glued piece when exiting minoMode
		displayState.setState({minoModeBoard: emptyBoard()})
	}
}

document.getElementById("startPage").addEventListener("click", startPage)
function startPage() {
	bookState.displayBookPage(0)
}

document.getElementById("prevPage").addEventListener("click", prevPage)
function prevPage() {
	bookState.displayBookPage(bookState.bookPos-1)
}

document.getElementById("positionDisplay").addEventListener("focusout", gotoPage)
function gotoPage() {
	bookState.displayBookPage(getCurrentPosition())

	function getCurrentPosition() {
		let Position = parseInt(document.getElementById('positionDisplay').value) - 1; //convert to zero-indexed
		return (isNaN(Position) ? 0 : Position)
	}
}

function insertFollowingPage() {
	displayState.solidifyBoard()
	displayState.updateBook()

	//push minomode onto current board
	let board = displayState.board
	if (displayState.operation != undefined) {
		for (let row in board){
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
		//going top down guarentees all line clears are performed
		for (let row in board) {
			let isFilled = (cell) => cell.t != 0
			if (board[row].every(isFilled)) {
				board.splice(row, 1)
				board.unshift(emptyRow())
			}
		}
	}
	
	let currentBook = bookState.book
	let newPage = {
		board: JSON.stringify(board),
		minoBoard: JSON.stringify(emptyBoard()),
		comment: displayState.comment, //only works since we don't care about quiz mode
		operation: undefined,
		flags: {lock: displayState.flags.lock},
	}

	currentBook.splice(bookState.bookPos+1, 0, newPage)
	bookState.setBook(currentBook)
}

document.getElementById("nextPage").addEventListener("click", nextPage)
function nextPage() {
	if (bookState.bookPos == bookState.book.length-1) { // Create new page when at the last page
		insertFollowingPage()
	}
	
	bookState.displayBookPage(bookState.bookPos + 1) // next page
}

document.getElementById("endPage").addEventListener("click", endPage)
function endPage(){
	bookState.displayBookPage(bookState.book.length-1)
}

document.getElementById("shiftLeft").addEventListener("click", function() {shift('left')} )
document.getElementById("shiftUp").addEventListener("click", function() {shift('up')} )
document.getElementById("shiftDown").addEventListener("click", function() {shift('down')} )
document.getElementById("shiftRight").addEventListener("click", function() {shift('right')} )
function shift(direction){
	let board = displayState.board
	switch(direction) {
		case 'left':		
				board.map((y) => {
					y.shift()
					y.push({t: 0, c: ''})
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
					y.unshift({t: 0, c: ''})
					y.pop()
				})
			break;
	}
	displayState.setState({board: board})
}

document.getElementById("undo").addEventListener("click", undo)
function undo() {
	historyState.undo()
}

document.getElementById("redo").addEventListener("click", redo)
function redo() {
	historyState.redo()
}

const reversed = {Z: 'S',L: 'J',O: 'O',S: 'Z',I: 'I',J: 'L',T: 'T',X: 'X'};
document.getElementById("mirrorPage").addEventListener("click", mirror)
function mirror() {
	let board = displayState.board
	for (row = 0; row < board.length; row++) {
		board[row].reverse();
		for (i = 0; i < board[row].length; i++) {
			if (board[row][i].t == 1) board[row][i].c = reversed[board[row][i].c];
		}
	}
	displayState.setState({board: board})
}

document.getElementById("mirrorFumen").addEventListener("click", fullMirror)
function fullMirror() {
	let currentBook = bookState.book
	for (let page in currentBook) {
		var tempBoard = JSON.parse(currentBook[page]['board']);
		for (let row in tempBoard) {
			tempBoard[row].reverse(); //reverse cells in row
			for (let col in tempBoard[row]) {
				if (tempBoard[row][col].t == 1) tempBoard[row][col].c = reversed[tempBoard[row][col].c]; //reverse colors in row
			}
		}
		currentBook[page]['board'] = JSON.stringify(tempBoard);
	}
	bookState.setBook(currentBook)
}

document.getElementById("duplicatePage").addEventListener("click", dupliPage)
function dupliPage() {
	insertFollowingPage()
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("clearPage").addEventListener("click", clearPage)
function clearPage(){
	displayState.setState({
		board: emptyBoard(),
		minoBoard: emptyBoard(),
		comment: '',
		operation: undefined,
		flags: {lock: true}
	})
}

document.getElementById("deletePage").addEventListener("click", deletePage)
function deletePage(){ //TODO: move to EditorState?
	if (bookState.book.length == 1) {
		clearPage()
	} else {
		let book = bookState.book
		book.splice(bookState.bookPos,1)
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
			minoBoard: JSON.stringify(decodeOperation(page['operation'])),
			operation: page['operation'],
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
	let book = bookState.book
	book.splice(bookState.bookPos, 0, ...bookInsert)
	bookState.setBook(book)
};

document.getElementById("importFumen").addEventListener("click", fullDecode)
function fullDecode() {
	bookState.setBook(decodeFumen())
	bookState.displayBookPage(0)
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
	document.getElementById('boardOutput').value = encodeFumen(bookState.book[bookState.bookPos]);
}

document.getElementById("exportFumen").addEventListener("click", fullEncode)
export function fullEncode() {
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
		boardOutput.style.height = 50
		autoEncode()
	} else {
		boardOutput.style.height = 79
	}
}

//additional setting bindings
document.getElementById("lockFlagInput").addEventListener("click", updateLockFlag)
function updateLockFlag() {
	console.log(document.getElementById('lockFlagInput').checked)
	displayState.setState({flags: {lock: document.getElementById('lockFlagInput').checked}})
}

document.getElementById("autoColorInput").addEventListener("click", updateAutoColor)

document.getElementById("autoColorInput").addEventListener("click", updateRowFillInput)
document.getElementById("rowFillInput").addEventListener("click", updateRowFillInput)

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
	window.requestAnimationFrame(renderBoard)
}




//automatic update bindings
document.getElementById("commentBox").addEventListener("change", updateComment) //this guarentees that comments get automatically written to book
function updateComment() {
	displayState.setState({comment: document.getElementById("commentBox").value})
}

