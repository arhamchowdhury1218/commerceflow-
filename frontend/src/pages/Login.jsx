import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/store/authStore";
import api from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  // tab: 'login' | 'register' | 'forgot'
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    business_name: "",
    password: "",
    password_confirmation: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/login", loginData);
      setToken(res.data.token);
      setUser({ ...res.data.user, business: res.data.business });
      navigate("/");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.email) setError(errors.email[0]);
      else setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.password_confirmation) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/register", registerData);
      setToken(res.data.token);
      setUser({ ...res.data.user, business: res.data.business });
      navigate("/");
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors)[0][0]
          : err.response?.data?.message || "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/forgot-password", { email: forgotEmail });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    setError("");
    setSuccess("");
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center
                    justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Commerce</span>Flow
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Seller Dashboard — Bangladesh
          </p>
        </div>

        <div
          className="bg-card border border-border rounded-2xl
                        shadow-sm overflow-hidden"
        >
          {/* Tabs — only show for login/register */}
          {tab !== "forgot" && (
            <div className="flex border-b border-border">
              {["login", "register"].map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-3.5 text-sm font-medium
                    transition-colors
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
          )}

          {/* Forgot password header */}
          {tab === "forgot" && (
            <div
              className="flex items-center gap-3 px-5 py-4
                            border-b border-border"
            >
              <button
                onClick={() => switchTab("login")}
                className="text-muted-foreground hover:text-foreground
                           transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">Reset Password</span>
            </div>
          )}

          <div className="p-6">
            {/* Error */}
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

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-50 dark:bg-green-950 border
                             border-green-200 dark:border-green-800
                             text-green-700 dark:text-green-300 text-sm
                             rounded-lg px-4 py-3 mb-4 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* LOGIN FORM */}
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
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Password</label>
                      {/* Forgot password link */}
                      <button
                        type="button"
                        onClick={() => switchTab("forgot")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
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
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </motion.form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {tab === "forgot" && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {!success ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enter your email address and we will send you a link
                          to reset your password.
                        </p>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => {
                              setForgotEmail(e.target.value);
                              setError("");
                            }}
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                            Sending...
                          </>
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>
                      <button
                        type="button"
                        onClick={() => switchTab("login")}
                        className="w-full text-sm text-muted-foreground
                                   hover:text-foreground transition-colors"
                      >
                        Back to Sign In
                      </button>
                    </form>
                  ) : (
                    // Success state — show confirmation
                    <div className="text-center space-y-4 py-2">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                      <div>
                        <p className="font-medium text-sm">Check your email</p>
                        <p className="text-muted-foreground text-sm mt-1">
                          We sent a reset link to{" "}
                          <span className="font-medium text-foreground">
                            {forgotEmail}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => switchTab("login")}
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  )}
                </motion.div>
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
