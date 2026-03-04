import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../utils/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { Alert } from '../components/Alert';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const from = location.state && typeof location.state === 'object' && 'from' in location.state
    ? (location.state as { from: string }).from
    : undefined;
  const rawStateMessage = location.state && typeof location.state === 'object' && 'message' in location.state
    ? (location.state as { message?: unknown }).message
    : undefined;
  const stateMessage = typeof rawStateMessage === 'string' ? rawStateMessage : undefined;
  const registered = location.state && typeof location.state === 'object' && 'registered' in location.state && location.state.registered;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      navigate(from ?? '/dashboard', { replace: true });
    } catch (err: unknown) {
      const data =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      const msg =
        data && typeof data === 'object' && data !== null && 'message' in data
          ? (data as { message?: unknown }).message
          : undefined;
      const messageStr =
        typeof msg === 'string'
          ? msg
          : data && typeof data === 'object' && 'error' in data
            ? String((data as { error?: unknown }).error)
            : 'Email ou mot de passe incorrect';
      setError(messageStr);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/v1/auth/google`;
  };

  return (
    <AuthLayout subtitle="Connectez-vous à votre compte">
      <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulaire de connexion" noValidate>
        {stateMessage && <Alert message={stateMessage} variant="warning" />}
        {registered && (
          <Alert message="Inscription réussie. Connectez-vous avec vos identifiants." variant="success" />
        )}
        {error && <Alert message={error} />}

        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="votre@email.com"
        />

        <FormField
          id="password"
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />

        <PrimaryButton loading={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </PrimaryButton>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300 dark:border-neutral-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">Ou continuer avec</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Se connecter avec Google
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          Pas encore de compte ?{' '}
          <Link
            to="/register"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
          >
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
