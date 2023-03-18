import { emptyBoard } from "../global-utils.js"
import { autoEncode, settoPage } from "./fumen-editor.js"
import { renderBoard } from "../rendering/board-render.js"

// keeps track of everything the board can display

function emptyPage() {
    return {board: JSON.stringify(emptyBoard()), minoBoard: JSON.stringify(emptyBoard()), comment: '', operation: undefined, flags: {lock: true}}
}
const emptyBook = [emptyPage(),]

let displayState = { //move bookPos, board, minoModeBoard, comment, operation, flags here

}

//TODO: encoding and decoding of board state should be done here, not in fumen-editor
export let EditorState = {
    bookPos: 0, //TODO: make it so that when bookPos is changed, it automatically changes the displayed stuff below
    //and also update unpacked page if book is altered (and vice versa)?
	board: emptyBoard(),
	minoModeBoard: emptyBoard(), //TODO: might be better to keep minoModeBoard as an array denoting the position of at most 4 cells
    //comment?
	operation: undefined, // {type: 'I', rotation: 'reverse', x: 4, y: 0}
	flags: {lock: true},

    book: JSON.parse(JSON.stringify(emptyBook)),
	undoLog: [], //TODO: undo + redo -> Log + pointer?
	redoLog: [],

    setBookPos(bookPos) { //currently overused, TODO: reduce usage
        this.bookPos = Math.min(this.book.length-1, Math.max(0, bookPos))
        settoPage(this.bookPos)
        // window.requestAnimationFrame(renderBoard)
        // autoEncode()
    },

    setBoard(board) {
        this.board = board
    },

    solidifyBoard() {
        for (let row in this.board) {
			for (let col in this.board[row]) {
				if (this.board[row][col].t === 2){
					this.board[row][col].t = 1 //solidify any minos
				}
			}
		}
    },

	setMinoModeBoard(minoModeBoard) {
		this.minoModeBoard = minoModeBoard
	},

	setOperation(operation) {
		this.operation = operation
	},

    addLog() {
        this.undoLog.push(JSON.stringify(this.book))
        //Limit undos to 100 entries
        if(this.undoLog.length > 100){
            this.undoLog.shift()
        }

        //Clearing redo since it is overwritten
        this.redoLog = [];
    },

    setBook(book) { //TODO: should be reduced, push changes from board/minoboard/etc. instead
        this.book = book
    },

    resetBook() {
        this.book = JSON.parse(JSON.stringify(emptyBook))
    },

    undo() {
        if (this.undoLog.length <= 1){
            console.log('No previous actions logged')
        } else {
            this.redoLog.push(this.undoLog.pop())
            this.book = JSON.parse(this.undoLog[this.undoLog.length-1])
            this.bookPos = Math.min(this.bookPos, this.book.length-1) // Bound bookPos to end of book, temporary measure
            settoPage(this.bookPos)
        }
    },

    redo() {
        if (this.redoLog.length == 0){
            console.log('No following actions logged')
        } else {
            this.undoLog.push(this.redoLog.pop())
            this.book = JSON.parse(this.undoLog[this.undoLog.length-1])
            settoPage(this.bookPos)
        }
    },
}