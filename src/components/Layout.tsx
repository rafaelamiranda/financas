import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import AddModal from './AddModal';

export default function Layout() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', icon: '📊', label: 'saldos' },
    { path: '/totais', icon: '∑', label: 'totais' },
    { path: '/tags', icon: '🏷️', label: 'tags' },
    { path: '/settings', icon: '☰', label: 'menu' },
  ];

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-40 w-64 h-screen bg-card-dark border-r border-card-hover/20 flex flex-col transition-transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-card-hover/20">
          <h1 className="text-2xl font-bold text-entrada">💰</h1>
          <p className="text-sm text-gray-400 mt-1">Financas</p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-entrada/20 text-entrada'
                  : 'text-gray-400 hover:text-white hover:bg-card-hover/50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 space-y-2 border-t border-card-hover/20">
          <button
            onClick={() => {
              setShowAddModal(true);
              setSidebarOpen(false);
            }}
            className="w-full py-3 px-4 rounded-full font-bold text-bg-primary bg-entrada hover:bg-opacity-90 transition flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>adicionar</span>
          </button>
          <button className="w-full py-2 px-4 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-card-hover/50 transition flex items-center justify-center gap-2">
            <span>📅</span>
            <span>hoje</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full md:w-auto">
        {/* Top Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-card-dark border-b border-card-hover/20 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-xl p-2"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold text-white">💰 Financas</h1>
          <div className="w-8" />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card-dark border-t border-card-hover/20 flex justify-around py-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition ${
                isActive(item.path)
                  ? 'text-entrada'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium text-entrada hover:text-opacity-90 transition"
          >
            <span className="text-lg">+</span>
            <span>add</span>
          </button>
        </nav>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
