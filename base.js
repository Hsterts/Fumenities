const { Mino, Operation/*, Field*/ } = require('tetris-fumen');
// default settings
var cellSize = 22
var boardSize = [10, 20]

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

//PIECE MAPS
//table is a (row, col) pair sorted ascending by col then row, with right and down being the positive x and y axis. origin placed at the rotation axis of the piece
const shape_table = {
	'T': {
		'spawn'  : [[-1, 0], [0, -1], [0, 0], [0, 1]],
		'right'  : [[-1, 0], [0, 0], [0, 1], [1, 0]],
		'reverse': [[0, -1], [0, 0], [0, 1], [1, 0]],
		'left'   : [[-1, 0], [0, -1], [0, 0], [1, 0]],
	}, 
	'I': {
		'spawn'  : [[0, -1], [0, 0], [0, 1], [0, 2]],
		'right'  : [[-1, 0], [0, 0], [1, 0], [2, 0]],
		'reverse': [[0, -2], [0, -1], [0, 0], [0, 1]],
		'left'   : [[-2, 0], [-1, 0], [0, 0], [1, 0]],
	}, 
	'L': {
		'spawn'  : [[-1, 1], [0, -1], [0, 0], [0, 1]],
		'right'  : [[-1, 0], [0, 0], [1, 0], [1, 1]],
		'reverse': [[0, -1], [0, 0], [0, 1], [1, -1]],
		'left'   : [[-1, -1], [-1, 0], [0, 0], [1, 0]],
	}, 
	'J': {
		'spawn'  : [[-1, -1], [0, -1], [0, 0], [0, 1]],
		'right'  : [[-1, 0], [-1, 1], [0, 0], [1, 0]],
		'reverse': [[0, -1], [0, 0], [0, 1], [1, 1]],
		'left'   : [[-1, 0], [0, 0], [1, -1], [1, 0]],
	}, 
	'S': {
		'spawn'  : [[-1, 0], [-1, 1], [0, -1], [0, 0]],
		'right'  : [[-1, 0], [0, 0], [0, 1], [1, 1]],
		'reverse': [[0, 0], [0, 1], [1, -1], [1, 0]],
		'left'   : [[-1, -1], [0, -1], [0, 0], [1, 0]],
	}, 
	'Z': {
		'spawn'  : [[-1, -1], [-1, 0], [0, 0], [0, 1]],
		'right'  : [[-1, 1], [0, 0], [0, 1], [1, 0]],
		'reverse': [[0, -1], [0, 0], [1, 0], [1, 1]],
		'left'   : [[-1, 0], [0, -1], [0, 0], [1, -1]],
	}, 
	'O': {
		'spawn'  : [[-1, 0], [-1, 1], [0, 0], [0, 1]],
		'right'  : [[0, 0], [0, 1], [1, 0], [1, 1]],
		'reverse': [[0, -1], [0, 0], [1, -1], [1, 0]],
		'left'   : [[-1, -1], [-1, 0], [0, -1], [0, 0]],
	}
}

// CANVAS
var ctx = document.getElementById('b').getContext('2d')
{
	let gridCvs = document.createElement('canvas')
	gridCvs.height = cellSize
	gridCvs.width = cellSize
	let gridCtx = gridCvs.getContext('2d')
	gridCtx.fillStyle = '#000000CC'
	gridCtx.fillRect(0, 0, cellSize, cellSize)
	gridCtx.strokeStyle = '#ffffff88'
	gridCtx.strokeRect(0, 0, cellSize + 1, cellSize + 1)
	var pattern = ctx.createPattern(gridCvs, 'repeat')
}
document.getElementById('b').height = boardSize[1] * cellSize
document.getElementById('b').width = boardSize[0] * cellSize
document.getElementById('b').style.outline = '2px solid #ffffffcc'

//USER INPUT
var mouseHeld = false
var drawMode = true
var minoMode = document.getElementById('minoModeInput').checked
var autoColorBool = document.getElementById('autoColorInput').checked
// I'm not sure where I should place this function call for initialization
setPositionDisplay(bookPos, book.length)
updateDelim() //shared with other scripts
updateToolTips()
updateBGSelect()
updateDownloadSettings()
updateMinoMode()
updateAutoColor()
updateRowFillInput() //unnecessary
updateAutoEncoding()
updateGrid()

