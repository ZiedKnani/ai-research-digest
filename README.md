# AI Research Digest

A full-stack monorepo for the AI Research Digest project.

## Overview

This repository contains both the user-facing application and the backend service used to process research-related data.

## Project structure

- [frontend](frontend) — Next.js application for the web UI
- [backend](backend) — backend service for the semantic/research logic
- [.gitignore](.gitignore) — Git exclusions for the project

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Python service
- Repository layout: monorepo with separate application folders

## Getting started

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the app in your browser at:

- http://localhost:3000

### 2. Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

> Adapt the backend startup command if your service uses a different entry point.

## Development notes

- The frontend and backend are separated into dedicated folders for easier maintenance.
- The monorepo structure keeps the project easier to run, review, and deploy together.
- Environment variables should remain local and not be committed to Git.

## Repository goals

- deliver a personalized research digest experience
- keep the frontend and backend decoupled but coordinated
- make the project easy to clone, run, and extend

## Contributing

1. Create a branch
2. Make your changes
3. Commit with a clear message
4. Push to the repository
5. Open a pull request
