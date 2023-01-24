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
book = [{board: JSON.stringify(board), comment: '', operation: undefined, minoBoard: JSON.stringify(board), flags},]
var bookPos = 0
window.requestAnimationFrame(render)

//PIECE MAPS
{
	let piece_T = ['0000111001000000', '0100011001000000', '0100111000000000', '0100110001000000']
	let piece_I = ['0100010001000100', '0000111100000000']
	let piece_L = ['0000111010000000', '0100010001100000', '0010111000000000', '1100010001000000']
	let piece_J = ['0000111000100000', '0110010001000000', '1000111000000000', '0100010011000000']
	let piece_S = ['0000011011000000', '0100011000100000']
	let piece_Z = ['0000110001100000', '0010011001000000']
	let piece_O = ['0000110011000000']

	var pieceMaps = [piece_T, piece_I, piece_L, piece_J, piece_S, piece_Z, piece_O]
}
const rotationNames = ['reverse','right','spawn','left']

//MAKING FIRST EMPTY BOARD
const aRow = []
const emptyBoard = []
for(let i = 0; i < boardSize[0]; i++) {aRow.push({ t: 0, c: '' })}
for (let i = 0; i < boardSize[1]; i++) {emptyBoard.push(aRow)}
var board = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy
var minoModeBoard = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy
updateBook()

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
delimiter = updateDelim() //shared with other scripts
updateToolTips()
updateBGSelect()
updateDownloadSettings()
updateMinoMode()
updateAutoColor()
updateRowFillInput() //unnecessary

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
	let cellCol = Math.floor((e.clientY - rect.top) / cellSize)
	let cellRow = Math.floor((e.clientX - rect.left) / cellSize)

	drawMode = (e.button == 0 && board[cellCol][cellRow]['t'] == 0 && minoModeBoard[cellCol][cellRow]['t'] == 0)
	drawCanvasCell(cellRow, cellCol)

	updateBook()
	autoEncode()
	mouseHeld = true
}

document.getElementById('b').onmousemove = function mousemove(e) {
	bookPos = getCurrentPosition()
	rect = document.getElementById('b').getBoundingClientRect()

	let cellCol = Math.floor((e.clientY - rect.top) / cellSize)
	let cellRow = Math.floor((e.clientX - rect.left) / cellSize)
	
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
	
		if (drawMode && drawnCount < 4 && board[cellCol][cellRow].t == 0) {
			minoModeBoard[cellCol][cellRow] = {t: 1, c: 'X'}
		} else if (!drawMode) {
			minoModeBoard[cellCol][cellRow] = {t: 0, c: ''}
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
				for (let row=0;row<boardSize[0];row++) {
					board[cellCol][row] = { t: 1, c: paintbucketColor() }
				}
				board[cellCol][cellRow] = { t: 0, c: '' }
			} else {
				board[cellCol] = JSON.parse(JSON.stringify(aRow))
			}
		} else {
			if (drawMode) {
				board[cellCol][cellRow] = { t: 1, c: paintbucketColor() }
			} else {
				board[cellCol][cellRow] = { t: 0, c: '' }
			}
		}
	}
	
	function drawCanvasAutoColorMode() {
		//auto color is basically mino mode and normal combined.	
		if (drawMode && drawnMinos(board, (cell) => cell.t == 2) < 4) {
			board[cellCol][cellRow] = { t: 2, c: 'X' }
		} else if (!drawMode) {
			board[cellCol][cellRow] = { t: 0, c: '' }
		}
	}
}

