import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulação de login para demonstração, já que o backend usa OAuth do Manus
      // Em um cenário real, isso chamaria uma mutation do tRPC
      if (email === "admin@vendas.com" && password === "Admin@123456") {
        toast.success("Login realizado com sucesso!");
        
        // Armazena um estado de autenticação fictício para o frontend
        // O useAuth original depende do tRPC meQuery, então vamos precisar ajustar o CRMLayout
        localStorage.setItem("auth_token", "dummy_token");
        localStorage.setItem("user_role", "admin");
        
        setTimeout(() => {
          setLocation("/");
        }, 1000);
      } else {
        toast.error("Credenciais inválidas");
      }
    } catch (error) {
      toast.error("Erro ao realizar login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">CRM Vendas</h1>
          <p className="text-slate-500 mt-2">Equipe Santiago</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Não tem conta? <span className="text-blue-600 font-medium cursor-pointer hover:underline">Criar conta</span></p>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">Made with Manus</p>
        </div>
      </Card>
    </div>
  );
}
