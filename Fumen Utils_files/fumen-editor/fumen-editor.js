import { boardSize, cellSize } from '../global-utils.js'
import { exportFumen, exportPage } from './fumen-editor-buttons.js';

//BOARD

// CANVAS
document.getElementById('b').height = boardSize[1] * cellSize
document.getElementById('b').width = boardSize[0] * cellSize
document.getElementById('b').style.outline = '2px solid #ffffffcc'


//SHORTCUTS
Mousetrap.bind({
	'esc': function () { decreaseResetLevel(); decreaseseClearInputLevel(); },
	'=': expandSidebars,
	'-': retractSidebars,
})

//mousetrap-exclusive bindings
function decreaseResetLevel() {
	document.getElementById('reset').classList.remove('confirm-delete-data')
}

function decreaseseClearInputLevel() {
	document.getElementById('clear-input').classList.remove('confirm-delete-data')
}

document.getElementById("toggleFumenSettings").addEventListener("click", toggleFumenSettings)
function toggleFumenSettings() {
	var fumenSettings = document.getElementById('settingsSidebar')
	if (fumenSettings.classList.contains('hide-element')) {
		expandSidebars()
	} else {
		retractSidebars()
	}
}

function expandSidebars() {
	var fumenSettings = document.getElementById('settingsSidebar')
	var settingsButton = document.getElementsByClassName('option-left')[0]
	var openLogo = document.getElementById('openFumenSettings')
	var closeLogo = document.getElementById('closeFumenSettings')

	fumenSettings.classList.remove('hide-element')
	settingsButton.style.right = '209px'
	settingsButton.style.borderBottomLeftRadius = '0px'
	settingsButton.style.borderBottomRightRadius = '10px'
	openLogo.style.display = 'none'
	closeLogo.style.display = 'block'
}

function retractSidebars() {
	var fumenSettings = document.getElementById('settingsSidebar')
	var settingsButton = document.getElementsByClassName('option-left')[0]
	var openLogo = document.getElementById('openFumenSettings')
	var closeLogo = document.getElementById('closeFumenSettings')

	fumenSettings.classList.add('hide-element')
	settingsButton.style.right = '0px'
	settingsButton.style.borderBottomRightRadius = '0px'
	settingsButton.style.borderBottomLeftRadius = '10px'
	openLogo.style.display = 'block'
	closeLogo.style.display = 'none'
}

export function autoEncode() {
	if (document.getElementById('autoEncode').checked == false) return;

	let encodingType = document.getElementById('encodingType').value;

	if (encodingType == 'fullFumen') exportFumen();
	else if (encodingType == 'currentFumenPage') exportPage();
}