# Development environment setup

This project runs as a small local stack:

- `frontend`: Next.js application on port 3000
- `backend`: FastAPI semantic service on port 8000
- `ollama`: local LLM API on port 11434
- `n8n`: workflow editor and runner on port 5678
- Supabase: external authentication and PostgreSQL service

## Requirements

Install Git and Docker Desktop. Docker Desktop must be running with Compose enabled.
The first startup needs Internet access to download the sentence-transformers model and the Ollama model. Ollama also needs several gigabytes of disk space and enough RAM for the selected Qwen model.

## First startup

From the repository root:

```powershell
Copy-Item .env.example .env
# Edit .env and provide the Supabase URL and publishable key
docker compose up -d --build
```

Check the services:

```powershell
docker compose ps
Invoke-WebRequest http://localhost:8000/health
```

Open the frontend at http://localhost:3000 and n8n at http://localhost:5678.
If port `5678` is already used on your machine, set `N8N_PORT_HOST=5679` in
`.env` and use http://localhost:5679 instead. The port inside the Docker
network remains `5678`.

## n8n credentials

The workflow export is stored in `n8n/workflows/research-digest.json`. Credentials are intentionally removed from the export and must be created locally in n8n:

1. Create a Postgres credential for the Supabase database.
2. Create an SMTP credential for digest emails.
3. Import the workflow JSON in n8n.
4. Select the credentials on the Postgres and email nodes.
5. Execute the workflow manually once before activating a schedule.

The workflow uses these Docker URLs:

- Semantic service: `http://backend:8000/similarity`
- Ollama: `http://ollama:11434/api/chat`

Inside a container, `localhost` refers to that container. Use the service names above for communication between Compose services.

## Persistent data

Compose creates two named volumes:

- `ollama_data`: downloaded Ollama models
- `n8n_data`: n8n users, settings and local database

Do not run `docker compose down -v` unless you intentionally want to delete these local data volumes.

## Useful commands

```powershell
# Follow all logs
docker compose logs -f

# Follow only workflow and model logs
docker compose logs -f n8n ollama ollama-init

# Stop containers but keep models and n8n data
docker compose down

# Start again without rebuilding
docker compose up -d

# Rebuild after code changes
docker compose up -d --build --force-recreate frontend backend
```
