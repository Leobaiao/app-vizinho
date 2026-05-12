import { useState, useEffect } from 'react';
import { useInventorySessions } from '../hooks/useInventorySessions';
import { useProducts } from '../hooks/useProducts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Modal } from '../components/ui/Modal';
import { 
  Barcode, 
  History, 
  CheckCircle2, 
  PackageSearch, 
  X, 
  Play, 
  Flag, 
  Download, 
  Settings2,
  ArrowLeft
} from 'lucide-react';
import type { InventorySessionItem } from '../types/inventory_session';

export default function Inventory() {
  const { 
    activeSession, 
    sessions, 
    startSession, 
    finalizeSession, 
    addSessionItem, 
    getSessionItems,
    loading: sessionsLoading 
  } = useInventorySessions();
  
  const { products, updateProduct, loading: productsLoading } = useProducts();
  
  const [showScanner, setShowScanner] = useState(false);
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [currentItems, setCurrentItems] = useState<InventorySessionItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'success' | 'warning' | 'info';
    actionLabel?: string;
    onAction?: () => void;
  }>({ isOpen: false, title: '', description: '', variant: 'info' });

  // Carregar itens da sessão ativa ao iniciar
  useEffect(() => {
    if (activeSession) {
      loadSessionItems(activeSession.id);
    } else {
      setCurrentItems([]);
    }
  }, [activeSession]);

  const loadSessionItems = async (sessionId: string) => {
    const items = await getSessionItems(sessionId);
    setCurrentItems(items);
  };

  const handleScan = async (code: string) => {
    if (isProcessing || !activeSession) return;
    
    const cleanScannedCode = String(code).trim().replace(/^0+/, '');
    const product = products.find(p => String(p.barcode || '').trim().replace(/^0+/, '') === cleanScannedCode);
    
    if (product) {
      setIsProcessing(true);
      try {
        const success = await addSessionItem(
          activeSession.id, 
          product.id, 
          1, 
          product.current_stock || 0
        );
        
        if (success) {
          setLastScanned({ ...product, timestamp: new Date().toLocaleTimeString() });
          await loadSessionItems(activeSession.id);
        }
      } finally {
        setIsProcessing(false);
      }
    } else {
      setModal({
        isOpen: true,
        variant: 'warning',
        title: 'Produto Não Encontrado',
        description: `Código: ${code}. Cadastre este produto antes de contar.`,
      });
    }
  };

  const handleFinalize = async () => {
    if (!activeSession) return;
    
    setModal({
      isOpen: true,
      variant: 'warning',
      title: 'Finalizar Contagem?',
      description: 'Isso encerrará o processo de leitura e gerará o relatório de divergências.',
      actionLabel: 'Finalizar',
      onAction: async () => {
        await finalizeSession(activeSession.id);
        setSelectedSession({ ...activeSession, status: 'completed' });
      }
    });
  };

  const handleAdjustStock = async (session: any) => {
    const items = await getSessionItems(session.id);
    const discrepancies = items.filter((i: any) => i.counted_quantity !== i.expected_quantity);
    
    if (discrepancies.length === 0) {
      setModal({
        isOpen: true,
        variant: 'success',
        title: 'Estoque em Dia',
        description: 'Não há divergências para ajustar nesta sessão.',
      });
      return;
    }

    setModal({
      isOpen: true,
      variant: 'danger',
      title: 'Ajustar Estoque?',
      description: `Deseja atualizar o estoque de ${discrepancies.length} produtos para as quantidades contadas? Esta ação não pode ser desfeita.`,
      actionLabel: 'Confirmar Ajuste',
      onAction: async () => {
        setIsProcessing(true);
        for (const item of discrepancies) {
          await updateProduct(item.product_id, { current_stock: item.counted_quantity });
        }
        setIsProcessing(false);
        setModal({
          isOpen: true,
          variant: 'success',
          title: 'Estoque Atualizado',
          description: 'As quantidades foram sincronizadas com sucesso.',
        });
        setSelectedSession(null);
      }
    });
  };

  const exportToCSV = async (session: any) => {
    const items = await getSessionItems(session.id);
    const reportData = items.map((item: any) => {
      const product = products.find(p => p.id === item.product_id);
      return {
        Produto: product?.name || 'Desconhecido',
        Barras: product?.barcode || '',
        Esperado: item.expected_quantity,
        Contado: item.counted_quantity,
        Diferenca: item.counted_quantity - item.expected_quantity
      };
    });

    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map((row: any) => Object.values(row).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_${session.created_at.split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (sessionsLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Visualização de Detalhes da Sessão (Relatório de Divergências)
  if (selectedSession) {
    return (
      <SessionDetails 
        session={selectedSession} 
        products={products}
        onClose={() => setSelectedSession(null)}
        onAdjust={() => handleAdjustStock(selectedSession)}
        onExport={() => exportToCSV(selectedSession)}
        getItems={getSessionItems}
      />
    );
  }

  // Visualização do Histórico
  if (showHistory) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
        </div>

        <div className="space-y-4">
          {sessions.filter(s => s.status === 'completed').map(session => (
            <Card key={session.id} className="p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedSession(session)}>
              <div>
                <p className="font-bold">Contagem #{session.id.slice(0, 5)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(session.created_at).toLocaleDateString()} às {new Date(session.created_at).toLocaleTimeString()}
                </p>
              </div>
              <Button variant="outline" size="sm">Ver Relatório</Button>
            </Card>
          ))}
          {sessions.filter(s => s.status === 'completed').length === 0 && (
            <div className="text-center py-10 text-muted-foreground">Nenhuma contagem finalizada ainda.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal(p => ({ ...p, isOpen: false }))}
        title={modal.title}
        description={modal.description}
        variant={modal.variant}
        actionLabel={modal.actionLabel}
        onAction={modal.onAction}
      />

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
          <p className="text-muted-foreground">
            {activeSession ? 'Sessão em andamento...' : 'Inicie uma contagem para conferir o estoque.'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)}>
          <History className="h-5 w-5" />
        </Button>
      </div>

      {!activeSession ? (
        <button 
          onClick={startSession}
          className="w-full aspect-[2/1] rounded-3xl bg-primary text-primary-foreground flex flex-col items-center justify-center gap-4 shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          <div className="p-5 rounded-full bg-white/20">
            <Play size={48} fill="currentColor" />
          </div>
          <span className="text-2xl font-black uppercase tracking-wider">Iniciar Contagem</span>
        </button>
      ) : (
        <div className="space-y-6">
          {showScanner ? (
            <div className="relative">
              <BarcodeScanner onScan={handleScan} inline={true} />
              <Button 
                variant="outline" 
                className="w-full absolute -bottom-4 z-10 mx-auto left-0 right-0 max-w-[200px] shadow-lg bg-card"
                onClick={() => setShowScanner(false)}
              >
                <X className="mr-2 h-4 w-4" /> Fechar Câmera
              </Button>
            </div>
          ) : (
            <button 
              onClick={() => setShowScanner(true)}
              className="w-full h-32 rounded-3xl border-2 border-dashed border-primary/50 text-primary flex items-center justify-center gap-4 hover:bg-primary/5 transition-colors"
            >
              <Barcode size={32} />
              <span className="text-xl font-bold">Bipar Produto</span>
            </button>
          )}

          {/* Feedback do último item lido */}
          {lastScanned && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top duration-300">
              <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Registrado</p>
                <p className="font-bold">{lastScanned.name}</p>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{lastScanned.timestamp}</p>
            </div>
          )}

          {/* Lista de Itens Contados */}
          <div className="space-y-4">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <PackageSearch className="text-muted-foreground" size={20} />
              Itens na Sessão ({currentItems.length})
            </h2>
            
            <div className="grid gap-3">
              {currentItems.slice(0, 3).map((item: any) => {
                const product = products.find(p => p.id === item.product_id);
                return (
                  <Card key={item.id} className="p-3 flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                        <Barcode size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate max-w-[150px]">{product?.name}</p>
                        <p className="text-[10px] text-muted-foreground">Sistema: {item.expected_quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{item.counted_quantity}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Lido</p>
                    </div>
                  </Card>
                );
              })}
              {currentItems.length > 3 && (
                <p className="text-center text-xs text-muted-foreground font-medium">
                  + {currentItems.length - 3} outros itens...
                </p>
              )}
            </div>

            <Button className="w-full h-14 text-lg font-bold rounded-2xl" variant="primary" onClick={handleFinalize}>
              <Flag className="mr-2 h-5 w-5" /> Finalizar e Comparar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente para Detalhes da Sessão / Relatório
function SessionDetails({ session, products, onClose, onAdjust, onExport, getItems }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [session.id]);

  const loadItems = async () => {
    const data = await getItems(session.id);
    setItems(data);
    setLoading(false);
  };

  const discrepancies = items.filter(i => i.counted_quantity !== i.expected_quantity);

  if (loading) return <div className="p-10 text-center">Carregando relatório...</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">Relatório de Contagem</h2>
        <div className="w-10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-primary/5 border-primary/10">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Itens</p>
          <p className="text-2xl font-black">{items.length}</p>
        </Card>
        <Card className={`p-4 ${discrepancies.length > 0 ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Divergências</p>
          <p className={`text-2xl font-black ${discrepancies.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {discrepancies.length}
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Detalhes por Produto</h3>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" /> Exportar
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const product = products.find((p: any) => p.id === item.product_id);
            const diff = item.counted_quantity - item.expected_quantity;
            
            return (
              <Card key={item.id} className={`p-4 ${diff !== 0 ? 'border-l-4 border-amber-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{product?.name}</p>
                    <p className="text-xs text-muted-foreground">Sistema: {item.expected_quantity} | Contado: {item.counted_quantity}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-lg font-black ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Diferença</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-24 left-6 right-6 flex gap-3 z-10">
        <Button variant="outline" className="flex-1 h-12 bg-background/80 backdrop-blur-sm" onClick={onClose}>Fechar</Button>
        <Button className="flex-[2] h-12 bg-amber-600 hover:bg-amber-700 shadow-lg" onClick={onAdjust}>
          <Settings2 className="mr-2 h-4 w-4" /> Ajustar Estoque
        </Button>
      </div>
    </div>
  );
}

