# IntraKart - AI + AR Interior Design Platform

Modern interior design platform with AI-powered room analysis and AR visualization.

To get started, take a look at [src/app/page.tsx](src/app/page.tsx).

## Features
- AI Room Analyzer - Analyze room photos and get design insights
- AR View - Visualize furniture in your space using AR technology
- Responsive Design - Works on desktop and mobile devices

## Development
You can start both the backend and frontend simultaneously with combined, colored logging:

```bash
npm run dev:all
```
This is the recommended way to develop, as you'll see logs from both services in a single terminal.

### Other Options
**Option 1: Single Host (FastAPI Proxies Next.js)**
Run only the Python server. It auto-starts the Next frontend in the background.

```bash
npm run dev:onehost
```
Open [http://localhost:8000](http://localhost:8000).

## Supabase Configuration
Set these environment variables before starting the backend:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_for_backend_data_ops
```

Optional runtime toggles:

```bash
# Disable auto-starting Next (if you run frontend manually)
START_FRONTEND=false

# Custom frontend target for FastAPI proxy
FRONTEND_BASE_URL=http://127.0.0.1:9002
```
