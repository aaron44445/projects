/**
 * Pecase UI Component Library
 * Shared components for all applications
 */

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button'
export {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  type CardProps,
} from './Card'
export {
  Input,
  Textarea,
  Select,
  type InputProps,
  type InputType,
  type TextareaProps,
  type SelectProps,
} from './Input'
export { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, type ModalProps } from './Modal'
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  type TableProps,
  type TableRowProps,
  type TableHeadProps,
  type TableCellProps,
} from './Table'
export {
  Badge,
  StatusBadge,
  AppointmentStatusBadge,
  type BadgeProps,
  type BadgeStatus,
  type BadgeColor,
  type BadgeVariant,
} from './Badge'
export {
  StatCard,
  StatCardGrid,
  type StatCardProps,
  type StatCardGridProps,
} from './StatCard'
export {
  Sidebar,
  SidebarHeader,
  SidebarLogo,
  SidebarNav,
  SidebarItem,
  SidebarDivider,
  SidebarSection,
  SidebarFooter,
  type SidebarProps,
  type SidebarItemProps,
  type SidebarSectionProps,
} from './Sidebar'

// Default exports for convenience
export { default as ButtonComponent } from './Button'
export { default as CardComponent } from './Card'
export { default as InputComponent } from './Input'
export { default as ModalComponent } from './Modal'
export { default as TableComponent } from './Table'
export { default as BadgeComponent } from './Badge'
export { default as StatCardComponent } from './StatCard'
export { default as SidebarComponent } from './Sidebar'
