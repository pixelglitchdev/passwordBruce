# Deploying Password Bruce to Koyeb

This guide will help you deploy the Password Bruce application to Koyeb, a serverless platform that makes deployment simple.

## Prerequisites

1. A [Koyeb account](https://www.koyeb.com/) (free tier available)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Method 1: Git Integration (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit - Password Bruce app"
   git push origin main
   ```

2. **Create a new Koyeb app:**
   - Log in to your Koyeb dashboard
   - Click "Create App"
   - Select "GitHub" as the source
   - Connect your GitHub account if not already connected
   - Select your repository

3. **Configure the deployment:**
   - **Name**: `password-bruce` (or your preferred name)
   - **Branch**: `main` (or your default branch)
   - **Build command**: Leave empty (Koyeb auto-detects Node.js)
   - **Run command**: `npm start`
   - **Port**: `3000` (or leave as auto-detect)
   - **Instance type**: `nano` (sufficient for demo purposes)

4. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `PORT`: `8000` (Koyeb will set this automatically)

5. **Deploy:**
   - Click "Deploy"
   - Wait for the build and deployment to complete (usually 2-3 minutes)

### Method 2: Docker Deployment

1. **Build and push Docker image:**
   ```bash
   # Build the image
   docker build -t password-bruce .
   
   # Tag for your registry
   docker tag password-bruce your-registry/password-bruce:latest
   
   # Push to registry
   docker push your-registry/password-bruce:latest
   ```

2. **Deploy from Docker:**
   - In Koyeb dashboard, click "Create App"
   - Select "Docker" as the source
   - Enter your Docker image URL
   - Set port to `3000`
   - Deploy

## Post-Deployment

1. **Access your app:**
   - Koyeb will provide a URL like `https://password-bruce-your-app-id.koyeb.app`
   - The app should be accessible immediately

2. **Custom Domain (Optional):**
   - In your app settings, go to "Domains"
   - Add your custom domain
   - Update your DNS records as instructed

3. **Monitor:**
   - Use Koyeb's built-in monitoring to track performance
   - Check logs if there are any issues

## Koyeb-Specific Configuration

The app is already configured for Koyeb with:

- ✅ Port configuration via `process.env.PORT`
- ✅ Production-ready Express setup
- ✅ Proper error handling
- ✅ Security headers with Helmet
- ✅ CORS enabled for cross-origin requests
- ✅ Static file serving for frontend assets

## Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check that `package.json` has correct dependencies
   - Ensure Node.js version is 18+ (specified in `engines`)

2. **App doesn't start:**
   - Verify the start script in `package.json`
   - Check Koyeb logs for error messages

3. **Port issues:**
   - Ensure your app listens on `process.env.PORT || 3000`
   - Don't hardcode port numbers

### Checking Logs:

```bash
# If using Koyeb CLI
koyeb logs your-app-name

# Or check in the Koyeb dashboard under "Logs"
```

## Performance Optimization

For production use, consider:

1. **Scaling:**
   - Upgrade to a larger instance type if needed
   - Enable auto-scaling in Koyeb settings

2. **Caching:**
   - Add Redis for session storage if needed
   - Implement response caching for static analysis

3. **Rate Limiting:**
   - Add rate limiting to prevent abuse
   - Consider implementing request queuing for brute force operations

## Security Considerations

The app includes several security measures:

- Helmet.js for security headers
- CORS configuration
- Input validation
- Limited brute force attempts (100k max)
- No password storage or logging

## Cost Estimation

Koyeb pricing (as of 2024):
- **Free tier**: 2 nano instances, 100GB bandwidth
- **Nano instance**: $5.50/month for production use
- **Micro instance**: $11/month for higher traffic

For a demo app, the free tier should be sufficient.

## Support

If you encounter issues:
1. Check [Koyeb documentation](https://www.koyeb.com/docs)
2. Review the app logs in Koyeb dashboard
3. Check this repository's issues section

---

**Happy deploying! 🚀** 