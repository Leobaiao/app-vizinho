import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { LogOut, Package, Store, LayoutDashboard, Barcode, History as HistoryIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut, isDemo } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Início', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Produtos', path: '/products', icon: <Package size={20} /> },
    { label: 'Estoque', path: '/stock', icon: <Barcode size={20} /> },
    { label: 'Histórico', path: '/history', icon: <HistoryIcon size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Store />
            <span className="hidden sm:inline">Vizinho Precifica</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 mx-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pl-4 border-l">
              <div className={`h-2 w-2 rounded-full ${isDemo ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className="text-xs font-medium text-muted-foreground">
                {isDemo ? "Local" : "Cloud"}
              </span>
            </div>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden lg:inline-block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden border-t bg-card/80 backdrop-blur-md fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => signOut()}
          className="flex flex-col items-center gap-1 text-[10px] font-medium text-muted-foreground"
        >
          <LogOut size={20} />
          Sair
        </button>
      </nav>
      {/* Spacer for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
