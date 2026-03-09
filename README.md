# AI Outreach Agent - Cloud Deployment

This project search for businesses without websites and manages them via an Admin Dashboard.

## Local Development
1. `npm install`
2. `node index.js` (to scrape leads)
3. `npm run dashboard` (to view the dashboard)

## Cloud Deployment

### 1. GitHub
- Create a new repository on GitHub.
- Run:
  ```bash
  git remote add origin YOUR_GITHUB_REPO_URL
  git push -u origin main
  ```

### 2. Firebase (Backend & Database)
- Create a project on [Firebase Console](https://console.firebase.google.com/).
- Install CLI: `npm install -g firebase-tools`
- Login: `firebase login`
- Initialize: `firebase init` (Select Functions and Firestore)
- Deploy: `firebase deploy --only functions,firestore`
- **Note**: Copy the Function URL for the dashboard.

### 3. Netlify (Frontend)
- Link your GitHub repository to Netlify.
- Set the build command: `npm run build`
- Set the publish directory: `dist`
- Set Environment Variable: `VITE_API_URL` to your Firebase Function URL.

## Tech Stack
- **Frontend**: React + Vite + Netlify
- **Backend**: Node.js + Firebase Functions
- **Database**: Google Cloud Firestore
- **Scraper**: Playwright (Local)
