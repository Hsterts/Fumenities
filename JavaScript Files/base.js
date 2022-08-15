const print = console.log;

var ctrl = { // default controls

	//? should probably add handling settings in here - g3ner1c

	null: 'L',
	null: 'R',
	null: 'SD',
	null: 'HD',
	null: 'HL',
	null: 'CW',
	null: 'CCW',
	null: 'R180',
	null: 'RE',
	null: 'prevPage',
	null: 'nextPage',

};

const flags = {
	HD: 1,
	R: 2,
	L: 4,
	SD: 8,
	HL: 16,
	CW: 32,
	CCW: 64,
	R180: 128,
	prevPage: 256,
	nextPage: 512,
	RE: 1024,
};

const color = { // piece colors
	Z: '#F00',
	L: '#F80',
	O: '#FF0',
	S: '#0F0',
	I: '#0BF',
	J: '#05F',
	T: '#C3F',
	A: '#2A2A2A',
	X: '#999999',
};

const reversed = { // mirrored pieces
	Z: 'S',
	L: 'J',
	O: 'O',
	S: 'Z',
	I: 'I',
	J: 'L',
	T: 'T',
	A: 'A',
	X: 'X',
	'|': '|',
};

var imgs = { // piece images
	grid: './assets/pieceSprite/grid.png',
	Z: './assets/pieceSprite/z.png',
	L: './assets/pieceSprite/l.png',
	O: './assets/pieceSprite/o.png',
	S: './assets/pieceSprite/s.png',
	I: './assets/pieceSprite/i.png',
	J: './assets/pieceSprite/j.png',
	T: './assets/pieceSprite/t.png',
};

// default settings
var cellSize = 22; // pixels
var boardSize = [10, 20];

const names = 'ZLOSIJT'.split(''); // piece names
const a = { t: 0, c: '' }; // t:0 = nothing   t:1 = heap mino   t:2 = current mino   t:3 = ghost mino
//? ^^ ??? - g3ner1c

var aRow = function () {
    // var instead of const because aRow varies across modes
	return '.'
		.repeat(boardSize[0])
		.split('')
		.map(() => {
			return a;
		});
};

var sfxCache = {};
var board = [];
var queue = [];
var piece = '';
var holdP = '';
var held = false;
var Ldn = (Rdn = false);
var rot = 0;
var dasID = 0;
var sdINT = (dasINT = null);
var xPOS = 0;
var yPOS = 0;
var xGHO = 0;
var yGHO = 0;
var lastAction = '';
var hist = [];
var histPos = 0;
var ctx = document.getElementById('b').getContext('2d');
var ctxH = document.getElementById('b').getContext('2d');
var ctxN = document.getElementById('b').getContext('2d');
var gridCvs = document.createElement('canvas');
gridCvs.height = cellSize;
gridCvs.width = cellSize;
var gridCtx = gridCvs.getContext('2d');
gridCtx.fillStyle = '#000000CC';
gridCtx.fillRect(0, 0, cellSize, cellSize);
gridCtx.strokeStyle = '#00000000';
gridCtx.strokeRect(0, 0, cellSize, cellSize);
var pattern = ctx.createPattern(gridCvs, 'repeat');
for (let i = 0; i < boardSize[1]; i++) {
	board.push(aRow());
}
document.getElementById('b').height = (boardSize[1]) * cellSize;
document.getElementById('b').width = boardSize[0] * cellSize;

var keys = Object.keys(imgs);
keys.map((k, idx) => {
	var i = new Image();
	i.onload = () => {
		imgs[k] = i;
		if (idx + 1 == keys.length)
			setTimeout(() => {
				callback();
			}, 250); // Load images first, then load game after
	};
	i.src = imgs[k];
});

// Keys
var keysDown;
var lastKeys;

// mouse stuff for drawing

mouseY = 0; // which cell on the board the mouse is over
mouseX = 0;
mouseDown = false;
drawMode = true;
movingCoordinates = false;

document.getElementById('b').onmousedown = function mousedown(e) {
	rect = document.getElementById('b').getBoundingClientRect();
	mouseY = Math.floor((e.clientY - rect.top) / cellSize);
	mouseX = Math.floor((e.clientX - rect.left) / cellSize);
	if (inRange(mouseX, 0, boardSize[0]-1) && inRange(mouseY, 0, boardSize[1]-1)) {
		if (!mouseDown) {
			movingCoordinates = false;
			drawMode = e.button != 0 || board[mouseY][mouseX]['t'] == 1;
			if (drawMode) {
				board[mouseY][mouseX] = { t: 0, c: '' };
			} else {
				board[mouseY][mouseX] = { t: 1, c: paintbucketColor() };
			}
		}
		mouseDown = true;
		drawMode = board[mouseY][mouseX]['t'] == 1;
	}
};

