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

for (const word of words.sort((a, b) => b.length - a.length)) {
    
}