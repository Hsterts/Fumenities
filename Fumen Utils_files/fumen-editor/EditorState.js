import { emptyBoard, cellSize } from "../global-utils.js"
import { autoEncode } from "./fumen-editor.js"
import { renderBoardOnCanvas } from "../rendering/board-render.js"

// keeps track of everything the board can display

export let displayState = { //move board, minoModeBoard, comment, operation, flags here
    board: emptyBoard(),
	minoModeBoard: emptyBoard(), //TODO: might be better to keep minoModeBoard as an array denoting the position of at most 4 cells
    comment: '', //TODO: use this to store comments
	operation: undefined, // {type: 'I', rotation: 'reverse', x: 4, y: 0}
	flags: {lock: true},

    setState(newState) { //automatically renders and updates book
        let {board, minoModeBoard, comment, operation, flags} = newState
        //only update if property is defined
        this.board = board ?? this.board
        this.minoModeBoard = minoModeBoard ?? this.minoModeBoard
        this.comment = comment ?? this.comment
        this.operation = operation ?? this.operation
        this.flags = flags ?? this.flags
        
        window.requestAnimationFrame(() => this.display())
    },

    display() {
        //render board
        var combinedBoardStats = {
            board: JSON.parse(JSON.stringify(displayState.board)), 
            tileSize: cellSize, 
            style: (document.getElementById('defaultRenderInput').checked ? 'fumen' : 'four'),
            lockFlag: displayState.flags.lock,
            grid: {
                fillStyle: '#000000',
                strokeStyle: '#ffffff'
            },
        }
        
        //combine board and minomodeBoard
        let minoModeBoard = this.minoModeBoard
        for (let row in minoModeBoard) {
            for (let col in minoModeBoard[row]) {
                if (minoModeBoard[row][col].t === 1) combinedBoardStats.board[row][col] = { t: 2, c: minoModeBoard[row][col].c }
            }
        }
    
        let context = document.getElementById('b').getContext('2d')
        context.imageSmoothingEnabled = false // no anti-aliasing
        context.drawImage(renderBoardOnCanvas(combinedBoardStats), 0, 0)

        document.getElementById('commentBox').value = this.comment
        document.getElementById('lockFlagInput').checked = this.flags.lock
        document.getElementById('positionDisplay').value = bookState.bookPos+1 //display is one-indexed
        document.getElementById('positionDisplayOver').value = '/' + bookState.book.length

        autoEncode()
    },
}

function emptyPage() {
    return {board: JSON.stringify(emptyBoard()), minoModeBoard: JSON.stringify(emptyBoard()), comment: '', operation: undefined, flags: {lock: true}}
}
const emptyBook = [emptyPage(),]

export let bookState = {
    bookPos: 0, 
    book: JSON.parse(JSON.stringify(emptyBook)),

    displayBookPage(bookPos) {
        this.bookPos = Math.max(Math.min(this.book.length-1, bookPos), 0)
        
        displayState.setState({
            board: JSON.parse(this.book[this.bookPos]['board']), 
            minoModeBoard: JSON.parse(this.book[this.bookPos]['minoModeBoard']),
            comment: this.book[this.bookPos]['comment'],
            operation: this.book[this.bookPos]['operation'],
            flags: this.book[this.bookPos]['flags'],
        })
    },

    solidifyBoard() { //turns autoColor cells into normal cells
        let board = JSON.parse(this.book[this.bookPos]['board'])
        for (let row in board) {
			for (let col in board[row]) {
				if (board[row][col].t === 2){
					board[row][col].t = 1 //solidify any minos
				}
			}
		}
        this.updateCurrentPage({board: board})
    },

    setBook(book, propagate=true) { //automatically displays pages
        this.book = book
        this.displayBookPage(this.bookPos)
        if (propagate) historyState.addLog(this.book)
    },

    updateCurrentPage(newDisplayState) {
        console.log(newDisplayState.minoModeBoard?.[0]?.[0])
        this.book[this.bookPos]['board'] = JSON.stringify(newDisplayState.board) ?? this.book[this.bookPos]['board']
        this.book[this.bookPos]['minoModeBoard'] = JSON.stringify(newDisplayState.minoModeBoard) ?? this.book[this.bookPos]['minoModeBoard']
        this.book[this.bookPos]['comment'] = newDisplayState.comment ?? this.book[this.bookPos]['comment']
        this.book[this.bookPos]['operation'] = newDisplayState.operation ?? this.book[this.bookPos]['operation']
        this.book[this.bookPos]['flags'] = newDisplayState.flags ?? this.book[this.bookPos]['flags']

        this.displayBookPage(this.bookPos)

        historyState.addLog(this.book)
    },

    resetBook() {
        this.setBook(JSON.parse(JSON.stringify(emptyBook)))
    },
}

export let historyState = {
    undoLog: [], //TODO: undo + redo -> Log + pointer?
	redoLog: [],

    addLog(book) {
        this.undoLog.push(JSON.stringify(book))
        //Limit undos to 100 entries
        if(this.undoLog.length > 100){
            this.undoLog.shift()
        }

        //Clearing redo since it is overwritten
        this.redoLog = [];
    },

    undo() {
        if (this.undoLog.length <= 1) {
            console.log('No previous actions logged')
        } else {
            this.redoLog.push(this.undoLog.pop())
            bookState.setBook(JSON.parse(this.undoLog[this.undoLog.length-1]), false)
        }
    },

    redo() {
        if (this.redoLog.length == 0){
            console.log('No following actions logged')
        } else {
            this.undoLog.push(this.redoLog.pop())
            bookState.setBook(JSON.parse(this.undoLog[this.undoLog.length-1]), false)
        }
    },

}