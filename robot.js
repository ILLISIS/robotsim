// Robot logic module (no rendering code)
class Robot {
  constructor(x, y, angle = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle; // radians
    this.speed = 2; // pixels per tick
    this.angularSpeed = Math.PI / 90; // radians per tick
    this.isMoving = false;
    this.laneDirection = 1; // 1 for right, -1 for left
    this.laneWidth = 2 * 16; // 2 tiles wide, matches robot size
    this.path = [];
    this.pathIndex = 0;
    this.home = { x: 16, y: 16 }; // Home station at top-left tile
    this.battery = 100; // percent
    this.charging = false;
    this.resumeIndex = 0; // Where to resume after charging
    this.forbiddenArea = null; // {x1, y1, x2, y2} in grid coords
    this.setRandomHome();
  }

  setRandomHome() {
    const TILE_SIZE = 16;
    const GRID_WIDTH = 50;
    const GRID_HEIGHT = 50;
    // Avoid edges for home station
    const min = 2, maxW = GRID_WIDTH - 3, maxH = GRID_HEIGHT - 3;
    const homeCol = Math.floor(Math.random() * (maxW - min + 1)) + min;
    const homeRow = Math.floor(Math.random() * (maxH - min + 1)) + min;
    this.home = {
      x: homeCol * TILE_SIZE + TILE_SIZE,
      y: homeRow * TILE_SIZE + TILE_SIZE
    };
  }

  setForbiddenArea(x1, y1, x2, y2) {
    if (x1 === null) {
      this.forbiddenArea = null;
    } else {
      this.forbiddenArea = {
        x1: Math.min(x1, x2),
        y1: Math.min(y1, y2),
        x2: Math.max(x1, x2),
        y2: Math.max(y1, y2)
      };
    }
    this.generatePath();
  }

