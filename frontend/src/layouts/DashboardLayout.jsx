import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Truck,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import useAuthStore from "@/store/authStore";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/deliveries", icon: Truck, label: "Deliveries" },
];

const bottomNavItems = [
  { to: "/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  // sidebarOpen controls whether the mobile sidebar drawer is visible
  // On desktop this doesn't matter — sidebar is always visible via CSS
  // On mobile this toggles the slide-in drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close sidebar when a nav link is clicked on mobile
  // On desktop this does nothing (sidebar is always open)
  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "CF";

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
     transition-colors duration-150 w-full
     ${
       isActive
         ? "bg-primary text-primary-foreground font-medium"
         : "text-muted-foreground hover:bg-accent hover:text-foreground"
     }`;

  // Sidebar content is the same for both mobile and desktop
  // We extract it into a variable to avoid writing it twice
  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="text-primary">Commerce</span>Flow
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Seller Dashboard
          </p>
        </div>
        {/* Close button — only visible on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* New Order button */}
      <div className="p-3">
        <Button
          className="w-full gap-2"
          onClick={() => {
            navigate("/orders/new");
            handleNavClick();
          }}
        >
          <Plus className="w-4 h-4" />
          New Order
        </Button>
      </div>

      <Separator />

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={navClass}
            onClick={handleNavClick}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        <Separator className="my-2" />

        {bottomNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={navClass}
            onClick={handleNavClick}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || "Seller"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-7 w-7"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── MOBILE OVERLAY ──────────────────────────────────────────────────
          Dark background behind the sidebar when open on mobile
          Clicking it closes the sidebar
          hidden on desktop (lg:hidden) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE SIDEBAR DRAWER ───────────────────────────────────────────
          Slides in from the left on mobile when sidebarOpen is true
          fixed = stays in place when content scrolls
          z-50  = appears above everything including the overlay
          lg:hidden = completely removed on desktop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="fixed left-0 top-0 h-full w-72 bg-card border-r
                       border-border z-50 lg:hidden"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            // spring animation feels natural for a drawer sliding in
          >
            {SidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────────
          Always visible on desktop (lg and above)
          hidden on mobile — the drawer above handles mobile
          hidden lg:flex means: hidden by default, flex on large screens */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card shrink-0">
        {SidebarContent}
      </aside>

      {/* ── RIGHT SIDE (topbar + content) ───────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* min-w-0 prevents flex children from overflowing */}

        {/* TOPBAR */}
        <header
          className="h-14 border-b border-border flex items-center
                           justify-between px-4 bg-card shrink-0"
        >
          <div className="flex items-center gap-3">
            {/* Hamburger menu — only visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <p className="text-sm text-muted-foreground hidden sm:block">
              Welcome back,{" "}
              <span className="font-medium text-foreground">
                {user?.name?.split(" ")[0] || "Seller"}
              </span>
            </p>

            {/* On very small screens just show the logo text */}
            <p className="text-sm font-semibold sm:hidden">
              <span className="text-primary">Commerce</span>Flow
            </p>
          </div>

          {/* Dark / Light toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {/* p-4 on mobile, p-6 on desktop — more breathing room on bigger screens */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
