# AHP Pairwise Comparison Tool - Web Application

A comprehensive web-based implementation of the Analytic Hierarchy Process (AHP) pairwise comparison tool with progressive refinement interface, built with Django (backend) and React (frontend).

## Features

### Core Functionality
- **Pairwise Comparison Workflow**: Intuitive step-by-step comparison interface
- **Progressive Refinement**: 4-level progressive scale refinement for more accurate judgments
- **Multiple Scale Types**:
  - Integer (1-9)
  - Balanced
  - Power
  - Ma-Zheng
  - Donegan
- **Dynamic Gradations**: Scales support 3-9 gradations with progressive label refinement
- **Balance Scale Visualization**: Real-time visual representation of comparison ratios
- **Weight Calculation**: Eigenvector method for calculating alternative weights
- **Consistency Checking**: Automatic calculation of Consistency Ratio (CR) with recommendations

### Web-Specific Features
- **User Authentication**: Secure registration, login, and session management
- **Project Management**: Create, save, and manage multiple comparison projects
- **Persistent Storage**: All comparisons and results saved to database
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Interactive Results**: Charts and visualizations for weights and rankings
- **Multi-user Support**: Each user has their own isolated projects and data

### Collaborative Features
- **Expert Collaboration**: Invite multiple experts to participate in decision-making
- **Individual Comparisons**: Each expert makes independent pairwise comparisons
- **AIJ Aggregation**: Aggregate expert judgments using geometric mean (Aczel & Saaty 1983)
- **Invitation System**: Send invitations by username or email
- **Asynchronous Work**: Experts work independently at their own pace
- **Aggregated Results**: View consolidated weights and consistency metrics

## Technology Stack

### Backend
- **Django 4.2**: Web framework
- **Django REST Framework**: API development
- **JWT Authentication**: Secure token-based authentication
- **NumPy & SciPy**: Mathematical calculations
- **SQLite**: Database (easily switchable to PostgreSQL)

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Recharts**: Data visualization
- **Modern CSS**: Responsive and beautiful UI

## Architecture

```
web-ahp-app/
├── backend/                 # Django backend
│   ├── ahp_project/        # Django project settings
│   ├── comparisons/        # Main app
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API views
│   │   ├── serializers.py  # DRF serializers
│   │   ├── scales.py       # Scale implementations
│   │   ├── calculations.py # Weight & consistency algorithms
│   │   └── urls.py         # API routes
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # React components
    │   │   ├── auth/       # Authentication components
    │   │   ├── Dashboard.jsx
    │   │   ├── ProjectDetail.jsx
    │   │   ├── ComparisonWorkflow.jsx
    │   │   ├── BalanceScale.jsx
    │   │   └── ResultsView.jsx
    │   ├── contexts/       # React contexts
    │   ├── utils/          # Utilities (API, scales)
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Setup Instructions

### Prerequisites
- **Python 3.11, 3.12, or 3.13** (recommended for NumPy/SciPy compatibility)
  - ⚠️ Python 3.14+ may have compatibility issues with some scientific libraries
  - ⚠️ Python 3.10 and below are not recommended
- Node.js 16 or higher
- pip (Python package manager)
- npm or yarn (Node package manager)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd web-ahp-app/backend
   ```

2. **Remove old virtual environment (if it exists):**
   ```bash
   # On Linux/Mac:
   rm -rf venv

   # On Windows (PowerShell):
   Remove-Item -Recurse -Force venv
   # On Windows (CMD):
   rmdir /s /q venv
   ```

3. **Create fresh virtual environment with Python 3.11-3.13:**
   ```bash
   # Use python3.11, python3.12, or python3.13 explicitly
   python3.11 -m venv venv
   # Or if python3 points to 3.11-3.13:
   python3 -m venv venv
   ```

4. **Activate virtual environment:**
   - On Linux/Mac:
     ```bash
     source venv/bin/activate
     ```
   - On Windows (PowerShell):
     ```powershell
     venv\Scripts\Activate.ps1
     ```
   - On Windows (CMD):
     ```cmd
     venv\Scripts\activate.bat
     ```

