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
piece_T = ['0000111001000000', '0100011001000000', '0100111000000000', '0100110001000000']
piece_I = ['', '0100010001000100', '0000111100000000']
piece_L = ['0000111010000000', '0100010001100000', '0010111000000000', '1100010001000000']
piece_J = ['0000111000100000', '0110010001000000', '1000111000000000', '0100010011000000']
piece_S = ['0000011011000000', '0100011000100000']
piece_Z = ['0000110001100000', '0010011001000000']
piece_O = ['0000110011000000']

pieceMaps = [piece_T, piece_I, piece_L, piece_J, piece_S, piece_Z, piece_O]


//MAKING FIRST EMPTY BOARD
const aRow = []
const emptyBoard = []
for(let i = 0; i < boardSize[0]; i++) {aRow.push({ t: 0, c: '' })}
for (let i = 0; i < boardSize[1]; i++) {emptyBoard.push(aRow)}
board = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy
minoModeBoard = JSON.parse(JSON.stringify(emptyBoard)) // the lazy way of doing a deep copy
updateBook()

// CANVAS
style = 'four'
var ctx = document.getElementById('b').getContext('2d')
var gridCvs = document.createElement('canvas')
gridCvs.height = cellSize
gridCvs.width = cellSize
var gridCtx = gridCvs.getContext('2d')
gridCtx.fillStyle = '#000000CC'
gridCtx.fillRect(0, 0, cellSize, cellSize)
gridCtx.strokeStyle = '#ffffff88'
gridCtx.strokeRect(0, 0, cellSize + 1, cellSize + 1)
var pattern = ctx.createPattern(gridCvs, 'repeat')
document.getElementById('b').height = (boardSize[1]) * cellSize
document.getElementById('b').width = boardSize[0] * cellSize
document.getElementById('b').style.outline = '2px solid #ffffffcc'

//USER INPUT
mouseY = 0
mouseX = 0
userFocus = false
mouseDown = false
drawMode = true
movingCoordinates = false
minoMode = false

//FUNCTIONS
document.getElementById('b').onmousedown = function mousedown(e) {
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	rect = document.getElementById('b').getBoundingClientRect()
	mouseY = Math.floor((e.clientY - rect.top) / cellSize)
	mouseX = Math.floor((e.clientX - rect.left) / cellSize)
	if(!mouseDown && e.button == 0) {
		movingCoordinates = false
			//mino mode
		if (minoMode) {
			drawnCount = minoModeBoard.reduce((count,row) => {
				return count += row.reduce((xcount,cell) => {
					return xcount += (cell.t != 0)
				}, 0)
			}, 0)
			if (board[mouseY][mouseX].t != 1 && drawnCount != 4 && minoModeBoard[mouseY][mouseX].t != 1) {
				minoModeBoard[mouseY][mouseX] = {t: 1, c: 'X'}
			} else {
				if(minoModeBoard[mouseY][mouseX].t == 1 && drawnCount == 4) {
					for (var row = 0; row < 20; row++){
						for (var col = 0; col < 10; col++) {
							if(minoModeBoard[row][col].c == ''){
							} else {
								minoModeBoard[row][col].c = 'X'
							}	
						}
					}
				}
				minoModeBoard[mouseY][mouseX] = {t: 0, c: ''}
			}
		} else {
			//auto color is basically mino mode and normal combined.
			if(autoColorBool) {			
				drawMode = e.button == 0 && board[mouseY][mouseX]['t'] == 2
				drawnCount = board.reduce((count,row) => {
					return count += row.reduce((xcount,cell) => {
						return xcount += (cell.t == 2)
					}, 0)
				}, 0)
				positions = []
				for (var row = 0; row < 20; row++){
					for (var col = 0; col < 10; col++) {
						if(board[row][col].t == 2){
							positions.push([row,col])
						}
					}
				}

				if (board[mouseY][mouseX]['t'] == 0 && drawnCount <= 3) {
					board[mouseY][mouseX] = { t: 2, c: 'X' }
				} else if(drawnCount <= 3){
					board[mouseY][mouseX] = { t: 0, c: '' }
				}
				
				if (board[mouseY][mouseX]['t'] == 0 && drawnCount == 4) {
					for (var cell = 0; cell < positions.length; cell++){
						let row = positions[cell][0]
						let col = positions[cell][1]
						board[row][col].t = 1
					}
					board[mouseY][mouseX] = { t: 2, c: 'X' }
				} else if(drawnCount == 4) {
					for (var cell = 0; cell < positions.length; cell++){
						let row = positions[cell][0]
						let col = positions[cell][1]
						board[row][col].c = 'X'
					}
					board[mouseY][mouseX] = { t: 0, c: '' }
				}

			//normal draw mode
			} else {
				drawMode = e.button == 0 && board[mouseY][mouseX]['t'] == 1
				if (board[mouseY][mouseX]['t'] == 0) {
					board[mouseY][mouseX] = { t: 1, c: paintbucketColor() }
				} else {
					if (board[mouseY][mouseX]['c'] != paintbucketColor()) {
						board[mouseY][mouseX] = { t: 1, c: paintbucketColor() }
					} else {
						board[mouseY][mouseX] = { t: 0, c: '' }
					}
				}
			}
		}
		updateBook()
		autoEncode()
	} else {
		board[mouseY][mouseX] = { t: 0, c: '' }
		minoModeBoard[mouseY][mouseX] = { t: 0, c: ''}
		updateBook()
		autoEncode()
	}
	mouseDown = true
	drawMode = board[mouseY][mouseX]['t'] == 1
}

