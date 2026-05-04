import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { Card } from '../components/ui/Card';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight,
  ChevronRight,
  Plus
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
  
  const lowStockItems = products.filter(p => p.current_stock <= (p.min_stock || 0)).length;
  
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

  if (productsLoading || countsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Patrimônio em Estoque',
      value: `R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <Package className="text-emerald-600" />,
      color: 'bg-emerald-500/10',
      trend: '+12% este mês'
    },
    {
      label: 'Lucro Potencial',
      value: `R$ ${potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <TrendingUp className="text-blue-600" />,
      color: 'bg-blue-500/10',
      trend: 'Margem média: 32%'
    },
    {
      label: 'Produtos em Alerta',
      value: lowStockItems.toString(),
      icon: <AlertTriangle className="text-amber-600" />,
      color: 'bg-amber-500/10',
      trend: 'Estoque mínimo atingido'
    },
    {
      label: 'Vendas (Simulado)',
      value: 'R$ 0,00',
      icon: <DollarSign className="text-purple-600" />,
      color: 'bg-purple-500/10',
      trend: 'Aguardando PDV'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Olá, Vizinho! 👋</h1>
          <p className="text-muted-foreground text-lg">Aqui está o resumo da sua loja hoje.</p>
        </div>
        <Link to="/products">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
            <Plus size={20} /> Novo Produto
          </button>
        </Link>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 h-full flex flex-col justify-between hover:shadow-md transition-shadow border-none bg-white dark:bg-zinc-900 shadow-sm">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${kpi.color}`}>
                  {kpi.icon}
                </div>
                <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                  <ArrowUpRight size={12} className="mr-1" /> Live
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-2xl font-black">{kpi.value}</h3>
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground/60">{kpi.trend}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Barras - Estoque por Categoria */}
        <Card className="p-6 lg:col-span-2 border-none shadow-sm bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl">Investimento por Categoria</h3>
            <Link to="/products" className="text-sm font-bold text-primary flex items-center hover:underline">
              Ver Produtos <ChevronRight size={16} />
            </Link>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="var(--color-primary)" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Mini Gráfico de Pizza - Distribuição */}
        <Card className="p-6 border-none shadow-sm bg-white dark:bg-zinc-900">
          <h3 className="font-bold text-xl mb-8">Composição de Estoque</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-bold">R$ {item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Seção de Atalhos Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/stock">
          <Card className="p-6 flex items-center gap-4 hover:bg-emerald-500 hover:text-white group transition-all duration-300 border-none shadow-sm cursor-pointer">
            <div className="p-4 rounded-2xl bg-emerald-500 text-white group-hover:bg-white group-hover:text-emerald-500 transition-colors">
              <Package size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg">Fazer Inventário</h4>
              <p className="text-sm opacity-80">Bipe os produtos na prateleira.</p>
            </div>
          </Card>
        </Link>
        <Link to="/history">
          <Card className="p-6 flex items-center gap-4 hover:bg-blue-500 hover:text-white group transition-all duration-300 border-none shadow-sm cursor-pointer">
            <div className="p-4 rounded-2xl bg-blue-500 text-white group-hover:bg-white group-hover:text-blue-500 transition-colors">
              <Plus size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg">Lançar Nota (XML)</h4>
              <p className="text-sm opacity-80">Atualize estoque via NF-e.</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
