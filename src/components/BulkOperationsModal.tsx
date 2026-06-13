import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, FileJson, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Product } from '../types/product';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProcess: (updates: any[], creates: any[]) => Promise<boolean>;
}

export function BulkOperationsModal({ isOpen, onClose, products, onProcess }: BulkOperationsModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState<{
    total: number;
    updates: any[];
    creates: any[];
    errors: { line: number; reason: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: 'xlsx' | 'csv') => {
    const data = products.map(p => ({
      ID: p.id,
      Nome: p.name,
      Categoria: p.category || '',
      Custo: p.cost_price || 0,
      'Preço de Venda': p.selling_price || 0,
      'Estoque Atual': p.current_stock || 0,
      'Estoque Mínimo': p.min_stock || 0,
      'Código de Barras': p.barcode || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

    if (format === 'xlsx') {
      XLSX.writeFile(wb, 'estoque_vizinho.xlsx');
    } else {
      XLSX.writeFile(wb, 'estoque_vizinho.csv');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setProcessing(true);
    setReport(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData = XLSX.utils.sheet_to_json<any>(ws);

        const updates: any[] = [];
        const creates: any[] = [];
        const errors: { line: number; reason: string }[] = [];

        jsonData.forEach((row, index) => {
          const line = index + 2; // +1 for header, +1 for 0-index

          const id = row['ID'] || row['id'];
          const nome = row['Nome'] || row['nome'];
          
          let custo = parseFloat(String(row['Custo'] || row['custo']).replace(',', '.'));
          let preco = parseFloat(String(row['Preço de Venda'] || row['preco'] || row['preço']).replace(',', '.'));
          let estoque = parseInt(String(row['Estoque Atual'] || row['estoque']).replace(',', '.'), 10);
          let estoqueMin = parseInt(String(row['Estoque Mínimo'] || row['estoque_minimo'] || 0).replace(',', '.'), 10);
          
          if (isNaN(custo)) custo = 0;
          if (isNaN(preco)) preco = 0;
          if (isNaN(estoque)) estoque = 0;
          if (isNaN(estoqueMin)) estoqueMin = 0;

          if (id) {
            // Update
            const existing = products.find(p => p.id === id);
            if (!existing) {
              errors.push({ line, reason: `ID '${id}' não encontrado no sistema.` });
            } else {
              updates.push({
                id,
                cost_price: custo,
                selling_price: preco,
                current_stock: estoque,
                min_stock: estoqueMin
              });
            }
          } else {
            // Create
            if (!nome) {
              errors.push({ line, reason: 'Nome é obrigatório para novos produtos.' });
            } else {
              creates.push({
                name: nome,
                category: row['Categoria'] || row['categoria'] || 'OUTROS',
                cost_price: custo,
                selling_price: preco,
                current_stock: estoque,
                min_stock: estoqueMin,
                barcode: row['Código de Barras'] || row['codigo_barras'] || '',
                image_url: '',
              });
            }
          }
        });

        setReport({
          total: jsonData.length,
          updates,
          creates,
          errors
        });
      } catch (err: any) {
        setReport({
          total: 0,
          updates: [],
          creates: [],
          errors: [{ line: 0, reason: `Erro ao processar arquivo: ${err.message}` }]
        });
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleConfirmImport = async () => {
    if (!report) return;
    setProcessing(true);
    const success = await onProcess(report.updates, report.creates);
    setProcessing(false);
    if (success) {
      onClose();
    }
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
              className="w-full max-w-3xl bg-card rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-border flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Planilhas em Massa</h2>
                    <p className="text-sm text-muted-foreground">Exporte ou importe múltiplos produtos de uma vez</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex border-b border-border shrink-0">
                <button
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'export' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                  onClick={() => { setActiveTab('export'); setReport(null); }}
                >
                  Exportar
                </button>
                <button
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'import' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                  onClick={() => { setActiveTab('import'); setReport(null); }}
                >
                  Importar
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {activeTab === 'export' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-muted/30 rounded-xl border border-border">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Info size={16} className="text-primary" />
                        Como funciona a exportação?
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Baixe o seu catálogo atual em formato Excel (.xlsx) ou CSV. Você pode usar este arquivo para fazer backup, ou editá-lo no seu computador para atualizar preços e estoque rapidamente e importar de volta no aplicativo.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5" onClick={() => handleExport('xlsx')}>
                        <FileSpreadsheet size={24} className="text-emerald-500" />
                        <span>Exportar Excel (.xlsx)</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5" onClick={() => handleExport('csv')}>
                        <FileJson size={24} className="text-primary" />
                        <span>Exportar CSV (.csv)</span>
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'import' && (
                  <div className="space-y-6">
                    {!report && (
                      <>
                        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                          <h4 className="font-semibold text-amber-700 dark:text-amber-500 mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Atenção
                          </h4>
                          <ul className="text-sm text-amber-700/80 dark:text-amber-500/80 space-y-1 list-disc list-inside">
                            <li>Para produtos existentes (com ID), apenas Preço e Estoque serão atualizados.</li>
                            <li>Linhas sem ID criarão novos produtos no sistema.</li>
                            <li>Certifique-se de manter o cabeçalho original.</li>
                          </ul>
                        </div>

                        <div 
                          className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="p-4 bg-muted rounded-full text-muted-foreground">
                            <Upload size={32} />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">Clique para selecionar o arquivo</p>
                            <p className="text-sm text-muted-foreground mt-1">Suporta .xlsx e .csv</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".xlsx, .csv" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                          />
                        </div>
                      </>
                    )}

                    {processing && !report && (
                      <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-muted-foreground font-medium">Processando arquivo...</p>
                      </div>
                    )}

                    {report && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-muted/30 rounded-xl border border-border flex flex-col items-center text-center">
                            <span className="text-3xl font-bold">{report.total}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Linhas Lidas</span>
                          </div>
                          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col items-center text-center">
                            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{report.updates.length + report.creates.length}</span>
                            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mt-1 font-semibold">Prontos</span>
                          </div>
                          <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 flex flex-col items-center text-center">
                            <span className="text-3xl font-bold text-destructive">{report.errors.length}</span>
                            <span className="text-xs text-destructive/80 uppercase tracking-wider mt-1 font-semibold">Erros</span>
                          </div>
                        </div>

                        {report.updates.length > 0 && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong className="text-foreground">{report.updates.length}</strong> produtos existentes serão atualizados (preço/estoque).</span>
                          </div>
                        )}

                        {report.creates.length > 0 && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong className="text-foreground">{report.creates.length}</strong> novos produtos serão criados no sistema.</span>
                          </div>
                        )}

                        {report.errors.length > 0 && (
                          <div className="bg-destructive/5 border border-destructive/20 rounded-xl overflow-hidden">
                            <div className="p-3 bg-destructive/10 border-b border-destructive/20 font-semibold text-destructive text-sm flex items-center gap-2">
                              <AlertTriangle size={16} />
                              Relatório de Erros (Estas linhas serão ignoradas)
                            </div>
                            <div className="max-h-40 overflow-y-auto p-2">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="text-muted-foreground">
                                    <th className="p-2 font-medium w-16">Linha</th>
                                    <th className="p-2 font-medium">Motivo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.errors.map((err, i) => (
                                    <tr key={i} className="border-t border-destructive/10">
                                      <td className="p-2 font-mono text-destructive/80">#{err.line}</td>
                                      <td className="p-2 text-destructive/90">{err.reason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                          <Button variant="ghost" onClick={() => { setReport(null); }} disabled={processing}>
                            Cancelar
                          </Button>
                          <Button 
                            variant="primary" 
                            onClick={handleConfirmImport} 
                            disabled={processing || (report.updates.length === 0 && report.creates.length === 0)}
                          >
                            {processing ? 'Salvando...' : 'Confirmar Importação'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
