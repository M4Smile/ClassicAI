import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Главная', icon: (
    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 11.5L12 4l9 7.5V20a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-4a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11.5z" />
    </svg>
  ) },
  { to: '/composer', label: 'ИИ-композитор', icon: (
    <span style={{fontWeight: 700, fontSize: 24, fontFamily: 'monospace', letterSpacing: 1}}>AI</span>
  ) },
  { to: '/education', label: 'Образование', icon: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12L12 7L2 12L12 17L22 12Z" />
      <path d="M6 15V19C6 19.55 8.69 21 12 21C15.31 21 18 19.55 18 19V15" />
      <path d="M12 17V21" />
    </svg>
  ) },
  { to: '/library', label: 'Медиатека', icon: (
    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <ellipse cx="17" cy="17" rx="3" ry="2" fill="currentColor" />
      <path d="M17 17V5l-8 2v10" />
      <ellipse cx="9" cy="19" rx="3" ry="2" fill="currentColor" />
    </svg>
  ) },
  
];

export default function Navigation({ onNavigate }) {
  const location = useLocation();
  return (
    <nav className="nav nav-icons">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`nav-icon-link${location.pathname === item.to ? ' active' : ''}`}
          onClick={onNavigate}
        >
          <span className="nav-icon-svg">{item.icon}</span>
          <span className="nav-icon-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
