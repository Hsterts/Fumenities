import glueFumen from "./modified-glueFumen.js"
import unglueFumen from "./modified-unglueFumen.js"
import mirrorFumen from "./modified-mirrorFumen.js"
import combineFumen from "./modified-combineFumen.js"
import splitFumen from "./modified-splitFumen.js"
import removeComments from "./modified-removeComments.js"
import renderImages from "./render-images.js"

import { pageToBoard } from "./board-render.js"
import { getDelimiter, inRange } from "./global-utils.js"

//SHORTCUTS
Mousetrap.bind({
	'esc': function() { decreaseResetLevel(); decreaseseClearInputLevel();},
	'=': expandSidebars,
	'-': retractSideBars,

	'backspace': increaseClearInputLevel,
	'g': glueFumen,
	'u': unglueFumen,
	'm': mirrorFumen,
	'c': combineFumen,
	's': splitFumen,
	'R c': removeComments,
	'enter': renderImages,
	
	'shift+enter': moveOutputToInput,
	
	'1': function() {setPaintBucket(0)},
	'2': function() {setPaintBucket(1)},
	'3': function() {setPaintBucket(2)},
	'4': function() {setPaintBucket(3)},
	'5': function() {setPaintBucket(4)},
	'6': function() {setPaintBucket(5)},
	'7': function() {setPaintBucket(6)},
	'8': function() {setPaintBucket(7)},
	'0': toggleMinoMode,
	
	'left': prevPage,
	'mod+left': startPage,
	'right': nextPage,
	'mod+right': endPage,
	
	'shift+up': function() {shift('up')},
	'shift+down': function() {shift('down')},
	'shift+left': function() {shift('left')},
	'shift+right': function() {shift('right')},
	
	'M p': mirror,
	'M f': fullMirror,
	'D': dupliPage,
	'alt+backspace': clearPage,
	'del': deletePage,
	'r': increaseResetLevel,
	
	// Import image already binded to paste
	'ins': decodeInsert,
	'E p': encode,
	'I f': fullDecode,
	'E f': fullEncode,
	'+': addToInput,

	'A e': toggleAutoEncoding,
	
	'l': toggleLock,
	'A c': toggleAutoColor,
	'R f': toggleRowFillInput,
	
	'T t': toggleToolTips,
	'# d': toggle3dSetting,
	'U d': toggleStyle,
	
	'mod+z': undo,
	'mod+y': redo,
})
//mousetrap-exclusive bindings
function decreaseResetLevel() {
	document.getElementById('reset').classList.remove('confirm-delete-data')
}
function decreaseseClearInputLevel() {
	document.getElementById('clear-input').classList.remove('confirm-delete-data')
}

function expandSidebars() {
	var fumenSidebar = document.getElementById('fumenSidebar')
	var settingsSidebar = document.getElementById('settingsSidebar')
	let fumenSidebarVisible = !fumenSidebar.classList.contains('hide-element')
	if (fumenSidebarVisible) { //make arrow state agree with current state
		let settingsButton = document.getElementsByClassName('option-left')[0]
		let openLogo = document.getElementById('openFumenSettings')
		let closeLogo = document.getElementById('closeFumenSettings')
		settingsSidebar.classList.remove('hide-element')
		settingsButton.style.right = '459px'
		settingsButton.style.borderBottomLeftRadius = '0px'
		settingsButton.style.borderBottomRightRadius = '10px'
	    openLogo.style.display = 'none'
	    closeLogo.style.display = 'block'
	}
	settingsSidebar.classList.toggle('hide-element', !fumenSidebarVisible)
	fumenSidebar.classList.remove('hide-element')
}

function retractSideBars() {
	var fumenSidebar = document.getElementById('fumenSidebar')
	var settingsSidebar = document.getElementById('settingsSidebar')
	let settingsSidebarVisible = !settingsSidebar.classList.contains('hide-element')
	if (settingsSidebarVisible) {//make arrow state agree with current state
		let settingsButton = document.getElementsByClassName('option-left')[0]
		let openLogo = document.getElementById('openFumenSettings')
		let closeLogo = document.getElementById('closeFumenSettings')
		settingsSidebar.classList.add('hide-element')
		settingsButton.style.right = '500px'
		settingsButton.style.borderBottomRightRadius = '0px'
		settingsButton.style.borderBottomLeftRadius = '10px'
	    openLogo.style.display = 'block'
	    closeLogo.style.display = 'none'
	}
	fumenSidebar.classList.toggle('hide-element', !settingsSidebarVisible)
	settingsSidebar.classList.add('hide-element')
}

