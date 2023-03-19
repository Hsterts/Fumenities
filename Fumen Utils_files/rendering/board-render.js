//sharing the same rendering process for both the editor board and the output images
import { displayState } from '../fumen-editor/EditorState.js'
import { boardSize, cellSize } from '../global-utils.js'

export function getFumenMaxHeight(...fumenPages) {
	if (!document.getElementById('autoheight').checked) return parseFloat(document.getElementById('height').value)

	var highestRow = Math.max(...fumenPages.map(highestPageHeight))
	return Math.max(1, Math.min(23, highestRow))

	function highestOperationHeight(operation) {
		var positionRows = operation.positions().map(position => position.y + 1) //one-indexed
		return Math.max(1, ...positionRows)
	}
	
	function highestPageHeight(fumenPage) {
		var highestMino = (fumenPage.operation != undefined ? highestOperationHeight(fumenPage.operation) : 0)

		let fieldString = fumenPage.field.str().replace(RegExp('\n', 'g'), '')
		fieldString = fieldString.slice(0, -10) //ignore garbage line
		// console.log(fieldString)
		let longestEmptyFieldString = fieldString.match(RegExp('^_+'))
		
		if (longestEmptyFieldString === null) {
			var highestFilledIndex = fieldString.length
		} else {
			var highestFilledIndex = fieldString.length - longestEmptyFieldString[0].length
		}
		var highestField = Math.max(1, Math.ceil(highestFilledIndex / 10)) //one-indexed
		
		return Math.max(highestMino, highestField)
	}
}

export function renderBoard() {  //renders board and minoModeBoard
	var combinedBoardStats = {
		board: JSON.parse(JSON.stringify(displayState.board)), 
		tileSize: cellSize, 
		style: (document.getElementById('defaultRenderInput').checked ? 'fumen' : 'four'),
		lockFlag: displayState.flags.lock,
		grid: {
			fillStyle: '#000000',
			strokeStyle: '#ffffff'
		},
	}
	
	//combine board and minomodeBoard
	let minoModeBoard = displayState.minoModeBoard
	for (let row in minoModeBoard) {
		for (let col in minoModeBoard[row]) {
			if (minoModeBoard[row][col].t === 1) combinedBoardStats.board[row][col] = { t: 2, c: minoModeBoard[row][col].c }
		}
	}

	let context = document.getElementById('b').getContext('2d')
	context.imageSmoothingEnabled = false // no anti-aliasing
	context.drawImage(renderBoardOnCanvas(combinedBoardStats), 0, 0)
}

export function pageToBoard(fumenPage) {	
	let fieldString = fumenPage.field.str()
	let truncatedBoardColors = fieldString.split("\n").map(rowColor => rowColor.split(""))
	truncatedBoardColors.pop() //remove garbage row
	let ExtraRows = Math.max(0, truncatedBoardColors.length - 20)
	truncatedBoardColors = truncatedBoardColors.slice(ExtraRows) //ignore any cells above row 20

	let emptyRowColors = Array(boardSize[0]).fill("_")
	var boardColors = [...Array.from({length: boardSize[1]-truncatedBoardColors.length}, () => JSON.parse(JSON.stringify(emptyRowColors))), ...truncatedBoardColors] //pad top with empty rows
	let cellColorToCell = (cellColor) => cellColor === "_" ? { t: 0, c: '' } : { t: 1, c: cellColor }
	var newBoard = boardColors.map(rowColors => rowColors.map(cellColorToCell))

	//add glued minos to board
	const operation = fumenPage.operation;
	if (operation != undefined) {
		var type = operation.type
		for (let position of operation.positions()) {
			newBoard[19-position.y][position.x] = { t: 2, c: type } //operation is bottom-up
		}
	}

	return newBoard
}

