# Hop for the Prize!

A polished, mobile-first recruitment website for The Gatekeeper's friendly, voluntary bunny-hopping market activity. It is a dependency-free static site with an original SVG illustration, welfare-first guidance, accessible controls, a privacy-respecting email interest form, and an on-demand Gatekeeper video reference.

## Files

- `public/index.html` — semantic one-page site and all copy
- `public/styles.css` — responsive design, accessible focus states, and reduced-motion support
- `public/event.js` — **the single place to edit event details**
- `public/popup-video.js` — event display, Gatekeeper dialog, and local `mailto:` form preparation
- `public/favicon.svg`, `public/social-card.svg` — original local artwork
- The friendly cartoon Gatekeeper is an original inline SVG in `public/index.html`; the real Gatekeeper appears only after the video is opened
- `public/404.html` — custom not-found page
- `q5m.yaml` — application facts used by the global `q5m-lab-hosting` skill and `q5m-lab`
- `server.py` — local static HTTP server with security headers

## Edit event details

Open `public/event.js` and replace the empty strings in `window.HOP_EVENT`. Leave unknown values empty. Once `contactEmail` contains a valid address, the form enables itself and opens the visitor's email client with a prefilled message. The site itself never stores or transmits form data.

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

The public site is a standalone project at `https://bunny-hop.q5m.ai/`. Its production contract is under `q5m/` and runs as the dedicated `q5m-bunny-hop-site-1` container on `q5m-n01`, reached through the n01 Cloudflare Tunnel on port `8780`. GitHub Pages is disabled and is not part of production. This project does not belong to q5m-platform.
