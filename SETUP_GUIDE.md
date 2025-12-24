# ShuttleMentor Local Setup Guide

This guide will help you set up and run the ShuttleMentor badminton coaching platform on your computer. No technical background required!

## What You'll Need

Before starting, make sure you have:
- A computer with internet connection
- About 30 minutes of time
- Administrator access to install software

## Step 1: Install Required Software

### 1.1 Install Git
Git helps you download the project files.

**For Windows:**
1. Go to https://git-scm.com/download/win
2. Download and run the installer
3. Use default settings during installation

**For Mac:**
1. Open Terminal (press Cmd+Space, type "Terminal", press Enter)
2. Type: `git --version` and press Enter
3. If Git isn't installed, follow the prompts to install it

**For Linux:**
```bash
sudo apt update
sudo apt install git
```

### 1.2 Install Docker
Docker will run the application and database for you.

**For Windows:**
1. Go to https://docs.docker.com/desktop/install/windows-install/
2. Download Docker Desktop for Windows
3. Run the installer and restart your computer when prompted

**For Mac:**
1. Go to https://docs.docker.com/desktop/install/mac-install/
2. Download Docker Desktop for Mac (choose Intel or Apple Silicon based on your Mac)
3. Install and start Docker Desktop

**For Linux:**
1. Follow instructions at https://docs.docker.com/desktop/install/linux-install/

### 1.3 Install Node.js (Optional but Recommended)
This helps with running some commands more easily.

1. Go to https://nodejs.org/
2. Download the LTS version (recommended for most users)
3. Run the installer with default settings

## Step 2: Get the Project Files

1. **Choose a location:** Create a folder on your computer where you want to store the project (e.g., `Documents/ShuttleMentor`)

2. **Open Terminal/Command Prompt:**
   - **Windows:** Press Win+R, type `cmd`, press Enter
   - **Mac:** Press Cmd+Space, type "Terminal", press Enter
   - **Linux:** Press Ctrl+Alt+T

3. **Navigate to your chosen folder:**
   ```bash
   cd Documents/ShuttleMentor
   ```

4. **Download the project:**
   ```bash
   git clone [YOUR_REPOSITORY_URL]
   cd shuttlementor
   ```
   *Note: Replace [YOUR_REPOSITORY_URL] with the actual repository URL*

## Step 3: Set Up Configuration

### 3.1 Create Environment File
1. In the project folder, find the file named `.env.example`
2. Make a copy of this file and rename it to `.env`
3. Open the `.env` file in any text editor (Notepad, TextEdit, etc.)

### 3.2 Get Clerk Authentication Keys
You need to create a free account with Clerk for user authentication:

1. Go to https://clerk.com/
2. Sign up for a free account
3. Create a new application
4. Go to "API Keys" in your Clerk dashboard
5. Copy the "Publishable Key" and "Secret Key"
6. In your `.env` file, replace:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_1234567890"` with your actual publishable key
   - `CLERK_SECRET_KEY="sk_test_1234567890"` with your actual secret key

### 3.3 Database Configuration
The database settings in `.env` should work as-is for local development:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/shuttlementor"
```

## Step 4: Start the Application

### Method 1: Using Docker (Recommended)

1. **Make sure Docker is running:**
   - Look for the Docker icon in your system tray/menu bar
   - If it's not running, start Docker Desktop

2. **Start the application:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

3. **Wait for setup to complete:**
   - This will take 5-10 minutes the first time
   - You'll see lots of text scrolling by - this is normal
   - Wait until you see "Ready - started server on 0.0.0.0:3000"

### Method 2: Using Node.js (Alternative)

If you prefer not to use Docker:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the database:**
   ```bash
   ./start-database.sh
   ```

3. **Set up the database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

## Step 5: Access the Application

1. **Open your web browser**
2. **Go to:** http://localhost:3000
3. **Sign in:** Click the sign-in button and use your Gmail account
4. **Set up admin access:**
   - After signing in, open a new terminal window
   - Run: `npx prisma studio` (if using Node.js) or `docker compose exec app npx prisma studio` (if using Docker)
   - This opens a database viewer at http://localhost:5555
   - Find your user record and change the "role" field to "ADMIN"
   - Refresh the main application to see admin features

## Step 6: Stopping the Application

### If using Docker:
Press `Ctrl+C` in the terminal, then run:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### If using Node.js:
Press `Ctrl+C` in both terminal windows (app and database)

## Troubleshooting

### Common Issues:

**"Port already in use" error:**
- Something else is using port 3000
- Try stopping other applications or restart your computer

**Docker won't start:**
- Make sure Docker Desktop is running
- Try restarting Docker Desktop

**Can't access the application:**
- Make sure you're using http://localhost:3000 (not https)
- Check that the application started successfully (look for "Ready" message)

**Database connection errors:**
- Make sure the database container is running
- Check that your `.env` file has the correct database URL

### Getting Help:

If you run into issues:
1. Check the terminal output for error messages
2. Make sure all prerequisites are installed correctly
3. Try restarting Docker Desktop and running the commands again
4. Contact the development team with specific error messages

## Next Steps

Once everything is running:
- Explore the coaching dashboard
- Add some test coaching notes
- Try different user roles (coach vs student)
- Familiarize yourself with the interface

The application will remember your data between sessions, so you can stop and start it as needed.