import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, ClipboardList, Camera, Volume2, BookOpen,
  TrendingUp, BarChart3, TreePine, HeartPulse, ShieldCheck, Bell,
  Map, FileBarChart, Users, Eye, LogOut, ChevronLeft, ChevronRight,
  PawPrint, Settings
} from 'lucide-react';

const ROLE_LABELS = {
  wildlife_researcher: 'Researcher',
  conservation_officer: 'Conservation Officer',
  forest_department_officer: 'Forest Officer',
  administrator: 'Administrator',
};

const ALL_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['all'] },
  { to: '/monitoring-sites', label: 'Monitoring Sites', icon: MapPin, roles: ['all'] },
  { to: '/surveys', label: 'Surveys', icon: ClipboardList, roles: ['all'] },
  { to: '/observations', label: 'Observations', icon: Eye, roles: ['all'] },
  { divider: true, label: 'AI Analysis', roles: ['all'] },
  { to: '/image-analysis', label: 'Image Analysis', icon: Camera, roles: ['all'] },
  { to: '/audio-analysis', label: 'Audio Analysis', icon: Volume2, roles: ['all'] },
  { divider: true, label: 'Intelligence', roles: ['all'] },
  { to: '/species-catalog', label: 'Species Catalog', icon: BookOpen, roles: ['all'] },
  { to: '/population', label: 'Population Intel.', icon: TrendingUp, roles: ['all'] },
  { to: '/biodiversity', label: 'Biodiversity', icon: BarChart3, roles: ['all'] },
  { to: '/habitat', label: 'Habitat Health', icon: TreePine, roles: ['all'] },
  { to: '/ecosystem-health', label: 'Ecosystem Health', icon: HeartPulse, roles: ['all'] },
  { divider: true, label: 'Conservation', roles: ['all'] },
  { to: '/conservation', label: 'Conservation Hub', icon: ShieldCheck, roles: ['all'] },
  { to: '/gis-map', label: 'GIS Maps', icon: Map, roles: ['all'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['all'] },
  { divider: true, label: 'Administration', roles: ['administrator'] },
  { to: '/admin/users', label: 'User Management', icon: Users, roles: ['administrator'] },
];

export default function Sidebar({ user, collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const userRole = user?.role;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const visibleNav = ALL_NAV.filter((item) => {
    if (item.roles?.includes('all')) return true;
    if (item.roles?.includes(userRole)) return true;
    return false;
  });

  return (
    <aside
      className={`relative flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-20 h-6 w-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-colors"
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          : <ChevronLeft className="h-3.5 w-3.5 text-slate-600" />
        }
      </button>

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="h-9 w-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
          <PawPrint className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-xs font-extrabold text-white leading-tight">WildLife AI</p>
            <p className="text-[10px] text-white/40 leading-tight">Population System</p>
          </div>
        )}
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-emerald-400/20 border border-emerald-400/30 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
              {user.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-white/40 truncate">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2 scrollbar-thin scrollbar-thumb-white/10">
        {visibleNav.map((item, idx) => {
          if (item.divider) {
            return !collapsed ? (
              <div key={idx} className="pt-4 pb-1 px-2">
                <p className="text-[9px] font-extrabold text-white/30 uppercase tracking-widest">{item.label}</p>
              </div>
            ) : <div key={idx} className="border-t border-white/10 mx-2 my-2" />;
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${collapsed ? 'h-5 w-5' : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all w-full ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className={`h-4 w-4 shrink-0 ${collapsed ? 'h-5 w-5' : ''}`} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
