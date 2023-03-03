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

function fumen_draw(fumenPage, tilesize, numrows, transparent) { //the numrows here helps reduce computation, since you are guarenteed to have defined numrows calling from fumen_drawFumens
	const field = fumenPage.field;
	const operation = fumenPage.operation;
//	var tilesize = parseFloat(document.getElementById('cellSize').value);
	var tilesize = document.getElementById('cellSize').valueAsNumber; //maybe ParseInt?
	var numcols = document.getElementById('width').value;
	
	function operationFilter(e) {
		return i == e.x && j == e.y;
	}

	if (numrows == undefined) {
		numrows = getFumenMaxHeight(fumenPage)
	}
	const width = tilesize * numcols;
	const height = numrows * tilesize;

	var canvas = document.createElement('canvas');
	canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    {
		var gridCvs = document.createElement('canvas');
		gridCvs.width = tilesize;
		gridCvs.height = tilesize;
		var gridCtx = gridCvs.getContext('2d');

		context.fillStyle = '#000000';

		gridCtx.fillStyle = '#000000';
		if (transparent) gridCtx.fillStyle = 'rgba(0, 0, 0, 0)';
		gridCtx.fillRect(0, 0, tilesize, tilesize);
		gridCtx.strokeStyle = '#888888';
		gridCtx.strokeRect(0, 0, tilesize, tilesize);
		var pattern = context.createPattern(gridCvs, 'repeat');
		// context.fillRect(0, 0, width, height);

		context.clearRect(0, 0, width, height);
		context.fillStyle = pattern;
		context.fillRect(0, 0, width, height);
	}

	for (i = 0; i < 10; i++) {
		for (j = 0; j < numrows; j++) {
			if (field.at(i, j) != '_') {
				context.fillStyle = fumen_colors[field.at(i, j)].light;
				context.fillRect(i * tilesize + 1, height - (j + 1) * tilesize + 1, tilesize - 1, tilesize - 1);
			}
			if (operation != undefined && operation.positions().filter(operationFilter).length > 0) {
				context.fillStyle = fumen_colors[operation.type].light;
				context.fillRect(i * tilesize + 1, height - (j + 1) * tilesize + 1, tilesize - 1, tilesize - 1);
			}
		}
	}/*
	for (i = 0; i < 10; i++) {
		for (j = 0; j < numrows; j++) {
			if (field.at(i, j) != '_') {
				context.fillStyle = colors[field.at(i, j)].normal;
				context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize, tilesize);
			}
			if (operation != undefined && operation.positions().filter(operationFilter).length > 0) {
				context.fillStyle = colors[operation.type].normal;
				context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize, tilesize);
			}
		}
	}*/
	return canvas;
}

function getFumenMaxHeight(...fumenPages) {
	if (!document.getElementById('autoheight').checked) return parseInt(document.getElementById('height').value)

	var numrows = fumenPages.reduce((highestRow, fumenPage) => Math.max(highestRow, highestPageHeight(fumenPage)), 0)
	return Math.max(1, Math.min(23, numrows + 1)) //convert to one-indexed

	function highestOperationHeight(operation) {
		return operation.positions().reduce((highestRow, position) => Math.max(highestRow, position.y), 0)
	}
	
	function highestPageHeight(fumenPage) {
		var highestMino = (fumenPage.operation != undefined ? highestOperationHeight(fumenPage.operation) : 0)

		let fieldString = fumenPage.field.str()
		fieldString = fieldString.slice(0, -10) //ignore garbage line
		let longestEmptyFieldString = fieldString.match(RegExp('^_+'))
		if (longestEmptyFieldString == null) {
			var highestField = 0
		} else {
			let highestFilledIndex = fieldString.length - longestEmptyFieldString[0].length
			var highestField = Math.floor(highestFilledIndex / 10) - 1 // zero-indexed
		}
		
		return Math.max(highestMino, highestField)
	}
}

