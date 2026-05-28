import { useEffect, useState } from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ImageUpload } from './ui/ImageUpload';
import { BarcodeScanner } from './BarcodeScanner';
import { calculateSellingPrice } from '../utils/pricing';
import { fetchProductByBarcode, compressImageFromUrl } from '../utils/barcode';
import { Barcode, Tag, Save, X, Info, Search, Loader2 } from 'lucide-react';
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
  market_costs: z.array(z.object({
    price: z.number().optional().or(z.nan()),
    location: z.string().optional()
  })).max(5).optional(),
  current_stock: z.number().min(0),
  min_stock: z.number().min(0).optional(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  batches: z.array(z.object({
    batch_number: z.string().min(1, 'Número do lote obrigatório'),
    expiry_date: z.string().min(1, 'Data de validade obrigatória'),
    quantity: z.number().min(0, 'Quantidade não pode ser negativa')
  })).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: any; // Alterado para any para aceitar product_batches
  onSubmit: (data: ProductInsert & { batches?: any[] }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, loading }: ProductFormProps) {
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);

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
      market_costs: (initialData as any)?.market_costs || [],
      current_stock: (initialData as any)?.current_stock || 0,
      min_stock: (initialData as any)?.min_stock || 0,
      batch_number: (initialData as any)?.batch_number || '',
      expiry_date: (initialData as any)?.expiry_date || '',
      batches: (initialData as any)?.product_batches || (initialData as any)?.batches || [],
    },
  });

  const { fields: marketCostFields, append: appendMarketCost, remove: removeMarketCost } = useFieldArray({
    control,
    name: 'market_costs'
  });

  const { fields: batchFields, append: appendBatch, remove: removeBatch } = useFieldArray({
    control,
    name: 'batches'
  });

  const watchedBatches = useWatch({ control, name: 'batches' });

  useEffect(() => {
    if (watchedBatches && watchedBatches.length > 0) {
      const total = watchedBatches.reduce((acc: number, batch: any) => {
        const qty = Number(batch?.quantity || 0);
        return acc + (isNaN(qty) ? 0 : qty);
      }, 0);
      setValue('current_stock', total);
    }
  }, [watchedBatches, setValue]);

  // Log de erros para ajudar no diagnóstico se o botão não funcionar
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Erros de validação do formulário:', errors);
    }
  }, [errors]);

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

  const handleBarcodeLookup = async (code: string) => {
    if (!code || code.length < 8) return;
    
    setIsFetchingBarcode(true);
    try {
      const productData = await fetchProductByBarcode(code);
      if (productData) {
        // Só preenche se o campo estiver vazio para evitar sobrescrever
        if (!watchedFields.name) setValue('name', productData.name);
        if (!watchedFields.category && productData.category) setValue('category', productData.category);
        if (!watchedFields.image_url && productData.image_url) {
          try {
            const base64Image = await compressImageFromUrl(productData.image_url);
            setValue('image_url', base64Image);
          } catch (e) {
            console.error('Falha ao processar imagem da API:', e);
            // Fallback: tenta usar a URL original se o canvas falhar (CORS)
            setValue('image_url', productData.image_url);
          }
        }
        
        // Se houver marca, adiciona ao nome se não estiver lá
        if (productData.brand && !watchedFields.name?.toLowerCase().includes(productData.brand.toLowerCase())) {
          const currentName = watchedFields.name || productData.name;
          if (currentName && !currentName.toLowerCase().includes(productData.brand.toLowerCase())) {
            setValue('name', `${productData.brand} - ${currentName}`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do produto:', error);
    } finally {
      setIsFetchingBarcode(false);
    }
  };

  const handleScan = (code: string) => {
    setValue('barcode', code);
    setShowScanner(false);
    handleBarcodeLookup(code);
  };

  return (
    <>
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
      
      <form 
        onSubmit={handleSubmit((data) => {
          // Limpar os campos opcionais que vieram vazios
          const cleanedMarketCosts = data.market_costs?.filter(
            cost => cost && typeof cost.price === 'number' && !isNaN(cost.price) && cost.location && cost.location.trim() !== ''
          ) || [];

          const cleanedBatches = data.batches?.filter(
            batch => batch && batch.batch_number && batch.batch_number.trim() !== '' && batch.expiry_date
          ) || [];

          // Regra FEFO: Lote mais próximo da validade define o lote principal do produto
          let mainBatchNumber = data.batch_number === '' ? null : data.batch_number;
          let mainExpiryDate = data.expiry_date === '' ? null : data.expiry_date;

          if (cleanedBatches.length > 0) {
            const sortedBatches = [...cleanedBatches].sort(
              (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
            );
            mainBatchNumber = sortedBatches[0].batch_number;
            mainExpiryDate = sortedBatches[0].expiry_date;
          }

          onSubmit({
            ...data,
            category: data.category === '' ? null : data.category,
            expiry_date: mainExpiryDate,
            batch_number: mainBatchNumber,
            market_price: isNaN(data.market_price as any) ? null : data.market_price,
            min_stock: isNaN(data.min_stock as any) ? 0 : data.min_stock,
            market_costs: cleanedMarketCosts,
            selling_price: calculatedPrice,
            batches: cleanedBatches,
          } as any);
        })} 
        className="space-y-8 animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{initialData ? 'Editar Produto' : 'Novo Produto'}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" /> Cancelar
          </Button>
        </div>

        {/* Alerta de erro visível no celular */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-shake">
            <p className="text-sm font-bold text-destructive flex items-center gap-2">
              <Info size={16} /> Verifique os campos em vermelho abaixo.
            </p>
            <ul className="mt-2 text-xs text-destructive/80 list-disc list-inside">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>{(error as any).message || key}</li>
              ))}
            </ul>
          </div>
        )}

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
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {isFetchingBarcode ? (
                        <Loader2 size={18} className="animate-spin text-primary" />
                      ) : (
                        <>
                          <button 
                            type="button" 
                            onClick={() => handleBarcodeLookup(watchedFields.barcode || '')}
                            className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="Buscar dados do produto"
                          >
                            <Search size={18} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowScanner(true)}
                            className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="Escanear código"
                          >
                            <Barcode size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="w-full">
                  <Input
                    label="Estoque Atual"
                    type="number"
                    readOnly={batchFields.length > 0}
                    className={batchFields.length > 0 ? "bg-muted cursor-not-allowed" : ""}
                    {...register('current_stock', { valueAsNumber: true })}
                    error={errors.current_stock?.message}
                  />
                  {batchFields.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      * Calculado a partir da soma dos lotes
                    </p>
                  )}
                </div>
                <Input
                  label="Aviso Estoque Mín."
                  type="number"
                  placeholder="Ex: 5"
                  {...register('min_stock', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-amber-700">Controle de Lotes (FEFO)</span>
                    <span className="text-[10px] text-muted-foreground">Cadastre múltiplos lotes e validades</span>
                  </div>
                  <span className="text-[10px] text-amber-700 uppercase font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                    {batchFields.length} {batchFields.length === 1 ? 'lote' : 'lotes'}
                  </span>
                </div>

                <div className="space-y-3">
                  {batchFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start group animate-in fade-in duration-200 border-b border-amber-500/10 pb-3 last:border-0 last:pb-0">
                      <div className="grid grid-cols-12 gap-2 flex-1">
                        <div className="col-span-4">
                          <Input
                            placeholder="Lote"
                            className="h-9 text-sm"
                            {...register(`batches.${index}.batch_number` as any)}
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            type="date"
                            className="h-9 text-sm"
                            {...register(`batches.${index}.expiry_date` as any)}
                          />
                        </div>
                        <div className="col-span-3 relative">
                          <Input
                            type="number"
                            placeholder="Qtd"
                            className="h-9 text-sm pr-8"
                            {...register(`batches.${index}.quantity` as any, { valueAsNumber: true })}
                          />
                          <button
                            type="button"
                            onClick={() => removeBatch(index)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-destructive hover:text-red-700 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-9 border-dashed text-xs border-amber-500/30 text-amber-700 hover:bg-amber-500/5 hover:text-amber-800"
                  onClick={() => appendBatch({ batch_number: '', expiry_date: '', quantity: 1 })}
                >
                  + Adicionar Lote
                </Button>
                <p className="text-[10px] text-amber-600 leading-tight italic">
                  * O lote que vencer mais cedo (FEFO) será exibido no catálogo principal.
                </p>
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

          <div className="space-y-4 pt-4 border-t border-secondary/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500 text-white">
                  <Search size={14} />
                </div>
                <label className="text-sm font-bold">Outros Custos / Mercado</label>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold bg-muted px-2 py-0.5 rounded">
                {marketCostFields.length} de 5
              </span>
            </div>
            
            <div className="space-y-3">
              {marketCostFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center group animate-in fade-in duration-200">
                  <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="grid grid-cols-5 gap-2 flex-1">
                    <div className="col-span-2">
                      <Input
                        placeholder="Preço R$"
                        type="number"
                        step="0.01"
                        className="h-9 text-sm"
                        {...register(`market_costs.${index}.price` as any, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="col-span-3 relative">
                      <Input
                        placeholder="Local / Fornecedor"
                        className="h-9 text-sm pr-8"
                        {...register(`market_costs.${index}.location` as any)}
                      />
                      <button
                        type="button"
                        onClick={() => removeMarketCost(index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-destructive hover:text-red-700 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {marketCostFields.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 border-dashed text-xs"
                onClick={() => appendMarketCost({ price: undefined, location: '' } as any)}
              >
                + Adicionar Local/Preço
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground leading-tight italic">
              * Registre aqui os preços de concorrentes ou cotações externas para monitorar seu custo.
            </p>
          </div>
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
