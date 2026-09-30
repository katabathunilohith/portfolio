# Lohith Katabathuni — Portfolio

A single-page portfolio with smooth scrolling and scroll-driven animation.

## Run locally

It's a static site, so any static server works:

```bash
python3 -m http.server 5178
```

Then open http://localhost:5178. You can also double-click `index.html`, but a server is closer to how it runs in production.

## Deploy

Upload the folder as-is to any static host. On **Vercel** or **Netlify**, drag the folder in or import the repo; there's no build step. On **GitHub Pages**, push to a repo and enable Pages on the root.

## Where to edit things

| What | Where |
| --- | --- |
| Project cards (titles, tags, links) | `index.html`, `<section class="work">`. Knit, Omegle and File Comparator link to their repos. IEEE P3382, Prime Video, Instagram, X, Job Allocation and Tally have no public repo yet, so they link to your profile. Paste each repo URL into that card's `href` once it's published. |
| Skill deck cards | `index.html`, `<section class="deck">`. The text under the deck comes from each card's `data-detail`. |
| Milestone carousel | `index.html`, `<section class="beyond">`. Each card's caption comes from its `data-meta`, `data-title` and `data-desc`. Add `data-link` to show a link under the caption. It reads "VIEW REPO" unless you set `data-link-label`. |
| Contact links (email, GitHub, LinkedIn, résumé) | `index.html`, `<section class="contact">` |
| Hero captions | `index.html`, the four `.cap` blocks in the hero |
| Colours, fonts, spacing | `css/style.css`, `:root` |
| Résumé PDF | `assets/Lohith_Katabathuni_Resume.pdf`. Replace it with an export from Word if you prefer your original layout, and bump the `?v=` tag on the contact link so browsers fetch the new file. |

## How it's built

- `js/main.js` handles smooth scroll (Lenis) and the GSAP ScrollTrigger scenes: the loader, the pinned hero, the reveals, the card fan and the coverflow.
- `js/glitch.js` draws the giant "PORTFOLIO" in WebGL and tears it into slices along the cursor trail.
- `js/visuals.js` draws the procedural artwork: the black hole, the MRI slice, and the charts.
- `assets/img/` holds your photo, cut out on-device with macOS Vision, as a silhouette, a black-and-white version and a red studio portrait.

Libraries load from jsDelivr: GSAP 3.13, ScrollTrigger and Lenis 1.3. Fonts come from Google Fonts: Anton, Inter Tight, JetBrains Mono and Grand Hotel.
