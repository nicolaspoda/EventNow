import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onError: (error: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const hasScanned = useRef(false);

  useEffect(() => {
    const elementId = 'qr-reader';
    const scanner = new Html5Qrcode(elementId);

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!hasScanned.current) {
            hasScanned.current = true;
            onScan(decodedText);
            scanner.stop().catch(() => {});
          }
        },
        () => {}
      )
      .catch((err: Error) => {
        onError(err?.message ?? "Impossible d'accéder à la caméra");
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan, onError]);

  return (
    <div className="relative">
      <div id="qr-reader" className="w-full overflow-hidden rounded-lg" />
      <p className="text-center mt-2 text-sm text-gray-600">
        Positionnez le QR code dans le cadre
      </p>
    </div>
  );
};
