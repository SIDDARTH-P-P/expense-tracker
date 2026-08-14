'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiShield,
  FiHeadphones,
  FiGlobe,
  FiPower,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiCopy,
  FiCheck,
  FiCamera,
  FiX,
  FiMail,
  FiPhone,
  FiShare2,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiTrash2,
  FiMapPin,
  FiClock,
  FiRefreshCw,
  FiLogOut,
  FiBell,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import {
  useCurrentUser,
  useUpdateProfile,
  useLogout,
  useSessions,
  useRevokeSession,
  useRevokeAllSessions,
} from '@/hooks/useAuth';
import { apiClient, ApiClientError } from '@/services/api-client';
import { useRouter } from 'next/navigation';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function DeviceIcon({ deviceName, os }: { deviceName: string; os: string }) {
  const lower = (deviceName + os).toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
    return <FiSmartphone size={18} />;
  }
  if (lower.includes('tablet') || lower.includes('ipad')) {
    return <FiTablet size={18} />;
  }
  return <FiMonitor size={18} />;
}

// ─── Accordion Item ──────────────────────────────────────────────────────────
function AccordionItem({
  id,
  icon,
  label,
  children,
  expandedSection,
  onToggle,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  expandedSection: string | null;
  onToggle: (id: string) => void;
}) {
  const isOpen = expandedSection === id;
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between px-1 py-4 text-left transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-foreground/70">{icon}</span>
          <span className="text-[15px] font-medium text-foreground">{label}</span>
        </div>
        {isOpen ? (
          <FiChevronUp size={18} className="text-muted" />
        ) : (
          <FiChevronDown size={18} className="text-muted" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Link Item ───────────────────────────────────────────────────────────────
function LinkItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between px-1 py-4 text-left transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className={danger ? 'text-expense/80' : 'text-foreground/70'}>{icon}</span>
          <span className={`text-[15px] font-medium ${danger ? 'text-expense' : 'text-foreground'}`}>{label}</span>
        </div>
        <FiChevronRight size={18} className="text-muted" />
      </button>
    </div>
  );
}

export function ProfileCard() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const logoutMutation = useLogout();
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();

  const {
    notifications,
    unreadCount,
    isLoading: notifLoading,
    markRead,
    markAllRead,
    isMarkingAllRead,
  } = useNotifications();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Edit mode state for Personal Information
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close avatar menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false);
      }
    };
    if (showAvatarMenu) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showAvatarMenu]);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Selected language
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setAvatar(user.avatar || '');
      if (user.language === 'en') setSelectedLanguage('English');
      else if (user.language === 'bn') setSelectedLanguage('Bengali');
    }
  }, [user]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
    // Fetch sessions when opening the session-management accordion
    if (section === 'sessions') {
      refetchSessions();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatar(dataUrl);
      updateProfile.mutate({ avatar: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    updateProfile.mutate({ avatar: '' });
    toast.success('Photo removed');
  };

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { name, email, username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''), phone, address },
      {
        onSuccess: () => {
          setIsEditingPersonal(false);
        },
      }
    );
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setIsSavingPassword(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setExpandedSection(null);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Failed to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCopyMemberId = async () => {
    const memberIdToCopy = user?.memberId || '19202033724';
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(memberIdToCopy);
      } else {
        // Fallback for non-HTTPS / older browsers
        const el = document.createElement('textarea');
        el.value = memberIdToCopy;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedId(true);
      toast.success('Member ID copied!');
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShareApp = () => {
    if (navigator.share && window.isSecureContext) {
      navigator.share({
        title: 'Expense Tracker',
        text: 'Check out this awesome Expense Tracker app!',
        url: window.location.origin,
      }).catch(() => setShowShareModal(true));
    } else {
      setShowShareModal(true);
    }
  };

  const displayHandle = user?.username
    ? `@${user.username}`
    : name
    ? `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    : '@user';

  const memberIdDisplay = user?.memberId || '19202033724';
  const languages = ['English', 'Spanish', 'French', 'German', 'Bengali'];

  if (isLoading && !user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }


  return (
    <div className="mx-auto w-full max-w-lg bg-surface flex flex-col h-full">
      {/* ── Avatar & Identity ── sticky header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border/40">
        <div className="flex items-start justify-between gap-4 px-6 pt-8 pb-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Avatar */}
        <div ref={avatarMenuRef} className="relative shrink-0 h-20 w-20">
          <div className="h-full w-full overflow-hidden rounded-full border-2 border-border shadow-sm">
            {avatar ? (
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-2xl font-bold text-white">
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          {/* Hidden file input — always in DOM so ref click works */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { handleAvatarChange(e); setShowAvatarMenu(false); }}
          />

          {/* Camera badge — toggles popup */}
          <button
            type="button"
            onClick={() => setShowAvatarMenu((v) => !v)}
            className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-zinc-600 text-white shadow hover:bg-zinc-700 transition-colors"
            title="Change photo"
          >
            <FiCamera size={11} />
          </button>

          {/* Popup — opens to the RIGHT of the camera badge */}
          <AnimatePresence>
            {showAvatarMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[84px] left-[56px] z-50 min-w-[148px] rounded-xl border border-border bg-surface shadow-xl overflow-hidden"
              >
                {/* Upload */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3.5 py-3 text-[13px] font-medium text-foreground hover:bg-surface-2 transition-colors"
                  onClick={() => { setShowAvatarMenu(false); setTimeout(() => fileInputRef.current?.click(), 50); }}
                >
                  <FiCamera size={14} className="text-muted shrink-0" />
                  Upload photo
                </button>

                {/* Remove — only when avatar is set */}
                {avatar && (
                  <button
                    type="button"
                    onClick={() => { handleRemoveAvatar(); setShowAvatarMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-3 text-[13px] font-medium text-red-400 hover:bg-surface-2 transition-colors border-t border-border/40"
                  >
                    <FiX size={14} className="shrink-0" />
                    Remove photo
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Name, handle & Member ID — stacked beside avatar */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] font-bold leading-tight text-foreground truncate">
            {name || 'Your Name'}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{displayHandle}</p>

          {/* Member ID inline */}
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Member ID</p>
            <div className="flex items-center gap-1">
              <p className="text-[13px] font-medium text-foreground tracking-wider">{memberIdDisplay}</p>
              <button
                type="button"
                onClick={handleCopyMemberId}
                title={copiedId ? 'Copied!' : 'Copy Member ID'}
                className="p-0.5 text-muted hover:text-foreground transition-colors"
              >
                {copiedId ? <FiCheck size={12} className="text-income" /> : <FiCopy size={12} />}
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:scale-105 active:scale-95 mt-1"
        >
          <FiBell size={18} />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-expense px-1 text-[9px] font-bold text-white ring-2 ring-background"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </button>
      </div>
      </div>

      {/* ── Menu List ── */}
      <div className="px-6">
        {/* 1. Personal Information */}
        <AccordionItem id="personal" icon={<FiUser size={20} />} label="Personal information" expandedSection={expandedSection} onToggle={toggleSection}>
          <div className="relative rounded-2xl bg-surface-2 dark:bg-surface-2 p-4 text-sm text-foreground">
            {!isEditingPersonal ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(true)}
                  className="absolute top-3 right-3 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-2 transition-colors"
                >
                  Edit
                </button>
                <div className="space-y-1.5 pr-12">
                  <p className="font-semibold text-foreground">{name || '—'}</p>
                  <p className="text-muted text-[13px]">{email || '—'}</p>
                  <p className="text-muted text-[13px]">{phone || '—'}</p>
                  {address && <p className="text-muted text-[13px] leading-snug">{address}</p>}
                </div>
              </>
            ) : (
              <form onSubmit={handleSavePersonal} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Username (@)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Email Address
                    <span className="ml-1.5 text-[10px] text-muted/60 normal-case font-normal">(cannot be changed)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    className="w-full rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-muted cursor-not-allowed opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={
                      updateProfile.isPending ||
                      (
                        name === (user?.name || '') &&
                        username === (user?.username || '') &&
                        phone === (user?.phone || '') &&
                        address === (user?.address || '')
                      )
                    }
                    className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  >
                    {updateProfile.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(false)}
                    className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-foreground hover:bg-surface-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </AccordionItem>

        {/* 2. Login and Security */}
        <AccordionItem id="security" icon={<FiShield size={20} />} label="Login and security" expandedSection={expandedSection} onToggle={toggleSection}>
          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl bg-surface-2 dark:bg-surface-2 p-4 space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSavingPassword}
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {isSavingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </AccordionItem>

        {/* 3. Session Management */}
        <AccordionItem
          id="sessions"
          icon={<FiMonitor size={20} />}
          label="Session Management"
          expandedSection={expandedSection}
          onToggle={toggleSection}
        >
          <div className="rounded-2xl bg-surface-2 p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Where you&apos;re logged in</p>
                <p className="text-[12px] text-muted/70 mt-0.5">
                  {sessions
                    ? `${sessions.length} active session${sessions.length !== 1 ? 's' : ''}`
                    : 'Loading…'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetchSessions()}
                className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted"
                title="Refresh"
              >
                <FiRefreshCw size={13} className={sessionsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Session list */}
            {sessionsLoading && !sessions ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-2.5">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`relative rounded-xl border p-3 transition-colors ${
                      session.isCurrent
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/40 bg-surface'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Device icon */}
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        session.isCurrent ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted'
                      }`}>
                        <DeviceIcon deviceName={session.deviceName} os={session.os} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-semibold text-foreground truncate">
                            {session.browser}
                          </span>
                          {session.isCurrent && (
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                              This device
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-muted mt-0.5">{session.os}</p>

                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                          {session.location && session.location !== 'Unknown location' && (
                            <span className="flex items-center gap-1 text-[11px] text-muted/80">
                              <FiMapPin size={10} />
                              {session.location}
                            </span>
                          )}
                          {session.ip && (
                            <span className="text-[11px] font-mono text-muted/70">{session.ip}</span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted/70">
                          <FiClock size={10} />
                          <span>Signed in {timeAgo(session.loginAt)}</span>
                          {session.lastSeenAt !== session.loginAt && (
                            <span className="text-muted/50"> · Active {timeAgo(session.lastSeenAt)}</span>
                          )}
                        </div>
                      </div>

                      {/* Revoke button — only for other sessions */}
                      {!session.isCurrent && (
                        <button
                          type="button"
                          onClick={() => revokeSession.mutate(session.id)}
                          disabled={revokeSession.isPending}
                          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-surface text-muted hover:border-expense/40 hover:text-expense hover:bg-expense/10 transition-colors disabled:opacity-50"
                          title="Sign out this session"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-muted py-4">No active sessions found.</p>
            )}

            {/* Sign out all other devices */}
            {sessions && sessions.filter((s) => !s.isCurrent).length > 0 && (
              <button
                type="button"
                onClick={() => setShowRevokeAllConfirm(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-expense/30 py-2.5 text-xs font-semibold text-expense hover:bg-expense/10 transition-colors"
              >
                <FiLogOut size={13} />
                Sign out all other devices
              </button>
            )}
          </div>
        </AccordionItem>

        {/* 4. Activity Log */}
        <LinkItem
          icon={<FiClock size={20} />}
          label="Activity log"
          onClick={() => router.push('/activity-log')}
        />

        {/* 4. Customer Support */}
        <AccordionItem id="support" icon={<FiHeadphones size={20} />} label="Customer Support" expandedSection={expandedSection} onToggle={toggleSection}>
          <div className="rounded-2xl bg-surface-2 dark:bg-surface-2 p-4 space-y-2.5 text-xs text-foreground">
            <div className="flex items-center gap-2.5">
              <FiMail size={14} className="text-muted" />
              <span>support@expensetracker.app</span>
            </div>
            <div className="flex items-center gap-2.5">
              <FiPhone size={14} className="text-muted" />
              <span>Helpline: +1 800 123 4567</span>
            </div>
            <button
              type="button"
              onClick={() => toast.success('Live chat coming soon!')}
              className="w-full mt-2 rounded-xl border border-border bg-surface py-2 font-semibold text-foreground hover:bg-surface-2 transition-colors"
            >
              Start Live Chat
            </button>
          </div>
        </AccordionItem>

        {/* 5. Language */}
        <AccordionItem id="language" icon={<FiGlobe size={20} />} label="Language" expandedSection={expandedSection} onToggle={toggleSection}>
          <div className="rounded-2xl bg-surface-2 dark:bg-surface-2 p-3 space-y-1">
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang);
                  toast.success(`Language set to ${lang}`);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface"
              >
                <span className={selectedLanguage === lang ? 'font-bold text-foreground' : 'text-muted'}>
                  {lang}
                </span>
                {selectedLanguage === lang && <FiCheck size={14} className="text-income" />}
              </button>
            ))}
          </div>
        </AccordionItem>

        {/* 6. Share the app */}
        <LinkItem icon={<FiShare2 size={20} />} label="Share the app" onClick={handleShareApp} />
      </div>

      {/* ── Spacer to push logout to bottom ── */}
      <div className="flex-1" />

      {/* ── Log Out — sticky bottom ── */}
      <div className="sticky bottom-0 bg-surface border-t border-border/40 px-6 pb-20">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-4 py-4 text-left transition-colors"
        >
          <span className="text-expense/80"><FiPower size={20} /></span>
          <span className="text-[15px] font-medium text-expense">Log Out</span>
        </button>
      </div>

      {/* ── Share Modal ── */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-surface border border-border/40 shadow-2xl overflow-hidden"
            >
              <div className="px-6 pt-5 pb-3">
                <h3 className="text-[16px] font-bold text-foreground">Share the app</h3>
                <p className="mt-0.5 text-xs text-muted">Invite friends to Expense Tracker</p>
              </div>

              {/* Share options grid */}
              <div className="grid grid-cols-4 gap-1 px-4 pb-2">
                {[
                  { label: 'WhatsApp', color: '#25D366', icon: '💬', href: `https://wa.me/?text=${encodeURIComponent('Check out Expense Tracker! ' + window.location.origin)}` },
                  { label: 'Telegram', color: '#2CA5E0', icon: '✈️', href: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent('Check out Expense Tracker!')}` },
                  { label: 'Twitter', color: '#1DA1F2', icon: '🐦', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out Expense Tracker! ' + window.location.origin)}` },
                  { label: 'Email', color: '#EA4335', icon: '✉️', href: `mailto:?subject=Expense Tracker&body=${encodeURIComponent('Check out Expense Tracker! ' + window.location.origin)}` },
                ].map(({ label, color, icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowShareModal(false)}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-3 hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full text-xl" style={{ backgroundColor: color + '22' }}>
                      {icon}
                    </div>
                    <span className="text-[10px] font-medium text-muted">{label}</span>
                  </a>
                ))}
              </div>

              {/* Copy link */}
              <div className="border-t border-border/40 mx-6 my-1" />
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(window.location.origin);
                    } else {
                      const el = document.createElement('textarea');
                      el.value = window.location.origin;
                      el.style.position = 'fixed'; el.style.opacity = '0';
                      document.body.appendChild(el); el.focus(); el.select();
                      document.execCommand('copy'); document.body.removeChild(el);
                    }
                    toast.success('Link copied!');
                    setShowShareModal(false);
                  } catch { toast.error('Failed to copy'); }
                }}
                className="flex w-full items-center gap-3 px-6 py-4 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2">
                  <FiCopy size={15} className="text-muted" />
                </div>
                Copy link
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Logout Confirmation Modal ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-surface border border-border/40 shadow-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-2 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-expense/10">
                  <FiPower size={22} className="text-expense" />
                </div>
                <h3 className="text-[17px] font-bold text-foreground">Log out?</h3>
                <p className="mt-1 text-sm text-muted">You will be signed out of your account.</p>
              </div>
              <div className="flex gap-3 px-6 py-5">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setShowLogoutConfirm(false); logoutMutation.mutate(); }}
                  className="flex-1 rounded-xl bg-expense py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Revoke All Sessions Confirm Modal ── */}
      <AnimatePresence>
        {showRevokeAllConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowRevokeAllConfirm(false)}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-surface border border-border/40 shadow-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-2 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-expense/10">
                  <FiLogOut size={22} className="text-expense" />
                </div>
                <h3 className="text-[17px] font-bold text-foreground">Sign out other devices?</h3>
                <p className="mt-1 text-sm text-muted">
                  All other active sessions will be immediately revoked. You will stay signed in on this device.
                </p>
              </div>
              <div className="flex gap-3 px-6 py-5">
                <button
                  type="button"
                  onClick={() => setShowRevokeAllConfirm(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={revokeAllSessions.isPending}
                  onClick={() => {
                    revokeAllSessions.mutate(undefined, {
                      onSuccess: () => setShowRevokeAllConfirm(false),
                    });
                  }}
                  className="flex-1 rounded-xl bg-expense py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {revokeAllSessions.isPending ? 'Signing out…' : 'Sign Out All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={notifLoading}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        isMarkingAllRead={isMarkingAllRead}
      />
    </div>
  );
}
