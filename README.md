# INQlude - Invoicing Application

A full-stack invoicing application with inventory tracking, authentication, signature features, and PDF generation with ZAR currency support.

## ✨ Features

✅ **Authentication** - Secure login/register with JWT  
✅ **Dashboard** - Analytics and history  
✅ **Product Management** - Barcode generation, bulk import  
✅ **Client Management** - Invoice/quote history and stats  
✅ **Invoice & Quotes** - Auto-numbering, discounts, VAT  
✅ **PDF Export** - Professional PDF with company details and banking info  
✅ **Signature Capture** - Digital signatures on documents  
✅ **Settings** - VAT toggle/percentage, company profile, banking details, numbering  
✅ **ZAR Currency** - All prices in South African Rand

## Tech Stack

- **Frontend:** React 19, Bootstrap 5, Chart.js, React Router
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** SQLite (default via Prisma)
- **Authentication:** JWT + bcryptjs
- **PDF:** PDFKit
- **File Upload:** Multer (ready for integration)

## Quick Start

### Prerequisites
- Node.js 14+
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
cd frontend && npm install
cd ../backend && npm install
```

2. **Configure database (.env in backend/):**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secret_key_here"
```

3. **Configure frontend API base URL (local dev):**
- This repo includes `frontend/.env.development` pointing at `http://localhost:5000`.

4. **Initialize database:**
```bash
cd backend && npx prisma migrate dev --name init
```

5. **Start servers:**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm start
```

5. **Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### First Steps After Login

1. **Configure Company Settings (IMPORTANT)**
   - Go to Settings
   - Fill Company Profile (name, reg no, address, tel, VAT no)
   - Add Banking Details (appears on invoices)
   - Configure VAT (enable/disable and set percentage)
   - Set invoice numbering prefix (INV, QU)

2. **Create at least one Product**
   - Go to Products
   - Add Product with code, description, price

3. **Create a Client**
   - Go to Clients  
   - Add Client with name, address, tel

4. **Create Your First Invoice**
   - Go to Invoices
   - Click New Sale
   - Select client and products
   - Click Create Invoice
   - Download as PDF

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product (protected)
- `PATCH /api/products/:id` - Update product (protected)
- `DELETE /api/products/:id` - Delete product (protected)

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client (protected)
- `PATCH /api/clients/:id` - Update client (protected)
- `DELETE /api/clients/:id` - Delete client (protected)

### Invoices & Quotes
- `GET /api/invoices` - List all documents
- `POST /api/invoices` - Create invoice/quote (protected)
- `GET /api/invoices/:id/pdf?type=invoice` - Download PDF (protected)
- `PATCH /api/invoices/:id/status` - Update status (protected)

### Settings
- `GET /api/settings` - Get all settings
- `PATCH /api/settings/vat` - Update VAT settings (protected)
- `PATCH /api/settings/company` - Update company profile (protected)
- `PATCH /api/settings/numbering` - Update invoice numbering (protected)

## Deployment

### Deploy on Render

This repo is set up to deploy as **two services** (recommended):

**Backend (Web Service)**
- Root directory: `backend`
- Build command: `npm install && npm run generate && npm run migrate:deploy`
- Start command: `npm start`
- Environment variables:
   - `JWT_SECRET` (required)
   - `DATABASE_URL` (required)

**SQLite note (important):** Render’s filesystem is ephemeral unless you attach a persistent disk.
- If you keep SQLite, attach a disk and set `DATABASE_URL` to something like `file:/var/data/dev.db`.
- If you want a managed database instead, switch Prisma to Postgres and use Render Postgres for `DATABASE_URL`.

**Frontend (Static Site)**
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `build`
- Environment variables (build-time):
   - `REACT_APP_API_URL` = your backend base URL (e.g. `https://<backend-service>.onrender.com`)

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   └── App.js        # Main app with routing
│   └── package.json
├── backend/
│   ├── routes/           # API routes
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── server.js         # Express server
│   └── package.json
└── README.md
```

## Next Steps

- [ ] Improve invoice/quote list filtering/search
- [ ] Implement file uploads (company logo, profile picture)
- [ ] Add bulk product import (Excel/CSV)
- [ ] Email invoices directly to clients
- [ ] Payment status tracking
- [ ] Invoice/quote templates/customization
- [ ] Client analytics and history
- [ ] Recurring invoices
- [ ] Multiple user accounts per company
- [ ] Quote conversion to invoice

## License

MIT