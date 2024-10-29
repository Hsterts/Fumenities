import { boardSize } from "../global-utils.js";
import { pageToBoard, renderBoardOnCanvas, getFumenMaxHeight, GenerateGIF } from "./board-render.js"

function fumen_draw(fumenPage, numrows) {
	var tileSize = Math.max(1, document.getElementById('cellSize').valueAsNumber || 0)
	let fillStyle = (document.getElementById('transparency').checked ? '#00000000' : document.getElementById('bg').value)

	let strokeStyle = '#333333FF' // fixed fumen grid color

	var combinedBoardStats = {
		board: pageToBoard(fumenPage),
		tileSize: tileSize,
		style: 'fumen',
		lockFlag: document.getElementById('highlightLineClear').checked && (fumenPage.flags.lock ?? false),
		grid: {
			fillStyle: fillStyle,
			strokeStyle: strokeStyle,
		},
	}

	var canvas = document.createElement('canvas');
	canvas.width = Math.min(boardSize[0], document.getElementById('width').valueAsNumber) * tileSize
	canvas.height = Math.min(boardSize[1], numrows) * tileSize;

	const canvasContext = canvas.getContext('2d');
	canvasContext.imageSmoothingEnabled = false // no anti-aliasing
	canvasContext.drawImage(renderBoardOnCanvas(combinedBoardStats), 0, -20 * tileSize + canvas.height)

	//add surrounding border
	canvasContext.strokeStyle = strokeStyle
	canvasContext.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1)

	return canvas
}

function GIFDataURL(gif) {
	let bytes = gif.stream.bytes()
	return 'data:image/gif;base64,' + base64js.fromByteArray(bytes);
}

function fumen_drawFumens(fumenPages) {
	let start = document.getElementById('startRenderPage').valueAsNumber - 1 || 0
	start = Math.min(fumenPages.length, Math.max(0, start))
	let end = document.getElementById('endRenderPage').valueAsNumber - 1 || 0
	end = Math.min(fumenPages.length, Math.max(0, end))

	var drawnFumenPages = fumenPages.slice(start, end + 1) //slice excludes right bound

	var numrows = getFumenMaxHeight(...drawnFumenPages)

	var canvases = drawnFumenPages.map(fumenPage => fumen_draw(fumenPage, numrows))

	return canvases
}

export default function fumenrender(fumens) {
	var figures = []
	var resultURLs = []

	for (let fumen of fumens) {
		if (fumen.length == 1) {
			let canvas = fumen_drawFumens(fumen)[0];
			var data_url = canvas.toDataURL("image/png")
		} else if (fumen.length >= 2) {
			let canvases = fumen_drawFumens(fumen);
			var data_url = GIFDataURL(GenerateGIF(canvases))
		}

		var img = new Image()
		img.classList.add('imageOutput', 'fumenImageOutput')
		img.src = data_url;

		var figure = document.createElement('figure');
		figure.appendChild(img);

		//fumen rendering doesn't show comments

		figures.push(figure);
		resultURLs.push(data_url);
	}

	return { figures, resultURLs }
}