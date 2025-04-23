# Express TypeScript Boilerplate

A boilerplate for Express.js applications using TypeScript.

## Features

- TypeScript support
- Express.js framework
- CORS enabled
- Environment variables support
- Example API endpoints for users and products
- Error handling middleware

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

To run the development server:

```bash
npm run dev
```

### Production

To build and run in production:

```bash
npm run build
npm start
```

## API Endpoints

### Users

- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID
- POST /api/users - Create new user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

### Products

- GET /api/products - Get all products
- GET /api/products/:id - Get product by ID
- POST /api/products - Create new product
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product

### Health Check

- GET /health - Check server status

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=development
```
