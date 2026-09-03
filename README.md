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
python3 server.py --host 127.0.0.1 --port 8780
```

Then open `http://127.0.0.1:8780/`.

For homelab hosting tasks, use `q5m.yaml`, the global `q5m-lab-hosting` skill, and `q5m-lab` rather than creating project-specific infrastructure instructions.

## Production

The public site is available at `https://bunny-hop.q5m.ai/`. Its retained production contract is under `q5m/`. GitHub Pages is disabled and is not part of production.
