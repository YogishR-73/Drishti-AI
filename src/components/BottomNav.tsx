import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, Settings, HelpCircle } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
}

const navItems: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/help', label: 'Help', icon: HelpCircle },
];

const BottomNav: React.FC = () => {
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        border-t border-white/10
        backdrop-blur-xl bg-[#0a1633]/80
      "
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center
              min-w-[64px] min-h-[56px] py-2 px-3
              rounded-xl transition-colors duration-200
              ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-white/50 hover:text-white/80'
              }
            `}
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="
                      absolute -top-px left-1/2 -translate-x-1/2
                      w-6 h-[3px] rounded-full
                      bg-gradient-to-r from-cyan-400 to-teal-400
                    "
                    aria-hidden="true"
                  />
                )}

                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                  aria-hidden="true"
                />

                <span className="text-[11px] mt-0.5 font-medium">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