function setPaintBucket(index) {
	document.paintbucket[index].checked = true;
}

function toggleMinoMode() {
    document.getElementById('minoModeInput').checked = !document.getElementById('minoModeInput').checked
	updateMinoMode()
}

function toggleAutoEncoding() {
	document.getElementById('autoEncode').checked = !document.getElementById('autoEncode').checked
	updateAutoEncoding()
}

function toggleLock() {
	document.getElementById('lockFlagInput').checked = !document.getElementById('lockFlagInput').checked
	updateBook()
}

function toggleAutoColor() {
	document.getElementById('autoColorInput').checked = !document.getElementById('autoColorInput').checked
	updateAutoColor()
}

function toggleRowFillInput() {
	document.getElementById('rowFillInput').checked = !document.getElementById('rowFillInput').checked
	updateRowFillInput()
}

function updateRowFillInput() {
	var isRowFillUsable = !document.getElementById('minoModeInput').checked && !document.getElementById('autoColorInput').checked
	document.getElementById('rowFillInput').classList.toggle('disabled', !isRowFillUsable)
}

function toggleToolTips() {
	document.getElementById('tooltipSetting').checked = !document.getElementById('tooltipSetting').checked
	updateToolTips() 
}

function toggle3dSetting() {
	document.getElementById('3dSetting').checked = !document.getElementById('3dSetting').checked
	requestAnimationFrame(renderBoard)
}

function toggleStyle() {
	document.getElementById('defaultRenderInput').checked = !document.getElementById('defaultRenderInput').checked
	updateStyle()
}



//INITIALIZATION
updateToolTips()
updateBGSelect()
updateDownloadSettings()
updateMinoMode()
updateAutoColor()
updateRowFillInput() //unnecessary
updateAutoEncoding()
updateGrid()
setPositionDisplay(bookPos, book.length)

//BINDINGS
document.getElementById("toggleFumenSettings").addEventListener("click", toggleFumenSettings)
function toggleFumenSettings() {
	var fumenSettings = document.getElementById('settingsSidebar')
	var settingsButton = document.getElementsByClassName('option-left')[0]
	var openLogo = document.getElementById('openFumenSettings')
	var closeLogo = document.getElementById('closeFumenSettings')
	if (fumenSettings.classList.contains('hide-element')){
	    fumenSettings.classList.remove('hide-element')
		settingsButton.style.right = '459px'
		settingsButton.style.borderBottomLeftRadius = '0px'
		settingsButton.style.borderBottomRightRadius = '10px'
	    openLogo.style.display = 'none'
	    closeLogo.style.display = 'block'
	} else {
	    fumenSettings.classList.add('hide-element')
		settingsButton.style.right = '500px'
		settingsButton.style.borderBottomRightRadius = '0px'
		settingsButton.style.borderBottomLeftRadius = '10px'
	    openLogo.style.display = 'block'
	    closeLogo.style.display = 'none'
	}
	
}

document.getElementById("sidePanelButtonExpand").addEventListener("click", toggleSidePanel)
document.getElementById("sidePanelButtonRetract").addEventListener("click", toggleSidePanel)

function toggleSidePanel() {
	var fumenSidebar = document.getElementById('fumenSidebar')
	var settingsSidebar = document.getElementById('settingsSidebar')
	var openLogo = document.getElementById('openFumenSettings')
	var closeLogo = document.getElementById('closeFumenSettings')
	if (fumenSidebar.style.display != 'none') {
		settingsSidebar.classList.add('hide-element')
		openLogo.style.display = 'block'
		closeLogo.style.display = 'none'
	}
	fumenSidebar.classList.toggle('hide-element')
}

document.getElementById("clear-input").addEventListener("click", increaseClearInputLevel)

function increaseClearInputLevel() {
	let confirmedReset = document.getElementById('clear-input').classList.contains('confirm-delete-data')
	if (confirmedReset)  {
		document.getElementById('input').value = ''
	}
	document.getElementById('clear-input').classList.toggle('confirm-delete-data')
}

