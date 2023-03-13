import glueFumen from "./modified-glueFumen.js"
import unglueFumen from "./modified-unglueFumen.js"
import mirrorFumen from "./modified-mirrorFumen.js"
import combineFumen from "./modified-combineFumen.js"
import splitFumen from "./modified-splitFumen.js"
import removeComments from "./modified-removeComments.js"
import renderImages from "../rendering/render-images.js"

//INITIALIZATION
updateBGSelect()
updateDownloadSettings()
updateGrid()

//SHORTCUTS
Mousetrap.bind({
    'backspace': increaseClearInputLevel,
	'g': glueFumen,
	'u': unglueFumen,
	'm': mirrorFumen,
	'c': combineFumen,
	's': splitFumen,
	'R c': removeComments,
	'enter': renderImages,
	
	'shift+enter': moveOutputToInput,
})

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