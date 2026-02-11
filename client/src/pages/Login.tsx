import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await loginMutation.mutateAsync({ email, password });
        if (result.success) {
          toast.success("Login realizado com sucesso!");
          setLocation("/");
        } else {
          toast.error(result.message || "Erro ao fazer login");
        }
      } else {
        const result = await registerMutation.mutateAsync({ email, password, name });
        if (result.success) {
          toast.success("Conta criada com sucesso!");
          setLocation("/");
        } else {
          toast.error(result.message || "Erro ao criar conta");
        }
      }
    } catch (error) {
      toast.error("Erro ao processar requisição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Manus CRM</h1>
            <p className="text-slate-600">Gestão de Vendas e Cadência de Leads</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Senha
              </label>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Processando..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail("");
                  setPassword("");
                  setName("");
                }}
                className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
