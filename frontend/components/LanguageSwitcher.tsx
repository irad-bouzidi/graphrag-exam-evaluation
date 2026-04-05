'use client'

import { useLanguage, Language } from '@/lib/i18n'
import { Globe, Languages, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="group relative flex items-center gap-2 px-4 py-2.5 rounded-xl 
                 bg-gradient-to-r from-white/80 to-white/60 
                 hover:from-purple-50 hover:to-indigo-50
                 border border-white/50 hover:border-purple-200
                 shadow-sm hover:shadow-md
                 transition-all duration-300 ease-out
                 text-sm font-semibold text-gray-700 hover:text-purple-700"
      title={t('language')}
    >
      <div className="relative">
        <Globe className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <span className="relative">
        {language === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}
        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 
                         group-hover:w-full transition-all duration-300" />
      </span>
    </button>
  )
}

export function LanguageDropdown() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇬🇧', native: 'English' },
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷', native: 'Français' },
  ]

  const currentLang = languages.find(l => l.code === language)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 px-4 py-2.5 rounded-xl
                   bg-gradient-to-r from-white/90 to-white/70
                   hover:from-purple-50 hover:to-indigo-50
                   border border-white/50 hover:border-purple-200
                   shadow-sm hover:shadow-lg
                   transition-all duration-300 ease-out"
      >
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-purple-600 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-2xl">{currentLang?.flag}</span>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700">
            {currentLang?.native}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div className={`absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden
                       bg-white/95 backdrop-blur-xl
                       border border-white/50 shadow-2xl
                       transform transition-all duration-300 ease-out origin-top-right
                       ${isOpen 
                         ? 'opacity-100 scale-100 translate-y-0' 
                         : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
      >
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('language')}
          </div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl
                         transition-all duration-200 ease-out
                         ${language === lang.code 
                           ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' 
                           : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <div className="font-semibold">{lang.native}</div>
                <div className="text-xs text-gray-400">{lang.name}</div>
              </div>
              {language === lang.code && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 
                                flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Decorative gradient line */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
      </div>
    </div>
  )
}
