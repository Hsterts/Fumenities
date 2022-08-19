// const { decoder } = require('tetris-fumen');

var colors = {
	I: { normal: '#41afde', highlight1: '#3dc0fb', highlight2: '#3dc0fb', lighter: '#3dc0fb', light: '#43d3ff' },
	T: { normal: '#b451ac', highlight1: '#d161c9', highlight2: '#d161c9', lighter: '#d161c9', light: '#e56add' },
	S: { normal: '#66c65c', highlight1: '#75d96a', highlight2: '#7cd97a', lighter: '#7cd97a', light: '#88ee86' },
	Z: { normal: '#ef624d', highlight1: '#ff7866', highlight2: '#ff8778', lighter: '#fd7660', light: '#ff9484' },
	L: { normal: '#ef9535', highlight1: '#ffa94d', highlight2: '#ffae58', lighter: '#fea440', light: '#ffbf60' },
	J: { normal: '#1983bf', highlight1: '#1997e3', highlight2: '#1997e3', lighter: '#1997e3', light: '#1ba6f9' },
	O: { normal: '#f7d33e', highlight1: '#ffe34b', highlight2: '#ffe34b', lighter: '#ffe34b', light: '#fff952' },
	X: { normal: '#bbbbbb', highlight1: '#686868', highlight2: '#686868', lighter: '#bbbbbb', light: '#cccccc' },
	Empty: { normal: '#f3f3ed' },
};

function draw(fumenPage, tilesize, numrows, transparent) {
	const field = fumenPage.field;
	const operation = fumenPage.operation;
//	var tilesize = parseFloat(document.getElementById('cellSize').value);
	var tilesize = document.getElementById('cellSize').valueAsNumber;
	const numcols = document.getElementById('width').value;

	function operationFilter(e) {
		return i == e.x && j == e.y;
	}

	if (numrows == undefined) {
		numrows = 0;
		for (i = 0; i < numcols; i++) {
			for (j = 0; j < 23; j++) {
				if (field.at(i, j) != '_') {
					numrows = Math.max(numrows, j);
				}
				if (operation != undefined && operation.positions().filter(operationFilter).length > 0) {
					numrows = Math.max(numrows, j);
				}
			}
		}
		numrows += 2;
	}
	const width = tilesize * numcols;
	const height = numrows * tilesize;

	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext('2d');

	if (!transparent) {
		context.fillStyle = document.getElementById('bg').value;
	} else {
		context.fillStyle = 'rgba(0, 0, 0, 0)';
	}
	context.fillRect(0, 0, width, height);

	for (i = 0; i < numcols; i++) {
		for (j = 0; j < numrows; j++) {
			if (field.at(i, j) != '_') {
				context.fillStyle = colors[field.at(i, j)].light;
				context.fillRect(
					i * tilesize,
					height - (j + 1) * tilesize - tilesize / 5,
					tilesize,
					tilesize + tilesize / 5
				);
			}
			if (operation != undefined && operation.positions().filter(operationFilter).length > 0) {
				context.fillStyle = colors[operation.type].light;
				context.fillRect(
					i * tilesize,
					height - (j + 1) * tilesize - tilesize / 5,
					tilesize,
					tilesize + tilesize / 5
				);
			}
		}
	}
	for (i = 0; i < numcols; i++) {
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
	}
	return canvas;
}

function drawFumens(fumenPages, tilesize, numrows, start, end, transparent) {
	var numcols = document.getElementById('width').value;
	var delay = document.getElementById('delay').value;
	if (end == undefined) {
		end = fumenPages.length;
	}
	if (numrows == undefined) {
		numrows = 0;
		function operationFilter(e) {
			return i == e.x && j == e.y;
		}
		for (x = start; x < end; x++) {
			field = fumenPages[x].field;
			operation = fumenPages[x].operation;
			for (i = 0; i < numcols; i++) {
				for (j = 0; j < 23; j++) {
					if (field.at(i, j) != '_') {
						numrows = Math.max(numrows, j);
					}
					if (operation != undefined && operation.positions().filter(operationFilter).length > 0) {
						numrows = Math.max(numrows, j);
					}
				}
			}
		}
		numrows += 2;
	}
	numrows = Math.min(23, numrows);
	const width = tilesize * numcols;
	const height = numrows * tilesize;
	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	const encoder = new GIFEncoder();
	encoder.start();
	encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
	encoder.setDelay(delay); // frame delay in ms
	encoder.setQuality(1); // image quality. 10 is default.
	if (transparent) {
		encoder.setTransparent('rgba(0, 0, 0, 0)');
	}
	for (x = start; x < end; x++) {
		frame = draw(fumenPages[x], tilesize, numrows, transparent).getContext('2d');
		encoder.addFrame(frame);
	}
	encoder.finish();
	// encoder.download('download.gif');
	return encoder;
}