function finishMinoMode() {
	drawn = []
	if(drawnMinos(minoModeBoard, (cell) => cell == 1) != 4) return;
	//get all drawn cells + their coords
	for (let row = 0; row < 20; row++){
		for (let col = 0; col < 10; col++) {
			if(minoModeBoard[row][col].c != ''){
				cellData = {row: row, col: col, info: minoModeBoard[row][col]}
				drawn.push(cellData)
			}	
		}
	}
	
	for(let cell = 0; cell < 4; cell++) {
		minoFieldString = ''
		//making map
		for(let y = -1; y < 3; y++){
			for(let x = -1; x < 3; x++){
				let row = drawn[cell]['row'] + y
				let col = drawn[cell]['col'] + x
				let minoInBoard = inRange(row,0,19) && inRange(col,0,9)
				if(!minoInBoard) {
					minoFieldString += '0'
				} else {
					minoFieldString += minoModeBoard[row][col].t.toString()
				}
			}
		}
		//matching map to piece
		for(let piece = 0; piece < 7; piece++){
			pieceMap = pieceMaps[piece]
			index = pieceMap.findIndex((pieceString) => pieceString === minoFieldString)
			if(index == -1) continue;
			//operations property items
			type = 'TILJSZO'[piece]
			rotation = rotationNames[index]
			x = drawn[cell]['col']
			y = 19 - drawn[cell]['row']
			operation = new Mino(type, rotation, x, y)
			//coloring in
			for (let row = 0; row < 20; row++){
				for (let col = 0; col < 10; col++) {
					if (minoModeBoard[row][col].t != 0) {
						minoModeBoard[row][col].c = type
					}	
				}
			}
			//saving matched piece
			updateBook()
		}
	}
}

function finishAutoColor() {
	let positions = []
	for (let row = 0; row < 20; row++){
		for (let col = 0; col < 10; col++) {
			if(board[row][col].t == 2){
				positions.push([row,col])
			}
		}
	}
	
	if (positions.length != 4) return;

	let pieceName = readPiece(positions)

	for (let position of positions) {
		board[position[0]][position[1]] = { t: 1, c: pieceName }
	}
}

document.onmouseup = function mouseup() {
	bookPos = document.getElementById('positionDisplay').value-1 //used by program, only updates bookPos
	
	if (minoMode) finishMinoMode()
	if (autoColorBool) finishAutoColor()
	
    mouseHeld = false
	autoEncode()
    requestAnimationFrame(render)
}

function setPaintBucket(index) {
	document.paintbucket[index].checked = true;
}

function getCurrentPosition() {
	return parseInt(document.getElementById('positionDisplay').value)-1
}

function setPositionDisplay(pageIndex, totalPageNum) {
	document.getElementById('positionDisplay').value = pageIndex+1
	document.getElementById('positionDisplayOver').value = '/' + totalPageNum
}

Mousetrap.bind('1', function() {setPaintBucket(0);})
Mousetrap.bind('2', function() {setPaintBucket(1);})
Mousetrap.bind('3', function() {setPaintBucket(2);})
Mousetrap.bind('4', function() {setPaintBucket(3);})
Mousetrap.bind('5', function() {setPaintBucket(4);})
Mousetrap.bind('6', function() {setPaintBucket(5);})
Mousetrap.bind('7', function() {setPaintBucket(6);})
Mousetrap.bind('8', function() {setPaintBucket(7);})
Mousetrap.bind('r', restart)
Mousetrap.bind(',', prevPage)
Mousetrap.bind('.', nextPage)
Mousetrap.bind(['mod+z'], undo)
Mousetrap.bind(['mod+y'], redo)

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

// Updates all of the board properties: board, minoBoard, operation, comments
function updateBook() {
	bookPos = getCurrentPosition()
	book[bookPos] = {
		board: JSON.stringify(board),
		minoBoard: JSON.stringify(minoModeBoard),
		comment: document.getElementById('commentBox').value,
		operation: operation,
		flags: {
			lock: document.getElementById('lockFlagInput').checked,
			},
	}
	document.getElementById('commentBox').value = (book[bookPos]['comment'] != undefined ? book[bookPos]['comment'] : '')

	//Limit undos to 100 entries
	if(undoLog.length <= 100){
		undoLog.push(JSON.stringify(book))
	} else {
		undoLog.splice(0,1)
		undoLog.push(JSON.stringify(book))
	}
	//Clearing redo if branch is overwritten
	redoLog = [];

	updateAutoColor()
	window.requestAnimationFrame(render)
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
	// what about operation?
}

