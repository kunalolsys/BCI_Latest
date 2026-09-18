# BCI BMS Backend

This is the backend for the Business Coaching India Backoffice Management System (BCI BMS).

## Tech Stack
- Node.js (latest LTS)
- Express.js
- MongoDB (with Mongoose)
- JWT for authentication
- dotenv for environment variables
- ESLint + Prettier for code quality

## Folder Structure

- `/src`
  - `/config`     - Environment, database, and app config
  - `/controllers`- Business logic for routes
  - `/models`     - Mongoose schemas and models
  - `/routes`     - Express route definitions
  - `/middleware` - Auth, error handling, etc.
  - `/utils`      - Utility/helper functions
  - `/services`   - Service layer for business logic
  - `app.js`      - Express app setup
  - `server.js`   - Entry point
- `/tests`        - Unit and integration tests

## Setup
1. Copy `.env.example` to `.env` and set your environment variables.
2. Run `npm install` to install dependencies.
3. Use `npm run dev` to start the server in development mode.

---

For any questions, refer to the Windsurf rules file or contact the project maintainer.
