function toField(board) {
    FieldString = '';
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < 10; col++) {
            if (board[row][col]['t'] == 1 && board[row][col]['c'] != '') {
                FieldString += board[row][col]['c'];
            } else FieldString += '_';
        }
    }
    return Field.create(FieldString);
}

function decode() {
    histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	fumen = document.getElementById("boardOutput").value;

	pages = decoder.decode(fumen);
    input = pages[0]['_field']['field']['pieces'];
    board = [];
    for (rowIndex = 0; rowIndex < 20; rowIndex++) {
        let row = [];
        for (colIndex = 0; colIndex < 10; colIndex++) {
            index = (20 - rowIndex - 1) * 10 + colIndex;
            colorIndex = input[index];
            if (colorIndex == 0) row.push({ t: 0, c: '' });
            else {
                letter = ' ILOZTJSX'[colorIndex];
                row.push({ t: 1, c: letter });
            }
        }
        board.push(row);
    }
    comment = pages[0]['comment'];
    page = {
        board, 
        comment: comment
    }
	board = JSON.parse(JSON.stringify(page.board));
	hist.splice(histPos,0,{board: JSON.stringify(board)});
	document.getElementById("positionDisplayOver").value = "/"+hist.length;
	hist[histPos]['comment'] = page.comment;
	document.getElementById("commentBox").value = page.comment;
	window.requestAnimationFrame(render);
};

function fullDecode(fumen) {
	// TILJSZO order
	pieces = 	[['0000111001000000', '0100011001000000', '0100111000000000', '0100110001000000'],
				['', '0100010001000100', '0000111100000000'],
				['0000111010000000', '0100010001100000', '0010111000000000', '1100010001000000'],
				['0000111000100000', '0110010001000000', '1000111000000000', '0100010011000000'],
				['0000011011000000', '0100011000100000'],
				['0000110001100000', '0010011001000000'],
				['0000110011000000']];
	fumen = document.getElementById("boardOutput").value;
    pages = decoder.decode(fumen);
    newHist = [];

    for (i = 0; i < pages.length; i++) {
		input = pages[i]['_field']['field']['pieces'];
        let tempBoard = [];
        for (rowIndex = 0; rowIndex < 20; rowIndex++) {
            let row = [];
            for (colIndex = 0; colIndex < 10; colIndex++) {
                index = (20 - rowIndex - 1) * 10 + colIndex;
                colorIndex = input[index];
                if (colorIndex == 0) row.push({ t: 0, c: '' });
                else {
                    letter = ' ILOZTJSX'[colorIndex];
                    row.push({ t: 1, c: letter });
                }
            }
            tempBoard.push(row);
        }

        currHist = {
            board: JSON.stringify(tempBoard),
            comment: pages[i]['comment'],
			flags: pages[i]['flags'],
			operation: pages[i]['operation'],
        };

        if (pages[i]['flags']['quiz'] && comment.substring(0, 3) == '#Q=') {
            bracketStart = comment.indexOf('[');
            bracketEnd = comment.indexOf(']');
            if (bracketStart >= 0 && bracketEnd == bracketStart + 2 && 'SZLJIOT'.includes(comment[bracketStart + 1])) {
                currHist['hold'] = comment[bracketStart + 1];
            } else currHist['hold'] = '';

            bracketStart = comment.indexOf('(');
            bracketEnd = comment.indexOf(')');
            if (bracketStart >= 0 && bracketEnd == bracketStart + 2 && 'SZLJIOT'.includes(comment[bracketStart + 1])) {
                currHist['piece'] = comment[bracketStart + 1];
            }

            currQueue = comment.substring(bracketEnd + 1);
            temp = [];
            for (j = 0; j < currQueue.length; j++) {
                //sanitization
                if ('SZLJIOT'.includes(currQueue[j])) temp.push(currQueue[j]);
            }
            temp.push('|');
            while (temp.length < 10) {
                var shuf = names.shuffle();
                shuf.map((p) => temp.push(p));
                temp.push('|');
            }
            currHist['queue'] = JSON.stringify(temp);

        }
		
		// Decoding operation to minoModeBoards
		if(currHist.operation != undefined){
			minoModeBoard = JSON.parse(JSON.stringify(emptyBoard));
			let c = currHist.operation.type
			let rotation = currHist.operation.rotation
			let x = currHist.operation.x - 1
			let y = 19 - currHist.operation.y - 1
			
			//hardcoding rotations because why distinguish between I, SZ, and O rotations :tf: (i'll work on it)
			switch(c){
				case 'I':
					switch(rotation){
						case 'reverse': rotation = 'spawn'; x--; break;
						case 'left': rotation = 'right'; y--; break;	
					}
					break;
				case 'O':
					switch(rotation){
						case 'spawn': rotation = 'reverse'; y--; x++; break;
						case 'left': rotation = 'reverse'; y--; break;
						case 'right': rotation = 'reverse'; x++; break;
					};
					break;
				case 'S':
					switch(rotation){
						case 'spawn': rotation = 'reverse'; y--; break;
						case 'left': rotation = 'right'; x--; break;
					}
				case 'Z':
					switch(rotation){
						case 'spawn': rotation = 'reverse'; y--; break;
						case 'left': rotation = 'right'; x--; break;
					}
				}
			
			let pieceIndex = 'TILJSZO'.indexOf(c);
			let rotIndex = ['reverse','right','spawn','left'].indexOf(rotation);
			let pieceRef = pieces[pieceIndex]
			let rotRef = pieceRef[rotIndex];
	
			for(map = 0; map < 16; map++) {
				let row = Math.floor(map/4) + y;
				let col = (map % 4) + x;
				let type = rotRef[map]
				if(type == 1){
				 	minoModeBoard[row][col] = {t: 1, c: c}
				}
			}

		}
		currHist['minoBoard'] = JSON.stringify(minoModeBoard);
        newHist.push(currHist);
		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard));
    }

	hist = newHist;
	histPos = 0;
	board = JSON.parse(hist[histPos]['board']);
	minoModeBoard = JSON.parse(hist[histPos]['minoBoard']);
	comment = hist[histPos]['comment'];
	document.getElementById("commentBox").value = comment; 
	document.getElementById("positionDisplay").value = 1;
	document.getElementById("positionDisplayOver").value = "/"+hist.length;
	window.requestAnimationFrame(render);
};

