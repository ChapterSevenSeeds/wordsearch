const _ = require('lodash');

class PointVector {
    Row;
    Column;
    Direction;

    constructor(row, column, direction) {
        this.Row = row;
        this.Column = column;
        this.Direction = direction;
    }

    toString() {
        return `${this.Row},${this.Column},${this.Direction}`;
    }
}

class IndexRequirement {
    Index;
    Char;

    constructor(index, char) {
        this.Index = index;
        this.Char = char;
    }
}

const surroundingColumns = [
    -1, 0, 1,
    -1, 1,
    -1, 0, 1
];

const surroundingRows = [
    -1, -1, -1,
    0, 0,
    1, 1, 1
];

const action = {

    TryReverse: 0,
    Fail: 1
}

const directions = {
    UP_LEFT: 0,
    UP: 1,
    UP_RIGHT: 2,
    LEFT: 3,
    RIGHT: 4,
    DOWN_LEFT: 5,
    DOWN: 6,
    DOWN_RIGHT: 7
};
const directionsByValue = Object.keys(directions).reduce((acc, cur) => Object.assign(acc, { [directions[cur]]: cur }), {});
const directionReciprocals = {
    UP_LEFT: directions.DOWN_RIGHT,
    UP: directions.DOWN,
    UP_RIGHT: directions.DOWN_LEFT,
    LEFT: directions.RIGHT,
    RIGHT: directions.LEFT,
    DOWN_LEFT: directions.UP_RIGHT,
    DOWN: directions.UP,
    DOWN_RIGHT: directions.UP_LEFT
};

const allWords = require("fs").readFileSync('./words.txt').toString().split("\r\n").filter(x => x.length >= 2);

const words = _.sampleSize(allWords, 10);
const maxWordLength = words.reduce((max, current) => Math.max(max, current.length), 0);
const matrixSize = maxWordLength + 5;

const wordMatrix = [];
for (let i = 0; i < matrixSize; ++i) {
    wordMatrix.push(new Array(matrixSize).fill(''));
}

const lengthMap = {};
for (let row = 0; row < matrixSize; ++row) {
    for (let column = 0; column < matrixSize; ++column) {
        for (const [directionKey, value] of Object.entries(directions)) {
            let currentLength = 2;
            const direction = new PointVector(row, column, value);

            let rowCopy = row + surroundingRows[value];
            let columnCopy = column + surroundingColumns[value];
            while (rowCopy >= 0 && rowCopy < matrixSize && columnCopy >= 0 && columnCopy < matrixSize) {
                if (!(currentLength in lengthMap)) {
                    lengthMap[currentLength] = {}
                }

                lengthMap[currentLength][direction.toString()] = [];

                rowCopy += surroundingRows[value];
                columnCopy += surroundingColumns[value];
                ++currentLength;
            }
        }
    }
}

function attemptToPlaceWordOnBoard(board, remainingWords, lengthMap) {
    if (remainingWords.length === 0) return [true, board];

    let word = remainingWords[0];
    const possibleStarts = _.shuffle(Object.keys(lengthMap[word.length]));

    for (const start of possibleStarts) {
        let tryReverse = false;
        let failed = false;

        let boardClone, lengthMapClone;
        while (true) {
            lengthMapClone = _.clone(lengthMap);
    
            let [row, column, directionIndex] = start.split(',').map(Number);
            let originalRow = row - surroundingRows[directionIndex];
            let originalColumn = column - surroundingColumns[directionIndex];
    
    
            boardClone = _.cloneDeep(board);
            for (const index in word) {
                if (boardClone[row][column] === '') boardClone[row][column] = word[index];
                else if (boardClone[row][column] !== word[index]) {
                    if (!tryReverse) {
                        tryReverse = true;
                        word = word.split("").reverse().join("");
                    } else {
                        failed = true;
                    }

                    break;
                }
    
                // Remove the vectors that start on this point.
                for (const length in lengthMapClone) {
                    for (const directionValue of Object.values(directions)) {
                        delete lengthMapClone[length][`${row},${column},${directionValue}`];
                    }
                }
    
                row += surroundingRows[directionIndex];
                column += surroundingColumns[directionIndex];
            }

            if (!failed && tryReverse) continue;
            if (failed) break;
    
            // Recalculate the lengths of the rest of the points along the vector where the word was just placed
            for (const vectorPiece of [[row, column, directionIndex, directionReciprocals[directionsByValue[directionIndex]]], [originalRow, originalColumn, directionReciprocals[directionsByValue[directionIndex]], directionIndex]]) {
                let [rowCopy, columnCopy, directionIndex, oppositeDirectionIndex] = vectorPiece;
    
                while (rowCopy >= 0 && columnCopy >= 0 && rowCopy < matrixSize && columnCopy < matrixSize) {
                    const pointString = `${rowCopy},${columnCopy},${oppositeDirectionIndex}`;
                    for (const length in lengthMapClone) {
                        delete lengthMapClone[length][pointString];
                    }
    
                    let newLength;
                    if (directionIndex === directions.UP || directionIndex === directions.DOWN) {
                        newLength = Math.abs(columnCopy - vectorPiece[1]);
                    } else {
                        newLength = Math.abs(rowCopy - vectorPiece[0]);
                    }
    
                    if (newLength >= 2) lengthMapClone[newLength][pointString] = []
    
                    rowCopy += surroundingRows[directionIndex];
                    columnCopy += surroundingColumns[directionIndex];
                }
            }

            break;
        }

        if (failed) continue;

        const nextWordResult = attemptToPlaceWordOnBoard(boardClone, remainingWords.splice(1), lengthMapClone)
        if (nextWordResult[0]) return nextWordResult;
    }

    return [false, null];
}

const result = attemptToPlaceWordOnBoard(wordMatrix, words.sort((a, b) => b.length - a.length), lengthMap);
console.log(result);