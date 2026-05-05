import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './Button';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File) => void;
}

export function ImageUpload({ value, onChange, onFileSelect }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Como estamos salvando no dispositivo local por enquanto, 
      // URL de BLOB some se fechar a aba. Precisamos converter para Base64 e comprimir!
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; // Resolução suficiente para um thumbnail
          let width = img.width;
          let height = img.height;

          // Manter proporção
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Comprimir para JPEG (qualidade 70%) para ocupar quase zero espaço no celular
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          setPreview(compressedDataUrl);
          onChange(compressedDataUrl);
          if (onFileSelect) onFileSelect(file);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setPreview(undefined);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="relative group aspect-square w-full max-w-[200px] mx-auto rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50">
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="h-full w-full object-cover animate-in fade-in zoom-in duration-300" />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
            <ImageIcon size={32} strokeWidth={1.5} />
            <p className="text-xs font-medium">Foto do Produto</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" /> Tirar Foto
        </Button>
      </div>
    </div>
  );
}
