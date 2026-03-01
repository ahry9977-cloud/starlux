import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllLanguages, Language } from '@/locales';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const languages = getAllLanguages();

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background hover:border-border"
          title={t('common.selectLanguage')}
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">{currentLanguage?.flag}</span>
          <span className="hidden sm:inline text-xs">{currentLanguage?.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t('common.language')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* RTL Languages */}
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground mb-2">RTL Languages</p>
          {languages
            .filter(lang => lang.direction === 'rtl')
            .map(lang => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
              >
                <span className="mr-2">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
        </div>

        <DropdownMenuSeparator />

        {/* LTR Languages */}
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground mb-2">LTR Languages</p>
          {languages
            .filter(lang => lang.direction === 'ltr')
            .map(lang => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`cursor-pointer ${language === lang.code ? 'bg-accent' : ''}`}
              >
                <span className="mr-2">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
