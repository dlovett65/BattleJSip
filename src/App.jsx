import React, { Component, Fragment } from 'react';
import {
  getRandomPosition,
  initializeBoard,
  initializeEnemyBoard,
  isHit,
  placeShip,
  receiveShot,
  mirrorFleet
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
              let className = '';
              let disabled = false;

              if (isEnemy) {
                // Enemy board visual rules:
                // - enemy boats: green to start (#2ecc71), blue when hit (#3498db)
                // - player's misses on enemy: dark grey (#4b4b4b)
                // - sunk ships: outlined via CSS class 'sunk'
                const ship = getShipAtPosition(board, pos);
                if (ship) {
                  // if hit
                  if ((ship.hits || []).includes(pos)) {
                    style = { backgroundColor: '#3498db', color: '#fff' }; // blue for enemy hit
                  } else {
                    style = { backgroundColor: '#2ecc71', color: '#000' }; // green for enemy ship
                  }

                  // if the ship is sunk, add class
                  if ((ship.hits || []).length === ship.size) {
                    className = 'sunk';
                  }

                  // disable clicking on enemy ship cells after they have been shot by player
                  disabled = !!shots[pos];
                } else if (shotBy === 'player') {
                  // player shot here and missed
                  style = { backgroundColor: '#4b4b4b', color: '#fff' }; // dark grey for enemy miss
                  disabled = true;
                } else {
                  // unshot empty cell
                  disabled = !allowSelect;
                }
              } else {
                // Player's own board visual rules:
                // - player boats: red to start (#e74c3c), pink when hit (#ffc0cb)
                // - player's misses by enemy: black (#000)
                // - sunk ships: outlined via CSS class 'sunk'
                const ship = getShipAtPosition(board, pos);
                if (ship) {
                  if ((ship.hits || []).includes(pos)) {
                    style = { backgroundColor: '#ffc0cb', color: '#000' }; // pink for player hit
                  } else {
                    style = { backgroundColor: '#e74c3c', color: '#fff' }; // red for player ship
                  }

                  // sunk outline
                  if ((ship.hits || []).length === ship.size) {
                    className = 'sunk';
                  }
                } else if (shotBy === 'enemy') {
                  // enemy shot at empty position on player's board -> miss (black)
                  style = { backgroundColor: '#000000', color: '#fff' };
                }

                // Player board selection used for placing ships only,
                // so disable clicking unless allowSelect is true.
                disabled = !allowSelect;
              }

              return (
                <td key={j}>
                  <button
                    className={className}
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
      myBoard: initializeBoard(),
      testMode: false
    };
  }

  setCurrentPosition = position => {
    this.setState({
      currentPosition: position
    });
  };

  applyTestModeToEnemy = () => {
    const { myBoard, enemyBoard } = this.state;
    mirrorFleet(enemyBoard, myBoard);
    this.setState({ enemyBoard });
  };

  toggleTestMode = () => {
    this.setState(
      prev => ({ testMode: !prev.testMode }),
      () => {
        if (this.state.testMode) {
          this.applyTestModeToEnemy();
        } else {
          this.setState({ enemyBoard: initializeEnemyBoard() });
        }
      }
    );
  };

  placeMyShip = direction => {
    const { myBoard, currentPosition, currentShipIndex, testMode } = this.state;

    if (currentPosition) {
      placeShip(myBoard, currentShipIndex, currentPosition, direction);

      const nextIndex = currentShipIndex + 1;
      this.setState(
        {
          currentPosition: undefined,
          currentShipIndex: nextIndex,
          myBoard
        },
        () => {
          // If testMode is on and we have placed all ships, mirror them to enemy
          if (testMode && nextIndex >= myBoard.fleet.length) {
            this.applyTestModeToEnemy();
          }
        }
      );
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
      console.log(`Enemy ${result.shipName} sunk.`);
      alert(`Enemy ${result.shipName} has been sunk!`);
    } else {
      alert(message);
    }

    // update UI state
    this.setState({ enemyBoard });

    if (result.gameOver) {
      const playAgain = window.confirm('You win! Would you like to play again?');
      if (playAgain) {
        this.setState({
          enemyBoard: initializeEnemyBoard(),
          myBoard: initializeBoard(),
          currentShipIndex: 0,
          currentPosition: undefined,
          testMode: false
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
      console.log(`Player ship ${enemyResult.shipName} sunk.`);
      alert(`Your ${enemyResult.shipName} has been sunk!`);
    } else {
      alert(enemyMessage);
    }

    this.setState({ myBoard });

    if (enemyResult.gameOver) {
      const playAgain = window.confirm('Enemy wins! Would you like to play again?');
      if (playAgain) {
        this.setState({
          enemyBoard: initializeEnemyBoard(),
          myBoard: initializeBoard(),
          currentShipIndex: 0,
          currentPosition: undefined,
          testMode: false
        });
      }
    }
  };

  render() {
    const { currentPosition, currentShipIndex, myBoard, enemyBoard, testMode } = this.state;
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

        <div style={{ marginBottom: 12 }}>
          <label style={{ marginRight: 12 }}>
            <input type="checkbox" checked={testMode} onChange={this.toggleTestMode} />
            {' '}Test mode (mirror your ship placements to enemy)
          </label>
        </div>

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
