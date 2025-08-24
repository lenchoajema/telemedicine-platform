# Ethiopic Font Installation

The app requests the following font files for Amharic (Ethiopic) rendering:

- /fonts/NotoSansEthiopic-Regular.woff2
- /fonts/NotoSansEthiopic-Bold.woff2

Currently they 404 because the files are missing. To fix:

## 1. Download Fonts

Option A (Recommended): From Google Fonts (Noto Sans Ethiopic) or upstream repository.

Download woff2 variants and rename exactly to:

- NotoSansEthiopic-Regular.woff2
- NotoSansEthiopic-Bold.woff2

## 2. Place Files

Copy both files into: frontend/public/fonts/

After placement, restart the dev server (or let Vite detect changes). Requests to http://localhost:5173/fonts/NotoSansEthiopic-Regular.woff2 should now succeed (HTTP 200).

## 3. Verify

1. Open dev tools Network tab, filter by "woff2".
2. Switch language to Amharic.
3. You should see successful 200 loads for both font files and body element has class `ethiopic`.

## 4. Fallback

If you do not wish to bundle fonts yet, you can remove or comment the @font-face blocks in `src/styles/i18n.css` to stop 404 noise; system fallback fonts will still render Amharic (though possibly less aesthetically).

## 5. Production Note

For production builds you may wish to subset the font (e.g., using pyftsubset or glyphhanger) to reduce payload size if performance is a concern.

---

Once the files are present, no code changes are required.
