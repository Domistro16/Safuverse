# SafuAcademy cPanel Deployment Guide

## Prerequisites
- cPanel with Node.js Selector / Application Manager
- SSH access (optional but helpful)
- Domain configured in cPanel

---

## Step-by-Step Deployment

### 1. Prepare Files Locally

Before uploading, ensure your project is ready:

```bash
cd c:\Users\PC\Safuverse\SafuAcademy

# Build frontend (already done if you see /dist folder)
npm run build:frontend

# Copy dist to root (already done if /dist exists at root)
npm run copy:dist
```

### 2. Upload Files to cPanel

**Option A: File Manager**
1. Login to cPanel
2. Go to **File Manager**
3. Navigate to your domain folder (e.g., `/home/username/public_html` or subdomain folder)
4. Upload these files/folders:
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - `/dist/` folder (the built frontend)
   - `/node_modules/` (optional - can install on server)

**Option B: Upload ZIP**
1. Create ZIP of the above files
2. Upload and extract in cPanel

### 3. Setup Node.js Application

1. In cPanel, find **Setup Node.js App** or **Node.js Selector**
2. Click **Create Application**
3. Configure:

| Setting | Value |
|---------|-------|
| **Node.js version** | 18.x or 20.x (LTS) |
| **Application mode** | Production |
| **Application root** | `/home/username/public_html/yourapp` |
| **Application URL** | Your domain or subdomain |
| **Application startup file** | `server.js` |

4. Click **Create**

### 4. Install Dependencies

1. In the Node.js App page, click **Run NPM Install**
   - OR via SSH: `cd /home/username/public_html/yourapp && npm install --production`

### 5. Set Environment Variables

In the Node.js App configuration, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | (usually auto-set by Passenger) |
| `CORS_ORIGINS` | `https://yourdomain.com,https://www.yourdomain.com` |

### 6. Start/Restart Application

1. Click **Restart** in the Node.js App panel
2. Your app should now be live!

---

## Verification

### Health Check
```
GET https://yourdomain.com/api/health
```

Expected response:
```json
{
  "ok": true,
  "timestamp": "2025-12-13T20:35:20.240Z",
  "env": "production"
}
```

### Frontend
Visit `https://yourdomain.com/` - should show the SafuAcademy homepage.

---

## File Structure on Server

```
/home/username/public_html/yourapp/
├── server.js          # Main entry point
├── package.json       # Dependencies
├── package-lock.json
├── node_modules/      # Installed after npm install
└── dist/              # Built frontend
    ├── index.html
    └── assets/
```

---

## Troubleshooting

### App Not Starting
1. Check the **stderr.log** in your app folder
2. Common issues:
   - Missing `node_modules` - run `npm install`
   - Wrong startup file - verify `server.js` exists
   - Port conflicts - Passenger auto-assigns port

### 502 Bad Gateway
- Application crashed - check stderr.log
- Run `npm install` again
- Verify Node.js version compatibility

### Static Files Not Loading
- Ensure `/dist/` folder was uploaded
- Check paths in `server.js`

### API Returns 404
- Verify `server.js` includes `/api/health` route
- Check application is running

### View Logs
```bash
# SSH into server
cd /home/username/public_html/yourapp
cat stderr.log
cat stdout.log
```

---

## Quick Commands (SSH)

```bash
# Navigate to app
cd /home/username/public_html/yourapp

# Install dependencies
npm install --production

# Test manually
node server.js

# View logs
tail -f stderr.log
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | Set to `production` |
| `PORT` | Auto | Passenger sets this |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |

---

## Notes

- The `server.js` serves both static frontend files and the `/api/health` endpoint
- For full backend API (with database), you need to also deploy the `/backend` folder with its own setup
- Frontend uses client-side routing - all routes fallback to `index.html`
