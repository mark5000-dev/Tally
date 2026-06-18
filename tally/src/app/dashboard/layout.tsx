import Link from "next/link";
import { BarChart3, Wallet, LogOut, LayoutDashboard, PlusCircle } from "lucide-react";

export default function StudioWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex text-zinc-900 dark:text-zinc-100">
      
      {/* Structural Isolation Sidebar Shell */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden md:flex flex-col fixed inset-y-0 left-0 z-20 pt-16">
        <div className="p-6 flex flex-col justify-between flex-1">
          <div className="space-y-6">
            <div className="px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Workspace Hub</span>
            </div>
            
            <nav className="space-y-1">
              {[
                { label: "Studio Studio", icon: LayoutDashboard, path: "/dashboard" },
                { label: "Ecosystem Hub", icon: BarChart3, path: "/polls" },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all group"
                >
                  <item.icon size={16} className="text-zinc-400 group-hover:text-violet-600 transition-colors" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
              <LogOut size={16} /> Terminal Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Stream Ingestion Interface */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <main className="flex-1">{children}</main>
      </div>
      
    </div>
  );
}