function prevPage() {
	bookPos = getCurrentPosition()
	settoPage(bookPos-1)
	window.requestAnimationFrame(render)
	autoEncode()
}

function gotoPage() {
	bookPos = getCurrentPosition()
	// Bound bookPos to existing region (redundant)
	bookPos = Math.max(Math.min(book.length-1, bookPos), 0)
	
	// Go to an existing page
	settoPage(bookPos)
	flags = {lock: true}
	window.requestAnimationFrame(render)
	autoEncode()
}

function nextPage() {
	bookPos = getCurrentPosition()
	bookPos += 1 // next page
	if(bookPos <= book.length-1) {
		// Go to an existing page
		settoPage(bookPos)
		flags = {lock: true}
	} else {
		// Create new page
		// Solidifying minos
		prevBoard = JSON.parse(book[bookPos-1]['board'])
		for (let row = 0; row < 20; row++){
			for (let col = 0; col < 10; col++) {
				if(board[row][col].t == 2){
					prevBoard[row][col].t = 1
					prevBoard[row][col].c = board[row][col].c
				}
			}
		}
		book[bookPos-1]['board'] = JSON.stringify(prevBoard)
		
		//push minomode onto current board
		if(book[bookPos-1]['operation'] == undefined){
			board = JSON.parse(book[bookPos - 1]['board'])
		} else {
			for (let row = 0; row < 20; row++){
				for (let col = 0; col < 10; col++) {
					if(minoModeBoard[row][col].t != 0){
						board[row][col] = minoModeBoard[row][col]
					}
				}
			}
		}

		//Line clears if flag lock is on
		if(book[bookPos-1]['flags']['lock'] === true) {
			for(let row = 0; row < boardSize[1]; row++){
				// delete a row if it is all filled
				let isEmpty = (cell) => cell.t == 0
				if(board[row].some(isEmpty)) continue;
				
				board.splice(row, 1)
				board.splice(0, 0, aRow)
			}
		}

		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
		operation = undefined
		lockFlag = document.getElementById('lockFlagInput').checked
		comment = ''
		
		book[bookPos] = {
			board: JSON.stringify(board),
			minoBoard: JSON.stringify(emptyBoard),
			comment: '',
			operation: undefined,
			flags: {lock: lockFlag},
		}
		document.getElementById('commentBox').value = comment
		
		setPositionDisplay(bookPos, book.length)
	}
	window.requestAnimationFrame(render)
	autoEncode()
	updateBook()
}

function gotoPage() {
	// check for numeric input and within bounds
	bookPos = getCurrentPosition()
	if(isNaN(bookPos)){
		bookPos = 1
	}
	bookPos = Math.max(Math.min(book.length, bookPos), 1)

	board = JSON.parse(book[bookPos - 1]['board'])
	minoModeBoard = JSON.parse(book[bookPos - 1]['minoBoard'])
	setPositionDisplay(bookPos, book.length)
	document.getElementById('commentBox').value = book[bookPos - 1]['comment']
	
	window.requestAnimationFrame(render)
	autoEncode()
}

function startPage(){
	bookPos = 0
	settoPage(bookPos)
	window.requestAnimationFrame(render)
	autoEncode()
}

function endPage(){
	settoPage(book.length-1)
	window.requestAnimationFrame(render)
	autoEncode()
}

function restart(){
	board.map((y, i) => {
		y.map((x, ii) => {
			x.t = 0
			x.c = ''
		})
    })
    minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
	book = [{board: JSON.stringify(board), flags: flags}]
	setPositionDisplay(0, book.length)
	document.getElementById('boardOutput').value = ''
	document.getElementById('commentBox').value = ''
	comments = []
	document.getElementById('reset').style.display = 'inline-block'
	document.getElementById('reset-angry').style.display = 'none'
	updateBook() // record initial state in logs, testing
	window.requestAnimationFrame(render)
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
	board = JSON.parse(book[bookPos]['board'])
	minoBoard = JSON.parse(book[bookPos]['minoBoard'])
	settoPage(bookPos)
	window.requestAnimationFrame(render)
	autoEncode()
}

