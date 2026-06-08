import { useState, useEffect } from 'react';
import { usePricingConfig } from '../hooks/usePricingConfig';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { CATALOGO_BASE, DEFAULT_PRICING_CONFIG, getDefaultMarginForCategory } from '../utils/pricingDefaults';
import { calcFatorMarkup, calculateMarkupPrice } from '../utils/pricing';
import type { PricingConfig, CustoFixo } from '../types/pricing_config';
import { CATEGORIAS_MINI_MERCADO } from '../types/pricing_config';
import { 
  Settings, 
  CreditCard, 
  Building, 
  Percent, 
  Save, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Info, 
  Check,
  AlertTriangle,
  Calculator,
  Package,
  X,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingConfig() {
  const { config, loading, saving, saveConfig, resetToDefaults } = usePricingConfig();
  const { products, addProduct } = useProducts();
  const { user } = useAuth();
  // Local form state (copy of config for editing)
  const [form, setForm] = useState<PricingConfig>(config);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    taxas: true,
    custos: false,
    margens: true,
  });
  const [importModal, setImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; skipped: number } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetModal, setResetModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      setForm(config);
    }
  }, [config, loading]);

  useEffect(() => {
    setHasChanges(JSON.stringify(form) !== JSON.stringify(config));
  }, [form, config]);

  // Derived calculations in real time
  const taxaPonderada = (
    (form.taxa_credito_pct * form.mix_credito_pct) +
    (form.taxa_debito_pct * form.mix_debito_pct)
  ) / 100;

  const totalCustosFixos = form.custos_fixos.reduce((s, c) => s + c.valor, 0);

  const pctCF = form.faturamento_estimado_rs > 0
    ? (totalCustosFixos / form.faturamento_estimado_rs) * 100
    : 0;

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = <K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateCustoFixo = (index: number, field: keyof CustoFixo, value: string | number) => {
    const updated = [...form.custos_fixos];
    updated[index] = { ...updated[index], [field]: value };
    setForm(prev => ({ ...prev, custos_fixos: updated }));
  };

  const addCustoFixo = () => {
    setForm(prev => ({
      ...prev,
      custos_fixos: [...prev.custos_fixos, { nome: '', valor: 0 }]
    }));
  };

  const removeCustoFixo = (index: number) => {
    setForm(prev => ({
      ...prev,
      custos_fixos: prev.custos_fixos.filter((_, i) => i !== index)
    }));
  };

  const updateMargem = (index: number, value: number) => {
    const updated = [...form.margens_por_categoria];
    updated[index] = { ...updated[index], margem_pct: value };
    setForm(prev => ({ ...prev, margens_por_categoria: updated }));
  };

  const handleSave = async () => {
    const success = await saveConfig({
      ...form,
      total_custos_fixos_rs: totalCustosFixos,
      taxa_ponderada_pct: taxaPonderada,
      pct_cf_sobre_faturamento: pctCF,
    });
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleReset = async () => {
    await resetToDefaults();
    setForm(DEFAULT_PRICING_CONFIG);
    setResetModal(false);
  };

  const handleImportCatalog = async () => {
    setImporting(true);
    let success = 0;
    let skipped = 0;

    const existingNames = new Set(products.map(p => p.name.toUpperCase().trim()));

    for (const item of CATALOGO_BASE) {
      // Skip if product with same name already exists
      if (existingNames.has(item.nome.toUpperCase().trim())) {
        skipped++;
        continue;
      }

      const margem = getDefaultMarginForCategory(item.categoria, form);
      const costPrice = item.custo_rs || 0;

      let sellingPrice = 0;
      if (costPrice > 0) {
        const result = calculateMarkupPrice({
          costPrice,
          categoria: item.categoria,
          config: form,
        });
        sellingPrice = result.precoSugerido;
      }

      const result = await addProduct({
        user_id: user?.id || 'demo',
        name: item.nome,
        category: item.categoria,
        cost_price: costPrice,
        margin_percent: margem,
        payment_fees: taxaPonderada,
        fixed_costs: 0,
        min_margin: 20,
        current_stock: 0,
        min_stock: item.estoque_minimo,
        selling_price: sellingPrice > 0 ? sellingPrice : undefined,
      } as any);

      if (result) {
        success++;
        existingNames.add(item.nome.toUpperCase().trim());
      }
    }

    setImportResult({ success, skipped });
    setImporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
          <p className="text-muted-foreground font-medium animate-pulse">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Settings className="text-primary" size={36} />
            Precificação
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Configure taxas, custos fixos e margens do mini mercado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setResetModal(true)}
          >
            <RotateCcw size={16} className="mr-2" />
            Restaurar Padrão
          </Button>
          <Button 
            onClick={handleSave} 
            isLoading={saving}
            className={`px-6 transition-all ${saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
          >
            {saveSuccess ? (
              <><Check size={16} className="mr-2" /> Salvo!</>
            ) : (
              <><Save size={16} className="mr-2" /> Salvar</>
            )}
          </Button>
        </div>
      </div>

      {/* Changes indicator */}
      {hasChanges && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl"
        >
          <AlertTriangle size={16} />
          <span className="font-medium">Você tem alterações não salvas.</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Config Sections */}
        <div className="lg:col-span-2 space-y-6">

          {/* ======= SEÇÃO: TAXAS E IMPOSTOS ======= */}
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('taxas')}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-inner">
                  <CreditCard size={22} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">Taxas e Impostos</h3>
                  <p className="text-sm text-muted-foreground">Cartão, impostos e perdas</p>
                </div>
              </div>
              {expandedSections.taxas ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSections.taxas && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-6 pb-6 space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Taxa Cartão Crédito (%)"
                    type="number"
                    step="0.01"
                    value={form.taxa_credito_pct}
                    onChange={e => updateField('taxa_credito_pct', Number(e.target.value))}
                  />
                  <Input
                    label="Taxa Cartão Débito (%)"
                    type="number"
                    step="0.01"
                    value={form.taxa_debito_pct}
                    onChange={e => updateField('taxa_debito_pct', Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Mix Crédito (%)"
                    type="number"
                    value={form.mix_credito_pct}
                    onChange={e => updateField('mix_credito_pct', Number(e.target.value))}
                  />
                  <Input
                    label="Mix Débito (%)"
                    type="number"
                    value={form.mix_debito_pct}
                    onChange={e => updateField('mix_debito_pct', Number(e.target.value))}
                  />
                  <Input
                    label="Mix Dinheiro/Pix (%)"
                    type="number"
                    value={form.mix_pix_pct}
                    onChange={e => updateField('mix_pix_pct', Number(e.target.value))}
                  />
                </div>

                {/* Derived value */}
                <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                  <span className="text-sm font-medium text-muted-foreground">Taxa Ponderada de Cartão:</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{taxaPonderada.toFixed(3)}%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/30">
                  <Input
                    label="Imposto s/ Faturamento (%)"
                    type="number"
                    step="0.01"
                    value={form.imposto_pct}
                    onChange={e => updateField('imposto_pct', Number(e.target.value))}
                  />
                  <Input
                    label="Perdas, Quebras e Vencimentos (%)"
                    type="number"
                    step="0.01"
                    value={form.perdas_pct}
                    onChange={e => updateField('perdas_pct', Number(e.target.value))}
                  />
                </div>
              </motion.div>
            )}
          </Card>

          {/* ======= SEÇÃO: CUSTOS FIXOS MENSAIS ======= */}
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('custos')}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-inner">
                  <Building size={22} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">Custos Fixos Mensais</h3>
                  <p className="text-sm text-muted-foreground">R$ {totalCustosFixos.toFixed(2)} / mês</p>
                </div>
              </div>
              {expandedSections.custos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSections.custos && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-6 pb-6 space-y-4"
              >
                {form.custos_fixos.map((custo, i) => (
                  <div key={i} className="flex items-end gap-3 animate-in fade-in duration-200">
                    <div className="flex-1">
                      <Input
                        label={i === 0 ? "Descrição" : undefined}
                        placeholder="Ex: Energia Elétrica"
                        value={custo.nome}
                        onChange={e => updateCustoFixo(i, 'nome', e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        label={i === 0 ? "Valor (R$)" : undefined}
                        type="number"
                        step="0.01"
                        value={custo.valor}
                        onChange={e => updateCustoFixo(i, 'valor', Number(e.target.value))}
                      />
                    </div>
                    <button 
                      onClick={() => removeCustoFixo(i)}
                      className="h-10 w-10 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addCustoFixo}>
                  <Plus size={14} className="mr-2" /> Adicionar Custo Fixo
                </Button>

                <div className="pt-4 border-t border-border/30 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <span className="text-sm font-medium text-muted-foreground">Total Custos Fixos:</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">R$ {totalCustosFixos.toFixed(2)}</span>
                  </div>

                  <Input
                    label="Faturamento Bruto Estimado (R$/mês)"
                    type="number"
                    step="100"
                    value={form.faturamento_estimado_rs}
                    onChange={e => updateField('faturamento_estimado_rs', Number(e.target.value))}
                  />

                  <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <span className="text-sm font-medium text-muted-foreground">% Custos Fixos / Faturamento:</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{pctCF.toFixed(2)}%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>

          {/* ======= SEÇÃO: MARGENS POR CATEGORIA ======= */}
          <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <button 
              onClick={() => toggleSection('margens')}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <Percent size={22} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">Margens por Categoria</h3>
                  <p className="text-sm text-muted-foreground">Margem líquida desejada e fator de markup</p>
                </div>
              </div>
              {expandedSections.margens ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSections.margens && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-6 pb-6"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border/50">
                        <th className="py-3 pr-4 font-semibold">Categoria</th>
                        <th className="py-3 px-4 font-semibold text-center">Margem (%)</th>
                        <th className="py-3 px-4 font-semibold text-center">Fator Markup</th>
                        <th className="py-3 pl-4 font-semibold hidden sm:table-cell">Justificativa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.margens_por_categoria.map((cat, i) => {
                        const fatorConfig: PricingConfig = {
                          ...form,
                          total_custos_fixos_rs: totalCustosFixos,
                          taxa_ponderada_pct: taxaPonderada,
                          pct_cf_sobre_faturamento: pctCF,
                        };
                        const fator = calcFatorMarkup(cat.margem_pct, fatorConfig);
                        const isLow = fator < 40;

                        return (
                          <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                            <td className="py-3 pr-4">
                              <span className="font-bold text-foreground">{cat.categoria}</span>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min={0}
                                max={80}
                                className="w-20 h-9 mx-auto block text-center rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                                value={cat.margem_pct}
                                onChange={e => updateMargem(i, Number(e.target.value))}
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-mono font-bold ${isLow ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {fator.toFixed(2)}%
                              </span>
                            </td>
                            <td className="py-3 pl-4 text-muted-foreground text-xs hidden sm:table-cell">
                              {cat.justificativa || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl">
                  <Info size={14} className="shrink-0" />
                  <span>Fator de Markup = 100% - Taxa Cartão - (Imposto + Perdas) - % Custos Fixos - Margem. Valores abaixo de 40% indicam risco.</span>
                </div>
              </motion.div>
            )}
          </Card>
        </div>

        {/* Right: Preview Panel */}
        <div className="space-y-6 sticky top-24 h-fit">
          {/* Simulador de Preço */}
          <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-primary text-white">
                <Calculator size={20} />
              </div>
              <h3 className="font-bold text-lg">Simulador Rápido</h3>
            </div>

            <PriceSimulator config={{
              ...form,
              total_custos_fixos_rs: totalCustosFixos,
              taxa_ponderada_pct: taxaPonderada,
              pct_cf_sobre_faturamento: pctCF,
            }} />
          </Card>

          {/* Import Catalog */}
          <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500 text-white">
                <Package size={20} />
              </div>
              <h3 className="font-bold text-lg">Catálogo Base</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Importe o catálogo com {CATALOGO_BASE.length} produtos pré-definidos para o mini mercado de condomínio. Produtos com nomes duplicados serão ignorados.
            </p>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setImportModal(true)}
            >
              <Download size={16} className="mr-2" />
              Importar Catálogo ({CATALOGO_BASE.length} produtos)
            </Button>

            {importResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm"
              >
                <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                  ✅ {importResult.success} produtos importados
                </p>
                {importResult.skipped > 0 && (
                  <p className="text-muted-foreground text-xs mt-1">
                    {importResult.skipped} ignorados (já existiam)
                  </p>
                )}
              </motion.div>
            )}
          </Card>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        title="Restaurar Padrão?"
        description="Todas as configurações de precificação serão redefinidas para os valores padrão do documento. Os produtos existentes NÃO serão alterados."
        variant="warning"
        actionLabel="Restaurar"
        onAction={handleReset}
      />

      {/* Import Modal */}
      <Modal
        isOpen={importModal}
        onClose={() => { if (!importing) setImportModal(false); }}
        title="Importar Catálogo Base"
        description={importing 
          ? "Importando produtos... aguarde." 
          : `Serão importados até ${CATALOGO_BASE.length} produtos do catálogo do mini mercado. Produtos com nomes já existentes serão ignorados. Deseja continuar?`
        }
        variant="info"
        actionLabel={importing ? undefined : "Importar"}
        onAction={importing ? undefined : async () => {
          await handleImportCatalog();
          setImportModal(false);
        }}
      />
    </div>
  );
}

// ========== COMPONENTE SIMULADOR DE PREÇO ==========

function PriceSimulator({ config }: { config: PricingConfig }) {
  const [custoProd, setCustoProd] = useState(4.69); // Heineken default
  const [categoriaSel, setCategoriaSel] = useState('CERVEJA PADRÃO');

  const result = calculateMarkupPrice({
    costPrice: custoProd,
    categoria: categoriaSel,
    config,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Categoria</label>
        <select
          value={categoriaSel}
          onChange={e => setCategoriaSel(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          {CATEGORIAS_MINI_MERCADO.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <Input
        label="Custo do Produto (R$)"
        type="number"
        step="0.01"
        value={custoProd}
        onChange={e => setCustoProd(Number(e.target.value))}
      />

      {/* Results */}
      <div className="space-y-3 pt-4 border-t border-border/30">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Margem desejada:</span>
          <span className="font-bold">{result.margemDesejadaPct}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fator Markup:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{result.fatorMarkupPct.toFixed(2)}%</span>
        </div>

        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Preço Sugerido</p>
          <p className="text-3xl font-black text-primary">
            R$ {result.precoSugerido.toFixed(2)}
          </p>
          {result.precoPsicologico > 0 && result.precoPsicologico !== result.precoSugerido && (
            <p className="text-xs text-muted-foreground">
              💡 Preço psicológico: <span className="font-bold text-foreground">R$ {result.precoPsicologico.toFixed(2)}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Info size={12} />
          <span>Fórmula: TETO(Custo ÷ Fator, R$0,10)</span>
        </div>
      </div>
    </div>
  );
}