document.getElementById("glue-fumen").addEventListener("click", glueFumen)
document.getElementById("unglue-fumen").addEventListener("click", unglueFumen)
document.getElementById("mirror-fumen").addEventListener("click", mirrorFumen)
document.getElementById("combine-fumen").addEventListener("click", combineFumen)
document.getElementById("split-fumen").addEventListener("click", splitFumen)
document.getElementById("remove-comments").addEventListener("click", removeComments)
document.getElementById("render-images").addEventListener("click", renderImages)

document.getElementById("renderStyle").addEventListener("click", renderImages)
document.getElementById("displayMode").addEventListener("click", renderImages)

document.getElementById("transparency").addEventListener("click", updateBGSelect)
function updateBGSelect() {
	document.getElementById('bgselect').classList.toggle('hide-element', document.getElementById('transparency').checked)
}

document.getElementById("gridToggle").addEventListener("click", updateGrid)
function updateGrid() {
	gridToggle = document.getElementById('gridToggle').checked
	document.getElementById('gridColorPicker').classList.toggle('hide-element', !gridToggle)
}

document.getElementById("downloadOutput").addEventListener("click", updateDownloadSettings)
function updateDownloadSettings() {
	document.getElementById('downloadSettings').classList.toggle('hide-element', !document.getElementById('downloadOutput').checked)
}

// document.getElementById("delim").addEventListener("change", updateDelim) //no longer keeping track, retrieving everytime it is needed instead

document.getElementById("CopyTextboxOutput").addEventListener("click", function() {navigator.clipboard.writeText(document.getElementById('output').value)})

document.getElementById("moveOutputToInput").addEventListener("click", moveOutputToInput)
function moveOutputToInput() {
	let OutputTextArea = document.getElementById('output')
	let InputTextArea = document.getElementById('input')
	if (OutputTextArea.value == '') return; //prevent overwriting input with empty output
	InputTextArea.value = OutputTextArea.value
	OutputTextArea.value = ''
}

//IMAGE IMPORT
document.getElementById("CopyImageOutput").addEventListener("click", takeshot)
function takeshot() {
    container = document.getElementById('imageOutputs')
    html2canvas(container, {
        backgroundColor: null,
        width: container.clientWidth,
        height: container.clientHeight,
        scrollY: -window.scrollY
    }).then(
        function (canvas) {
            canvas.toBlob(blob => {
                try { navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); }
                catch (error) {
                    dataURL = canvas.toDataURL();
                    console.log("Firefox doesn't support dropping images into clipboard, try pasting this DataURL into a new tab and copy pasting the image: ", dataURL);
                    navigator.clipboard.writeText(dataURL);
                }
            });
        }
    );
}

