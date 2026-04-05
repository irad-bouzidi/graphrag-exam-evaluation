"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { LanguageSwitcher } from "./LanguageSwitcher"
import {
  Home,
  FileText,
  Users,
  Upload,
  GitBranch,
  BarChart3,
  GraduationCap,
  CheckCircle,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const navigationItems = [
    { name: t('home'), href: "/", icon: Home },
    { name: t('exams'), href: "/exams", icon: FileText },
    { name: t('students'), href: "/students", icon: Users },
    { name: t('submissionsNav'), href: "/submissions", icon: Upload },
    { name: t('graphExplorer'), href: "/graph", icon: GitBranch },
    { name: t('statistics'), href: "/statistics", icon: BarChart3 },
  ]

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-800">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div className="ml-3">
          <span className="text-lg font-semibold text-white">
            ExamEval
          </span>
          <p className="text-xs text-slate-400">Enterprise</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Menu
        </p>
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-300">{t('correctionSystem')}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('mathGrade6')}</p>
        </div>
      </div>
    </div>
  )
}

export function Header() {
  const { t } = useTranslation()
  
  return (
    <header className="flex h-16 items-center justify-between bg-white px-6 border-b border-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {t('appTitle')}
        </h2>
        <p className="text-sm text-slate-500">{t('appSubtitle')}</p>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <div className="h-6 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">{t('mathGrade6')}</p>
            <p className="text-xs text-slate-500">{t('class')}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            {t('connected')}
          </span>
        </div>
      </div>
    </header>
  )
}
