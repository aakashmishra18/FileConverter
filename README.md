# PrivateConvert

A privacy-first starter project for local PDF tools using React, Vite, JavaScript, Node.js, Express, and pdf-lib.

## Features

- Images to PDF (JPG and PNG)
- Merge PDFs in a selected order
- Extract selected pages from a PDF (examples: `1-3, 5, 8-10`)
- Local browser processing for these three tools
- Small Express health-check API at `/api/health`
- Responsive interface

## Requirements

- Node.js 20 or newer (recommended)
- npm

## Run locally

From the project root:

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API health check: http://localhost:5173/api/health (Vite proxies this to Express)

The development server starts both the frontend and backend. To run only the frontend, use `npm run dev -w client`. To run only the API, use `npm run dev -w server`.

## Production build

```bash
npm run build
npm run start:server
```

The production build is created in `client/dist`. The Express API does not yet implement server-side file conversions.

## Privacy notes

- The three current conversion functions run in the browser. They do not call the Express API or upload files.
- The interface uses system fonts and does not need a third-party font request.
- Do not add analytics, advertising scripts, or error-reporting tools that capture file names or document contents.
- Browser-local processing does not guarantee that a downloaded result is never cached by the browser or operating system.
- The 50 MB limit is a client-side guardrail, not a complete defense against memory exhaustion. Test large files and add more resource controls before public deployment.
- pdf-lib may not support encrypted, malformed, or every unusual PDF. Errors are shown in the UI.

## Before public deployment

1. Serve everything over HTTPS.
2. Add automated tests and test malformed PDFs, large files, and mobile browsers.
3. Consider a Web Worker for large conversions so the interface remains responsive.
4. Set appropriate file/page limits and avoid telemetry that can expose document information.
5. For future server conversions, use isolated worker containers, strict CPU/memory/time limits, non-root users, restricted network access, random temporary directories, and cleanup in `finally` blocks.
6. Add a clear privacy notice describing exactly which operations run locally and which send data to your server.