document.getElementById('b').onmousemove = function mousemove(e) {
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	rect = document.getElementById('b').getBoundingClientRect()
	y = Math.floor((e.clientY - rect.top) / cellSize)
	x = Math.floor((e.clientX - rect.left) / cellSize)
		if (inRange(x, 0, boardSize[0]-1) && inRange(y, 0, boardSize[1]-1)) {
		movingCoordinates = y != mouseY || x != mouseX
		mouseY = y
		mouseX = x
        if (mouseDown && movingCoordinates) {
			//mino mode
			if (minoMode) {
				drawnCount = minoModeBoard.reduce((count,row) => {
					return count += row.reduce((xcount,cell) => {
						return xcount += (cell.t != 0)
					}, 0)
				}, 0)
                if (board[mouseY][mouseX].t != 1 && minoModeBoard[mouseY][mouseX].t != 1 && drawnCount < 4) {
                    minoModeBoard[mouseY][mouseX] = { t: 1, c: 'X' }
	            } else {
					if(minoModeBoard[mouseY][mouseX].t == 1 && drawnCount == 4) {
						//remove colors when there are four minos and user deletes one
						for (var row = 0; row < 20; row++){
							for (var col = 0; col < 10; col++) {
								if(minoModeBoard[row][col].c != ''){
									minoModeBoard[row][col].c = 'X'
								}
							}
						}
					}
					minoModeBoard[mouseY][mouseX] = {t: 0, c: ''}
				}
            } else {
				//auto color is basically mino an- :ResidentSleeper:
				if(autoColorBool) {
					drawnCount = board.reduce((count,row) => {
						return count += row.reduce((xcount,cell) => {
							return xcount += (cell.t == 2)
						}, 0)
					}, 0)
					positions = []
					for (var row = 0; row < 20; row++){
						for (var col = 0; col < 10; col++) {
							if(board[row][col].t == 2){
								positions.push([row,col])
							}
						}
					}

					if (board[mouseY][mouseX]['t'] == 0 && drawnCount <= 3) {
						board[mouseY][mouseX] = { t: 2, c: 'X' }
					} else if(drawnCount <= 3){
						board[mouseY][mouseX] = { t: 0, c: '' }
					}
				} else {
					//normal mode
					if (drawMode) {
						if (board[mouseY][mouseX]['t'] == 0) {
							board[mouseY][mouseX] = { t: 1, c: paintbucketColor() }
						} else {
							if (board[mouseY][mouseX]['c'] != paintbucketColor()) {
								board[mouseY][mouseX] = { t: 1, c: paintbucketColor() }
							}
						}
					} else {
						board[mouseY][mouseX] = { t: 0, c: '' }
					}
				}
			}
			updateBook()
			autoEncode()
		}
	}
}

