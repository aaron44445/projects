import React, { useEffect } from 'react'
import { cn, classNamePatterns } from '../lib/utils'

/**
 * Modal component - centered overlay dialog with animations
 *
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose}>
 *   <Modal.Header>
 *     <Modal.Title>Confirm Delete</Modal.Title>
 *   </Modal.Header>
 *   <Modal.Body>
 *     Are you sure you want to delete this item?
 *   </Modal.Body>
 *   <Modal.Footer>
 *     <Button onClick={handleClose}>Cancel</Button>
 *     <Button variant="danger">Delete</Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close (e.g., on escape or backdrop click) */
  onClose: () => void
  /** Content of the modal */
  children: React.ReactNode
  /** Whether clicking backdrop should close modal */
  closeOnBackdropClick?: boolean
  /** Whether pressing escape should close modal */
  closeOnEscape?: boolean
  /** Custom className for modal content */
  className?: string
  /** Size variant of modal */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

/**
 * Modal component - main wrapper
 */
export const Modal: React.FC<ModalProps> & {
  Header: typeof ModalHeader
  Title: typeof ModalTitle
  Body: typeof ModalBody
  Footer: typeof ModalFooter
} = ({
  isOpen,
  onClose,
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  size = 'md',
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'auto'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        classNamePatterns.modalOverlay,
        'animate-fadeIn'
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          classNamePatterns.modalContent,
          sizeClasses[size],
          'animate-slideUp',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

Modal.displayName = 'Modal'

/**
 * Modal.Header - Header section with close button
 */
export const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between mb-4 pb-4 border-b border-gray-100', className)}
    {...props}
  >
    {props.children}
    {onClose && (
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close modal"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    )}
  </div>
))

ModalHeader.displayName = 'Modal.Header'

/**
 * Modal.Title - Title text in header
 */
export const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-2xl font-semibold text-charcoal-600', className)}
    {...props}
  />
))

ModalTitle.displayName = 'Modal.Title'

/**
 * Modal.Body - Main content area
 */
export const ModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('py-4', className)}
      {...props}
    />
  )
)

ModalBody.displayName = 'Modal.Body'

/**
 * Modal.Footer - Footer section with actions
 */
export const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-4 border-t border-gray-100 flex justify-end gap-3', className)}
      {...props}
    />
  )
)

ModalFooter.displayName = 'Modal.Footer'

// Attach sub-components to Modal
Modal.Header = ModalHeader
Modal.Title = ModalTitle
Modal.Body = ModalBody
Modal.Footer = ModalFooter

export default Modal
