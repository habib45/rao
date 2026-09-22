# Namecheap Shared Hosting Deployment Guide

## ✅ Issue Resolution

The @swc/core native binary issue has been **fixed** by rebuilding the native modules. The build is now successful with **0 errors**.

## 📋 Prerequisites

- Namecheap shared hosting account with cPanel access
- Domain already pointed to your hosting account
- Node.js 20.x or higher (available in cPanel Setup Node.js App)
- MySQL database access
- FTP/SFTP access or cPanel File Manager

## 🚀 Deployment Steps

### Step 1: Prepare Production Build Files

Your local build is already successful. Create a deployment package:

```bash
# In your project directory (E:\xampp\htdocs\ORH\Project\orh)
# Create deployment archive
tar -czf namecheap-deploy.tar.gz \
  .next \
  public \
  messages \
  server.js \
  package.json \
  package-lock.json \
  next.config.js \
  tsconfig.json \
  postcss.config.mjs \
  scripts \
  vitest.config.ts
```

**Note:** Testing dependencies (vitest, @testing-library/*) have been removed from package.json to simplify deployment and avoid npm installation issues on shared hosting environments.

### Step 2: Setup MySQL Database in cPanel

1. Log in to cPanel (usually `yourdomain.com/cpanel`)
2. Navigate to **MySQL Database Wizard**
3. Create database:
   - Database name: `raofindes_production` (or similar)
   - Username: `raofindes_admin` 
   - Password: Generate a strong password
   - Grant all privileges
4. Save the database credentials:
   ```
   Host: localhost
   Database: raofindes_production
   User: raofindes_admin
   Password: [your_password]
   Port: 3306
   ```

### Step 3: Import Database Schema

1. In cPanel, go to **phpMyAdmin**
2. Select your database
3. Import your database schema from your local MySQL setup
4. Verify tables are created correctly

### Step 4: Upload Files to Server

**Option A: Using cPanel File Manager**
1. Navigate to **File Manager** → `public_html`
2. Upload `namecheap-deploy.tar.gz`
3. Extract the archive
4. Verify files are in the correct location

**Option B: Using FTP/SFTP**
1. Connect to your server using FileZilla or similar
2. Navigate to `public_html` directory
3. Upload the extracted files
4. Set file permissions:
   - Directories: 755
   - Files: 644

**Option C: Direct Ubuntu Deployment**
If deploying directly to Ubuntu server (not cPanel):
```bash
# Upload files to your Ubuntu server
# Then install all dependencies (including devDependencies for cross-env)
npm install --include=dev
```

### Step 5: Setup Node.js Application in cPanel

1. Go to **Setup Node.js App** in cPanel
2. Click **Create Application**
3. Configure as follows:

| Field | Value |
|------|-------|
| Node.js version | 20.x (latest available) |
| Application mode | Production |
| Application root | `public_html` |
| Application URL | `yourdomain.com` |
| Application startup file | `server.js` |

4. Click **Create**
5. After creation, click **Run NPM Install** to install dependencies
6. Click **Restart** to start the application

### Step 6: Configure Environment Variables

In cPanel **Setup Node.js App**:

1. Scroll to **Environment Variables** section
2. Add the following variables (replace with your actual values):

```bash
# Database
DB_HOST=localhost
DB_USER=raofindes_admin
DB_PASSWORD=your_database_password
DB_NAME=raofindes_production
DB_PORT=3306

# API Gateway
NEXT_PUBLIC_MYSQL_API_URL=http://localhost:4000
MYSQL_API_SECRET=your_api_secret
MYSQL_API_JWT_TOKEN=your_jwt_token
MYSQL_JWT_SECRET=your_jwt_secret

# Amazon PA-API
AMAZON_ACCESS_KEY=your_amazon_access_key
AMAZON_SECRET_KEY=your_amazon_secret_key
AMAZON_PARTNER_TAG=your_partner_tag
AMAZON_HOST=webservices.amazon.com

# AI APIs
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
```

### Step 7: Configure Domain & SSL

**Force HTTPS and www with .htaccess:**

Create `public_html/.htaccess`:

```apache
RewriteEngine On

# Force www
RewriteCond %{HTTP_HOST} ^yourdomain\.com$ [NC]
RewriteRule ^(.*)$ https://www.yourdomain.com/$1 [R=301,L]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
```

**Enable SSL:**
1. In cPanel, go to **SSL/TLS Status**
2. Click **Run AutoSSL**
3. This will install free Let's Encrypt SSL certificate

### Step 8: Configure Application Startup

Your `server.js` is already configured for production with:
- Hostname: `0.0.0.0` (required for shared hosting)
- Port: 3000 (or configured via PORT env var)
- Production mode detection

### Step 9: Test Deployment

1. Restart the Node.js app in cPanel
2. Test the following URLs:
   - `https://www.yourdomain.com` - Homepage
   - `https://www.yourdomain.com/en` - English locale
   - `https://www.yourdomain.com/bn-BD` - Bengali locale
   - `https://www.yourdomain.com/sv` - Swedish locale
   - `https://www.yourdomain.com/admin` - Admin panel

### Step 10: Monitor Logs

Check application logs in cPanel:
1. **Setup Node.js App** → your application
2. Note the log file path
3. Access logs via File Manager to troubleshoot issues

## 🔧 Important: cross-env Issue on Ubuntu/Linux

### The Problem
Your build script uses `cross-env` to set environment variables across platforms:
```json
"build": "cross-env NODE_ENV=production NODE_OPTIONS=--max-old-space-size=4096 next build"
```

On Ubuntu/Linux production, you may get:
```
sh: cross-env: command not found
```

This happens because `cross-env` is listed as a `devDependency` and may not be installed by default on production.

### Solutions

**Option 1: Install devDependencies on Ubuntu (Recommended)**
```bash
# On your Ubuntu server
npm install --include=dev
```

**Option 2: Use production-only install with cross-env in dependencies**
Move `cross-env` from `devDependencies` to `dependencies` in package.json:
```json
"dependencies": {
  "cross-env": "^7.0.3",
  // ... other dependencies
}
```

**Option 3: Use Linux-native syntax (If deploying only to Linux)**
Modify package.json scripts for Linux-only deployment:
```json
"scripts": {
  "build": "NODE_ENV=production NODE_OPTIONS=--max-old-space-size=4096 next build"
}
```
*Note: This breaks Windows builds. Use a separate script for Linux:*
```json
"scripts": {
  "build": "cross-env NODE_ENV=production NODE_OPTIONS=--max-old-space-size=4096 next build",
  "build:linux": "NODE_ENV=production NODE_OPTIONS=--max-old-space-size=4096 next build"
}
```

**Option 4: Build locally, deploy .next folder (Best for shared hosting)**
Since your `.next` folder is platform-independent:
1. Build locally on Windows: `npm run build`
2. Upload `.next` folder to Ubuntu server
3. Skip building on production server entirely
4. Just run `npm start` to serve the pre-built application

## 🔧 Troubleshooting

### Issue: Application won't start
**Solution:**
- Check logs in cPanel
- Verify Node.js version compatibility
- Ensure all environment variables are set
- Restart the application

### Issue: Database connection errors
**Solution:**
- Verify database credentials in environment variables
- Check MySQL database is running
- Ensure database user has proper privileges
- Test connection via phpMyAdmin

### Issue: Port conflicts
**Solution:**
- Namecheap automatically assigns ports
- Use the PORT environment variable if needed
- Check server.js is configured to use process.env.PORT

### Issue: Missing dependencies
**Solution:**
- Click "Run NPM Install" in cPanel Setup Node.js App
- Ensure package.json and package-lock.json are uploaded
- Check for any npm installation errors in logs

### Issue: cross-env command not found
**Solution:**
- `cross-env` is a devDependency needed for the build script
- On Ubuntu/cPanel: Run `npm install --include=dev` to install devDependencies
- On cPanel: Ensure "Run NPM Install" installs all dependencies (not just production)
- Alternative: Modify package.json scripts to not use cross-env on Linux:
  ```json
  "build": "NODE_ENV=production NODE_OPTIONS=--max-old-space-size=4096 next build"
  ```
  (Note: This works on Linux/Mac but not Windows)

### Issue: Static files not loading
**Solution:**
- Verify public folder contents are uploaded
- Check file permissions (644 for files, 755 for directories)
- Ensure next.config.js image domains are correct

## 📊 Performance Optimization

### Enable Caching
Add to your `.htaccess`:

```apache
# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

### Compress Responses
Add to your `.htaccess`:

```apache
# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript
</IfModule>
```

## 🔒 Security Best Practices

1. **Keep dependencies updated:** Regularly run `npm audit` locally
2. **Use strong passwords:** For database and admin accounts
3. **Enable SSL:** Always use HTTPS
4. **Restrict admin access:** Consider IP whitelisting for `/admin` routes
5. **Monitor logs:** Regularly check for suspicious activity
6. **Backup regularly:** Use cPanel backup features

## 📈 Monitoring & Maintenance

### Regular Tasks
- Weekly: Check application logs
- Monthly: Update dependencies and rebuild
- Monthly: Review database performance
- Quarterly: Security audit

### Backup Strategy
1. **Database backups:** Use cPanel automated backups
2. **File backups:** Backup `public_html` regularly
3. **Configuration:** Keep copy of environment variables secure

## 🆘 Support Resources

- **Namecheap Knowledge Base:** https://www.namecheap.com/support/knowledgebase/
- **cPanel Documentation:** https://docs.cpanel.net/
- **Next.js Deployment:** https://nextjs.org/docs/deployment

## 📝 Quick Reference

**Essential Commands (Local):**
```bash
# Build for production
npm run build

# Create deployment package
tar -czf namecheap-deploy.tar.gz .next public messages server.js package.json package-lock.json next.config.js tsconfig.json postcss.config.mjs scripts

# Test production build locally
npm run start
```

**Essential cPanel Locations:**
- File Manager: `public_html`
- Setup Node.js App: Application configuration
- MySQL Database Wizard: Database setup
- phpMyAdmin: Database management
- SSL/TLS Status: SSL certificates

**Important Files:**
- `server.js` - Application entry point
- `package.json` - Dependencies
- `.htaccess` - Apache configuration
- `next.config.js` - Next.js configuration

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] Build completes successfully locally
- [ ] Database schema imported correctly
- [ ] All environment variables configured
- [ ] SSL certificate installed and working
- [ ] HTTP redirects to HTTPS
- [ ] Non-www redirects to www
- [ ] Admin panel accessible
- [ ] Database connections working
- [ ] Static files loading correctly
- [ ] All locales functioning (en, bn-BD, sv)
- [ ] Amazon affiliate links working
- [ ] Image optimization working
- [ ] No console errors in browser
- [ ] Application logs clean
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

**Status:** ✅ Ready for deployment
**Build Status:** ✅ Successful (0 errors)
**Last Updated:** 2026-09-17