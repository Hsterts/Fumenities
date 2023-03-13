import "./Fumen Utils_files/event-listeners.js"

//depreciated functions
//gonna just leave this here, used it to convert wirelyre mino-board strings to fumens
function wireEncode(){
    inputs = document.getElementById('input').value.split('\n')
	outputs = []
	for(let i = 0; i < inputs.length; i++){
		outputs.push(encodeString(inputs[i]))
	}
	document.getElementById('output').value = outputs.join('\n')
}

import { emptyBoard } from "./Fumen Utils_files/global-utils.js"
function encodeString(fieldString) {
	var pages = []
	var fieldArray = emptyBoard()
	fieldArray.splice(16, 4)
	var rows = fieldString.split(',')

	for (let i = 0; i < 4; i++){
		let row = []
		for (let j = 0; j < 10; j++){
			let mino = {c: rows[i].split('')[j]}
			row.push(mino)
		}
		fieldArray.push(row)
	}

	var field = toField(fieldArray)
	var page = {field}
	pages.push(page)

	return encoder.encode(pages)
}

const { Field } = require('tetris-fumen');
function toField(board) { //only reads color of minos, ignoring the type
    var FieldString = ''
	for (let row of board) {
		for (let cell of row) {
			FieldString += (cell.c == '' ? '_' : cell.c)
		}
	}
    return Field.create(FieldString)
}