function GenerateGIF(frames, transparent) {
	const encoder = new GIFEncoder();
	encoder.start();
	encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
	encoder.setDelay(document.getElementById('delay').value); // frame delay in ms
	encoder.setQuality(1); // image quality. 10 is default.
	if (transparent) {
		encoder.setTransparent('rgba(0, 0, 0, 0)');
	}
	for (frame of frames) {
		console.log(frame)
		encoder.addFrame(frame);
	}
	encoder.finish();
	// encoder.download('download.gif');
	return encoder;
}

function fumen_drawFumens(fumenPages, tilesize, start, end, transparent) {
	var numcols = document.getElementById('width').value;
	if (end == undefined) {
		end = fumenPages.length;
	}
	var numrows = getFumenMaxHeight(...fumenPages.slice(start, end))
	var canvas = document.createElement('canvas');
	canvas.width = numcols * tilesize;
	canvas.height = numrows * tilesize;

	var frames = fumenPages.slice(start, end).map(fumenPage => {
		return fumen_draw(fumenPage, tilesize, numrows, transparent).getContext('2d')
	})

	return GenerateGIF(frames, transparent)
}

cellSize = 22;
delay = 500;
start = 0;
end = undefined;

function fumenrender(input) {
	resultURLs = [];
	var container = document.getElementById('imageOutputs');
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

	var fumenCodes = [];
	results = [];
	for (let rawInput of input.split('\t')) {
		fumenCodes.push(...rawInput.split(/\s/));
	}

	var transparency_fumen = document.getElementById('transparency').checked;

    for (let code of fumenCodes) {
        try {
			//display and produce a png/gif file, the to functions are somewhat seperable
            var pages = decoder.decode(code);
            if (pages.length == 1) {
                canvas = fumen_draw(pages[0], cellSize, height, transparency_fumen);

                documentCanvas = document.createElement('canvas');
                documentCanvas.style.padding = '0px';
				
                var ctx = documentCanvas.getContext('2d');
                documentCanvas.height = canvas.height;
                documentCanvas.width = canvas.width;
				
                ctx.drawImage(canvas, 0, 0);
				
                documentCanvas.style.margin = '1px';
				documentCanvas.style.outline  = '2px solid #585b5b';

                container.appendChild(documentCanvas);
                results.push(canvas);
				resultURLs.push(canvas.toDataURL("image/png"));
            } else if (pages.length > 1) {
				//for some reason, it doesn't render the last page. (fumen style specific)
                gif = fumen_drawFumens(pages, cellSize, start, end, transparency_fumen);

                var binary_gif = gif.stream().getData(); //notice this is different from the as3gif package!
                var data_url = 'data:image/gif;base64,' + encode64(binary_gif);
                var img = document.createElement('img');
                img.style.padding = '0px';
                img.src = data_url;

                img.style.margin = '1px';
                img.style.outline = '2px solid #585b5b';

                container.appendChild(img);
                results.push(gif);
				resultURLs.push(data_url);
            }
        } catch (error) { console.log(code, error); }
	}
		
	var downloadBool = document.getElementById('downloadOutput').checked;
	var naming = document.getElementById('naming').value;
	if (downloadBool) {
		var zip = new JSZip();
		for (let x = 0; x < resultURLs.length; x++){
			let filetype = RegExp('image/(.+);').exec(resultURLs[x])[1]
			JSZipUtils.getBinaryContent(resultURLs[x], function (err, data){
				if(err) {
					console.log(err);
				} else {
					if (naming == "index") {
						var filename = (x+1)+filetype
					} else if (naming == "fumen") {
						var filename = fumenCodes[x]+filetype;
					}
					zip.file(filename, data, {base64:true});
					if (x == resultURLs.length-1) {
						zip.generateAsync({type:'blob'}).then(function(base64){
							saveAs(base64, "output.zip");
							console.log("downloaded");
						});
					}
				};
			});
		};
	};
}
