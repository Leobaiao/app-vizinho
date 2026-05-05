import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Camera, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
  inline?: boolean;
}

export function BarcodeScanner({ onScan, onClose, inline = false }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  // Controle de debounce para não ler o mesmo código 10 vezes num segundo
  const lastScannedTime = useRef(0);
  const lastScannedCode = useRef('');

  // Manter referência atualizada do callback sem forçar o useEffect a reiniciar a câmera
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

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
            aspectRatio: inline ? 1.5 : 1.0, // Se inline, deixa mais retangular para economizar espaço
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13, 
              Html5QrcodeSupportedFormats.EAN_8, 
              Html5QrcodeSupportedFormats.CODE_128
            ]
          },
          (decodedText) => {
            const now = Date.now();
            // Ignora o mesmo código se foi lido a menos de 2.5 segundos atrás
            if (lastScannedCode.current === decodedText && (now - lastScannedTime.current) < 2500) {
              return;
            }
            
            lastScannedCode.current = decodedText;
            lastScannedTime.current = now;
            
            // Chama a função real via Ref
            onScanRef.current(decodedText);
          },
          () => {
            // Erros de frame são normais, ignorar silenciosamente
          }
        );
      } catch (err: any) {
        console.error("Erro ao iniciar a câmera", err);
        setError("Não foi possível acessar a câmera. Verifique permissões.");
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
  }, [inline]); // Removido onScan das dependências!

  const containerClasses = inline
    ? "w-full animate-in fade-in duration-300 mb-6"
    : "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300";

  return (
    <div className={containerClasses}>
      {!inline && onClose && (
        <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>
      )}

      <div className={`w-full max-w-md mx-auto ${inline ? '' : 'px-4 space-y-6'}`}>
        {!inline && (
          <div className="text-center text-white space-y-2">
            <div className="inline-flex p-3 rounded-full bg-primary/20 text-primary mb-2">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold">Escaneando Produto</h3>
            <p className="text-sm text-gray-400">Posicione o código de barras dentro da área demarcada</p>
          </div>
        )}

        {/* Onde a câmera será renderizada */}
        {error ? (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-center text-red-500 space-y-4">
            <AlertCircle className="mx-auto h-8 w-8" />
            <p>{error}</p>
          </div>
        ) : (
          <div className={`relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-gray-900 ${inline ? 'aspect-[4/3] shadow-lg shadow-primary/10' : 'aspect-square'}`}>
            <div id="reader" className="w-full h-full [&>video]:object-cover" style={{ minHeight: '100%' }}></div>
          </div>
        )}

        {!inline && onClose && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={onClose}>
              <Camera className="mr-2 h-4 w-4" /> Digitar Manualmente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
