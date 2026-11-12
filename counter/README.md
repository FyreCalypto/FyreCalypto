# Profile counter

This Node.js service serves a badge in Moe Counter’s animated `rule34` theme. It uses the ten digit sprites from a pinned [Moe Counter revision](https://github.com/journey-ad/Moe-Counter/tree/ba5b1fa9758b467e4436128ca2c9708f99d2977b/assets/theme/rule34). The sprites are loaded from GitHub at startup and checked against their Git blob hashes. Moe Counter excludes theme artwork from its MIT license.

The live badge runs on [the W3Schools Space](https://countergithub.w3spaces.com/preview.svg).

## Deploy to W3Schools Spaces

1. Use a Node.js Full Stack Space with Node.js 18 or later. Copy `server.js` and `package.json` into its app directory, or merge the start script into the existing template. The start command is `npm start`.
2. Keep one running instance and use a directory that persists across restarts for `COUNTER_DATA_DIR`. By default the service writes to `counter-state/` next to the server file. Keep this directory between deployments.
3. Open `/healthz`, then `/preview.svg` on the public Space URL. The preview shows the current number without incrementing it.
4. After verifying the preview, add the following to the profile README, replacing the placeholder origin:

   ```html
   <p align="center">
     <img src="https://YOUR-SPACE.w3spaces.com/counter.svg" alt="Profile badge requests">
   </p>
   ```

A GET request for `/counter.svg` adds one to the stored total. GitHub proxies and caches images, so the number represents badge requests that reached the Space. The application stores only the total.

If the host cannot fetch from GitHub at startup, place the exact ten animated `rule34` digit GIFs from the pinned source in a local directory and point `COUNTER_THEME_DIR` there. The service checks the same hashes in either mode.