document.onmouseup = function mouseup() {
    mouseDown = false
	drawn = []
	bookPos = document.getElementById('positionDisplay').value-1
	if (minoMode) {
		//count drawn pieces
		drawnCount = minoModeBoard.reduce((count,row) => {
			return count += row.reduce((tval,cell) => {
				return tval += (cell.t != 0)
			}, 0)
		}, 0)

		if(drawnCount == 4){
			//get all drawn cells + their coords
			for (var row = 0; row < 20; row++){
				for (var col = 0; col < 10; col++) {
					if(minoModeBoard[row][col].c == ''){
					} else {
						cellData = {row: row, col: col, info: minoModeBoard[row][col]}
						drawn.push(cellData)
					}	
				}
			}
			
			for(var cell = 0; cell < 4; cell++) {
				minoFieldString = ''
				//making map
				for(var y = -1; y < 3; y++){
					for(var x = -1; x < 3; x++){
						let row = drawn[cell]['row'] + y
						let col = drawn[cell]['col'] + x
						if(!inRange(row,0,19) || !inRange(col,0,9)) {
						minoFieldString += '0'
						} else {
						 	minoFieldString += minoModeBoard[row][col].t.toString()
						}
					}
				}
				//matching map to piece
				for(var piece = 0; piece < 7; piece++){
					pieceMap = pieceMaps[piece]
					index = pieceMap.findIndex((pieceString) => pieceString === minoFieldString)
					if(index != -1){
						//operations property items
						type = 'TILJSZO'[piece]
						rotations = ['reverse','right','spawn','left']
						rotation = rotations[index]
						x = drawn[cell]['col']
						y = 19 - drawn[cell]['row']
						operation = new Mino(type, rotation, x, y)
						//coloring in
						for (var row = 0; row < 20; row++){
							for (var col = 0; col < 10; col++) {
								if(minoModeBoard[row][col].c == ''){
								} else {
									minoModeBoard[row][col].c = type
								}	
							}
						}
						//saving matched piece
						updateBook()
					}
				}
			}
		}
    }

	if(autoColorBool){
		positions = []
		for (var row = 0; row < 20; row++){
			for (var col = 0; col < 10; col++) {
				if(board[row][col].t == 2){
					positions.push([row,col])
				}
			}
		}

		result = readPiece(positions)
		//because why fix the readPiece function from reading upside down :kappa:
		switch(result){
			case 'S': result = 'Z'; break;
			case 'Z': result = 'S'; break;
			case 'L': result = 'J'; break;
			case 'J': result = 'L'; break;
			case undefined: result = 'X'; break;
			default: break;
		}

		for (var cell = 0; cell < positions.length; cell++){
			let row = positions[cell][0]
			let col = positions[cell][1]
			if(board[row][col].c == 'X' && positions.length % 4 == 0) board[row][col].c = result
		}
	}

	autoEncode()
    requestAnimationFrame(render)
}

<<<<<<< HEAD
function focused() {userFocus = true}
=======
function setPositionDisplay(pageNum, totalPageNum) {
	document.getElementById('positionDisplay').value = pageNum
	document.getElementById('positionDisplayOver').value = '/' + totalPageNum
}

function setPaintBucket(index) {
	document.paintbucket[index].checked = true;
}
>>>>>>> 8ec5356 (refactor positionDisplay)

function unfocused() {userFocus = false}

document.onkeydown = function hotkeys(e) {
	console.log("checking userFocus: " + (userFocus))
	if(userFocus == false){
		if(e.ctrlKey == true){
			switch (e.key) {
				case 'z': undo(); break;
				case 'y': redo(); break;
			}
		} else {
			switch (e.key) {
				case '1': paintbucket[0].checked = true; break;
				case '2': paintbucket[1].checked = true; break;
				case '3': paintbucket[2].checked = true; break;
				case '4': paintbucket[3].checked = true; break;
				case '5': paintbucket[4].checked = true; break;
				case '6': paintbucket[5].checked = true; break;
				case '7': paintbucket[6].checked = true; break;
				case '8': paintbucket[7].checked = true; break;
				case 'r': restart(); break;
				case ',': prevPage(); break;
				case '.': nextPage(); break;
				default: break;			
			}
		}
	}
}

function paintbucketColor() {
	for (i = 0; i < document.paintbucket.length; i++) {
		if (document.paintbucket[i].checked) {
			return document.paintbucket[i].id;
		}
	}
}

function inRange(number, min, max) {
    return (number >= min && number <= max)
}

// Updates all of the board properties: board, minoBoard, operation, comments
function updateBook() {
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	book[bookPos] = {
		board: JSON.stringify(board),
		minoBoard: JSON.stringify(minoModeBoard),
		comment: document.getElementById('commentBox').value,
		operation: operation,
		flags: {
			lock: document.getElementById('lockFlagInput').checked,
			},
	}

	if(book[bookPos]['comment'] == undefined){
		document.getElementById('commentBox').value = ''
	} else {
		document.getElementById('commentBox').value = book[bookPos]['comment']
	}

	//Generating 100 undo logs
	if(undoLog.length <= 100){
		undoLog.push(JSON.stringify(book))
	} else {
		undoLog.splice(0,1)
		undoLog.push(JSON.stringify(book))
	}
	//Clearing redo if branch is overwritten
	redoLog = [];

	autoColor()
	window.requestAnimationFrame(render)
}

