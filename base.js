// default settings
var cellSize = 22;
var boardSize = [10, 20];

//BOARD
var comments = [];
var board = [];
var hist = [];
var histPos = 0;
hist = [{board: JSON.stringify(board),},];
histPos = 0;
window.requestAnimationFrame(render);

//MAKING FIRST EMPTY BOARD
const a = { t: 0, c: '' }; // t:0 = nothing t:1 = filled, c = color

const aRow = function () {
	return '.'
		.repeat(boardSize[0])
		.split('')
		.map(() => {
			return a;
		});
};

emptyBoard = [];

for (let i = 0; i < boardSize[1]; i++) {
	emptyBoard.push(aRow());
}

board = emptyBoard;
updateHistory()

// CANVAS
var ctx = document.getElementById('b').getContext('2d');
var ctxH = document.getElementById('b').getContext('2d');
var ctxN = document.getElementById('b').getContext('2d');
var gridCvs = document.createElement('canvas');
gridCvs.height = cellSize;
gridCvs.width = cellSize;
var gridCtx = gridCvs.getContext('2d');
gridCtx.fillStyle = '#000000CC';
gridCtx.fillRect(0, 0, cellSize, cellSize);
gridCtx.strokeStyle = '#ffffff88';
gridCtx.strokeRect(0, 0, cellSize+1, cellSize+1);
var pattern = ctx.createPattern(gridCvs, 'repeat');
document.getElementById('b').height = (boardSize[1]) * cellSize;
document.getElementById('b').width = boardSize[0] * cellSize;
document.getElementById('b').style.outline = '1px solid #ffffff';

//MOUSE INPUT
mouseY = 0;
mouseX = 0;
mouseDown = false;
drawMode = true;
movingCoordinates = false;

//FUNCTIONS
document.getElementById('b').onmousemove = function mousemove(e) {
	histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	rect = document.getElementById('b').getBoundingClientRect();
	y = Math.floor((e.clientY - rect.top) / cellSize);
	x = Math.floor((e.clientX - rect.left) / cellSize);

	if (inRange(x, 0, boardSize[0]-1) && inRange(y, 0, boardSize[1]-1)) {
		movingCoordinates = y != mouseY || x != mouseX;
		mouseY = y;
		mouseX = x;

		if (mouseDown && movingCoordinates) {
			if(drawMode) {
				if(board[mouseY][mouseX]['t'] == 0){
					board[mouseY][mouseX] = { t: 1, c: paintbucketColor()};
				} else {
					if(board[mouseY][mouseX]['c'] != paintbucketColor()){
					board[mouseY][mouseX] = { t: 1, c: paintbucketColor()}};
				};
			} else {
				board[mouseY][mouseX] = { t: 0, c: '' };
			}
	updateHistory();
	autoEncode();
		}
	}
};

document.getElementById('b').onmousedown = function mousedown(e) {
	histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	rect = document.getElementById('b').getBoundingClientRect();
	mouseY = Math.floor((e.clientY - rect.top) / cellSize);
	mouseX = Math.floor((e.clientX - rect.left) / cellSize);

	if(!mouseDown) {
		movingCoordinates = false;
		drawMode = e.button != 0 || board[mouseY][mouseX]['t'] == 1;
		if(board[mouseY][mouseX]['t'] == 0){
			board[mouseY][mouseX] = { t: 1, c: paintbucketColor()};
		} else {
			if(board[mouseY][mouseX]['c'] != paintbucketColor()){
			board[mouseY][mouseX] = { t: 1, c: paintbucketColor()}
			} else {
			board[mouseY][mouseX] = { t: 0, c: '' };
			};
		};
	};
	mouseDown = true;
	drawMode = board[mouseY][mouseX]['t'] == 1;
	updateHistory();
	autoEncode();
	window.requestAnimationFrame(render);
};

document.onmouseup = function mouseup() {
	mouseDown = false;
};

document.onkeydown = function paintbrush(e) {
	switch (e.key) {
		case '1':
		paintbucket[0].checked = true;
			break;
		case '2':
		paintbucket[1].checked = true;
			break;
		case '3':
		paintbucket[2].checked = true;
			break;
		case '4':
		paintbucket[3].checked = true;
			break;
		case '5':
		paintbucket[4].checked = true;
			break;
		case '6':
		paintbucket[5].checked = true;
			break;
		case '7':
		paintbucket[6].checked = true;
			break;
		case '8':
		paintbucket[7].checked = true;		
			break;
		case 'r':
		restart();
			break;
		case 'ArrowLeft':
		prevPage();
			break;
		case 'ArrowRight':
		nextPage();
			break;
		default:
			break;																								
		}
}

function paintbucketColor() {
	for (i = 0; i < document.paintbucket.length; i++) {
		if (document.paintbucket[i].checked) {
			return document.paintbucket[i].id;
		}
	}
}

function inRange(number, min, max) {
    return (number >= min && number <= max)
}

function updateHistory() {
	histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	hist[histPos] = {board: JSON.stringify(board)};
	window.requestAnimationFrame(render);
}

function shift(direction){
	switch(direction) {
	case 'left':		
			board.map((y) => {
				y.splice(0,1);
				y.push({t: '0', c: ''});
			});
		break;
	case 'up':
			board.splice(0,1);
			board.push(aRow());
		break;
	case 'down':
			board.pop();
			board.splice(0,0,aRow());
		break;
	case 'right':
			board.map((y) => {
				y.splice(0,0,{t: '0', c: ''});
				y.pop();
			});
		break;
	};
	updateHistory();
	window.requestAnimationFrame(render);
}

