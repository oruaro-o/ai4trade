import { Classifier } from "@/components/classifier";

export default function Home() {
  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <header className="flex items-center justify-between px-6 lg:px-8 h-12 border-b border-border shrink-0">
        <span className="text-sm font-medium tracking-tight">
          Tariff Classifier
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0">
        <Classifier />
      </main>

      {/* Footer */}
      <footer className="px-6 lg:px-8 py-3 border-t border-border shrink-0">
        <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
          Classifications are estimates. Consult a licensed customs broker for
          binding rulings.
        </p>
      </footer>
    </div>
  );
}
