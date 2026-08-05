import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password, rememberMe);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Invalid email or password"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-700 bg-[radial-gradient(60rem_40rem_at_20%_0%,#4c4670,transparent),radial-gradient(50rem_36rem_at_90%_100%,#312c50,transparent)] px-4">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-white">
          <img src="/tbp-logo.png" alt="TBP logo" className="h-14 w-14 rounded-2xl bg-white object-contain p-1.5 shadow-pop" />
          <h1 className="mt-4 text-[20px] font-semibold tracking-tight">TBP ERP</h1>
          <p className="mt-1 text-[12.5px] text-white/60">The Building Practice Limited · Staff workspace</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white p-6 shadow-pop">
          <label className="mb-4 block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink-600">Work email</span>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@tbp.ng"
                className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9.5 pr-3 text-[13.5px] focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20" />
            </div>
          </label>

          <label className="mb-3 block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink-600">Password</span>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input type={showPassword ? "text" : "password"} required minLength={8} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9.5 pr-10 text-[13.5px] focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600 cursor-pointer" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <label className="mb-4 flex items-center gap-2 text-[12.5px] text-ink-600">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-3.5 w-3.5 rounded accent-accent-500" />
            Keep me signed in for 30 days
          </label>

          {error ? <p className="mb-3 rounded-xl bg-danger-50 px-3 py-2 text-[12.5px] text-danger-500">{error}</p> : null}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            <Building2 size={16} /> {busy ? "Signing in…" : "Sign in to workspace"}
          </Button>

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-ink-400">
            Forgot your password? Ask HR to trigger a reset from the People page.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
