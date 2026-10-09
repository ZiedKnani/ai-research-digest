# AI Research Digest

A full-stack monorepo for the AI Research Digest project. The application is
composed of a Next.js frontend and a FastAPI semantic backend, orchestrated with
Docker Compose.

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

## Application preview

<table>
	<tr>
		<td><img src="docs/screenshots/dashboard.png" alt="ResearchDigest dashboard" /></td>
		<td><img src="docs/screenshots/papers.png" alt="ResearchDigest papers library" /></td>
	</tr>
	<tr>
		<td><img src="docs/screenshots/interests.png" alt="ResearchDigest interests" /></td>
		<td><img src="docs/screenshots/settings.png" alt="ResearchDigest digest settings" /></td>
	</tr>
</table>

## Getting started with Docker

### Prerequisites

Install the following on the new workstation:

- Git
- Docker Desktop with Docker Compose enabled
- Access to the Supabase project used by the application

Docker Desktop must be running before starting the project.

### 1. Clone the repository

```powershell
git clone <repository-url>
cd ai-research-digest
```

### 2. Configure Supabase

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the example values with the project's real Supabase
values. They can be found in Supabase under **Project Settings > API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

The real `.env` file must never be committed or shared publicly. Only
`.env.example` belongs in Git.

### 3. Build and start the application

```powershell
docker compose up -d --build
```

The first build downloads the `all-MiniLM-L6-v2` model into the backend image.
It requires an Internet connection and can take several minutes. Later starts
reuse the built image and do not download the model again.

### 4. Verify the services

```powershell
docker compose ps
Invoke-WebRequest http://localhost:8000/health
```

Open the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Backend healthcheck: http://localhost:8000/health
- n8n: http://localhost:5678 (or the value of `N8N_PORT_HOST`)
- Ollama API: http://localhost:11434

Inside the Docker network, the backend hostname is `backend` and its URL is
`http://backend:8000`.

## n8n workflow and Ollama

The exported workflow is versioned at
[n8n/workflows/research-digest.json](n8n/workflows/research-digest.json). It
collects arXiv papers, calls the semantic backend, evaluates candidates with
Ollama/Qwen, saves relevant papers to Supabase and sends digest emails.

The first Compose build downloads the model configured by `OLLAMA_MODEL` (by
default `qwen3:4b`) into the persistent `ollama_data` volume. The model is not
stored in Git. Ollama can require several gigabytes of disk space and RAM.

### Import the workflow in n8n

1. Open http://localhost:5678.
2. Create the Postgres credential pointing to the Supabase database.
3. Create the SMTP credential used to send digest emails.
4. Import `n8n/workflows/research-digest.json` from the n8n menu.
5. Open the imported workflow and select the two credentials on the Postgres
	and email nodes.
6. Execute it manually once to verify the connections.

The workflow already uses Docker service names: `http://backend:8000` and
`http://ollama:11434`. Do not replace them with `localhost` inside n8n.

The exported workflow does not contain Supabase passwords, SMTP passwords or
n8n encryption keys. Each developer must configure local credentials in n8n.

### Useful Docker commands

```powershell
# Follow application logs
docker compose logs -f

# Rebuild only the frontend after a frontend change
docker compose up -d --build --force-recreate frontend

# Stop the application
docker compose down

# Stop and rebuild everything from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Local development without Docker

Docker Compose is the recommended way to get the complete application running.
For frontend-only work, create `frontend/.env.local` with the same Supabase
variables, then run:

```powershell
cd frontend
npm install
npm run dev
```

For backend-only work:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

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
