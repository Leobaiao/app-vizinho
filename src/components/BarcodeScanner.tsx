import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
  inline?: boolean;
}

export function BarcodeScanner({ onScan, onClose, inline = false }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPausedUI, setIsPausedUI] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  // Usamos uma Ref para a pausa lógica ser instantânea e não depender de re-render do React
  const isProcessingRef = useRef(false);
  
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    // Trava para evitar double-mount no React Strict Mode
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    const initScanner = async () => {
      // Pequeno delay para garantir que o elemento DOM existe e evitar corrida
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!isMounted) return;

      html5QrCode = new Html5Qrcode("reader", {
        verbose: false,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13, 
          Html5QrcodeSupportedFormats.EAN_8, 
          Html5QrcodeSupportedFormats.CODE_128
        ]
      });
      scannerRef.current = html5QrCode;
      
      try {
        setError(null);
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: inline ? 1.5 : 1.0,
          },
          (decodedText) => {
            // Se já estiver processando um código, ignora COMPLETAMENTE qualquer leitura nova
            if (isProcessingRef.current) return;
            
            // 1. Trava imediata
            isProcessingRef.current = true;
            setIsPausedUI(true);
            
            // 2. Feedback
            if (navigator.vibrate) navigator.vibrate(100);
            
            // 3. Envia o código lido
            onScanRef.current(decodedText);
            
            // 4. Libera a trava apenas após 2.5 segundos (mantém a câmera ligada, apenas ignora os dados)
            setTimeout(() => {
              isProcessingRef.current = false;
              setIsPausedUI(false);
            }, 2500);
          },
          () => {} // Ignora erros de frame
        );
      } catch (err: any) {
        console.error("Erro ao iniciar a câmera", err);
        if (isMounted) setError("Não foi possível acessar a câmera.");
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode?.clear();
        }).catch(console.error);
      }
    };
  }, [inline]);

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
            <p className="text-sm text-gray-400">Posicione o código de barras na área</p>
          </div>
        )}

        <div className={`relative overflow-hidden rounded-2xl border-2 ${isPausedUI ? 'border-emerald-500' : 'border-primary/50'} bg-gray-900 ${inline ? 'aspect-[4/3] shadow-lg shadow-primary/10' : 'aspect-square'}`}>
          {/* A câmera continua rodando aqui dentro, sem piscar */}
          <div id="reader" className="w-full h-full [&>video]:object-cover"></div>
          
          {isPausedUI && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/40 backdrop-blur-[2px] text-white animate-in fade-in">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <span className="text-sm font-bold uppercase tracking-widest drop-shadow-md">Salvo!</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 text-red-500 p-6 text-center">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-xs">{error}</p>
            </div>
          )}
        </div>

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
