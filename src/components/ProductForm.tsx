import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ImageUpload } from './ui/ImageUpload';
import { BarcodeScanner } from './BarcodeScanner';
import { calculateSellingPrice } from '../utils/pricing';
import { Barcode, Tag, Save, X, Info } from 'lucide-react';
import type { ProductInsert } from '../types/product';

const productSchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  category: z.string().optional(),
  barcode: z.string().optional(),
  image_url: z.string().optional(),
  cost_price: z.number().min(0, 'Custo não pode ser negativo'),
  margin_percent: z.number().min(0, 'Margem não pode ser negativa'),
  payment_fees: z.number().min(0),
  fixed_costs: z.number().min(0),
  market_price: z.number().optional(),
  current_stock: z.number().min(0),
  min_stock: z.number().min(0).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductInsert) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, loading }: ProductFormProps) {
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      barcode: initialData?.barcode || '',
      image_url: initialData?.image_url || '',
      cost_price: initialData?.cost_price || 0,
      margin_percent: initialData?.margin_percent || 30,
      payment_fees: initialData?.payment_fees || 0,
      fixed_costs: initialData?.fixed_costs || 0,
      market_price: initialData?.market_price || 0,
      current_stock: initialData?.current_stock || 0,
      min_stock: initialData?.min_stock || 0,
    },
  });

  // Observar mudanças para atualizar a calculadora em tempo real
  const watchedFields = useWatch({ control });

  useEffect(() => {
    const { sellingPrice, grossProfitAmount } = calculateSellingPrice({
      costPrice: Number(watchedFields.cost_price || 0),
      marginPercent: Number(watchedFields.margin_percent || 0),
      paymentFeesPercent: Number(watchedFields.payment_fees || 0),
      fixedCostsAmount: Number(watchedFields.fixed_costs || 0),
    });

    setCalculatedPrice(sellingPrice);
    setProfitAmount(grossProfitAmount);
  }, [watchedFields]);

  const handleScan = (code: string) => {
    setValue('barcode', code);
    setShowScanner(false);
  };

  return (
    <>
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
      
      <form 
        onSubmit={handleSubmit((data) => {
          onSubmit({
            ...data,
            selling_price: calculatedPrice,
          } as ProductInsert);
        })} 
        className="space-y-8 animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{initialData ? 'Editar Produto' : 'Novo Produto'}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" /> Cancelar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna 1: Básico e Foto */}
          <div className="space-y-6">
            <ImageUpload 
              value={watchedFields.image_url} 
              onChange={(url) => setValue('image_url', url)} 
            />

            <div className="space-y-4">
              <Input
                label="Nome do Produto"
                placeholder="Ex: Coca-Cola 2L"
                {...register('name')}
                error={errors.name?.message}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Categoria"
                  placeholder="Ex: Bebidas"
                  {...register('category')}
                />
                <div className="relative flex flex-col space-y-1.5">
                  <label className="text-sm font-medium">Código de Barras</label>
                  <div className="relative">
                    <Input
                      placeholder="EAN-13"
                      className="pr-10"
                      {...register('barcode')}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowScanner(true)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                    >
                      <Barcode size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Estoque Atual"
                  type="number"
                  {...register('current_stock', { valueAsNumber: true })}
                />
                <Input
                  label="Aviso Estoque Mín."
                  type="number"
                  placeholder="Ex: 5"
                  {...register('min_stock', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

        {/* Coluna 2: Calculadora Financeira */}
        <div className="space-y-6 bg-secondary/20 p-6 rounded-2xl border border-secondary">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500 text-white">
              <Tag size={20} />
            </div>
            <h3 className="font-bold text-lg">Calculadora de Venda</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Custo de Compra (R$)"
              type="number"
              step="0.01"
              {...register('cost_price', { valueAsNumber: true })}
              error={errors.cost_price?.message}
            />
            <Input
              label="Margem Desejada (%)"
              type="number"
              {...register('margin_percent', { valueAsNumber: true })}
              error={errors.margin_percent?.message}
            />
            <Input
              label="Taxas Pagamento (%)"
              type="number"
              step="0.01"
              {...register('payment_fees', { valueAsNumber: true })}
            />
            <Input
              label="Custo Fixo Rateado (R$)"
              type="number"
              step="0.01"
              {...register('fixed_costs', { valueAsNumber: true })}
            />
          </div>

          {/* Resultado da Calculadora */}
          <div className="mt-6 p-6 rounded-xl bg-primary/10 border border-primary/20 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Preço de Venda Sugerido</p>
                <p className="text-4xl font-black text-primary">R$ {calculatedPrice.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">Lucro Bruto</p>
                <p className="text-lg font-bold text-emerald-600">+ R$ {profitAmount.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-primary/10 flex items-center gap-2 text-xs text-muted-foreground">
              <Info size={14} />
              <span>Custo Total Operacional: R$ {(Number(watchedFields.cost_price || 0) + Number(watchedFields.fixed_costs || 0)).toFixed(2)}</span>
            </div>
          </div>

          <Input
            label="Preço Praticado pelo Mercado (R$)"
            type="number"
            step="0.01"
            placeholder="Opcional"
            {...register('market_price', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="px-8" isLoading={loading}>
          <Save className="mr-2 h-4 w-4" /> Salvar Produto
        </Button>
      </div>
    </form>
    </>
  );
}
