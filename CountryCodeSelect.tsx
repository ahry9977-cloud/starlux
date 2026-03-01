import { useState, useMemo } from "react";
import { countryCodes, searchCountries, type CountryCode } from "@shared/countryCodes";
import { ChevronDown, Search, X } from "lucide-react";

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function CountryCodeSelect({ 
  value, 
  onChange, 
  disabled = false,
  className = ""
}: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCountry = useMemo(() => {
    return countryCodes.find(c => c.dialCode === value) || countryCodes[0];
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countryCodes;
    return searchCountries(searchQuery);
  }, [searchQuery]);

  const handleSelect = (country: CountryCode) => {
    onChange(country.dialCode);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Country Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-md border
          bg-slate-800/50 border-slate-700 text-white
          hover:border-slate-600 transition-all duration-300
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${isOpen ? "border-cyan-500 ring-1 ring-cyan-500/20" : ""}
        `}
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-sm font-medium" dir="ltr">{selectedCountry.dialCode}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsOpen(false);
              setSearchQuery("");
            }}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full mt-2 right-0 z-50 w-72 max-h-80 overflow-hidden bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن دولة..."
                  className="w-full pr-10 pl-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Countries List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  لا توجد نتائج
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-right
                      hover:bg-slate-800 transition-colors
                      ${value === country.dialCode ? "bg-slate-800/50 border-r-2 border-cyan-500" : ""}
                    `}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{country.nameAr}</div>
                      <div className="text-slate-500 text-xs" dir="ltr">{country.name}</div>
                    </div>
                    <span className="text-cyan-400 text-sm font-mono" dir="ltr">{country.dialCode}</span>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-slate-700 bg-slate-800/50">
              <div className="text-xs text-slate-500 text-center">
                {filteredCountries.length} دولة متاحة
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
