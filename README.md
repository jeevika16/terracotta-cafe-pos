# Terracotta Artisan Cafe | Billing & POS System

An artisanal Cafe Point of Sale (POS), Table Management, and Financial Audit system built with **Next.js (App Router, TypeScript)** and **MongoDB (Mongoose)** with an earthy, warm aesthetic.

---

### Custom Artisan Color Palette
| Token | Hex Code | Visual Application |
|---|---|---|
| **Primary** | `#A63D26` | Hero buttons, brand badges, active table selections, revenue charts |
| **Accent** | `#C65F43` | Section headers, icons, secondary hover states, quantity badges |
| **Peach** | `#FFF0E7` | Active card tints, pill chips, subtle highlights, table badges |
| **Cream** | `#FFF9F5` | Card surfaces, modals, dropdown backgrounds |
| **Surface** | `#FFFDFB` | Canvas background, crisp input surfaces |
| **Text** | `#352B28` | Espresso roast deep typography, dark headings |
| **Border** | `#F0E4DD` | Oat milk dividers, subtle card borders, container outlines |

---

### Tech Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: MongoDB with Mongoose
- **Authentication & RBAC**: NextAuth.js (Auth.js) with JWT token claims
- **State Management**: React Context (`OrderContext`) for active table, real-time cart, and ticket state
- **UI & Icons**: Tailwind CSS + Lucide Icons
- **Analytics & Charts**: Recharts

---

### Role-Based Access Control (RBAC) Matrix
| Feature | Admin | Employee | Guest (Customer) |
|---|:---:|:---:|:---:|
| View Floor Plan & Table Status | Yes | Yes | Yes |
| Add / Edit Tables | **Yes** | **Yes** | No |
| View Menu Items | Yes | Yes | Yes |
| Add / Edit Menu Items & Prices | **Yes** | **Yes** | No |
| Place Order for Table | Yes | Yes | **Yes** |
| Settle Bill (Cash / Card / UPI) | **Yes** | **Yes** | No |
| **Accounts & Sold Items Dashboard** | **Yes (Exclusive)** | No (403) | No (Redirect to /login) |

---

### Quick Start Guide

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Ensure your MongoDB connection string is set (e.g., local MongoDB or MongoDB Atlas):
```env
MONGODB_URI=mongodb://localhost:27017/cafe_billing_db
NEXTAUTH_SECRET=your_jwt_secret_terracotta_pos_2026
NEXTAUTH_URL=http://localhost:3000
```

#### 3. Seed Mock Data (Tables, Artisan Menu, Admin/Staff Accounts & Sample Sales)
Run the seeder to instantly get 8 tables, 9 artisanal items, and sample financial audit data:
```bash
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" src/lib/seed.ts
```

#### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Demo Credentials
- **Admin**: `admin@terracottacafe.com` / `admin123` (Access to Accounts & Sales Dashboard)
- **Employee**: `staff@terracottacafe.com` / `staff123` (Table & Menu management)
- **Customer / Guest**: No login needed (Interactive table selection & ordering)