function toggleMinoMode() {
    minoMode = document.getElementById('minoModeInput').checked
    if (minoMode) {
	} else {
		if(operation == undefined){
		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
		operation = undefined
		updateBook()
		}
	}
}

function shift(direction){
	switch(direction) {
	case 'left':		
			board.map((y) => {
				y.splice(0,1)
				y.push({t: '0', c: ''})
			})
		break;
	case 'up':
			board.splice(0,1)
			board.push(JSON.parse(JSON.stringify(aRow)))
		break;
	case 'down':
			board.pop()
			board.splice(0,0,JSON.parse(JSON.stringify(aRow)))
		break;
	case 'right':
			board.map((y) => {
				y.splice(0,0,{t: '0', c: ''})
				y.pop()
			})
		break;
	}
	updateBook()
}

function settoPage(newPagePos) { // I do not trust the global variable
	// Bound bookPos to existing pages
	newPagePos = Math.max(Math.min(book.length-1, newPagePos), 0)

	setPositionDisplay(newPagePos+1, book.length)
	board = JSON.parse(book[newPagePos]['board'])
	minoModeBoard = JSON.parse(book[newPagePos]['minoBoard'])
	document.getElementById('commentBox').value = book[newPagePos]['comment']
	// what about operation?
}

function prevPage() {
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	settoPage(bookPos-1)
	window.requestAnimationFrame(render)
	autoEncode()
}

function gotoPage() {
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	// Go to an existing page
	settoPage(bookPos)
	window.requestAnimationFrame(render)
	autoEncode()
}

function nextPage() {
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	bookPos += 1 // next page
	if(bookPos <= book.length-1) {
		// Go to an existing page
		settoPage(bookPos)
		flags = {lock: true}
	} else {
		// Create new page
		setPositionDisplay(bookPos+1, book.length + 1)

		// Solidifying minos
		prevBoard = JSON.parse(book[bookPos-1]['board'])
		for (var row = 0; row < 20; row++){
			for (var col = 0; col < 10; col++) {
				if(board[row][col].t == 2){
					prevBoard[row][col].t = 1
					prevBoard[row][col].c = board[row][col].c
				}
			}
		}
		book[bookPos-1]['board'] = JSON.stringify(prevBoard)

		if(book[bookPos-1]['operation'] != undefined){
			for (var row = 0; row < 20; row++){
				for (var col = 0; col < 10; col++) {
					if(minoModeBoard[row][col].t != 0){
						board[row][col] = minoModeBoard[row][col]
					}
				}
			}
		} else {
			board = JSON.parse(book[bookPos - 1]['board'])
		}

		//Line clears if flag lock is on
		if(book[bookPos-1]['flags']['lock'] === true) {
			rowSum = []
			//Check # of minos
			for(var row = 0; row < 20; row++){
				let cellCount = 0
				for(var col = 0; col < 10; col++){	
					cellCount += board[row][col].t
				}
				rowSum.push(cellCount)
			}
			//Clear lines
			for(var row = 0; row < 20; row++){
				if(rowSum[row] == 10) {
					board.splice(row, 1)
					board.splice(0, 0, aRow)
				}
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
	}
	window.requestAnimationFrame(render)
	autoEncode()
	updateBook()
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
	book = []
	book[0] = [{board: JSON.stringify(board),},]
	setPositionDisplay(1, book.length)
	document.getElementById('boardOutput').value = ''
	document.getElementById('commentBox').value = ''
	comments = []
	document.getElementById('reset').style.display = 'inline-block'
	document.getElementById('reset-angry').style.display = 'none'
	window.requestAnimationFrame(render)
}

function clearPage(){
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	book[bookPos] = {
		board: JSON.stringify(emptyBoard),
		minoBoard: JSON.stringify(emptyBoard),
		comment: '',
		operation: undefined,
		flags: flags
	}
	settoPage(bookPos)
	window.requestAnimationFrame(render)
	autoEncode()
}

function dupliPage(){
	bookPos = parseFloat(document.getElementById('positionDisplay').value-1)
	if(book.length == 1){
		nextPage()
	} else {
		if (bookPos != book.length-1) {
			book.splice(bookPos,0,book[bookPos])
			setPositionDisplay(bookPos+2, book.length)
			document.getElementById('commentBox').value = book[bookPos]['comment']
		} else {
			if(bookPos == book.length-1){
				nextPage()
			}
		}
	}
	window.requestAnimationFrame(render)
	autoEncode()
}

function deletePage(){
	bookPos = parseFloat(document.getElementById('positionDisplay').value-1)
	if(book.length == 1){
		clearPage()
	} else {
		if (bookPos != book.length-1) {
			board = JSON.parse(book[bookPos+1]['board'])
			book.splice(bookPos,1)
			setPositionDisplay(bookPos+1, book.length)	
		} else {
			board = JSON.parse(book[bookPos-1]['board'])
			book.pop()
			setPositionDisplay(bookPos, book.length)
		}
	}
	window.requestAnimationFrame(render)
	autoEncode()
}

function render() {
	ctx.clearRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize)
	ctx.fillStyle = pattern
	ctx.fillRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize)
	board.map((y, i) => {
		y.map((x, ii) => {
			if (x.t != 0) {
				drawCell(ii, i, x.c, x.t)
			}
		})
	})
	minoModeBoard.map((y, i) => {
		y.map((x, ii) => {
			if(x.t == 1) {
				drawCell(ii, i, x.c, 2)
			}
		})
	})
}

