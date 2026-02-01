import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { api } from '../services/api';
import type { User } from '../types/auth';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    const exchange = async () => {
      try {
        const { data } = await api.post<{
          accessToken: string;
          refreshToken: string;
          user: { id: string; email: string; role: string };
        }>('/auth/google/exchange', { code });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user as User);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Erreur lors de l’échange du code OAuth:', err);
        navigate('/login', { replace: true });
      }
    };

    exchange();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
}
