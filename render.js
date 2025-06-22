// Rendering and UI logic
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const robot = new window.Robot(100, 200, 0);
let animationId = null;

const TILE_SIZE = 16; // Each tile is now 16x16 pixels
const GRID_WIDTH = 50;
const GRID_HEIGHT = 50;
canvas.width = TILE_SIZE * GRID_WIDTH;
canvas.height = TILE_SIZE * GRID_HEIGHT;

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw grid
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= canvas.width; x += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawRobot() {
  ctx.save();
  ctx.translate(robot.x, robot.y);
  ctx.rotate(robot.angle);
  ctx.fillStyle = '#0074D9';
  // Robot body: 2x2 tiles (32x32 pixels)
  ctx.fillRect(-TILE_SIZE, -TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
  ctx.fillStyle = '#FF4136';
  // Robot "sensor" or front: small rectangle at the front
  ctx.fillRect(TILE_SIZE * 0.5, -TILE_SIZE * 0.5, TILE_SIZE, TILE_SIZE);
  ctx.restore();
}

function drawPath() {
  if (robot.path && robot.path.length > 1) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.15)'; // Subtle blue line
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(robot.path[0].x, robot.path[0].y);
    for (let i = 1; i < robot.path.length; i++) {
      ctx.lineTo(robot.path[i].x, robot.path[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawHomeStation() {
  ctx.save();
  ctx.fillStyle = '#2ECC40';
  ctx.strokeStyle = '#006400';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(robot.home.x, robot.home.y, TILE_SIZE, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBattery() {
  ctx.save();
  ctx.fillStyle = '#222';
  ctx.fillRect(10, 10, 60, 16);
  ctx.fillStyle = robot.battery > 20 ? '#2ECC40' : '#FF4136';
  ctx.fillRect(12, 12, 0.56 * robot.battery, 12);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(10, 10, 60, 16);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(Math.round(robot.battery) + '%', 22, 22);
  ctx.restore();
}

function render() {
  drawMap();
  drawPath();
  drawHomeStation();
  drawRobot();
  drawBattery();
}

// Update animation loop to use robot.tick()
function loop() {
  robot.tick();
  render();
  animationId = requestAnimationFrame(loop);
}

// UI controls
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

startBtn.onclick = () => {
  robot.start();
  if (!animationId) loop();
};
stopBtn.onclick = () => {
  robot.stop();
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};
resetBtn.onclick = () => {
  robot.reset(100, 200, 0);
  render();
};

// Optional: Keyboard controls for rotation
window.addEventListener('keydown', (e) => {
  if (e.key === 'a') robot.rotateLeft();
  if (e.key === 'd') robot.rotateRight();
});

// Initial render
render();
