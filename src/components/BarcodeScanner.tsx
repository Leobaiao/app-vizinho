import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Camera } from 'lucide-react';
import { Button } from './ui/Button';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Configuração do scanner
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.CODE_128]
      },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        // Sucesso na leitura
        onScan(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      },
      () => {
        // Erro silencioso (comum durante a busca de frames)
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
          <X size={24} />
        </Button>
      </div>

      <div className="w-full max-w-md px-4 space-y-6">
        <div className="text-center text-white space-y-2">
          <div className="inline-flex p-3 rounded-full bg-primary/20 text-primary mb-2">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold">Escaneando Produto</h3>
          <p className="text-sm text-gray-400">Posicione o código de barras dentro da área demarcada</p>
        </div>

        {/* Onde a câmera será renderizada */}
        <div id="reader" className="overflow-hidden rounded-2xl border-2 border-primary/50 bg-gray-900 aspect-square"></div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={onClose}>
            <Camera className="mr-2 h-4 w-4" /> Digitar Manualmente
          </Button>
        </div>
      </div>
    </div>
  );
}
