import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom"; // নির্দেশনা অনুযায়ী react-router
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  UtensilsCrossed,
  CreditCard,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ChevronDown,
  Users,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

type Role = "admin" | "user";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const menuConfig: Record<Role, MenuItem[]> = {
  admin: [
    { icon: LayoutDashboard, label: "এডমিন ড্যাশবোর্ড", href: "/admin-dashboard" },
    { icon: Users, label: "ইউজার ম্যানেজমেন্ট", href: "/admin-dashboard/users-management" },
    { icon: Users, label: "বিল্ডিং ম্যানেজমেন্ট", href: "/admin-dashboard/building-management" },
    { icon: UtensilsCrossed, label: "মিল কন্ট্রোল", href: "/admin-dashboard/meals-control" },
    { icon: UtensilsCrossed, label: "লক করা মিল", href: "/meals/admin/locked-meals/2026-02-02" },
    { icon: FileText, label: "বিল জেনারেটর", href: "/admin-dashboard/bill-generator" },
    { icon: FileText, label: "সব ইউজার", href: "/admin-dashboard/user" },
    { icon: FileText, label: "সব প্রোফাইল", href: "/admin-dashboard/Profile" },
  ],
  user: [
    { icon: LayoutDashboard, label: "ড্যাশবোর্ড", href: "/user-dashboard" },
    { icon: UtensilsCrossed, label: "খাবার অর্ডার", href: "/user-dashboard/meals" },
    { icon: CreditCard, label: "বিলিং", href: "/user-dashboard/billing" },
    { icon: User, label: "প্রোফাইল", href: "/user-dashboard/profile" },
  ],
};

const DashboardLayout = ({ role = "admin" }: { role?: Role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const menuItems = menuConfig[role];
  const { user, isAdmin, logout } = useAuth();
// console.log("nav",user?.name, user?.role);

  // রাউট অ্যাক্টিভ কিনা চেক করার লজিক
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden border-r lg:flex w-56 flex-col fixed inset-y-0 left-0 z-50 bg-card">
        {/* Logo Section */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
            <img 
              src="/niribili-logo.png" 
              alt="Logo" 
              className="w-5 h-5 brightness-0 invert" 
            />
          </div>
          <span className="font-display text-lg font-bold text-gradient">নিরিবিলি হোম</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 bg-linear-to-b from-card to-secondary/30">
          <div className="space-y-1.5">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${
                  isActive(item.href)
                    ? "text-primary-foreground bg-primary shadow-glow shadow-primary/20" // সিলেক্টেড থাকলে ফুল হাইলাইট
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary" // বাকিগুলো নরমাল
                }`}
              >
                <item.icon 
                  className={`w-5 h-5 transition-colors ${
                    isActive(item.href) ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  }`} 
                />
                {item.label}
                
                {/* Active Indicator (Optional Dot) */}
                {isActive(item.href) && (
                  <motion.div 
                    layoutId="activePill"
                    className="absolute left-0 w-1 h-6 bg-accent rounded-r-full" 
                  />
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3 p-2 rounded-xl glass hover:bg-secondary transition-all cursor-pointer group">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {role === "admin" ? "এ" : "ইউ"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                {role === "admin" ? "এডমিন সাহেব" : "আবাসিক মেম্বার"}
              </p>
              <div className="flex items-center gap-1">
                {role === "admin" && <ShieldCheck className="w-3 h-3 text-accent" />}
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {role}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:translate-y-0.5 transition-transform" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-24 flex flex-col">
        {/* Header */}
        <header className="h-16 glass sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 border-b border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-primary hover:bg-primary/10"
          >
            <Menu className="w-6 h-6" />
          </Button>

          <div className="hidden md:block">
            <span className={`text-[10px] font-bold px-4 py-1.5 rounded-full border shadow-sm ${
              role === "admin" 
                ? "bg-accent/10 text-accent border-accent/20" 
                : "bg-primary/10 text-primary border-primary/20"
            }`}>
              {role === "admin" ? "• ADMIN CONTROL" : "• MEMBER PORTAL"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative group hover:bg-primary/5">
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive border-2 border-background" />
            </Button>
            
            <div className="h-8 w-[px] bg-border mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive group"
              onClick={() => {
                logout();
              }}
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </header>

        {/* Page Content with Background Gradient */}
        <main className="flex-1 overflow-y-auto bg-linear-to-b from-background to-secondary/15 p-2 md:p-4">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <span className="font-display text-lg font-bold">নিরিবিলি হোম</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 text-muted-foreground"><X /></button>
              </div>
              <nav className="p-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                      isActive(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;