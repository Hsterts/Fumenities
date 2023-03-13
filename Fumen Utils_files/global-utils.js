export function getDelimiter() {
    return document.getElementById('delim').value
}

export const cellSize = 22
export const boardSize = [10, 20]
export const LineTerminator = RegExp("[\\s,;]+")

//PIECE MAPS
//table is a (row, col) pair sorted ascending by col then row, with right and down being the positive x and y axis. origin placed at the rotation axis of the piece
export const shape_table = {
	'T': {
		'spawn'  : [[-1, 0], [0, -1], [0, 0], [0, 1]],
		'right'  : [[-1, 0], [0, 0], [0, 1], [1, 0]],
		'reverse': [[0, -1], [0, 0], [0, 1], [1, 0]],
		'left'   : [[-1, 0], [0, -1], [0, 0], [1, 0]],
	}, 
	'I': {
		'spawn'  : [[0, -1], [0, 0], [0, 1], [0, 2]],
		'right'  : [[-1, 0], [0, 0], [1, 0], [2, 0]],
		'reverse': [[0, -2], [0, -1], [0, 0], [0, 1]],
		'left'   : [[-2, 0], [-1, 0], [0, 0], [1, 0]],
	}, 
	'L': {
		'spawn'  : [[-1, 1], [0, -1], [0, 0], [0, 1]],
		'right'  : [[-1, 0], [0, 0], [1, 0], [1, 1]],
		'reverse': [[0, -1], [0, 0], [0, 1], [1, -1]],
		'left'   : [[-1, -1], [-1, 0], [0, 0], [1, 0]],
	}, 
	'J': {
		'spawn'  : [[-1, -1], [0, -1], [0, 0], [0, 1]],
		'right'  : [[-1, 0], [-1, 1], [0, 0], [1, 0]],
		'reverse': [[0, -1], [0, 0], [0, 1], [1, 1]],
		'left'   : [[-1, 0], [0, 0], [1, -1], [1, 0]],
	}, 
	'S': {
		'spawn'  : [[-1, 0], [-1, 1], [0, -1], [0, 0]],
		'right'  : [[-1, 0], [0, 0], [0, 1], [1, 1]],
		'reverse': [[0, 0], [0, 1], [1, -1], [1, 0]],
		'left'   : [[-1, -1], [0, -1], [0, 0], [1, 0]],
	}, 
	'Z': {
		'spawn'  : [[-1, -1], [-1, 0], [0, 0], [0, 1]],
		'right'  : [[-1, 1], [0, 0], [0, 1], [1, 0]],
		'reverse': [[0, -1], [0, 0], [1, 0], [1, 1]],
		'left'   : [[-1, 0], [0, -1], [0, 0], [1, -1]],
	}, 
	'O': {
		'spawn'  : [[-1, 0], [-1, 1], [0, 0], [0, 1]],
		'right'  : [[0, 0], [0, 1], [1, 0], [1, 1]],
		'reverse': [[0, -1], [0, 0], [1, -1], [1, 0]],
		'left'   : [[-1, -1], [-1, 0], [0, -1], [0, 0]],
	}
}

export function inRange(number, min, max) { // [min, max] inclusive
    return (min <= number && number <= max)
}