function drawCell(x, y, piece, type) {
	var foureffectInput = document.getElementById('3dSetting').checked
	var lockFlag = document.getElementById('lockFlagInput').checked
	
	if(style == 'four'){
		var color = {Z: '#ef624d', L: '#ef9535', O: '#f7d33e', S: '#66c65c', I: '#41afde', J: '#1983bf', T: '#b451ac', X: '#999999'}
		var lightercolor = {Z: '#fd7660', L: '#fea440', O: '#ffe34b', S: '#7cd97a', I: '#3dc0fb', J: '#1997e3', T: '#d161c9', X: '#bbbbbb'}
		var lightestcolor = {Z: '#ff998c', L: '#feb86d', O: '#fbe97f', S: '#96f98b', I: '#75faf8', J: '#1fd7f7', T: '#fe89f7', X: '#dddddd'}
		if(y == 0){
			var cellAbove = 1
		} else {
			var cellAbove = (board[y-1][x]['t'] != 0) + (minoModeBoard[y-1][x]['t'] != 0)
		}

		if (type == 1) {
			//Normal colors
			if (cellAbove == 0){
				ctx.fillStyle = lightercolor[piece]
				if(foureffectInput){
					ctx.fillRect((x) * cellSize + 1, y * cellSize + 1 - cellSize/5, cellSize - 0, cellSize/5)
				}
			}
			ctx.fillStyle = color[piece]
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0)
			//Light locked row colors
			if (lockFlag == true) {
				//check row mino count
				var cellCount = 0
				for(var col = 0; col < 10; col++){	
					cellCount += (board[y][col].t != 0)
					cellCount += (minoModeBoard[y][col].t != 0)
				}
				//color in if 10
				if(cellCount == 10){
					if (cellAbove != 1){
						ctx.fillStyle = lightestcolor[piece]
						if(foureffectInput){
							ctx.fillRect((x) * cellSize + 1, y * cellSize + 1 - cellSize/5, cellSize - 0, cellSize/5)
						}
					}
					ctx.fillStyle = lightercolor[piece]
					ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0)
				}
			}
		}
		//Light mino colors
		if (type == 2) {
			if (cellAbove == 0){
				ctx.fillStyle = lightestcolor[piece]
				if(foureffectInput){
				ctx.fillRect((x) * cellSize + 1, y * cellSize + 1 - cellSize/5, cellSize - 0, cellSize/5)
				}
			}
			ctx.fillStyle = lightercolor[piece]
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0)
		}
	}

	if(style == 'fumen'){
		var color = {Z: '#990000', L: '#996600', O: '#999900', S: '#009900', I: '#009999', J: '#0000bb', T: '#990099', X: '#999999'}
		var lightercolor = {Z: '#cc3333', L: '#cc9933', O: '#cccc33', S: '#33cc33', I: '#33cccc', J: '#3333cc', T: '#cc33cc', X: '#cccccc'}
		if (type == 1) {
			//Normal colors
			ctx.fillStyle = color[piece]
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1)
			//Light locked row colors
			if (lockFlag == true) {
				//check row mino count
				var cellCount = 0
				for(var col = 0; col < 10; col++){	
					cellCount += (board[y][col].t != 0)
					cellCount += (minoModeBoard[y][col].t != 0)
				}
				//color in if 10
				if(cellCount == 10){
					ctx.fillStyle = lightercolor[piece]
					ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1)
				}
			}
		}
		//Light mino colors
		if (type == 2) {
			ctx.fillStyle = lightercolor[piece]
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1)
		}
	}
}