5. **Upgrade pip and install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

6. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set your SECRET_KEY and other settings
   ```

7. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

8. **Create superuser (optional, for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

9. **Run development server:**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env if you need to change the API URL
   ```

4. **Run development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Frontend will be available at `http://localhost:3000`

## Usage Guide

### 1. Registration and Login
- Navigate to `http://localhost:3000`
- Click "Register" to create a new account
- Fill in username, email, and password
- After registration, you'll be automatically logged in

### 2. Creating a Project
- Click "+ New Project" on the dashboard
- Enter project title and description (optional)
- Select a scale type (Integer, Balanced, Power, Ma-Zheng, or Donegan)
- Add at least 2 alternatives
- Click "Create Project"

### 3. Making Comparisons
- Click "Start Comparisons" or "Continue Comparisons"
- For each pair:
  1. **Select Direction**: Click which alternative is MORE important
  2. **Select Intensity**: Choose how much more important (Weak, Medium, Strong, etc.)
  3. **Progressive Refinement**: The scale will progressively refine based on your choice
  4. **Visual Feedback**: Balance scale shows the current comparison ratio
  5. **Save**: Click "Save & Continue" to move to next pair
- Navigate between pairs using Previous/Next buttons

### 4. Viewing Results
- After completing all comparisons, click "Calculate Results"
- Results include:
  - **Consistency Check**: Shows if judgments are consistent (CR ≤ 0.10)
  - **Rankings**: Alternatives ranked by weight
  - **Weight Distribution**: Bar chart visualization
  - **Comparison Matrix**: Full pairwise comparison matrix
  - **Final Weights**: Detailed weight table

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/user/` - Get current user

### Projects
- `GET /api/projects/` - List all user's projects
- `POST /api/projects/` - Create new project
- `GET /api/projects/{id}/` - Get project details
- `PATCH /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Delete project
- `POST /api/projects/{id}/add_comparison/` - Add/update comparison
- `DELETE /api/projects/{id}/delete_comparison/` - Delete comparison
- `POST /api/projects/{id}/calculate_results/` - Calculate results

### Collaboration
- `POST /api/projects/{id}/enable_collaboration/` - Enable/disable collaboration mode
- `POST /api/projects/{id}/invite_collaborators/` - Invite experts to project
- `GET /api/projects/{id}/collaborators/` - List project collaborators
- `POST /api/projects/{id}/mark_completed/` - Mark user's comparisons complete
- `POST /api/projects/{id}/aggregate/` - Calculate aggregated results (AIJ)
- `GET /api/projects/{id}/aggregated_results/` - Get aggregated results

### Invitations
- `GET /api/invitations/` - Get pending invitations for current user
- `POST /api/invitations/{id}/accept/` - Accept an invitation
- `POST /api/invitations/{id}/decline/` - Decline/delete an invitation

## Database Models

### Project
- User (foreign key)
- Title, description
- Alternatives (JSON array)
- Scale type (1-5)
- Status (input, comparison, completed)
- Is collaborative (boolean)

### Comparison
- Project (foreign key)
- User (foreign key, null for single-user projects)
- Index A, Index B (alternative indices)
- Value (comparison result)
- Direction (more/less)
- Reliability, Scale string
- Gradations, Refinement level

### Result
- Project (one-to-one)
- Matrix (JSON)
- Weights, Rankings (JSON arrays)
- Lambda max, CI, CR
- Is consistent, Recommendations

### ProjectCollaborator
- Project (foreign key)
- User (foreign key)
- Role (owner, contributor)
- Status (invited, active, completed)
- Invited at, Completed at timestamps

### AggregatedResult
- Project (foreign key)
- Aggregation method (AIJ)
- Number of experts
- Aggregated matrix (JSON)
- Final weights (JSON)
- Consistency ratio, Lambda max, CI

## Algorithms

