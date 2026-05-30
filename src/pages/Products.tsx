import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ProductForm } from '../components/ProductForm';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, Package, Edit2, Trash2, Barcode, AlertTriangle } from 'lucide-react';
import type { ProductInsert } from '../types/product';

const getExpiryAlertDetails = (product: any) => {
  const nextBatch = product.product_batches?.[0];
  const expiryDateStr = nextBatch?.expiry_date || product.expiry_date;
  const batchNumber = nextBatch?.batch_number || product.batch_number;

  if (!expiryDateStr) return null;

  const expiryDate = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let colorClass = "";
  let text = "";
  let isCritical = false;
  let isExpired = false;

  if (diffDays < 0) {
    colorClass = "bg-destructive/10 text-destructive border-destructive/20";
    text = `Vencido há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`;
    isExpired = true;
    isCritical = true;
  } else if (diffDays === 0) {
    colorClass = "bg-destructive/10 text-destructive border-destructive/20 animate-pulse";
    text = "Vence hoje!";
    isExpired = true;
    isCritical = true;
  } else if (diffDays <= 7) {
    colorClass = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    text = `Vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    isCritical = true;
  } else if (diffDays <= 30) {
    colorClass = "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    text = `Vence em ${diffDays} dias`;
  } else {
    colorClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    text = `Vence em ${diffDays} dias`;
  }

  return {
    text,
    colorClass,
    batchNumber,
    isCritical,
    isExpired,
    expiryDate: expiryDate.toLocaleDateString('pt-BR')
  };
};

export default function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'success' | 'warning' | 'info';
    actionLabel?: string;
    onAction?: () => void;
  }>({ isOpen: false, title: '', description: '', variant: 'info' });

  const handleAddProduct = async (data: ProductInsert) => {
    setSubmitting(true);
    const result = await addProduct(data);
    if (result) setIsAdding(false);
    setSubmitting(false);
  };

  const handleUpdateProduct = async (data: ProductInsert) => {
    if (!editingProduct) return;
    setSubmitting(true);
    const result = await updateProduct(editingProduct.id, data);
    if (result) setEditingProduct(null);
    setSubmitting(false);
  };

  const confirmDelete = (product: any) => {
    setModal({
      isOpen: true,
      variant: 'danger',
      title: 'Excluir Produto?',
      description: `Tem certeza que deseja excluir "${product.name}"? O histórico de inventário relacionado a ele será mantido, mas ele não aparecerá mais no catálogo.`,
      actionLabel: 'Excluir',
      onAction: () => deleteProduct(product.id),
    });
  };

  if (isAdding || editingProduct) {
    return (
      <ProductForm 
        initialData={editingProduct}
        onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
        onCancel={() => {
          setIsAdding(false);
          setEditingProduct(null);
        }}
        loading={submitting}
      />
    );
  }

  const filteredProducts = products.filter(p => {
    const searchNormalized = searchTerm.trim().replace(/^0+/, '');
    const barcodeNormalized = String(p.barcode || '').trim().replace(/^0+/, '');
    
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (barcodeNormalized && barcodeNormalized.includes(searchNormalized));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal(p => ({ ...p, isOpen: false }))}
        title={modal.title}
        description={modal.description}
        variant={modal.variant}
        actionLabel={modal.actionLabel}
        onAction={modal.onAction}
      />

      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => {
            setSearchTerm(code);
            setShowScanner(false);
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome ou código de barras..." 
          className="pl-10 pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={() => setShowScanner(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
        >
          <Barcode size={18} />
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed bg-muted/20">
          <div className="p-4 rounded-full bg-muted">
            <Package size={48} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-xl">Nenhum produto encontrado</p>
            <p className="text-muted-foreground">Comece adicionando seu primeiro item ao catálogo.</p>
          </div>
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Agora
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const expiryAlert = getExpiryAlertDetails(product);
            let cardStyle = "group hover:border-primary/50 transition-all duration-300 relative overflow-hidden";
            if (expiryAlert?.isExpired) {
              cardStyle = "group border-destructive/50 bg-destructive/5 shadow-sm shadow-destructive/5 hover:border-destructive transition-all duration-300 relative overflow-hidden";
            } else if (expiryAlert?.isCritical) {
              cardStyle = "group border-amber-500/50 bg-amber-500/5 shadow-sm shadow-amber-500/5 hover:border-amber-500 transition-all duration-300 relative overflow-hidden";
            }
            
            return (
              <Card key={product.id} className={cardStyle}>
                <div className="p-4 flex gap-4">
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg truncate flex items-center gap-1">
                        {product.name}
                        {expiryAlert?.isExpired && (
                          <span title="Produto vencido!" className="shrink-0 flex">
                            <AlertTriangle className="text-destructive shrink-0 animate-pulse" size={16} />
                          </span>
                        )}
                        {!expiryAlert?.isExpired && expiryAlert?.isCritical && (
                          <span title="Validade curta!" className="shrink-0 flex">
                            <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">{product.category || 'Sem categoria'}</p>
                      <div className="mt-1 flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-primary">
                            R$ {product.selling_price?.toFixed(2) || '0,00'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Custo: R$ {product.cost_price.toFixed(2)}
                          </span>
                        </div>
                        {product.market_price && product.market_price > 0 && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                              Mercado: R$ {product.market_price.toFixed(2)}
                            </span>
                            {product.selling_price && (() => {
                              const diff = product.selling_price - product.market_price;
                              if (diff < 0) {
                                return (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/10 shrink-0">
                                    -{Math.abs(diff / product.market_price * 100).toFixed(0)}% vs Mercado
                                  </span>
                                );
                              } else if (diff > 0) {
                                return (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-destructive/10 text-destructive rounded-md border border-destructive/10 shrink-0">
                                    +{Math.abs(diff / product.market_price * 100).toFixed(0)}% vs Mercado
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-muted text-muted-foreground rounded-md border shrink-0">
                                    Igual
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    {expiryAlert && (
                      <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border w-fit ${expiryAlert.colorClass}`}>
                        <span>Lote: {expiryAlert.batchNumber || 'N/I'} • {expiryAlert.text}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => confirmDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
