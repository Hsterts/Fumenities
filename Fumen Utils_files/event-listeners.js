import "./fumen-editor/fumen-editor.js"
import "./fumen-editor/fumen-editor-mouse.js"
import "./fumen-editor/fumen-editor-buttons.js"
import "./fumenutil/fumenutil-buttons.js"

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


