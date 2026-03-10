import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../components/AuthLayout';
import { Alert } from '../components/Alert';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function validateUsername(value: string): string | null {
  if (!value.trim()) return "Le nom d'utilisateur est obligatoire";
  if (value.length < 3) return "Le nom d'utilisateur doit contenir au moins 3 caractères";
  if (value.length > 30) return "Le nom d'utilisateur ne peut pas dépasser 30 caractères";
  if (!USERNAME_REGEX.test(value)) return 'Lettres, chiffres et underscores uniquement';
  return null;
}

export function RegisterOrganizerPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [confirmOrganizer, setConfirmOrganizer] = useState(false);
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

    if (!confirmOrganizer) {
      setError('Vous devez confirmer être un organisateur d\'événement');
      return;
    }

    setLoading(true);

    try {
      await authService.registerOrganizer({
        username: username.trim(),
        email,
        password,
        organizationName: organizationName.trim() || undefined,
        confirmOrganizer,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Créez votre compte organisateur">
      <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
        <p className="text-sm text-primary-800 dark:text-primary-200">
          Cette page est réservée aux organisateurs d'événements. Si vous souhaitez simplement acheter des billets,{' '}
          <Link to="/register" className="font-semibold underline">
            créez un compte client
          </Link>
          .
        </p>
      </div>

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
          id="organizationName"
          label="Nom de votre organisation (optionnel)"
          type="text"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          placeholder="Ex: Mon Association, Ma Société"
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

        <div className="flex items-start">
          <input
            id="confirmOrganizer"
            type="checkbox"
            checked={confirmOrganizer}
            onChange={(e) => setConfirmOrganizer(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 rounded"
          />
          <label htmlFor="confirmOrganizer" className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
            Je confirme être un organisateur d'événement. Je ne souhaite ni acheter ni revendre un billet.
          </label>
        </div>

        <PrimaryButton loading={loading}>
          {loading ? 'Inscription...' : "S'inscrire en tant qu'organisateur"}
        </PrimaryButton>
      </form>

      <div className="mt-6 text-center space-y-3">
        <p className="text-neutral-600 dark:text-neutral-400">
          Vous souhaitez simplement acheter des billets ?{' '}
          <Link
            to="/register"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
          >
            Créer un compte client
          </Link>
        </p>
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
