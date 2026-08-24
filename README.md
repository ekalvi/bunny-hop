# Hop for the Prize!

A polished, mobile-first comedy site about The Gatekeeper, his rules, number and cute-colour allocation, and an interactive bunny side-scroller. It is dependency-free, uses accessible controls, and loads Gatekeeper media only when triggered.

## Files

- `index.html` — semantic one-page site and all copy
- `styles.css` — responsive design, accessible focus states, and reduced-motion support
- `script.js` — lazy, accessible Gatekeeper dialog behavior
- `favicon.svg`, `social-card.svg` — original local artwork
- The friendly cartoon Gatekeeper is an original inline SVG in `index.html`; the real Gatekeeper appears only after the video is opened
- `404.html` — custom not-found page
- `server.py` — LAN-only static HTTP server with security headers

## Run locally

```bash
cd /Users/erik/code/bunny-hopppers
python3 server.py --host 127.0.0.1 --port 8780
```

Then open `http://127.0.0.1:8780/`.

## LAN publishing

The site is published as the PM2 process `q5m-bunny-hop`, bound only to the host's LAN address (`10.1.1.211`) on port `8780`. PM2's existing launchd integration restores saved processes after login/reboot without modifying other q5m services.

- LAN URL: `http://q5m-dev.localdomain:8780/`
- Direct fallback: `http://10.1.1.211:8780/`

Restart or stop:

```bash
pm2 restart q5m-bunny-hop
pm2 stop q5m-bunny-hop
```

After starting or deleting PM2 processes, run `pm2 save` to update reboot persistence.

Status and logs:

```bash
pm2 status q5m-bunny-hop
pm2 logs q5m-bunny-hop --lines 100
```

## Production

The public site is a standalone project at `https://bunny-hop.q5m.ai/`. Its production contract is under `q5m/` and runs as the dedicated `bunny-hop-site-1` container on `q5m-n02`, reached through the `q5m-prod-n02` Cloudflare Tunnel on port `8780`. GitHub Pages is disabled and is not part of production. This project does not belong to q5m-platform.