cellSize = 22;
height = undefined;
transparency_four = true;
delay = 500;
max_col = 10;

start = 0;
end = undefined;

function fumencanvas(input) {
	var container = document.getElementById('imageOutputs');
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

//	var cellSize = document.getElementById('cellSize').value;
	var transparency_four = document.getElementById('transparency').checked;
	if(document.getElementById('autoheight').checked){
		var height = undefined
		}else{
		var height = 1+parseFloat(document.getElementById('height').value)
	};

	var fumenCodes = [];
	var fumenComments = [];
	results = [];
	resultURLs = [];

	for (let rawInput of input.split('\t')) {
		fumenCodes.push(...rawInput.split(/\s/));
	}

    for (let code of fumenCodes) {
        try {
            var pages = decoder.decode(code);
            if (pages.length == 1) {
                canvas = draw(pages[0], cellSize, height, transparency_four);

				// documentCanvas = document.createElement('canvas');
				// documentCanvas.style.padding = '0px';
				// documentCanvas.style.background = '#383838';
				// documentCanvas.style.margin = '1px';
				// documentCanvas.style.class = 'fumenOutput';
				
				// container.appendChild(documentCanvas);
				
				// var ctx = documentCanvas.getContext('2d');
				// documentCanvas.height = canvas.height;
				// documentCanvas.width = canvas.width;
				
				// results.push(canvas);
				// resultURLs.push(canvas.toDataURL("image/png"));
				
				// ctx.drawImage(canvas, 0, 0);
				
				// documentCanvas.style.outline  = '2px solid #585b5b';
				var img = document.createElement('img');
				var figure = document.createElement('figure');
				var	pageComment = pages[0]['comment'];
				var commentBox = document.createElement('figcaption');
				var textBox = document.createElement('textarea')
				textBox.value = pageComment;
				textBox.style.width = canvas.width+4;
				textBox.className = 'commentBox';

                img.src = canvas.toDataURL("image/png");
				img.className = 'imageOutput';

                container.appendChild(figure);
				figure.appendChild(img);
				if(document.getElementById('displayMode').checked){
				figure.appendChild(commentBox);
					commentBox.appendChild(textBox);
				};
				figure.style.width = canvas.width + 2;
                results.push(canvas);
				resultURLs.push(canvas.toDataURL("image/png"));

			}
            if (pages.length > 1) {
                gif = drawFumens(pages, cellSize, height, start, end, transparency_four);

                var binary_gif = gif.stream().getData(); //notice this is different from the as3gif package!
                var data_url = 'data:image/gif;base64,' + encode64(binary_gif);
                var img = document.createElement('img');
                img.style.padding = '0px';
				img.style.background = '#383838';
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
	if(downloadBool){
		var zip = new JSZip();
		for (let x = 0; x < resultURLs.length; x++){
			let filetype = "."+resultURLs[x].substring(resultURLs[x].indexOf("/") + 1, resultURLs[x].indexOf(";"));
			JSZipUtils.getBinaryContent(resultURLs[x], function (err, data){
				if(err) {
					console.log(err);
				} else {
					if(naming == "index"){
						var filename = (x+1)+filetype
					} else {
						var filename = fumenCodes[x]+filetype;
					}
				zip.file(filename, data, {base64:true});
				if(x == resultURLs.length-1){
					zip.generateAsync({type:'blob'}).then(function(base64){
						saveAs(base64, "output.zip");
						console.log("downloaded");
					});
				}};
			});
		};
	};
}