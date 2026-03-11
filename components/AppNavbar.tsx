import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu, Moon, Search, ShoppingCart, Sun, User } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export function AppNavbar({
  searchQuery,
  setSearchQuery,
  onSubmitSearch,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSubmitSearch: (e: React.FormEvent) => void;
}): React.JSX.Element {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const { theme, toggleTheme, switchable } = useTheme();

  const { data: categoriesData } = trpc.products.getCategoriesHierarchy.useQuery();
  const categories = Array.isArray(categoriesData) ? (categoriesData as any[]) : [];

  const goProfile = () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if ((user as any)?.role === "admin" || (user as any)?.role === "sub_admin") {
      navigate("/admin-dashboard");
      return;
    }
    if ((user as any)?.role === "seller") {
      navigate("/seller-dashboard");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#020617] border-b border-border">
        <div className="container mx-auto px-4 h-[60px] flex items-center justify-between gap-3">
          <button
            type="button"
            className="text-lg md:text-2xl font-bold text-accent whitespace-nowrap"
            onClick={() => navigate("/")}
          >
            STAR LUX
          </button>

          <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {language === "ar-IQ" ? "الأقسام" : "Categories"}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 max-h-[60vh] overflow-auto">
                {categories.length === 0 ? (
                  <DropdownMenuItem className="justify-start">
                    {language === "ar-IQ" ? "لا توجد أقسام" : "No categories"}
                  </DropdownMenuItem>
                ) : (
                  categories.slice(0, 30).map((c: any) => (
                    <DropdownMenuItem
                      key={String(c?.id)}
                      className="justify-start"
                      onClick={() => navigate(`/category/${c.id}`)}
                    >
                      {language === "ar-IQ" ? String(c?.nameAr ?? c?.name ?? "") : String(c?.nameEn ?? c?.name ?? "")}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <form onSubmit={onSubmitSearch} className="flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={language === "ar-IQ" ? "ابحث عن منتجات..." : "Search products..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 bg-background/40"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => navigate("/cart")}
              aria-label="Cart"
              title={language === "ar-IQ" ? "السلة" : "Cart"}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 hidden sm:inline-flex"
              onClick={goProfile}
              aria-label="Profile"
              title={language === "ar-IQ" ? "الحساب" : "Profile"}
            >
              <User className="w-5 h-5" />
            </Button>

            <LanguageSwitcher />

            {switchable && toggleTheme && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 hidden md:inline-flex"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem className="justify-start" onClick={() => navigate("/")}
                    >
                    {language === "ar-IQ" ? "الرئيسية" : "Home"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="justify-start" onClick={() => navigate("/explore")}
                    >
                    {language === "ar-IQ" ? "استكشف المنتجات" : "Explore"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="justify-start" onClick={() => navigate("/cart")}
                    >
                    {language === "ar-IQ" ? "السلة" : "Cart"}
                  </DropdownMenuItem>

                  <DropdownMenuItem className="justify-start" onClick={goProfile}
                    >
                    {isAuthenticated
                      ? language === "ar-IQ" ? "حسابي" : "My Account"
                      : language === "ar-IQ" ? "تسجيل الدخول" : "Sign In"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>
                    {language === "ar-IQ" ? "الأقسام" : "Categories"}
                  </DropdownMenuLabel>
                  {categories.length === 0 ? (
                    <DropdownMenuItem className="justify-start">
                      {language === "ar-IQ" ? "لا توجد أقسام" : "No categories"}
                    </DropdownMenuItem>
                  ) : (
                    categories.slice(0, 12).map((c: any) => (
                      <DropdownMenuItem
                        key={`m-${String(c?.id)}`}
                        className="justify-start"
                        onClick={() => navigate(`/category/${c.id}`)}
                      >
                        {language === "ar-IQ" ? String(c?.nameAr ?? c?.name ?? "") : String(c?.nameEn ?? c?.name ?? "")}
                      </DropdownMenuItem>
                    ))
                  )}

                  {switchable && toggleTheme && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="justify-start" onClick={toggleTheme}>
                        {theme === "dark"
                          ? language === "ar-IQ" ? "الوضع الفاتح" : "Light mode"
                          : language === "ar-IQ" ? "الوضع الداكن" : "Dark mode"}
                      </DropdownMenuItem>
                    </>
                  )}

                  {isAuthenticated && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="justify-start" onClick={goProfile}>
                        <User className="w-4 h-4" />
                        <span className="ml-2">{String((user as any)?.name ?? (user as any)?.email ?? "")}</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden px-4 py-3 bg-[#020617] border-b border-border">
        <form onSubmit={onSubmitSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={language === "ar-IQ" ? "ابحث عن منتجات..." : "Search products..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 bg-background/40"
            />
          </div>
        </form>
      </div>
    </>
  );
}
