import { initializeBoard, initializeEnemyBoard, placeShip, receiveShot, mirrorFleet } from './board-service';

describe('board-service receiveShot and mirrorFleet', () => {
  it('should return miss for empty position', () => {
    const enemy = initializeEnemyBoard();
    const res = receiveShot(enemy, 'A1', 'player');
    expect(res.hit).toBe(false);
    expect(res.gameOver).toBe(false);
  });

  it('should register a hit and not sink immediately', () => {
    const enemy = initializeEnemyBoard();
    // B4 is part of Aircraft Carrier in initializeEnemyBoard
    const res = receiveShot(enemy, 'B4', 'player');
    expect(res.hit).toBe(true);
    expect(res.sunk).toBe(false);
    expect(enemy.fleet[0].hits).toContain('B4');
  });

  it('should sink a small ship and return shipPositions', () => {
    const enemy = initializeEnemyBoard();
    // Patrol Boat positions are ['C5','C6'] per spec
    const r1 = receiveShot(enemy, 'C5', 'player');
    expect(r1.hit).toBe(true);
    expect(r1.sunk).toBe(false);

    const r2 = receiveShot(enemy, 'C6', 'player');
    expect(r2.hit).toBe(true);
    expect(r2.sunk).toBe(true);
    expect(r2.shipPositions).toEqual(expect.arrayContaining(['C5','C6']));
  });

  it('should indicate alreadyShot for repeated shots', () => {
    const enemy = initializeEnemyBoard();
    const r1 = receiveShot(enemy, 'B4', 'player');
    expect(r1.hit).toBe(true);
    const r2 = receiveShot(enemy, 'B4', 'player');
    expect(r2.alreadyShot).toBe(true);
  });

  it('should report gameOver after all ships sunk', () => {
    const enemy = initializeEnemyBoard();
    // sink all known positions from initializeEnemyBoard
    const allPositions = [].concat(
      ['B4','B5','B6','B7','B8'],
      ['E6','E7','E8','E9'],
      ['A3','B3','C3'],
      ['F8','G8','H8'],
      ['C5','C6']
    );

    let res;
    for (const pos of allPositions) {
      res = receiveShot(enemy, pos, 'player');
    }
    expect(res.gameOver).toBe(true);
  });

  it('mirrorFleet should copy positions and clear hits/shots', () => {
    const player = initializeBoard();
    placeShip(player, 0, 'A1', 'right');
    placeShip(player, 1, 'C1', 'right');

    const enemy = initializeEnemyBoard();
    enemy.shots = { A1: 'player' };
    enemy.fleet[0].hits = ['B1'];

    mirrorFleet(enemy, player);

    expect(enemy.fleet[0].positions).toEqual(player.fleet[0].positions);
    expect(enemy.fleet[0].hits || []).toHaveLength(0);
    expect(enemy.shots).toEqual({});
  });
});