//SHORTCUTS
Mousetrap.bind({
	'esc': function() { decreaseResetLevel(); decreaseseClearInputLevel();},

	'backspace': increaseClearInputLevel,
	'g': function() {glueFumen(document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@'))},
	'u': function() {unglueFumen(document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@'))},
	'm': function() {mirrorFumen(document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@'))},
	'c': function() {combineFumen(document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@'))},
	's': function() {splitFumen(document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@'))},
	'R c': function() {removeComments(document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@'))},
	'enter': function() {renderImages(document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@'))},
	
	'shift+enter': moveOutputToInput,
	
	'1': function() {setPaintBucket(0);},
	'2': function() {setPaintBucket(1);},
	'3': function() {setPaintBucket(2);},
	'4': function() {setPaintBucket(3);},
	'5': function() {setPaintBucket(4);},
	'6': function() {setPaintBucket(5);},
	'7': function() {setPaintBucket(6);},
	'8': function() {setPaintBucket(7);},
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
	'D': dupliPage,
	'alt+backspace': clearPage,
	'del': deletePage,
	'r': increaseResetLevel,
	
	//Import image binded to paste already
	'ins': decodeInsert,
	'E p': encode,
	'I f': fullDecode,
	'E f': fullEncode,
	'+': addToInput,

	'A e': updateAutoEncoding,
	
	'l': toggleLock,
	'A c': toggleAutoColor,
	'R f': toggleRowFillInput,
	
	't t': toggleToolTips,
	'3 d': toggle3dSetting,
	'd s': toggleStyle,
	
	'mod+z': undo,
	'mod+y': redo,
})

//FUNCTIONS
function drawnMinos(someBoard, cellMatch) {
	return someBoard.reduce((count,row) => {
		return count += row.reduce((tval,cell) => {
			return tval += cellMatch(cell)
		}, 0)
	}, 0)
}

document.getElementById('b').onmousedown = function mousedown(e) {
	bookPos = getCurrentPosition()
	rect = document.getElementById('b').getBoundingClientRect()
	let cellRow = Math.floor((e.clientY - rect.top) / cellSize)
	let cellCol = Math.floor((e.clientX - rect.left) / cellSize)

	drawMode = (e.button == 0 && board[cellRow][cellCol]['t'] == 0 && minoModeBoard[cellRow][cellCol]['t'] == 0)

	let positions = []
	for (let row = 0; row < boardSize[1]; row++){
		for (let col = 0; col < boardSize[0]; col++) {
			if(board[row][col].t == 2){
				positions.push([row,col])
			}
		}
	}
	if (drawMode && autoColorBool && positions.length == 4) {
		//solidify piece
		for (let position of positions) {
			board[position[0]][position[1]].t = 1
		}
	}
	drawCanvasCell(cellRow, cellCol)

	updateBook()
	autoEncode()
	mouseHeld = true
}

document.getElementById('b').onmousemove = function mousemove(e) {
	bookPos = getCurrentPosition()
	rect = document.getElementById('b').getBoundingClientRect()

	let cellRow = Math.floor((e.clientY - rect.top) / cellSize)
	let cellCol = Math.floor((e.clientX - rect.left) / cellSize)
	
	let marginX = (e.clientX - rect.left) % cellSize
	let marginY = (e.clientY - rect.top) % cellSize
	
	let inSameCell = inRange(marginX-e.movementX, 0, cellSize-1) && inRange(marginY-e.movementY, 0, cellSize-1) // check if previous position crossed cell boundary
	// now triggers even when re-entering the same cell, but the effect is inconsequential
	let updateCanvas = mouseHeld && !inSameCell
    if (!updateCanvas) return;
	
	drawCanvasCell(cellRow, cellCol)
	
	updateBook()
	autoEncode()
}

function drawCanvasCell(cellRow, cellCol) {
	if (minoMode) {
		drawCanvasMinoMode()
	} else if (autoColorBool) {
		drawCanvasAutoColorMode()
	} else {
		drawCanvasNormalMode()
	}

	function drawCanvasMinoMode() {
		//safeguarding, can remove if it's guarenteed that minoModeBoard will not contain cells with {t: 2}.
		isCellTypeTwo = (cell) => cell.t === 2
		for (let row = 0; row < 20; row++) {
			if (minoModeBoard[row].some(isCellTypeTwo)) console.log("I refactored this code assuming that this state is impossible. Please check if the logic holds.")
		}
		//

		//when minoModeBoard is merged into board, more refactoring similar to drawCell() can be done.
		
		let drawnCount = drawnMinos(minoModeBoard, (cell) => cell.t == 1)
	
		if (drawMode && drawnCount < 4 && board[cellRow][cellCol].t == 0) {
			minoModeBoard[cellRow][cellCol] = {t: 1, c: 'X'}
		} else if (!drawMode) {
			minoModeBoard[cellRow][cellCol] = {t: 0, c: ''}
			//remove colors when there are four minos and user deletes one
			if (drawnCount == 4) {
				for (let row = 0; row < 20; row++){
					for (let col = 0; col < 10; col++) {
						if(minoModeBoard[row][col].t != 0) {
							minoModeBoard[row][col].c = 'X'
						}	
					}
				}
			}
		}
	}
	
	function drawCanvasNormalMode() {
		let rowFill = document.getElementById('rowFillInput').checked
		if (rowFill) {
			if (drawMode) {
				for (let col=0;col<boardSize[0];col++) {
					board[cellRow][col] = { t: 1, c: paintbucketColor() }
				}
				board[cellRow][cellCol] = { t: 0, c: '' }
			} else {
				board[cellRow] = JSON.parse(JSON.stringify(aRow))
			}
		} else {
			if (drawMode) {
				board[cellRow][cellCol] = { t: 1, c: paintbucketColor() }
			} else {
				board[cellRow][cellCol] = { t: 0, c: '' }
			}
		}
	}
	
	function drawCanvasAutoColorMode() {
		//auto color is basically mino mode and normal combined.
		if (drawMode) {
			//recognise piece
			let positions = []
			for (let row = 0; row < boardSize[1]; row++){
				for (let col = 0; col < boardSize[0]; col++) {
					if(board[row][col].t == 2) {
						positions.push([row,col])
					}
				}
			}

			if (positions.length < 4) {
				board[cellRow][cellCol] = { t: 2, c: 'X' }
				positions.push([cellRow,cellCol])
			}
			
			if (positions.length === 4) {
				let pieceMino = readPiece(positions, true)
				if (pieceMino === undefined) return; // remain gray

				for (let position of positions) {
					board[position[0]][position[1]].c = pieceMino.type
				}
			}
		} else if (!drawMode) {
			board[cellRow][cellCol] = { t: 0, c: '' }
		}
	}
}

document.onmouseup = function mouseup() {
	bookPos = getCurrentPosition() //used by program, only updates bookPos
	
	if (minoMode) finishMinoMode()
	
    mouseHeld = false
	updateBook()
	//autoEncode() prevent overwriting text pasted in
    requestAnimationFrame(renderBoard)

	function finishMinoMode() {
		var positions = []
		//get all drawn cells + their coords
		for (let row in minoModeBoard){
			for (let col in minoModeBoard[row]) {
				if(minoModeBoard[row][col].t != 0){
					positions.push([row,col])
				}	
			}
		}

		if(positions.length != 4) return;

		operation = readPiece(positions, false)
		if (operation === undefined) return;
		
		//coloring in
		for (let position of positions) {
			minoModeBoard[position[0]][position[1]].c = operation.type
		}
	}
}

function setPaintBucket(index) {
	document.paintbucket[index].checked = true;
}

function getCurrentPosition() {
	let Position = parseInt(document.getElementById('positionDisplay').value)-1
	if (isNaN(Position)) return 0
	else return Position
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

function inRange(number, min, max) { // [min, max] inclusive
    return (min <= number && number <= max)
}

function toggleLock() {
	document.getElementById('lockFlagInput').checked = !document.getElementById('lockFlagInput').checked
	updateBook()
}

// Updates all of the board properties: board, minoBoard, operation, comments
function updateBook() {
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
	window.requestAnimationFrame(renderBoard)
}

function toggleMinoMode() {
    document.getElementById('minoModeInput').checked = !document.getElementById('minoModeInput').checked
	updateMinoMode()
}

function updateMinoMode() {
    minoMode = document.getElementById('minoModeInput').checked
    if (!minoMode && operation == undefined)  {
		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
		operation = undefined
		updateBook()
	}
	updateAutoColor()
	updateRowFillInput() //unnecessary
}

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
				board.push(JSON.parse(JSON.stringify(aRow)))
			break;
		case 'down':
				board.unshift(JSON.parse(JSON.stringify(aRow)))
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

function settoPage(newPagePos) { // I do not trust the global variable
	// Bound bookPos to existing pages
	newPagePos = Math.max(Math.min(book.length-1, newPagePos), 0)

	setPositionDisplay(newPagePos, book.length)
	board = JSON.parse(book[newPagePos]['board'])
	minoModeBoard = JSON.parse(book[newPagePos]['minoBoard'])
	document.getElementById('commentBox').value = book[newPagePos]['comment']
	operation = book[newPagePos]['operation']
	document.getElementById('lockFlagInput').checked = book[newPagePos]['flags']['lock']
}

function prevPage() {
	bookPos = getCurrentPosition()
	solidifyAutoColor(bookPos)
	settoPage(bookPos-1)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function gotoPage() {
	bookPos = getCurrentPosition()
	// Bound bookPos to existing region (redundant)
	bookPos = Math.max(Math.min(book.length-1, bookPos), 0)
	
	// Go to an existing page
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function solidifyAutoColor(currentBookPos) {
	let currentBoard = JSON.parse(book[currentBookPos]['board'])
	for (let row in currentBoard){
		for (let col in currentBoard[row]) {
			if (currentBoard[row][col].t === 2){
				currentBoard[row][col].t = 1
			}
		}
	}
	book[currentBookPos]['board'] = JSON.stringify(currentBoard)
}

function insertFollowingPage(currentBookPos) {
	//push minomode onto current board
	let board = JSON.parse(book[currentBookPos]['board'])
	if (book[currentBookPos]['operation'] != undefined) {
		for (let row = 0; row < 20; row++){
			for (let col = 0; col < 10; col++) {
				if (minoModeBoard[row][col].t != 0){
					board[row][col] = minoModeBoard[row][col]
				}
			}
		}
	}

	//Line clears if flag lock is on
	if (book[currentBookPos]['flags']['lock'] === true) {
		//going top down guarentees all line clears are performed
		for (let row = 0; row < boardSize[1]; row++) {
			let isFilled = (cell) => cell.t === 1
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

function nextPage() {
	bookPos = getCurrentPosition()

	if(bookPos == book.length-1) { // Create new page when at the page
		solidifyAutoColor(bookPos)
		insertFollowingPage(bookPos)
	}

	bookPos += 1 // next page
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	updateBook()
	autoEncode()
}

function gotoPage() {
	// check for numeric input and within bounds
	solidifyAutoColor(bookPos) //relying on global to solidify the page before we leave it
	bookPos = getCurrentPosition()
	if(isNaN(bookPos)){
		bookPos = 0
	}
	bookPos = Math.max(Math.min(book.length, bookPos), 0)
	
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function startPage(){
	bookPos = 0
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function endPage(){
	settoPage(book.length-1)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function clearPage(){
	bookPos = getCurrentPosition()
	book[bookPos] = {
		board: JSON.stringify(emptyBoard),
		minoBoard: JSON.stringify(emptyBoard),
		comment: '',
		operation: undefined,
		flags: flags
	}
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function dupliPage(){
	bookPos = getCurrentPosition()
	solidifyAutoColor(bookPos)
	insertFollowingPage(bookPos)
	//technically you don't need to update since it's the same page
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function deletePage(){
	bookPos = getCurrentPosition()
	if(book.length == 1){
		clearPage()
	} else {
		book.splice(bookPos,1)
		bookPos = Math.min(bookPos,book.length-1) // Bound bookPos to end of book
		settoPage(bookPos)
	}
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function renderBoard() {  //renders board and minoModeBoard
	ctx.clearRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize)
	ctx.fillStyle = pattern
	ctx.fillRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize)
	board.map((row, i) => {
		row.map((cell, j) => {
			if (cell.t != 0) {
				drawCell(j, i, cell.c, cell.t)
			}
		})
	})
	minoModeBoard.map((row, i) => {
		row.map((cell, j) => {
			if(cell.t == 1) {
				drawCell(j, i, cell.c, 2)
			}
		})
	})
}



function drawCell(x, y, piece, type) {
	const FourPalette = [
		{ Z: '#ef624d', L: '#ef9535', O: '#f7d33e', S: '#66c65c', I: '#41afde', J: '#1983bf', T: '#b451ac', X: '#999999' },
		{ Z: '#fd7660', L: '#fea440', O: '#ffe34b', S: '#7cd97a', I: '#3dc0fb', J: '#1997e3', T: '#d161c9', X: '#bbbbbb' },
		{ Z: '#ff998c', L: '#feb86d', O: '#fbe97f', S: '#96f98b', I: '#75faf8', J: '#1fd7f7', T: '#fe89f7', X: '#dddddd' }
	]
	const FumenPalette = [
		{ Z: '#990000', L: '#996600', O: '#999900', S: '#009900', I: '#009999', J: '#0000bb', T: '#990099', X: '#999999' },
		{ Z: '#cc3333', L: '#cc9933', O: '#cccc33', S: '#33cc33', I: '#33cccc', J: '#3333cc', T: '#cc33cc', X: '#cccccc' },
		{ Z: '#cc3333', L: '#cc9933', O: '#cccc33', S: '#33cc33', I: '#33cccc', J: '#3333cc', T: '#cc33cc', X: '#cccccc' } //unused row, failsafe
	]

	{
		let lockFlag = document.getElementById('lockFlagInput').checked
		let cellCount = 0
		for (let col = 0; col < 10; col++) {
			cellCount += ((board[y][col].t != 0) || (minoModeBoard[y][col].t != 0)) // I think i can collapse minoModeBoard onto board, then the counting can be done more expediently using .some()
		}
		var drawLineClear = (lockFlag && cellCount === 10)
	}
	
	let canvasStyle = (document.getElementById('defaultRenderInput').checked ? 'fumen' : 'four')
	var showGrid = (canvasStyle === 'fumen')
	var currentPalette = (canvasStyle === 'fumen' ? FumenPalette : FourPalette)

	{
		let foureffectInput = document.getElementById('3dSetting').checked
		let cellAbove = (y === 0) || (board[y - 1][x].t !== 0) || (minoModeBoard[y - 1][x].t !== 0)
		var have3dHighlight = (canvasStyle === 'four' && foureffectInput && !cellAbove)
	}

	if (type === 2 || drawLineClear) drawLightCell()
	else if (type === 1) 			drawNormalCell()
	
	function drawLightCell() {
		if (have3dHighlight) draw3dHighlight(currentPalette[2][piece])
		drawMinoRect(currentPalette[1][piece])
	}
	
	function drawNormalCell() {
		if (have3dHighlight) draw3dHighlight(currentPalette[1][piece])
		drawMinoRect(currentPalette[0][piece])
	}

	function drawMinoRect(color) {
		ctx.fillStyle = color
		if (showGrid) 	ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1)
		else 			ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize, cellSize)
	}

	function draw3dHighlight(color) {
		ctx.fillStyle = color
		ctx.fillRect(x * cellSize + 1, y * cellSize + 1 - cellSize / 5, cellSize, cellSize / 5)
	}
}

//CONTRIBUTED BY CONFIDENTIAL (confidential#1288)
function readPiece(mino_positions, recognise_split_minos) {
    // if (mino_positions.length != 4){
    //     return 'X'
    // }

	positions = (recognise_split_minos ? unsplit_minos(mino_positions) : mino_positions)

	//sort ascending by y then x
	positions.sort((a,b) => a[0] - b[0] || a[1] - b[1])
    
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

	function unsplit_minos(mino_positions) {
		let y_coords = []
		for (let i = 0; i < mino_positions.length; i++) {
			y_coords.push(mino_positions[i][0]);
		}
		y_coords.sort((a, b) => a - b);
		
		let unsplit_mino_positions = []
		let y_coords_rank = y_coords.filter((y_coord, index, array) => array.indexOf(y_coord) === index);
		for (let i = 0; i < mino_positions.length; i++) {
			unsplit_mino_positions.push([y_coords[0]+y_coords_rank.indexOf(mino_positions[i][0]), mino_positions[i][1]])
		}
		return unsplit_mino_positions;
	}
}

function toggleAutoColor() {
	document.getElementById('autoColorInput').checked = !document.getElementById('autoColorInput').checked
	updateAutoColor()
}

function updateAutoColor() {
	autoColorBool = document.getElementById('autoColorInput').checked
	var isAutoColorUsable = !document.getElementById('minoModeInput').checked
	document.getElementById('autoColorInput').style.opacity = (isAutoColorUsable ? 1 : 0.5)
	updateRowFillInput()
	if(!(isAutoColorUsable && autoColorBool)) {
		for (let row = 0; row < boardSize[1]; row++) {
			for (let col = 0; col < boardSize[0]; col++) {
				if (board[row][col].t === 2){
					board[row][col].t = 1 //solidify any minos
				}
			}
		}
	}
}

//from io.js
function toField(board) { //only reads color of minos, ignoring the type
    FieldString = ''
	for (let row of board){
		for (let cell of row) {
			FieldString += (cell.c == '' ? '_' : cell.c)
		}
	}
    return Field.create(FieldString)
}

function decodeFumen() {
	var fumen = document.getElementById('boardOutput').value;
    var pages = decoder.decode(fumen);
    var tempBook = [];
	const FumenIndexToBoardColor = {
		0: "",
		1: "I",
		2: "L",
		3: "O",
		4: "Z",
		5: "T",
		6: "J",
		7: "S",
		8: "X",
	}

	for (i = 0; i < pages.length; i++) {
		let currentPage = pages[i];
        let tempBoard = [];
		let input = currentPage['_field']['field']['pieces'];

		console.log(input)
		boardString = []
		
		for (let cellColorIndex of input) {
			boardString.push({ t: Math.min(1, cellColorIndex), c: FumenIndexToBoardColor[cellColorIndex]})
		}

		for (let i=0; i < boardString.length; i += boardSize[0]) {
			tempBoard.push(boardString.slice(i, i + boardSize[0]))
		}

		let page = {
			board: JSON.stringify(tempBoard),
			operation: currentPage['operation'],
			minoBoard: JSON.stringify(decodeOperation(currentPage['operation'])),
			comment: currentPage['comment'],
			flags: currentPage['flags'],
		};
		
		tempBook.push(page);
	}
	return tempBook;
}

function decodeInsert() {
    bookPos = getCurrentPosition()
	var bookInsert = decodeFumen()
	book.splice(bookPos, 0, ...bookInsert)
	settoPage(bookPos)
	updateBook()
	window.requestAnimationFrame(renderBoard)
};

function fullDecode() {
	book = decodeFumen();
	bookPos = 0;
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard);
};

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
				lock: true,
				piece: undefined,
			},
			index: pageNum, //necessary?
		});
	}
	return encoder.encode(fullBook)
}

function encode() {
	bookPos = getCurrentPosition()
	document.getElementById('boardOutput').value = encodeFumen(book[bookPos]);
}

function fullEncode() {
	document.getElementById('boardOutput').value = encodeFumen(...book);
}

function addToInput() {
	document.getElementById('input').value += delimiter + document.getElementById('boardOutput').value
}

function autoEncode() {
	if (document.getElementById('autoEncode').checked == false) return;

	let encodingType = document.getElementById('encodingType').value;
	
	if (encodingType == 'fullFumen') fullEncode();
	else if (encodingType == 'currentFumenPage') encode();
}

function decodeOperation(operation){
	if (operation === undefined) return JSON.parse(JSON.stringify(emptyBoard)) //no operation

	decodedMinoBoard = JSON.parse(JSON.stringify(emptyBoard))
	let pieceColor = operation.type
	let rotation = operation.rotation
	let x = operation.x
	let y = 19 - operation.y //fumen has inverted y axis
	
	piecePositions = shape_table[pieceColor][rotation]
	for (let piecePosition of piecePositions) {
		decodedMinoBoard[y + piecePosition[0]][x + piecePosition[1]] = {t: 1, c: pieceColor}
	}
	
	return decodedMinoBoard
}

//IMAGE IMPORT
document.addEventListener('paste', (event) => {
    let items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (let item of items) {
        if (item.kind == 'file') importImage(item.getAsFile());
    }
});

async function importImage(blob) {
    // Create an abstract canvas and get context
    var mycanvas = document.createElement('canvas');
    var ctx = mycanvas.getContext('2d');

    // Create an image
    var img = new Image();

    // Once the image loads, render the img on the canvas
    img.onload = function () {
        console.log(this.width, this.height);
        let scale = this.width / 10.0;
        let x = 10;
        let y = Math.min(Math.round(this.height / scale), 22);
        console.log(x, y);
        mycanvas.width = this.width;
        mycanvas.height = this.height;

        // Draw the image
        ctx.drawImage(img, 0, 0, this.width, this.height);
        let tempBoard = new Array(20 - y).fill(new Array(10).fill({ t: 0, c: '' })); // empty top [40-y] rows
        
		let data = Object.values(ctx.getImageData(0, 0, this.width, this.height).data);
        for (let row = 0; row < y; row++) {
            let tmpRow = [];
			for (let col = 0; col < 10; col++) {
				// get median value of pixels that should correspond to [row col] mino
				// if this is too computationally expensive maybe switch to mean

                let minoPixelsR = [];
                let minoPixelsG = [];
                let minoPixelsB = [];
				
                for (let pixelRow = Math.floor(row * scale); pixelRow < row * scale + scale; pixelRow++) {
                    for (let pixelCol = Math.floor(col * scale); pixelCol < col * scale + scale; pixelCol++) {
                        let index = (pixelRow * this.width + pixelCol) * 4;
                        minoPixelsR.push(data[index]);
                        minoPixelsG.push(data[index + 1]);
                        minoPixelsB.push(data[index + 2]);
                    }
                }
				
                let medianR = median(minoPixelsR);
                let medianG = median(minoPixelsG);
                let medianB = median(minoPixelsB);
                let hsv = rgb2hsv(medianR, medianG, medianB);
                console.log(hsv, nearestMinoRepresentation(...hsv)); // debugging purposes
            	tmpRow.push(nearestMinoRepresentation(...hsv))
            }
            tempBoard.push(tmpRow);
        }
        /* // old alg from just scaling it down to x by y pixels
		let nDat = [];
        for (let i = 0; i < data.length / 4; i++) {
            //nDat.push(data[i*4] + data[(i*4)+1] + data[(i*4)+2] < 382?1:0)
            var hsv = rgb2hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
            console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
            nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
        }*/
		
        board = JSON.parse(JSON.stringify(tempBoard));
        updateBook();
    };

    var URLObj = window.URL || window.webkitURL;
    img.src = URLObj.createObjectURL(blob);

	function rgb2hsv(r, g, b) {
		let v = Math.max(r, g, b),
			c = v - Math.min(r, g, b);
		let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
		return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
	}

	function nearestMinoRepresentation(h, s, v) {
		if (inRange(h, 0, 30) && inRange(s, 0, 1) && (inRange(v, 133, 135) || inRange(v, 63, 88))) return { t: 1, c: 'X' }; // attempted manual override specifically for four.lol idk
		if (inRange(h, 220, 225) && inRange(s, 0, 0.2) && v == 65) return { t: 0, c: '' };
	
		if (s <= 0.2 && v / 2.55 >= 55) return { t: 1, c: 'X' };
		if (v / 2.55 <= 55) return { t: 0, c: '' };
	
		if (inRange(h, 0, 16) || inRange(h, 325, 360)) 	return { t: 1, c: 'Z' };
		else if (inRange(h, 17, 41)) 					return { t: 1, c: 'L' };
		else if (inRange(h, 42, 70)) 					return { t: 1, c: 'O' };
		else if (inRange(h, 71, 149)) 					return { t: 1, c: 'S' };
		else if (inRange(h, 150, 200)) 					return { t: 1, c: 'I' };
		else if (inRange(h, 201, 266)) 					return { t: 1, c: 'J' };
		else if (inRange(h, 267, 325)) 					return { t: 1, c: 'T' };
		return { t: 0, c: '' };
	}

	function median(values) {
		if (values.length === 0) throw new Error('No inputs');
	
		values.sort(function (a, b) {
			return a - b;
		});
	
		var half = Math.floor(values.length / 2);
	
		if (values.length % 2) return values[half];
	
		return (values[half - 1] + values[half]) / 2.0;
	}
}

async function importImageButton() {
	try {
		const clipboardItems = await navigator.clipboard.read();
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

//MIRRORING
const reversed = {Z: 'S',L: 'J',O: 'O',S: 'Z',I: 'I',J: 'L',T: 'T',X: 'X'};

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

function fullMirror() {
	for (i = 0; i < book.length; i++) {
		tempBoard = JSON.parse(book[i]['board']);
		for (row = 0; row < tempBoard.length; row++) {
			tempBoard[row].reverse();
			for (j = 0; j < tempBoard[row].length; j++) {
				if (tempBoard[row][j].t == 1) tempBoard[row][j].c = reversed[tempBoard[row][j].c];
			}
		}
		book[i]['board'] = JSON.stringify(tempBoard);
	}
	board = tempBoard;
	updateBook();
	window.requestAnimationFrame(renderBoard);
}

//HTML FUNCTIONS

// not present in html but affects html elements
function decreaseResetLevel() {
	document.getElementById('reset').classList.remove('confirm-delete-data')
}

// not present in html but affects html elements
function decreaseseClearInputLevel() {
	document.getElementById('clear-input').classList.remove('confirm-delete-data')
}

// not present in html but affects html elements
function increaseResetLevel() {
	let confirmedReset = document.getElementById('reset').classList.contains('confirm-delete-data')
	if (confirmedReset)  {
		board = JSON.parse(JSON.stringify(emptyBoard))
		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
		book = [{board: JSON.parse(JSON.stringify(emptyBoard)), flags: flags}]
		setPositionDisplay(0, book.length)
		document.getElementById('boardOutput').value = ''
		document.getElementById('commentBox').value = ''
		comments = []
		updateBook() // record initial state in logs, testing
		autoEncode()
		window.requestAnimationFrame(renderBoard)
	}
	document.getElementById('reset').classList.toggle('confirm-delete-data')
}

function increaseClearInputLevel() {
	let confirmedReset = document.getElementById('clear-input').classList.contains('confirm-delete-data')
	if (confirmedReset)  {
		document.getElementById('input').value = ''
	}
	document.getElementById('clear-input').classList.toggle('confirm-delete-data')
}

function updateBGSelect() {
	document.getElementById('bgselect').classList.toggle('hide-element', document.getElementById('transparency').checked)
}

function updateDownloadSettings() {
	document.getElementById('downloadSettings').classList.toggle('hide-element', !document.getElementById('downloadOutput').checked)
}

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

function toggleSidePanel() {
	var fumenSidebar = document.getElementById('fumenSidebar')
	var settingsSidebar = document.getElementById('settingsSidebar')
	var openLogo = document.getElementById('openFumenSettings')
	var closeLogo = document.getElementById('closeFumenSettings')
	if (fumenSidebar.style.display != 'none') {
		settingsSidebar.style.display = 'none'
		openLogo.style.display = 'block'
		closeLogo.style.display = 'none'
	}
	fumenSidebar.classList.toggle('hide-element')
}

function toggleFumenSettings() {
	var fumenSettings = document.getElementById('settingsSidebar')
	var settingsButton = document.getElementsByClassName('option-left')[0]
	var openLogo = document.getElementById('openFumenSettings')
	var closeLogo = document.getElementById('closeFumenSettings')
	if (fumenSettings.style.display === 'none'){
	    fumenSettings.style.display = 'block'
		settingsButton.style.right = '459px'
		settingsButton.style.borderBottomLeftRadius = '0px'
		settingsButton.style.borderBottomRightRadius = '10px'
	    openLogo.style.display = 'none'
	    closeLogo.style.display = 'block'
	} else {
	    fumenSettings.style.display = 'none'
		settingsButton.style.right = '500px'
		settingsButton.style.borderBottomRightRadius = '0px'
		settingsButton.style.borderBottomLeftRadius = '10px'
	    openLogo.style.display = 'block'
	    closeLogo.style.display = 'none'
	}
	
}

function toggleToolTips() {
	document.getElementById('tooltipSetting').checked = !document.getElementById('tooltipSetting').checked
	updateToolTips() 
}

function toggle3dSetting() {
	document.getElementById('3dSetting').checked = !document.getElementById('3dSetting').checked
	requestAnimationFrame(renderBoard)
}

function updateToolTips() {
	var tooltipTextElements = document.getElementsByClassName('tooltiptext')
	var enableToolTips = document.getElementById('tooltipSetting').checked
	for (let i=0; i<tooltipTextElements.length; i++) {
		tooltipTextElements[i].classList.toggle('hide-element', !enableToolTips)
	};
}

function toggleRowFillInput() {
	document.getElementById('rowFillInput').checked = !document.getElementById('rowFillInput').checked
	updateRowFillInput()
}

function updateRowFillInput() {
	var isRowFillUsable = !document.getElementById('minoModeInput').checked && !document.getElementById('autoColorInput').checked
	document.getElementById('rowFillInput').classList.toggle('disabled', !isRowFillUsable)
}

function toggleStyle() {
	document.getElementById('defaultRenderInput').checked = !document.getElementById('defaultRenderInput').checked
	updateStyle()
}

function updateStyle() {
	document.getElementById('3dToggle').classList.toggle('disabled', document.getElementById('defaultRenderInput').checked)
	requestAnimationFrame(renderBoard)
}

function renderImages(fumen) {
	  switch(document.getElementById('renderStyle').value){
		  case 'four': fumencanvas(fumen); break;
		  case 'fumen': fumenrender(fumen); break;
	  }
}

function undo() {
	bookPos = getCurrentPosition()
	if(undoLog.length <= 1){
		console.log('No previous actions logged')
	} else {
		redoLog.push(undoLog.pop())
		book = JSON.parse(undoLog[undoLog.length-1])
		console.log(bookPos, book.length-1)
		bookPos = Math.min(bookPos, book.length-1) // Bound bookPos to end of book, temporary measure
		
		settoPage(bookPos)
	}
	window.requestAnimationFrame(renderBoard)
}

function redo() {
	bookPos = getCurrentPosition()
	if (redoLog.length == 0){
		console.log('No following actions logged')
	} else {
		undoLog.push(redoLog.pop())
		book = JSON.parse(undoLog[undoLog.length-1])
		settoPage(bookPos)
	}
	window.requestAnimationFrame(renderBoard)
}

function takeshot() {
    container = document.getElementById('imageOutputs')
    html2canvas(container, {
        backgroundColor: null,
        width: container.clientWidth,
        height: container.clientHeight,
        scrollY: -window.scrollY
    }).then(
        function (canvas) {
            canvas.toBlob(blob => {
                try { navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); }
                catch (error) {
                    dataURL = canvas.toDataURL();
                    console.log("Firefox doesn't support dropping images into clipboard, try pasting this DataURL into a new tab and copy pasting the image: ", dataURL);
                    navigator.clipboard.writeText(dataURL);
                }
            });
        }
    );
}

function updateGrid() {
	gridToggle = document.getElementById('gridToggle').checked
	document.getElementById('gridColorPicker').classList.toggle('hide-element', !gridToggle)
}

function encodeString(fieldString) {
	var pages = []
	var fieldArray = JSON.parse(JSON.stringify(emptyBoard))
	fieldArray.splice(16, 4)
	var rows = fieldString.split(',')

	for (let i = 0; i < 4; i++){
		let row = []
		for (let j = 0; j < 10; j++){
			let mino = {c: rows[i].split('')[j]}
			row.push(mino)
		}
		fieldArray.push(row)
	}

	var field = toField(fieldArray)
	page = {field}
	pages.push(page)

	return encoder.encode(pages)
}

function updateDelim() {
	delimiter = document.getElementById('delim').value;
}

function moveOutputToInput() {
	let OutputTextArea = document.getElementById('output')
	let InputTextArea = document.getElementById('input')
	if (OutputTextArea.value == '') return; //prevent overwriting input with empty output
	InputTextArea.value = OutputTextArea.value
	OutputTextArea.value = ''
}

//gonna just leave this here, used it to convert wirelyre mino-board strings to fumens
function wireEncode(){
	inputs = document.getElementById('input').value.split('\n')
	outputs = []
	for(let i = 0; i < inputs.length; i++){
		outputs.push(encodeString(inputs[i]))
	}
	document.getElementById('output').value = outputs.join('\n')
}