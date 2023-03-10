// const { decoder } = require('tetris-fumen');
var new_colors = { //different from board-render four colors
	normal: { T: '#b451ac', I: '#41afde', O: '#f7d33e', L: '#ef9535', J: '#1983bf', S: '#66c65c', Z: '#ef624d', X: '#bbbbbb' },
	light:  { T: '#e56add', I: '#43d3ff', O: '#fff952', L: '#ffbf60', J: '#1ba6f9', S: '#88ee86', Z: '#ff9484', X: '#cccccc' },
}

var colors = {
	T: { normal: '#b451ac', light: '#e56add' },
	I: { normal: '#41afde', light: '#43d3ff' },
	O: { normal: '#f7d33e', light: '#fff952' },
	L: { normal: '#ef9535', light: '#ffbf60' },
	J: { normal: '#1983bf', light: '#1ba6f9' },
	S: { normal: '#66c65c', light: '#88ee86' },
	Z: { normal: '#ef624d', light: '#ff9484' },
	X: { normal: '#bbbbbb', light: '#cccccc' },
};

function getFumenMaxHeight(...fumenPages) {
	if (!document.getElementById('autoheight').checked) return parseInt(document.getElementById('height').value)

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

function draw(fumenPage, numrows) {
	var tileSize = document.getElementById('cellSize').valueAsNumber;
	var gridColor = document.getElementById('gridColor').value
	let fillStyle = (document.getElementById('transparency').checked ? '#00000000': document.getElementById('bg').value)
	var combinedBoardStats = {
		board: pageToBoard(fumenPage), 
		tileSize: tileSize, 
		style: 'four', 
		grid: {
			fillStyle: fillStyle, //turn to BGColor
			strokeStyle: (document.getElementById('gridToggle').checked ? gridColor : '#00000000'), //turn to gridColor
		},
	}
	{
		var field = fumenPage.field;
		var tilesize = document.getElementById('cellSize').valueAsNumber;
		var numcols = document.getElementById('width').valueAsNumber;
		

		const width = numcols * tilesize;
		const height = numrows * tilesize;

		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext('2d');
		context.drawImage(renderBoardOnCanvas(combinedBoardStats), 0, -(20-numrows)*tileSize) //TODO: adjust for extra row for four rendering here, instead of altering the drawFumens() function
		return canvas
	}

	var field = fumenPage.field;
	var tilesize = document.getElementById('cellSize').valueAsNumber;
	var numcols = document.getElementById('width').valueAsNumber;
	

	const width = numcols * tilesize;
	const height = numrows * tilesize;

	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext('2d');
	
	var transparent = document.getElementById('transparency').checked
	context.fillStyle = (transparent ? 'rgba(0, 0, 0, 0)': document.getElementById('bg').value)
	context.fillRect(0, 0, width, height);

	if (gridToggle) {
		{
			let gridCvs = document.createElement('canvas')
			gridCvs.height = tileSize
			gridCvs.width = tileSize
			let gridCtx = gridCvs.getContext('2d')
			gridCtx.fillStyle = context.fillStyle
			gridCtx.fillRect(0, 0, tileSize, tileSize)
			gridCtx.strokeStyle = gridColor
			gridCtx.strokeRect(0, 0, tileSize + 1, tileSize + 1)
			var gridPattern = context.createPattern(gridCvs, 'repeat')
			context.clearRect(0, 0, boardSize[0] * tileSize, boardSize[1] * tileSize)
		}
		context.fillStyle = gridPattern
		context.fillRect(0, 0, boardSize[0] * tileSize, boardSize[1] * tileSize)

		//Border
		// context.strokeStyle = gridColor
		// context.strokeRect(0, 0, width, height);
		// for (i = 0; i < numcols; i++) {
		// 	for (j = 0; j < numrows; j++) {
		// 		// all dim grids
		// 		context.fillStyle = gridColor + '30'
		// 		// context.fillStyle = "#FF0000"
		// 		context.fillRect(i * tilesize, height - (j + 1) * tilesize, 1, tilesize)
		// 		context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize, 1)
		// 	}
		// }
	}

	function createCellStatus(numrows, numcols) {
		var cellRow = Array(numcols).fill(0)
		var cellStatus = []
		for (let i = 0; i < numrows; i++) {
			cellStatus.push(JSON.parse(JSON.stringify(cellRow)))
		}
		return cellStatus
	}

	var cellStatus = createCellStatus(numrows, numcols)
	// console.log(fumenPage.field.str())
	const operation = fumenPage.operation
	if (operation != undefined) {
		for (position of operation.positions()) {
			cellStatus[position.y][position.x] = 2 //glued
		}
	}
	for (let i = 0; i < numcols; i++) {
		for (let j = 0; j < numrows; j++) {
			if (field.at(i, j) != '_') {
				cellStatus[j][i] = 1 //normal
			}
		}
	}
	console.log(cellStatus)
	
	// glued minos
	// if (operation != undefined) {
	// 	for (position of operation.positions()) {
	// 		context.fillStyle = colors[operation.type].normal
	// 		context.fillRect(position.x * tilesize, height - (position.y + 1) * tilesize, tilesize, tilesize)
	// 	}
	// }
	
	for (let i = 0; i < numcols; i++) {
		for (let j = 0; j < numrows; j++) {
			if (field.at(i, j) != '_') {
				// all blocks
				context.fillStyle = colors[field.at(i, j)].normal
				context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize, tilesize)
				// dim grids when there are two neighbouring filled cells
				if(gridToggle){
					context.fillStyle = gridColor + '40'
					context.fillRect(i * tilesize, height - (j + 1) * tilesize, 1, tilesize)
					context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize, 1)
					context.fillRect((i + 1) * tilesize, height - (j + 1) * tilesize, 1, tilesize)
					context.fillRect(i * tilesize, height - j * tilesize, tilesize, 1)
				}
				if(field.at(i, j + 1) == '_') { //only draw highlight (and its borders) if the cell above is empty
					const highlightSize = tilesize / 5
					context.fillStyle = colors[field.at(i, j)].light
					context.fillRect(i * tilesize, height - (j + 1) * tilesize - highlightSize, tilesize, highlightSize)
					if(gridToggle) {
						// top highlight border
						context.fillStyle = gridColor + 'CC'
						context.fillRect(i * tilesize, height - (j + 1) * tilesize - highlightSize, tilesize, 1)
						// left highlight border, stronger if highlight is touching a filled cell to the left
						context.fillStyle = gridColor + (field.at(Math.max(0, i - 1), j + 1) == "_" ? 'CC' : 'FF')
						context.fillRect(i * tilesize, height - (j + 1) * tilesize - highlightSize, 1, highlightSize)
						// right highlight border, only if highlight isn't touching a filled cell to the right (the normal cell already draws the border)
						if(field.at(i + 1, j + 1) == "_") {
							context.fillStyle = gridColor + 'CC'
							context.fillRect((i + 1) * tilesize, height - (j + 1) * tilesize - highlightSize, 1, highlightSize)
						}
						// normal cell border acts as bottom highlight border 
					}
				}
				if(gridToggle){
					context.fillStyle = gridColor + 'FF'
					// left border
					if(field.at(Math.max(i - 1, 0), j) == "_") {
						context.fillRect(i * tilesize, height - (j + 1) * tilesize, 1, tilesize + 1)
					}
					// top border
					if(field.at(i, j + 1) == "_") {
						context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize + 1, 1)
					}
					// right border
					if(field.at(i + 1, j) == "_") {
						context.fillRect((i + 1) * tilesize, height - (j + 1) * tilesize, 1, tilesize + 1)
					}
					// bottom border
					if(field.at(i, j - 1) == "_") {
						context.fillRect(i * tilesize, height - j * tilesize, tilesize + 1, 1)
					}
				}
			}
		}
	}
	return canvas
}

