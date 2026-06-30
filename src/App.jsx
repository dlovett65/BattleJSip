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

// Board now accepts a `board` prop (to read board.shots) and `isEnemy` flag.
// Buttons are disabled if they've already been shot and colored by who shot.
const Board = ({ selected, board = {}, isEnemy = false }) => {
  const shots = board.shots || {};

  return (
    <table>
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

              let style = {};
              if (shotBy === 'player') {
                style = { backgroundColor: 'lightblue' };
              } else if (shotBy === 'enemy') {
                style = { backgroundColor: 'lightcoral' };
              }

              const disabled = !!shotBy;

              return (
                <td key={j}>
                  <button
                    onClick={() => selected(pos)}
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

    return (
      <Fragment>
        <h1>{text}</h1>
        {!!currentPosition ? (
          <DirectionSelector selected={this.placeMyShip} />
        ) : ship ? (
          <Board selected={this.setCurrentPosition} board={myBoard} isEnemy={false} />
        ) : (
          <Board selected={this.shoot} board={enemyBoard} isEnemy={true} />
        )}
      </Fragment>
    );
  }
}
