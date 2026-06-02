import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Products from "./pages/Products.jsx";
import Login from "./pages/Login";
import useAuthStore from "./store/authStore";
import NewOrder from "./pages/NewOrder";
import Deliveries from "./pages/Deliveries";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";

// Protects routes that require login
// If no token → redirect to /login
function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <Routes>
          {/* Public — no login needed */}
          <Route path="/login" element={<Login />} />

          {/* Protected — must be logged in */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="products" element={<Products />} />
            <Route path="orders/new" element={<NewOrder />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="settings" element={<Settings />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Unknown URL → go home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
