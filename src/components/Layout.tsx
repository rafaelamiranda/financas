import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Sigma, Tag, Menu as MenuIcon, Plus, CalendarDays, TrendingUp, Wallet, PinOff, Pin } from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from './ui/sidebar';
import AddModal from './AddModal';

export default function Layout() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem('sidebarFixed') === 'true';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { href: '/', icon: <LayoutGrid className="h-5 w-5 shrink-0" />, label: 'saldos' },
    { href: '/totais', icon: <Sigma className="h-5 w-5 shrink-0" />, label: 'totais' },
    { href: '/tags', icon: <Tag className="h-5 w-5 shrink-0" />, label: 'tags' },
    { href: '/horizonte', icon: <TrendingUp className="h-5 w-5 shrink-0" />, label: 'horizonte' },
    { href: '/settings', icon: <MenuIcon className="h-5 w-5 shrink-0" />, label: 'menu' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const goToday = () => {
    navigate('/');
  };

  const toggleSidebarFixed = () => {
    const newFixed = !open;
    setOpen(newFixed);
    try {
      localStorage.setItem('sidebarFixed', String(newFixed));
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-screen w-full bg-bg-primary overflow-hidden">
      <Sidebar open={open} setOpen={setOpen} fixed={open}>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 px-2 mb-6">
              <Wallet className="h-6 w-6 text-entrada flex-shrink-0" />
              {open && <span className="font-bold text-white whitespace-pre">financas</span>}
            </div>

            {/* Menu */}
            <div className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <SidebarLink key={item.href} link={item} active={isActive(item.href)} />
              ))}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-3 px-2 rounded-full font-bold text-bg-primary bg-entrada hover:bg-entrada/90 transition flex items-center justify-center gap-2 overflow-hidden"
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              {open && <span className="whitespace-pre">adicionar</span>}
            </button>
            <button
              onClick={goToday}
              className="w-full py-2 px-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-card-hover/50 transition flex items-center justify-center gap-2 overflow-hidden"
            >
              <CalendarDays className="h-5 w-5 flex-shrink-0" />
              {open && <span className="whitespace-pre">ir pra hoje</span>}
            </button>
            <button
              onClick={toggleSidebarFixed}
              className="w-full py-2 px-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-card-hover/50 transition flex items-center justify-center gap-2 overflow-hidden"
              title={open ? 'Desafixar sidebar' : 'Fixar sidebar'}
            >
              {open ? <Pin className="h-5 w-5 flex-shrink-0" /> : <PinOff className="h-5 w-5 flex-shrink-0" />}
              {open && <span className="whitespace-pre text-xs">{open ? 'fixado' : 'desafixar'}</span>}
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card-dark border-t border-card-hover/20 flex justify-around py-2 z-20">
          {menuItems.slice(0, 3).map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition ${
                isActive(item.href) ? 'text-entrada' : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium text-entrada hover:text-entrada/90 transition"
          >
            <Plus className="h-5 w-5" />
            <span>add</span>
          </button>
        </nav>
      </main>

      <AddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
