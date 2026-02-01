import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../utils/useAuth';
import { Role } from '../types/auth';
import { AuthLayout } from '../components/AuthLayout';
import { Alert } from '../components/Alert';
import { FormField, FormSelect } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';

const ROLE_OPTIONS = [
  { value: Role.CLIENT, label: 'Client' },
  { value: Role.ORGANIZER, label: 'Organisateur' },
  { value: Role.STAFF, label: 'Staff' },
];

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.CLIENT);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({ email, password, role });
      setUser(response.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erreur lors de l’inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Créez votre compte">
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

        <FormField
          id="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="••••••••"
        />

        <FormSelect
          id="role"
          label="Type de compte"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          options={ROLE_OPTIONS}
        />

        <PrimaryButton loading={loading}>
          {loading ? 'Inscription...' : "S'inscrire"}
        </PrimaryButton>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Déjà un compte ?{' '}
          <Link
            to="/login"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Connectez-vous
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
