import { Link, useLocation } from "react-router-dom";
import { BarChart3, LineChart, Briefcase, ShieldAlert, User, Cpu } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Market Overview", icon: BarChart3 },
  { path: "/analysis", label: "Stock Analysis", icon: LineChart },
  { path: "/portfolio", label: "My Portfolio", icon: Briefcase },
  { path: "/monitoring", label: "Monitoring", icon: ShieldAlert },
  { path: "/chat", label: "AI Advisor", icon: ShieldAlert }, // Reusing icon for now
  { path: "/models", label: "System Status", icon: Cpu },
  { path: "/profile", label: "Profile", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">BVMT<span className="text-primary">Trade</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="text-xs text-muted-foreground font-mono">
            TUNINDEX <span className="text-gain">9,847.32</span>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex border-t">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${pathname === path ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 container px-4 py-6">{children}</main>

      {/* Disclaimer footer */}
      <footer className="border-t py-3 text-center text-[11px] text-muted-foreground">
        ⚠️ Educational & advisory tool only. Not financial advice. No real orders are executed. Virtual portfolio simulation.
      </footer>
    </div>
  );
}
