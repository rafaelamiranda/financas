import { cn } from '../../lib/utils';
import { Link, type LinkProps } from 'react-router-dom';
import React, { useState, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  fixed?: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
  fixed,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  fixed?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, fixed }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
  fixed,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  fixed?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate} fixed={fixed}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate, fixed } = useSidebar();
  return (
    <motion.div
      className={cn(
        'h-full px-4 py-4 hidden md:flex md:flex-col bg-card-dark border-r border-card-hover/20 shrink-0',
        className
      )}
      animate={{
        width: animate ? (open ? '260px' : '72px') : '260px',
      }}
      onMouseEnter={() => !fixed && setOpen(true)}
      onMouseLeave={() => !fixed && setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          'h-14 px-4 flex flex-row md:hidden items-center justify-between bg-card-dark border-b border-card-hover/20 w-full sticky top-0 z-30'
        )}
        {...props}
      >
        <span className="font-bold text-white">💰 financas</span>
        <button
          type="button"
          aria-label="Abrir menu"
          className="bg-transparent border-0 p-0"
          onClick={() => setOpen(!open)}
        >
          <Menu className="text-gray-300 cursor-pointer" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className={cn(
                'fixed h-full w-full inset-0 bg-bg-primary p-6 z-100 flex flex-col justify-between',
                className
              )}
            >
              <button
                type="button"
                aria-label="Fechar menu"
                className="absolute right-6 top-6 z-50 text-gray-300 cursor-pointer bg-transparent border-0 p-0"
                onClick={() => setOpen(!open)}
              >
                <X />
              </button>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  active,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
  props?: LinkProps;
}) => {
  const { open, animate, setOpen } = useSidebar();
  return (
    <Link
      to={link.href}
      onClick={() => {
        link.onClick?.();
        setOpen(false);
      }}
      className={cn(
        'flex items-center justify-start gap-3 group/sidebar py-2.5 px-2 rounded-lg transition',
        active ? 'text-entrada bg-entrada/10' : 'text-gray-400 hover:text-white hover:bg-card-hover/50',
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm font-medium whitespace-pre inline-block p-0! m-0!"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