document.addEventListener('paste', (event) => {
    let items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (let item of items) {
        if (item.kind == 'file') importImage(item.getAsFile());
    }
});
async function importImage(blob) {
    // Create an abstract canvas and get context
    var mycanvas = document.createElement('canvas');
    var ctx = mycanvas.getContext('2d');

    // Create an image
    var img = new Image();

    // Once the image loads, render the img on the canvas
    img.onload = function () {
        console.log(this.width, this.height);
        let scale = this.width / 10.0;
        let x = 10;
        let y = Math.min(Math.round(this.height / scale), 22);
        console.log(x, y);
        mycanvas.width = this.width;
        mycanvas.height = this.height;

        // Draw the image
        ctx.drawImage(img, 0, 0, this.width, this.height);
        let tempBoard = new Array(20 - y).fill(new Array(10).fill({ t: 0, c: '' })); // empty top [40-y] rows
        
		let data = Object.values(ctx.getImageData(0, 0, this.width, this.height).data);
        for (let row = 0; row < y; row++) {
            let tmpRow = [];
			for (let col = 0; col < 10; col++) {
				// get median value of pixels that should correspond to [row col] mino
				// if this is too computationally expensive maybe switch to mean

                let minoPixelsR = [];
                let minoPixelsG = [];
                let minoPixelsB = [];
				
                for (let pixelRow = Math.floor(row * scale); pixelRow < row * scale + scale; pixelRow++) {
                    for (let pixelCol = Math.floor(col * scale); pixelCol < col * scale + scale; pixelCol++) {
                        let index = (pixelRow * this.width + pixelCol) * 4;
                        minoPixelsR.push(data[index]);
                        minoPixelsG.push(data[index + 1]);
                        minoPixelsB.push(data[index + 2]);
                    }
                }
				
                let medianR = median(minoPixelsR);
                let medianG = median(minoPixelsG);
                let medianB = median(minoPixelsB);
                let hsv = rgb2hsv(medianR, medianG, medianB);
                console.log(hsv, nearestMinoRepresentation(...hsv)); // debugging purposes
            	tmpRow.push(nearestMinoRepresentation(...hsv))
            }
            tempBoard.push(tmpRow);
        }
        /* // old alg from just scaling it down to x by y pixels
		let nDat = [];
        for (let i = 0; i < data.length / 4; i++) {
            //nDat.push(data[i*4] + data[(i*4)+1] + data[(i*4)+2] < 382?1:0)
            var hsv = rgb2hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
            console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
            nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
        }*/
		
        board = JSON.parse(JSON.stringify(tempBoard));
        updateBook();
    };

    var URLObj = window.URL || window.webkitURL;
    img.src = URLObj.createObjectURL(blob);

	function rgb2hsv(r, g, b) {
		let v = Math.max(r, g, b),
			c = v - Math.min(r, g, b);
		let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
		return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
	}

	function nearestMinoRepresentation(h, s, v) {
		if (inRange(h, 0, 30) && inRange(s, 0, 1) && (inRange(v, 133, 135) || inRange(v, 63, 88))) return { t: 1, c: 'X' }; // attempted manual override specifically for four.lol idk
		if (inRange(h, 220, 225) && inRange(s, 0, 0.2) && v == 65) return { t: 0, c: '' };
	
		if (s <= 0.2 && v / 2.55 >= 55) return { t: 1, c: 'X' };
		if (v / 2.55 <= 55) return { t: 0, c: '' };
	
		if (inRange(h, 0, 16) || inRange(h, 325, 360)) 	return { t: 1, c: 'Z' };
		else if (inRange(h, 17, 41)) 					return { t: 1, c: 'L' };
		else if (inRange(h, 42, 70)) 					return { t: 1, c: 'O' };
		else if (inRange(h, 71, 149)) 					return { t: 1, c: 'S' };
		else if (inRange(h, 150, 200)) 					return { t: 1, c: 'I' };
		else if (inRange(h, 201, 266)) 					return { t: 1, c: 'J' };
		else if (inRange(h, 267, 325)) 					return { t: 1, c: 'T' };
		return { t: 0, c: '' };
	}

	function median(values) {
		if (values.length === 0) throw new Error('No inputs');
	
		values.sort(function (a, b) {
			return a - b;
		});
	
		var half = Math.floor(values.length / 2);
	
		if (values.length % 2) return values[half];
	
		return (values[half - 1] + values[half]) / 2.0;
	}
}

document.getElementById("importImage").addEventListener("click", importImageButton)
async function importImageButton() {
	try {
		const clipboardItems = await navigator.clipboard.read();
		for (const clipboardItem of clipboardItems) {
			for (const type of clipboardItem.types) {
				const blob = await clipboardItem.getType(type);

                importImage(blob);
			}
		}
	} catch (err) {
		console.log(err.message, "\nTry Ctrl V instead.");
	}
}

document.getElementById("CopyImageOutput").addEventListener("click", updateMinoMode)
function updateMinoMode() {
    let minoMode = document.getElementById('minoModeInput').checked
    if (!minoMode && operation == undefined)  {
		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
		operation = undefined
		updateBook()
	}
	updateAutoColor()
	updateRowFillInput() //unnecessary
}

export function settoPage(newPagePos) { // temporary export, may not be necessary
	// Bound bookPos to existing pages
	newPagePos = Math.max(Math.min(book.length-1, newPagePos), 0)

	setPositionDisplay(newPagePos, book.length)
	board = JSON.parse(book[newPagePos]['board'])
	minoModeBoard = JSON.parse(book[newPagePos]['minoBoard'])
	document.getElementById('commentBox').value = book[newPagePos]['comment']
	operation = book[newPagePos]['operation']
	document.getElementById('lockFlagInput').checked = book[newPagePos]['flags']['lock']
}

