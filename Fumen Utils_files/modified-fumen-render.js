// const { decoder } = require('tetris-fumen');

function fumen_draw(fumenPage, numrows) {
	var tileSize = document.getElementById('cellSize').valueAsNumber;

	var numcols = document.getElementById('width').value;
	const width = numcols * tileSize;
	const height = numrows * tileSize;
	
	var canvas = document.createElement('canvas');
	canvas.width = width;
    canvas.height = height;
    const canvasContext = canvas.getContext('2d');
	canvasContext.clearRect(0, 0, width, height);	

	var combinedBoardStats = {
		board: pageToBoard(fumenPage), 
		tileSize: tileSize, 
		style: 'fumen', 
		grid: {
			fillStyle: (document.getElementById('transparency').checked ? '#00000000': document.getElementById('bg').value), 
			strokeStyle: '#888888'
		},
	}

	//add glued minos to board
	const operation = fumenPage.operation;
	if (operation != undefined) {
		var type = operation.type
		for (position of operation.positions()) {
			combinedBoardStats.board[19-position.y][position.x] = { t: 2, c: type } //operation is bottom-up
		}
	}
	canvasContext.drawImage(renderBoardOnCanvas(combinedBoardStats), 0, -(20-numrows)*tileSize)

	return canvas
}

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

function GenerateFumenGIF(canvases) {
	const encoder = new GIFEncoder();
	encoder.start();
	encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
	encoder.setDelay(500); // frame delay in ms, fixed to 500ms for fumen
	encoder.setQuality(1); // image quality. 10 is default.
	if (document.getElementById('transparency').checked) {
		encoder.setTransparent('rgba(0, 0, 0, 0)');
	}
	canvases.forEach(canvas => encoder.addFrame(canvas.getContext('2d')))
	encoder.finish();
	// encoder.download('download.gif');
	return encoder;
}

function fumen_drawFumens(fumenPages, start, end) {
	//for some reason, last page of a glued fumen isn't rendered. (fumen style specific)
	if (end == undefined) {
		end = fumenPages.length;
	}

	var drawnFumenPages = fumenPages.slice(start, end)

	var numrows = getFumenMaxHeight(...drawnFumenPages)

	var canvases = drawnFumenPages.map(fumenPage => fumen_draw(fumenPage, numrows))

	return canvases
}

cellSize = 22;
start = 0; //start and end are unmodified, TODO: make settings that control these
end = undefined;

function GIFDataURL(gif) {
	var binary_gif = gif.stream().getData(); //notice this is different from the as3gif package!
	return 'data:image/gif;base64,' + encode64(binary_gif);
}

function fumenrender(fumens) {
	var container = document.getElementById('imageOutputs');
	resultURLs = [];

	for (let fumen of fumens) {
		if (fumen.length == 1) {
			let canvas = fumen_drawFumens(fumen, 0, undefined)[0];
			var data_url = canvas.toDataURL("image/png")
		} else if (fumen.length >= 2) {
			let canvases = fumen_drawFumens(fumen, start, end);
			var data_url = GIFDataURL(GenerateFumenGIF(canvases))
		}

		var img = new Image()
		img.classList.add('imageOutput', 'fumenImageOutput')
		img.src = data_url;

		//fumen rendering doesn't show comments

		container.appendChild(img);
		resultURLs.push(data_url);
	}
}