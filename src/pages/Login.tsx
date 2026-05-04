import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Store, LogIn, UserPlus } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { signInDemo } = useAuth(); // Importado do hook

      if (isLogin) {
        // Tentativa real com Supabase
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        // Se falhar (ex: sem banco), tenta o modo demo se as credenciais baterem
        if (error) {
          if (data.email === 'demo@vizinho.com' && data.password === '123456') {
            signInDemo?.();
            return;
          }
          throw error;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      }
    } catch (err: any) {
      setError(
        err.message?.includes('failed to fetch') 
          ? 'Erro de conexão. Tente e-mail: demo@vizinho.com / senha: 123456' 
          : err.message || 'Erro na autenticação'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Vizinho Precifica</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Bem-vindo de volta! Entre na sua conta.' : 'Crie sua conta para começar.'}
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-xl shadow-foreground/5 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            {error && (
              <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md animate-shake">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              {isLogin ? (
                <><LogIn className="mr-2 h-4 w-4" /> Entrar</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Criar Conta</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre aqui'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
