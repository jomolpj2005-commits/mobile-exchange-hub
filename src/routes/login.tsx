import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Loader2, 
  Smartphone, 
  AlertCircle, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Globe, 
  Hash, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Boxes,
  Eye,
  EyeOff,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { login, isAuthenticated } from "@/api/auth";
import axios from "axios";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In / Register Customer | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Sign in or register for the NovaCell customer portal.",
      },
    ],
  }),
  component: LoginPage,
});

interface RegErrors {
  fullname?: string;
  email?: string;
  mobile?: string;
  altMobile?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  password?: string;
  confirmPassword?: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState("");

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [mobile, setMobile] = useState("");
  
  // Address & Alt Mobile & Security
  const [altMobile, setAltMobile] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field validation errors
  const [regErrors, setRegErrors] = useState<RegErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const BACKEND_URL = import.meta.env.VITE_ERP_URL || "";

  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: "/products" });
    }
  }, [navigate]);

  const validateRegForm = (): { isValid: boolean; errors: RegErrors } => {
    const errors: RegErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const pincodeRegex = /^[0-9]{6}$/;

    if (!fullname.trim() || fullname.trim().length < 2) {
      errors.fullname = "Full name must be at least 2 characters long";
    }

    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!mobile.trim() || !phoneRegex.test(mobile.trim())) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (altMobile.trim() && !phoneRegex.test(altMobile.trim())) {
      errors.altMobile = "Alternative mobile must be a valid 10-digit number";
    }

    if (!addressLine1.trim() || addressLine1.trim().length < 4) {
      errors.addressLine1 = "Please enter a complete address (min 4 characters)";
    }

    if (!city.trim() || city.trim().length < 2) {
      errors.city = "City name is required";
    }

    if (!state.trim() || state.trim().length < 2) {
      errors.state = "State name is required";
    }

    if (!pincode.trim() || !pincodeRegex.test(pincode.trim())) {
      errors.pincode = "Enter a valid 6-digit postal code";
    }

    if (!password || password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    const { errors } = validateRegForm();
    setRegErrors(errors);
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorModalMsg("");

    try {
      const res = await login(email, password);

      if (res && (res.message === "Logged In" || res.home_page || res.full_name)) {
        localStorage.setItem("erp_logged_in", "true");
        localStorage.setItem("active_dealer_email", email);
        localStorage.setItem("erp_user_fullname", res.full_name || email);

        toast.success("Successfully signed in!");
        navigate({ to: "/products" });
      } else {
        localStorage.removeItem("erp_logged_in");
        localStorage.removeItem("active_dealer_email");
        setErrorModalMsg("Invalid credentials or unregistered user. Please check your username and password.");
      }
    } catch (err: any) {
      localStorage.removeItem("erp_logged_in");
      localStorage.removeItem("active_dealer_email");
      setErrorModalMsg("Invalid credentials or unregistered user. Please check your username and password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    
    // Mark all fields as touched to display errors if any
    setTouchedFields({
      fullname: true,
      email: true,
      mobile: true,
      altMobile: true,
      addressLine1: true,
      city: true,
      state: true,
      pincode: true,
      password: true,
      confirmPassword: true,
    });

    const { isValid, errors } = validateRegForm();
    setRegErrors(errors);

    if (!isValid) {
      const errorList = Object.values(errors).map((err) => `• ${err}`).join("\n");
      setErrorModalMsg(`Please correct the following errors before submitting:\n\n${errorList}`);
      return;
    }

    setLoading(true);
    setErrorModalMsg("");
    try {
      await axios.get(`${BACKEND_URL}/api/method/mobile_management.api.register_dealer`, {
        params: {
          email: email.trim(),
          fullname: fullname.trim(),
          password,
          mobile_no: mobile.trim(),
          alt_mobile_no: altMobile.trim(),
          address_line1: addressLine1.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim()
        },
        withCredentials: true
      });
      
      toast.success("Account created successfully! Please sign in with your registered email and password.");
      setActiveTab("login");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const serverMsg = err.response?.data?._server_messages;
      let msg = err.response?.data?.exception || err.message || "Registration failed. Try again.";
      if (serverMsg) {
        try {
          const parsed = JSON.parse(JSON.parse(serverMsg)[0]);
          msg = parsed.message || msg;
        } catch (e) {
          // ignore
        }
      }
      setErrorModalMsg(msg.includes("already exists") ? "An account with this email address already exists. Please sign in." : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 font-sans selection:bg-primary selection:text-white">
      
      {/* Left Modern Sidebar */}
      <div className="relative hidden lg:col-span-5 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 text-white lg:flex">
        {/* Glowing Background Orbs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        
        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
            <Smartphone className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              NovaCell ERP
            </span>
            <p className="text-[10px] font-mono tracking-widest text-blue-400 uppercase">
              Mobile Management Suite
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 my-auto space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 backdrop-blur-md">
            <Zap className="h-3.5 w-3.5 fill-blue-400" /> Powered by ERPNext v16
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Manufacturing, Refurbishment & Customer Portal
          </h2>

          <p className="text-sm text-slate-300/90 leading-relaxed">
            Standardizing exchange valuations, stock entry, disassembly BOMs, and customer ordering flows in one unified platform.
          </p>

          {/* Feature Bullets */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span>Automated Exchange Valuation & Approval</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Boxes className="h-4 w-4" />
              </div>
              <span>Real-Time Warehouse Stock Positions</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Zap className="h-4 w-4" />
              </div>
              <span>Direct Customer Sales Order Fulfillment</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          <span>Frappe REST API v16</span>
          <span className="font-mono text-[11px] text-slate-400">v1.2.0</span>
        </div>
      </div>

      {/* Right Content Section */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 relative bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        
        {/* Top Header Prompt */}
        <div className="flex justify-end items-center text-sm font-medium text-slate-600 dark:text-slate-400">
          {activeTab === "login" ? (
            <div className="flex items-center gap-2">
              <span>If you don't have an account:</span>
              <button
                type="button"
                onClick={() => { setActiveTab("register"); setErrorModalMsg(""); }}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold hover:underline transition-all"
              >
                Register First <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Already registered?</span>
              <button
                type="button"
                onClick={() => { setActiveTab("login"); setErrorModalMsg(""); }}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold hover:underline transition-all"
              >
                Sign In <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Form Container */}
        <div className="my-auto mx-auto w-full max-w-xl space-y-6 pt-4 pb-8">
          
          {activeTab === "login" ? (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Sign In to NovaCell
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Enter your registered customer account credentials.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email or Username
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@company.com"
                      className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-10 shadow-md shadow-blue-500/20 transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>

              {/* Bottom Register Banner Link */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setActiveTab("register"); setErrorModalMsg(""); }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 ml-1"
                  >
                    Register First <ArrowRight className="h-3 w-3" />
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Register Customer Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Fill in your registration details to create a new customer profile.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5" noValidate>
                
                {/* Section 1: Personal & Contact */}
                <div className="bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <User className="h-3.5 w-3.5" /> Personal & Contact Information
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <Label htmlFor="fullname" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Full Name <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="fullname"
                          value={fullname}
                          onChange={(e) => {
                            setFullname(e.target.value);
                            if (touchedFields.fullname) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("fullname")}
                          placeholder="John Doe"
                          className={`pl-9 bg-white dark:bg-slate-950 ${
                            touchedFields.fullname && regErrors.fullname 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                      </div>
                      {touchedFields.fullname && regErrors.fullname && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.fullname}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <Label htmlFor="reg-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Address <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="reg-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (touchedFields.email) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("email")}
                          placeholder="customer@company.com"
                          className={`pl-9 bg-white dark:bg-slate-950 ${
                            touchedFields.email && regErrors.email 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                      </div>
                      {touchedFields.email && regErrors.email && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Primary Mobile */}
                    <div className="space-y-1">
                      <Label htmlFor="mobile" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Mobile Number <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="mobile"
                          value={mobile}
                          onChange={(e) => {
                            setMobile(e.target.value);
                            if (touchedFields.mobile) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("mobile")}
                          placeholder="10-digit mobile no"
                          className={`pl-9 bg-white dark:bg-slate-950 ${
                            touchedFields.mobile && regErrors.mobile 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                      </div>
                      {touchedFields.mobile && regErrors.mobile && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.mobile}
                        </p>
                      )}
                    </div>

                    {/* Alt Mobile */}
                    <div className="space-y-1">
                      <Label htmlFor="alt_mobile" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Alternative Mobile <span className="text-slate-400 font-normal">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="alt_mobile"
                          value={altMobile}
                          onChange={(e) => {
                            setAltMobile(e.target.value);
                            if (touchedFields.altMobile) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("altMobile")}
                          placeholder="Optional 10-digit no"
                          className={`pl-9 bg-white dark:bg-slate-950 ${
                            touchedFields.altMobile && regErrors.altMobile 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                      </div>
                      {touchedFields.altMobile && regErrors.altMobile && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.altMobile}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Delivery & Business Address */}
                <div className="bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <MapPin className="h-3.5 w-3.5" /> Delivery Address
                  </h3>

                  <div className="space-y-1">
                    <Label htmlFor="address_line1" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Address Line 1 <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="address_line1"
                        value={addressLine1}
                        onChange={(e) => {
                          setAddressLine1(e.target.value);
                          if (touchedFields.addressLine1) validateRegForm();
                        }}
                        onBlur={() => handleFieldBlur("addressLine1")}
                        placeholder="Flat / Shop No, Street Name"
                        className={`pl-9 bg-white dark:bg-slate-950 ${
                          touchedFields.addressLine1 && regErrors.addressLine1 
                            ? "border-rose-500 focus-visible:ring-rose-500" 
                            : ""
                        }`}
                      />
                    </div>
                    {touchedFields.addressLine1 && regErrors.addressLine1 && (
                      <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.addressLine1}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* City */}
                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        City <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (touchedFields.city) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("city")}
                          placeholder="Kochi"
                          className={`pl-9 bg-white dark:bg-slate-950 ${
                            touchedFields.city && regErrors.city 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                      </div>
                      {touchedFields.city && regErrors.city && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.city}
                        </p>
                      )}
                    </div>

                    {/* State */}
                    <div className="space-y-1">
                      <Label htmlFor="state" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        State <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => {
                            setState(e.target.value);
                            if (touchedFields.state) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("state")}
                          placeholder="Kerala"
                          className={`pl-9 bg-white dark:bg-slate-950 ${
                            touchedFields.state && regErrors.state 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                      </div>
                      {touchedFields.state && regErrors.state && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.state}
                        </p>
                      )}
                    </div>

                    {/* Pincode */}
                    <div className="space-y-1">
                      <Label htmlFor="pincode" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pincode <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="pincode"
                          value={pincode}
                          onChange={(e) => {
                            setPincode(e.target.value);
                            if (touchedFields.pincode) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("pincode")}
                          placeholder="682001"
                          className={`pl-9 bg-white dark:bg-slate-950 ${
                            touchedFields.pincode && regErrors.pincode 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                      </div>
                      {touchedFields.pincode && regErrors.pincode && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.pincode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Security & Password */}
                <div className="bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Lock className="h-3.5 w-3.5" /> Account Security
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Password */}
                    <div className="space-y-1">
                      <Label htmlFor="reg-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Choose Password <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (touchedFields.password) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("password")}
                          placeholder="Min 6 characters"
                          className={`pl-9 pr-10 bg-white dark:bg-slate-950 ${
                            touchedFields.password && regErrors.password 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {touchedFields.password && regErrors.password && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Confirm Password <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (touchedFields.confirmPassword) validateRegForm();
                          }}
                          onBlur={() => handleFieldBlur("confirmPassword")}
                          placeholder="Re-enter password"
                          className={`pl-9 pr-10 bg-white dark:bg-slate-950 ${
                            touchedFields.confirmPassword && regErrors.confirmPassword 
                              ? "border-rose-500 focus-visible:ring-rose-500" 
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {touchedFields.confirmPassword && regErrors.confirmPassword && (
                        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" /> {regErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-11 shadow-md shadow-blue-500/20 transition-all duration-200 text-sm mt-2" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Register Customer Account
                </Button>
              </form>

              {/* Bottom Sign In Link */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setActiveTab("login"); setErrorModalMsg(""); }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-2">
          © {new Date().getFullYear()} NovaCell ERP. All rights reserved.
        </div>
      </div>

      {/* Error Message Modal Dialog */}
      <Dialog open={Boolean(errorModalMsg)} onOpenChange={(open) => { if (!open) setErrorModalMsg(""); }}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
              <AlertCircle className="h-5 w-5" />
              Registration / Sign In Failed
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {errorModalMsg}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="default" onClick={() => setErrorModalMsg("")} className="w-full sm:w-auto font-semibold">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}