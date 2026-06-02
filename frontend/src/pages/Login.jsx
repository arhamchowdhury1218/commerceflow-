// src/pages/Login.jsx
// Real login page connected to Laravel API
// Has both Login and Register tabs

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/store/authStore";
import api from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  // tab controls whether we show Login or Register form
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // error stores the error message from Laravel
  const [error, setError] = useState("");

  // loginData stores the input values for the login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // registerData stores the input values for the register form
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    business_name: "",
    password: "",
    password_confirmation: "",
  });

  // Generic change handler for login form
  // e.target.name matches the field name in loginData
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    // spread operator copies all existing fields
    // [e.target.name] dynamically sets the changed field
    // Example: typing in email field → { email: 'new@value.com', password: '' }
    setError(""); // clear error when user starts typing
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setError("");
  };

  // LOGIN SUBMIT
  const handleLogin = async (e) => {
    e.preventDefault();
    // e.preventDefault() stops the browser from reloading the page
    // HTML forms reload by default — we want to handle it in JS

    setLoading(true);
    setError("");

    try {
      // POST to /api/login with email and password
      const res = await api.post("/login", loginData);

      // Laravel returns { token, user, business }
      setToken(res.data.token);
      // Save token to Zustand (and localStorage via persist)

      setUser({
        ...res.data.user,
        business: res.data.business,
      });
      // Save user info globally

      navigate("/");
      // Redirect to dashboard
    } catch (err) {
      // Laravel returns validation errors in err.response.data.errors
      // or a message in err.response.data.message
      if (err.response?.data?.errors?.email) {
        setError(err.response.data.errors.email[0]);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      // finally runs whether request succeeded or failed
    }
  };

  // REGISTER SUBMIT
  const handleRegister = async (e) => {
    e.preventDefault();

    // Client-side validation before sending to server
    if (registerData.password !== registerData.password_confirmation) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/register", registerData);

      setToken(res.data.token);
      setUser({
        ...res.data.user,
        business: res.data.business,
      });

      navigate("/");
    } catch (err) {
      // Laravel returns field-specific errors for validation failures
      const errors = err.response?.data?.errors;
      if (errors) {
        // Get first error from any field
        const firstError = Object.values(errors)[0][0];
        setError(firstError);
      } else {
        setError(err.response?.data?.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* LOGO */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Commerce</span>Flow
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Seller Dashboard — Bangladesh
          </p>
        </div>

        {/* CARD */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* TABS — Login / Register */}
          <div className="flex border-b border-border">
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError("");
                }}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors
                  ${
                    tab === t
                      ? "bg-background text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ERROR MESSAGE */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-destructive/10 border border-destructive/30
                             text-destructive text-sm rounded-lg px-4 py-3 mb-4"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* LOGIN FORM */}
            <AnimatePresence mode="wait">
              {tab === "login" && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        required
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      {/* Toggle password visibility */}
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                    {/* animate-spin = Tailwind class that rotates the icon */}
                    {/* gives visual feedback that a request is in progress */}
                  </Button>
                </motion.form>
              )}

              {/* REGISTER FORM */}
              {tab === "register" && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Your Name</label>
                    <Input
                      type="text"
                      name="name"
                      placeholder="Rahim Uddin"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Business Name</label>
                    <Input
                      type="text"
                      name="business_name"
                      placeholder="Rahim Fashion House"
                      value={registerData.business_name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        name="password"
                        placeholder="Min 8 characters"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <Input
                      type={showPass ? "text" : "password"}
                      name="password_confirmation"
                      placeholder="Repeat password"
                      value={registerData.password_confirmation}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CommerceFlow — Built for Bangladeshi sellers
        </p>
      </motion.div>
    </div>
  );
}
