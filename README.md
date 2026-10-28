# SPARTA: Sports Planning And Resource Tracking App
SPARTA (Sports Planning and Resource Tracking App) is a web-based system designed to streamline the management of sports events. It centralizes key data such as participant profiles, team rosters, schedules, and scores, allowing organizers to efficiently plan, monitor, and update events in real time.

## Demo Mode (no backend / database)
The frontend runs on its own with dummy data (`frontend/src/mock/`). Every API call is answered in the browser, so only the frontend needs to run:
1. `cd frontend && npm install && npm start` – open http://localhost:3000
2. Login needs no email or password: pick a role and press Login. Protected pages also open directly without logging in.
3. Changes made during the demo are saved in the browser. To reset the dummy data, clear the site data for localhost:3000 (or run `localStorage.clear()` in the browser console) and reload.

To go back to the real backend, remove `import './mock/mockApi'` from `frontend/src/index.js` and set `REACT_APP_API_URL` in `frontend/.env`.

## Basic Commands:

**Frontend:**  
1. `npm start` – start localhost  
2. `npm run build` - compiles to check if theres any errors

**Backend:**  
1. `npm run dev` – start running server  

**Overall:**  
1. `npm init -y` – install dependencies or used dependencies 
2. `npm install [package]` – install packages
