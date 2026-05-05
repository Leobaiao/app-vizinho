import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Camera, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Inicializar o scanner habilitando o uso do motor nativo do celular (BarcodeDetector) se existir
    const html5QrCode = new Html5Qrcode("reader", {
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    });
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Usa a câmera traseira
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13, 
              Html5QrcodeSupportedFormats.EAN_8, 
              Html5QrcodeSupportedFormats.CODE_128
            ]
          },
          (decodedText) => {
            // Apenas repassa o código lido.
            // Não chame .stop() aqui, pois o componente pai (Inventory/Products) 
            // vai fechar a tela (setShowScanner(false)) e o useEffect cuidará do stop() com segurança.
            onScan(decodedText);
          },
          () => {
            // Erros de frame são normais, ignorar silenciosamente
          }
        );
      } catch (err: any) {
        console.error("Erro ao iniciar a câmera", err);
        setError("Não foi possível acessar a câmera. Verifique as permissões do navegador ou se está usando HTTPS.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
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
        {error ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-center text-red-400 space-y-4">
            <AlertCircle className="mx-auto h-8 w-8" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-gray-900 aspect-square">
            <div id="reader" className="w-full h-full [&>video]:object-cover" style={{ minHeight: '100%' }}></div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={onClose}>
            <Camera className="mr-2 h-4 w-4" /> Digitar Manualmente
          </Button>
        </div>
      </div>
    </div>
  );
}
