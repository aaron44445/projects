/// <reference lib="dom" />
import React from 'react'
import { cn } from '../lib/utils'

/**
 * Sidebar component - navigation menu with dark background
 *
 * @example
 * ```tsx
 * <Sidebar>
 *   <Sidebar.Header>
 *     <Sidebar.Logo>Pecase</Sidebar.Logo>
 *   </Sidebar.Header>
 *   <Sidebar.Nav>
 *     <Sidebar.Item active href="/dashboard">
 *       Dashboard
 *     </Sidebar.Item>
 *     <Sidebar.Item href="/clients">
 *       Clients
 *     </Sidebar.Item>
 *   </Sidebar.Nav>
 * </Sidebar>
 * ```
 */

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether sidebar is collapsed */
  isCollapsed?: boolean
  /** Custom className */
  className?: string
}

interface SidebarComponent extends React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLDivElement>> {
  Header: typeof SidebarHeader
  Logo: typeof SidebarLogo
  Nav: typeof SidebarNav
  Item: typeof SidebarItem
  Divider: typeof SidebarDivider
  Section: typeof SidebarSection
  Footer: typeof SidebarFooter
}

/**
 * Sidebar component - main wrapper
 */
export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ isCollapsed = false, className, children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        'bg-charcoal-600 text-white',
        'transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-60',
        'flex flex-col h-full',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
)

Sidebar.displayName = 'Sidebar'

/**
 * Sidebar.Header - Header section with logo
 */
export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-6 py-8 border-b border-white border-opacity-10', className)}
    {...props}
  />
))

SidebarHeader.displayName = 'Sidebar.Header'

/**
 * Sidebar.Logo - Logo/brand text
 */
export const SidebarLogo = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-lg font-semibold text-white', className)}
    {...props}
  />
))

SidebarLogo.displayName = 'Sidebar.Logo'

/**
 * Sidebar.Nav - Navigation container
 */
export const SidebarNav = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn('flex-1 px-3 py-6 space-y-1 overflow-y-auto', className)}
      {...props}
    />
  )
)

SidebarNav.displayName = 'Sidebar.Nav'

/**
 * Sidebar.Item - Navigation item
 */
export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Whether this item is active/selected */
  active?: boolean
  /** Icon element to display before text */
  icon?: React.ReactNode
  /** Number badge to show (e.g., notification count) */
  badge?: number | string
  /** Custom className */
  className?: string
}

export const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ active = false, icon, badge, className, children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        'flex items-center justify-between',
        'px-4 py-3 rounded-button',
        'text-sm font-medium text-white text-opacity-80',
        'transition-all duration-150',
        'hover:text-opacity-100 hover:bg-white hover:bg-opacity-10',
        active && 'bg-sage-300 text-white text-opacity-100',
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-3">
        {icon && (
          <span className="inline-flex items-center justify-center w-5 h-5">
            {icon}
          </span>
        )}
        {children}
      </span>
      {badge && (
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold bg-cancelled text-white rounded-full">
          {badge}
        </span>
      )}
    </a>
  )
)

SidebarItem.displayName = 'Sidebar.Item'

/**
 * Sidebar.Divider - Visual divider between sections
 */
export const SidebarDivider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('my-4 border-t border-white border-opacity-10', className)}
    {...props}
  />
))

SidebarDivider.displayName = 'Sidebar.Divider'

/**
 * Sidebar.Section - Grouped section with title
 */
export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section title */
  title?: string
  /** Custom className */
  className?: string
}

export const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ title, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    >
      {title && (
        <div className="px-4 py-2 text-xs font-semibold text-white text-opacity-50 uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
)

SidebarSection.displayName = 'Sidebar.Section'

/**
 * Sidebar.Footer - Footer section for user menu or logout
 */
export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-6 py-4 border-t border-white border-opacity-10', className)}
    {...props}
  />
))

SidebarFooter.displayName = 'Sidebar.Footer'

// Attach sub-components to Sidebar
const SidebarWithSubcomponents = Sidebar as SidebarComponent
SidebarWithSubcomponents.Header = SidebarHeader
SidebarWithSubcomponents.Logo = SidebarLogo
SidebarWithSubcomponents.Nav = SidebarNav
SidebarWithSubcomponents.Item = SidebarItem
SidebarWithSubcomponents.Divider = SidebarDivider
SidebarWithSubcomponents.Section = SidebarSection
SidebarWithSubcomponents.Footer = SidebarFooter

export default SidebarWithSubcomponents as typeof Sidebar