function encode() {
	histPos = document.getElementById("positionDisplay").value-1
	pages = [];

	page = [];
	field = toField(JSON.parse(hist[histPos]['board']));
	flags = {
		rise: false,
		mirror: false,
		colorize: true,
		comment: hist[histPos]['comment'],
		lock: true,
		piece: undefined,
	}
	page = {
		comment: hist[histPos]['comment'],
		operation: hist[histPos]['operation'],
		field,
		flags: flags,
		index: histPos,
	}
	pages.push(page);

	var result = encoder.encode(pages);
	document.getElementById("boardOutput").value = result;
}

function fullEncode() {
	pages = [];
for (var i = 0; i < hist.length; i++){
	page = [];
	field = toField(JSON.parse(hist[i]['board']));
	flags = {
		rise: false,
		mirror: false,
		colorize: true,
		comment: hist[i]['comment'],
		lock: true,
		piece: undefined,
	}
		page = {
			comment: hist[i]['comment'],
			operation: hist[i]['operation'],
			field,
			flags: flags,
			index: i,
		}
	pages.push(page);
};
	var result = encoder.encode(pages);
	document.getElementById("boardOutput").value = result;
}

function autoEncode() {
	var autoEncodeBool = document.getElementById("autoEncode").checked;

	var encodingType = document.getElementById("encodingType").value;
	if(autoEncodeBool == true) {
		if(encodingType == "fullFumen") {
			fumen = fullEncode();
		};
		if(encodingType == "currentFumen") {
			fumen = encode();
		};
	};
}