document.getElementById("startPage").addEventListener("click", startPage)
function startPage(){
	bookPos = 0
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

function solidifyAutoColor(currentBookPos) {
	let currentBoard = JSON.parse(book[currentBookPos]['board'])
	for (let row in currentBoard){
		for (let col in currentBoard[row]) {
			if (currentBoard[row][col].t === 2){
				currentBoard[row][col].t = 1
			}
		}
	}
	book[currentBookPos]['board'] = JSON.stringify(currentBoard)
}

document.getElementById("prevPage").addEventListener("click", prevPage)
function prevPage() {
	bookPos = getCurrentPosition()
	solidifyAutoColor(bookPos)
	settoPage(bookPos-1)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("currentPage").addEventListener("change", gotoPage)
function gotoPage() {
	solidifyAutoColor(bookPos) //relying on global to solidify the page before we leave it
	//TODO: something like this? https://stackoverflow.com/questions/1909992/how-to-get-old-value-with-onchange-event-in-text-box
	// check for numeric input and within bounds
	bookPos = getCurrentPosition()
	if(isNaN(bookPos)){
		bookPos = 0
	}
	bookPos = Math.max(Math.min(book.length, bookPos), 0)
	
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("nextPage").addEventListener("click", nextPage)
function nextPage() {
	bookPos = getCurrentPosition()

	if (bookPos == book.length-1) { // Create new page when at the page
		solidifyAutoColor(bookPos)
		insertFollowingPage(bookPos)
	}

	bookPos += 1 // next page
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	updateBook()
	autoEncode()
}

document.getElementById("endPage").addEventListener("click", endPage)
function endPage(){
	settoPage(book.length-1)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("commentBox").addEventListener("change", updateBook)
document.getElementById("lockFlagInput").addEventListener("click", updateBook)
// Updates all of the board properties: board, minoBoard, operation, comments
export function updateBook() { //temporary export, might not be necessary
	bookPos = getCurrentPosition()
	book[bookPos] = {
		board: JSON.stringify(board),
		minoBoard: JSON.stringify(minoModeBoard),
		comment: document.getElementById('commentBox').value,
		operation: operation,
		flags: {lock: document.getElementById('lockFlagInput').checked},
	}
	document.getElementById('commentBox').value = (book[bookPos]['comment'] != undefined ? book[bookPos]['comment'] : '')

	undoLog.push(JSON.stringify(book))
	//Limit undos to 100 entries
	if(undoLog.length > 100){
		undoLog.shift()
	}

	//Clearing redo if branch is overwritten
	redoLog = [];

	setPositionDisplay(bookPos, book.length)
	updateAutoColor()
	window.requestAnimationFrame(renderBoard)
}

document.getElementById("shiftLeft").addEventListener("click", function() {shift('left')} )
document.getElementById("shiftUp").addEventListener("click", function() {shift('up')} )
document.getElementById("shiftDown").addEventListener("click", function() {shift('down')} )
document.getElementById("shiftRight").addEventListener("click", function() {shift('right')} )
function shift(direction){
	switch(direction) {
		case 'left':		
				board.map((y) => {
					y.shift()
					y.push({t: 0, c: ''})
				})
			break;
		case 'up':
				board.shift()
				board.push(JSON.parse(JSON.stringify(aRow)))
			break;
		case 'down':
				board.unshift(JSON.parse(JSON.stringify(aRow)))
				board.pop()
			break;
		case 'right':
				board.map((y) => {
					y.unshift({t: 0, c: ''})
					y.pop()
				})
			break;
	}
	updateBook()
}

document.getElementById("undo").addEventListener("click", undo)
function undo() {
	bookPos = getCurrentPosition()
	if (undoLog.length <= 1){
		console.log('No previous actions logged')
	} else {
		redoLog.push(undoLog.pop())
		book = JSON.parse(undoLog[undoLog.length-1])
		// console.log(bookPos, book.length-1)
		bookPos = Math.min(bookPos, book.length-1) // Bound bookPos to end of book, temporary measure
		
		settoPage(bookPos)
	}
	window.requestAnimationFrame(renderBoard)
}

document.getElementById("redo").addEventListener("click", redo)
function redo() {
	bookPos = getCurrentPosition()
	if (redoLog.length == 0){
		console.log('No following actions logged')
	} else {
		undoLog.push(redoLog.pop())
		book = JSON.parse(undoLog[undoLog.length-1])
		settoPage(bookPos)
	}
	window.requestAnimationFrame(renderBoard)
}

for (let fumenOption in document.getElementsByClassName('fumen-option')) {
	fumenOption.addEventListener("click", () => this.blur)
}

//MIRRORING
const reversed = {Z: 'S',L: 'J',O: 'O',S: 'Z',I: 'I',J: 'L',T: 'T',X: 'X'};
document.getElementById("mirrorPage").addEventListener("click", mirror)
function mirror() {
	for (row = 0; row < board.length; row++) {
		board[row].reverse();
		for (i = 0; i < board[row].length; i++) {
			if (board[row][i].t == 1) board[row][i].c = reversed[board[row][i].c];
		}
	}
	updateBook();
	window.requestAnimationFrame(renderBoard);
}

document.getElementById("mirrorFumen").addEventListener("click", fullMirror)
function fullMirror() {
	for (let page in book) {
		var tempBoard = JSON.parse(book[page]['board']);
		for (let row in tempBoard) {
			tempBoard[row].reverse();
			for (let col in tempBoard[row]) {
				if (tempBoard[row][col].t == 1) tempBoard[row][col].c = reversed[tempBoard[row][col].c];
			}
		}
		book[page]['board'] = JSON.stringify(tempBoard);
	}
	board = tempBoard;
	updateBook();
	window.requestAnimationFrame(renderBoard);
}

document.getElementById("duplicatePage").addEventListener("click", dupliPage)
function dupliPage(){
	bookPos = getCurrentPosition()
	solidifyAutoColor(bookPos)
	insertFollowingPage(bookPos)
	//technically you don't need to update since it's the same page
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("clearPage").addEventListener("click", clearPage)
function clearPage(){
	bookPos = getCurrentPosition()
	book[bookPos] = {
		board: JSON.stringify(emptyBoard),
		minoBoard: JSON.stringify(emptyBoard),
		comment: '',
		operation: undefined,
		flags: flags
	}
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("deletePage").addEventListener("click", deletePage)
function deletePage(){
	bookPos = getCurrentPosition()
	if(book.length == 1){
		clearPage()
	} else {
		book.splice(bookPos,1)
		bookPos = Math.min(bookPos,book.length-1) // Bound bookPos to end of book
		settoPage(bookPos)
	}
	window.requestAnimationFrame(renderBoard)
	autoEncode()
}

document.getElementById("reset").addEventListener("click", increaseResetLevel)
function increaseResetLevel() {
	let confirmedReset = document.getElementById('reset').classList.contains('confirm-delete-data')
	if (confirmedReset)  {
		board = JSON.parse(JSON.stringify(emptyBoard))
		minoModeBoard = JSON.parse(JSON.stringify(emptyBoard))
		book = [{board: JSON.parse(JSON.stringify(emptyBoard)), flags: flags}]
		setPositionDisplay(0, book.length)
		document.getElementById('boardOutput').value = ''
		document.getElementById('commentBox').value = ''
		comments = []
		updateBook() // record initial state in logs, testing
		autoEncode()
		window.requestAnimationFrame(renderBoard)
	}
	document.getElementById('reset').classList.toggle('confirm-delete-data')
}

function decodeFumen() {
	var fumen = document.getElementById('boardOutput').value;
    var pages = decoder.decode(fumen);
    var tempBook = pages.map(page => {
		return {
			board: JSON.stringify(pageToBoard(page)),
			operation: page['operation'],
			minoBoard: JSON.stringify(decodeOperation(page['operation'])),
			comment: page['comment'],
			flags: page['flags'],
		}
	});
	
	return tempBook;
}

function decodeOperation(operation){
	if (operation === undefined) return JSON.parse(JSON.stringify(emptyBoard)) //no operation

	decodedMinoBoard = JSON.parse(JSON.stringify(emptyBoard))
	let pieceColor = operation.type
	let rotation = operation.rotation
	let x = operation.x
	let y = 19 - operation.y //fumen has inverted y axis
	
	piecePositions = shape_table[pieceColor][rotation]
	for (let piecePosition of piecePositions) {
		decodedMinoBoard[y + piecePosition[0]][x + piecePosition[1]] = { t: 1, c: pieceColor }
	}
	
	return decodedMinoBoard
}

document.getElementById("insertFumen").addEventListener("click", decodeInsert)
function decodeInsert() {
    bookPos = getCurrentPosition()
	var bookInsert = decodeFumen()
	book.splice(bookPos, 0, ...bookInsert)
	settoPage(bookPos)
	updateBook()
	window.requestAnimationFrame(renderBoard)
};

document.getElementById("importFumen").addEventListener("click", fullDecode)
function fullDecode() {
	book = decodeFumen();
	bookPos = 0;
	settoPage(bookPos)
	window.requestAnimationFrame(renderBoard);
};

document.getElementById("encodingType").addEventListener("change", autoEncode) //TODO: bind elements to autoencode, instead of calling from the function
function autoEncode() {
	if (document.getElementById('autoEncode').checked == false) return;

	let encodingType = document.getElementById('encodingType').value;
	
	if (encodingType == 'fullFumen') fullEncode();
	else if (encodingType == 'currentFumenPage') encode();
}

function encodeFumen(...book) {
	var fullBook = []
	for (let pageNum in book) {
		let page = book[pageNum]
		fullBook.push({
			comment: page['comment'],
			operation: page['operation'],
			field: toField(JSON.parse(page['board'])),
			flags: {
				rise: false,
				mirror: false,
				colorize: true,
				comment: page['comment'],
				lock: page['flags']['lock'],
				piece: undefined,
			},
			index: pageNum, //necessary?
		});
	}
	return encoder.encode(fullBook)
}

document.getElementById("exportPage").addEventListener("click", encode)
function encode() {
	bookPos = getCurrentPosition()
	document.getElementById('boardOutput').value = encodeFumen(book[bookPos]);
}

document.getElementById("exportFumen").addEventListener("click", fullEncode)
function fullEncode() {
	document.getElementById('boardOutput').value = encodeFumen(...book);
}

document.getElementById("addToInput").addEventListener("click", addToInput)
function addToInput() {
	document.getElementById('input').value += getDelimiter() + document.getElementById('boardOutput').value
}

document.getElementById("autoEncode").addEventListener("click", updateAutoEncoding)
function updateAutoEncoding() {
	var boardOutput = document.getElementById('boardOutput')
	var isAutoEncode = document.getElementById('autoEncode').checked
	document.getElementById('autoEncodeOptions').classList.toggle('hide-element', !isAutoEncode)
	if (isAutoEncode) {
		boardOutput.style.height = 50
		autoEncode()
	} else {
		boardOutput.style.height = 79
	}
}

document.getElementById("autoColorInput").addEventListener("click", updateAutoColor)
function updateAutoColor() {
	var autoColorBool = document.getElementById('autoColorInput').checked
	var isAutoColorUsable = !document.getElementById('minoModeInput').checked
	document.getElementById('autoColorInput').classList.toggle('disabled', !isAutoColorUsable)
	updateRowFillInput()
	if(!(isAutoColorUsable && autoColorBool)) {
		for (let row in board) {
			for (let col in board[row]) {
				if (board[row][col].t === 2){
					board[row][col].t = 1 //solidify any minos
				}
			}
		}
	}
}

document.getElementById("tooltipSetting").addEventListener("click", updateToolTips)
function updateToolTips() {
	var tooltipTextElements = document.getElementsByClassName('tooltiptext')
	var enableToolTips = document.getElementById('tooltipSetting').checked
	for (let tooltipTextElement of tooltipTextElements) {
		tooltipTextElement.classList.toggle('hide-element', !enableToolTips)
	}
}

document.getElementById("defaultRenderInput").addEventListener("click", updateStyle)
function updateStyle() {
	document.getElementById('3dToggle').classList.toggle('disabled', document.getElementById('defaultRenderInput').checked)
	requestAnimationFrame(renderBoard)
}

//FUMEN EDITOR BINDINGS
var mouseHeld = false
var drawMode = true

document.getElementById('b').onmousedown = function mousedown(e) {
	var autoColorBool = document.getElementById('autoColorInput').checked
	bookPos = getCurrentPosition()
	let rect = document.getElementById('b').getBoundingClientRect()
	let cellRow = Math.floor((e.clientY - rect.top) / cellSize)
	let cellCol = Math.floor((e.clientX - rect.left) / cellSize)

	drawMode = (e.button === 0 && board[cellRow][cellCol]['c'] !== paintbucketColor() && minoModeBoard[cellRow][cellCol]['t'] === 0)

	let positions = []
	for (let row in board){
		for (let col in board[row]) {
			if (board[row][col].t == 2){
				positions.push([row,col])
			}
		}
	}
	if (drawMode && autoColorBool && positions.length == 4) {
		//solidify piece
		for (let position of positions) {
			board[position[0]][position[1]].t = 1
		}
	}
	drawCanvasCell(cellRow, cellCol)

	updateBook()
	autoEncode()
	requestAnimationFrame(renderBoard)
	mouseHeld = true
}

document.getElementById('b').onmousemove = function mousemove(e) {
	bookPos = getCurrentPosition()
	rect = document.getElementById('b').getBoundingClientRect()

	let cellRow = Math.floor((e.clientY - rect.top) / cellSize)
	let cellCol = Math.floor((e.clientX - rect.left) / cellSize)
	
	let marginX = (e.clientX - rect.left) % cellSize
	let marginY = (e.clientY - rect.top) % cellSize
	
	let inSameCell = inRange(marginX-e.movementX, 0, cellSize-1) && inRange(marginY-e.movementY, 0, cellSize-1) // check if previous position crossed cell boundary
	// now triggers even when re-entering the same cell, but the effect is inconsequential
	let updateCanvas = mouseHeld && !inSameCell
    if (!updateCanvas) return;
	
	drawCanvasCell(cellRow, cellCol)
	
	updateBook()
	autoEncode()
	requestAnimationFrame(renderBoard)
}

function drawCanvasCell(cellRow, cellCol) {
	var minoMode = document.getElementById('minoModeInput').checked
	var autoColorBool = document.getElementById('autoColorInput').checked
	if (minoMode) {
		drawCanvasMinoMode()
	} else if (autoColorBool) {
		drawCanvasAutoColorMode()
	} else {
		drawCanvasNormalMode()
	}

	function drawCanvasMinoMode() {
		let drawnCount = drawnMinos(minoModeBoard, (cell) => cell.t !== 0) //should be equivalent to cell.t == 1

		if (drawMode && drawnCount < 4 && board[cellRow][cellCol].t == 0) {
			minoModeBoard[cellRow][cellCol] = {t: 1, c: 'X'}
		}
		
		if (!drawMode) {
			minoModeBoard[cellRow][cellCol] = {t: 0, c: ''}
			//remove colors when there are four minos and user deletes one
			if (drawnCount == 4) {
				for (let row in minoModeBoard){
					for (let col in minoModeBoard[row]) {
						if(minoModeBoard[row][col].t != 0) {
							minoModeBoard[row][col].c = 'X'
						}
					}
				}
			}
		}
	}
	
	function drawCanvasNormalMode() {
		let rowFill = document.getElementById('rowFillInput').checked
		if (rowFill) {
			for (let col in board[cellRow]) {
				board[cellRow][col] = (drawMode ? { t: 1, c: paintbucketColor() } : { t: 0, c: '' })
			}
			board[cellRow][cellCol] = { t: 0, c: '' }
		} else {
			board[cellRow][cellCol] = (drawMode ? { t: 1, c: paintbucketColor() } : { t: 0, c: '' })
		}
	}
	
	function drawCanvasAutoColorMode() {
		//auto color is basically mino mode and normal combined.
		if (drawMode) {
			//recognise piece
			let positions = []
			for (let row = 0; row < boardSize[1]; row++){
				for (let col = 0; col < boardSize[0]; col++) {
					if(board[row][col].t == 2) {
						positions.push([row,col])
					}
				}
			}

			if (positions.length < 4) {
				board[cellRow][cellCol] = { t: 2, c: 'X' }
				positions.push([cellRow,cellCol])
			}
			
			if (positions.length === 4) {
				let pieceMino = readPiece(positions, true)
				if (pieceMino === undefined) return; // remain gray

				for (let position of positions) {
					board[position[0]][position[1]].c = pieceMino.type
				}
			}
		} else {
			board[cellRow][cellCol] = { t: 0, c: '' }
		}
	}
}

document.onmouseup = function mouseup() {
	var minoMode = document.getElementById('minoModeInput').checked
	bookPos = getCurrentPosition() //used by program, only updates bookPos
	
	if (minoMode) finishMinoMode()
	
    mouseHeld = false
	updateBook()
	//autoEncode() prevent overwriting text pasted into textboxes
    requestAnimationFrame(renderBoard)

	function finishMinoMode() {
		var positions = []
		//get all drawn cells + their coords
		for (let row in minoModeBoard){
			for (let col in minoModeBoard[row]) {
				if(minoModeBoard[row][col].t != 0){
					positions.push([row,col])
				}	
			}
		}

		if(positions.length != 4) return;

		operation = readPiece(positions, false)
		if (operation === undefined) return;
		
		//coloring in
		for (let position of positions) {
			minoModeBoard[position[0]][position[1]].c = operation.type
		}
	}
}

function getCurrentPosition() {
	let Position = parseInt(document.getElementById('positionDisplay').value)-1
	if (isNaN(Position)) return 0
	else return Position
}