var shape_table = {'Z': [[[1, 0], [0, 2], [1, 1], [0, 1]],  [[1, 0], [1, 1], [2, 1], [0, 0]]],
               'L': [[[1, 0], [0, 1], [2, 0], [0, 0]], [[0, 1], [0, 2], [1, 2], [0, 0]], [[0, 1], [1, 1], [2, 0], [2, 1]], [[1, 0], [1, 1], [1, 2], [0, 0]]],
               'O': [[[1, 0], [0, 1], [1, 1], [0, 0]]],
               'S': [[[0, 1], [1, 1], [1, 2], [0, 0]], [[1, 0], [1, 1], [2, 0], [0, 1]]],
               'I': [[[1, 0], [2, 0], [0, 0], [3, 0]],  [[0, 1], [0, 2], [0, 3], [0, 0]]],
               'J': [[[0, 1], [1, 1], [2, 1], [0, 0]], [[0, 1], [1, 0], [0, 2], [0, 0]], [[1, 0], [2, 0], [2, 1], [0, 0]], [[1, 0], [1, 1], [1, 2], [0, 2]]],
               'T': [[[0, 1], [0, 2], [1, 1], [0, 0]], [[1, 0], [1, 1], [2, 0], [0, 0]], [[1, 0], [1, 1], [1, 2], [0, 1]], [[1, 0], [1, 1], [2, 1], [0, 1]]],
}

//CONTRIBUTED BY CONFIDENTIAL (confidential#1288)
function readPiece(positions){
    if (positions.length != 4){
        return 'X'
    }
    var min_i=99
    var min_j=99
    
    for (position of positions){
        var j = position[0]
        var i = position[1]
        if (j < min_j){
            min_j = j
        }
            
        if (i < min_i){
            min_i = i
        }
            
    }
    var offset_positions = []

    for (var position of positions){
        j = position[0]
        i = position[1]
        offset_positions.push([j-min_j, i-min_i])
    }
    
    for (var piece in shape_table) {
        if (shape_table.hasOwnProperty(piece) && is_element(offset_positions, shape_table[piece])) {
            return piece
        }
    }

    function positions_equal(positions1, positions2){
        if (positions1.length != positions2.length){
            return false
        }
        for (var position1 of positions1){
            var found = false
            for (var position2 of positions2){
                if (position1[0] == position2[0] && position1[1] == position2[1]){
                    found = true
                }
            }
            if (found == false){
                return false
            }
        }
        return true
    }
    function is_element(positions1, query){
        for (var positions of query){
            if (positions_equal(positions1, positions)){
                return true
            }
        }
        return false
    }
            
}

function autoColor() {
	autoColorBool = document.getElementById('autoColorInput').checked
	if(autoColorBool == false){
		for (var row = 0; row < 20; row++){
			for (var col = 0; col < 10; col++) {
				if(board[row][col].t == 2){
					board[row][col].t = 1
				}
			}
		}
	}
}

//from io.js
function toField(board) {
    FieldString = ''
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < 10; col++) {
            if (board[row][col]['t'] != 0) {
                FieldString += board[row][col]['c']
            } else FieldString += '_'
        }
    }
    return Field.create(FieldString)
}

function decode() {
    bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
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
	setPositionDisplay(1, book.length);
	window.requestAnimationFrame(render);
};

function encode() {
	bookPos = document.getElementById('positionDisplay').value-1
	// Solidifying minos
	for (var row = 0; row < 20; row++){
		for (var col = 0; col < 10; col++) {
			if(board[row][col].t == 2){
				prevBoard[row][col].t = 1
				prevBoard[row][col].c = board[row][col].c
			}
		}
	}

	pages = [];

	page = [];
	field = toField(JSON.parse(book[bookPos]['board']));
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
		field,
		flags: flags,
		index: bookPos,
	}
	pages.push(page);

	var result = encoder.encode(pages);
	document.getElementById('boardOutput').value = result;
}

function fullEncode() {
	pages = [];
	for (var i = 0; i < book.length; i++){
		page = [];
		field = toField(JSON.parse(book[i]['board']));
		flags = {
			rise: false,
			mirror: false,
			colorize: true,
			comment: book[i]['comment'],
			lock: true,
			piece: undefined,
		}
			page = {
				comment: book[i]['comment'],
				operation: book[i]['operation'],
				field,
				flags: flags,
				index: i,
			}
		pages.push(page);
	};
	var result = encoder.encode(pages);
	document.getElementById('boardOutput').value = result;
}

