import { boardSize } from "../global-utils.js";
import { pageToBoard, renderBoardOnCanvas, getFumenMaxHeight } from "./board-render.js"
import { GIFEncoder as gifenc, quantize, applyPalette } from 'https://unpkg.com/gifenc@1.0.3/dist/gifenc.esm.js';

function draw(fumenPage, numrows) {
	var tileSize = Math.max(1, document.getElementById('cellSize').valueAsNumber || 0)
	let fillStyle = (document.getElementById('transparency').checked ? '#00000000': document.getElementById('bg').value)
	
	let gridColor = document.getElementById('gridColor').value
	let strokeStyle = (document.getElementById('gridToggle').checked ? gridColor : '#00000000')

	var combinedBoardStats = {
		board: pageToBoard(fumenPage), 
		tileSize: tileSize, 
		style: 'four', 
		lockFlag: document.getElementById('highlightLineClear').checked && (fumenPage.flags.lock ?? false),
		grid: {
			fillStyle: fillStyle, //turn to BGColor
			strokeStyle: strokeStyle, //turn to gridColor
		},
	}

	var canvas = document.createElement('canvas');
	canvas.width = Math.min(boardSize[0], document.getElementById('width').valueAsNumber) * tileSize
	canvas.height = Math.min(boardSize[1], numrows) * tileSize;

	const canvasContext = canvas.getContext('2d');
	canvasContext.imageSmoothingEnabled = false // no anti-aliasing
	canvasContext.drawImage(renderBoardOnCanvas(combinedBoardStats), 0, -20*tileSize + canvas.height)
	
	//add surrounding border
	canvasContext.strokeStyle = strokeStyle
	canvasContext.strokeRect(0.5, 0.5, canvas.width-1, canvas.height-1)
	
	return canvas
}

function drawFumens(fumenPages) {
	let start = document.getElementById('startPage').valueAsNumber-1 || 0
	start = Math.min(fumenPages.length, Math.max(0, start))
	let end = document.getElementById('endPage').valueAsNumber-1 || 0
	end = Math.min(fumenPages.length, Math.max(0, end))

	var drawnFumenPages = fumenPages.slice(start, end+1) //slice excludes right bound
	
	var numrows = getFumenMaxHeight(...drawnFumenPages) + 1 //extra empty row on top for drawing highlight

	var canvases = drawnFumenPages.map(fumenPage => draw(fumenPage, numrows))

	return canvases
}

function GenerateFourGIF(canvases) {
	let transparent = document.getElementById('transparency').checked
	let delay = parseFloat(document.getElementById('delay').value)
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

export default function fumencanvas(fumens) {
	var container = document.getElementById('imageOutputs');
	var resultURLs = [];

	for (let fumen of fumens) {
		if (fumen.length == 1) {
			let canvas = drawFumens(fumen)[0]
			var data_url = canvas.toDataURL("image/png")
		} else if (fumen.length >= 2) {
			let canvases = drawFumens(fumen);
			var data_url = GIFDataURL(GenerateFourGIF(canvases));
		}
		
		var img = new Image();
		img.classList.add('imageOutput', 'fourImageOutput');
		img.src = data_url;
		
		var figure = document.createElement('figure');
		figure.appendChild(img);
		
		if (document.getElementById('displayMode').checked) {
			var textBox = document.createElement('textarea')
			textBox.value = fumen[0]['comment']; // only displays comment of first page, unless I find some way to loop text
			textBox.classList.add('commentDisplay');
			textBox.setAttribute('readonly', '')
			
			var commentBox = document.createElement('figcaption');
			commentBox.style = "width:100%"
			commentBox.appendChild(textBox);
			
			figure.appendChild(commentBox);
		};
		
		container.appendChild(figure);
		resultURLs.push(data_url);
	}

	return resultURLs
}

