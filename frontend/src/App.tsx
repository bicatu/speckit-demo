import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { BrowseEntriesPage } from './pages/BrowseEntriesPage';
import { AddEntryPage } from './pages/AddEntryPage';
import { AdminPage } from './pages/AdminPage';

// Placeholder components (will be implemented in subsequent phases)
const HomePage: React.FC = () => <div>Home Page - Coming Soon</div>;
const LoginPage: React.FC = () => <div>Login Page - Coming Soon</div>;

function App() {
  // TODO: Replace with actual auth check from AuthContext
  const isAdmin = true; // Mock admin status for development

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <nav style={{ 
          padding: '10px 20px', 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #dee2e6',
          marginBottom: '20px'
        }}>
          <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
          <Link to="/entries" style={{ marginRight: '15px' }}>Browse</Link>
          <Link to="/entries/add" style={{ marginRight: '15px' }}>Add Entry</Link>
          {isAdmin && <Link to="/admin" style={{ marginRight: '15px' }}>Admin</Link>}
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/entries" element={<BrowseEntriesPage />} />
          <Route path="/entries/add" element={<AddEntryPage />} />
          {isAdmin && <Route path="/admin" element={<AdminPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