function dupliPage(){
	bookPos = getCurrentPosition()
	if(bookPos == book.length-1){
		nextPage()
	} else {
		book.splice(bookPos,0,book[bookPos])
		setPositionDisplay(bookPos+1, book.length)
		//nominally you don't need to "update" the display since it's the same
		document.getElementById('commentBox').value = book[bookPos]['comment']
	}
	window.requestAnimationFrame(render)
	autoEncode()
}

function deletePage(){
	bookPos = getCurrentPosition()
	if(book.length == 1){
		clearPage()
	} else {
		book.splice(bookPos,1)
		bookPos = Math.min(bookPos,book.length-1) // Bound bookPos to end of book
		board = JSON.parse(book[bookPos]['board'])
		setPositionDisplay(bookPos, book.length)
	}
	window.requestAnimationFrame(render)
	autoEncode()
}

function render() { 
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

	let canvasStyle = getCanvasStyle()
	
	function getCanvasStyle() {
		return (document.getElementById('defaultRenderInput').checked ? 'fumen' : 'four')
	}
	
	let lockFlag = document.getElementById('lockFlagInput').checked
	let cellCount = 0
	for (let col = 0; col < 10; col++) {
		cellCount += ((board[y][col].t != 0) || (minoModeBoard[y][col].t != 0)) // I think i can collapse minoModeBoard onto board, then the counting can be done more expediently using .some()
	}
	let drawLineClear = (lockFlag && cellCount == 10)

	let showGrid = (canvasStyle == 'fumen')
	currentPalette = (canvasStyle == 'fumen' ? FumenPalette : FourPalette)

	let foureffectInput = document.getElementById('3dSetting').checked
	let cellAbove = (y == 0) || (board[y - 1][x].t != 0) || (minoModeBoard[y - 1][x].t != 0)
	let have3dHighlight = (canvasStyle == 'four' && foureffectInput && !cellAbove)


	if (type == 2 || drawLineClear) drawLightCell()
	else if (type == 1) 			drawNormalCell()
	
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



const shape_table = {'Z': [[[0, 1], [1, 1], [1, 2], [0, 0]], [[1, 0], [1, 1], [2, 0], [0, 1]]],
               'L': [[[0, 1], [1, 1], [2, 1], [0, 0]], [[0, 1], [1, 0], [0, 2], [0, 0]], [[1, 0], [2, 0], [2, 1], [0, 0]], [[1, 0], [1, 1], [1, 2], [0, 2]]],
               'O': [[[1, 0], [0, 1], [1, 1], [0, 0]]],
               'S': [[[1, 0], [0, 2], [1, 1], [0, 1]],  [[1, 0], [1, 1], [2, 1], [0, 0]]],
               'I': [[[1, 0], [2, 0], [0, 0], [3, 0]],  [[0, 1], [0, 2], [0, 3], [0, 0]]],
               'J': [[[1, 0], [0, 1], [2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2], [0, 0]], [[0, 1], [1, 1], [2, 0], [2, 1]], [[1, 0], [1, 1], [1, 2], [0, 0]]],
               'T': [[[0, 1], [0, 2], [1, 1], [0, 0]], [[1, 0], [1, 1], [2, 0], [0, 0]], [[1, 0], [1, 1], [1, 2], [0, 1]], [[1, 0], [1, 1], [2, 1], [0, 1]]],
}

//CONTRIBUTED BY CONFIDENTIAL (confidential#1288)
function readPiece(mino_positions){
    // if (mino_positions.length != 4){
    //     return 'X'
    // }

    let min_i=Infinity
    let min_j=Infinity
    for (let position of mino_positions){
		min_j = Math.min(min_j, position[0])
		min_i = Math.min(min_i, position[1])
    }

	offset_positions = []
    for (let position of mino_positions){
        offset_positions.push([position[0]-min_j, position[1]-min_i])
    }
    
    for (let [piece, piece_table] of Object.entries(shape_table)) {
        if (is_element(offset_positions, piece_table)) {
            return piece
        }
    }
	return 'X' //if none of the tables match, then it isn't a tetromino shape

    function is_element(offset_positions, query){
		return query.some((query_positions) => {return positions_match(offset_positions, query_positions)})

		function positions_match(offset_positions, query_positions){
			return query_positions.every((query_position) => {
				return offset_positions.some((offset_position) => {
					return position_match(offset_position, query_position)
				})
			})
			
			function position_match(offset_position, query_position) {
				return offset_position[0] == query_position[0] && offset_position[1] == query_position[1]
			}
		}
    }
}

function updateAutoColor() {
	autoColorBool = document.getElementById('autoColorInput').checked
	var isAutoColorUsable = !document.getElementById('minoModeInput').checked
	document.getElementById('autoColorInput').style.opacity = (isAutoColorUsable ? 1 : 0.5)
	updateRowFillInput()
	if(!(isAutoColorUsable && autoColorBool)) {
		for (let row = 0; row < boardSize[1]; row++) {
			for (let col = 0; col < boardSize[0]; col++) {
				if (board[row][col].t == 2){
					board[row][col].t = 1 //solidify any minos
				}
			}
		}
	}
}

//from io.js
function toField(board) {
    FieldString = ''
	for (let row of board){
		for (let cell of row) {
			FieldString += (cell.c == '' ? '_' : cell.c)
		}
	}
    return Field.create(FieldString)
}

function decode() {
    bookPos = getCurrentPosition()
	bookInsert = []
	fumen = document.getElementById('boardOutput').value
	pages = decoder.decode(fumen)
	for(let i = 0; i < pages.length; i++){
		let board = []

		for (rowIndex = 0; rowIndex < 20; rowIndex++) {
			let row = []
			for (colIndex = 0; colIndex < 10; colIndex++) {
				index = (20 - rowIndex - 1) * 10 + colIndex
				colorIndex = pages[i]['_field']['field']['pieces'][index]
				if (colorIndex == 0) row.push({ t: 0, c: '' })
				else {
					letter = ' ILOZTJSX'[colorIndex]
					row.push({ t: 1, c: letter })
				}
			}
			board.push(row)
		}

		board = JSON.stringify(board)
		minoBoard = JSON.stringify(decodeOperation(pages[i]['operation']))
		comment = pages[i]['comment']
		flags = pages[i]['flags']

		page = {
			board, 
			operation: pages[i]['operation'],
			minoBoard: minoBoard,
			comment: comment,
			flags: flags,
		}
		book.splice(bookPos + i, 0, page)
		bookInsert.push(page)
	}
	board = JSON.parse(bookInsert[0].board)
	minoModeBoard = JSON.parse(bookInsert[0].minoBoard)
	comment = bookInsert[0].comment
	document.getElementById('positionDisplayOver').value = '/'+book.length
	document.getElementById('commentBox').value = bookInsert[0].comment
	updateBook()
	window.requestAnimationFrame(render)
};

function fullDecode(fumen) {
	fumen = document.getElementById('boardOutput').value;
    pages = decoder.decode(fumen);
    newBook = [];

    for (i = 0; i < pages.length; i++) {
		input = pages[i]['_field']['field']['pieces'];
        let tempBoard = [];
        for (rowIndex = 0; rowIndex < 20; rowIndex++) {
            let row = [];
            for (colIndex = 0; colIndex < 10; colIndex++) {
                index = (20 - rowIndex - 1) * 10 + colIndex;
                colorIndex = input[index];
                if (colorIndex == 0) row.push({ t: 0, c: '' });
                else {
                    letter = ' ILOZTJSX'[colorIndex];
                    row.push({ t: 1, c: letter });
                }
            }
            tempBoard.push(row);
        }

		tempMinoBoard = decodeOperation(pages[i].operation)
		
		currBook = {
			board: JSON.stringify(tempBoard),
			minoBoard: JSON.stringify(tempMinoBoard),
			comment: pages[i]['comment'],
			flags: pages[i]['flags'],
			operation: pages[i]['operation'],
		};
		

		newBook.push(currBook);
	}
	

	book = newBook;
	bookPos = 0;
	settoPage(bookPos)
	setPositionDisplay(0, book.length);
	window.requestAnimationFrame(render);
};

function encode() {
	bookPos = getCurrentPosition()
	// Solidifying minos
	for (let row = 0; row < 20; row++){
		for (let col = 0; col < 10; col++) {
			if(board[row][col].t == 2){
				prevBoard[row][col].t = 1
				prevBoard[row][col].c = board[row][col].c
			}
		}
	}

	pages = [];
	flags = {
		rise: false,
		mirror: false,
		colorize: true,
		comment: book[bookPos]['comment'],
		lock: true,
		piece: undefined,
	}
	page = {
		comment: book[bookPos]['comment'],
		operation: book[bookPos]['operation'],
		field: toField(JSON.parse(book[bookPos]['board'])),
		flags: flags,
		index: bookPos,
	}
	pages.push(page);

	document.getElementById('boardOutput').value = encoder.encode(pages);
}

function fullEncode() {
	pages = [];
	for (let i = 0; i < book.length; i++){
		flags = {
			rise: false,
			mirror: false,
			colorize: true,
			comment: book[i]['comment'],
			lock: true,
			piece: undefined,
		}
		pages.push({
			comment: book[i]['comment'],
			operation: book[i]['operation'],
			field: toField(JSON.parse(book[i]['board'])),
			flags: flags,
			index: i,
		});
	};
	document.getElementById('boardOutput').value = encoder.encode(pages);
}

function autoEncode() {
	if (document.getElementById('autoEncode').checked == false) return;

	let encodingType = document.getElementById('encodingType').value;
	
	if (encodingType == 'fullFumen') fumen = fullEncode();
	if (encodingType == 'currentFumen') fumen = encode();
}

function decodeOperation(operation){
	decodedMinoBoard = JSON.parse(JSON.stringify(emptyBoard))
	if (operation != undefined){
		let color = operation.type
		let rotation = operation.rotation
		let x = operation.x - 1
		let y = 19 - operation.y - 1
		
		//hardcoding rotations because why distinguish between I, SZ, and O rotations :tf: (i wont work on it)
		switch(color){
			case 'I':
				switch(rotation){
					case 'reverse': rotation = 'spawn'; x--; break;
					case 'left': rotation = 'right'; y--; break;	
				}
				break;
			case 'O':
				switch(rotation){
					case 'spawn': rotation = 'reverse'; y--; x++; break;
					case 'left': rotation = 'reverse'; y--; break;
					case 'right': rotation = 'reverse'; x++; break;
				};
				break;
			case 'S':
				switch(rotation){
					case 'spawn': rotation = 'reverse'; y--; break;
					case 'left': rotation = 'right'; x--; break;
				}
			case 'Z':
				switch(rotation){
					case 'spawn': rotation = 'reverse'; y--; break;
					case 'left': rotation = 'right'; x--; break;
				}
			}
		
		let pieceIndex = 'TILJSZO'.indexOf(color)
		let rotIndex = rotationNames.indexOf(rotation)
		let pieceRef = pieceMaps[pieceIndex]
		let rotRef = pieceRef[rotIndex]

		for(map = 0; map < 16; map++) {
			let row = Math.floor(map/4) + y
			let col = (map % 4) + x
			let type = rotRef[map]
			if (type == 1) decodedMinoBoard[row][col] = {t: 1, c: color}
		}
	}
	return decodedMinoBoard
}

//IMAGE IMPORT
document.addEventListener('paste', (event) => {
    let items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (index in items) {
        let item = items[index];
        if (item.kind != 'file') continue;
        importImage(item.getAsFile());
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

function median(values) {
	if (values.length === 0) throw new Error('No inputs');

	values.sort(function (a, b) {
		return a - b;
	});

	var half = Math.floor(values.length / 2);

	if (values.length % 2) return values[half];

	return (values[half - 1] + values[half]) / 2.0;
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
	window.requestAnimationFrame(render);
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
	window.requestAnimationFrame(render);
}

//HTML FUNCTIONS
function restartCheck(){
	document.getElementById('reset').style.display = 'none'
	document.getElementById('reset-angry').style.display = 'inline-block'
}

function updateBGSelect() {
	document.getElementById('bgselect').style.display = (document.getElementById('transparency').checked ? 'none' : 'block')
}

function updateDownloadSettings() {
	document.getElementById('downloadSettings').style.display = (document.getElementById('downloadOutput').checked ? 'block' : 'none')
}

function toggleAutoEncoding() {
	var autoEncodeOptions = document.getElementById('autoEncodeOptions')
	var boardOutput = document.getElementById('boardOutput')
	var isAutoEncode = document.getElementById('autoEncode').checked
	if (isAutoEncode) {
		autoEncodeOptions.style.display = 'block'
		boardOutput.style.height = 50
		autoEncode()
	} else {
		autoEncodeOptions.style.display = 'none'
		boardOutput.style.height = 79
	}
}

function toggleSidePanel() {
	var fumenSidebar = document.getElementById('fumenSidebar')
	var settingsSidebar = document.getElementById('settingsSidebar')
	var openLogo = document.getElementById('openFumenSettings')
	var closeLogo = document.getElementById('closeFumenSettings')
	if (fumenSidebar.style.display === 'none') {
		fumenSidebar.style.display = 'block'
	} else {
		fumenSidebar.style.display = 'none'
		settingsSidebar.style.display = 'none'
		openLogo.style.display = 'block'
		closeLogo.style.display = 'none'
	}
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

function updateToolTips() {
	var tooltipTextElements = document.getElementsByClassName('tooltiptext')
	var newDisplayStyle = (document.getElementById('tooltipSetting').checked ? 'block' : 'none')
	for (let i=0; i<tooltipTextElements.length; i++) {
		tooltipTextElements[i].style.display = newDisplayStyle
	};
}

function updateRowFillInput() {
	var isRowFillUsable = !document.getElementById('minoModeInput').checked && !document.getElementById('autoColorInput').checked
	document.getElementById('rowFillInput').style.opacity = (isRowFillUsable ? 1 : 0.5)
}

function toggleStyle() {
	document.getElementById('3dToggle').style.opacity = (document.getElementById('defaultRenderInput').checked ? 0.5 : 1)
	render()
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
		board = JSON.parse(book[bookPos]['board'])
		minoModeBoard = JSON.parse(book[bookPos]['minoBoard'])
		operation = book[bookPos]['operation'] //unused?
		setPositionDisplay(bookPos, book.length)
		document.getElementById('commentBox').value = book[bookPos]['comment']
		document.getElementById('lockFlagInput').checked = book[bookPos]['flags']['lock']
	}
	window.requestAnimationFrame(render)
}

function redo() {
	bookPos = getCurrentPosition()
	if (redoLog.length == 0){
		console.log('No following actions logged')
	} else {
		undoLog.push(redoLog.pop())
		book = JSON.parse(undoLog[undoLog.length-1])
		board = JSON.parse(book[bookPos]['board'])
		minoModeBoard = JSON.parse(book[bookPos]['minoBoard'])
		operation = book[bookPos]['operation']
		comment = book[bookPos]['comment']
		setPositionDisplay(bookPos, book.length)
		document.getElementById('commentBox').value = comment
		document.getElementById('lockFlagInput').checked = book[bookPos]['flags']['lock']
	}
	window.requestAnimationFrame(render)
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

function toggleGrid() {
	gridToggle = document.getElementById('gridToggle').checked
	document.getElementById('gridColorPicker').style.display = (gridToggle ? 'block' : 'none')
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

//gonna just leave this here, used it to convert wirelyre mino-board strings to fumens
function wireEncode(){
	inputs = document.getElementById('input').value.split('\n')
	outputs = []
	for(let i = 0; i < inputs.length; i++){
		outputs.push(encodeString(inputs[i]))
	}
	document.getElementById('output').value = outputs.join('\n')
}