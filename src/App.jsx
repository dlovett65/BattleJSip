import React, { Component, Fragment } from 'react';
import {
  getRandomPosition,
  initializeBoard,
  initializeEnemyBoard,
  isHit,
  placeShip,
  receiveShot
} from './game/board-service';
import './App.css';

function getSequence(length) {
  return Array.from({ length })
    .fill(0)
    .map((e, i) => i);
}

function getLetter(i) {
  return String.fromCharCode('A'.charCodeAt(0) + i);
}

const boardSize = 8;

// Helper: find ship at a position on a board
function getShipAtPosition(board, pos) {
  return board.fleet.find(s => s.positions.includes(pos));
}

// Board now accepts a `board` prop (to read board.shots and ship positions) and `isEnemy` flag.
// Buttons are disabled if they've already been shot and colored by state.
const Board = ({ selected, board = {}, isEnemy = false, allowSelect = true }) => {
  const shots = board.shots || {};

  return (
    <table className="board-table">
      <thead>
        <tr>
          <th />
          {getSequence(boardSize).map(i => (
            <th key={i}>{getLetter(i)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {getSequence(boardSize).map(i => (
          <tr key={i}>
            <td>
              <strong>{i}</strong>
            </td>
            {getSequence(boardSize).map(j => {
              const pos = getLetter(j) + i;
              const shotBy = shots[pos]; // undefined | 'player' | 'enemy'

              // Determine visual state
              let style = {};
              let disabled = false;

              if (isEnemy) {
                // For enemy board: reveal only where player has shot.
                // If player shot and it is a hit -> hit color; if player shot and miss -> miss color.
                if (shotBy === 'player') {
                  const ship = getShipAtPosition(board, pos);
                  if (ship && (ship.hits || []).includes(pos)) {
                    // player hit this enemy ship position
                    style = { backgroundColor: '#e74c3c' }; // red for hit
                  } else {
                    // player shot but missed
                    style = { backgroundColor: '#bdc3c7' }; // gray for miss
                  }
                  disabled = true;
                } else {
                  // not shot by player yet; enabled only if allowed
                  disabled = !allowSelect;
                }
              } else {
                // Player's own board: show ships colored by ship.color
                const ship = getShipAtPosition(board, pos);
                if (ship) {
                  // default ship color
                  style = { backgroundColor: ship.color };
                  // if this position has been hit, override to indicate damage
                  if ((ship.hits || []).includes(pos)) {
                    style = { backgroundColor: '#2c3e50' }; // dark to show hit
                  }
                } else if (shotBy === 'enemy') {
                  // enemy shot at empty position on player's board -> miss
                  style = { backgroundColor: '#f39c12' }; // orange-ish for enemy miss
                }

                // Player board selection used for placing ships only,
                // so disable clicking unless allowSelect is true and it's not already placed.
                disabled = !allowSelect;
              }

              return (
                <td key={j}>
                  <button
                    onClick={() => selected && selected(pos)}
                    disabled={disabled}
                    style={style}
                  >
                    {pos}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const DirectionSelector = ({ selected }) => (
  <table>
    <tbody>
      <tr>
        <td />
        <td>
          <button onClick={() => selected('up')}>▲</button>
        </td>
        <td />
      </tr>
      <tr>
        <td>
          <button onClick={() => selected('left')}>◀</button>
        </td>
        <td />
        <td>
          <button onClick={() => selected('right')}>▶</button>
        </td>
      </tr>
      <tr>
        <td />
        <td>
          <button onClick={() => selected('down')}>▼</button>
        </td>
        <td />
      </tr>
    </tbody>
  </table>
);

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      currentPosition: undefined,
      currentShipIndex: 0,
      enemyBoard: initializeEnemyBoard(),
      myBoard: initializeBoard()
    };
  }

  setCurrentPosition = position => {
    this.setState({
      currentPosition: position
    });
  };

  placeMyShip = direction => {
    const { myBoard, currentPosition, currentShipIndex } = this.state;

    if (currentPosition) {
      placeShip(myBoard, currentShipIndex, currentPosition, direction);

      this.setState({
        currentPosition: undefined,
        currentShipIndex: currentShipIndex + 1,
        myBoard
      });
    }
  };

  shoot = position => {
    const { enemyBoard, myBoard } = this.state;

    // Player shoots enemy
    const result = receiveShot(enemyBoard, position, 'player');

    if (result.alreadyShot) {
      alert(`${position} was already shot at. Choose another.`);
      return;
    }

    let message = `You shoot at ${position}: ${result.hit ? 'Hit!' : 'Miss!'}`;
    if (result.sunk) {
      message += ` You sank the enemy ${result.shipName}!`;
    }
    alert(message);

    // update UI state
    this.setState({ enemyBoard });

    if (result.gameOver) {
      const playAgain = window.confirm('You win! Would you like to play again?');
      if (playAgain) {
        this.setState({
          enemyBoard: initializeEnemyBoard(),
          myBoard: initializeBoard(),
          currentShipIndex: 0,
          currentPosition: undefined
        });
      }
      return;
    }

    // Enemy counterattack: pick an unshot position
    let counterAttack;
    let attempts = 0;
    do {
      counterAttack = getRandomPosition(boardSize, boardSize);
      attempts++;
      if (attempts > 1000) break;
    } while (myBoard.shots && myBoard.shots[counterAttack]);

    const enemyResult = receiveShot(myBoard, counterAttack, 'enemy');
    let enemyMessage = `Enemy shoots at ${counterAttack}: ${
      enemyResult.hit ? 'Hit!' : 'Miss!'
    }`;
    if (enemyResult.sunk) {
      enemyMessage += ` Your ${enemyResult.shipName} was sunk!`;
    }
    alert(enemyMessage);

    this.setState({ myBoard });

    if (enemyResult.gameOver) {
      const playAgain = window.confirm('Enemy wins! Would you like to play again?');
      if (playAgain) {
        this.setState({
          enemyBoard: initializeEnemyBoard(),
          myBoard: initializeBoard(),
          currentShipIndex: 0,
          currentPosition: undefined
        });
      }
    }
  };

  render() {
    const { currentPosition, currentShipIndex, myBoard, enemyBoard } = this.state;
    const ship = myBoard.fleet[currentShipIndex];
    let text;

    if (ship) {
      if (!!currentPosition) {
        text = `Select direction for ${ship.name}`;
      } else {
        text = `Select position for ${ship.name}`;
      }
    } else {
      text = `Shoot!`;
    }

    const placing = !!ship;

    return (
      <Fragment>
        <h1>{text}</h1>
        {!!currentPosition ? (
          <DirectionSelector selected={this.placeMyShip} />
        ) : null}

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div>
            <h2>Your Board</h2>
            <Board
              selected={placing ? this.setCurrentPosition : null}
              board={myBoard}
              isEnemy={false}
              allowSelect={placing}
            />
          </div>

          <div>
            <h2>Enemy Board</h2>
            <Board
              selected={placing ? null : this.shoot}
              board={enemyBoard}
              isEnemy={true}
              allowSelect={!placing}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}
