(() => {
  "use strict";
  const canvas = document.querySelector("#bunny-game-canvas");
  const startButton = document.querySelector("#game-start");
  const jumpButton = document.querySelector("#game-jump");
  const status = document.querySelector("#game-status");
  const scoreNode = document.querySelector("#game-score");
  const overlay = document.querySelector("#game-gatekeeper");
  const gatekeeperPhoto = document.querySelector("#game-gatekeeper-photo");
  const verdict = document.querySelector("#game-verdict");
  const retryButton = document.querySelector("#game-retry");
  if (!canvas || !startButton || !jumpButton || !status || !scoreNode || !overlay) return;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const ground = 330;
  const bunny = { x: 122, y: ground - 55, width: 58, height: 55, vy: 0 };
  let obstacles = [];
  let snacks = [];
  let playing = false;
  let score = 0;
  let elapsed = 0;
  let nextSpawn = 0.8;
  let lastTime = 0;
  let animation = 0;
  let spawnCount = 0;
  let gobbleFlash = 0;

  const announce = text => { status.textContent = text; };
  const reset = () => {
    cancelAnimationFrame(animation);
    obstacles = [];
    snacks = [];
    bunny.y = ground - bunny.height;
    bunny.vy = 0;
    score = 0;
    elapsed = 0;
    nextSpawn = 0.7;
    spawnCount = 0;
    gobbleFlash = 0;
    scoreNode.textContent = "0";
    overlay.hidden = true;
    overlay.classList.remove("is-crashing", "is-resting");
    startButton.textContent = "Start hopping";
    draw();
  };

  const start = () => {
    reset();
    playing = true;
    startButton.textContent = "Restart game";
    announce("Game started. Press Space, Arrow Up, or the Hop button to jump.");
    lastTime = performance.now();
    animation = requestAnimationFrame(loop);
  };

  const jump = () => {
    if (!playing) start();
    bunny.vy = -670;
  };

  const intersects = (a, b, inset = 0) =>
    a.x + inset < b.x + b.width && a.x + a.width - inset > b.x &&
    a.y + inset < b.y + b.height && a.y + a.height - inset > b.y;

  const spawn = () => {
    spawnCount += 1;
    const hurdleHeight = 42 + Math.random() * 38;
    obstacles.push({ x: W + 30, y: ground - hurdleHeight, width: 44, height: hurdleHeight });
    const isIceberg = spawnCount > 2 && Math.random() < 0.24;
    snacks.push({
      x: W + 95,
      y: ground - hurdleHeight - 82 - Math.random() * 34,
      width: 43,
      height: 36,
      type: isIceberg ? "iceberg" : "romaine",
      eaten: false
    });
  };

  const finish = (iceberg = false) => {
    playing = false;
    cancelAnimationFrame(animation);
    const messages = ["You maggot!", "You are banished!"];
    verdict.textContent = messages[Math.floor(Math.random() * messages.length)];
    if (!gatekeeperPhoto.src) gatekeeperPhoto.src = gatekeeperPhoto.dataset.src;
    overlay.classList.remove("is-resting");
    overlay.classList.add("is-crashing");
    const reason = iceberg ? "You accidentally ate iceberg lettuce." : "Your bunny bumped an obstacle.";
    announce(`${verdict.textContent} ${reason} Score: ${score}.`);
    overlay.hidden = false;
  };

  const update = dt => {
    elapsed += dt;
    nextSpawn -= dt;
    gobbleFlash = Math.max(0, gobbleFlash - dt);
    if (nextSpawn <= 0) {
      spawn();
      nextSpawn = Math.max(1.18, 1.58 - elapsed * 0.006);
    }

    bunny.vy += 1750 * dt;
    bunny.y += bunny.vy * dt;
    if (bunny.y + bunny.height >= ground) {
      bunny.y = ground - bunny.height;
      bunny.vy = 0;
    }
    if (bunny.y < 12) {
      bunny.y = 12;
      bunny.vy = 80;
    }

    const speed = Math.min(390, 270 + elapsed * 2.4);
    obstacles.forEach(item => { item.x -= speed * dt; });
    snacks.forEach(item => { item.x -= speed * dt; });
    obstacles = obstacles.filter(item => item.x + item.width > -20);
    snacks = snacks.filter(item => !item.eaten && item.x + item.width > -20);

    if (obstacles.some(item => intersects(bunny, item, 9))) {
      finish(false);
      return;
    }
    for (const snack of snacks) {
      if (!snack.eaten && intersects(bunny, snack, 8)) {
        snack.eaten = true;
        if (snack.type === "iceberg") {
          finish(true);
          return;
        }
        score += 1;
        scoreNode.textContent = String(score);
        gobbleFlash = 0.55;
        announce(`Crunch! Romaine gobbled. Score: ${score}.`);
      }
    }
  };

  const roundRect = (x, y, width, height, radius, fill, stroke) => {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
  };

  const drawBunny = () => {
    ctx.save();
    ctx.translate(bunny.x, bunny.y);
    ctx.fillStyle = "#fffaf0";
    ctx.strokeStyle = "#173b32";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(29, 34, 27, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(43, 19, 17, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(38, 1, 6, 20, -0.22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(50, 2, 6, 19, 0.28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#efb5aa"; ctx.beginPath(); ctx.ellipse(38, 1, 2, 13, -0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(50, 2, 2, 12, 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#173b32"; ctx.beginPath(); ctx.arc(48, 18, 2.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e66a5d"; ctx.beginPath(); ctx.arc(59, 24, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = "#173b32"; ctx.beginPath(); ctx.arc(5, 34, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  };

  const drawSnack = snack => {
    ctx.save(); ctx.translate(snack.x, snack.y);
    if (snack.type === "romaine") {
      ctx.fillStyle = "#4f8249";
      ctx.beginPath(); ctx.ellipse(14, 19, 14, 20, -0.55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(29, 18, 14, 20, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#a6c96d"; ctx.beginPath(); ctx.ellipse(22, 19, 10, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#e0eba9"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(22, 34); ctx.lineTo(22, 5); ctx.stroke();
    } else {
      ctx.fillStyle = "#d8efb8"; ctx.strokeStyle = "#75945b"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(2, 31); ctx.lineTo(8, 12); ctx.lineTo(18, 20); ctx.lineTo(25, 5); ctx.lineTo(33, 21); ctx.lineTo(41, 14); ctx.lineTo(42, 33); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#dff2f2"); sky.addColorStop(1, "#f7f1df"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(680, 68, 26, 0, Math.PI * 2); ctx.arc(714, 65, 34, 0, Math.PI * 2); ctx.arc(750, 72, 23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b9d99f"; ctx.beginPath(); ctx.moveTo(0, 265); ctx.quadraticCurveTo(180, 170, 360, 270); ctx.quadraticCurveTo(620, 150, 900, 270); ctx.lineTo(900, ground); ctx.lineTo(0, ground); ctx.fill();
    ctx.fillStyle = "#6f9c58"; ctx.fillRect(0, ground, W, H - ground);
    ctx.strokeStyle = "#517b42"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, ground); ctx.lineTo(W, ground); ctx.stroke();
    obstacles.forEach(item => {
      roundRect(item.x, item.y, item.width, item.height, 5, "#c67636", "#744326");
      ctx.strokeStyle = "#8d4f29"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(item.x + 7, item.y + 14); ctx.lineTo(item.x + item.width - 7, item.y + 14); ctx.stroke();
    });
    snacks.filter(item => !item.eaten).forEach(drawSnack);
    drawBunny();
    if (gobbleFlash > 0) {
      ctx.fillStyle = "#174d3d"; ctx.font = "bold 25px Arial"; ctx.fillText("CRUNCH! +1", bunny.x + 72, bunny.y - 6);
    }
    if (!playing && overlay.hidden) {
      ctx.fillStyle = "rgba(23,59,50,.78)"; roundRect(W / 2 - 190, H / 2 - 42, 380, 84, 20, "rgba(23,59,50,.82)");
      ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 25px Georgia"; ctx.fillText("Press Start, then hop!", W / 2, H / 2 + 8); ctx.textAlign = "start";
    }
  };

  const loop = time => {
    if (!playing) return;
    const dt = Math.min(0.032, (time - lastTime) / 1000);
    lastTime = time;
    update(dt);
    draw();
    if (playing) animation = requestAnimationFrame(loop);
  };

  startButton.addEventListener("click", start);
  jumpButton.addEventListener("click", jump);
  retryButton?.addEventListener("click", start);
  canvas.addEventListener("pointerdown", event => { event.preventDefault(); jump(); });
  window.addEventListener("keydown", event => {
    if ((event.code === "Space" || event.code === "ArrowUp") && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      event.preventDefault();
      jump();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && playing) {
      playing = false;
      cancelAnimationFrame(animation);
      announce("Game paused. Press Start hopping to play again.");
      startButton.textContent = "Start hopping";
    }
  });
  reset();
})();
