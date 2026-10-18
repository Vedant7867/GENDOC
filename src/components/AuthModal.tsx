import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { User, UserRole } from '../types';
import {
  findUserByEmail,
  saveRegisteredUser,
  setActiveSessionUser,
  DEFAULT_DEMO_USER,
} from '../utils/storage';
import {
  Lock,
  Mail,
  User as UserIcon,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  onAuthenticated: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthenticated }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Club Member');
  const [missingAccountError, setMissingAccountError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setMissingAccountError(null);
    setGeneralError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setGeneralError('Please enter your email address.');
      return;
    }

    if (!password) {
      setGeneralError('Please enter your password.');
      return;
    }

    // Check if account exists
    const existingUser = findUserByEmail(trimmedEmail);

    if (!existingUser) {
      setMissingAccountError(
        'No account found for this email. Please create a new account to access GENDOC (ACM- NIT SURAT).'
      );
      return;
    }

    // Check password if set (for demo ease, allow default password or matching)
    if (existingUser.password && existingUser.password !== password) {
      setGeneralError('Invalid password. Please check your credentials.');
      return;
    }

    // Successful sign in
    setActiveSessionUser(existingUser);
    onAuthenticated(existingUser);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setMissingAccountError(null);
    setGeneralError(null);

    if (!fullName.trim()) {
      setGeneralError('Please provide your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setGeneralError('Please provide a valid official email address.');
      return;
    }

    if (password.length < 6) {
      setGeneralError('Password should be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setGeneralError('Passwords do not match.');
      return;
    }

    const existingUser = findUserByEmail(email.trim());
    if (existingUser) {
      setGeneralError('An account with this email already exists. Please sign in instead.');
      return;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      password,
      avatarInitial: fullName.trim().charAt(0).toUpperCase() || 'U',
      createdAt: new Date().toISOString(),
    };

    saveRegisteredUser(newUser);
    setActiveSessionUser(newUser);
    setSuccessMessage('Account created successfully! Entering workspace...');
    setTimeout(() => {
      onAuthenticated(newUser);
    }, 600);
  };

  const handleDemoFill = () => {
    setEmail(DEFAULT_DEMO_USER.email);
    setPassword(DEFAULT_DEMO_USER.password || 'Password123!');
    setMissingAccountError(null);
    setGeneralError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Brand Panel */}
        <div className="md:col-span-5 bg-[#0B132B] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background decorative glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <BrandLogo size="lg" theme="dark" showSubtitle={true} />
            <div className="mt-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Sparkles size={13} className="text-blue-400" /> Official Club Portal
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
                Automated End-to-End Club Document Workflow
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generate department permissions, budget drafts, notices, and proposals with
                AI-assisted extraction and instant institutional formatting.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-slate-800/80">
            <div className="text-xs text-slate-400">
              <p className="font-semibold text-slate-200 mb-1">Association for Computing Machinery</p>
              <p>SVNIT Surat Student Chapter</p>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Header Switcher */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {isSignUp ? 'Create a New Account' : 'Welcome to GENDOC'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSignUp
                    ? 'Register your club credentials to access the document generator'
                    : 'Sign in to access your club workspace and templates'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMissingAccountError(null);
                  setGeneralError(null);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-lg transition-colors"
              >
                {isSignUp ? 'Already have account?' : 'Create Account'}
              </button>
            </div>

            {/* Missing Account Alert Banner (Required by prompt) */}
            {missingAccountError && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-semibold text-amber-950">No Account Found</p>
                    <p className="text-amber-800 mt-0.5">{missingAccountError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setMissingAccountError(null);
                  }}
                  className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <UserPlus size={13} />
                  Sign Up Now
                </button>
              </div>
            )}

            {/* General Error Banner */}
            {generalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            {!isSignUp ? (
              /* SIGN IN FORM */
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. kristal.patel@svnit.acm.org"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      defaultChecked
                      className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="remember" className="text-xs text-slate-600">
                      Remember this browser
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoFill}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Quick-fill Demo Credentials
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <LogIn size={16} />
                  Sign In
                </button>
              </form>
            ) : (
              /* CREATE ACCOUNT FORM */
              <form onSubmit={handleSignUp} className="mt-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Kristal Patel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="kristal@svnit.acm.org"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Club Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="Club Member">Club Member</option>
                      <option value="Core Coordinator">Core Coordinator</option>
                      <option value="Club Admin">Club Admin</option>
                      <option value="Faculty Advisor">Faculty Advisor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-3 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <UserPlus size={16} />
                  Create Account & Enter
                </button>
              </form>
            )}
          </div>

          {/* Footer toggle note */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isSignUp ? "Already registered?" : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMissingAccountError(null);
                  setGeneralError(null);
                }}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline ml-1"
              >
                {isSignUp ? 'Sign in here' : 'Create a new account'}
              </button>
            </span>
            <span className="text-[11px] text-slate-400">v1.2.0 • ACM NIT Surat</span>
          </div>
        </div>
      </div>
    </div>
  );
};
