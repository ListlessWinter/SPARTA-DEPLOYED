# Failure Edits Log

A log of failed edits and mistakes made during development to consult before making changes:

1. **Import order in `App.js`**:
   - *Mistake*: Placing a variable declaration (`const dummyToast = [...]`) between ES6 `import` statements.
   - *Lesson*: All `import` statements must remain at the top of the file before any `const`, `let`, or runtime expressions.

2. **Login page statue scaling & layout in `LoginPage.css`**:
   - *Mistake*: Setting fixed large vertical paddings (e.g. `32vh`, `23vh`) that caused unwanted page scrolling and mispositioned the statues behind the form.
   - *Lesson*: Sizing and positions must adapt to viewport constraints (`--h: min(100vh, 80vw)`) with `overflow: hidden` on `.lp-main` to ensure zero vertical page scrolling.

3. **Spear shaft/handle color mismatch in `LoginPage.css` & `LoginScene.js`**:
   - *Mistake*: Coloring the upper extended spear handle with gold/brown strokes (`#a8700f`, `#f2b02c`) instead of the Spartan's original black spear shaft.
   - *Lesson*: The spear handle is solid black (`#000000` / `#121212`) matching the bottom spear handle and dark armor, with gold limited strictly to the ferrule/spearhead socket.

4. **Asset cropping artifacts in `spartan_nohead.png`**:
   - *Mistake*: Leaving the gold socket stub attached to the Spartan's hand when cutting the spearhead.
   - *Lesson*: Always cleanly trim attachment points down to the natural fist knuckles so custom extended lines align seamlessly.
