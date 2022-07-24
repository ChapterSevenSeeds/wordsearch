import { useEffect, useState } from "react";
import clsx from 'clsx';
import "./styles.scss"
import generator from './generator';

const surroundingColumns = [
    -1, 0, 1,
    -1, 1, // We don't want to check the middle spot twice.
    -1, 0, 1
];

const surroundingRows = [
    -1, -1, -1,
    0, 0, // We don't want to check the middle spot twice.
    1, 1, 1
];

const tabsEnum = {
    Solver: 0,
    Generator: 1
};

const tabs = [
    { text: "Solver", ID: tabsEnum.Solver },
    { text: "Generator", ID: tabsEnum.Generator }
];

const generatorResult = {
    Waiting: 0,
    Success: 1,
    Failure: 2
}

export default function App() {
    const [text, setText] = useState("");
    const [columns, setColumns] = useState(20);
    const [textMatrix, setTextMatrix] = useState([]);
    const [activeSearchColumnsByRows, setActiveColumnsByRows] = useState({});
    const [generatorAnswersActiveColumnsByRows, setGeneratorAnswersActiveColumnsByRows] = useState({});
    const [searchText, setSearchText] = useState("");
    const [selectedTab, setSelectedTab] = useState(tabsEnum.Solver);
    const [wordsForGenerator, setWordsForGenerator] = useState('');
    const [generatorRows, setGeneratorRows] = useState(10);
    const [generatorColumns, setGeneratorColumns] = useState(10);
    const [generatorStatus, setGeneratorStatus] = useState(generatorResult.Waiting);
    const [generatorResultMatrix, setGeneratorResultMatrix] = useState([]);

    useEffect(() => {
        setTextMatrix(text.toUpperCase().split('\n').map(line => Array.from(line)));
    }, [text]);

    useEffect(() => {
        search(searchText, textMatrix, setActiveColumnsByRows);
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

    /**
     * Merges dict2 into dict1.
     * @param {*} dict1 
     * @param {*} dict2 
     */
    function mergePointDictionaries(dict1, dict2) {
        for (const key in dict2) {
            if (key in dict1) {
                for (const item of dict2[key]) {
                    dict1[key].add(item);
                }
            } else {
                dict1[key] = new Set(dict2[key]);
            }
        }
    }

    function search(searchText, textMatrix, hook) {
        let words = searchText.toUpperCase().split(',');
        const pointDict = {};

        for (const word of words) {
            let wordSuccess = false;
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
    
                                        mergePointDictionaries(pointDict, newPointsDictionary);
                                        wordSuccess = true;
                                        break;
                                    }
    
                                    rowCopy += surroundingRows[i];
                                    columnCopy += surroundingColumns[i];
    
                                    if (textMatrix[rowCopy]?.[columnCopy] !== word[indexInWord++]) break;
                                }

                                if (wordSuccess) break;
                            }
                        }

                        if (wordSuccess) break;
                    }
                }

                if (wordSuccess) break;
            }
        }

        hook(pointDict);
    }

    function generate() {
        const words = Array.from(wordsForGenerator.toLowerCase()).filter(char => /[a-z\n]/.test(char)).join('').split("\n");
        const [success, board] = generator(words, generatorColumns, generatorRows);

        if (success) {
            setGeneratorResultMatrix(board);
            search(words.join(','), board, setGeneratorAnswersActiveColumnsByRows);
            setGeneratorStatus(generatorResult.Success);
        } else {
            setGeneratorStatus(generatorResult.Failure);
        }
    }

    return (
        <>
            <div className="toolbar">
                {tabs.map(x =>
                    <div className={clsx(selectedTab === x.ID && 'selected')} onClick={() => setSelectedTab(x.ID)}>
                        {x.text}
                    </div>
                )}
            </div>
            {selectedTab === tabsEnum.Solver &&
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
                </div>}
            {selectedTab === tabsEnum.Generator &&
                <div className="main">
                    <label for="words-input">Words for wordsearch (separate with newlines)</label>
                    <textarea value={wordsForGenerator} onChange={e => setWordsForGenerator(e.target.value)} rows={12} id="words-input" />
                    <div style={{ display: 'flex', marginTop: '8px' }}>
                        <label for="rows">Rows:</label>
                        <input value={generatorRows} onChange={e => setGeneratorRows(+e.target.value)} type="number" min={1} inputMode="number" id="rows" style={{ width: '50px' }} />
                        <label for="columns" style={{ marginLeft: '8px' }}>Columns:</label>
                        <input value={generatorColumns} onChange={e => setGeneratorColumns(+e.target.value)} type="number" min={1} inputMode="number" id="columns" style={{ width: '50px' }} />
                    </div>
                    <button style={{ marginTop: '8px' }} onClick={generate}>Generate</button>
                    {generatorStatus === generatorResult.Success &&
                        <div className="formatted-text-container">
                            {
                                generatorResultMatrix.map((line, row) =>
                                    <div key={row}>{line.map((char, column) => <div key={column} style={{ backgroundColor: row in generatorAnswersActiveColumnsByRows && generatorAnswersActiveColumnsByRows[row].has(column) ? "lightblue" : "rgb(235, 235, 235)" }}>{char}</div>)}</div>
                                )
                            }
                        </div>
                    }
                    {generatorStatus === generatorResult.Failure &&
                    <div style={{ color: 'darkred' }}>
                        A wordsearch matrix could not be generated with the given words and size.
                    </div>
                    }
                </div>
            }
        </>
    );
}