document.onmouseup = function mouseup() {
	histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	mouseDown = false;

	if (drawMode) {
		drawn = [];
		erased = [];
		oldBoard = JSON.parse(hist[histPos]['board']);
		board.map((r, i) => {
			r.map((c, ii) => {
				if (c.t == 1 && c.c != oldBoard[i][ii].c) drawn.push({ y: i, x: ii });
				if (c.t == 0 && 1 == oldBoard[i][ii].t) erased.push({ y: i, x: ii });
			});
		});
		if (drawn.length != 0 || erased.length != 0) updateHistory();
	}
};

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
	hist[histPos] = {
		board: JSON.stringify(board),
		queue: JSON.stringify(queue),
		hold: holdP,
		piece: piece,
	};
}

function prevPage() {
	histPos = parseFloat(document.getElementById("positionDisplay").value);
	if (histPos > 0) {
		histPos--;
		board = JSON.parse(hist[histPos]['board']);
	}
}

function nextPage() {
	histPos = parseFloat(document.getElementById("positionDisplay").value)-1;
	console.log(histPos)
	console.log(hist.length)
	if (histPos < hist.length) {
		console.log("isn't the last")
		board = JSON.parse(hist[histPos]['board']);
		histPos++;
	} else {
		console.log("is the last")
		hist[histPos] = {
			board: JSON.stringify(board)
		};
		histPos++;
	}
	document.getElementById("positionDisplayOver").value = "/"+(hist.length);
}

function startPage(){
	histPos = 0;
	board = JSON.parse(hist[histPos]['board']);
}

function endPage(){
	board = JSON.parse(hist[hist.length-1]['board']);
}


function callback(gravity=700, special_restart=false, cheese=false) {
	keysDown = 0;
	lastKeys = 0;

	//* keyboard input
	document.addEventListener('keydown', e => {
		const input = ctrl[e.code];
		if (input) keysDown |= flags[input]; //* sets key in keysDown
		if (e.repeat) return; //* if held down, do nothing
		if (input) {
			switch (input) {  // handles non-movement keys
				case 'SD':
					softDrop();
					break;
				case 'HD':
					hardDrop();
					break;
				case 'HL':
					hold();
					break;
				case 'CW':
					rotate('CW');
					break;
				case 'CCW':
					rotate('CCW');
					break;
				case 'R180':
					rotate('R180');
					break;
				case 'RE':
					restart();
					break;
				case 'prevPage':
					prevPage();
					break;
				case 'nextPage':
					nextPage();
					break;
			}
		}
	});

	document.addEventListener('keyup', function (e) {
		const input = ctrl[e.code];
		if (input) {
			if (keysDown & flags[input]) keysDown ^= flags[input];
			// remove key from keysDown
			if (!(keysDown & flags.L) && !(keysDown & flags.R)) {
				dasID++;
			}
		}
	});

	hist = [
		{
			board: JSON.stringify(board),
			queue: JSON.stringify(queue),
			hold: holdP,
			piece: piece,
		},
	];
	histPos = 0;
	combo = -1;
	b2b = -1;

    if (special_restart) {
        restart();
    }

	fullQuery = window.location.search;
	if (fullQuery.length > 0 && fullQuery[0] == '?') {
		queries = fullQuery.slice(1).split('&');
		for (let query of queries) {
			if (query.length > 0) {
				if (query.slice(0, 6) == 'fumen=') {
					// waow lazy handling
					fumen = query.slice(6);
					try {
						result = fullDecode(fumen, hist[0]);
						hist = JSON.parse(JSON.stringify(result));
						histPos = 0;
						board = JSON.parse(hist[0]['board']);
					} catch (error) {
						console.log(error);
					}
				}
				if (query.slice(0, 4) == 'pos=') {
					pos = parseInt(query.slice(4));
					if (!isNaN(pos) && hist.length > pos) {
						histPos = pos;
                        board = JSON.parse(hist[pos]['board']);
					}
				}
			}
		}
	}

	function drawCell(x, y, piece, type) {
		if (type !== 0) {
			// Current and Heap
			ctx.fillStyle = color[piece];
			ctx.fillRect((x - 1) * cellSize + 1, y * cellSize + 1, cellSize - 0, cellSize - 0);
		}
	}

	function render() {
		ctx.clearRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize);
		ctx.fillStyle = pattern;
		ctx.fillRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize);

		board.map((y, i) => {
			y.map((x, ii) => {
				if (x.t !== 0) {
					drawCell(ii + 1, i, x.c, x.t);
				}
			});
		});
		window.requestAnimationFrame(render);
	}
	window.requestAnimationFrame(render);
}
