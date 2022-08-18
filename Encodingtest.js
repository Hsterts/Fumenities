const { encoder } = require("./tetris-fumen");

pages = [];

pages.push({comment: 'comment'});
pages.push({operation: undefined});
pages.push(toPage(board));

flags = {
    rise: false,
    mirror: false,
    colorize: true,
    comment: undefined,
    lock: true,
    piece: undefined,
}

pages.push(flags);

encoder.encode(pages);
