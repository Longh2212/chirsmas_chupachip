/* ================== SETUP ================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const audio = document.getElementById("myAudio");
const overlay = document.getElementById("startOverlay");
const nextBtn = document.getElementById("nextBtn");

let started = false;
let shootInterval = null;
let starInterval = null;

/* ================== DATA ================== */
const stars = [];
const explosions = [];
const shootingStars = [];
const dots = [];
const targetDotsQueue = [];

const fullText = ["Merry phát tài", "Cung hỷ Christmas"];
const fontSize = 100;
const fontFamily = "Arial";
const lineHeight = 120;

const bearX = 70;
let bearY = 0;

let currentCharIndex = 0;
let animationDone = false;

/* ================== OVERLAY CLICK ================== */
overlay.addEventListener("click", () => {
  if (started) return;
  started = true;

  // Fade-in audio
  audio.volume = 0;
  audio.play().catch(console.log);

  let v = 0;
  const fadeIn = setInterval(() => {
    v += 0.05;
    if (v >= 1) {
      v = 1;
      clearInterval(fadeIn);
    }
    audio.volume = v;
  }, 100);

  shootInterval = setInterval(shootDot, 30);
  starInterval = setInterval(createShootingStar, 1500);
  animate();

  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
  setTimeout(() => overlay.remove(), 500);
});

/* ================== NEXT BUTTON (FADE OUT MUSIC) ================== */
nextBtn.addEventListener("click", (e) => {
  e.preventDefault();

  let v = audio.volume;
  const fadeOut = setInterval(() => {
    v -= 0.05;
    if (v <= 0) {
      v = 0;
      clearInterval(fadeOut);
      audio.pause();
      window.location.href = "../question/index.html";
    }
    audio.volume = v;
  }, 80);
});

/* ================== RESIZE ================== */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  bearY = canvas.height - 80;

  stars.length = 0;
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: Math.random() * 0.02 + 0.005
    });
  }

  targetDotsQueue.length = 0;
  currentCharIndex = 0;
  animationDone = false;

  generateAllTargetDots();
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ================== STARS ================== */
function drawStars() {
  for (const star of stars) {
    star.alpha += star.delta;
    if (star.alpha >= 1 || star.alpha <= 0) star.delta *= -1;

    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/* ================== SHOOTING STARS ================== */
function createShootingStar() {
  shootingStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height / 2,
    length: Math.random() * 300 + 100,
    speed: Math.random() * 10 + 6,
    angle: Math.PI / 4,
    opacity: 1
  });
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    const endX = s.x - Math.cos(s.angle) * s.length;
    const endY = s.y - Math.sin(s.angle) * s.length;

    const g = ctx.createLinearGradient(s.x, s.y, endX, endY);
    g.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
    g.addColorStop(1, "rgba(255,255,255,0)");

    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.opacity -= 0.01;

    if (s.opacity <= 0) shootingStars.splice(i, 1);
  }
}

/* ================== TEXT DOTS ================== */
function generateCharDots(char, x, y) {
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = canvas.height;
  const tctx = temp.getContext("2d");

  tctx.font = `bold ${fontSize}px ${fontFamily}`;
  tctx.fillText(char, x, y);

  const data = tctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const result = [];

  for (let y = 0; y < canvas.height; y += 4) {
    for (let x = 0; x < canvas.width; x += 4) {
      if (data[(y * canvas.width + x) * 4 + 3] > 128) {
        result.push({ x, y });
      }
    }
  }
  return result;
}

function generateAllTargetDots() {
  const tempCtx = document.createElement("canvas").getContext("2d");
  tempCtx.font = `bold ${fontSize}px ${fontFamily}`;

  const startY = (canvas.height - fullText.length * lineHeight) / 2;

  fullText.forEach((line, li) => {
    let x = (canvas.width - tempCtx.measureText(line).width) / 2;
    const y = startY + li * lineHeight;

    for (const ch of line) {
      if (ch === " ") {
        x += tempCtx.measureText(" ").width;
        targetDotsQueue.push([]);
        continue;
      }
      const dots = generateCharDots(ch, x, y);
      targetDotsQueue.push(dots);
      x += tempCtx.measureText(ch).width;
    }
  });
}

/* ================== DOT SHOOT ================== */
function shootDot() {
  if (animationDone) return;

  while (
    currentCharIndex < targetDotsQueue.length &&
    targetDotsQueue[currentCharIndex].length === 0
  ) {
    currentCharIndex++;
  }

  const targetDots = targetDotsQueue[currentCharIndex];
  if (!targetDots || targetDots.length === 0) return;

  for (let i = 0; i < 5; i++) {
    const t = targetDots.shift();
    if (!t) return;

    dots.push({
      x: bearX + 40 + Math.random() * 20,
      y: bearY - 20,
      vx: Math.random() * 4,
      vy: -Math.random() * 4,
      targetX: t.x,
      targetY: t.y
    });
  }

  if (targetDots.length === 0) currentCharIndex++;
}

/* ================== EXPLOSION ================== */
function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 6 + 2;
    explosions.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 60,
      opacity: 1
    });
  }
}

/* ================== ANIMATION LOOP ================== */
function animate() {
  if (!started) return;

  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, "#0a001f");
  g.addColorStop(1, "#1a0033");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawShootingStars();

  dots.forEach(d => {
    d.vx += (d.targetX - d.x) * 0.002;
    d.vy += (d.targetY - d.y) * 0.002;
    d.vx *= 0.95;
    d.vy *= 0.91;
    d.x += d.vx;
    d.y += d.vy;

    ctx.font = "16px Arial";
    ctx.fillText("❤️", d.x, d.y);
  });

  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life--;
    p.opacity -= 0.015;

    ctx.globalAlpha = Math.max(p.opacity, 0);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (p.life <= 0 || p.opacity <= 0) explosions.splice(i, 1);
  }

  if (
    !animationDone &&
    currentCharIndex >= targetDotsQueue.length &&
    dots.every(d =>
      Math.abs(d.targetX - d.x) < 2 &&
      Math.abs(d.targetY - d.y) < 2
    )
  ) {
    animationDone = true;
    document.getElementById("bear").src =
      "https://i.pinimg.com/originals/7e/f6/9c/7ef69cd0a6b0b78526c8ce983b3296fc.gif";
    nextBtn.style.display = "block";
  }

  requestAnimationFrame(animate);
}

/* ================== EVENTS ================== */
canvas.addEventListener("click", e =>
  createExplosion(e.clientX, e.clientY)
);

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  if (t) createExplosion(t.clientX, t.clientY);
});
