# Whiteboard Project

A React and Electron desktop app for batch tracking, integrated with Supabase for data storage. Developed for Curaleaf, it tracks batch details, calculates takt-time metrics, and provides a dashboard for production monitoring.

## Features
- Login with line and line lead selection
- Dashboard for entering batch details (product, packing format, batch number)
- Data table with search, sort, and filter capabilities
- Batch updates with takt-time calculations
- Supabase integration for data persistence

## Prerequisites
- Node.js and npm
- Supabase account with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` environment variables
- Electron for desktop app development

## Setup
1. Clone the repository: `git clone [your-repo-url]`
2. Navigate to the project directory: `cd whiteboard-project-frontend`
3. Install dependencies: `npm install`
4. Create a `.env` file with Supabase credentials
5. Start the app: `npm run start:electron`
6. Build for Windows: `npm run electron:build`

## Notes
- Curaleaf branding is used with permission.
- Line lead names are placeholders or authorized for public sharing.
- Ensure `.env` is not committed (excluded via `.gitignore`).

