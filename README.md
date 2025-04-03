# Link Share

A modern web application for sharing and managing links with React, Express, and PostgreSQL.

## Features

- User authentication with JWT
- Secure link sharing
- File upload capabilities
- Responsive UI with Tailwind CSS
- Real-time updates

## Tech Stack

- **Frontend**: React, React Router, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT
- **File Upload**: Multer
- **UI Components**: Radix UI, Lucide React

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

## Getting Started

1. Set up environment variables
Create a `.env` file in the root directory with the following variables, note that database 'userfiles' must exist:
```
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=userfiles
JWT_SECRET=your_secret_key
```

2. To get started with the application, run:

```bash
npm run complete-setup
```

This command will:
1. Install all dependencies
2. Build the application
3. Set up the database
4. Start the development server

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build
- `npm run dev-server`: Start the backend server in development mode
- `npm run start`: Start the production server
- `npm run setup-db`: Initialize the database
- `npm run complete-setup`: Complete setup (install dependencies, build, setup DB, start server)

## Project Structure

```
├── client_folders/       # Client-side components and assets
├── dist/                # Production build output
├── public/              # Static assets
├── src/                 # Source code
├── server.cjs           # Backend server
└── setup-db.cjs         # Database setup script
```
