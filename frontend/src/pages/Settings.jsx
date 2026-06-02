import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Building2,
  Truck,
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import useAuthStore from "@/store/authStore";
import api from "@/lib/api";

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg bg-primary/10 flex
                            items-center justify-center"
            >
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function SaveMessage({ message }) {
  if (!message) return null;
  const isSuccess = message.type === "success";
  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium
      ${isSuccess ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      {message.text}
    </div>
  );
}

export default function Settings() {
  const { user, setUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [business, setBusiness] = useState({
    name: "",
    whatsapp_number: "",
    facebook_page_id: "",
    instagram_id: "",
  });
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessMsg, setBusinessMsg] = useState(null);

  const [testingSteadFast, setTestingSteadFast] = useState(false);
  const [steadFastMsg, setSteadFastMsg] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        setSettings(res.data);
        setProfileName(res.data.user.name);
        setBusiness({
          name: res.data.business.name || "",
          whatsapp_number: res.data.business.whatsapp_number || "",
          facebook_page_id: res.data.business.facebook_page_id || "",
          instagram_id: res.data.business.instagram_id || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await api.put("/settings/profile", { name: profileName });
      setUser({ ...user, name: res.data.user.name });
      setProfileMsg({ type: "success", text: "Profile updated!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    setSavingBusiness(true);
    setBusinessMsg(null);
    try {
      await api.put("/settings/business", business);
      setBusinessMsg({ type: "success", text: "Business updated!" });
    } catch (err) {
      setBusinessMsg({ type: "error", text: "Failed to update business." });
    } finally {
      setSavingBusiness(false);
      setTimeout(() => setBusinessMsg(null), 3000);
    }
  };

  const handleTestSteadFast = async () => {
    setTestingSteadFast(true);
    setSteadFastMsg(null);
    try {
      const res = await api.post("/settings/test-steadfast");
      setSteadFastMsg({
        type: "success",
        text: `Connected! Balance: ${res.data.balance}`,
      });
    } catch (err) {
      setSteadFastMsg({
        type: "error",
        text: err.response?.data?.message || "Connection failed.",
      });
    } finally {
      setTestingSteadFast(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Manage your profile, business and integrations"
      />

      {/* PROFILE */}
      <SettingsSection
        icon={User}
        title="Your Profile"
        description="Update your seller account name"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={settings?.user.email || ""}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={savingProfile}
              className="gap-1.5"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Profile
                </>
              )}
            </Button>
            <SaveMessage message={profileMsg} />
          </div>
        </form>
      </SettingsSection>

      {/* BUSINESS */}
      <SettingsSection
        icon={Building2}
        title="Business Settings"
        description="Update your business profile and social channels"
      >
        <form onSubmit={handleSaveBusiness} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Business Name</label>
            <Input
              value={business.name}
              onChange={(e) =>
                setBusiness({ ...business, name: e.target.value })
              }
              placeholder="Your business name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">WhatsApp Number</label>
            <Input
              value={business.whatsapp_number}
              onChange={(e) =>
                setBusiness({
                  ...business,
                  whatsapp_number: e.target.value,
                })
              }
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Facebook Page ID</label>
              <Input
                value={business.facebook_page_id}
                onChange={(e) =>
                  setBusiness({
                    ...business,
                    facebook_page_id: e.target.value,
                  })
                }
                placeholder="Page ID"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Instagram ID</label>
              <Input
                value={business.instagram_id}
                onChange={(e) =>
                  setBusiness({
                    ...business,
                    instagram_id: e.target.value,
                  })
                }
                placeholder="Instagram username"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={savingBusiness}
              className="gap-1.5"
            >
              {savingBusiness ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Business
                </>
              )}
            </Button>
            <SaveMessage message={businessMsg} />
          </div>
        </form>
      </SettingsSection>

      {/* STEADFAST */}
      <SettingsSection
        icon={Truck}
        title="SteadFast Courier"
        description="Configure your SteadFast API integration"
      >
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm
          ${
            settings?.integrations.steadfast_configured
              ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
              : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0
            ${
              settings?.integrations.steadfast_configured
                ? "bg-green-500"
                : "bg-amber-500"
            }`}
          />
          {settings?.integrations.steadfast_configured
            ? settings?.integrations.steadfast_test_mode
              ? "Connected — Test mode active"
              : "Connected — Live mode active"
            : "Not configured — using test mode"}
        </div>

        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <p
            className="text-xs font-medium text-muted-foreground
                        uppercase tracking-wider"
          >
            API Keys Location
          </p>
          <p className="text-sm text-muted-foreground">
            SteadFast API keys are stored in your server
            <span
              className="font-mono text-xs bg-muted px-1.5 py-0.5
                             rounded mx-1"
            >
              .env
            </span>
            file for security.
          </p>
          <div
            className="text-xs font-mono bg-muted rounded p-3
                          space-y-1 text-muted-foreground"
          >
            <p>STEADFAST_API_KEY=your_key</p>
            <p>STEADFAST_SECRET_KEY=your_secret</p>
            <p>STEADFAST_TEST_MODE=false</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestSteadFast}
            disabled={testingSteadFast}
            className="gap-1.5"
          >
            {testingSteadFast ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...
              </>
            ) : (
              <>
                <Truck className="w-3.5 h-3.5" /> Test Connection
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => window.open("https://steadfast.com.bd", "_blank")}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            SteadFast Portal
            <ExternalLink className="w-3 h-3" />
          </button>

          <SaveMessage message={steadFastMsg} />
        </div>
      </SettingsSection>

      {/* EMAIL */}
      <SettingsSection
        icon={Mail}
        title="Email Notifications"
        description="Configure how order emails are sent to customers"
      >
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm
          ${
            settings?.integrations.mail_configured
              ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0
            ${
              settings?.integrations.mail_configured
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />
          {settings?.integrations.mail_configured
            ? `Sending from: ${settings.integrations.mail_from}`
            : "Email not configured"}
        </div>

        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <p
            className="text-xs font-medium text-muted-foreground
                        uppercase tracking-wider"
          >
            Emails sent automatically when
          </p>
          <div className="space-y-1.5">
            {[
              { status: "Confirmed", color: "bg-green-500" },
              { status: "Shipped", color: "bg-blue-500" },
              { status: "Delivered", color: "bg-emerald-500" },
              { status: "Cancelled", color: "bg-red-500" },
              { status: "Returned", color: "bg-orange-500" },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">
                  Order status changes to {item.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Email only sends if customer has an email address saved.
          </p>
        </div>

        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <p
            className="text-xs font-medium text-muted-foreground
                        uppercase tracking-wider"
          >
            Mail Configuration
          </p>
          <div
            className="text-xs font-mono bg-muted rounded p-3
                          space-y-1 text-muted-foreground"
          >
            <p>MAIL_MAILER=resend</p>
            <p>RESEND_API_KEY=re_xxxxxxxx</p>
            <p>MAIL_FROM_ADDRESS=you@domain.com</p>
          </div>
          <button
            type="button"
            onClick={() => window.open("https://resend.com", "_blank")}
            className="flex items-center gap-1 text-xs text-primary
                       hover:underline mt-1"
          >
            Get Resend API Key
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
