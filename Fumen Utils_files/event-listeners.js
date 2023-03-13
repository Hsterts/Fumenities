import { pageToBoard } from "./board-render.js"
import { getCurrentPosition } from "./fumen-editor-mouse.js"





//INITIALIZATION
updateAutoColor()
updateRowFillInput() //unnecessary
updateAutoEncoding()
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

import "./fumenutil-buttons.js"

function settoPage(newPagePos) {
	// Bound bookPos to existing pages
	newPagePos = Math.max(Math.min(book.length-1, newPagePos), 0)

	setPositionDisplay(newPagePos, book.length)
	board = JSON.parse(book[newPagePos]['board'])
	minoModeBoard = JSON.parse(book[newPagePos]['minoBoard'])
	document.getElementById('commentBox').value = book[newPagePos]['comment']
	operation = book[newPagePos]['operation']
	document.getElementById('lockFlagInput').checked = book[newPagePos]['flags']['lock']
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



