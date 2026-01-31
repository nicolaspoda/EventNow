import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../utils/AuthContext';
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
  const { setUser } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Connectez-vous à votre compte">
      <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Pas encore de compte ?{' '}
          <Link
            to="/register"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
