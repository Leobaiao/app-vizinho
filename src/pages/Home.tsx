import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { Card } from '../components/ui/Card';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ArrowUpRight,
  ChevronRight,
  Plus,
  ShoppingBag,
  MessageCircleWarning
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Home() {
  const { products, loading: productsLoading } = useProducts();
  const { loading: countsLoading } = useInventory();

  // Cálculos de Dashboard
  const totalStockValue = products.reduce((acc, p) => acc + (p.cost_price * p.current_stock), 0);
  const potentialProfit = products.reduce((acc, p) => {
    const profit = (p.selling_price || 0) - p.cost_price;
    return acc + (profit * p.current_stock);
  }, 0);
  
  const lowStockProducts = products.filter(p => p.current_stock <= (p.min_stock || 0));
  const lowStockItemsCount = lowStockProducts.length;
  
  // Dados para o Gráfico por Categoria
  const categoryData = Object.entries(
    products.reduce((acc, p) => {
      const cat = p.category || 'Outros';
      acc[cat] = (acc[cat] || 0) + (p.cost_price * p.current_stock);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
   .sort((a, b) => b.value - a.value)
   .slice(0, 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysDiff = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffTime = d.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const expiringBatches = products.reduce((acc: any[], product) => {
    if (product.product_batches && product.product_batches.length > 0) {
      product.product_batches.forEach((batch: any) => {
        const diff = getDaysDiff(batch.expiry_date);
        if (diff <= 7) {
          acc.push({
            productId: product.id,
            name: product.name,
            batchNumber: batch.batch_number,
            expiryDate: batch.expiry_date,
            quantity: Number(batch.quantity || 0),
            daysLeft: diff
          });
        }
      });
    } else if (product.expiry_date) {
      const diff = getDaysDiff(product.expiry_date);
      if (diff <= 7) {
        acc.push({
          productId: product.id,
          name: product.name,
          batchNumber: product.batch_number || 'Único',
          expiryDate: product.expiry_date,
          quantity: product.current_stock,
          daysLeft: diff
        });
      }
    }
    return acc;
  }, []).sort((a, b) => a.daysLeft - b.daysLeft);

  const sendWuzapiMessage = async (message: string) => {
    const wuzapiUrl = import.meta.env.VITE_WUZAPI_URL;
    const wuzapiToken = import.meta.env.VITE_WUZAPI_TOKEN;
    const alertPhone = import.meta.env.VITE_ALERT_PHONE;

    if (!wuzapiUrl || !wuzapiToken || !alertPhone) {
      return false; // Não configurado
    }

    try {
      const baseUrl = wuzapiUrl.replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/chat/send/text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Token": wuzapiToken,
        },
        body: JSON.stringify({
          Phone: alertPhone,
          Body: message,
        }),
      });

      return response.ok;
    } catch (e) {
      console.error("Erro ao enviar mensagem via Wuzapi:", e);
      return false;
    }
  };

  const generateWhatsAppAlert = async () => {
    if (lowStockProducts.length === 0) return;
    let message = "🚨 *Alerta de Ruptura de Estoque* 🚨\n\n";
    lowStockProducts.forEach(p => {
      message += `📦 *${p.name}*\n`;
      message += `Estoque atual: ${p.current_stock} (Mínimo: ${p.min_stock || 0})\n\n`;
    });
    message += "Por favor, providencie a reposição o quanto antes!";
    
    const sent = await sendWuzapiMessage(message);
    if (!sent) {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      alert("Alerta de estoque enviado com sucesso via Wuzapi!");
    }
  };

  const generateExpiryWhatsAppAlert = async () => {
    if (expiringBatches.length === 0) return;
    let message = "🚨 *Relatório de Validades - Vizinho Precifica* 🚨\n\n";
    message += "Os seguintes itens estão vencidos ou próximos do vencimento:\n\n";
    
    expiringBatches.forEach(b => {
      const statusText = b.daysLeft < 0 
        ? `🔴 VENCIDO (em ${new Date(b.expiryDate).toLocaleDateString('pt-BR')})` 
        : b.daysLeft === 0 
        ? `🟠 VENCE HOJE!` 
        : `🟡 Vence em ${b.daysLeft} ${b.daysLeft === 1 ? 'dia' : 'dias'} (${new Date(b.expiryDate).toLocaleDateString('pt-BR')})`;
      
      message += `📦 *${b.name}*\n`;
      message += `Lote: ${b.batchNumber} | Qtd: ${b.quantity}\n`;
      message += `${statusText}\n\n`;
    });
    
    message += "Atenção ao controle de gôndola (FEFO)!";
    
    const sent = await sendWuzapiMessage(message);
    if (!sent) {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      alert("Relatório de validades enviado com sucesso via Wuzapi!");
    }
  };

  if (productsLoading || countsLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
          <p className="text-muted-foreground font-medium animate-pulse">Preparando dashboard...</p>
        </div>
      </div>
    );
  }

  // Estado Vazio (Empty State) Premium
  if (products.length === 0) {
    return (
      <div className="animate-in fade-in duration-700 h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-primary/10 p-8 rounded-full mb-8 relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <ShoppingBag size={72} className="text-primary relative z-10" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Bem-vindo ao Vizinho! 🎉</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Seu estoque está vazio. Comece adicionando seu primeiro produto para que possamos gerar gráficos inteligentes e insights sobre seu negócio.
        </p>
        <Link to="/products">
          <button className="flex items-center gap-3 bg-gradient-to-r from-primary to-emerald-400 text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-transform active:scale-95 text-lg">
            <Plus size={24} /> Adicionar Primeiro Produto
          </button>
        </Link>
      </div>
    );
  }

  const expiredCount = expiringBatches.filter(b => b.daysLeft < 0).length;
  const expiringSoonCount = expiringBatches.filter(b => b.daysLeft >= 0 && b.daysLeft <= 7).length;

  const kpis = [
    {
      label: 'Patrimônio em Estoque',
      value: `R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <Package className="text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-500/10',
      trend: 'Total investido'
    },
    {
      label: 'Lucro Potencial',
      value: `R$ ${potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <TrendingUp className="text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-500/10',
      trend: 'Ao vender todo estoque'
    },
    {
      label: 'Produtos em Alerta',
      value: lowStockItemsCount.toString(),
      icon: <AlertTriangle className="text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-500/10',
      trend: 'Estoque mínimo atingido'
    },
    {
      label: 'Validades Críticas',
      value: expiringBatches.length.toString(),
      icon: <AlertTriangle className={expiringBatches.length > 0 ? "text-destructive animate-pulse" : "text-emerald-600 dark:text-emerald-400"} />,
      color: expiringBatches.length > 0 ? 'bg-destructive/10' : 'bg-emerald-500/10',
      trend: expiredCount > 0 
        ? `${expiredCount} vencido${expiredCount > 1 ? 's' : ''}!` 
        : expiringSoonCount > 0 
        ? `${expiringSoonCount} a vencer` 
        : 'Tudo dentro da validade'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Olá, Vizinho! 👋</h1>
          <p className="text-muted-foreground text-lg mt-1">Seu resumo de inteligência de hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockItemsCount > 0 && (
            <button 
              onClick={generateWhatsAppAlert}
              className="flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 px-4 py-3 rounded-2xl font-bold transition-colors border border-[#25D366]/20"
              title="Notificar por WhatsApp"
            >
              <MessageCircleWarning size={20} />
              <span className="hidden sm:inline">Alertar Falta</span>
            </button>
          )}
          <Link to="/products">
            <button className="flex items-center gap-2 bg-gradient-to-r from-primary to-emerald-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
              <Plus size={20} /> Novo Produto
            </button>
          </Link>
        </div>
      </div>

      {/* Grid de KPIs - Design estilo Glassmorphism/Neumorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 h-full flex flex-col justify-between border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${kpi.color} shadow-inner`}>
                  {kpi.icon}
                </div>
                <div className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                  <ArrowUpRight size={12} className="mr-1" /> Live
                </div>
              </div>
              <div className="mt-5">
                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-widest">{kpi.label}</p>
                <h3 className="text-3xl font-black tracking-tight">{kpi.value}</h3>
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground/80 bg-muted/50 w-fit px-2 py-1 rounded-md">{kpi.trend}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Barras - Estoque por Categoria */}
        <Card className="p-6 lg:col-span-2 border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-xl">Investimento por Categoria</h3>
              <p className="text-sm text-muted-foreground">Onde seu dinheiro está alocado</p>
            </div>
            <Link to="/products" className="text-sm font-bold text-primary flex items-center hover:underline bg-primary/5 px-3 py-1.5 rounded-lg">
              Ver Tabela <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="h-[300px] w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Investido']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]} 
                    barSize={45}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                Nenhuma categoria com estoque no momento
              </div>
            )}
          </div>
        </Card>

        {/* Mini Gráfico de Pizza - Distribuição */}
        <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-xl">Composição</h3>
            <p className="text-sm text-muted-foreground">Distribuição do patrimônio</p>
          </div>
          
          <div className="flex-1 min-h-[200px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Sem dados suficientes
              </div>
            )}
          </div>
          
          <div className="mt-6 space-y-3">
            {categoryData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <span className="font-bold">R$ {item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alertas de Vencimento (FEFO) */}
      {expiringBatches.length > 0 && (
        <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm animate-in fade-in duration-500 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shadow-inner">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl">Lotes Próximos do Vencimento</h3>
                <p className="text-sm text-muted-foreground">Atenção ao controle de validade nas gôndolas (FEFO)</p>
              </div>
            </div>
            <button 
              onClick={generateExpiryWhatsAppAlert}
              className="flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 px-4 py-2.5 rounded-xl font-bold transition-colors border border-[#25D366]/20 text-sm w-full sm:w-auto justify-center"
            >
              <MessageCircleWarning size={16} />
              <span>Notificar Vencimentos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {expiringBatches.map((batch, index) => {
              let alertColor = "border-destructive bg-destructive/5 text-destructive";
              let badgeColor = "bg-destructive text-white";
              let daysText = "";

              if (batch.daysLeft < 0) {
                daysText = `Vencido há ${Math.abs(batch.daysLeft)} ${Math.abs(batch.daysLeft) === 1 ? 'dia' : 'dias'}`;
              } else if (batch.daysLeft === 0) {
                daysText = "Vence hoje!";
                alertColor = "border-destructive bg-destructive/5 text-destructive animate-pulse";
                badgeColor = "bg-destructive text-white";
              } else if (batch.daysLeft <= 3) {
                daysText = `Vence em ${batch.daysLeft} ${batch.daysLeft === 1 ? 'dia' : 'dias'}`;
                alertColor = "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300";
                badgeColor = "bg-amber-500 text-white";
              } else {
                daysText = `Vence em ${batch.daysLeft} dias`;
                alertColor = "border-yellow-500/30 bg-yellow-500/5 text-yellow-800 dark:text-yellow-300";
                badgeColor = "bg-yellow-500 text-black";
              }

              return (
                <div key={index} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${alertColor}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{batch.name}</p>
                      <p className="text-xs opacity-80">Lote: {batch.batchNumber} • Qtd: {batch.quantity}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor} shrink-0`}>
                      {daysText}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] opacity-80 pt-2 border-t border-current/15">
                    <span>Vencimento:</span>
                    <span className="font-bold">{new Date(batch.expiryDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Seção de Atalhos Rápidos com Gradientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        <Link to="/stock">
          <Card className="p-6 flex items-center gap-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 border-none cursor-pointer group hover:-translate-y-1">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md text-white group-hover:scale-110 transition-transform">
              <Package size={28} />
            </div>
            <div>
              <h4 className="font-black text-xl tracking-tight">Auditar Estoque</h4>
              <p className="text-emerald-100 font-medium">Bipe os códigos na prateleira</p>
            </div>
          </Card>
        </Link>
        <Link to="/history">
          <Card className="p-6 flex items-center gap-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 border-none cursor-pointer group hover:-translate-y-1">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md text-white group-hover:scale-110 transition-transform">
              <Plus size={28} />
            </div>
            <div>
              <h4 className="font-black text-xl tracking-tight">Importar NF-e (XML)</h4>
              <p className="text-blue-100 font-medium">Atualize os custos via nota</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
