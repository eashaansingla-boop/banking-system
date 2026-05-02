# Nexus Banking System

A premium, glassmorphic banking application built with React (Vite) and Flask, featuring MongoDB persistence.

## Features
- **Secure Authentication**: User login and registration.
- **Real-time Transactions**: Deposit and withdraw with instant history updates.
- **Admin Portal**: System-wide view of all accounts and balances.
- **Cloud Persistence**: Integrated with MongoDB Atlas.
- **Vercel Ready**: Optimized for serverless deployment.

## Deployment to Vercel

1. **Environment Variables**:
   In your Vercel project settings, add the following:
   - `MONGO_URI`: `mongodb+srv://eashaansingla_db_user:18yBFTzapHUqTtEM@cluster0.bn0a8ge.mongodb.net/?appName=Cluster0`
   - `ADMIN_USERNAME`: admin
   - `ADMIN_PASSWORD`: admin123

2. **Build Settings**:
   Vercel should automatically detect the Vite framework. If not, set the build command to `npm run build` and the output directory to `dist`.

3. **Database Access**:
   Ensure your MongoDB Atlas cluster allows connections from `0.0.0.0/0` (Allow Access from Anywhere).

## Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   npm install
   ```

2. Run the backend:
   ```bash
   python api/index.py
   ```

3. Run the frontend:
   ```bash
   npm run dev
   ```
