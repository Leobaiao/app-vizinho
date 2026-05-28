import { useState } from 'react';
import { parseNFeXML, type NFeItem } from '../utils/xmlParser';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { FileUp, FileText, CheckCircle2, AlertCircle, ArrowRight, Plus, Sparkles, X } from 'lucide-react';
import { calculateSellingPrice } from '../utils/pricing';

export default function History() {
  const { products, updateProduct, addProduct } = useProducts();
  const [items, setItems] = useState<NFeItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'success' | 'warning' | 'info';
  }>({ isOpen: false, title: '', description: '', variant: 'success' });

  const [quickRegItem, setQuickRegItem] = useState<{
    itemIndex: number;
    name: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    category: string;
    marginPercent: number;
    sellingPrice: number;
    batch: string;
    expiry: string;
  } | null>(null);

  const handleQuickRegMarginChange = (margin: number) => {
    if (!quickRegItem) return;
    const { sellingPrice } = calculateSellingPrice({
      costPrice: quickRegItem.unitPrice,
      marginPercent: margin,
      paymentFeesPercent: 0,
      fixedCostsAmount: 0,
    });
    setQuickRegItem({
      ...quickRegItem,
      marginPercent: margin,
      sellingPrice: Number(sellingPrice.toFixed(2))
    });
  };

  const handleQuickRegCostChange = (cost: number) => {
    if (!quickRegItem) return;
    const { sellingPrice } = calculateSellingPrice({
      costPrice: cost,
      marginPercent: quickRegItem.marginPercent,
      paymentFeesPercent: 0,
      fixedCostsAmount: 0,
    });
    setQuickRegItem({
      ...quickRegItem,
      unitPrice: cost,
      sellingPrice: Number(sellingPrice.toFixed(2))
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsed = parseNFeXML(content);
        setItems(parsed);
        setStep('review');
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    let updatedCount = 0;
    for (const item of items) {
      const existingProduct = products.find(p => String(p.barcode || '').trim().replace(/^0+/, '') === String(item.barcode || '').trim().replace(/^0+/, ''));
      if (existingProduct && item.barcode) {
        // Obter lotes existentes
        const existingBatches = existingProduct.product_batches || [];
        
        // Criar o novo lote
        const newBatch = {
          batch_number: item.batch || `XML-${new Date().toISOString().slice(0, 10)}`,
          expiry_date: item.expiry || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          quantity: item.quantity
        };

        const updatedBatches = [...existingBatches, newBatch];
        
        // Regra FEFO: Lote mais próximo da validade define o lote principal do produto
        const sortedBatches = [...updatedBatches].sort(
          (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        );
        const mainBatchNumber = sortedBatches[0]?.batch_number || null;
        const mainExpiryDate = sortedBatches[0]?.expiry_date || null;
        const totalStock = updatedBatches.reduce((acc, b) => acc + Number(b.quantity || 0), 0);

        // Atualiza estoque somando o que chegou na nota e insere novo lote
        await updateProduct(existingProduct.id, {
          current_stock: totalStock,
          cost_price: item.unitPrice, // Atualiza para o custo mais recente
          batch_number: mainBatchNumber,
          expiry_date: mainExpiryDate,
          batches: updatedBatches
        });
        
        updatedCount++;
      }
    }
    setImporting(false);
    
    setModal({
      isOpen: true,
      variant: 'success',
      title: 'Importação Concluída!',
      description: `O estoque, lotes e preços de custo de ${updatedCount} produtos foram atualizados com sucesso.`
    });
    
    setStep('upload');
    setItems([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal(p => ({ ...p, isOpen: false }))}
        title={modal.title}
        description={modal.description}
        variant={modal.variant}
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Importar NF-e</h1>
        <p className="text-muted-foreground">Automatize a entrada de estoque via arquivo XML.</p>
      </div>

      {step === 'upload' ? (
        <Card className="p-12 border-dashed flex flex-col items-center justify-center text-center space-y-6 bg-muted/20">
          <div className="p-6 rounded-full bg-primary/10 text-primary">
            <FileUp size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Selecione o arquivo XML</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Arraste a nota fiscal do fornecedor ou clique para buscar no seu dispositivo.
            </p>
          </div>
          <div className="relative">
            <Button size="lg" className="px-10">
              Escolher Arquivo
            </Button>
            <input 
              type="file" 
              accept=".xml" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileUpload}
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <FileText size={20} />
              <span>{items.length} itens encontrados na nota</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
              Cancelar
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const matched = products.find(p => String(p.barcode || '').trim().replace(/^0+/, '') === String(item.barcode || '').trim().replace(/^0+/, '') && item.barcode !== "");
              return (
                <Card key={idx} className={`p-4 border-l-4 ${matched ? 'border-emerald-500' : 'border-amber-500 bg-amber-500/5'}`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">EAN: {item.barcode || 'Não informado'}</p>
                        
                        {matched ? (
                          <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={12} />
                            <span>Vinculado a: {matched.name}</span>
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                              <AlertCircle size={12} />
                              <span>Produto não cadastrado</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 border-dashed border-amber-500/50 hover:bg-amber-500/10 text-amber-700 text-[10px] py-1 px-3 flex items-center gap-1 font-bold"
                              onClick={() => {
                                const { sellingPrice } = calculateSellingPrice({
                                  costPrice: item.unitPrice,
                                  marginPercent: 30,
                                  paymentFeesPercent: 0,
                                  fixedCostsAmount: 0,
                                });
                                setQuickRegItem({
                                  itemIndex: idx,
                                  name: item.name,
                                  barcode: item.barcode || '',
                                  quantity: item.quantity,
                                  unitPrice: item.unitPrice,
                                  category: '',
                                  marginPercent: 30,
                                  sellingPrice: Number(sellingPrice.toFixed(2)),
                                  batch: item.batch || '',
                                  expiry: item.expiry || ''
                                });
                              }}
                            >
                              <Plus size={12} /> Cadastrar e Vincular
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="font-bold text-sm">Qtd: {item.quantity}</p>
                        <p className="text-xs text-muted-foreground">R$ {item.unitPrice.toFixed(2)}/un</p>
                      </div>
                    </div>

                    {matched && (
                      <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-secondary/50">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Lote</label>
                          <Input 
                            placeholder="Ex: L123"
                            className="h-8 text-xs mt-1"
                            value={item.batch || ''}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx] = { ...newItems[idx], batch: e.target.value };
                              setItems(newItems);
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                            <span>Validade</span>
                            {!item.expiry && <span className="text-[8px] text-destructive font-normal uppercase">* Requerido</span>}
                          </label>
                          <Input 
                            type="date"
                            className={`h-8 text-xs mt-1 ${!item.expiry ? "border-destructive focus-visible:ring-destructive bg-destructive/5" : ""}`}
                            value={item.expiry || ''}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx] = { ...newItems[idx], expiry: e.target.value };
                              setItems(newItems);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="p-6 bg-card border rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-20">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-muted-foreground">Ação Recomendada</p>
              <p className="font-bold">Atualizar estoque e preços dos itens vinculados</p>
            </div>
            <Button size="lg" className="w-full sm:w-auto px-12" onClick={handleImport} isLoading={importing}>
              Confirmar Importação <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {quickRegItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-xl flex items-center gap-2 text-primary">
                  <Sparkles size={20} /> Cadastrar Novo Produto
                </h3>
                <button 
                  onClick={() => setQuickRegItem(null)}
                  className="p-1 rounded-md text-muted-foreground hover:bg-muted"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nome do Produto"
                  value={quickRegItem.name}
                  onChange={(e) => setQuickRegItem({ ...quickRegItem, name: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Código de Barras"
                    value={quickRegItem.barcode}
                    onChange={(e) => setQuickRegItem({ ...quickRegItem, barcode: e.target.value })}
                  />
                  <Input
                    label="Categoria"
                    placeholder="Ex: Bebidas"
                    value={quickRegItem.category}
                    onChange={(e) => setQuickRegItem({ ...quickRegItem, category: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Custo Compra (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-10 text-sm"
                      value={quickRegItem.unitPrice}
                      onChange={(e) => handleQuickRegCostChange(Number(e.target.value || 0))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5">Margem Desejada (%)</label>
                    <Input
                      type="number"
                      className="h-10 text-sm"
                      value={quickRegItem.marginPercent}
                      onChange={(e) => handleQuickRegMarginChange(Number(e.target.value || 0))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-primary">Preço Venda (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-10 text-sm border-primary/50 text-primary font-bold focus-visible:ring-primary"
                      value={quickRegItem.sellingPrice}
                      onChange={(e) => setQuickRegItem({ ...quickRegItem, sellingPrice: Number(e.target.value || 0) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                  <div>
                    <label className="text-[10px] font-bold text-amber-700 block mb-1 uppercase">Lote</label>
                    <Input
                      placeholder="Lote"
                      className="h-9 text-xs"
                      value={quickRegItem.batch}
                      onChange={(e) => setQuickRegItem({ ...quickRegItem, batch: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-amber-700 block mb-1 uppercase flex justify-between">
                      <span>Validade</span>
                      {!quickRegItem.expiry && <span className="text-[8px] text-destructive font-normal uppercase">* requerido</span>}
                    </label>
                    <Input
                      type="date"
                      className={`h-9 text-xs ${!quickRegItem.expiry ? "border-destructive bg-destructive/5" : ""}`}
                      value={quickRegItem.expiry}
                      onChange={(e) => setQuickRegItem({ ...quickRegItem, expiry: e.target.value })}
                    />
                  </div>
                  <p className="col-span-3 text-[9px] text-amber-600 font-medium">
                    * Qtd. Lote pré-preenchida com {quickRegItem.quantity} un.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={() => setQuickRegItem(null)}>
                  Cancelar
                </Button>
                <Button 
                  disabled={!quickRegItem.name || !quickRegItem.expiry}
                  onClick={async () => {
                    const batches = quickRegItem.batch && quickRegItem.expiry ? [
                      {
                        batch_number: quickRegItem.batch,
                        expiry_date: quickRegItem.expiry,
                        quantity: Number(quickRegItem.quantity || 0)
                      }
                    ] : [];
                    
                    const success = await addProduct({
                      name: quickRegItem.name,
                      barcode: quickRegItem.barcode || null,
                      category: quickRegItem.category || null,
                      cost_price: quickRegItem.unitPrice,
                      selling_price: quickRegItem.sellingPrice,
                      margin_percent: quickRegItem.marginPercent,
                      payment_fees: 0,
                      fixed_costs: 0,
                      min_margin: 20,
                      current_stock: quickRegItem.quantity,
                      min_stock: 5,
                      batch_number: quickRegItem.batch || null,
                      expiry_date: quickRegItem.expiry || null,
                      batches: batches
                    } as any);

                    if (success) {
                      const updatedItems = [...items];
                      updatedItems[quickRegItem.itemIndex] = {
                        ...updatedItems[quickRegItem.itemIndex],
                        batch: quickRegItem.batch,
                        expiry: quickRegItem.expiry
                      };
                      setItems(updatedItems);
                      setQuickRegItem(null);
                    }
                  }}
                  className="px-6"
                >
                  Confirmar e Vincular
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
