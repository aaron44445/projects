import React from 'react'
import { cn, classNamePatterns } from '../lib/utils'

/**
 * Table component with striped rows and hover effects
 *
 * @example
 * ```tsx
 * <Table>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head>Name</Table.Head>
 *       <Table.Head>Email</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>John</Table.Cell>
 *       <Table.Cell>john@example.com</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Whether to stripe alternate rows */
  striped?: boolean
  /** Custom className */
  className?: string
}

interface TableComponent extends React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>> {
  Header: typeof TableHeader
  Body: typeof TableBody
  Footer: typeof TableFooter
  Row: typeof TableRow
  Head: typeof TableHead
  Cell: typeof TableCell
}

/**
 * Table component - main wrapper
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ striped = true, className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-card border border-gray-100 shadow-card">
      <table
        ref={ref}
        className={cn('w-full border-collapse', className)}
        {...props}
      />
    </div>
  )
)

Table.displayName = 'Table'

/**
 * Table.Header - Table header section
 */
export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('bg-cream-100', className)}
      {...props}
    />
  )
)

TableHeader.displayName = 'Table.Header'

/**
 * Table.Body - Table body section
 */
export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('divide-y divide-gray-100', className)}
      {...props}
    />
  )
)

TableBody.displayName = 'Table.Body'

/**
 * Table.Footer - Table footer section
 */
export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('bg-cream-100 border-t border-gray-100', className)}
      {...props}
    />
  )
)

TableFooter.displayName = 'Table.Footer'

/**
 * Table.Row - Table row with hover effect
 */
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Whether row is striped (alternate background) */
  isStriped?: boolean
  /** Whether row is hovered */
  isHovered?: boolean
  /** Whether row is selected */
  isSelected?: boolean
  /** Custom className */
  className?: string
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ isStriped, isHovered, isSelected, className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'hover:bg-gray-50 transition-colors duration-150',
        isStriped && 'even:bg-gray-50',
        isSelected && 'bg-sage-50',
        className
      )}
      {...props}
    />
  )
)

TableRow.displayName = 'Table.Row'

/**
 * Table.Head - Table header cell
 */
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Align content */
  align?: 'left' | 'center' | 'right'
  /** Custom className */
  className?: string
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ align = 'left', className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        classNamePatterns.tableHeader,
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    />
  )
)

TableHead.displayName = 'Table.Head'

/**
 * Table.Cell - Table data cell
 */
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Align content */
  align?: 'left' | 'center' | 'right'
  /** Custom className */
  className?: string
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ align = 'left', className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        classNamePatterns.tableCell,
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    />
  )
)

TableCell.displayName = 'Table.Cell'

// Attach sub-components to Table
const TableWithSubcomponents = Table as TableComponent
TableWithSubcomponents.Header = TableHeader
TableWithSubcomponents.Body = TableBody
TableWithSubcomponents.Footer = TableFooter
TableWithSubcomponents.Row = TableRow
TableWithSubcomponents.Head = TableHead
TableWithSubcomponents.Cell = TableCell

export default TableWithSubcomponents as typeof Table
