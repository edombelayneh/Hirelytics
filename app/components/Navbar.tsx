import { Button } from './ui/button';
import { Download, Settings, Briefcase, BarChart3, Home, User, Menu } from 'lucide-react';
import { cn } from './ui/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

type Page = 'home' | 'available' | 'applications' | 'profile';

interface NavbarProps {
  currentPage: Page;
  applicationCount: number;
}

const navLinks = [
  {
    id: 'home' as Page,
    href: '#/',
    label: 'Home',
    icon: Home,
  },
  {
    id: 'available' as Page,
    href: '#/jobs',
    label: 'Available Jobs',
    icon: Briefcase,
  },
  {
    id: 'applications' as Page,
    href: '#/applications',
    label: 'My Applications',
    icon: BarChart3,
  },
   {
    id: 'profile' as Page,
    href: '#/profile',
    label: 'My Profile',
    icon: User,
  },
];

export function Navbar({ currentPage, applicationCount }: NavbarProps) {
  const handleExport = () => {
    // Placeholder for export functionality
    console.log('Export clicked');
  };

  const handleSettings = () => {
    // Placeholder for settings functionality
    console.log('Settings clicked');
  };

  return (
    <header className='border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50'>
      <div className='container mx-auto px-6 py-4'>
        <div className='flex items-center justify-between gap-8'>
          {/* Logo and Brand */}
          <div className='flex-shrink-0'>
            <a href='#/' className='inline-block'>
              <h1 className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Hirelytics
              </h1>
            </a>
            <p className='text-muted-foreground text-sm'>
              Manage and track your job search progress
            </p>
          </div>

          {/* Desktop Navigation Links */}
          <nav className='hidden lg:flex items-center gap-1 flex-1 justify-end'>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPage === link.id;
              const showBadge = link.id === 'applications' && applicationCount > 0;
              
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-4 py-2 transition-colors hover:bg-accent',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  {link.label}
                  {showBadge && (
                    <span className='ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground'>
                      {applicationCount}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop Actions - Hidden on smaller screens */}
          <div className='hidden xl:flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handleExport}>
              <Download className='h-4 w-4 mr-2' />
              Export
            </Button>
            <Button variant='outline' size='sm' onClick={handleSettings}>
              <Settings className='h-4 w-4 mr-2' />
              Settings
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className='lg:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Menu className='h-4 w-4' />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className='flex flex-col gap-4 mt-8'>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = currentPage === link.id;
                    const showBadge = link.id === 'applications' && applicationCount > 0;
                    
                    return (
                      <a
                        key={link.id}
                        href={link.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className='h-5 w-5' />
                        <span>{link.label}</span>
                        {showBadge && (
                          <span className='ml-auto rounded-full bg-background px-2 py-0.5 text-xs text-foreground'>
                            {applicationCount}
                          </span>
                        )}
                      </a>
                    );
                  })}
                  <div className='border-t pt-4 mt-4 space-y-2'>
                    <Button variant='outline' size='sm' className='w-full' onClick={handleExport}>
                      <Download className='h-4 w-4 mr-2' />
                      Export
                    </Button>
                    <Button variant='outline' size='sm' className='w-full' onClick={handleSettings}>
                      <Settings className='h-4 w-4 mr-2' />
                      Settings
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