  isForbidden(col, row) {
    if (!this.forbiddenArea) return false;
    const { x1, y1, x2, y2 } = this.forbiddenArea;
    // Check if any part of the robot's 2x2 body would overlap the forbidden area
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        const cx = col + dx;
        const cy = row + dy;
        if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) {
          return true;
        }
      }
    }
    return false;
  }

  // A* pathfinding from (startCol, startRow) to (endCol, endRow)
  aStar(startCol, startRow, endCol, endRow) {
    const TILE_SIZE = 16;
    const GRID_WIDTH = 50;
    const GRID_HEIGHT = 50;
    const ROBOT_SIZE = 2;
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = {};
    const gScore = {};
    const fScore = {};
    function key(col, row) { return `${col},${row}`; }
    function heuristic(c1, r1, c2, r2) {
      return Math.abs(c1 - c2) + Math.abs(r1 - r2);
    }
    openSet.push({ col: startCol, row: startRow });
    gScore[key(startCol, startRow)] = 0;
    fScore[key(startCol, startRow)] = heuristic(startCol, startRow, endCol, endRow);
    while (openSet.length > 0) {
      // Get node with lowest fScore
      openSet.sort((a, b) => fScore[key(a.col, a.row)] - fScore[key(b.col, b.row)]);
      const current = openSet.shift();
      if (current.col === endCol && current.row === endRow) {
        // Reconstruct path
        let path = [];
        let k = key(current.col, current.row);
        while (cameFrom[k]) {
          path.push({ x: current.col * TILE_SIZE + TILE_SIZE, y: current.row * TILE_SIZE + TILE_SIZE });
          const prev = cameFrom[k];
          current.col = prev.col;
          current.row = prev.row;
          k = key(current.col, current.row);
        }
        path.reverse();
        return path;
      }
      closedSet.add(key(current.col, current.row));
      // 4-way neighbors
      for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nc = current.col + dc;
        const nr = current.row + dr;
        if (nc < 0 || nr < 0 || nc > GRID_WIDTH-ROBOT_SIZE || nr > GRID_HEIGHT-ROBOT_SIZE) continue;
        if (this.isForbidden(nc, nr)) continue;
        const neighborKey = key(nc, nr);
        if (closedSet.has(neighborKey)) continue;
        const tentativeG = (gScore[key(current.col, current.row)] ?? Infinity) + 1;
        if (tentativeG < (gScore[neighborKey] ?? Infinity)) {
          cameFrom[neighborKey] = { col: current.col, row: current.row };
          gScore[neighborKey] = tentativeG;
          fScore[neighborKey] = tentativeG + heuristic(nc, nr, endCol, endRow);
          if (!openSet.some(n => n.col === nc && n.row === nr)) {
            openSet.push({ col: nc, row: nr });
          }
        }
      }
    }
    return null; // No path
  }

  generatePath() {
    // Use A* to cover the grid in a lawnmower pattern, skipping forbidden area
    const TILE_SIZE = 16;
    const GRID_WIDTH = 50;
    const GRID_HEIGHT = 50;
    const ROBOT_SIZE = 2;
    let targets = [];
    let direction = 1;
    for (let row = 0; row < GRID_HEIGHT; row += ROBOT_SIZE) {
      if (direction === 1) {
        for (let col = 0; col < GRID_WIDTH; col += 1) {
          if (!this.isForbidden(col, row)) {
            targets.push({ col, row });
          }
        }
      } else {
        for (let col = GRID_WIDTH - 1; col >= 0; col -= 1) {
          if (!this.isForbidden(col, row)) {
            targets.push({ col, row });
          }
        }
      }
      direction *= -1;
    }
    // Start from home
    let path = [];
    let currentCol = Math.floor(this.home.x / TILE_SIZE) - 1;
    let currentRow = Math.floor(this.home.y / TILE_SIZE) - 1;
    for (const target of targets) {
      if (currentCol === target.col && currentRow === target.row) continue;
      const segment = this.aStar(currentCol, currentRow, target.col, target.row);
      if (segment && segment.length > 0) {
        path = path.concat(segment);
        currentCol = target.col;
        currentRow = target.row;
      }
    }
    this.path = path;
    this.pathIndex = 0;
  }

  start() {
    this.setRandomHome();
    if (this.path.length === 0) this.generatePath();
    this.isMoving = false;
    this.charging = false;
    // Set robot position to home
    this.x = this.home.x;
    this.y = this.home.y;
    setTimeout(() => {
      this.isMoving = true;
    }, 1000);
  }
  stop() { this.isMoving = false; }
  reset(x, y, angle = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.isMoving = false;
    this.path = [];
    this.pathIndex = 0;
    this.battery = 100;
    this.charging = false;
    this.resumeIndex = 0;
    this.setRandomHome();
  }

  update() {
    if (this.charging) {
      this.battery += 0.5; // Charge rate
      if (this.battery >= 100) {
        this.battery = 100;
        this.charging = false;
        this.isMoving = true;
        this.pathIndex = this.resumeIndex;
      }
      return;
    }
    if (this.isMoving && this.path.length > 0) {
      // Battery check
      if (this.battery <= 20) {
        this.resumeIndex = this.pathIndex;
        this.goToHome();
        return;
      }
      const target = this.path[this.pathIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.speed) {
        this.x = target.x;
        this.y = target.y;
        this.pathIndex++;
        this.battery -= 0.05; // Decrease battery per move (half as much)
        if (this.pathIndex >= this.path.length) {
          this.stop();
        }
      } else {
        const angleToTarget = Math.atan2(dy, dx);
        this.x += this.speed * Math.cos(angleToTarget);
        this.y += this.speed * Math.sin(angleToTarget);
        this.angle = angleToTarget;
        this.battery -= 0.05; // Decrease battery per move (half as much)
      }
    }
  }

  goToHome() {
    // Set a temporary path to home
    this.isMoving = false;
    this.charging = false;
    this.tempPath = [
      { x: this.home.x, y: this.home.y }
    ];
    this.tempPathIndex = 0;
    this.goingHome = true;
  }

  updateGoHome() {
    if (this.goingHome && this.tempPath && this.tempPath.length > 0) {
      const target = this.tempPath[this.tempPathIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.speed) {
        this.x = target.x;
        this.y = target.y;
        this.goingHome = false;
        this.charging = true;
        this.isMoving = false;
      } else {
        const angleToTarget = Math.atan2(dy, dx);
        this.x += this.speed * Math.cos(angleToTarget);
        this.y += this.speed * Math.sin(angleToTarget);
        this.angle = angleToTarget;
        this.battery -= 0.05; // Decrease battery per move (half as much)
      }
    }
  }

  tick() {
    if (this.goingHome) {
      this.updateGoHome();
    } else {
      this.update();
    }
  }

  rotateLeft() { this.angle -= this.angularSpeed; }
  rotateRight() { this.angle += this.angularSpeed; }
}

// Export for use in render.js
window.Robot = Robot;
