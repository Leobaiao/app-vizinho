import { useState } from 'react';
import { parseNFeXML, type NFeItem } from '../utils/xmlParser';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FileUp, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function History() {
  const { products, updateProduct } = useProducts();
  const [items, setItems] = useState<NFeItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

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
    // Lógica para atualizar o estoque e preços dos produtos encontrados
    for (const item of items) {
      const existingProduct = products.find(p => String(p.barcode || '').trim().replace(/^0+/, '') === String(item.barcode || '').trim().replace(/^0+/, ''));
      if (existingProduct && item.barcode) {
        // Atualiza estoque somando o que chegou na nota
        await updateProduct(existingProduct.id, {
          current_stock: existingProduct.current_stock + item.quantity,
          cost_price: item.unitPrice, // Atualiza para o custo mais recente
        });
      }
    }
    setImporting(false);
    alert('Importação concluída! O estoque e os preços de custo foram atualizados.');
    setStep('upload');
    setItems([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
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
                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-700">
                          <AlertCircle size={12} />
                          <span>Produto não cadastrado ou sem código de barras</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-bold text-sm">Qtd: {item.quantity}</p>
                      <p className="text-xs text-muted-foreground">R$ {item.unitPrice.toFixed(2)}/un</p>
                    </div>
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
    </div>
  );
}
