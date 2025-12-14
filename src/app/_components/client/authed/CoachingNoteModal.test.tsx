import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CoachingNoteModal from './CoachingNoteModal'
import { UserType } from '@prisma/client'

// Mock child components
vi.mock('./CoachingNoteForm', () => ({
  default: ({ mediaId, onSuccess, onCancel }: any) => (
    <div data-testid="coaching-note-form">
      <div>Form for media: {mediaId}</div>
      <button onClick={onSuccess}>Form Success</button>
      <button onClick={onCancel}>Form Cancel</button>
    </div>
  ),
}))

vi.mock('./CoachingNotesList', () => ({
  default: ({ mediaId, userType }: any) => (
    <div data-testid="coaching-notes-list">
      <div>Notes for media: {mediaId}</div>
      <div>User type: {userType}</div>
    </div>
  ),
}))

describe('CoachingNoteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    mediaId: 'test-media-id',
    mediaTitle: 'Test Video',
    studentName: 'John Student',
    collectionTitle: 'Practice Session',
    userType: UserType.COACH,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<CoachingNoteModal {...defaultProps} />)
      
      expect(screen.getByText('Coaching Notes')).toBeInTheDocument()
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'John Student • Practice Session • Test Video'
      })).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<CoachingNoteModal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Coaching Notes')).not.toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(<CoachingNoteModal {...defaultProps} onClose={onClose} />)
      
      const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when Close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      render(<CoachingNoteModal {...defaultProps} onClose={onClose} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Header Information', () => {
    it('should display correct header information', () => {
      render(<CoachingNoteModal {...defaultProps} />)
      
      expect(screen.getByText('Coaching Notes')).toBeInTheDocument()
      // Use more flexible text matching for the subtitle
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'John Student • Practice Session • Test Video'
      })).toBeInTheDocument()
    })

    it('should handle different student and media information', () => {
      const customProps = {
        ...defaultProps,
        studentName: 'Jane Doe',
        collectionTitle: 'Tournament Prep',
        mediaTitle: 'Serve Practice',
      }
      
      render(<CoachingNoteModal {...customProps} />)
      
      // Use more flexible text matching
      expect(screen.getByText((content, element) => {
        return element?.textContent === 'Jane Doe • Tournament Prep • Serve Practice'
      })).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should show View Notes tab by default', () => {
      render(<CoachingNoteModal {...defaultProps} />)
      
      const viewTab = screen.getByRole('button', { name: /view notes/i })
      expect(viewTab).toHaveClass('text-[var(--primary)]')
      expect(viewTab).toHaveClass('border-[var(--primary)]')
      
      expect(screen.getByTestId('coaching-notes-list')).toBeInTheDocument()
      expect(screen.queryByTestId('coaching-note-form')).not.toBeInTheDocument()
    })

    it('should show Add Note tab for coaches', () => {
      render(<CoachingNoteModal {...defaultProps} userType={UserType.COACH} />)
      
      expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
    })

    it('should show Add Note tab for admins', () => {
      render(<CoachingNoteModal {...defaultProps} userType={UserType.ADMIN} />)
      
      expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
    })

    it('should not show Add Note tab for students', () => {
      render(<CoachingNoteModal {...defaultProps} userType={UserType.STUDENT} />)
      
      expect(screen.queryByRole('button', { name: /add note/i })).not.toBeInTheDocument()
    })

    it('should not show Add Note tab for facilities', () => {
      render(<CoachingNoteModal {...defaultProps} userType={UserType.FACILITY} />)
      
      expect(screen.queryByRole('button', { name: /add note/i })).not.toBeInTheDocument()
    })

    it('should switch to Add Note tab when clicked', async () => {
      const user = userEvent.setup()
      render(<CoachingNoteModal {...defaultProps} userType={UserType.COACH} />)
      
      const addTab = screen.getByRole('button', { name: /add note/i })
      await user.click(addTab)
      
      expect(addTab).toHaveClass('text-[var(--primary)]')
      expect(addTab).toHaveClass('border-[var(--primary)]')
      
      expect(screen.getByTestId('coaching-note-form')).toBeInTheDocument()
      expect(screen.queryByTestId('coaching-notes-list')).not.toBeInTheDocument()
    })

    it('should switch back to View Notes tab when clicked', async () => {
      const user = userEvent.setup()
      render(<CoachingNoteModal {...defaultProps} userType={UserType.COACH} />)
      
      // Switch to Add Note tab first
      const addTab = screen.getByRole('button', { name: /add note/i })
      await user.click(addTab)
      
      // Switch back to View Notes tab
      const viewTab = screen.getByRole('button', { name: /view notes/i })
      await user.click(viewTab)
      
      expect(viewTab).toHaveClass('text-[var(--primary)]')
      expect(viewTab).toHaveClass('border-[var(--primary)]')
      
      expect(screen.getByTestId('coaching-notes-list')).toBeInTheDocument()
      expect(screen.queryByTestId('coaching-note-form')).not.toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    it('should render CoachingNotesList with correct props in view mode', () => {
      render(<CoachingNoteModal {...defaultProps} />)
      
      const notesList = screen.getByTestId('coaching-notes-list')
      expect(notesList).toBeInTheDocument()
      expect(screen.getByText('Notes for media: test-media-id')).toBeInTheDocument()
      expect(screen.getByText('User type: COACH')).toBeInTheDocument()
    })

    it('should render CoachingNoteForm with correct props in add mode', async () => {
      const user = userEvent.setup()
      render(<CoachingNoteModal {...defaultProps} userType={UserType.COACH} />)
      
      const addTab = screen.getByRole('button', { name: /add note/i })
      await user.click(addTab)
      
      const noteForm = screen.getByTestId('coaching-note-form')
      expect(noteForm).toBeInTheDocument()
      expect(screen.getByText('Form for media: test-media-id')).toBeInTheDocument()
    })

    it('should pass different userType to components', () => {
      render(<CoachingNoteModal {...defaultProps} userType={UserType.STUDENT} />)
      
      expect(screen.getByText('User type: STUDENT')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should switch to view tab when form submission is successful', async () => {
      const user = userEvent.setup()
      render(<CoachingNoteModal {...defaultProps} userType={UserType.COACH} />)
      
      // Switch to Add Note tab
      const addTab = screen.getByRole('button', { name: /add note/i })
      await user.click(addTab)
      
      // Simulate successful form submission
      const formSuccessButton = screen.getByRole('button', { name: 'Form Success' })
      await user.click(formSuccessButton)
      
      // Should switch back to view tab
      expect(screen.getByTestId('coaching-notes-list')).toBeInTheDocument()
      expect(screen.queryByTestId('coaching-note-form')).not.toBeInTheDocument()
      
      const viewTab = screen.getByRole('button', { name: /view notes/i })
      expect(viewTab).toHaveClass('text-[var(--primary)]')
    })

    it('should switch to view tab when form is cancelled', async () => {
      const user = userEvent.setup()
      render(<CoachingNoteModal {...defaultProps} userType={UserType.COACH} />)
      
      // Switch to Add Note tab
      const addTab = screen.getByRole('button', { name: /add note/i })
      await user.click(addTab)
      
      // Simulate form cancellation
      const formCancelButton = screen.getByRole('button', { name: 'Form Cancel' })
      await user.click(formCancelButton)
      
      // Should switch back to view tab
      expect(screen.getByTestId('coaching-notes-list')).toBeInTheDocument()
      expect(screen.queryByTestId('coaching-note-form')).not.toBeInTheDocument()
    })
  })

  describe('Modal Styling and Layout', () => {
    it('should have correct modal structure', () => {
      const { container } = render(<CoachingNoteModal {...defaultProps} />)
      
      // Check for modal overlay
      const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50')
      expect(overlay).toBeInTheDocument()
      
      // Check for modal content
      const modal = container.querySelector('.bg-white.rounded-lg.shadow-xl')
      expect(modal).toBeInTheDocument()
    })

    it('should have scrollable content area', () => {
      const { container } = render(<CoachingNoteModal {...defaultProps} />)
      
      const contentArea = container.querySelector('.max-h-\\[60vh\\].overflow-y-auto')
      expect(contentArea).toBeInTheDocument()
    })

    it('should be responsive', () => {
      const { container } = render(<CoachingNoteModal {...defaultProps} />)
      
      const modal = container.querySelector('.max-w-4xl.w-full')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper modal structure for screen readers', () => {
      render(<CoachingNoteModal {...defaultProps} />)
      
      // Modal should have a heading
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Coaching Notes')
      
      // Tabs should be properly labeled
      expect(screen.getByRole('button', { name: /view notes/i })).toBeInTheDocument()
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<CoachingNoteModal {...defaultProps} userType={UserType.COACH} />)
      
      // Focus the first tab button directly
      const viewNotesTab = screen.getByRole('button', { name: /view notes/i })
      viewNotesTab.focus()
      expect(viewNotesTab).toHaveFocus()
      
      // Tab to next button
      await user.tab()
      expect(screen.getByRole('button', { name: /add note/i })).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined userType gracefully', () => {
      render(<CoachingNoteModal {...defaultProps} userType={undefined} />)
      
      expect(screen.getByText('Coaching Notes')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /add note/i })).not.toBeInTheDocument()
    })

    it('should handle empty strings in props', () => {
      const emptyProps = {
        ...defaultProps,
        mediaTitle: '',
        studentName: '',
        collectionTitle: '',
      }
      
      render(<CoachingNoteModal {...emptyProps} />)
      
      expect(screen.getByText('Coaching Notes')).toBeInTheDocument()
      // Check for the pattern with empty strings and separators
      expect(screen.getByText((content, element) => {
        return element?.textContent === ' •  • '
      })).toBeInTheDocument()
    })
  })
})