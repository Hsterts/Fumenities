const { decoder } = require('tetris-fumen');
import { LineTerminator } from "../global-utils.js"
import fumencanvas from "./modified-fumen-canvas.js"
import fumenrender from "./modified-fumen-render.js"

function downloadByURL(DataURLs) {
    var zip = new JSZip();
    DataURLs.forEach((DataURL, i) => {
        let filetype = RegExp('image/(.+);').exec(DataURL)[1]
        JSZipUtils.getBinaryContent(DataURL, function (err, data){
            if (err) {
                console.log(err)
                return
            } 
            
            var fileNaming = document.getElementById('naming').value
            if (fileNaming == "index"){
                var filename = (i+1)+filetype
            } else if (fileNaming == "fumen") {
                var filename = fumenCodes[i]+filetype;
            }
            
            zip.file(filename, data, {base64:true});
        });
    })

    zip.generateAsync({type:'blob'}).then(function(base64){
        saveAs(base64, "output.zip");
        console.log("downloaded");
    });
}

export default function renderImages() {
    var input = document.getElementById('input').value.replace(/[Ddm]115@/gm,'v115@')
    let fumenCodes = input.trim().split(LineTerminator);
    
	var container = document.getElementById('imageOutputs');
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}

	var convertedFumens = fumenCodes.map(fumenCode => {
		try {
			var pages = decoder.decode(fumenCode)
		} catch (error) { console.log(fumenCode, error) }
		return {code: fumenCode, pages: pages}
	}).filter(convertedFumen => convertedFumen.pages !== undefined) //only keep conversions with valid fumens

	//wasteful map
	let fumens = convertedFumens.map(convertedFumen => convertedFumen.pages)
	fumenCodes = convertedFumens.map(convertedFumen => convertedFumen.code)

	// console.log(fumens)

	switch (document.getElementById('renderStyle').value){
		case 'four': var resultURLs = fumencanvas(fumens); break;
		case 'fumen': var resultURLs = fumenrender(fumens); break;
	}

	let downloadBool = document.getElementById('downloadOutput').checked;
	if (downloadBool) downloadByURL(resultURLs)
}