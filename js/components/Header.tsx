import type { Wine, UserProfile, Session } from '../types';

interface HeaderProps {
  wines: Wine[];
  session: Session;
  profile: UserProfile | null;
  isEstimatingWindows: boolean;
  windowEstimationProgress: { current: number; total: number } | null;
  themeMode: 'light' | 'dark';
  menuOpen: boolean;
  setMenuOpen: (b: boolean) => void;
  estimateDrinkingWindows: () => void;
  toggleTheme: () => void;
  handleSignOut: () => void;
  setShowAdd: (b: boolean) => void;
}

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

export function Header({
  wines, session, profile, isEstimatingWindows, windowEstimationProgress,
  themeMode, menuOpen, setMenuOpen, estimateDrinkingWindows, toggleTheme,
  handleSignOut, setShowAdd,
}: HeaderProps) {
  return (
    <>
      <header className="ge-hdr">
        <button
          className="hbg-btn show-m"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="2" y1="4.5"  x2="16" y2="4.5"/>
            <line x1="2" y1="9"    x2="16" y2="9"/>
            <line x1="2" y1="13.5" x2="16" y2="13.5"/>
          </svg>
        </button>
        <div className="ge-logo">
          <span>🍷</span>
          <div>
            Grape Expectations
            <small>Your Singaporean Sommelier</small>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="ornament hide-m">✦ ✦ ✦</span>
          {wines.some(w => w.drinkFrom == null && w.drinkBy == null) && (
            <button
              className="ge-btn btn-o hide-m"
              onClick={estimateDrinkingWindows}
              disabled={isEstimatingWindows}
              style={{ fontSize: 'var(--fs-sm)', padding: '6px 14px', opacity: isEstimatingWindows ? 0.6 : 1, cursor: isEstimatingWindows ? 'not-allowed' : 'pointer' }}
            >
              {isEstimatingWindows && windowEstimationProgress
                ? `Estimating… ${windowEstimationProgress.current}/${windowEstimationProgress.total}`
                : 'Estimate Windows'}
            </button>
          )}
          <button className="theme-toggle hide-m" onClick={toggleTheme} title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {themeMode === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="ge-btn btn-g" onClick={() => setShowAdd(true)}>Add Wine</button>
          {profile?.avatar_url ? (
            <img
              className="hide-m"
              src={profile.avatar_url}
              alt={profile.display_name || 'Profile'}
              title={`${profile.display_name || session.user.email} · Sign out`}
              onClick={handleSignOut}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--border)',
                cursor: 'pointer', flexShrink: 0,
                transition: 'border-color 0.2s',
              }}
            />
          ) : (
            <button className="ge-btn btn-o hide-m" onClick={handleSignOut} style={{ fontSize: 'var(--fs-sm)', padding: '6px 14px' }}>
              Sign out
            </button>
          )}
        </div>
      </header>
      {menuOpen && (
        <div className="hbg-menu show-m">
          <button className="hbg-item" onClick={() => { toggleTheme(); setMenuOpen(false); }}>
            {themeMode === 'dark' ? <SunIcon /> : <MoonIcon />}
            {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="hbg-divider"/>
          <button className="hbg-item" onClick={() => { handleSignOut(); setMenuOpen(false); }}>
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }}/>
            )}
            Sign out
          </button>
        </div>
      )}
    </>
  );
}
