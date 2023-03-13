import { emptyBoard } from "../global-utils.js"

// keeps track of everything the board can display

export let EditorState = {
	board: emptyBoard(), // the lazy way of doing a deep copy
	minoModeBoard: emptyBoard(), //might be better to keep minoModeBoard as an array denoting the position of at most 4 cells
	book: [],
	undoLog: [],
	redoLog: [],
	operation: undefined, // {type: 'I', rotation: 'reverse', x: 4, y: 0}
	flags: {lock: true},

	getMinoModeBoard: function() {
		return this.minoModeBoard
	},

	setMinoModeBoard: function(minoModeBoard) {
		this.minoModeBoard = minoModeBoard
	},

	getOperation: function() {
		return this.operation
	},

	setOperation: function(operation) {
		this.operation = operation
	},
}