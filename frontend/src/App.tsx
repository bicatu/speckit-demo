import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { BrowseEntriesPage } from './pages/BrowseEntriesPage';

// Placeholder components (will be implemented in subsequent phases)
const HomePage: React.FC = () => <div>Home Page - Coming Soon</div>;
const LoginPage: React.FC = () => <div>Login Page - Coming Soon</div>;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/entries" element={<BrowseEntriesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
