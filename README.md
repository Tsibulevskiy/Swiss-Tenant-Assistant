# Swiss Tenant Assistant

Nuxt 4 application for Swiss tenant workflows, document checks and letter generation.

## Setup

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
copy .env.example .env
```

Nuxt loads `.env` for local development, `drizzle-kit` reads the same file through `dotenv`, and `docker compose` uses the same variables for MySQL.

Start MySQL with Docker:

```bash
docker compose up -d mysql
```

Check container health:

```bash
docker compose ps
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```
