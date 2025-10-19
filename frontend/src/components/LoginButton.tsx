import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginButtonProps {
  returnUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * LoginButton - initiates OpenID Connect login flow
 * Redirects to auth provider (Keycloak or WorkOS)
 */
export const LoginButton: React.FC<LoginButtonProps> = ({
  returnUrl,
  className,
  children = 'Login',
}) => {
  const { login, error } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await login(returnUrl);
    } catch (err) {
      console.error('Login failed:', err);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={className}
        style={{
          padding: '0.5rem 1rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? 'Redirecting...' : children}
      </button>
      {error && (
        <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
};
