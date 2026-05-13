import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/logo";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Sinal Verde CRM" },
      { name: "description", content: "Acesse o CRM Sinal Verde." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary text-primary-foreground p-10">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-32 -left-32 size-[480px] rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-[420px] rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative z-10">
          <Logo />
        </div>
        <div className="relative z-10 max-w-md space-y-6">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            O CRM financeiro que <span className="text-accent">acelera</span> sua operação comercial.
          </h2>
          <p className="text-primary-foreground/80">
            Pipeline de propostas, remarketing inteligente, follow-up automático e
            atendimento centralizado em um só lugar.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-accent/20 text-accent">
                <Zap className="size-4" />
              </span>
              Operação 3× mais rápida com Kanban inteligente
            </li>
            <li className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-accent/20 text-accent">
                <Sparkles className="size-4" />
              </span>
              Sugestões de remarketing baseadas em score
            </li>
            <li className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-accent/20 text-accent">
                <ShieldCheck className="size-4" />
              </span>
              Documentos e dados sensíveis sob controle
            </li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Sinal Verde — Todos os direitos reservados.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse seu painel para gerenciar leads, propostas e clientes.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setTimeout(() => navigate({ to: "/app" }), 600);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email corporativo</Label>
              <Input id="email" type="email" placeholder="voce@sinalverde.com.br" defaultValue="carla@sinalverde.com.br" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <a href="#" className="text-xs font-medium text-primary hover:underline">
                  Esqueci minha senha
                </a>
              </div>
              <Input id="senha" type="password" placeholder="••••••••" defaultValue="demo1234" required />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" defaultChecked />
              <Label htmlFor="remember" className="text-sm font-normal">
                Manter-me conectado
              </Label>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-soft"
            >
              {loading ? "Entrando…" : "Entrar"} <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar você concorda com os Termos de Uso e Política de Privacidade.
          </div>

          <div className="mt-10 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
            Demo: pressione <span className="font-semibold text-foreground">Entrar</span> para acessar o painel.
            <br />
            <Link to="/app" className="mt-1 inline-block font-medium text-primary hover:underline">
              Pular login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
