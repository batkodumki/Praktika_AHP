# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Python 3.8+
- Node.js 16+

### Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

Backend running at: http://localhost:8000

### Step 2: Frontend Setup (2 minutes)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend running at: http://localhost:3000

### Step 3: Use the Application (1 minute)

1. Open http://localhost:3000
2. Click "Register" and create an account
3. Create a new project with some alternatives
4. Start making comparisons!

## What's Next?

- Read the full [README.md](README.md) for detailed documentation
- Explore the different scale types
- Try creating multiple projects
- Check out the results visualizations

## Common Issues

**Backend won't start:**
- Make sure you activated the virtual environment
- Check if port 8000 is available

**Frontend won't start:**
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is available

**Can't connect to API:**
- Verify backend is running on port 8000
- Check the console for CORS errors