function drawFumens(fumenPages, start, end) {
	if (end == undefined) {
		end = fumenPages.length;
	}

	var drawnFumenPages = fumenPages.slice(start, end)
	
	numrows = getFumenMaxHeight(...drawnFumenPages) + 1 //extra empty row on top for drawing highlight
	//ASK: currently this can produce 21-high images, which is over the 20-high editor. Do we want to be consistent with editor?

	var canvases = drawnFumenPages.map(fumenPage => draw(fumenPage, numrows))

	return canvases
}

function GenerateFourGIF(canvases) {
	const encoder = new GIFEncoder();
	encoder.start();
	encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
	encoder.setDelay(document.getElementById('delay').value); // frame delay in ms
	encoder.setQuality(1); // image quality. 10 is default.
	if (document.getElementById('transparency').checked) {
		encoder.setTransparent('rgba(0, 0, 0, 0)');
	}
	canvases.forEach(canvas => encoder.addFrame(canvas.getContext('2d')))
	encoder.finish();
	// encoder.download('download.gif');
	return encoder;
}

gridToggle = false;
// max_col = 10;

start = 0;
end = undefined;

function GIFDataURL(gif) {
	var binary_gif = gif.stream().getData(); //notice this is different from the as3gif package!
	return 'data:image/gif;base64,' + encode64(binary_gif);
}

//the transparent bg of the png anf gif are different
function fumencanvas(fumens) {
	var container = document.getElementById('imageOutputs');
	resultURLs = [];

	for (let fumen of fumens) {
		if (fumen.length == 1) {
			let canvas = drawFumens(fumen, 0, undefined)[0]
			var data_url = canvas.toDataURL("image/png")
		} else if (fumen.length >= 2) {
			let canvases = drawFumens(fumen, start, end);
			var data_url = GIFDataURL(GenerateFourGIF(canvases));
		}

		var img = document.createElement('img');
		img.classList.add('imageOutput', 'fourImageOutput');
		img.src = data_url;
		console.log("image width", img.width, img) //BUG: sometimes the FOUR output figures get all bunched up for no reason
		//seems like this is triggered by toggling transparent bg & grid

		var figure = document.createElement('figure');
		figure.appendChild(img);
		figure.style.width = img.width;
		
		if (document.getElementById('displayMode').checked) {
			var textBox = document.createElement('textarea')
			textBox.value = fumen[0]['comment']; // only displays comment of first page, unless I find some way to loop text
			textBox.style.width = img.width;
			textBox.classList.add('commentDisplay');
			
			var commentBox = document.createElement('figcaption');
			commentBox.appendChild(textBox);
			
			figure.appendChild(commentBox);
		};

		container.appendChild(figure);
		resultURLs.push(data_url);
	}

	return resultURLs
}