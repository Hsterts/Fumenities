// const { decoder } = require('tetris-fumen');

const fumen_colors = {
    I: { normal: '#009999', light: '#00FFFF' },
    T: { normal: '#990099', light: '#FF00FF' },
    S: { normal: '#009900', light: '#00FF00' },
    Z: { normal: '#990000', light: '#FF0000' },
    L: { normal: '#996600', light: '#FF9900' },
    J: { normal: '#0000BB', light: '#0000FF' },
    O: { normal: '#999900', light: '#FFFF00' },
    X: { normal: '#999999', light: '#CCCCCC' },
    Empty: { normal: '#f3f3ed' }
};

function fumen_draw(fumenPage, numrows) { //the numrows here helps reduce computation, since you are guarenteed to have defined numrows calling from fumen_drawFumens
	var tilesize = document.getElementById('cellSize').valueAsNumber;
	
	var numcols = document.getElementById('width').value;
	if (numrows == undefined) {
		numrows = getFumenMaxHeight(fumenPage)
	}
	const width = numcols * tilesize;
	const height = numrows * tilesize;

	var canvas = document.createElement('canvas');
	canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    {
		let gridCvs = document.createElement('canvas');
		gridCvs.width = tilesize;
		gridCvs.height = tilesize;
		let gridCtx = gridCvs.getContext('2d');
		
		gridCtx.fillStyle = (document.getElementById('transparency').checked ? 'rgba(0, 0, 0, 0)': document.getElementById('bg').value)
		gridCtx.fillRect(0, 0, tilesize, tilesize);
		gridCtx.strokeStyle = '#888888';
		gridCtx.strokeRect(0, 0, tilesize, tilesize);
		var pattern = context.createPattern(gridCvs, 'repeat');
	}

	// context.fillStyle = '#000000';
	// context.fillRect(0, 0, width, height);
	context.clearRect(0, 0, width, height);
	context.fillStyle = pattern;
	context.fillRect(0, 0, width, height);
	
	const field = fumenPage.field;
	for (i = 0; i < numcols; i++) {
		for (j = 0; j < numrows; j++) {
			if (field.at(i, j) != '_') {
				drawCell(i, j, fumen_colors[field.at(i, j)].light)
			}
		}
	}

	const operation = fumenPage.operation;
	if (operation != undefined) {
		for (position of operation.positions()) {
			drawCell(position.x, position.y, fumen_colors[operation.type].light)
		}
	}

	return canvas;

	function drawCell(col, row, color) {
		context.fillStyle = color
		context.fillRect(col * tilesize + 1, height - (row + 1) * tilesize + 1, tilesize - 1, tilesize - 1);
	}
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
		var minoHeight = (fumenPage.operation != undefined ? highestOperationHeight(fumenPage.operation) : 0)
		var fieldHeight = fumenPage.field.str().replace(/\s/g, '').length / 10 - 1 //ignore garbage row
		return Math.max(minoHeight, fieldHeight)
	}
}

function GenerateFumenGIF(frames) {
	const encoder = new GIFEncoder();
	encoder.start();
	encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
	encoder.setDelay(500); // frame delay in ms, fixed to 500ms for fumen
	encoder.setQuality(1); // image quality. 10 is default.
	if (document.getElementById('transparency').checked) {
		encoder.setTransparent('rgba(0, 0, 0, 0)');
	}
	frames.forEach(frame => encoder.addFrame(frame))
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

	var frames = drawnFumenPages.map(fumenPage => fumen_draw(fumenPage, numrows).getContext('2d'))

	return GenerateFumenGIF(frames)
}

cellSize = 22;
start = 0; //start and end are unmodified, TODO: make settings that control these
end = undefined;

function GIFDataURL(gif) {
	var binary_gif = gif.stream().getData(); //notice this is different from the as3gif package!
	return 'data:image/gif;base64,' + encode64(binary_gif);
}

function fumenrender(input) {
	var container = document.getElementById('imageOutputs');
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
	
	var fumenCodes = input.split(/\s+/);
	resultURLs = [];

    for (let code of fumenCodes) {
        try {
            var pages = decoder.decode(code);

            if (pages.length == 1) {
                canvas = fumen_draw(pages[0], undefined);
				var data_url = canvas.toDataURL("image/png")
            } else if (pages.length >= 2) {
				gif = fumen_drawFumens(pages, start, end);
				var data_url = GIFDataURL(gif)
            }

			var img = new Image()
			img.style.padding = '0px';
			img.style.margin = '1px';
			img.style.outline = '2px solid #585b5b';
			img.src = data_url;

			container.appendChild(img);
			resultURLs.push(data_url);
        } catch (error) { console.log(code, error); }
	}
		
	var downloadBool = document.getElementById('downloadOutput').checked;
	if (downloadBool) downloadByURL(resultURLs)

	function downloadByURL(DataURLs) {
		var zip = new JSZip();
		for (let x = 0; x < DataURLs.length; x++) {
			let filetype = RegExp('image/(.+);').exec(DataURLs[x])[1]
			JSZipUtils.getBinaryContent(DataURLs[x], function (err, data){
				if(err) {
					console.log(err)
					return
				} 
				
				var fileNaming = document.getElementById('naming').value
				if(fileNaming == "index"){
					var filename = (x+1)+filetype
				} else if (fileNaming == "fumen") {
					var filename = fumenCodes[x]+filetype;
				}
				
				zip.file(filename, data, {base64:true});
			});
		};

		zip.generateAsync({type:'blob'}).then(function(base64){
			saveAs(base64, "output.zip");
			console.log("downloaded");
		});
	}
}