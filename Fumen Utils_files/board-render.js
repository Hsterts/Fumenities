//sharing the same rendering process for both the editor board and the output images

function pageToBoard(page) {	
	let fieldString = page.field.str()
	let truncatedBoardColors = fieldString.split("\n").map(rowColor => rowColor.split(""))
	truncatedBoardColors.pop() //remove garbage row
	let ExtraRows = Math.max(0, truncatedBoardColors.length - 20)
	truncatedBoardColors = truncatedBoardColors.slice(ExtraRows) //ignore any cells above row 20

	let emptyRowColors = Array(boardSize[0]).fill("_")
	var boardColors = [...Array.from({length: boardSize[1]-truncatedBoardColors.length}, () => JSON.parse(JSON.stringify(emptyRowColors))), ...truncatedBoardColors] //pad top with empty rows
	let cellColorToCell = (cellColor) => cellColor === "_" ? { t: 0, c: '' } : { t: 1, c: cellColor }
	var board = boardColors.map(rowColors => rowColors.map(cellColorToCell))

	//add glued minos to board
	const operation = page.operation;
	if (operation != undefined) {
		var type = operation.type
		for (position of operation.positions()) {
			board[19-position.y][position.x] = { t: 2, c: type } //operation is bottom-up
		}
	}

	return board
}

function renderBoardOnCanvas(combinedBoardStats) {
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
		gridCtx.strokeStyle = combinedBoardStats.grid.strokeStyle
		gridCtx.strokeRect(0, 0, tileSize + 1, tileSize + 1)

		let gridPattern = canvasContext.createPattern(gridCvs, 'repeat')
		canvasContext.clearRect(0, 0, boardSize[0] * tileSize, boardSize[1] * tileSize)
		canvasContext.fillStyle = gridPattern
		canvasContext.fillRect(0, 0, boardSize[0] * tileSize, boardSize[1] * tileSize)
	}	

	if (combinedBoardStats.style == 'fumen') {
		fumenRender()
	} else if (combinedBoardStats.style == 'four') {
		fourRender()
	}
	
	return canvas
	
	function fumenRender() {
		const FumenPalette = {
			normal: { T: '#990099', I: '#009999', O: '#999900', L: '#996600', J: '#0000bb', S: '#009900', Z: '#990000', X: '#999999' },
			light:  { T: '#cc33cc', I: '#33cccc', O: '#cccc33', L: '#cc9933', J: '#3333cc', S: '#33cc33', Z: '#cc3333', X: '#cccccc' },
		}

		for (let row in currentBoard) {
			let displayLineClear = combinedBoardStats.lockFlag && currentBoard[row].every(isFilled)
			for (let col in currentBoard[row]) {
				let cell = currentBoard[row][col]
				let piece = cell.c
				if (cell.t === 2 || (cell.t === 1 && displayLineClear)) drawMinoRect(col, row, FumenPalette.light[piece])
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
			normal:  { T: '#b451ac', I: '#41afde', O: '#f7d33e', L: '#ef9535', J: '#1983bf', S: '#66c65c', Z: '#ef624d', X: '#999999' },
			light:   { T: '#d161c9', I: '#3dc0fb', O: '#ffe34b', L: '#fea440', J: '#1997e3', S: '#7cd97a', Z: '#fd7660', X: '#bbbbbb' },
			lighter: { T: '#fe89f7', I: '#75faf8', O: '#fbe97f', L: '#feb86d', J: '#1fd7f7', S: '#96f98b', Z: '#ff998c', X: '#dddddd' },
		}

		// There might be a better way to implement this border priority:
		// 0. background grid
		// 1. border around boundary of filled cells
		// 2. ligher border between filled cells
		// 3. border around highlight
		// The problem comes from 2, which requires checking if both cells neighbouring the border are filled

		const VerticalBorderOpacity = { //left-(border)-right: <cell boarder opacity>-<highlight border opacity>
			'00': ['00', '00'], //empty neighbouring minos
			'11': ['40', '00'], //lighter borders within filled minos
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
			'11': ['40', '00'], //lighter borders within filled minos
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

				let cellTypeAbove = currentBoard?.[row-1]?.[col]?.t ?? 0 // return cell type, defaulting to empty if out of board
                let have3dHighlight = (foureffectInput && cellTypeAbove == 0)

				if (cell.t === 2 || (cell.t === 1 && displayLineClear)) {
					if (have3dHighlight) draw3dHighlight(col, row, FourPalette.lighter[piece])
					drawMinoRect(col, row, FourPalette.light[piece])
				} else if (cell.t === 1) {
					if (have3dHighlight) draw3dHighlight(col, row, FourPalette.light[piece])
					drawMinoRect(col, row, FourPalette.normal[piece])
				}
			}
		}
		
		function drawMinoRect(x, y, color) {
			canvasContext.fillStyle = color
			canvasContext.fillRect(x * tileSize + 1, y * tileSize + 1, tileSize, tileSize) //copy fumen when grid is specified?
		}

		function draw3dHighlight(x, y, color) { //drawn above specified cell
			const highlightSize = tileSize / 5
			canvasContext.fillStyle = color
			canvasContext.fillRect(x * tileSize + 1, y * tileSize + 1 - highlightSize, tileSize, highlightSize)
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
				return 0
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