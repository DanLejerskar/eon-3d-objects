import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Settings as SettingsIcon,
  Box,
  Zap
} from 'lucide-react'
import './Sidebar.css'

export function Sidebar({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-asset', label: 'New Asset', icon: PlusCircle },
    { id: 'library', label: 'Asset Library', icon: FolderOpen },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Box className="logo-icon" />
          <div className="logo-text">
            <span className="logo-title">EON 3D Objects</span>
            <span className="logo-subtitle">VibeFlow 2.0</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="api-status">
          <Zap size={16} className="status-icon" />
          <span>APIs Connected</span>
        </div>
        <div className="version">v2.0.0</div>
      </div>
    </aside>
  )
}
