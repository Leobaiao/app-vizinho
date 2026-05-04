import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ProductForm } from '../components/ProductForm';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Plus, Search, Package, Edit2, Trash2, Barcode } from 'lucide-react';
import type { ProductInsert } from '../types/product';

export default function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

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

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteProduct(id);
    }
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:border-primary/50 transition-colors">
              <div className="p-4 flex gap-4">
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg truncate">{product.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{product.category || 'Sem categoria'}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">
                      R$ {product.selling_price?.toFixed(2) || '0,00'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Custo: R$ {product.cost_price.toFixed(2)}
                    </span>
                  </div>
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
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
