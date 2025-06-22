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
  }

  generatePath() {
    // Generate a lawnmower pattern path covering the grid
    const TILE_SIZE = 16;
    const GRID_WIDTH = 50;
    const GRID_HEIGHT = 50;
    const ROBOT_SIZE = 2; // in tiles
    this.path = [];
    let direction = 1; // 1: right, -1: left
    for (let row = 0; row < GRID_HEIGHT; row += ROBOT_SIZE) {
      if (direction === 1) {
        for (let col = 0; col < GRID_WIDTH; col += 1) {
          this.path.push({
            x: col * TILE_SIZE + TILE_SIZE,
            y: row * TILE_SIZE + TILE_SIZE
          });
        }
      } else {
        for (let col = GRID_WIDTH - 1; col >= 0; col -= 1) {
          this.path.push({
            x: col * TILE_SIZE + TILE_SIZE,
            y: row * TILE_SIZE + TILE_SIZE
          });
        }
      }
      direction *= -1;
    }
    this.pathIndex = 0;
  }

  start() {
    if (this.path.length === 0) this.generatePath();
    this.isMoving = true;
    this.charging = false;
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
        this.battery -= 0.05; // Decrease battery per move
        if (this.pathIndex >= this.path.length) {
          this.stop();
        }
      } else {
        const angleToTarget = Math.atan2(dy, dx);
        this.x += this.speed * Math.cos(angleToTarget);
        this.y += this.speed * Math.sin(angleToTarget);
        this.angle = angleToTarget;
        this.battery -= 0.05; // Decrease battery per move
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
        this.battery -= 0.05;
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
