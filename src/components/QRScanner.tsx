import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  useEffect(() => {
    // We delay slightly to ensure the DOM element is fully rendered before mounting the scanner
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [0] },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          onScan(decodedText);
        },
        () => {
          // Continuous scanning generates many errors when no QR is present, we ignore them.
        }
      );

      return () => {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-[var(--border-color)]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-danger focus:outline-none z-10 p-1 bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-center text-black">Scan Barcode / QR</h2>
        <div id="qr-reader" className="w-full rounded overflow-hidden shadow-inner bg-black"></div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Point your camera at the Customer ID Card.
        </p>
      </div>
    </div>
  );
};
