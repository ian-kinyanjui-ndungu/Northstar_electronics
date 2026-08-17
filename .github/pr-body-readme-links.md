## What this PR does

Converts external links in `README.md` from standard Markdown syntax to HTML anchors with `target="_blank" rel="noopener noreferrer"` so they open in a new browser tab when viewed on GitHub.

## Links updated

| Location | Link |
|---|---|
| Live Demo section | `https://northstarelectronics-production.up.railway.app/` |
| Live Demo section | Railway (`https://railway.app`) |
| Getting Started — Prerequisites | Node.js (`https://nodejs.org/`) |
| Getting Started — Prerequisites | TiDB Cloud free tier (`https://tidbcloud.com/`) |

## Why HTML instead of Markdown syntax?

Standard Markdown does not support `target="_blank"`. GitHub's README renderer supports inline HTML, so raw `<a>` tags with `target="_blank"` work correctly. `rel="noopener noreferrer"` is included as a security best practice to prevent the opened tab from accessing the opener's `window` object.

Internal anchor links (e.g. `#getting-started-local-setup`) and the localhost dev link were intentionally left as plain Markdown — opening those in a new tab would not be useful.
