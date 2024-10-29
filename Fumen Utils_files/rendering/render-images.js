const { decoder } = require('tetris-fumen');
import { LineTerminator } from "../global-utils.js"
import fumencanvas from "./board-render-four.js"
import fumenrender from "./board-render-fumen.js"

function downloadByURL(DataURLs) {
    var zip = new JSZip();
    let promises = DataURLs.map((DataURL, i) => {
        return new Promise((resolve, reject) => {
            let filetype = /image\/(.+);/.exec(DataURL)[1]
            JSZipUtils.getBinaryContent(DataURL, (err, data) => { //async
                if (err) {
                    reject(err)
                }

                var fileNaming = document.getElementById('naming').value
                if (fileNaming == "index") {
                    var filename = (i + 1) + '.' + filetype
                } else if (fileNaming == "fumen") {
                    var filename = fumenCodes[i] + '.' + filetype;
                }

                zip.file(filename, data, { base64: true });
                resolve()
            });
        })
    })
    // console.log(promises)
    Promise.allSettled(promises).then(() => {
        zip.generateAsync({ type: 'blob' }).then(blob => {
            saveAs(blob, "output.zip");
            console.log("downloaded");
        });
    })
}

export default function renderImages() {
    var input = document.getElementById('input').value.replace(/[Ddm]115@/gm, 'v115@')
    let fumenCodes = input.trim().split(LineTerminator);

    var container = document.getElementById('imageOutputs');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    var convertedFumens = fumenCodes.map(fumenCode => {
        try {
            var pages = decoder.decode(fumenCode)
        } catch (error) { console.log(fumenCode, error) }
        return { code: fumenCode, pages: pages }
    }).filter(convertedFumen => convertedFumen.pages !== undefined) //only keep conversions with valid fumens

    //wasteful map
    let fumens = convertedFumens.map(convertedFumen => convertedFumen.pages)
    fumenCodes = convertedFumens.map(convertedFumen => convertedFumen.code)

    // console.log(fumens)

    let startTime = performance.now()
    switch (document.getElementById('renderStyle').value) {
        case 'four': var { figures, resultURLs } = fumencanvas(fumens); break;
        case 'fumen': var { figures, resultURLs } = fumenrender(fumens); break;
        default: console.log("Invalid rendering style.")
    }
    console.log("Finished in " + String(performance.now() - startTime) + "ms")

    if (!document.getElementById("fixedOutputRows").checked) {
        let rowNum = document.getElementById("outputRows").valueAsNumber
        for (let i = 0; i < figures.length; i += rowNum) {
            console.log(i, i + rowNum)
            let row = document.createElement('div')
            row.id = "rowOutput"
            row.append(...figures.slice(i, i + rowNum))
            container.appendChild(row)
        }
    } else {
        container.append(...figures)
    }

    let downloadBool = document.getElementById('downloadOutput').checked;
    if (downloadBool) downloadByURL(resultURLs)
}