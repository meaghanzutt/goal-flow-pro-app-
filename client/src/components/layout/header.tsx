import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Target, Crown, LogOut, User, Menu, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const [location] = useLocation();
  const { isPremium, isFree } = useSubscription();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", isActive: location === "/" },
    { href: "/goals", label: "My Goals", isActive: location.startsWith("/goals") },
    { href: "/progress", label: "Progress", isActive: location.startsWith("/progress") },
    { href: "/insights", label: "Insights", isActive: location.startsWith("/insights") },
    { href: "/wellness-hub", label: "Wellness", isActive: location.startsWith("/wellness-hub") },
    { href: "/integrations", label: "Integrations", isActive: location.startsWith("/integrations") },
  ];

  const MobileNavigation = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 brand-orange rounded-lg flex items-center justify-center">
              <Target className="text-white" size={16} />
            </div>
            <span>Goal Flow Pro</span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-4 mt-8">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant={item.isActive ? "default" : "ghost"} 
                className="w-full justify-start text-left"
              >
                {item.label}
              </Button>
            </Link>
          ))}
          
          <div className="border-t pt-4 space-y-3">
            {isFree && (
              <Link href="/subscribe" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  <Crown size={16} className="mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
            )}
            {isPremium && (
              <Badge className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white justify-center">
                <Crown size={14} className="mr-1" />
                Premium
              </Badge>
            )}
            
            <Button variant="ghost" className="w-full justify-start">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
              onClick={() => window.location.href = '/api/logout'}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="glass-card border-0 shadow-sm sticky top-0 z-50 mx-2 sm:mx-4 mt-2 sm:mt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 brand-orange rounded-lg flex items-center justify-center">
              <Target className="text-white" size={20} />
            </div>
            <Link href="/" className="text-xl font-bold text-black hover:text-gray-800 transition-colors">
              <span className="hidden sm:inline">Goal Flow Pro</span>
              <span className="sm:hidden">GFP</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className={`font-bold transition-colors ${
                  item.isActive
                    ? "text-blue-700 font-extrabold"
                    : "text-black hover:text-blue-700"
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isFree && (
              <Link href="/subscribe">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium">
                  <Crown size={16} className="mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
            )}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <Crown size={14} className="mr-1" />
                Premium
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="text-black hover:text-blue-700">
              <Bell size={20} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-8 h-8 brand-orange rounded-full flex items-center justify-center p-0">
                  <span className="text-white text-sm font-medium">JD</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => window.location.href = '/api/logout'}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {isPremium && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                <Crown size={12} className="mr-1" />
                Pro
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="text-yellow-600 hover:text-brand-orange">
              <Bell size={18} />
            </Button>
            <MobileNavigation />
          </div>
        </div>
      </div>
    </header>
  );
}
