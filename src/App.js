import { useEffect, useState } from "react";
import "./styles.scss"

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

export default function App() {
    const [text, setText] = useState("");
    const [columns, setColumns] = useState(20);
    const [textMatrix, setTextMatrix] = useState([]);
    const [activeSearchColumnsByRows, setActiveColumnsByRows] = useState({});
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        setTextMatrix(text.toUpperCase().split('\n').map(line => Array.from(line)));
    }, [text]);

    useEffect(() => {
        search();
    }, [searchText, textMatrix]);

    function textChanged(e) {
        setText(e.target.value);
    }

    function autoFormat() {
        const rawText = text.replace(/\s+/gi, "").toUpperCase();
        let newText = "";

        for (const index in rawText) {
            if (index % columns === 0) newText += '\n';
            newText += rawText[index];
        }

        setText(newText.trim());
    }

    function search() {
        let word = searchText.toUpperCase();

        for (let row = 0; row < textMatrix.length; ++row) {
            for (let column = 0; column < textMatrix[row].length; ++column) {
                if (textMatrix[row][column] === word[0]) {
                    for (let i = 0; i < 8; ++i) {
                        if (textMatrix[row + surroundingRows[i]]?.[column + surroundingColumns[i]] === word[1]) { // Check the surrounding squares
                            // If the next letter is in a surrounding square, continue along that vector until we find a match or don't.
                            let indexInWord = 2;
                            let rowCopy = row + surroundingRows[i];
                            let columnCopy = column + surroundingColumns[i];
                            while (true) {
                                if (indexInWord >= word.length) {
                                    const newPointsDictionary = {};
                                    for (let j = 0; j < word.length; ++j) {
                                        const tempRow = row + surroundingRows[i] * j;
                                        const tempColumn = column + surroundingColumns[i] * j; 
                                        if (!(tempRow in newPointsDictionary)) {
                                            newPointsDictionary[tempRow] = new Set();
                                        }
            
                                        newPointsDictionary[tempRow].add(tempColumn);
                                    }

                                    setActiveColumnsByRows(newPointsDictionary);
                                    return;
                                }

                                rowCopy += surroundingRows[i];
                                columnCopy += surroundingColumns[i];

                                if (textMatrix[rowCopy]?.[columnCopy] !== word[indexInWord++]) break;
                            }
                        }
                    }
                }
            }
        }

        setActiveColumnsByRows({});
    }

    return (
        <div className="main">
            <div>
                <textarea rows={20} cols={40} value={text} onChange={textChanged} />
            </div>
            <div style={{ display: "flex" }}>
                <span>Columns:</span>
                <input type="number" value={columns} onChange={e => setColumns(e.target.value)} style={{ marginRight: '50px' }} />
                <button onClick={autoFormat}>Auto Format</button>
            </div>
            <div style={{ marginTop: '10px' }}>
                <span>Find:</span>
                <input onChange={e => setSearchText(e.target.value)} value={searchText} />
            </div>
            <div className="formatted-text-container">
                {
                    textMatrix.map((line, row) =>
                        <div key={row}>{line.map((char, column) => <div key={column} style={{ backgroundColor: row in activeSearchColumnsByRows && activeSearchColumnsByRows[row].has(column) ? "lightblue" : "rgb(235, 235, 235)" }}>{char}</div>)}</div>
                    )
                }
            </div>
        </div>
    );
}