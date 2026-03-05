import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRScanner } from '../components/staff/QRScanner';
import { ValidationResult } from '../components/staff/ValidationResult';
import { validationService } from '../services/validationService';
import type { ValidationResponse } from '../services/validationService';
import Button from '../components/ui/Button';

export const StaffScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleScan = async (qrCode: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await validationService.validateTicket(qrCode);
      setResult(response);

      if (navigator.vibrate) {
        if (response.valid) {
          navigator.vibrate(200);
        } else {
          navigator.vibrate([100, 50, 100]);
        }
      }

      if (response.valid) {
        setTimeout(() => setResult(null), 3000);
      }
    } catch (err) {
      setResult({
        valid: false,
        reason: 'ERROR',
        message: 'Erreur de connexion au serveur',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = () => {
    const qrCode = window.prompt('Entrez le code du billet :');
    if (qrCode?.trim()) {
      handleScan(qrCode.trim());
    }
  };

  return (
    <main className="min-h-screen">
      <header className="bg-white dark:bg-neutral-800/80 shadow border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Validation billets
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Mode STAFF</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/staff/validations')}
            >
              Historique
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <section
            className="glass-card p-6"
            aria-labelledby="scan-title"
          >
            <h2 id="scan-title" className="text-xl font-semibold mb-4 text-center text-neutral-900 dark:text-neutral-100">
              Scanner un billet
            </h2>

            {!scanning && !result && !loading && (
              <div className="space-y-4">
                {cameraError && (
                  <div
                    className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm"
                    role="alert"
                  >
                    {cameraError}
                    <button
                      type="button"
                      onClick={() => setCameraError(null)}
                      className="ml-2 underline font-medium"
                    >
                      Fermer
                    </button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setCameraError(null);
                    setScanning(true);
                  }}
                >
                  Activer la caméra
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={handleManualInput}
                >
                  Saisie manuelle
                </Button>
              </div>
            )}

            {scanning && !result && !loading && (
              <div>
                <QRScanner
                  onScan={handleScan}
                  onError={(error) => {
                    setCameraError(error || "Impossible d'accéder à la caméra");
                    setScanning(false);
                  }}
                />
                <Button
                  type="button"
                  variant="danger"
                  fullWidth
                  className="mt-4"
                  onClick={() => {
                    setScanning(false);
                    setCameraError(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div
                  className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
                  aria-hidden="true"
                />
                <p className="text-gray-600 dark:text-neutral-400">Vérification en cours...</p>
              </div>
            )}

            {result && (
              <div>
                <ValidationResult result={result} />
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  className="mt-4"
                  onClick={() => {
                    setResult(null);
                    setScanning(true);
                  }}
                >
                  Scanner un autre billet
                </Button>
              </div>
            )}
          </section>

          <section
            className="bg-blue-50 dark:bg-neutral-700/50 border border-blue-200 dark:border-neutral-600 rounded-lg p-4"
            aria-labelledby="instructions-title"
          >
            <h3 id="instructions-title" className="font-semibold text-blue-900 dark:text-neutral-100 mb-2">
              Instructions
            </h3>
            <ul className="text-sm text-blue-800 dark:text-neutral-300 space-y-1 list-disc list-inside">
              <li>Pointez la caméra vers le QR code du billet</li>
              <li>Le scan se fait automatiquement</li>
              <li>Vérifiez le message de validation avant de laisser entrer</li>
              <li>En cas de doute, contactez un responsable</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
};
