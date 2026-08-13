"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, ReactNode, Suspense, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { getAuthDestination, withAuthDestination } from "./auth-redirect";

type AuthPageProps = { mode: "sign-in" | "sign-up" };
type AuthError = { errors?: Array<{ code?: string; longMessage?: string; message?: string }> };
type OAuthProvider = "google" | "github";

function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Authentication is taking longer than expected. Check your connection or disable extensions that block Clerk, then try again.")), milliseconds);
    promise.then((value) => { clearTimeout(timeout); resolve(value); }, (caught) => { clearTimeout(timeout); reject(caught); });
  });
}

export function AuthPage({ mode }: AuthPageProps) {
  return <main className="min-h-screen bg-background text-foreground">
    <div className="h-[6px] bg-chrome-850" />
    <header className="h-[74px] border-b border-line bg-background px-5 sm:px-8 lg:px-12"><div className="mx-auto flex h-full max-w-[1184px] items-center justify-between"><Link aria-label="System Design Copilot home" href="/"><BrandMark /></Link><Link className="inline-flex items-center gap-2 text-[14px] font-medium text-text-muted hover:text-foreground" href="/challenges"><ArrowLeft aria-hidden="true" size={16} />Back to Challenge</Link></div></header>
    <section className="flex min-h-[calc(100vh-136px)] items-center justify-center bg-background px-5 py-9 sm:px-8"><AuthForm mode={mode} /></section>
    <footer className="flex h-14 items-center justify-between border-t border-line bg-background px-5 text-[12px] text-text-muted sm:px-12"><span>Public personal beta</span><nav aria-label="Authentication footer" className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/help">Help</Link></nav></footer>
  </main>;
}

export function AuthStatePage({ state }: { state: "password-reset" | "verify-email" | "set-new-password" }) {
  return <main className="min-h-screen bg-background text-foreground"><div className="h-[6px] bg-chrome-850" /><header className="h-[74px] border-b border-line bg-background px-5 sm:px-8 lg:px-12"><div className="mx-auto flex h-full max-w-[1184px] items-center justify-between"><Link aria-label="System Design Copilot home" href="/"><BrandMark /></Link><Link className="inline-flex items-center gap-2 text-[14px] font-medium text-text-muted hover:text-foreground" href="/sign-in"><ArrowLeft aria-hidden="true" size={16} />Back to sign in</Link></div></header><section className="flex min-h-[calc(100vh-136px)] items-center justify-center px-5 py-9 sm:px-8"><Suspense fallback={<p className="text-sm text-text-muted">Loading account recovery...</p>}><AuthStateForm state={state} /></Suspense></section><footer className="flex h-14 items-center justify-between border-t border-line bg-background px-5 text-[12px] text-text-muted sm:px-12"><span>Public personal beta</span><span>Authentication managed securely</span></footer></main>;
}

