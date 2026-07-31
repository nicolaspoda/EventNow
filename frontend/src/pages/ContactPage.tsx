import React, { useState } from 'react';
import { contactService } from '../services/contactService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { Card, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await contactService.sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors de l'envoi de votre message"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
        Nous contacter
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8">
        Une question, un problème, une suggestion ? Écrivez-nous, nous vous répondrons rapidement.
      </p>

      <Card>
        <CardBody>
          {sent ? (
            <div className="text-center py-8" role="status">
              <svg
                className="mx-auto h-12 w-12 text-success-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                Message envoyé !
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Merci, nous reviendrons vers vous dès que possible.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="contact-name"
                label="Nom"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                disabled={loading}
                autoComplete="name"
              />

              <Input
                id="contact-email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                disabled={loading}
                autoComplete="email"
              />

              <Input
                id="contact-subject"
                label="Sujet"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                minLength={3}
                maxLength={150}
                disabled={loading}
              />

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Message <span className="text-error-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  required
                  minLength={10}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  placeholder="Votre message..."
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed resize-none"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 text-right">
                  {message.length}/2000
                </p>
              </div>

              {error && (
                <p className="text-sm text-error-600 dark:text-error-400" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ContactPage;
