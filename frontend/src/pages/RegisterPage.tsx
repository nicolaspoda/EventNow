import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
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

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function validateUsername(value: string): string | null {
  if (!value.trim()) return 'Le nom d’utilisateur est obligatoire';
  if (value.length < 3) return 'Le nom d’utilisateur doit contenir au moins 3 caractères';
  if (value.length > 30) return 'Le nom d’utilisateur ne peut pas dépasser 30 caractères';
  if (!USERNAME_REGEX.test(value)) return 'Lettres, chiffres et underscores uniquement';
  return null;
}

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.CLIENT);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);

    try {
      await authService.register({ username: username.trim(), email, password, role });
      navigate('/login', { state: { registered: true } });
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
          id="username"
          label="Nom d'utilisateur"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          required
          minLength={3}
          maxLength={30}
          autoComplete="username"
        />

        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <FormField
          id="password"
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <FormField
          id="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
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
        <p className="text-neutral-600 dark:text-neutral-400">
          Déjà un compte ?{' '}
          <Link
            to="/login"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
          >
            Connectez-vous
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
