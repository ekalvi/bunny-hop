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
  const cameo = document.querySelector("#game-video-cameo");
  const cameoFrame = document.querySelector("#game-video-frame");
  const deathAudioFrame = document.querySelector("#game-audio-frame");
  if (!canvas || !startButton || !jumpButton || !status || !scoreNode || !overlay || !cameo || !cameoFrame || !deathAudioFrame) return;

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
  let inputLockedUntil = 0;
  let unlockTimer = 0;
  let cameoTimer = 0;
  let cameoVolumeTimer = 0;
  let deathAudioTimer = 0;

  const hurdleKinds = ["rails", "cross", "brush", "wall"];
  const hurdleFlags = ["sweden", "england", "scotland", "france", "netherlands", "ireland"];

  const announce = text => { status.textContent = text; };

  const youtubeCommand = (frame, func, args = []) => {
    frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube.com");
  };

  const hideCameo = () => {
    clearTimeout(cameoTimer);
    clearInterval(cameoVolumeTimer);
    cameo.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!cameo.classList.contains("is-visible")) {
        cameo.hidden = true;
        cameoFrame.replaceChildren();
      }
    }, 650);
  };

  const playGatekeeperCameo = (startAt, duration) => {
    clearTimeout(cameoTimer);
    clearInterval(cameoVolumeTimer);
    cameoFrame.replaceChildren();
    const frame = document.createElement("iframe");
    frame.title = "A brief message from The Gatekeeper";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.src = `https://www.youtube.com/embed/3g31Dj-sEiA?autoplay=1&mute=1&start=${startAt}&end=${startAt + duration}&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    frame.addEventListener("load", () => {
      let volume = 0;
      youtubeCommand(frame, "unMute");
      youtubeCommand(frame, "setVolume", [volume]);
      cameoVolumeTimer = window.setInterval(() => {
        volume = Math.min(26, volume + 4);
        youtubeCommand(frame, "setVolume", [volume]);
        if (volume >= 26) clearInterval(cameoVolumeTimer);
      }, 90);
      window.setTimeout(() => {
        clearInterval(cameoVolumeTimer);
        cameoVolumeTimer = window.setInterval(() => {
          volume = Math.max(0, volume - 4);
          youtubeCommand(frame, "setVolume", [volume]);
          if (volume <= 0) clearInterval(cameoVolumeTimer);
        }, 90);
      }, Math.max(800, duration * 1000 - 900));
    }, { once: true });
    cameoFrame.append(frame);
    cameo.hidden = false;
    requestAnimationFrame(() => cameo.classList.add("is-visible"));
    cameoTimer = window.setTimeout(hideCameo, duration * 1000 + 250);
  };

  const hideDeathAudio = () => {
    clearTimeout(deathAudioTimer);
    deathAudioFrame.replaceChildren();
  };

  const playGatekeeperDeathAudio = (startAt, duration) => {
    hideDeathAudio();
    const frame = document.createElement("iframe");
    frame.title = "Gatekeeper game-over audio";
    frame.allow = "autoplay; encrypted-media";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.src = `https://www.youtube.com/embed/3g31Dj-sEiA?autoplay=1&mute=1&start=${startAt}&end=${startAt + duration}&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    frame.addEventListener("load", () => {
      youtubeCommand(frame, "seekTo", [startAt, true]);
      youtubeCommand(frame, "setVolume", [48]);
      youtubeCommand(frame, "unMute");
    }, { once: true });
    deathAudioFrame.append(frame);
    deathAudioTimer = window.setTimeout(hideDeathAudio, duration * 1000 + 400);
  };

  const reset = () => {
    cancelAnimationFrame(animation);
    clearTimeout(unlockTimer);
    hideCameo();
    hideDeathAudio();
    inputLockedUntil = 0;
    startButton.disabled = false;
    jumpButton.disabled = false;
    if (retryButton) retryButton.disabled = false;
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
    if (performance.now() < inputLockedUntil) return;
    reset();
    playing = true;
    startButton.textContent = "Restart game";
    announce("Game started. Press Space, Arrow Up, or the Hop button to jump.");
    lastTime = performance.now();
    animation = requestAnimationFrame(loop);
  };

  const jump = () => {
    if (performance.now() < inputLockedUntil) return;
    if (!playing) start();
    if (playing) bunny.vy = -670;
  };

  const intersects = (a, b, inset = 0) =>
    a.x + inset < b.x + b.width && a.x + a.width - inset > b.x &&
    a.y + inset < b.y + b.height && a.y + a.height - inset > b.y;

  const spawn = () => {
    spawnCount += 1;
    const hurdleHeight = 54 + Math.random() * 34;
    obstacles.push({
      x: W + 30,
      y: ground - hurdleHeight,
      width: 76,
      height: hurdleHeight,
      kind: hurdleKinds[Math.floor(Math.random() * hurdleKinds.length)],
      flag: hurdleFlags[Math.floor(Math.random() * hurdleFlags.length)]
    });
    const isIceberg = spawnCount > 2 && Math.random() < 0.24;
    snacks.push({
      x: W + 150,
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
    hideCameo();
    const messages = [
      { text: "You maggot!", startAt: 1463, duration: 2 },
      { text: "You are banished!", startAt: 2214.2, duration: 4.3 }
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    verdict.textContent = message.text;
    playGatekeeperDeathAudio(message.startAt, message.duration);
    if (!gatekeeperPhoto.src) gatekeeperPhoto.src = gatekeeperPhoto.dataset.src;
    overlay.classList.remove("is-resting");
    overlay.classList.add("is-crashing");
    inputLockedUntil = performance.now() + 1600;
    startButton.disabled = true;
    jumpButton.disabled = true;
    if (retryButton) retryButton.disabled = true;
    clearTimeout(unlockTimer);
    unlockTimer = window.setTimeout(() => {
      startButton.disabled = false;
      jumpButton.disabled = false;
      if (retryButton) retryButton.disabled = false;
    }, 1600);
    const reason = iceberg ? "You accidentally ate iceberg lettuce." : "Your bunny bumped an obstacle.";
    announce(`${verdict.textContent} ${reason} Score: ${score}. Controls unlock in a moment.`);
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
        if (score % 9 === 0) playGatekeeperCameo(1457, 8);
        else if (score % 3 === 0) playGatekeeperCameo(1444, 4);
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

  const drawFlag = (name, x, y) => {
    const width = 29;
    const height = 18;
    ctx.fillStyle = "#69452f";
    ctx.fillRect(x - 2, y - 3, 3, height + 11);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
    if (name === "sweden") {
      ctx.fillStyle = "#2675b8"; ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "#f5cf43"; ctx.fillRect(x + 9, y, 4, height); ctx.fillRect(x, y + 7, width, 4);
    } else if (name === "england") {
      ctx.fillStyle = "#fff"; ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "#d73a3a"; ctx.fillRect(x + 12, y, 5, height); ctx.fillRect(x, y + 7, width, 5);
    } else if (name === "scotland") {
      ctx.fillStyle = "#2471b9"; ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + width, y + height); ctx.moveTo(x + width, y); ctx.lineTo(x, y + height); ctx.stroke();
    } else if (name === "france") {
      ctx.fillStyle = "#2450a4"; ctx.fillRect(x, y, width / 3, height);
      ctx.fillStyle = "#fff"; ctx.fillRect(x + width / 3, y, width / 3, height);
      ctx.fillStyle = "#e03b42"; ctx.fillRect(x + width * 2 / 3, y, width / 3, height);
    } else if (name === "netherlands") {
      ctx.fillStyle = "#ae1c28"; ctx.fillRect(x, y, width, height / 3);
      ctx.fillStyle = "#fff"; ctx.fillRect(x, y + height / 3, width, height / 3);
      ctx.fillStyle = "#21468b"; ctx.fillRect(x, y + height * 2 / 3, width, height / 3);
    } else {
      ctx.fillStyle = "#169b62"; ctx.fillRect(x, y, width / 3, height);
      ctx.fillStyle = "#fff"; ctx.fillRect(x + width / 3, y, width / 3, height);
      ctx.fillStyle = "#ff883e"; ctx.fillRect(x + width * 2 / 3, y, width / 3, height);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(23,59,50,.35)"; ctx.lineWidth = 1; ctx.strokeRect(x, y, width, height);
  };

  const drawStripedRail = (left, top, width, offset = 0) => {
    const pieces = 6;
    for (let piece = 0; piece < pieces; piece += 1) {
      ctx.fillStyle = (piece + offset) % 2 ? "#fffaf0" : "#e66a37";
      ctx.fillRect(left + piece * width / pieces, top, width / pieces + 1, 9);
    }
    ctx.strokeStyle = "#744326"; ctx.lineWidth = 2; ctx.strokeRect(left, top, width, 9);
  };

  const drawHurdle = hurdle => {
    const { x, y, width, height, kind, flag } = hurdle;
    const left = x + 8;
    const innerWidth = width - 16;
    ctx.save();
    roundRect(x + 3, y - 8, 10, height + 8, 3, "#744326");
    roundRect(x + width - 13, y - 8, 10, height + 8, 3, "#744326");
    ctx.fillStyle = "#f6c85f";
    ctx.beginPath(); ctx.arc(x + 8, y - 8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + width - 8, y - 8, 7, 0, Math.PI * 2); ctx.fill();

    if (kind === "cross") {
      ctx.strokeStyle = "#fffaf0"; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(left, y + 10); ctx.lineTo(left + innerWidth, y + height - 12); ctx.moveTo(left + innerWidth, y + 10); ctx.lineTo(left, y + height - 12); ctx.stroke();
      ctx.strokeStyle = "#e66a37"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(left, y + 10); ctx.lineTo(left + innerWidth, y + height - 12); ctx.moveTo(left + innerWidth, y + 10); ctx.lineTo(left, y + height - 12); ctx.stroke();
    } else if (kind === "brush") {
      drawStripedRail(left, y + 12, innerWidth);
      ctx.fillStyle = "#3f7c49"; ctx.fillRect(left, y + height - 23, innerWidth, 22);
      for (let leaf = 0; leaf < 7; leaf += 1) {
        ctx.beginPath(); ctx.arc(left + 5 + leaf * 9, y + height - 24 - (leaf % 2) * 5, 9, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === "wall") {
      roundRect(left, y + 14, innerWidth, height - 15, 3, "#d59658", "#744326");
      ctx.strokeStyle = "#a75d34"; ctx.lineWidth = 2;
      for (let row = y + 29; row < y + height; row += 14) { ctx.beginPath(); ctx.moveTo(left, row); ctx.lineTo(left + innerWidth, row); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(left + innerWidth / 2, y + 14); ctx.lineTo(left + innerWidth / 2, y + height); ctx.stroke();
    } else {
      drawStripedRail(left, y + 15, innerWidth);
      drawStripedRail(left, y + Math.min(41, height - 17), innerWidth, 1);
    }

    roundRect(x - 3, y + height - 6, 22, 7, 3, "#744326");
    roundRect(x + width - 19, y + height - 6, 22, 7, 3, "#744326");
    drawFlag(flag, x + 9, y - 35);
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
    obstacles.forEach(drawHurdle);
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