function AuthStateForm({ state }: { state: "password-reset" | "verify-email" | "set-new-password" }) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const destination = getAuthDestination(searchParams);
  const resetFlow = state !== "password-reset" && searchParams.get("flow") === "reset";
  const challenge = searchParams.get("challenge")?.trim().slice(0, 120) ?? "";
  const contextLabel = challenge || (state === "password-reset" ? "Account recovery" : state === "verify-email" ? (resetFlow ? "Password reset verification" : "Email verification") : "Password reset continuation");
  const titles = { "password-reset": "Reset your password", "verify-email": "Check your email", "set-new-password": "Choose a new password" };
  const descriptions = { "password-reset": "We’ll send a secure verification code to your email address.", "verify-email": "Enter the six-digit code we sent to complete verification.", "set-new-password": "Create a unique password. Your password stays with Clerk." };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (state === "password-reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (state === "verify-email" && !/^\d{6}$/.test(code)) return setError("Enter the 6-digit verification code.");
    if (state === "set-new-password" && password.length < 8) return setError("Your password must be at least 8 characters.");
    if (state === "set-new-password" && password !== confirmPassword) return setError("Your passwords do not match.");
    setPending(true);
    try {
      if (state === "password-reset") { const result = await signIn.create({ identifier: email.trim() }); if (result.error) throw result.error; const sent = await signIn.resetPasswordEmailCode.sendCode(); if (sent.error) throw sent.error; router.push(withAuthDestination("/verify-email?flow=reset", destination)); }
      else if (state === "verify-email") { const result = resetFlow ? await signIn.resetPasswordEmailCode.verifyCode({ code }) : await signUp.verifications.verifyEmailCode({ code }); if (result.error) throw result.error; if (!resetFlow) { await signUp.finalize(); router.push(destination); } else router.push(withAuthDestination("/set-new-password?flow=reset", destination)); }
      else { const result = await signIn.resetPasswordEmailCode.submitPassword({ password }); if (result.error) throw result.error; await signIn.finalize(); router.push(destination); }
    } catch (caught) { const authError = caught as AuthError; setError(authError.errors?.[0]?.longMessage ?? authError.errors?.[0]?.message ?? "We could not complete that request. Try again."); } finally { setPending(false); }
  };
  const resend = async () => { setError(""); setPending(true); try { const result = resetFlow ? await signIn.resetPasswordEmailCode.sendCode() : await signUp.verifications.sendEmailCode(); if (result.error) throw result.error; } catch (caught) { const authError = caught as AuthError; setError(authError.errors?.[0]?.longMessage ?? "We could not resend the code."); } finally { setPending(false); } };
  return <div className="w-full max-w-[440px]"><div className="mb-5 border-b border-line pb-4"><p className="font-mono text-[11px] tracking-[0.14em] text-signal">{state === "password-reset" ? "RECOVER YOUR ACCOUNT" : state === "verify-email" ? "VERIFY YOUR ACCOUNT" : "RESET LINK VERIFIED"}</p><p className="mt-2 text-[14px] font-semibold">{contextLabel}</p></div><div className="mb-6 grid gap-2"><h1 className="font-display text-[34px] font-medium leading-[1.15] tracking-[-0.035em]">{titles[state]}</h1><p className="text-[15px] leading-[1.45] text-text-muted">{descriptions[state]}</p></div><form className="grid gap-5" noValidate onSubmit={submit}>{state === "password-reset" && <Field label="Email address"><input autoComplete="email" className="auth-input" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></Field>}{state === "verify-email" && <Field label="Verification code"><input autoComplete="one-time-code" className="auth-input auth-code-input" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} placeholder="000000" required value={code} /></Field>}{state === "set-new-password" && <><Field label="New password"><input autoComplete="new-password" className="auth-input" onChange={(event) => setPassword(event.target.value)} placeholder="Create a new password" required type="password" value={password} /></Field><Field label="Confirm new password"><input autoComplete="new-password" className="auth-input" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" required type="password" value={confirmPassword} /></Field></>}<SubmitButton label={state === "password-reset" ? "Send reset link" : state === "verify-email" ? "Verify and continue" : "Update password and continue"} pending={pending} /></form>{state === "verify-email" && <button className="mx-auto mt-4 block text-[13px] font-semibold text-signal hover:underline" disabled={pending} onClick={resend} type="button">Resend code</button>}{error && <p aria-live="assertive" className="mt-4 border-l-2 border-danger bg-[#f5e3e0] px-3 py-2 text-[12px] leading-5 text-danger" role="alert">{error}</p>}<p className="mt-5 text-center text-[13px] text-text-muted">{state === "password-reset" ? "Remember your password?" : "Need to start again?"} <Link className="font-semibold text-signal hover:underline" href={withAuthDestination("/sign-in", destination)}>Back to sign in</Link></p></div>;
}

function AuthForm({ mode }: AuthPageProps) {
  const isSignIn = mode === "sign-in";
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = getAuthDestination(searchParams);
  const { loaded: clerkLoaded } = useClerk();
  const challenge = searchParams.get("challenge")?.trim().slice(0, 120) ?? "";
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null);
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const [verification, setVerification] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"idle" | "start" | "code" | "new-password">("idle");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (clerkLoaded) return;
    const timeout = setTimeout(() => setClerkTimedOut(true), 8000);
    return () => clearTimeout(timeout);
  }, [clerkLoaded]);
  const message = (caught: unknown, fallback: string) => {
    if (caught instanceof Error && caught.message) return caught.message;
    const authError = caught as AuthError;
    const code = authError.errors?.[0]?.code;
    if (code === "oauth_provider_not_enabled") {
      return "This OAuth provider is not enabled for sign-in. In Clerk, open SSO connections and enable Google/GitHub for both sign-up and sign-in.";
    }
    if (code === "oauth_config_missing" || code === "misconfigured_oauth_provider") {
      return "This OAuth provider is not configured correctly in Clerk. Check its connection settings and enable it for sign-in.";
    }
    if (code === "oauth_invalid_redirect_uri" || code === "oauth_malformed_redirect_uri") {
      return "Clerk rejected the OAuth return URL. Add this app URL to the allowed redirect URLs in Clerk, then restart the app.";
    }
    if (code === "captcha_invalid") {
      return "The security check could not be completed. Refresh this page, complete the challenge, and try again. If it continues, disable browser extensions or use another browser.";
    }
    return authError.errors?.[0]?.longMessage ?? authError.errors?.[0]?.message ?? fallback;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if ((recoveryStep === "start" || (recoveryStep === "idle" && !verification)) && !emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (recoveryStep === "new-password" && newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (recoveryStep === "new-password" && newPassword !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    if (recoveryStep === "code" && !/^\d{6}$/.test(recoveryCode)) {
      setError("Enter the 6-digit reset code.");
      return;
    }
    if (recoveryStep === "idle" && verification && !/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code.");
      return;
    }
    if (recoveryStep === "idle" && !verification && password.length === 0) {
      setError(isSignIn ? "Enter your password." : "Create a password.");
      return;
    }
    if (recoveryStep === "idle" && !verification && !isSignIn && password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      if (isSignIn) {
        if (recoveryStep !== "idle") {
          if (recoveryStep === "start") {
            const result = await signIn.create({ identifier: email.trim() });
            if (result.error) throw result.error;
            const codeResult = await signIn.resetPasswordEmailCode.sendCode();
            if (codeResult.error) throw codeResult.error;
            setRecoveryStep("code");
          } else if (recoveryStep === "code") {
            const result = await signIn.resetPasswordEmailCode.verifyCode({ code: recoveryCode });
            if (result.error) throw result.error;
            setRecoveryStep("new-password");
          } else {
            const result = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword });
            if (result.error) throw result.error;
            await signIn.finalize();
            router.push(destination);
          }
          return;
        }
        const result = await signIn.password({ identifier: email.trim(), password });
        if (result.error) throw result.error;
        if (signIn.status === "complete") {
          await signIn.finalize();
          router.push(destination);
        }
      } else {
        if (!verification) {
          const result = await signUp.password({ emailAddress: email.trim(), password });
          if (result.error) throw result.error;
          await signUp.verifications.sendEmailCode();
          setVerification(true);
        } else {
          const result = await signUp.verifications.verifyEmailCode({ code });
          if (result.error) throw result.error;
          if (signUp.status === "complete") {
            await signUp.finalize();
            router.push(destination);
          }
        }
      }
    } catch (caught) {
      setError(message(caught, "We could not complete that request. Check your details and try again."));
    } finally {
      setPending(false);
    }
  };

  const oauth = async (provider: OAuthProvider) => {
    if (!clerkLoaded) {
      setError("Secure authentication is still loading. Check your connection and try again in a moment.");
      return;
    }
    setError("");
    setPending(true);
    setActiveProvider(provider);
    const strategy = provider === "google" ? "oauth_google" : "oauth_github";
    try {
      if (isSignIn) {
        const result = await withTimeout(signIn.sso({ strategy, redirectUrl: destination, redirectCallbackUrl: withAuthDestination("/sign-in/sso-callback", destination) }), 15000);
        if (result.error) throw result.error;
      } else {
        const result = await withTimeout(signUp.sso({ strategy, redirectUrl: destination, redirectCallbackUrl: withAuthDestination("/sign-in/sso-callback", destination) }), 15000);
        if (result.error) throw result.error;
      }
    } catch (caught) {
      setError(message(caught, "The provider could not start. Try again."));
    } finally {
      setPending(false);
      setActiveProvider(null);
    }
  };

  const resendCode = async () => {
    setError("");
    setPending(true);
    try {
      const result = recoveryStep === "code"
        ? await signIn.resetPasswordEmailCode.sendCode()
        : await signUp.verifications.sendEmailCode();
      if (result.error) throw result.error;
    } catch (caught) {
      setError(message(caught, "We could not resend the code. Try again."));
    } finally {
      setPending(false);
    }
  };

  const passwordAction = isSignIn
    ? <Link className="text-[11px] text-signal hover:underline" href={withAuthDestination("/password-reset", destination)}>Forgot password?</Link>
    : undefined;

  return <div className="w-full max-w-[440px]">
    {challenge && <div className="mb-5 border-b border-line pb-4"><p className="font-mono text-[11px] tracking-[0.14em] text-signal">{isSignIn ? "CONTINUE TO PRACTICE" : "START YOUR PRACTICE"}</p><p className="mt-2 text-[14px] font-semibold">{challenge}</p></div>}
    <div className="mb-5 flex flex-col gap-2"><h1 className="font-display text-[34px] font-medium leading-[1.15] tracking-[-0.035em]">{recoveryStep !== "idle" ? "Reset your password" : isSignIn ? "Sign in to begin your Workspace" : "Create your practice account"}</h1><p className="text-[15px] leading-[1.45] text-text-muted">{recoveryStep === "start" ? "We’ll send a verification code to your email address." : recoveryStep === "code" ? "Enter the six-digit code sent to your email address." : recoveryStep === "new-password" ? "Choose a new password for your account." : verification ? "Enter the six-digit code sent to your verified email address." : isSignIn ? "Your Challenge context will be waiting after authentication." : "Save private Workspaces, decisions, and evidence-backed Reviews."}</p></div>
    {recoveryStep !== "idle" ? <><form className="grid gap-5" noValidate onSubmit={submit}><Field label="Email address"><input autoComplete="email" className="auth-input" disabled={recoveryStep !== "start"} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></Field>{recoveryStep === "code" && <Field label="Verification code"><input autoComplete="one-time-code" className="auth-input auth-code-input" inputMode="numeric" maxLength={6} onChange={(event) => setRecoveryCode(event.target.value)} placeholder="000000" required value={recoveryCode} /></Field>}{recoveryStep === "new-password" && <><Field label="New password"><input autoComplete="new-password" className="auth-input" minLength={8} onChange={(event) => setNewPassword(event.target.value)} placeholder="Create a new password" required type="password" value={newPassword} /></Field><Field label="Confirm new password"><input autoComplete="new-password" className="auth-input" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" required type="password" value={confirmPassword} /></Field></>}<SubmitButton label={recoveryStep === "start" ? "Send reset code" : recoveryStep === "code" ? "Verify code" : "Set new password"} pending={pending} /></form>{recoveryStep === "code" && <button className="mx-auto mt-4 block text-[13px] font-semibold text-signal hover:underline" disabled={pending} onClick={resendCode} type="button">Resend code</button>}</> : verification ? <><form className="grid gap-5" noValidate onSubmit={submit}><Field label="Verification code"><input autoComplete="one-time-code" className="auth-input auth-code-input" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} placeholder="000000" required value={code} /></Field><SubmitButton label="Verify email" pending={pending} /></form><button className="mx-auto mt-4 block text-[13px] font-semibold text-signal hover:underline" disabled={pending} onClick={resendCode} type="button">Resend code</button></> : <>
      <div className="grid grid-cols-2 gap-[10px]"><button aria-busy={activeProvider === "google"} className="auth-provider" disabled={pending} onClick={() => oauth("google")} type="button">{activeProvider === "google" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <GoogleMark />}<span>{activeProvider === "google" ? "Connecting…" : "Google"}</span></button><button aria-busy={activeProvider === "github"} className="auth-provider" disabled={pending} onClick={() => oauth("github")} type="button">{activeProvider === "github" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <GitHubMark />}<span>{activeProvider === "github" ? "Connecting…" : "GitHub"}</span></button></div>
      {!clerkLoaded && <p aria-live="polite" className="mt-3 text-center text-[12px] text-text-muted" role="status">{clerkTimedOut ? "Secure authentication is unavailable. Check your connection, browser extensions, and try again." : "Preparing secure authentication…"}</p>}
      <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-line" /><span className="text-[12px] text-text-muted">or use email</span><span className="h-px flex-1 bg-line" /></div>
      {!isSignIn && <div aria-label="Security verification" className="auth-captcha" id="clerk-captcha" />}
      <form className="grid gap-4" noValidate onSubmit={submit}><Field label="Email address"><input autoComplete="email" className="auth-input" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></Field><Field action={passwordAction} label="Password"><span className="relative block"><input autoComplete={isSignIn ? "current-password" : "new-password"} className="auth-input pr-11" minLength={isSignIn ? undefined : 8} onChange={(event) => setPassword(event.target.value)} placeholder={isSignIn ? "Enter your password" : "Create a strong password"} required type={showPassword ? "text" : "password"} value={password} /><button aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <Eye size={16} /> : <EyeOff size={16} />}</button></span>{!isSignIn && <PasswordStrength password={password} />}</Field><SubmitButton label={isSignIn ? "Sign in securely" : "Create account"} pending={pending} /></form>
    </>}
    {error && <p aria-live="assertive" className="mt-4 border-l-2 border-danger bg-[#f5e3e0] px-3 py-2 text-[12px] leading-5 text-danger" role="alert">{error}</p>}
    <p className="mt-5 text-center text-[13px] text-text-muted">{isSignIn ? "New to System Design Copilot?" : "Already have an account?"} <Link className="font-semibold text-signal hover:underline" href={withAuthDestination(isSignIn ? "/sign-up" : "/sign-in", destination)}>{isSignIn ? "Create an account" : "Sign in"}</Link></p>
  </div>;
}

