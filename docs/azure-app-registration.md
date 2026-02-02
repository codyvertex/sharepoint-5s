# Azure AD App Registration Setup

## Step 1: Register the Application

1. Go to [Azure Portal](https://portal.azure.com) > **Microsoft Entra ID** > **App registrations**
2. Click **New registration**
3. Fill in:
   - **Name:** `SharePoint 5S Cleanup`
   - **Supported account types:** "Accounts in this organizational directory only" (Vertex Education)
   - **Redirect URI:** Web > `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Click **Register**

## Step 2: Configure API Permissions

1. Go to **API permissions** > **Add a permission**
2. Select **Microsoft Graph** > **Delegated permissions**
3. Add these permissions:
   - `openid` (Sign users in)
   - `email` (View users' email address)
   - `profile` (View users' basic profile)
   - `offline_access` (Maintain access to data you have given it access to — REQUIRED for token refresh)
   - `Files.ReadWrite.All` (Have full access to all files user can access)
   - `Sites.Read.All` (Read items in all site collections)
4. Click **Grant admin consent for Vertex Education**

## Step 3: Create Client Secret

1. Go to **Certificates & secrets** > **Client secrets**
2. Click **New client secret**
3. Set description: `5S App Secret`
4. Set expiration: 24 months
5. Click **Add**
6. **Copy the Value immediately** (you won't be able to see it again)

## Step 4: Note the IDs

From the **Overview** page, copy:
- **Application (client) ID** — this is `AZURE_CLIENT_ID`
- **Directory (tenant) ID** — this is `AZURE_TENANT_ID`
- The secret Value from Step 3 — this is `AZURE_CLIENT_SECRET`

## Step 5: Configure Supabase

1. Go to your Supabase Dashboard > **Authentication** > **Providers**
2. Enable **Azure**
3. Enter:
   - **Azure Client ID:** paste Application (client) ID
   - **Azure Secret:** paste the client secret Value
   - **Azure Tenant URL:** `https://login.microsoftonline.com/YOUR_TENANT_ID`
4. Save

## Step 6: Set Supabase Secrets

Run these commands in your terminal (from the project root):

```bash
npx supabase secrets set AZURE_CLIENT_ID=your-client-id
npx supabase secrets set AZURE_CLIENT_SECRET=your-client-secret
npx supabase secrets set AZURE_TENANT_ID=your-tenant-id
npx supabase secrets set OPENAI_API_KEY=your-openai-api-key
```
