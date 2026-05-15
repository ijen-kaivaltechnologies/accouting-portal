## What's in the referrer router

| Module | Routes | Details |
|--------|--------|---------|
| **Auth** | `POST /api/referrer/register` | Full validation: mobile 10-digit, PAN format, Aadhar 12-digit, email, password strength, DOB past date, file type (PDF only), uniqueness on email/mobile/pan/aadhar. Saves 3 KYC files to `referrer_docs/{id}/` |
| | `POST /api/referrer/login` | bcrypt compare, blocks `pending`/`rejected` with clear 403 messages, returns JWT with `role: 'referrer'` |
| **Service listing** | `GET /api/services/categories` | All categories |
| | `GET /api/services/plans` | All plans with prices, discounts, commission — filterable by `?category_id=` |
| | `GET /api/services/plans/:id/requirements` | Ordered doc requirements for dynamic form rendering |
| **Referrer requests** | `POST /api/referrer/requests` | Validates all non-optional docs are present, enforces file types (pdf vs excel per requirement), saves files to `referral_docs/{request_id}/`, inserts `text_value` for MSME text fields |
| | `GET /api/referrer/requests` | My requests list, filterable by `?status=` |
| | `GET /api/referrer/requests/:id` | Single request detail with document list |
| **Earnings** | `GET /api/referrer/earnings` | `SUM(commission_earned)` total + per-entry breakdown |
| **Admin – referrers** | `GET /api/admin/referrers` | Paginated list, filterable by status |
| | `GET /api/admin/referrers/:id` | Full profile |
| | `PUT /api/admin/referrers/:id/status` | Approve / reject with note |
| | `GET /api/admin/referrers/:id/documents/:docType` | Streams aadhar / pan / bank_cancel_check PDF |
| **Admin – requests** | `GET /api/admin/requests` | Paginated, filterable by status / referrer / plan |
| | `GET /api/admin/requests/:id` | Full detail with referrer snapshot + all docs |
| | `GET /api/admin/requests/:id/documents/:docId` | Streams uploaded doc (PDF or Excel) |
| | `PUT /api/admin/requests/:id/decision` | **Approve → atomically inserts `finance_entries` row with price snapshot. Reject → just updates status.** Uses `FOR UPDATE` lock to prevent double-processing. |