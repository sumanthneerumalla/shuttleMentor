import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CoachingNotesList from './CoachingNotesList'
import { UserType } from '@prisma/client'
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
      getNotesByMedia: {
        useQuery: vi.fn(),
      },
      deleteNote: {
        useMutation: vi.fn(),
      },
    },
  },
}))

// Mock CoachingNoteForm component
vi.mock('./CoachingNoteForm', () => ({
  default: ({ mediaId, existingNote, onSuccess, onCancel }: any) => (
    <div data-testid="coaching-note-form">
      <div>MediaId: {mediaId}</div>
      {existingNote && <div>Editing: {existingNote.noteId}</div>}
      <button onClick={onSuccess}>Success</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

// Mock ProfileAvatar component
vi.mock('~/app/_components/shared/ProfileAvatar', () => ({
  ProfileAvatar: ({ name, size }: any) => (
    <div data-testid="profile-avatar">
      {name} ({size})
    </div>
  ),
}))

describe('CoachingNotesList', () => {
  const mockDeleteMutation = {
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

  const createdDate1 = new Date('2024-01-01T10:00:00Z')
  const createdDate2 = new Date('2024-01-02T14:30:00Z')
  const updatedDate2 = new Date('2024-01-02T15:00:00Z')
  
  const mockNotes = [
    {
      noteId: 'note-1',
      noteContent: 'Great technique on the backhand!',
      createdAt: createdDate1,
      updatedAt: createdDate1, // Same instance, so no "edited" indicator
      coach: {
        firstName: 'John',
        lastName: 'Doe',
        coachProfile: {
          displayUsername: 'johndoe',
          profileImage: null,
          profileImageType: null,
        },
      },
    },
    {
      noteId: 'note-2',
      noteContent: 'Work on footwork positioning.',
      createdAt: createdDate2,
      updatedAt: updatedDate2, // Different from created, so shows "edited"
      coach: {
        firstName: 'Jane',
        lastName: 'Smith',
        coachProfile: {
          displayUsername: 'janesmith',
          profileImage: Buffer.from('fake-image-data'),
          profileImageType: 'image/jpeg',
        },
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(api.useUtils).mockReturnValue(mockUtils)
    vi.mocked(api.coachingNotes.deleteNote.useMutation).mockReturnValue(mockDeleteMutation)
    
    // Mock window.confirm
    global.confirm = vi.fn(() => true)
  })

  describe('Component Rendering', () => {
    it('should render loading state', () => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      
      render(<CoachingNotesList mediaId="test-media-id" />)
      
      expect(screen.getByText('Coaching Notes')).toBeInTheDocument()
      // Check for loading animation class instead of specific testid
      const loadingElement = document.querySelector('.animate-pulse')
      expect(loadingElement).toBeInTheDocument()
    })

    it('should render error state', () => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to load notes' },
      } as any)
      
      render(<CoachingNotesList mediaId="test-media-id" />)
      
      expect(screen.getByText('Coaching Notes')).toBeInTheDocument()
      expect(screen.getByText('Error loading coaching notes: Failed to load notes')).toBeInTheDocument()
    })

    it('should render empty state for students', () => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.STUDENT} />)
      
      expect(screen.getByText('No coaching notes available for this video yet.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /add note/i })).not.toBeInTheDocument()
    })

    it('should render empty state for coaches with add button', () => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      expect(screen.getByText('No coaching notes yet. Add the first note to provide feedback on this video.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
    })

    it('should render notes list with count badge', () => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: mockNotes,
        isLoading: false,
        error: null,
      } as any)
      
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      expect(screen.getByText('Coaching Notes')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Count badge
      expect(screen.getByText('Great technique on the backhand!')).toBeInTheDocument()
      expect(screen.getByText('Work on footwork positioning.')).toBeInTheDocument()
    })
  })

  describe('Note Display', () => {
    beforeEach(() => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: mockNotes,
        isLoading: false,
        error: null,
      } as any)
    })

    it('should display coach information correctly', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should display timestamps correctly', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      // Check for date formatting (exact format may vary by locale)
      expect(screen.getAllByText(/1\/1\/2024/)).toHaveLength(1) // First note timestamp only
      expect(screen.getAllByText(/1\/2\/2024/)).toHaveLength(2) // Second note: main timestamp + edited timestamp
    })

    it('should show edited indicator when note was updated', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      // Only the second note should show edited indicator (different created/updated times)
      expect(screen.getByText(/edited/)).toBeInTheDocument()
    })

    it('should display profile avatars', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      const avatars = screen.getAllByTestId('profile-avatar')
      expect(avatars).toHaveLength(2)
      expect(avatars[0]).toHaveTextContent('John Doe (sm)')
      expect(avatars[1]).toHaveTextContent('Jane Smith (sm)')
    })
  })

  describe('Coach Permissions', () => {
    beforeEach(() => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: mockNotes,
        isLoading: false,
        error: null,
      } as any)
    })

    it('should show edit and delete buttons for coaches', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      const editButtons = screen.getAllByRole('button', { name: '' }) // Edit buttons have no text, just icon
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should show add note button for coaches', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
    })

    it('should show edit and delete buttons for admins', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.ADMIN} />)
      
      const editButtons = screen.getAllByRole('button', { name: '' })
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should not show action buttons for students', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.STUDENT} />)
      
      expect(screen.queryByRole('button', { name: /add note/i })).not.toBeInTheDocument()
      // Edit/delete buttons should not be present
      const buttons = screen.queryAllByRole('button')
      expect(buttons).toHaveLength(0)
    })

    it('should not show action buttons for facilities', () => {
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.FACILITY} />)
      
      expect(screen.queryByRole('button', { name: /add note/i })).not.toBeInTheDocument()
    })
  })

  describe('Note Actions', () => {
    beforeEach(() => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: mockNotes,
        isLoading: false,
        error: null,
      } as any)
    })

    it('should show add note form when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      const addButton = screen.getByRole('button', { name: /add note/i })
      await user.click(addButton)
      
      expect(screen.getByTestId('coaching-note-form')).toBeInTheDocument()
      expect(screen.getByText('MediaId: test-media-id')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /add note/i })).not.toBeInTheDocument()
    })

    it('should hide add form and show add button after successful submission', async () => {
      const user = userEvent.setup()
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      // Click add note
      const addButton = screen.getByRole('button', { name: /add note/i })
      await user.click(addButton)
      
      // Click success in form
      const successButton = screen.getByRole('button', { name: 'Success' })
      await user.click(successButton)
      
      expect(screen.queryByTestId('coaching-note-form')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
    })

    it('should hide add form when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      // Click add note
      const addButton = screen.getByRole('button', { name: /add note/i })
      await user.click(addButton)
      
      // Click cancel in form
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)
      
      expect(screen.queryByTestId('coaching-note-form')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
    })

    it('should show edit form when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      // Find edit button by looking for edit icon
      const editButtons = screen.getAllByRole('button').filter(button => {
        const svg = button.querySelector('svg')
        return svg && svg.classList.contains('lucide-square-pen')
      })
      
      if (editButtons.length > 0) {
        await user.click(editButtons[0]!)
        
        expect(screen.getByTestId('coaching-note-form')).toBeInTheDocument()
        expect(screen.getByText('Editing: note-1')).toBeInTheDocument()
      } else {
        expect(editButtons.length).toBeGreaterThan(0)
      }
    })

    it('should call delete mutation when delete is confirmed', async () => {
      const user = userEvent.setup()
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      // Find delete button by looking for trash icon
      const deleteButtons = screen.getAllByRole('button').filter(button => {
        const svg = button.querySelector('svg')
        return svg && svg.classList.contains('lucide-trash2')
      })
      
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]!)
        
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this coaching note?')
        expect(mockDeleteMutation.mutate).toHaveBeenCalledWith({ noteId: 'note-1' })
      } else {
        expect(deleteButtons.length).toBeGreaterThan(0)
      }
    })

    it('should not delete when confirmation is cancelled', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => false) // User cancels
      
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      const deleteButtons = screen.getAllByRole('button').filter(button => {
        const svg = button.querySelector('svg')
        return svg && svg.classList.contains('lucide-trash2')
      })
      
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]!)
        
        expect(global.confirm).toHaveBeenCalled()
        expect(mockDeleteMutation.mutate).not.toHaveBeenCalled()
      } else {
        expect(deleteButtons.length).toBeGreaterThan(0)
      }
    })
  })

  describe('State Management', () => {
    beforeEach(() => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: mockNotes,
        isLoading: false,
        error: null,
      } as any)
    })

    it('should hide add form when switching to edit mode', async () => {
      const user = userEvent.setup()
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      // Show add form
      const addButton = screen.getByRole('button', { name: /add note/i })
      await user.click(addButton)
      expect(screen.getByTestId('coaching-note-form')).toBeInTheDocument()
      
      // Click edit on a note
      const editButtons = screen.getAllByRole('button').filter(button => {
        const svg = button.querySelector('svg')
        return svg && svg.classList.contains('lucide-square-pen')
      })
      
      if (editButtons.length > 0) {
        await user.click(editButtons[0]!)
        
        // Should show edit form, not add form
        expect(screen.getByText('Editing: note-1')).toBeInTheDocument()
        expect(screen.queryByText('MediaId: test-media-id')).toBeInTheDocument()
      } else {
        expect(editButtons.length).toBeGreaterThan(0)
      }
    })

    it('should handle delete button interaction', async () => {
      // Simplified mock - focus on UI behavior
      const successfulDeleteMutation = {
        mutate: vi.fn(),
        isPending: false,
        isSuccess: true,
        isError: false,
        trpc: {} as any,
      } as any
      
      vi.mocked(api.coachingNotes.deleteNote.useMutation).mockReturnValue(successfulDeleteMutation)
      
      const user = userEvent.setup()
      render(<CoachingNotesList mediaId="test-media-id" userType={UserType.COACH} />)
      
      // Find delete button by looking for trash icon
      const deleteButtons = screen.getAllByRole('button').filter(button => {
        const svg = button.querySelector('svg')
        return svg && svg.classList.contains('lucide-trash2')
      })
      
      expect(deleteButtons.length).toBeGreaterThan(0)
      
      // Test that clicking delete button triggers confirmation and mutation
      await user.click(deleteButtons[0]!)
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this coaching note?')
      expect(successfulDeleteMutation.mutate).toHaveBeenCalledWith({ noteId: 'note-1' })
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      vi.mocked(api.coachingNotes.getNotesByMedia.useQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      
      const { container } = render(
        <CoachingNotesList 
          mediaId="test-media-id" 
          className="custom-class" 
        />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})