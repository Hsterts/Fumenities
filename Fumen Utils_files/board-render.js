//sharing the same rendering process for both the editor board and the output images

function renderBoardOnCanvas(combinedBoardStats) {
	var tileSize = combinedBoardStats.tileSize
	var canvas = document.createElement('canvas')
	canvas.width = boardSize[0] * tileSize
	canvas.height = boardSize[1] * tileSize
	var canvasContext = canvas.getContext('2d')
	
	{
		let gridCvs = document.createElement('canvas')
		gridCvs.height = tileSize
		gridCvs.width = tileSize
		let gridCtx = gridCvs.getContext('2d')
		gridCtx.fillStyle = combinedBoardStats.grid.fillStyle
		gridCtx.fillRect(0, 0, tileSize, tileSize)
		gridCtx.strokeStyle = combinedBoardStats.grid.strokeStyle
		gridCtx.strokeRect(0, 0, tileSize + 1, tileSize + 1)
		var gridPattern = canvasContext.createPattern(gridCvs, 'repeat')
		canvasContext.clearRect(0, 0, boardSize[0] * tileSize, boardSize[1] * tileSize)
	}

	var currentBoard = combinedBoardStats.board
	
	canvasContext.fillStyle = gridPattern
	canvasContext.fillRect(0, 0, boardSize[0] * tileSize, boardSize[1] * tileSize)

	let lockFlag = document.getElementById('highlightLineClear').checked
	let isFilled = (cell) => cell.t != 0

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
			let displayLineClear = lockFlag && currentBoard[row].every(isFilled)
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
		
		for (let row in currentBoard) {
			let displayLineClear = lockFlag && currentBoard[row].every(isFilled)
			for (let col in currentBoard[row]) {
				let cell = currentBoard[row][col]
				let piece = cell.c
				{
					let foureffectInput = document.getElementById('3dSetting').checked
					let cellAbove = (row == 0) || (currentBoard[row-1][col].t != 0) //no need to check for top row (since you wont see the highlight anyways), used to prevent error
					//TODO: use .? chaining to remove (row == 0) condition?
                    var have3dHighlight = (foureffectInput && !cellAbove)
				}
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

		function draw3dHighlight(x, y, color) {
			const highlightSize = tileSize / 5
			canvasContext.fillStyle = color
			canvasContext.fillRect(x * tileSize + 1, y * tileSize + 1 - highlightSize, tileSize, highlightSize)
		}
	}
}