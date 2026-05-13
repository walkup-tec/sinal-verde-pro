import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed border-border/60 shadow-soft">
      <CardContent className="flex flex-col items-center justify-center gap-4 p-16 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-accent/15 text-accent-foreground">
          <Construction className="size-7 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/app">Voltar ao dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function makeStubRoute(path: any, title: string, description: string) {
  return createFileRoute(path)({
    component: () => <ComingSoon title={title} description={description} />,
  });
}
