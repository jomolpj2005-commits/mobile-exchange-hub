# Mobile Exchange Hub

Prompt

Build a Mobile Manufacturing, Refurbishment & Wholesale Exchange Management System frontend using React + Vite + Tailwind CSS + Axios.

The backend is already being developed using ERPNext v16 + Frappe Framework. Design the frontend so it can be easily integrated with the ERPNext backend using Frappe REST APIs (/api/resource and /api/method). Do not include business logic in the frontend; all business rules, workflows, and database operations will be handled by ERPNext.

Use a simple, clean, beginner-friendly, and modular architecture. Avoid over-engineering, Redux, or unnecessary abstractions. Keep API calls in a separate api/ folder, reusable UI components in components/, and page-level logic inside pages/.

Create the following pages:

 Login

 Dashboard

 Products

 Product Details

 Cart

 Checkout

 Orders

 Inventory

 Dealers

 Wholesale Exchange

 Refurbishment

 Profile

Follow the ERPNext document flow:

Buying
Supplier → Purchase Order → Purchase Receipt → Purchase Invoice → Payment Entry

Manufacturing
BOM → Work Order → Job Card → Material Transfer for Manufacture → Manufacture

Selling
Customer → Quotation → Sales Order → Delivery Note → Sales Invoice → Payment Entry

Wholesale Exchange
Dealer → Exchange Request → Exchange Approval → Used Mobile Received → Remaining Balance Calculation → New Mobile Purchase

Refurbishment
Inspection → Repair → Component Replacement → Quality Check → Ready for Sale → Refurbished Product Stock

The frontend should be responsive, professional, and ERP-style. Create reusable components such as Navbar, Sidebar, Product Card, Status Badge, Loader, Search Bar, and Pagination.

Organize the project like this:

src/
 ├── api/
 ├── components/
 ├── pages/
 ├── layouts/
 ├── services/
 ├── hooks/
 ├── utils/
 ├── App.jsx
 └── main.jsx

Use Axios for all API communication and create separate API files (e.g., product.js, order.js, exchange.js, refurbishment.js, auth.js) to make integration with ERPNext simple. The final result should be a clean, maintainable frontend that can be connected directly to ERPNext/Frappe APIs without major changes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b78a8b14-5a63-45d2-81a8-eb9c67397532).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
