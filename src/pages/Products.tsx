import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ProductForm } from '../components/ProductForm';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, Package, Edit2, Trash2, Barcode, AlertTriangle, LayoutGrid, List as ListIcon, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ProductInsert } from '../types/product';
import { CATEGORIAS_MINI_MERCADO } from '../types/pricing_config';

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

const sanitizeText = (str: string) => {
  return str.replace(/<[^>]*>/g, '');
};

const sanitizeImageUrl = (url?: string) => {
  if (!url) return undefined;
  const cleanUrl = url.trim();
  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('/') ||
    cleanUrl.startsWith('data:image/')
  ) {
    return cleanUrl;
  }
  return undefined;
};

export default function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

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
      description: `Tem certeza que deseja excluir "${sanitizeText(product.name)}"? O histórico de inventário relacionado a ele será mantido, mas ele não aparecerá mais no catálogo.`,
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
    
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (barcodeNormalized && barcodeNormalized.includes(searchNormalized));
           
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'low_stock') {
      matchesStatus = p.current_stock <= (p.min_stock || 0);
    } else if (statusFilter === 'expiring' || statusFilter === 'expired') {
      const expiry = getExpiryAlertDetails(p);
      if (statusFilter === 'expired') {
        matchesStatus = !!expiry?.isExpired;
      } else {
        matchesStatus = !!expiry?.isCritical && !expiry?.isExpired;
      }
    } else if (statusFilter === 'no_cost') {
      matchesStatus = p.cost_price === 0 || !p.cost_price;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    
    if (sortBy === 'category_asc') return (a.category || '').localeCompare(b.category || '');
    if (sortBy === 'category_desc') return (b.category || '').localeCompare(a.category || '');
    
    if (sortBy === 'cost_asc') return (a.cost_price || 0) - (b.cost_price || 0);
    if (sortBy === 'cost_desc') return (b.cost_price || 0) - (a.cost_price || 0);

    const priceA = a.practiced_price || a.selling_price || 0;
    const priceB = b.practiced_price || b.selling_price || 0;
    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    
    if (sortBy === 'stock_asc') return (a.current_stock || 0) - (b.current_stock || 0);
    if (sortBy === 'stock_desc') return (b.current_stock || 0) - (a.current_stock || 0);
    
    if (sortBy === 'expiry_asc' || sortBy === 'expiry_desc') {
      const getExpiry = (p: any) => {
        const nextBatch = p.product_batches?.[0];
        const dateStr = nextBatch?.expiry_date || p.expiry_date;
        return dateStr ? new Date(dateStr).getTime() : Infinity;
      };
      const expA = getExpiry(a);
      const expB = getExpiry(b);
      return sortBy === 'expiry_asc' ? expA - expB : expB - expA;
    }
    
    return 0;
  });

  const toggleSort = (field: string) => {
    if (sortBy === `${field}_asc`) {
      setSortBy(`${field}_desc`);
    } else {
      setSortBy(`${field}_asc`);
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy === `${field}_asc`) return <ArrowUp size={14} className="inline-block ml-1 text-primary" />;
    if (sortBy === `${field}_desc`) return <ArrowDown size={14} className="inline-block ml-1 text-primary" />;
    return <ArrowUpDown size={14} className="inline-block ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />;
  };

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
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-1 border border-border/50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-sm transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              title="Visão em Planilha"
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-sm transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              title="Visão em Grade"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou código de barras..." 
            className="pl-10 pr-10 bg-card shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={() => setShowScanner(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
          >
            <Barcode size={18} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-muted-foreground w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <ArrowUpDown size={16} />
              <span className="text-sm font-medium">Ordenar</span>
            </div>
          </div>
          
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="flex-1 min-w-[150px] h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          >
            <option value="">Todas as Categorias</option>
            {CATEGORIAS_MINI_MERCADO.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="OUTROS">OUTROS</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex-1 min-w-[150px] h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          >
            <option value="all">Todos os Status</option>
            <option value="low_stock">Estoque Baixo/Zerado</option>
            <option value="expiring">Validade Crítica</option>
            <option value="expired">Vencidos</option>
            <option value="no_cost">Sem Custo (R$ 0)</option>
          </select>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

          <div className="items-center gap-2 text-muted-foreground ml-1 hidden sm:flex">
            <ArrowUpDown size={16} />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="flex-1 min-w-[150px] h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          >
            <option value="name_asc">Nome (A-Z)</option>
            <option value="name_desc">Nome (Z-A)</option>
            <option value="category_asc">Categoria (A-Z)</option>
            <option value="category_desc">Categoria (Z-A)</option>
            <option value="price_asc">Menor Preço</option>
            <option value="price_desc">Maior Preço</option>
            <option value="stock_asc">Menor Estoque</option>
            <option value="stock_desc">Maior Estoque</option>
            <option value="expiry_asc">Validade (Mais próxima)</option>
            <option value="expiry_desc">Validade (Mais distante)</option>
          </select>
        </div>
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
      ) : viewMode === 'grid' ? (
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
                    {sanitizeImageUrl(product.image_url) ? (
                      <img src={sanitizeImageUrl(product.image_url)} alt={product.name} className="h-full w-full object-cover" />
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
      ) : (
        <Card className="overflow-hidden border border-border/50 shadow-sm animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('name')}>
                    Produto {renderSortIcon('name')}
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('category')}>
                    Categoria {renderSortIcon('category')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-right cursor-pointer group hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('cost')}>
                    Custo {renderSortIcon('cost')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-right cursor-pointer group hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('price')}>
                    Preço Venda {renderSortIcon('price')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-right cursor-pointer group hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('stock')}>
                    Estoque {renderSortIcon('stock')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-center cursor-pointer group hover:bg-muted/50 transition-colors select-none" onClick={() => toggleSort('expiry')}>
                    Validade {renderSortIcon('expiry')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProducts.map((product) => {
                  const expiryAlert = getExpiryAlertDetails(product);
                  const isLowStock = product.current_stock <= (product.min_stock || 0);
                  
                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 font-bold flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                          {sanitizeImageUrl(product.image_url) ? (
                            <img src={sanitizeImageUrl(product.image_url)!} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="text-muted-foreground" size={14} />
                          )}
                        </div>
                        <span className="truncate max-w-[200px]">{product.name}</span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {product.category || '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        R$ {product.cost_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-primary">
                        R$ {product.practiced_price?.toFixed(2) || product.selling_price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${isLowStock ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-muted text-muted-foreground'}`}>
                          {product.current_stock || 0}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {expiryAlert ? (
                          <span title={expiryAlert.text} className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${expiryAlert.colorClass}`}>
                            {expiryAlert.isExpired ? <AlertTriangle size={12} className="mr-1" /> : null}
                            {expiryAlert.text}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditingProduct(product)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => confirmDelete(product)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
