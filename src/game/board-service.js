export function makeFleet() {
  return [
    {
      name: 'Aircraft Carrier',
      color: 'cadet blue',
      size: 5,
      positions: []
    },
    {
      name: 'Battleship',
      color: 'red',
      size: 4,
      positions: []
    },
    {
      name: 'Submarine',
      color: 'chartreuse',
      size: 3,
      positions: []
    },
    {
      name: 'Patrol',
      color: 'yellow',
      size: 3,
      positions: []
    },
    {
      name: 'Patrol Boat',
      color: 'orange',
      size: 2,
      positions: []
    }
  ];
}

export function initializeBoard() {
  return {
    fleet: makeFleet()
  };
}

export function initializeEnemyBoard() {
  const board = {
    fleet: makeFleet()
  };

  placeShip(board, 0, 'B4', 'down');
  placeShip(board, 1, 'E6', 'down');
  placeShip(board, 2, 'A3', 'right');
  placeShip(board, 3, 'F8', 'right');
  placeShip(board, 4, 'C5', 'down');

  return board;
}

export function isHit(board, position) {
  return board.fleet.some(ship => ship.positions.some(p => p === position));
}

export function getRelativePosition(position, direction) {
  const splitPosition = position.split('');
  switch (direction) {
    case 'right':
      return (
        String.fromCharCode(splitPosition[0].charCodeAt(0) + 1) +
        splitPosition[1]
      );
    case 'left':
      return (
        String.fromCharCode(splitPosition[0].charCodeAt(0) - 1) +
        splitPosition[1]
      );
    case 'up':
      return splitPosition[0] + (+splitPosition[1] - 1);
    case 'down':
      return splitPosition[0] + (+splitPosition[1] + 1);
    default:
      throw Error('invalid direction');
  }
}

export function placeShip(board, shipIndex, position, direction) {
  let ship = board.fleet[shipIndex];

  let currentPosition = position;
  for (let i = 0; i < ship.size; i++) {
    ship.positions.push(currentPosition);
    currentPosition = getRelativePosition(currentPosition, direction);
  }
}

// Returns a random position within a columns x rows board.
// columnCount and rowCount are the number of columns (letters) and rows (numbers).
export function getRandomPosition(columnCount, rowCount) {
  const column = String.fromCharCode(65 + Math.floor(Math.random() * columnCount));
  const row = Math.floor(Math.random() * rowCount).toString();
  return column + row;
}

// Record a shot at `position` on the given `board`. This function:
// - records who shot at position in board.shots (e.g. 'player' or 'enemy')
// - records per-ship hits in ship.hits (does not remove ship.positions)
// - returns an object { hit, sunk, shipName, shipPositions, gameOver, alreadyShot }
export function receiveShot(board, position, shooter = 'player') {
  // ensure shots container
  board.shots = board.shots || {};

  // already shot?
  if (board.shots[position]) {
    return { hit: false, alreadyShot: true, gameOver: false };
  }

  // record shot with who shot it
  board.shots[position] = shooter;

  // find ship occupying this position
  const ship = board.fleet.find(s => s.positions.includes(position));
  if (ship) {
    ship.hits = ship.hits || [];
    if (!ship.hits.includes(position)) {
      ship.hits.push(position);
    }

    const sunk = ship.hits.length === ship.size;
    // game over for this board when all ships are sunk
    const gameOver = board.fleet.every(s => (s.hits || []).length === s.size);

    // return the ship positions so UI can outline them when sunk
    return {
      hit: true,
      sunk,
      shipName: ship.name,
      shipPositions: [...ship.positions],
      gameOver
    };
  }

  // miss
  return {
    hit: false,
    gameOver: false
  };
}

// helper: whether the board still has any remaining (not fully hit) ships
export function hasRemainingShips(board) {
  return board.fleet.some(s => (s.hits || []).length < s.size);
}

// Mirror the fleet positions from sourceBoard to targetBoard.
// This is used for test mode where enemy positions should match player's.
export function mirrorFleet(targetBoard, sourceBoard) {
  if (!targetBoard || !sourceBoard) return;
  targetBoard.fleet.forEach((ship, i) => {
    ship.positions = [...(sourceBoard.fleet[i].positions || [])];
    ship.hits = [];
  });
  // clear any previous shot markers on the target
  targetBoard.shots = {};
}
