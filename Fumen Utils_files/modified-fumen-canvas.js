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
	var field = fumenPage.field;
	var transparent = document.getElementById('transparency').checked
	var gridColor = document.getElementById('gridColor').value
	var tilesize = document.getElementById('cellSize').valueAsNumber;
	var numcols = document.getElementById('width').valueAsNumber;

	if (numrows == undefined) {
		numrows = getFumenMaxHeight(fumenPage) + 1 //extra empty row on top for highlight
	}

	const width = numcols * tilesize;
	const height = numrows * tilesize;

	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext('2d');

	context.fillStyle = (transparent ? 'rgba(0, 0, 0, 0)': document.getElementById('bg').value)
	
	context.fillRect(0, 0, width, height);

	if(gridToggle) {
		//Border
		context.strokeStyle = gridColor
		context.strokeRect(0, 0, width, height);
		for (i = 0; i < numcols; i++) {
			for (j = 0; j < numrows; j++) {
				// all dim grids
				context.fillStyle = gridColor + '30'
				context.fillRect(i * tilesize, height - (j + 1) * tilesize, 1, tilesize)
				context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize, 1)
			}
		}
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
	console.log(fumenPage.field.str())
	const operation = fumenPage.operation
	if (operation != undefined) {
		for (position of operation.positions()) {
			cellStatus[position.y][position.x] = 1
		}
	}
	for (let i = 0; i < numcols; i++) {
		for (let j = 0; j < numrows; j++) {
			if (field.at(i, j) != '_') {
				cellStatus[j][i] = 1
			}
		}
	}
	for (let i = 0; i < numcols; i++) {
		for (let j = 1; j < numrows; j++) {
			if (field.at(i, j) == '_' && field.at(i, j-1) != '_') {
				cellStatus[j][i] = 2
			}
		}
	}
	console.log(cellStatus)
	
	// glued minos
	if (operation != undefined) {
		for (position of operation.positions()) {
			context.fillStyle = colors[operation.type].normal
			context.fillRect(position.x * tilesize, height - (position.y + 1) * tilesize, tilesize, tilesize)
		}
	}
	
	for (let i = 0; i < numcols; i++) {
		for (let j = 0; j < numrows; j++) {
			if (field.at(i, j) != '_') {
				// all blocks
				context.fillStyle = colors[field.at(i, j)].normal
				context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize, tilesize)
				// all dim grids
				if(gridToggle){
					context.fillStyle = gridColor + '40'
					context.fillRect(i * tilesize, height - (j + 1) * tilesize, 1, tilesize)
					context.fillRect(i * tilesize, height - (j + 1) * tilesize, tilesize, 1)
					context.fillRect((i + 1) * tilesize, height - (j + 1) * tilesize, 1, tilesize)
					context.fillRect(i * tilesize, height - j * tilesize, tilesize, 1)
				}
				if(field.at(i, j + 1) == '_') { //only draw highlight (and its borders) if the cell above is empty
					// all highlights
					const highlightSize = tilesize / 5
					context.fillStyle = colors[field.at(i, j)].light
					context.fillRect(i * tilesize, height - (j + 1) * tilesize - highlightSize, tilesize, highlightSize)
					if(gridToggle) {
						// all top dim highlight borders
						context.fillStyle = gridColor + 'CC'
						context.fillRect(i * tilesize, height - (j + 1) * tilesize - highlightSize, tilesize, 1)
						// left kinda dim highlight borders
						if(field.at(Math.max(0, i - 1), j + 1) == "_") {
							context.fillStyle = gridColor + 'CC'
							context.fillRect(i * tilesize, height - (j + 1) * tilesize - highlightSize, 1, highlightSize)
						} else {
							context.fillStyle = gridColor + 'FF'
							context.fillRect(i * tilesize, height - (j + 1) * tilesize - highlightSize, 1, highlightSize)
						}
						// right kinda dim highlight borders
						if(field.at(i + 1, j + 1) == "_") {
							context.fillStyle = gridColor + 'CC'
							context.fillRect((i + 1) * tilesize, height - (j + 1) * tilesize - highlightSize, 1, highlightSize)
						}
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
	
	numrows = getFumenMaxHeight(...drawnFumenPages) + 1 //extra empty row on top for highlight

	var frames = drawnFumenPages.map(fumenPage => draw(fumenPage, numrows).getContext('2d'))

	return GenerateFourGIF(frames)
}

function GenerateFourGIF(frames) {
	const encoder = new GIFEncoder();
	encoder.start();
	encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
	encoder.setDelay(document.getElementById('delay').value); // frame delay in ms
	encoder.setQuality(1); // image quality. 10 is default.
	if (document.getElementById('transparency').checked) {
		encoder.setTransparent('rgba(0, 0, 0, 0)');
	}
	frames.forEach(frame => encoder.addFrame(frame))
	encoder.finish();
	// encoder.download('download.gif');
	return encoder;
}

gridToggle = false;
// max_col = 10;

start = 0;
end = undefined;

//the transparent bg of the png anf gif are different
function fumencanvas(input) {
	var container = document.getElementById('imageOutputs');
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
	
	var fumenCodes = input.split(/[\s,;]+/);
	resultURLs = [];

    for (let code of fumenCodes) {
        try {
            var pages = decoder.decode(code);
            if (pages.length == 1) {
                canvas = draw(pages[0], undefined);

				var textBox = document.createElement('textarea')
				textBox.value = pages[0]['comment'];
				textBox.style.width = canvas.width + 2;
				textBox.className = 'commentDisplay';
				
				var data_url = canvas.toDataURL("image/png")
				var img = document.createElement('img');
                img.src = data_url
				img.className = 'imageOutput';
				
				var figure = document.createElement('figure');
				figure.appendChild(img);
				figure.style.width = canvas.width + 2;
				if(document.getElementById('displayMode').checked){
					var commentBox = document.createElement('figcaption');
					commentBox.appendChild(textBox);
					figure.appendChild(commentBox);
				};
				
				container.appendChild(figure);
                // results.push(canvas);
				resultURLs.push(data_url);

			} else if (pages.length >= 2) {
                gif = drawFumens(pages, start, end);

                var binary_gif = gif.stream().getData(); //notice this is different from the as3gif package!
                var data_url = 'data:image/gif;base64,' + encode64(binary_gif);

                var img = document.createElement('img');
                img.style.padding = '0px';
				img.className = 'imageOutput';
                img.style.margin = '1px';
                img.src = data_url;

                container.appendChild(img);
                // results.push(gif);
				resultURLs.push(data_url);
            }
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