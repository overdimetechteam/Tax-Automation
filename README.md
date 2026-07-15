# Tax Automation Portal

A secure web-based application for personal income tax filing and management (Y/A 2025/2026 — Sri Lanka).

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Django 4.2 + Django REST Framework
- **Database**: MySQL
- **Auth**: JWT (djangorestframework-simplejwt)

## Quick Start

### 1. Database Setup
```sql
-- In MySQL
CREATE DATABASE tax_automation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env with your MySQL credentials

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create initial data (tax year + default consultant)
python manage.py shell < create_initial_data.py

# Start development server
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Consultant | consultant@taxportal.lk | Admin@12345 |

> ⚠️ Change default passwords before production deployment!

---

## Workflow

```
1. Consultant registers client → credentials sent
2. Client logs in → completes multi-step tax form
   - Income & Expenses (with document uploads)
   - Assets (immovable, vehicles, bank balances, shares, etc.)
   - Liabilities (bank loans, leasing, credit cards)
   - Declarant Details
   - Review & Submit
3. Consultant reviews → requests info if needed
4. Consultant confirms tax calculation → client notified
5. Client reviews → confirms the calculation
6. System archives all documents:
   [Client Name] / [Y/A 2025/2026] / Final TAX Submission / [documents]
```

## Folder Structure
```
TAX_AUTOMATION/
├── backend/
│   ├── apps/
│   │   ├── authentication/    # JWT auth, custom user model
│   │   ├── clients/           # Client profile management
│   │   ├── tax_forms/         # Tax form models, calculator, PDF generator
│   │   ├── documents/         # Document upload & management
│   │   └── notifications/     # In-app notification system
│   ├── config/                # Django settings & URLs
│   └── media/                 # Uploaded files & archives
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/           # Login page
        │   ├── client/         # Client portal (dashboard, tax form, confirmation)
        │   └── consultant/     # Consultant portal (dashboard, clients, calculation)
        ├── components/         # Shared UI components
        ├── contexts/           # Auth context
        ├── services/           # API service layer
        └── utils/              # Formatting helpers
```

## Tax Calculation (Y/A 2025/2026)
| Taxable Income Slab | Rate |
|---------------------|------|
| First Rs. 1,200,000 | 6%   |
| Next Rs. 1,200,000  | 12%  |
| Next Rs. 1,200,000  | 18%  |
| Next Rs. 1,200,000  | 24%  |
| Next Rs. 1,200,000  | 30%  |
| Balance             | 36%  |

- **Personal Relief**: Rs. 1,800,000
- **Rent Relief**: 25% of Gross Rent Income
- **Solar Panels**: Max deduction Rs. 600,000
