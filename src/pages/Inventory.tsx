import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Barcode, History, AlertTriangle, CheckCircle2, PackageSearch, X } from 'lucide-react';

export default function Inventory() {
  const { counts, addCount, loading: countsLoading } = useInventory();
  const { products, loading: productsLoading } = useProducts();
  const [showScanner, setShowScanner] = useState(false);
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  const handleScan = async (code: string) => {
    // Fechar o scanner imediatamente após ler qualquer coisa para a tela não ficar preta
    setShowScanner(false);
    
    // Normalizar removendo espaços e ZEROS à esquerda (Resolve confusão entre UPC-A de 12 dígitos e EAN-13 de 13 dígitos)
    const cleanScannedCode = String(code).trim().replace(/^0+/, '');
    const product = products.find(p => String(p.barcode || '').trim().replace(/^0+/, '') === cleanScannedCode);
    
    if (product) {
      const newCount = await addCount({
        product_id: product.id,
        counted_quantity: 1,
        expected_quantity: product.current_stock, // Salvar o que o sistema achava na hora
      });
      
      if (newCount) {
        setLastScanned({ ...product, timestamp: new Date().toLocaleTimeString() });
      }
    } else {
      alert(`Produto com código ${String(code).trim()} não encontrado no sistema! Verifique se foi cadastrado com este exato código.`);
    }
  };

  // Agrupar contagens para o relatório
  const getDiscrepancyReport = () => {
    const report: Record<string, { product: any, counted: number, expected: number }> = {};
    
    counts.forEach(c => {
      if (!report[c.product_id]) {
        const product = products.find(p => p.id === c.product_id);
        report[c.product_id] = { 
          product, 
          counted: 0, 
          expected: product?.current_stock || 0 
        };
      }
      report[c.product_id].counted += c.counted_quantity;
    });

    return Object.values(report).filter(item => item.counted !== item.expected);
  };

  const discrepancies = getDiscrepancyReport();

  if (countsLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Divergências</h1>
          <Button variant="ghost" onClick={() => setShowReport(false)}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </div>

        {discrepancies.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
            <p className="text-xl font-bold">Tudo Certo!</p>
            <p className="text-muted-foreground">Não foram encontradas diferenças entre o estoque contado e o sistema.</p>
            <Button onClick={() => setShowReport(false)}>Voltar para Contagem</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {discrepancies.map((item) => (
              <Card key={item.product?.id} className="p-4 border-l-4 border-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">{item.product?.name}</h4>
                    <p className="text-sm text-muted-foreground">Esperado: {item.expected} | Contado: {item.counted}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${item.counted > item.expected ? 'text-emerald-600' : 'text-destructive'}`}>
                      {item.counted > item.expected ? '+' : ''}{item.counted - item.expected}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Diferença</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Estoque e Contagem</h1>
        <p className="text-muted-foreground">Bipe os produtos na prateleira para atualizar o inventário.</p>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Botão de Ação Principal */}
      <button 
        onClick={() => setShowScanner(true)}
        className="w-full aspect-[2/1] rounded-3xl bg-primary text-primary-foreground flex flex-col items-center justify-center gap-4 shadow-xl shadow-primary/20 active:scale-95 transition-all"
      >
        <div className="p-5 rounded-full bg-white/20">
          <Barcode size={48} />
        </div>
        <span className="text-2xl font-black uppercase tracking-wider">Bipar Produto</span>
      </button>

      {/* Feedback do último item lido */}
      {lastScanned && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top duration-300">
          <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <CheckCircle2 />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Contado com sucesso</p>
            <p className="font-bold text-lg">{lastScanned.name}</p>
          </div>
          <p className="text-sm font-medium text-muted-foreground">{lastScanned.timestamp}</p>
        </div>
      )}

      {/* Listagem de Contagens Recentes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History size={20} className="text-muted-foreground" />
          <h2 className="font-bold text-xl">Últimos Bips</h2>
        </div>

        {counts.length === 0 ? (
          <Card className="p-8 text-center space-y-2 border-dashed bg-muted/20">
            <PackageSearch className="mx-auto text-muted-foreground opacity-50" size={40} />
            <p className="text-muted-foreground font-medium">Nenhuma contagem realizada hoje.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {counts.slice(0, 5).map((count) => {
              const product = products.find(p => p.id === count.product_id);
              return (
                <Card key={count.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Barcode size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold">{product?.name || 'Produto Desconhecido'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(count.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">+{count.counted_quantity}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Unidade</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Alerta de Divergência Interativo */}
      <Card 
        onClick={() => setShowReport(true)}
        className={`p-6 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
          discrepancies.length > 0 
            ? 'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5' 
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}
      >
        <div className="flex gap-4">
          <div className={`p-2 h-fit rounded-lg ${discrepancies.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'} text-white`}>
            {discrepancies.length > 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold ${discrepancies.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              Relatório de Diferenças
            </h4>
            <p className={`text-sm leading-relaxed ${discrepancies.length > 0 ? 'text-amber-600/80' : 'text-emerald-600/80'}`}>
              {discrepancies.length > 0 
                ? `O sistema detectou ${discrepancies.length} divergências. Clique para ver os detalhes.`
                : 'Nenhuma divergência detectada entre o estoque contado e o sistema.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
