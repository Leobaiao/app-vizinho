import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  variant?: 'danger' | 'success' | 'warning' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  variant = 'info',
  actionLabel,
  onAction
}: ModalProps) {
  const icons = {
    danger: <AlertTriangle className="h-6 w-6 text-destructive" />,
    success: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    info: <Info className="h-6 w-6 text-primary" />,
  };

  const bgColors = {
    danger: 'bg-destructive/10',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    info: 'bg-primary/10',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-border"
            >
              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div className={cn("shrink-0 p-3 rounded-2xl h-fit", bgColors[variant])}>
                    {icons[variant]}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-xl leading-tight">{title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={onClose} className="rounded-xl">
                    {onAction ? 'Cancelar' : 'OK'}
                  </Button>
                  {onAction && (
                    <Button 
                      variant={variant === 'danger' ? 'destructive' : 'default'}
                      onClick={() => {
                        onAction();
                        onClose();
                      }}
                      className="rounded-xl px-6"
                    >
                      {actionLabel || 'Confirmar'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
