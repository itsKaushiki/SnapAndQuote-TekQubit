# Setup and Run Guide for Snap Quote AI

This guide will help you set up and run the AutoFix AI application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
3. **MongoDB** - [Download here](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (cloud)
4. **Git** - [Download here](https://git-scm.com/downloads)

## Step-by-Step Setup

### Step 1: Navigate to the Project Directory

```powershell
cd snap-quote-AI
```

### Step 2: Set Up Backend

1. Navigate to the backend directory:
```powershell
cd backend
```

2. Install Node.js dependencies:
```powershell
npm install
```

3. Create a `.env` file in the `backend` directory:
```powershell
# Create .env file
New-Item -Path .env -ItemType File
```

4. Add the following environment variables to `backend/.env`:
```env
# API Keys (Get these from respective providers)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Server Configuration
PORT=5000

# MongoDB Connection (adjust if using remote MongoDB)
MONGODB_URI=mongodb://localhost:27017/autofix-ai
```

**Note:** Replace `your_openai_api_key_here` and `your_gemini_api_key_here` with your actual API keys:
- OpenAI API Key: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- Gemini API Key: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Step 3: Set Up Python Dependencies for YOLO Model

1. Navigate to the ML model directory:
```powershell
cd ml_model
```

2. Install Python dependencies:
```powershell
# Using pip
pip install -r requirements-yolov11.txt

# Or if you have multiple Python versions, use:
python -m pip install -r requirements-yolov11.txt
```

3. Go back to backend directory:
```powershell
cd ..
```

### Step 4: Set Up Frontend

1. Navigate to the frontend directory (from project root):
```powershell
cd ..\frontend
```

2. Install Node.js dependencies:
```powershell
npm install
```

### Step 5: Start MongoDB

**Option A: Local MongoDB**
- Start MongoDB service on your system
- On Windows, MongoDB usually runs as a service automatically
- Verify it's running: `mongosh` or check Services

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster and get your connection string
- Update `MONGODB_URI` in `backend/.env` with your Atlas connection string

### Step 6: Run the Application

You'll need **two terminal windows** - one for backend and one for frontend.

#### Terminal 1: Start Backend Server

```powershell
cd snap-quote-AI\backend
node server.js
```

You should see output like:
```
Server running on port 5000
MongoDB connected successfully
```

#### Terminal 2: Start Frontend Development Server

```powershell
cd snap-quote-AI\frontend
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

## Verification

1. **Backend**: Check `http://localhost:5000/api` (or any API endpoint) - should respond
2. **Frontend**: Should open automatically at `http://localhost:3000`
3. **MongoDB**: Verify connection in backend console logs

## Troubleshooting

### Common Issues:

1. **Port Already in Use**
   - Backend: Change `PORT` in `backend/.env` to a different port (e.g., 5001)
   - Frontend: React will prompt to use a different port automatically

2. **Python/Ultralytics Not Found**
   - Ensure Python is in your PATH
   - Try: `python --version` to verify installation
   - Reinstall: `pip install ultralytics --upgrade`

3. **MongoDB Connection Error**
   - Verify MongoDB is running: `mongosh` or check Services
   - Check `MONGODB_URI` in `.env` file
   - For Atlas: Ensure IP whitelist includes your IP

4. **Module Not Found Errors**
   - Backend: Run `npm install` again in `backend` directory
   - Frontend: Run `npm install` again in `frontend` directory
   - Python: Run `pip install -r requirements-yolov11.txt` again

5. **API Key Errors**
   - Verify API keys are correctly set in `backend/.env`
   - Ensure no extra spaces or quotes around keys
   - Test keys independently if possible

## Project Structure

```
snap-quote-AI/
├── backend/           # Express.js backend server
│   ├── .env          # Environment variables (create this)
│   ├── server.js     # Main server file
│   ├── controllers/  # Route controllers
│   ├── ml_model/     # Python YOLO detection scripts
│   └── routes/       # API routes
├── frontend/         # React frontend application
│   └── src/         # React source code
└── database/        # Database seed files
```

## Next Steps

Once the application is running:
1. Upload a vehicle image through the UI
2. The system will detect damage using YOLO
3. Cost estimation will be performed using AI providers
4. View results and download reports

## Additional Resources

- Backend API runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:3000`
- Check `README.md` for more detailed architecture information

