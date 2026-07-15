# App download folder

Put the Android app file here so the website's **"Download the app"** section
can serve it.

- Required file name: **`wanbai-store.apk`**
- Full path: `public/download/wanbai-store.apk`
- Public URL it is served at: `/download/wanbai-store.apk`

The download button on the homepage links to that exact path. Whenever you build
a new version of the app, just replace this file (keep the same name) — no code
change is needed.

> Tip: users install it via "Unknown sources" (the homepage shows the steps).
> Only Android `.apk` is supported this way; iOS cannot side-load like this.