function Field({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) { return <label className="grid gap-2 text-[14px] font-medium text-foreground"><span className="flex items-center justify-between">{label}{action}</span>{children}</label>; }
function PasswordStrength({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!strength) return <p className="text-[11px] leading-4 text-text-muted">Use 8+ characters with a mix of letters, numbers, or symbols.</p>;
  return <div className="grid gap-1.5" aria-live="polite"><div aria-label={`Password strength: ${strength.label}`} aria-valuemax={5} aria-valuemin={0} aria-valuenow={strength.score} className="flex gap-1" role="progressbar">{Array.from({ length: 5 }, (_, index) => <span aria-hidden="true" className={`h-1 flex-1 rounded-full ${index < strength.score ? "bg-signal" : "bg-line"}`} key={index} />)}</div><p className="text-[11px] leading-4 text-text-muted">Password strength: <span className="font-semibold text-signal">{strength.label}</span></p></div>;
}
function getPasswordStrength(password: string) {
  if (!password) return null;
  const score = [password.length >= 8, password.length >= 12, /[a-z]/.test(password) && /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z\d]/.test(password)].filter(Boolean).length;
  return { score, label: score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong" };
}
function SubmitButton({ label, pending }: { label: string; pending: boolean }) { return <button className="flex h-12 items-center justify-center gap-2 rounded-[3px] bg-signal text-[15px] font-semibold text-white hover:bg-[#0c655e] disabled:cursor-wait disabled:opacity-70" disabled={pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <>{label}<ArrowRight aria-hidden="true" size={17} /></>}</button>; }
function GoogleMark() { return <svg aria-hidden="true" height="17" viewBox="0 0 24 24" width="17"><path d="M21.6 12.23c0-.7-.06-1.38-.18-2.03H12v3.84h5.38a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.99-4.27 2.99-7.33Z" fill="#4285F4" /><path d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.22-2.5c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.06v2.58A9.99 9.99 0 0 0 12 22Z" fill="#34A853" /><path d="M6.39 13.89A6 6 0 0 1 6.08 12c0-.66.11-1.3.31-1.89V7.53H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.47l3.33-2.58Z" fill="#FBBC05" /><path d="M12 5.98c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.99 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.53l3.33 2.58C7.18 7.74 9.39 5.98 12 5.98Z" fill="#EA4335" /></svg>; }
function GitHubMark() { return <svg aria-hidden="true" height="17" viewBox="0 0 24 24" width="17"><path d="M12 2.2a9.8 9.8 0 0 0-3.1 19.1c.49.09.67-.21.67-.47v-1.67c-2.73.6-3.3-1.16-3.3-1.16-.44-1.1-1.06-1.4-1.06-1.4-.87-.6.07-.59.07-.59.96.07 1.47.99 1.47.99.86 1.47 2.26 1.05 2.81.8.09-.63.34-1.05.61-1.29-2.18-.25-4.47-1.09-4.47-4.85 0-1.07.38-1.94 1-2.62-.1-.25-.43-1.25.1-2.59 0 0 .82-.26 2.69 1a9.25 9.25 0 0 1 4.9 0c1.87-1.27 2.69-1 2.69-1 .53 1.34.2 2.34.1 2.59.62.68 1 1.55 1 2.62 0 3.77-2.29 4.59-4.48 4.84.35.3.66.88.66 1.78v2.64c0 .26.18.56.67.47A9.8 9.8 0 0 0 12 2.2Z" fill="currentColor" /></svg>; }
