import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get token and email from URL params
  // URL looks like: /reset-password?token=abc123&email=user@email.com
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });

  // If no token in URL, redirect to login
  useEffect(() => {
    if (!token || !email) {
      navigate("/login");
    }
  }, [token, email, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/reset-password", {
        token,
        email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "This reset link is invalid or has expired. Please request a new one.",
      );
    } finally {
      setLoading(false);
    }
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
            Reset your password
          </p>
        </div>

        <div
          className="bg-card border border-border rounded-2xl
                        shadow-sm p-6"
        >
          {success ? (
            // Success state
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
              <div>
                <p className="font-semibold text-base">
                  Password reset successfully!
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Redirecting you to the login page...
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate("/login")}>
                Go to Sign In
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold mb-1">Set new password</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Enter your new password for{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>

              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-2 bg-destructive/10
                               border border-destructive/30 text-destructive
                               text-sm rounded-lg px-4 py-3 mb-4"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      name="password"
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={handleChange}
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
                    Confirm New Password
                  </label>
                  <Input
                    type={showPass ? "text" : "password"}
                    name="password_confirmation"
                    placeholder="Repeat new password"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full text-sm text-muted-foreground
                             hover:text-foreground transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