function editComment() {
	position = document.getElementById("positionDisplay").value-1;
	hist[position]['comment'] = document.getElementById("commentBox").value;
	autoEncode();
}

function updateComment() {
	position = document.getElementById("positionDisplay").value-1;
	if(hist[position]['comment'] == undefined){
		document.getElementById("commentBox").value = '';
	} else {
		document.getElementById("commentBox").value = hist[position]['comment'];
	}
}

function prevPage() {
	histPos = parseFloat(document.getElementById("positionDisplay").value);
	if (histPos > 0) {
		board = JSON.parse(hist[histPos-1]['board']);
		document.getElementById("positionDisplay").value = histPos;
	};
	window.requestAnimationFrame(render);
	updateComment();
	autoEncode();
}

function nextPage() {
	histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	if (histPos < hist.length) {
		board = JSON.parse(hist[histPos]['board']);
	} else {
		hist[histPos] = {board: JSON.stringify(board),};
	}
	document.getElementById("positionDisplayOver").value = "/"+(hist.length);
	window.requestAnimationFrame(render);
	updateComment();
	autoEncode();
}

function startPage(){
	histPos = 0;
	board = JSON.parse(hist[histPos]['board']);
	window.requestAnimationFrame(render);
	updateComment();
	autoEncode();
}

function endPage(){
	board = JSON.parse(hist[hist.length-1]['board']);
	window.requestAnimationFrame(render);
	updateComment();
	autoEncode();
}

function restart(){
	board.map((y, i) => {
		y.map((x, ii) => {
			x.t = 0
			x.c = ''
		});
	});
	hist = [];
	hist[0] = [{board: JSON.stringify(board),},];
	document.getElementById("positionDisplay").value = 1;
	document.getElementById("positionDisplayOver").value = "/"+(hist.length);
	document.getElementById("boardOutput").value = '';
	document.getElementById("commentBox").value = '';
	comments = [];
	window.requestAnimationFrame(render);
}

function clearPage(){
	board.map((y, i) => {
		y.map((x, ii) => {x.t = 0, x.c = ''});
	});
	histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	hist[histPos] = {board: JSON.stringify(board)};
	window.requestAnimationFrame(render);
	autoEncode();
	document.getElementById("commentBox").value = '';
	editComment();
}

function dupliPage(){
	histPos = parseFloat(document.getElementById("positionDisplay").value-1);
	if(hist.length == 1){
		nextPage();
	} else {
		if (histPos != hist.length-1) {
			hist.splice(histPos,0,{board: JSON.stringify(board)});
			document.getElementById("positionDisplay").value = histPos+2;
			document.getElementById("positionDisplayOver").value = "/"+hist.length;
			document.getElementById("commentBox").value = comments[histPos];
		} else {
			if(histPos == hist.length-1){
				nextPage();
			}
		}
	};
	window.requestAnimationFrame(render);
	autoEncode();
}

function deletePage(){
	histPos = parseFloat(document.getElementById("positionDisplay").value-1);
	if(hist.length == 1){
		clearPage();
	} else {
		if (histPos != hist.length-1) {
			board = JSON.parse(hist[histPos+1]['board']);
			document.getElementById("positionDisplay").value = histPos+1;
			hist.splice(histPos,1);
			comments.splice(histPos,1);
			document.getElementById("positionDisplayOver").value = "/"+hist.length;
		} else {
			if(histPos == hist.length-1){
				board = JSON.parse(hist[histPos-1]['board']);
				hist.pop();
				comments.pop();
				document.getElementById("positionDisplay").value = histPos;
				document.getElementById("positionDisplayOver").value = "/"+hist.length;
			}
		}
	};
	window.requestAnimationFrame(render);
	autoEncode();
}

function render() {
	ctx.clearRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize);
	ctx.fillStyle = pattern;
	ctx.fillRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize);
	board.map((y, i) => {
		y.map((x, ii) => {
			if (x.t == 1) {
				drawCell(ii, i, x.c, x.t);
			}
		});
	});
}

function autoEncode() {
	var autoEncodeBool = document.getElementById("autoEncode").checked;
	var encodingType = document.getElementById("encodingType").value;
	if(autoEncodeBool == true) {
		if(encodingType == "fullFumen") {
			fumen = fullEncode(hist);
			document.getElementById("boardOutput").value = fumen;
		};
		if(encodingType == "currentFumen") {
			fumen = encode(board);
			document.getElementById("boardOutput").value = fumen;
		};
	};
}

function drawCell(x, y, piece, type) {
	var color = {Z: '#ef624d',L: '#ef9535',O: '#f7d33e',S: '#66c65c',I: '#41afde',J: '#1983bf',T: '#b451ac',X: '#999999',};
	var lightercolor = {Z: '#fd7660',L: '#fea440',O: '#ffe34b',S: '#7cd97a',I: '#3dc0fb',J: '#1997e3',T: '#d161c9',X: '#bbbbbb',};

	if(y == 0){
		var cellAbove = 1;
	} else {
		var cellAbove = board[y-1][x]['t'];
	};
	if(cellAbove == 0){
		if (type !== 0) {
			ctx.fillStyle = lightercolor[piece];
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1 - cellSize/5, cellSize - 0, cellSize/5);
			ctx.fillStyle = color[piece];
			ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0);}
		} else {
			if (type !== 0) {
				ctx.fillStyle = color[piece];
				ctx.fillRect((x) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0);}
		}
}


