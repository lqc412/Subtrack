# SubTrack - Subscription Management App

SubTrack is a full-stack application designed to help users track and manage their recurring subscriptions. Built with modern web technologies, it provides an intuitive interface for monitoring expenses, billing cycles, and upcoming payments.

## 🚀 Features

- **Subscription Tracking**: Manage all your recurring subscriptions in one place
- **Billing Cycles**: Support for daily, weekly, monthly, and yearly billing
- **Payment Reminders**: Track upcoming billing dates
- **Currency Support**: Multiple currency options (USD, EUR, GBP, CNY, JPY)
- **Subscription Status**: Toggle active/inactive subscriptions
- **Categorization**: Organize subscriptions by category
- **Search Functionality**: Quickly find specific subscriptions

## 🛠️ Tech Stack

### Frontend
- **React** (v19) - UI library
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind CSS

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Relational database
- **CORS** - Cross-Origin Resource Sharing middleware

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

## 🔧 Installation

### Clone the repository

```bash
git clone https://github.com/your-username/SubTrack.git
cd SubTrack
```

### Setup Backend

```bash
cd SubTrack-backend
npm install

# Create a .env file with the following variables:
# DATABASE_URL=postgresql://username:password@localhost:5432/subtrack
# PORT=3000

# Start development server
npm run dev
```

### Setup Frontend

```bash
cd SubTrack-frontend
npm install

# Start development server
npm run dev
```

## 📱 Usage

1. **Add Subscription**: Click the "+" button in the bottom right corner
2. **Edit Subscription**: Click the three dots next to any subscription and select "Update"
3. **Delete Subscription**: Click the three dots next to any subscription and select "Delete"
4. **Toggle Status**: Use the toggle in the edit form to mark subscriptions as active/inactive

## 🔄 API Endpoints

- `GET /api/subscriptions` - Get all subscriptions
- `POST /api/subscriptions` - Create a new subscription
- `PUT /api/subscriptions/:id` - Update a subscription
- `DELETE /api/subscriptions/:id` - Delete a subscription

## 📂 Project Structure

```
SubTrack/
├── SubTrack-frontend/       # Frontend code
│   ├── public/              # Static assets
│   ├── src/                 # Source files
│   │   ├── components/      # React components
│   │   ├── assets/          # Images and other assets
│   │   ├── App.jsx          # Main component
│   │   └── main.jsx         # Entry point
│   └── vite.config.js       # Vite configuration
├── SubTrack-backend/        # Backend code
│   ├── src/                 # Source files
│   │   ├── controllers/     # Route controllers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── index.js         # Entry point
│   └── package.json         # Dependencies
└── README.md                # Project documentation
```

## 🧪 Running Tests

```bash
# Backend tests
cd SubTrack-backend
npm test

# Frontend tests
cd SubTrack-frontend
npm test
```

## 🔮 Future Improvements

- User authentication and profiles
- Data visualization and spending analytics
- Email notifications for upcoming payments
- Subscription recommendations
- Import subscriptions from bank statements or emails

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)