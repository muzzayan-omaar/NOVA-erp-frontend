import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
        setIsScanning(false);
      },
      (error) => {
        console.warn(error);
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
        <h3 className="text-xl font-bold mb-6 text-center">Scan Barcode</h3>
        <div id="reader" className="w-full"></div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-slate-200 hover:bg-slate-300 py-4 rounded-2xl font-semibold"
        >
          Cancel Scanning
        </button>
      </div>
    </div>
  );
}