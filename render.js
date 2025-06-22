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

let forbiddenArea = null;
let isDrawingForbidden = false;
let startCell = null;

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
  // Label the home station
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.fillText('HOME', robot.home.x, robot.home.y - TILE_SIZE - 6);
  ctx.restore();
}

function drawForbiddenArea() {
  if (forbiddenArea) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,0,0,0.25)';
    ctx.strokeStyle = '#FF4136';
    ctx.lineWidth = 2;
    const left = forbiddenArea.x1 * TILE_SIZE;
    const top = forbiddenArea.y1 * TILE_SIZE;
    const width = (forbiddenArea.x2 - forbiddenArea.x1 + 1) * TILE_SIZE;
    const height = (forbiddenArea.y2 - forbiddenArea.y1 + 1) * TILE_SIZE;
    ctx.fillRect(left, top, width, height);
    ctx.strokeRect(left, top, width, height);
    ctx.restore();
  }
}

// Remove drawBattery and update render/loop to update the battery display in the DOM
function updateBatteryDisplay() {
  const batteryDiv = document.getElementById('batteryDisplay');
  if (batteryDiv) {
    batteryDiv.textContent = `Battery: ${Math.round(robot.battery)}%`;
    batteryDiv.style.color = robot.battery > 20 ? '#2ECC40' : '#FF4136';
  }
}

function render() {
  drawMap();
  drawForbiddenArea();
  drawPath();
  drawHomeStation();
  drawRobot();
  updateBatteryDisplay();
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
  if (forbiddenArea) {
    robot.setForbiddenArea(forbiddenArea.x1, forbiddenArea.y1, forbiddenArea.x2, forbiddenArea.y2);
  } else {
    robot.setForbiddenArea(null, null, null, null); // clear
  }
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

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  startCell = {
    x: Math.floor(x / TILE_SIZE),
    y: Math.floor(y / TILE_SIZE)
  };
  isDrawingForbidden = true;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawingForbidden) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const endCell = {
    x: Math.floor(x / TILE_SIZE),
    y: Math.floor(y / TILE_SIZE)
  };
  forbiddenArea = {
    x1: Math.min(startCell.x, endCell.x),
    y1: Math.min(startCell.y, endCell.y),
    x2: Math.max(startCell.x, endCell.x),
    y2: Math.max(startCell.y, endCell.y)
  };
  render();
});

canvas.addEventListener('mouseup', () => {
  isDrawingForbidden = false;
});

// Initial render
render();
