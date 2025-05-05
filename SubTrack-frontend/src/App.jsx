// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SettingsPage from './pages/SettingsPage';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Auth Layout component
const AuthLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">SubTrack</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Track all your subscriptions in one place
        </p>
      </div>
      {children}
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="mt-2">Page not found</p>
                <button 
                  className="btn btn-primary mt-4"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </button>
              </div>
            </div>} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;