//IMAGE IMPORT
async function importImage() {
	try {
		const clipboardItems = await navigator.clipboard.read();
		for (const clipboardItem of clipboardItems) {
			for (const type of clipboardItem.types) {
				const blob = await clipboardItem.getType(type);
				//console.log(URL.createObjectURL(blob));

				// Create an abstract canvas and get context
				var mycanvas = document.createElement('canvas');
				var ctx = mycanvas.getContext('2d');

				// Create an image
				var img = new Image();

				// Once the image loads, render the img on the canvas
				img.onload = function () {
					console.log(this.width, this.height);
					scale = this.width / 10.0;
					x = 10;
					y = Math.min(Math.round(this.height / scale), 22);
					console.log(x, y);
					mycanvas.width = this.width;
					mycanvas.height = this.height;

					// Draw the image
					ctx.drawImage(img, 0, 0, this.width, this.height);
					var data = Object.values(ctx.getImageData(0, 0, this.width, this.height).data);
					var nDat = [];
					for (row = 0; row < y; row++) {
						for (col = 0; col < 10; col++) {
							// get median value of pixels that should correspond to [row col] mino

							minoPixelsR = [];
							minoPixelsG = [];
							minoPixelsB = [];

							for (pixelRow = Math.floor(row * scale); pixelRow < row * scale + scale; pixelRow++) {
								for (pixelCol = Math.floor(col * scale); pixelCol < col * scale + scale; pixelCol++) {
									index = (pixelRow * this.width + pixelCol) * 4;
									minoPixelsR.push(data[index]);
									minoPixelsG.push(data[index + 1]);
									minoPixelsB.push(data[index + 2]);
								}
							}

							medianR = median(minoPixelsR);
							medianG = median(minoPixelsG);
							medianB = median(minoPixelsB);
							var hsv = rgb2hsv(medianR, medianG, medianB);
							console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
							nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
						}
					}
					/* // old alg from just scaling it down to x by y pixels
                    for (let i = 0; i < data.length / 4; i++) {
						//nDat.push(data[i*4] + data[(i*4)+1] + data[(i*4)+2] < 382?1:0)
						var hsv = rgb2hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
						console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
						nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
					}*/

					tempBoard = new Array(40 - y).fill(new Array(10).fill({ t: 0, c: '' })); // empty top [40-y] rows
					for (rowIndex = 0; rowIndex < y; rowIndex++) {
						let row = [];
						for (colIndex = 0; colIndex < 10; colIndex++) {
							index = rowIndex * 10 + colIndex;
							temp = nDat[index];
							if (temp == '.') row.push({ t: 0, c: '' });
							else row.push({ t: 1, c: temp });
						}
						tempBoard.push(row);
					}

					board = JSON.parse(JSON.stringify(tempBoard));

					xPOS = spawn[0];
					yPOS = spawn[1];
					rot = 0;
					clearActive();
					updateGhost();
					setShape();
					updateHistory();
				};

				var URLObj = window.URL || window.webkitURL;
				img.src = URLObj.createObjectURL(blob);
			}
		}
	} catch (err) {
		console.error(err.name, err.message);
	}
}

