import { emptyBoard } from "../global-utils.js"

// keeps track of everything the board can display
const emptyBook = [{board: JSON.stringify(emptyBoard()), minoBoard: JSON.stringify(emptyBoard()), comment: '', operation: undefined, flags: {lock: true}},]

//TODO: encoding and decoding of board state should be done here, not in fumen-editor
export let EditorState = {
    bookPos: 0, //TODO: make it so that when bookPos is changed, it automatically changes the displayed stuff below
	board: emptyBoard(),
	minoModeBoard: emptyBoard(), //TODO: might be better to keep minoModeBoard as an array denoting the position of at most 4 cells
    //comment?
	operation: undefined, // {type: 'I', rotation: 'reverse', x: 4, y: 0}
	flags: {lock: true},

    book: emptyBook,
	// book: this.resetBook(),
	undoLog: [], //TODO: undo + redo -> Log + pointer?
	redoLog: [],

    setBookPos(bookPos) { //currently overused, TODO: reduce usage
        this.bookPos = bookPos
    },
    //should only update when: changed internally or change manually from positionDisplay

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

    setBook(book) {
        this.book = book
    },

    resetBook() {
        this.book = emptyBook
    },

    undo() {
        this.bookPos = getCurrentPosition()
        if (this.undoLog.length <= 1){
            console.log('No previous actions logged')
        } else {
            this.redoLog.push(this.undoLog.pop())
            this.book = JSON.parse(this.undoLog[this.undoLog.length-1])
            // console.log(bookPos, book.length-1)
            this.bookPos = Math.min(this.bookPos, this.book.length-1) // Bound bookPos to end of book, temporary measure
            
            settoPage(this.bookPos)
        }
    },

    redo() {
        this.bookPos = getCurrentPosition()
        if (this.redoLog.length == 0){
            console.log('No following actions logged')
        } else {
            this.undoLog.push(this.redoLog.pop())
            this.book = JSON.parse(this.undoLog[this.undoLog.length-1])
            settoPage(this.bookPos)
        }
    },
}