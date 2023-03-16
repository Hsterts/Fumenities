import { pageToBoard, renderBoardOnCanvas, getFumenMaxHeight } from "./board-render.js"
import { GIFEncoder as gifenc, quantize, applyPalette } from 'https://unpkg.com/gifenc@1.0.3/dist/gifenc.esm.js';

function fumen_draw(fumenPage, numrows) {
	var tileSize = Math.max(document.getElementById('cellSize').valueAsNumber)
	let fillStyle = (document.getElementById('transparency').checked ? '#00000000': document.getElementById('bg').value)
	
	let strokeStyle = '#888888' // fixed fumen grid color

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
	
	var numcols = document.getElementById('width').valueAsNumber;
	const width = numcols * tileSize;
	const height = Math.min(20, numrows) * tileSize;

	var canvas = document.createElement('canvas');
	canvas.width = width;
    canvas.height = height;

    const canvasContext = canvas.getContext('2d');
	canvasContext.imageSmoothingEnabled = false // no anti-aliasing
	canvasContext.drawImage(renderBoardOnCanvas(combinedBoardStats), 0, -20*tileSize + height)

	//add surrounding border
	canvasContext.strokeStyle = strokeStyle
	canvasContext.strokeRect(0.5, 0.5, canvas.width-1, canvas.height-1)

	return canvas
}

function GenerateGIF(canvases) {
	let transparent = document.getElementById('transparency').checked
	let delay = 500 // fixed 500ms delay for fumen
	const gif = new gifenc();
	canvases.forEach(canvas => {
		const { data, width, height } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
		const palette = quantize(data, 256, {format: 'rgba4444'});
		const index = applyPalette(data, palette, {format: 'rgba4444'});
		gif.writeFrame(index, width, height, { palette, transparent, delay }); //assumes that the first element in palette is [0,0,0,0].
	})
	gif.finish();
	return gif;
}

function GIFDataURL(gif) {
	let bytes = gif.stream.bytes()
	return 'data:image/gif;base64,' + base64js.fromByteArray(bytes);
}

function fumen_drawFumens(fumenPages, start, end) {
	if (end == undefined) {
		end = fumenPages.length;
	}

	var drawnFumenPages = fumenPages.slice(start, end)

	var numrows = getFumenMaxHeight(...drawnFumenPages)

	var canvases = drawnFumenPages.map(fumenPage => fumen_draw(fumenPage, numrows))

	return canvases
}

var start = 0; //start and end are unmodified, TODO: make settings that control these
var end = undefined;

export default function fumenrender(fumens) {
	var container = document.getElementById('imageOutputs');
	var resultURLs = [];

	for (let fumen of fumens) {
		if (fumen.length == 1) {
			let canvas = fumen_drawFumens(fumen, 0, undefined)[0];
			var data_url = canvas.toDataURL("image/png")
		} else if (fumen.length >= 2) {
			let canvases = fumen_drawFumens(fumen, start, end);
			var data_url = GIFDataURL(GenerateGIF(canvases))
		}

		var img = new Image()
		img.classList.add('imageOutput', 'fumenImageOutput')
		img.src = data_url;

		//fumen rendering doesn't show comments

		container.appendChild(img);
		resultURLs.push(data_url);
	}

	return resultURLs
}