function autoEncode() {
	var autoEncodeBool = document.getElementById('autoEncode').checked;

	var encodingType = document.getElementById('encodingType').value;
	if(autoEncodeBool == true) {
		if(encodingType == 'fullFumen') {
			fumen = fullEncode();
		};
		if(encodingType == 'currentFumen') {
			fumen = encode();
		};
	};
}

function decodeOperation(operation){
	decodedMinoBoard = JSON.parse(JSON.stringify(emptyBoard))
	if(operation != undefined){
		let c = operation.type
		let rotation = operation.rotation
		let x = operation.x - 1
		let y = 19 - operation.y - 1
		
		//hardcoding rotations because why distinguish between I, SZ, and O rotations :tf: (i wont work on it)
		switch(c){
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
		
		let pieceIndex = 'TILJSZO'.indexOf(c)
		let rotIndex = ['reverse','right','spawn','left'].indexOf(rotation)
		let pieceRef = pieceMaps[pieceIndex]
		let rotRef = pieceRef[rotIndex]

		for(map = 0; map < 16; map++) {
			let row = Math.floor(map/4) + y
			let col = (map % 4) + x
			let type = rotRef[map]
			if(type == 1){
					decodedMinoBoard[row][col] = {t: 1, c: c}
			}
		}
	}
	return decodedMinoBoard
}

//IMAGE IMPORT
document.addEventListener('paste', (event) => {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (index in items) {
        var item = items[index];
        if (item.kind === 'file') {
            var blob = item.getAsFile();
            importImage(blob);
        }
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
        scale = this.width / 10.0;
        x = 10;
        y = Math.min(Math.round(this.height / scale), 22);
        console.log(x, y);
        mycanvas.width = this.width;
        mycanvas.height = this.height;

        // Draw the image
        ctx.drawImage(img, 0, 0, this.width, this.height);
        var data = Object.values(ctx.getImageData(0, 0, this.width, this.height).data);
        var nDat = [];
        for (row = 0; row < y; row++) {
            for (col = 0; col < 10; col++) {
                // get median value of pixels that should correspond to [row col] mino

                minoPixelsR = [];
                minoPixelsG = [];
                minoPixelsB = [];

                for (pixelRow = Math.floor(row * scale); pixelRow < row * scale + scale; pixelRow++) {
                    for (pixelCol = Math.floor(col * scale); pixelCol < col * scale + scale; pixelCol++) {
                        index = (pixelRow * this.width + pixelCol) * 4;
                        minoPixelsR.push(data[index]);
                        minoPixelsG.push(data[index + 1]);
                        minoPixelsB.push(data[index + 2]);
                    }
                }

                medianR = median(minoPixelsR);
                medianG = median(minoPixelsG);
                medianB = median(minoPixelsB);
                var hsv = rgb2hsv(medianR, medianG, medianB);
                console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
                nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
            }
        }
        /* // old alg from just scaling it down to x by y pixels
        for (let i = 0; i < data.length / 4; i++) {
            //nDat.push(data[i*4] + data[(i*4)+1] + data[(i*4)+2] < 382?1:0)
            var hsv = rgb2hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
            console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
            nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
        }*/

        tempBoard = new Array(20 - y).fill(new Array(10).fill({ t: 0, c: '' })); // empty top [40-y] rows
        for (rowIndex = 0; rowIndex < y; rowIndex++) {
            let row = [];
            for (colIndex = 0; colIndex < 10; colIndex++) {
                index = rowIndex * 10 + colIndex;
                temp = nDat[index];
                if (temp == '.') row.push({ t: 0, c: '' });
                else row.push({ t: 1, c: temp });
            }
            tempBoard.push(row);
        }

        board = JSON.parse(JSON.stringify(tempBoard));
        updateBook();
    };

    var URLObj = window.URL || window.webkitURL;
    img.src = URLObj.createObjectURL(blob);
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

function rgb2hsv(r, g, b) {
	let v = Math.max(r, g, b),
		c = v - Math.min(r, g, b);
	let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
	return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function nearestColor(h, s, v) {
	if (inRange(h, 0, 30) && inRange(s, 0, 1) && (inRange(v, 133, 135) || inRange(v, 63, 88))) return 'X'; // attempted manual override specifically for four.lol idk
	if (inRange(h, 220, 225) && inRange(s, 0, 0.2) && v == 65) return '.';

	if (s <= 0.2 && v / 2.55 >= 55) return 'X';
	if (v / 2.55 <= 55) return '.';

	if (inRange(h, 0, 16) || inRange(h, 325, 360)) return 'Z';
	else if (inRange(h, 16, 41)) return 'L';
	else if (inRange(h, 41, 70)) return 'O';
	else if (inRange(h, 70, 149)) return 'S';
	else if (inRange(h, 149, 200)) return 'I';
	else if (inRange(h, 200, 266)) return 'J';
	else if (inRange(h, 266, 325)) return 'T';
	return '.';
}

function inRange(x, min, max) {
	return x >= min && x <= max;
}

function median(values) {
	// if this is too computationally expensive maybe switch to mean
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
	updatebookory();
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
	updatebookory();
	window.requestAnimationFrame(render);
}

//HTML FUNCTIONS
function restartCheck(){
	document.getElementById('reset').style.display = 'none'
	document.getElementById('reset-angry').style.display = 'inline-block'
}

function toggleBGSelect() {
	var x = document.getElementById('bgselect')
	if (x.style.display === 'none') {
	  x.style.display = 'block'
	} else {
	  x.style.display = 'none'
	}
  }

function toggleDownloadSettings() {
	var x = document.getElementById('downloadSettings')
	if (x.style.display === 'none') {
	  x.style.display = 'block'
	} else {
	  x.style.display = 'none'
	}
  }

function toggleAutoEncoding() {
	var x = document.getElementById('autoEncodeOptions')
	var y = document.getElementById('boardOutput')
	if (x.style.display == 'none') {
	  x.style.display = 'block'
	  y.style.height = 50
	  autoEncode()
	} else {
	  x.style.display = 'none'
	  y.style.height = 79
	}
  }

function toggleSidePanel() {
	var x = document.getElementById('fumenSidebar')
	var y = document.getElementById('settingsSidebar')
	var open = document.getElementById('openFumenSettings')
	var close = document.getElementById('closeFumenSettings')
	if (x.style.display === 'none') {
		x.style.display = 'block'
	} else {
		x.style.display = 'none'
		y.style.display = 'none'
		open.style.display = 'block'
		close.style.display = 'none'
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

function toggleToolTips() {
	var x = document.getElementsByClassName('tooltiptext')
	for(let z = 0; z<x.length; z++) {
		if(x[z].style.display === 'none' || x[z].style.display === ''){
			x[z].style.display = 'block'
		} else {
			x[z].style.display = 'none'
		};
	};
}

function toggleStyle() {
	if(document.getElementById('defaultRenderInput').checked) {
		style = 'fumen'
		document.getElementById('3dToggle').style.opacity = 0.5
	} else {
		style = 'four'
		document.getElementById('3dToggle').style.opacity = 1
	}
	render()
}

function renderImages(fumen) {
	  style = document.getElementById('renderStyle').value
	  switch(style){
		  case 'four': fumencanvas(fumen); break;
		  case 'fumen': fumenrender(fumen); break;
	  }
  }

function undo() {
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	if(undoLog.length != 0){
		book = JSON.parse(undoLog[undoLog.length-2])
		redoLog.push(undoLog[undoLog.length-1])
		undoLog.pop()
		board = JSON.parse(book[bookPos]['board'])
		minoModeBoard = JSON.parse(book[bookPos]['minoBoard'])
		operation = book[bookPos]['operation']
		comment = book[bookPos]['comment']
		document.getElementById('commentBox').value = comment
		document.getElementById('lockFlagInput').checked = book[bookPos]['flags']['lock']
	} else {
		console.log('No previous actions logged')
	}
	window.requestAnimationFrame(render)
}

function redo() {
	bookPos = parseFloat(document.getElementById('positionDisplay').value)-1
	if(redoLog.length != 0){
		book = JSON.parse(redoLog[redoLog.length-1])
		undoLog.push(redoLog[redoLog.length-1])
		redoLog.pop()
		board = JSON.parse(book[bookPos]['board'])
		minoModeBoard = JSON.parse(book[bookPos]['minoBoard'])
		operation = book[bookPos]['operation']
		comment = book[bookPos]['comment']
		document.getElementById('commentBox').value = comment
		document.getElementById('lockFlagInput').checked = book[bookPos]['flags']['lock']
	} else {
		console.log('No following actions logged')
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
	var x = document.getElementById('gridColorPicker')
	if(gridToggle){
		x.style.display = 'block';
	} else {
		x.style.display = 'none';
	}
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

delimiter = document.getElementById('delim').value

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