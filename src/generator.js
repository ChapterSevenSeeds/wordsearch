const surroundingColumns = [
    -1, 0, 1,
    -1,    1, // We don't want to check the middle spot twice.
    -1, 0, 1
];

const surroundingRows = [
    -1, -1, -1,
     0,      0, // We don't want to check the middle spot twice.
     1,  1,  1
];

const surroundingItemsIndexes = [0, 1, 2, 3, 4, 5, 6, 7];

const _ = require('lodash');

module.exports = function (words, matrixWidth, matrixHeight) {
    if (words.some(x => x.length > matrixWidth && x.length > matrixHeight)) {
        return [false, []];
    }

    words = words.map(x => x.toUpperCase());
    const board = [];
    
    const coordinates = [];
    
    for (let i = 0; i < matrixHeight; ++i) {
        const row = [];
        for (let j = 0; j < matrixWidth; ++j) {
            coordinates.push([i, j]);
            row.push('');
        }
    
        board.push(row);
    }
    
    const result = placeWord(words, board, coordinates);
    for (const row of result[1]) {
        for (let i = 0; i < row.length; ++i) {
            if (row[i] === '') row[i] = String.fromCharCode(_.random(65, 90));
        }
    }

    return result;
}

function placeWord(remainingWords, board, coordinates) {
    if (remainingWords.length === 0) return [true, board];

    const randomizedCoordinates = _.shuffle(coordinates);
    const word = remainingWords[0];
    const boardCopy = _.cloneDeep(board);

    for (const coord of randomizedCoordinates) {
        for (const itemIndex of _.shuffle(surroundingItemsIndexes)) {
            let row = coord[0];
            let column = coord[1];

            let wordSuccess = true;
            for (const char of word) {
                if ((board[row]?.[column] !== "" && board[row]?.[column] !== char) || board[row]?.[column] == null) {
                    wordSuccess = false;
                    break;
                }

                board[row][column] = char;

                row += surroundingRows[itemIndex];
                column += surroundingColumns[itemIndex];
            }

            if (wordSuccess) {
                const nextWordSuccess = placeWord([...remainingWords].splice(1), board, coordinates);

                if (nextWordSuccess[0]) return nextWordSuccess;
            } else {
                board = _.cloneDeep(boardCopy);
            }
        }
    }

    return [false, boardCopy];
}