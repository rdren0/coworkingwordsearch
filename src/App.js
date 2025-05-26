import React, { useState, useCallback } from "react";
import "./App.css";

const DIRECTIONS = [
  [0, 1], // horizontal (left to right)
  [1, 0], // vertical (top to bottom)
];

function App() {
  const [words, setWords] = useState([
    "FOODSPIRE",
    "ARTORIAS",
    "SERAPHINE",
    "PESTO",
    "HAZEL",
  ]);
  const [inputText, setInputText] = useState(
    "FOODSPIRE, ARTORIAS, SERAPHINE, PESTO, HAZEL"
  );
  const [gridSize, setGridSize] = useState(10);
  const [textSize, setTextSize] = useState(20);
  const [filteredWords, setFilteredWords] = useState([]);
  const [grid, setGrid] = useState([]);
  const [placedWords, setPlacedWords] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);

  const generateRandomLetter = () => {
    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
  };

  const canPlaceWord = useCallback(
    (grid, word, row, col, direction) => {
      const [dr, dc] = direction;

      for (let i = 0; i < word.length; i++) {
        const newRow = row + i * dr;
        const newCol = col + i * dc;

        if (
          newRow < 0 ||
          newRow >= gridSize ||
          newCol < 0 ||
          newCol >= gridSize
        ) {
          return false;
        }

        if (grid[newRow][newCol] !== "" && grid[newRow][newCol] !== word[i]) {
          return false;
        }
      }
      return true;
    },
    [gridSize]
  );

  const placeWord = useCallback((grid, word, row, col, direction) => {
    const [dr, dc] = direction;
    const positions = [];

    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dr;
      const newCol = col + i * dc;
      grid[newRow][newCol] = word[i];
      positions.push([newRow, newCol]);
    }

    return positions;
  }, []);

  const findIntersectionOpportunities = useCallback(
    (grid, word) => {
      const opportunities = [];
      const upperWord = word.toUpperCase();

      // Look for existing letters that match letters in our word
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const existingLetter = grid[row][col];
          if (existingLetter === "") continue; // Skip empty cells

          // Check each letter in our word for a match
          for (
            let letterIndex = 0;
            letterIndex < upperWord.length;
            letterIndex++
          ) {
            if (upperWord[letterIndex] === existingLetter) {
              // Found a matching letter, try each direction
              DIRECTIONS.forEach((direction) => {
                const [dr, dc] = direction;
                const startRow = row - letterIndex * dr;
                const startCol = col - letterIndex * dc;

                if (
                  canPlaceWord(grid, upperWord, startRow, startCol, direction)
                ) {
                  opportunities.push({
                    row: startRow,
                    col: startCol,
                    direction: direction,
                    intersectionRow: row,
                    intersectionCol: col,
                    intersectionIndex: letterIndex,
                  });
                }
              });
            }
          }
        }
      }

      return opportunities;
    },
    [gridSize, canPlaceWord]
  );

  const generateGrid = useCallback(() => {
    // Initialize empty grid
    const newGrid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(""));
    const newPlacedWords = [];

    // Place each word
    words.forEach((word) => {
      const upperWord = word.toUpperCase();
      let placed = false;
      let attempts = 0;

      // Randomly decide whether to try intersections (40% chance)
      const shouldTryIntersection =
        Math.random() < 0.4 && newPlacedWords.length > 0;

      if (shouldTryIntersection) {
        // Try to find intersection opportunities first
        const intersectionOps = findIntersectionOpportunities(
          newGrid,
          upperWord
        );

        if (intersectionOps.length > 0) {
          // Randomly choose one of the intersection opportunities
          const chosenOp =
            intersectionOps[Math.floor(Math.random() * intersectionOps.length)];
          const positions = placeWord(
            newGrid,
            upperWord,
            chosenOp.row,
            chosenOp.col,
            chosenOp.direction
          );
          newPlacedWords.push({
            word: upperWord,
            positions,
            direction: chosenOp.direction,
          });
          placed = true;
        }
      }

      // If no intersection attempted or found, try random placement
      while (!placed && attempts < 150) {
        const direction =
          DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);

        if (canPlaceWord(newGrid, upperWord, row, col, direction)) {
          const positions = placeWord(newGrid, upperWord, row, col, direction);
          newPlacedWords.push({
            word: upperWord,
            positions,
            direction,
          });
          placed = true;
        }
        attempts++;
      }
    });

    // Fill empty cells with random letters
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (newGrid[i][j] === "") {
          newGrid[i][j] = generateRandomLetter();
        }
      }
    }

    setGrid(newGrid);
    setPlacedWords(newPlacedWords);
    setFoundWords(new Set());
    setSelectedCells([]);
  }, [words, gridSize, canPlaceWord, placeWord, findIntersectionOpportunities]);

  const handleWordsChange = (e) => {
    setInputText(e.target.value);
  };

  const processWords = useCallback(() => {
    const allWords = inputText
      .split(/[,\n]/)
      .map((word) => word.trim().toUpperCase())
      .filter((word) => word.length > 0);

    const validWords = allWords.filter((word) => word.length <= gridSize);
    const tooLongWords = allWords.filter((word) => word.length > gridSize);

    setWords(validWords);
    setFilteredWords(tooLongWords);
  }, [inputText, gridSize]);

  const getCellKey = (row, col) => `${row}-${col}`;

  const handleCellMouseDown = (row, col) => {
    setIsSelecting(true);
    setSelectedCells([getCellKey(row, col)]);
  };

  const handleCellMouseEnter = (row, col) => {
    if (isSelecting) {
      const cellKey = getCellKey(row, col);
      setSelectedCells((prev) => {
        if (prev.length === 1) {
          return [prev[0], cellKey];
        } else if (prev.length === 2) {
          return [prev[0], cellKey];
        }
        return prev;
      });
    }
  };

  const handleMouseUp = () => {
    if (selectedCells.length >= 2) {
      checkSelectedWord();
    }
    setIsSelecting(false);
  };

  const checkSelectedWord = () => {
    if (selectedCells.length < 2) return;

    const startCell = selectedCells[0].split("-").map(Number);
    const endCell = selectedCells[selectedCells.length - 1]
      .split("-")
      .map(Number);

    placedWords.forEach((wordData) => {
      const { word, positions } = wordData;
      const firstPos = positions[0];
      const lastPos = positions[positions.length - 1];

      const isMatch =
        (startCell[0] === firstPos[0] &&
          startCell[1] === firstPos[1] &&
          endCell[0] === lastPos[0] &&
          endCell[1] === lastPos[1]) ||
        (startCell[0] === lastPos[0] &&
          startCell[1] === lastPos[1] &&
          endCell[0] === firstPos[0] &&
          endCell[1] === firstPos[1]);

      if (isMatch) {
        setFoundWords((prev) => new Set([...prev, word]));
      }
    });

    setSelectedCells([]);
  };

  const getCellClass = (row, col) => {
    const cellKey = getCellKey(row, col);
    let classes = "cell ";

    // Check if this cell is part of a found word
    const isPartOfFoundWord = placedWords.some(
      (wordData) =>
        foundWords.has(wordData.word) &&
        wordData.positions.some((pos) => pos[0] === row && pos[1] === col)
    );

    if (isPartOfFoundWord) {
      classes += "found ";
    } else if (selectedCells.includes(cellKey)) {
      classes += "selected ";
    } else {
      classes += "normal ";
    }

    return classes;
  };

  React.useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      processWords();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [processWords]);

  return (
    <div className="App">
      <h1>Word Search Generator</h1>

      <div className="container">
        {/* Controls */}
        <div className="controls">
          <div className="input-section">
            <label>Grid Size:</label>
            <input
              type="number"
              min="5"
              max="20"
              value={gridSize}
              onChange={(e) =>
                setGridSize(
                  Math.max(5, Math.min(20, parseInt(e.target.value) || 10))
                )
              }
              className="grid-size-input"
            />
          </div>

          <div className="input-section">
            <label>Text Size:</label>
            <input
              type="number"
              min="8"
              max="36"
              value={textSize}
              onChange={(e) =>
                setTextSize(
                  Math.max(8, Math.min(36, parseInt(e.target.value) || 20))
                )
              }
              className="text-size-input"
            />
          </div>

          <div className="input-section">
            <label>Enter words (comma or line separated):</label>
            <div className="word-limit-info">
              <small>Word length limit: {gridSize} characters</small>
            </div>
            <textarea
              rows="6"
              value={inputText}
              onChange={handleWordsChange}
              placeholder="REACT, JAVASCRIPT, CODE, WEB, HTML"
            />
          </div>

          <button
            onClick={() => {
              processWords();
              generateGrid();
            }}
            className="generate-btn"
          >
            Generate New Puzzle
          </button>

          <div className="words-list">
            <h3>Words to Find:</h3>
            <div className="words-grid">
              {words.map((word, index) => (
                <div
                  key={index}
                  className={`word-item ${
                    foundWords.has(word.toUpperCase()) ? "found-word" : ""
                  }`}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>

          {filteredWords.length > 0 && (
            <div className="filtered-words">
              <h3>Words Too Long (Excluded):</h3>
              <div className="words-grid">
                {filteredWords.map((word, index) => (
                  <div key={index} className="word-item filtered-word">
                    {word} ({word.length} chars)
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="stats">
            <p>
              <strong>
                Found: {foundWords.size} / {words.length}
              </strong>
            </p>
            <p>Click and drag to select words in the grid!</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid-container">
          <div
            className="grid"
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsSelecting(false)}
          >
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className="grid-row">
                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={getCellClass(rowIndex, colIndex)}
                    style={{ fontSize: `${textSize}px` }}
                    onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() =>
                      handleCellMouseEnter(rowIndex, colIndex)
                    }
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Plain Text Display */}
          {grid.length > 0 && (
            <div className="plain-text-section">
              <h3>Plain Text (Copy & Paste):</h3>
              <div className="plain-text-grid">
                {grid.map((row, index) => (
                  <div key={index} className="plain-text-row">
                    {row.join("")}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
