import { pageToBoard, renderBoardOnCanvas } from "./board-render.js"
import encode64 from "./b64.js"
// import { GIFEncoder, quantize, applyPalette } from 'https://unpkg.com/gifenc@1.0.3';

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
	
	var tilesize = document.getElementById('cellSize').valueAsNumber;
	var numcols = document.getElementById('width').valueAsNumber;

	const width = numcols * tilesize;
	const height = Math.min(20, numrows) * tilesize;

	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext('2d');
	context.drawImage(renderBoardOnCanvas(combinedBoardStats), 0, -20*tileSize + height)

	//add surrounding border
	context.strokeStyle = strokeStyle
	context.strokeRect(0.5, 0.5, canvas.width-1, canvas.height-1)
	return canvas
}

function drawFumens(fumenPages, start, end) {
	if (end == undefined) {
		end = fumenPages.length;
	}

	var drawnFumenPages = fumenPages.slice(start, end)
	
	var numrows = getFumenMaxHeight(...drawnFumenPages) + 1 //extra empty row on top for drawing highlight

	var canvases = drawnFumenPages.map(fumenPage => draw(fumenPage, numrows))

	return canvases
}

function GenerateFourGIF(canvases) { //very slow
	var startTime = performance.now()
	const encoder = new GIFEncoder();
	encoder.start();
	encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
	encoder.setDelay(document.getElementById('delay').value); // frame delay in ms
	encoder.setQuality(1); // image quality. 10 is default.
	if (document.getElementById('transparency').checked) {
		encoder.setTransparent('rgba(0, 0, 0, 0)');
	}
	canvases.forEach(canvas => encoder.addFrame(canvas.getContext('2d')))
	canvases.forEach(canvas => console.log(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)))
	encoder.finish();
	// encoder.download('download.gif');
	console.log(performance.now() - startTime)
	return encoder;
}

// function GenerateFourGIFAlt(canvases) {
// 	var startTime = performance.now()
// 	const gif = new GIFEncoder();
// 	canvases.forEach(canvas => {
// 		const { data, width, height } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
// 		const palette = quantize(data, 256);
// 		const index = applyPalette(data, palette);
// 		gif.writeFrame(index, width, height, { palette });
// 	})
// 	gif.finish();
// 	console.log(performance.now() - startTime)
// 	return gif;
// }

// gridToggle = false;
// max_col = 10;

var start = 0;
var end = undefined;

function GIFDataURL(gif) {
	var binary_gif = gif.stream().getData(); //notice this is different from the as3gif package!
	return 'data:image/gif;base64,' + encode64(binary_gif);
}

//the transparent bg of the png anf gif are different
export default function fumencanvas(fumens) {
	var container = document.getElementById('imageOutputs');
	var resultURLs = [];

	for (let fumen of fumens) {
		if (fumen.length == 1) {
			let canvas = drawFumens(fumen, 0, undefined)[0]
			var data_url = canvas.toDataURL("image/png")
		} else if (fumen.length >= 2) {
			let canvases = drawFumens(fumen, start, end);
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
