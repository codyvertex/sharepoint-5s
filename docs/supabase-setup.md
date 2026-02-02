# Supabase Project Setup

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note the **Project URL** and **anon key** from **Settings** > **API**
3. Note the **Project Ref** (the subdomain of your Supabase URL)

## Step 2: Update Frontend Config

Edit `frontend/js/lib/supabase-client.js`:
```js
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

## Step 3: Update CORS Origins

Edit `supabase/functions/_shared/cors.ts`:
```ts
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://YOUR_ORG.github.io',  // Your GitHub Pages URL
];
```

## Step 4: Run Database Migrations

```bash
# Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations
npx supabase db push
```

## Step 5: Deploy Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy store-token
npx supabase functions deploy refresh-token
npx supabase functions deploy crawl-sharepoint
npx supabase functions deploy crawl-status
npx supabase functions deploy analyze
npx supabase functions deploy execute-actions
```

## Step 6: Set Secrets

```bash
npx supabase secrets set AZURE_CLIENT_ID=...
npx supabase secrets set AZURE_CLIENT_SECRET=...
npx supabase secrets set AZURE_TENANT_ID=...
npx supabase secrets set OPENAI_API_KEY=...
```

## Step 7: Configure Azure Auth Provider

See `azure-app-registration.md` for detailed instructions.

## Step 8: Deploy Frontend to GitHub Pages

1. Push the `frontend/` directory to your GitHub repo
2. Go to **Settings** > **Pages**
3. Set source to the branch containing the frontend files
4. If the frontend is in a subfolder, configure the build directory accordingly

Alternatively, use a GitHub Action:
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: frontend
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Local Development

To run the frontend locally:
```bash
# Simple HTTP server (Python)
cd frontend && python -m http.server 3000

# Or use Node
npx serve frontend -p 3000
```

To run Edge Functions locally:
```bash
npx supabase functions serve
```
