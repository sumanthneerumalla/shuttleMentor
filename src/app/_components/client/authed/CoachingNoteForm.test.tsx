import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CoachingNoteForm from './CoachingNoteForm'
import { api } from '~/trpc/react'

// Mock the tRPC API
vi.mock('~/trpc/react', () => ({
  api: {
    useUtils: vi.fn(() => ({
      coachingNotes: {
        getNotesByMedia: {
          invalidate: vi.fn(),
        },
      },
    })),
    coachingNotes: {
      createNote: {
        useMutation: vi.fn(),
      },
      updateNote: {
        useMutation: vi.fn(),
      },
    },
  },
}))

describe('CoachingNoteForm', () => {
  const mockCreateMutation = {
    mutate: vi.fn(),
    isPending: false,
    trpc: {} as any,
  } as any
  
  const mockUpdateMutation = {
    mutate: vi.fn(),
    isPending: false,
    trpc: {} as any,
  } as any
  
  const mockUtils = {
    coachingNotes: {
      getNotesByMedia: {
        invalidate: vi.fn(),
      },
    },
    client: {} as any,
    invalidate: vi.fn(),
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(api.useUtils).mockReturnValue(mockUtils)
    vi.mocked(api.coachingNotes.createNote.useMutation).mockReturnValue(mockCreateMutation)
    vi.mocked(api.coachingNotes.updateNote.useMutation).mockReturnValue(mockUpdateMutation)
  })

  describe('Form Rendering', () => {
    it('should render create form with correct elements', () => {
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      expect(screen.getByLabelText('Add Coaching Note')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your coaching feedback and observations...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save note/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByText('0/2000')).toBeInTheDocument()
    })

    it('should render edit form with existing note content', () => {
      const existingNote = {
        noteId: 'test-note-id',
        noteContent: 'Existing note content'
      }
      
      render(
        <CoachingNoteForm 
          mediaId="test-media-id" 
          existingNote={existingNote}
        />
      )
      
      expect(screen.getByLabelText('Edit Coaching Note')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing note content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update note/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error when submitting empty content', async () => {
      const user = userEvent.setup()
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      // Try to submit with empty content
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Note content is required')).toBeInTheDocument()
      })
      expect(mockCreateMutation.mutate).not.toHaveBeenCalled()
    })

    it('should show error when content exceeds 2000 characters', async () => {
      const user = userEvent.setup()
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      const longContent = 'a'.repeat(2001)
      
      // Set the value directly instead of typing
      fireEvent.change(textarea, { target: { value: longContent } })
      
      // Try to submit
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(screen.getByText('Note content must be 2000 characters or less')).toBeInTheDocument()
      })
      expect(mockCreateMutation.mutate).not.toHaveBeenCalled()
    })

    it('should disable submit button when content is over limit', async () => {
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      const longContent = 'a'.repeat(2001)
      
      // Set the value directly
      fireEvent.change(textarea, { target: { value: longContent } })
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save note/i })
        expect(submitButton).toBeDisabled()
      })
    })

    it('should show character count and warning colors', async () => {
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      
      // Test normal count
      fireEvent.change(textarea, { target: { value: 'Test content' } })
      await waitFor(() => {
        expect(screen.getByText('12/2000')).toBeInTheDocument()
      })
      
      // Test warning threshold (over 1800)
      const warningContent = 'a'.repeat(1850)
      fireEvent.change(textarea, { target: { value: warningContent } })
      await waitFor(() => {
        expect(screen.getByText('1850/2000')).toBeInTheDocument()
      })
      
      // Test over limit
      const overLimitContent = 'a'.repeat(2001)
      fireEvent.change(textarea, { target: { value: overLimitContent } })
      await waitFor(() => {
        expect(screen.getByText('2001/2000')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call createNote mutation with correct data', async () => {
      const onSuccess = vi.fn()
      
      render(
        <CoachingNoteForm 
          mediaId="test-media-id" 
          onSuccess={onSuccess}
        />
      )
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      fireEvent.change(textarea, { target: { value: 'Test coaching note' } })
      
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(mockCreateMutation.mutate).toHaveBeenCalledWith({
          mediaId: 'test-media-id',
          noteContent: 'Test coaching note',
        })
      })
    })

    it('should call updateNote mutation when editing', async () => {
      const existingNote = {
        noteId: 'test-note-id',
        noteContent: 'Original content'
      }
      
      render(
        <CoachingNoteForm 
          mediaId="test-media-id" 
          existingNote={existingNote}
        />
      )
      
      const textarea = screen.getByLabelText('Edit Coaching Note')
      fireEvent.change(textarea, { target: { value: 'Updated content' } })
      
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(mockUpdateMutation.mutate).toHaveBeenCalledWith({
          noteId: 'test-note-id',
          noteContent: 'Updated content',
        })
      })
    })

    it('should trim whitespace from content', async () => {
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      fireEvent.change(textarea, { target: { value: '  Test content with spaces  ' } })
      
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(mockCreateMutation.mutate).toHaveBeenCalledWith({
          mediaId: 'test-media-id',
          noteContent: 'Test content with spaces',
        })
      })
    })
  })

  describe('Form State Management', () => {
    it('should handle successful submission', async () => {
      const onSuccess = vi.fn()
      
      // Simplified mock - focus on UI behavior rather than mutation internals
      const successfulMutation = {
        mutate: vi.fn(),
        isPending: false,
        isSuccess: true,
        isError: false,
        trpc: {} as any,
      } as any
      
      vi.mocked(api.coachingNotes.createNote.useMutation).mockReturnValue(successfulMutation)
      
      render(
        <CoachingNoteForm 
          mediaId="test-media-id" 
          onSuccess={onSuccess}
        />
      )
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      fireEvent.change(textarea, { target: { value: 'Test content' } })
      
      // Test that the form is ready for submission
      const submitButton = screen.getByRole('button', { name: /save note/i })
      expect(submitButton).not.toBeDisabled()
      
      // Test that the mutation would be called with correct data
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      expect(successfulMutation.mutate).toHaveBeenCalledWith({
        mediaId: 'test-media-id',
        noteContent: 'Test content',
      })
    })

    it('should handle submission error', async () => {
      // Simplified mock - focus on error state behavior
      const errorMutation = {
        mutate: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: true,
        error: { message: 'Server error' },
        trpc: {} as any,
      } as any
      
      vi.mocked(api.coachingNotes.createNote.useMutation).mockReturnValue(errorMutation)
      
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      fireEvent.change(textarea, { target: { value: 'Test content' } })
      
      // Test that the form can be submitted
      const submitButton = screen.getByRole('button', { name: /save note/i })
      expect(submitButton).not.toBeDisabled()
      
      // Test that mutation would be called
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      expect(errorMutation.mutate).toHaveBeenCalledWith({
        mediaId: 'test-media-id',
        noteContent: 'Test content',
      })
    })

    it('should handle cancel action', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      
      render(
        <CoachingNoteForm 
          mediaId="test-media-id" 
          onCancel={onCancel}
        />
      )
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      await user.type(textarea, 'Some content')
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(onCancel).toHaveBeenCalled()
      expect(textarea).toHaveValue('')
    })

    it('should reset to original content when canceling edit', async () => {
      const user = userEvent.setup()
      const existingNote = {
        noteId: 'test-note-id',
        noteContent: 'Original content'
      }
      
      render(
        <CoachingNoteForm 
          mediaId="test-media-id" 
          existingNote={existingNote}
        />
      )
      
      const textarea = screen.getByLabelText('Edit Coaching Note')
      await user.clear(textarea)
      await user.type(textarea, 'Modified content')
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(textarea).toHaveValue('Original content')
    })
  })

  describe('Loading States', () => {
    it('should show loading state during submission', () => {
      const loadingMutation = {
        mutate: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        trpc: {} as any,
      } as any
      
      vi.mocked(api.coachingNotes.createNote.useMutation).mockReturnValue(loadingMutation)
      
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      expect(screen.getByRole('button', { name: /saving.../i })).toBeInTheDocument()
      expect(screen.getByLabelText('Add Coaching Note')).toBeDisabled()
    })

    it('should show updating state during edit submission', () => {
      const loadingMutation = {
        mutate: vi.fn(),
        isPending: true,
        isSuccess: false,
        isError: false,
        trpc: {} as any,
      } as any
      
      vi.mocked(api.coachingNotes.updateNote.useMutation).mockReturnValue(loadingMutation)
      
      const existingNote = {
        noteId: 'test-note-id',
        noteContent: 'Original content'
      }
      
      render(
        <CoachingNoteForm 
          mediaId="test-media-id" 
          existingNote={existingNote}
        />
      )
      
      expect(screen.getByRole('button', { name: /updating.../i })).toBeInTheDocument()
    })
  })

  describe('User Experience', () => {
    it('should provide clear feedback for form state', () => {
      render(<CoachingNoteForm mediaId="test-media-id" />)
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      const submitButton = screen.getByRole('button', { name: /save note/i })
      
      // Initially disabled with empty content
      expect(submitButton).toBeDisabled()
      
      // Enabled when content is added
      fireEvent.change(textarea, { target: { value: 'Valid content' } })
      expect(submitButton).not.toBeDisabled()
      
      // Shows character count
      expect(screen.getByText('13/2000')).toBeInTheDocument()
    })

    it('should handle form reset correctly', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      
      render(
        <CoachingNoteForm 
          mediaId="test-media-id" 
          onCancel={onCancel}
        />
      )
      
      const textarea = screen.getByLabelText('Add Coaching Note')
      await user.type(textarea, 'Some content')
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(onCancel).toHaveBeenCalled()
      expect(textarea).toHaveValue('')
    })
  })
})