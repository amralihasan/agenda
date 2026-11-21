import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  Loader2,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { api, setToken } from '../../services/api';
import { setAppLanguage } from '../../i18n/i18n';
import { AuthUser } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  sessionExpired?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  sessionExpired = false,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [email, setEmail] = useState('eng.amralihassan@gmail.com');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await api.login({ email: email.trim(), password });
      setToken(result.token, rememberMe);
      onLoginSuccess(result.user);
    } catch (err: any) {
      if (err?.message === 'Invalid email or password') {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(t('auth.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setAppLanguage(isRtl ? 'en' : 'ar');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#1a0302] p-4 sm:p-6 relative overflow-hidden select-text">
      {/* Desk shadow & leather ambience */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(131,38,19,0.28),transparent_55%)]"></div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(197,160,89,0.06)_50%,transparent_60%)]"></div>

      {/* Language switch */}
      <button
        type="button"
        onClick={toggleLanguage}
        className="absolute top-4 end-4 sm:top-6 sm:end-6 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#380a08]/90 hover:bg-[#490800] border border-[#c5a059]/35 text-[11px] font-label-mono uppercase tracking-wider text-[#fcf9f3] transition-colors"
        title={isRtl ? 'English' : 'العربية'}
      >
        <Languages className="w-3.5 h-3.5 text-[#c5a059]" />
        <span>{isRtl ? 'English' : 'العربية'}</span>
      </button>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="bg-[#fcf9f3] border border-[#c5a059]/60 shadow-[0_30px_80px_rgba(0,0,0,0.65)] rounded-sm overflow-hidden">
          {/* Brass top rule */}
          <div className="h-1.5 bg-gradient-to-r from-[#8a6a32] via-[#c5a059] to-[#8a6a32]"></div>

          <div className="p-7 sm:p-9">
            {/* Crest */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#380a08] border border-[#c5a059]/60 flex items-center justify-center shadow-inner">
                <BookOpen className="w-6 h-6 text-[#c5a059]" />
              </div>
              <span className="mt-4 font-caption-caps text-[10px] uppercase tracking-[0.28em] text-[#832613] font-bold">
                {t('auth.eyebrow')}
              </span>
              <h1 className="mt-1 font-headline-lg text-2xl sm:text-3xl text-[#1e2229] leading-tight">
                {t('app.title')}
              </h1>
              <p className="mt-1 font-body-script text-sm italic text-[#675d52]">
                {t('auth.folioTitle')}
              </p>
            </div>

            <div className="mt-7 h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/60 to-transparent"></div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {sessionExpired && !error && (
                <div className="flex items-start gap-2 p-2.5 rounded-sm bg-[#fdf2e9] border border-[#c5a059]/40 text-[11px] text-[#7a4a12]">
                  <LockKeyhole className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('auth.sessionExpired')}</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-sm bg-[#ffdad6] border border-[#ba1a1a]/25 text-[11px] text-[#93000a]">
                  <LockKeyhole className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block font-caption-caps text-[10px] uppercase tracking-widest text-[#675d52] mb-1 font-semibold"
                >
                  {t('auth.email')}
                </label>
                <div className="flex items-center gap-2 bg-[#f6f3ed] border border-[#e5e2dc] focus-within:border-[#832613] px-3 py-2 rounded-sm transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[#832613] shrink-0" />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    className="w-full bg-transparent border-0 p-0 font-body-script text-sm text-[#080c12] focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block font-caption-caps text-[10px] uppercase tracking-widest text-[#675d52] mb-1 font-semibold"
                >
                  {t('auth.password')}
                </label>
                <div className="flex items-center gap-2 bg-[#f6f3ed] border border-[#e5e2dc] focus-within:border-[#832613] px-3 py-2 rounded-sm transition-colors">
                  <KeyRound className="w-3.5 h-3.5 text-[#832613] shrink-0" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    className="w-full bg-transparent border-0 p-0 font-body-script text-sm text-[#080c12] focus:outline-none"
                    placeholder={isRtl ? 'أدخل كلمة المرور' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-0.5 text-[#675d52] hover:text-[#832613] transition-colors shrink-0"
                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-body-script text-[#45474b] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#832613]"
                />
                <span>{t('auth.rememberMe')}</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#832613] hover:bg-[#6e1e0d] disabled:opacity-70 disabled:cursor-wait text-[#fcf9f3] rounded-sm font-label-stamp text-xs uppercase tracking-[0.18em] shadow-md transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('auth.signingIn')}</span>
                  </>
                ) : (
                  <span>{t('auth.signIn')}</span>
                )}
              </button>
            </form>

            <div className="mt-7 h-[1px] bg-gradient-to-r from-transparent via-[#e5e2dc] to-transparent"></div>
            <p className="mt-4 text-center font-label-mono text-[10px] uppercase tracking-widest text-[#675d52]/70">
              {t('app.bookbinding')}
            </p>
          </div>
        </div>

        <p className="mt-4 text-center font-body-script text-[11px] italic text-[#c5a059]/60">
          {isRtl
            ? 'دخول خاص للمالك الوحيد للسجل'
            : 'Private access · sole owner of the ledger'}
        </p>
      </div>
    </div>
  );
};
