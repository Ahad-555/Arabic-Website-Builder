import { FC, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BookOpen, LayoutDashboard, ShieldCheck, Users } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "لوحة القيادة", icon: LayoutDashboard },
    { href: "/students", label: "الطالبات", icon: Users },
    { href: "/projects", label: "مشاريع النادي", icon: BookOpen },
    { href: "/certificate/verify/sample", label: "تحقق من صك", icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-l border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              ن
            </div>
            <span className="font-bold text-lg text-foreground">النبض المهني</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href) && !item.href.includes("verify"));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
              م
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">المسؤول</span>
              <span className="text-xs text-muted-foreground">جامعة الحدود الشمالية</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/20 relative">
        <div className="p-8 pb-20 w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