export function renderBoardOnCanvas(combinedBoardStats) {
	var tileSize = combinedBoardStats.tileSize
	var canvas = document.createElement('canvas')
	canvas.width = boardSize[0] * tileSize
	canvas.height = boardSize[1] * tileSize
	var canvasContext = canvas.getContext('2d')
	var currentBoard = combinedBoardStats.board
	
	let isFilled = (cell) => cell.t != 0

	//base grid
	{
		let gridCvs = document.createElement('canvas')
		gridCvs.height = tileSize
		gridCvs.width = tileSize
		let gridCtx = gridCvs.getContext('2d')
		gridCtx.fillStyle = combinedBoardStats.grid.fillStyle
		gridCtx.fillRect(0, 0, tileSize, tileSize)
		if (combinedBoardStats.grid.strokeStyle == 7) { //only change opacity if it isn't specified, this keeps tranparent colors unchanged
			gridCtx.strokeStyle = combinedBoardStats.grid.strokeStyle + '60'
		} else {
			gridCtx.strokeStyle = combinedBoardStats.grid.strokeStyle
		}
		gridCtx.strokeRect(0, 0, tileSize + 1, tileSize + 1)
		
		// canvasContext.clearRect(0, 0, boardSize[0] * tileSize, boardSize[1] * tileSize)
		let gridPattern = canvasContext.createPattern(gridCvs, 'repeat')
		canvasContext.fillStyle = gridPattern
		canvasContext.fillRect(0, 0, boardSize[0] * tileSize, boardSize[1] * tileSize)
	}	

	console.log(combinedBoardStats.style)
	if (combinedBoardStats.style == 'fumen') {
		fumenRender()
	} else if (combinedBoardStats.style == 'four') {
		fourRender()
	}
	
	return canvas
	
	function fumenRender() {
		const FumenPalette = {
			normal: { T: '#990099', I: '#009999', L: '#996600', J: '#0000bb', S: '#009900', Z: '#990000', O: '#999900', X: '#999999' },
			clear:  { T: '#cc33cc', I: '#33cccc', L: '#cc9933', J: '#3333cc', S: '#33cc33', Z: '#cc3333', O: '#cccc33', X: '#cccccc' },
		}

		for (let row in currentBoard) {
			let displayLineClear = combinedBoardStats.lockFlag && currentBoard[row].every(isFilled)
			for (let col in currentBoard[row]) {
				let cell = currentBoard[row][col]
				let piece = cell.c
				if (cell.t === 2 || (cell.t === 1 && displayLineClear)) drawMinoRect(col, row, FumenPalette.clear[piece])
				else if (cell.t === 1) drawMinoRect(col, row, FumenPalette.normal[piece])
			}
		}
		
		function drawMinoRect(x, y, color) {
			canvasContext.fillStyle = color
			canvasContext.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize - 1, tileSize - 1)
		}
	}

	function fourRender() {
		const FourPalette = {
			normal:    { T: '#9739a2', I: '#42afe1', L: '#f38927', J: '#1165b5', S: '#51b84d', Z: '#eb4f65', O: '#f6d03c', X: '#868686' },
			clear:     { T: '#b94bc6', I: '#5cc7f9', L: '#f99e4c', J: '#2c84da', S: '#70d36d', Z: '#f96c67', O: '#f9df6c', X: '#bdbdbd' },
			highlight: { T: '#d958e9', I: '#6ceaff', L: '#ffba59', J: '#339bff', S: '#82f57e', Z: '#ff7f79', O: '#ffff7f', X: '#dddddd' },
		}

		// There might be a better way to implement this border priority:
		// 0. background grid
		// 1. border around boundary of filled cells
		// 2. ligher border between filled cells
		// 3. border around highlight
		// The problem comes from 2, which requires checking if both cells neighbouring the border are filled

		const VerticalBorderOpacity = { //left-(border)-right: <cell boarder opacity>-<highlight border opacity>
			'00': ['00', '00'], //empty neighbouring minos
			'11': ['70', '00'], //lighter borders within filled minos
			'01': ['FF', '00'], //boundary of filled cells
			'10': ['FF', '00'],
			'21': ['FF', '00'], //filled cell boundary takes priority over highlight
			'12': ['FF', '00'],
			'20': ['00', 'CC'],
			'02': ['00', 'CC'],
			'22': ['00', 'CC'],
		}
	
		const HorizontalBorderOpacity = { //upper-(border)-lower: <cell boarder opacity>-<highlight border opacity>
			'00': ['00', '00'], //empty neighbouring minos
			'01': ['FF', '00'], //boundary of filled cells
			'10': ['FF', '00'],
			'21': ['FF', '00'],
			'11': ['70', '00'], //lighter borders within filled minos
			'02': ['00', 'CC'], //additional border for highlight
			'12': ['FF', 'CC'],
			//impossible states
			'20': ['00', '00'],
			'22': ['00', '00'],
		}

		var foureffectInput = document.getElementById('3dSetting').checked
		
		for (let row in currentBoard) {
			let displayLineClear = combinedBoardStats.lockFlag && currentBoard[row].every(isFilled)
			for (let col in currentBoard[row]) {
				let cell = currentBoard[row][col]
				let piece = cell.c

				let cellTypeAbove = currentBoard?.[row-1]?.[col]?.t ?? 0 // return cell type, defaulting to filled if out of board
                let have3dHighlight = (foureffectInput && cellTypeAbove == 0)

				if (cell.t === 2 || (cell.t === 1 && displayLineClear)) {
					if (have3dHighlight) draw3dHighlight(col, row, FourPalette.highlight[piece])
					drawMinoRect(col, row, FourPalette.clear[piece])
				} else if (cell.t === 1) {
					if (have3dHighlight) draw3dHighlight(col, row, FourPalette.highlight[piece])
					drawMinoRect(col, row, FourPalette.normal[piece])
				}
			}
		}
		
		function drawMinoRect(x, y, color) {
			canvasContext.fillStyle = color
			canvasContext.fillRect(x * tileSize, y * tileSize, tileSize+1, tileSize+1) //copy fumen when grid is specified?
		}

		function draw3dHighlight(x, y, color) { //drawn above specified cell
			const highlightSize = tileSize / 5
			canvasContext.fillStyle = color
			canvasContext.fillRect(x * tileSize, y * tileSize - highlightSize, tileSize+1, highlightSize+1)
		}

		//grid lines for four is more complicated
		var gridSettings = combinedBoardStats.grid
		if (gridSettings !== undefined) {
			//draw borders according to the surrounding
			for (let row = 0; row < boardSize[1]+1; row++) {
				for (let col = 0; col < boardSize[0]+1; col++) {
					let leftType = getCellStatus(col-1, row)
					let rightType = getCellStatus(col, row)
					
					let resultColors = getColors(VerticalBorderOpacity, leftType, rightType)
					drawVerticalBorder(col, row, resultColors.cellBorderColor, tileSize) //cell
					if (foureffectInput) drawVerticalBorder(col, row, resultColors.highlightBorderColor, tileSize/5) //highlight

					let upperType = getCellStatus(col, row-1)
					let lowerType = getCellStatus(col, row)

					resultColors = getColors(HorizontalBorderOpacity, upperType, lowerType)
					drawHorizontalBorder(col, row, resultColors.cellBorderColor, 0) //cell
					if (foureffectInput) drawHorizontalBorder(col, row, resultColors.highlightBorderColor, (1-1/5) * tileSize) //highlight
				}
			}
		}

		function getColors(OpacityTable, firstType, secondType) {
			let BorderOpacities = OpacityTable[String(firstType)+String(secondType)]
			if (gridSettings.strokeStyle.length == 7) { //only change opacity if it isn't specified, this keeps tranparent colors unchanged
				return {cellBorderColor: gridSettings.strokeStyle + BorderOpacities[0], highlightBorderColor: gridSettings.strokeStyle + BorderOpacities[1]}
			} else {
				return {cellBorderColor: gridSettings.strokeStyle, highlightBorderColor: gridSettings.strokeStyle}
			}
		}

		function getCellStatus(col, row) {
			let cellType = currentBoard?.[row]?.[col]?.t ?? 0
			let cellTypeBelow = currentBoard?.[row+1]?.[col]?.t ?? 0
			if (cellType != 0) {
				return 1 //filled cell
			} if (cellTypeBelow != 0) {
				return 2 //highlight
			} else {
				return 0 //empty
			}
		}
		
		//use fillRect instead of strokeRect, as strokeRect is blurry. see: http://diveintohtml5.info/canvas.html#pixel-madness
		function drawVerticalBorder(x, y, color, borderLength) { //draws left border
			canvasContext.fillStyle = color
			canvasContext.fillRect(x * tileSize, y * tileSize + (tileSize - borderLength), 1, borderLength)
		}

		function drawHorizontalBorder(x, y, color, heightOffset) { //draws upper border
			canvasContext.fillStyle = color
			canvasContext.fillRect(x * tileSize, y * tileSize + heightOffset, tileSize, 1)
		}
	}
}