function rgb2hsv(r, g, b) {
	let v = Math.max(r, g, b),
		c = v - Math.min(r, g, b);
	let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
	return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function nearestColor(h, s, v) {
	if (inRange(h, 0, 30) && inRange(s, 0, 1) && (inRange(v, 133, 135) || inRange(v, 63, 88))) return 'X'; // attempted manual override specifically for four.lol idk
	if (inRange(h, 220, 225) && inRange(s, 0, 0.2) && v == 65) return '.';

	if (s <= 0.2 && v / 2.55 >= 55) return 'X';
	if (v / 2.55 <= 55) return '.';

	if (inRange(h, 0, 16) || inRange(h, 325, 360)) return 'Z';
	else if (inRange(h, 16, 41)) return 'L';
	else if (inRange(h, 41, 70)) return 'O';
	else if (inRange(h, 70, 149)) return 'S';
	else if (inRange(h, 149, 200)) return 'I';
	else if (inRange(h, 200, 266)) return 'J';
	else if (inRange(h, 266, 325)) return 'T';
	return '.';
}

function inRange(x, min, max) {
	return x >= min && x <= max;
}

function median(values) {
	// if this is too computationally expensive maybe switch to mean
	if (values.length === 0) throw new Error('No inputs');

	values.sort(function (a, b) {
		return a - b;
	});

	var half = Math.floor(values.length / 2);

	if (values.length % 2) return values[half];

	return (values[half - 1] + values[half]) / 2.0;
}

//MIRRORING
const reversed = {Z: 'S',L: 'J',O: 'O',S: 'Z',I: 'I',J: 'L',T: 'T',X: 'X'};

function mirror() {
	for (row = 0; row < board.length; row++) {
		board[row].reverse();
		for (i = 0; i < board[row].length; i++) {
			if (board[row][i].t == 1) board[row][i].c = reversed[board[row][i].c];
		}
	}
	updateHistory();
	window.requestAnimationFrame(render);
}

function fullMirror() {
	for (i = 0; i < hist.length; i++) {
		tempBoard = JSON.parse(hist[i]['board']);
		for (row = 0; row < tempBoard.length; row++) {
			tempBoard[row].reverse();
			for (j = 0; j < tempBoard[row].length; j++) {
				if (tempBoard[row][j].t == 1) tempBoard[row][j].c = reversed[tempBoard[row][j].c];
			}
		}
		hist[i]['board'] = JSON.stringify(tempBoard);
	}
	board = tempBoard;
	updateHistory();
	window.requestAnimationFrame(render);
}

//HTML FUNCTIONS
function toggleFumenUtilSettings() {
	var x = document.getElementById("settings");
	if (x.style.display === "none") {
	  x.style.display = "block";
	} else {
	  x.style.display = "none";
	}
  }

function toggleBGSelect() {
	var x = document.getElementById("bgselect");
	if (x.style.display === "none") {
	  x.style.display = "block";
	} else {
	  x.style.display = "none";
	}
  }

function toggleDownloadSettings() {
	var x = document.getElementById("downloadSettings");
	if (x.style.display === "none") {
	  x.style.display = "block";
	} else {
	  x.style.display = "none";
	}
  }

function toggleAutoEncoding() {
	var x = document.getElementById("autoEncodeOptions");
	var y = document.getElementById("boardOutput");
	if (x.style.display === "none") {
	  x.style.display = "block";
	  y.style.height = 36;
	  autoEncode();
	} else {
	  x.style.display = "none";
	  y.style.height = 64;
	}
  }

function toggleSidePanel() {
	var x = document.getElementById("fumenSidebar");
	if (x.style.display === "none") {
	  x.style.display = "block";
	} else {
	  x.style.display = "none";
	}
};

function toggleFumenSettings() {
	var fumenSettings = document.getElementById("fumenSettings");
	var openButton = document.getElementById("openFumenSettings");
	var closeButton = document.getElementById("closeFumenSettings");
	if (fumenSettings.style.display === "none"){
	    fumenSettings.style.display = "block";
	    openButton.style.display = "none";
	    closeButton.style.display = "block";
	} else {
	    fumenSettings.style.display = "none";
	    openButton.style.display = "block";
	    closeButton.style.display = "none";
	}
	
  }

function toggleToolTips() {
	var x = document.getElementsByClassName("tooltiptext");
	for(let z = 0; z<x.length; z++) {
		if(x[z].style.display === "none" || x[z].style.display === ''){
			x[z].style.display = "block";
		} else {
			x[z].style.display = "none";
		};
	};
}

function toggleStyle() {
	if(document.getElementById('defaultRenderInput').checked) {
		style = 'fumen';
		document.getElementById('3dToggle').style.opacity = 0.5
	} else {
		style = 'four';
		document.getElementById('3dToggle').style.opacity = 1
	}
	render();
}

function addPage() {
	  if(document.getElementById('positionDisplay').value == hist.length){
	  document.getElementById('positionDisplay').value = parseFloat(document.getElementById('positionDisplay').value)+1;
	  document.getElementById("positionDisplayOver").value = "/"+(parseFloat(hist.length+1));
	  } else {
	  document.getElementById('positionDisplay').value = parseFloat(document.getElementById('positionDisplay').value)+1;
	  }
	  nextPage();
  }

function subPage() {
	  if(document.getElementById('positionDisplay').value != 1){
	  document.getElementById('positionDisplay').value = parseFloat(document.getElementById('positionDisplay').value)-1;
	  };
	  prevPage()
  }

function firstPage() {
	  document.getElementById('positionDisplay').value = 1;
	  startPage();
  }

function lastPage() {
	  document.getElementById('positionDisplay').value = hist.length;
	  endPage();
  }

function renderImages(fumen) {
	  style = document.getElementById('renderStyle').value
	  switch(style){
		  case 'four': fumencanvas(fumen); break;
		  case 'fumen': fumenrender(fumen); break;
	  }
  }