### Weight Calculation (Eigenvector Method)
1. Build n×n comparison matrix from pairwise comparisons
2. Calculate eigenvalues and eigenvectors
3. Extract principal eigenvector (corresponding to max eigenvalue)
4. Normalize to sum = 1

### Consistency Checking
1. Calculate λ_max (principal eigenvalue)
2. Calculate Consistency Index: CI = (λ_max - n) / (n - 1)
3. Calculate Consistency Ratio: CR = CI / RI
4. Check: CR ≤ 0.10 means consistent

### Progressive Refinement
- **Level 0**: Choose direction (More/Less)
- **Level 1**: Coarse gradation (3 options: Weak/Strong/Extreme)
- **Level 2**: Medium gradation (4-5 options)
- **Level 3**: Fine gradation (up to 9 options)

## Scale Transformations

Each scale type transforms grades differently:

- **Integer**: Direct mapping (1-9)
- **Balanced**: w/(1-w) where w = 0.5 + (grade-1)*0.05
- **Power**: 9^((grade-1)/8)
- **Ma-Zheng**: 9/(9+1-grade)
- **Donegan**: exp(atanh((grade-1)/14*√3))

All scales are unified to cardinal scale [1.5, 9.5] before use.

## Development

### Running Tests

Backend:
```bash
cd backend
python manage.py test
```

### Building for Production

Backend:
```bash
python manage.py collectstatic
# Set DEBUG=False in .env
# Use a production WSGI server like gunicorn
gunicorn ahp_project.wsgi:application
```

Frontend:
```bash
npm run build
# Serve the dist/ folder with a web server
```

## Deployment

### Backend Deployment
1. Set up PostgreSQL database (optional, but recommended for production)
2. Update DATABASES in settings.py
3. Set DEBUG=False
4. Set proper SECRET_KEY
5. Configure ALLOWED_HOSTS
6. Run migrations
7. Collect static files
8. Use gunicorn or similar WSGI server
9. Set up nginx as reverse proxy

### Frontend Deployment
1. Update VITE_API_URL in .env to production API URL
2. Run `npm run build`
3. Serve the `dist/` folder with nginx or similar
4. Configure CORS on backend to allow frontend domain

## Differences from Desktop Version

### Advantages
- Multi-user support with authentication
- Cloud-based, accessible from anywhere
- Persistent storage across sessions
- Responsive design for all devices
- Modern web UI/UX
- Easy sharing and collaboration potential

### Similar Features
- Same pairwise comparison logic
- Identical scale implementations
- Same weight calculation algorithms
- Balance scale visualization
- Consistency checking
- Progressive refinement interface

## Troubleshooting

### Backend Issues

#### NumPy Import Errors
If you see `ImportError: No module named 'numpy.core._multiarray_umath'` or similar NumPy errors:

**Solution 1: Use recommended Python version**
```bash
# Remove old venv and recreate with Python 3.11-3.13
rm -rf venv
python3.11 -m venv venv  # or python3.12, python3.13
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Solution 2: Install compatible NumPy version**
```bash
pip install --upgrade numpy scipy
```

**Note**: The server will start even if NumPy has issues, but aggregation features won't work. NumPy is only required for collaborative expert aggregation.

#### Other Common Issues
- **Import errors**: Make sure virtual environment is activated
- **Database errors**: Run migrations with `python manage.py migrate`
- **CORS errors**: Check CORS_ALLOWED_ORIGINS in settings.py
- **Permission denied (Windows)**: Run PowerShell as Administrator if activation fails

### Frontend Issues
- **API connection errors**: Verify backend is running and VITE_API_URL is correct
- **Build errors**: Delete node_modules and package-lock.json, then reinstall
- **White screen**: Check browser console for errors

## License

This project is based on the original desktop AHP pairwise comparison application.

## Contributors

Web version developed as a modern Django + React reimplementation of the original Tkinter desktop application.

## Support

For issues, questions, or contributions, please refer to the project repository.
