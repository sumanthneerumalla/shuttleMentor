import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CoachSelector from './CoachSelector'
import { api } from '~/trpc/react'

// Mock the tRPC API
vi.mock('~/trpc/react', () => ({
  api: {
    coaches: {
      getClubCoaches: {
        useQuery: vi.fn(),
      },
    },
    videoCollection: {
      assignCoach: {
        useMutation: vi.fn(),
      },
    },
  },
}))

describe('CoachSelector', () => {
  const mockCoachesQuery = {
    data: {
      coaches: [
        {
          userId: 'coach1',
          coachProfileId: 'profile1',
          displayUsername: 'coach_john',
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Experienced coach',
          specialties: ['Singles', 'Doubles'],
          rate: 150,
          isVerified: true,
          profileImageUrl: null,
          clubId: 'club1',
          clubName: 'Test Club',
        },
        {
          userId: 'coach2',
          coachProfileId: 'profile2',
          displayUsername: 'coach_jane',
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Professional coach',
          specialties: ['Advanced Training'],
          rate: 75,
          isVerified: false,
          profileImageUrl: null,
          clubId: 'club1',
          clubName: 'Test Club',
        },
      ],
      clubId: 'club1',
      clubName: 'Test Club',
    },
    isLoading: false,
    error: null,
  }

  const mockAssignMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.coaches.getClubCoaches.useQuery as any).mockReturnValue(mockCoachesQuery)
    ;(api.videoCollection.assignCoach.useMutation as any).mockReturnValue(mockAssignMutation)
  })

  it('renders coach list rendering', () => {
    render(
      <CoachSelector
        collectionId="collection1"
        currentCoachId={null}
        onCoachAssigned={vi.fn()}
      />
    )

    expect(screen.getByText('Assigned Coach')).toBeInTheDocument()
    expect(screen.getByText('No coach assigned')).toBeInTheDocument()
    expect(screen.getByText('Select Coach')).toBeInTheDocument()
  })

  it('displays current coach when assigned', () => {
    render(
      <CoachSelector
        collectionId="collection1"
        currentCoachId="coach1"
        onCoachAssigned={vi.fn()}
      />
    )

    expect(screen.getByText('coach_john')).toBeInTheDocument()
    expect(screen.getByText('Test Club')).toBeInTheDocument()
    expect(screen.getByText('Remove')).toBeInTheDocument()
  })

  it('handles coach selection interaction', () => {
    const onCoachAssigned = vi.fn()
    
    render(
      <CoachSelector
        collectionId="collection1"
        currentCoachId={null}
        onCoachAssigned={onCoachAssigned}
      />
    )

    // Click to open dropdown
    fireEvent.click(screen.getByText('Select Coach'))
    
    // Should show available coaches
    expect(screen.getByText('coach_john')).toBeInTheDocument()
    expect(screen.getByText('coach_jane')).toBeInTheDocument()
  })

  it('handles assignment removal', () => {
    const onCoachAssigned = vi.fn()
    
    render(
      <CoachSelector
        collectionId="collection1"
        currentCoachId="coach1"
        onCoachAssigned={onCoachAssigned}
      />
    )

    // Click remove button
    fireEvent.click(screen.getByText('Remove'))
    
    expect(mockAssignMutation.mutateAsync).toHaveBeenCalledWith({
      collectionId: 'collection1',
      coachId: undefined,
    })
  })

  it('shows loading state', () => {
    ;(api.coaches.getClubCoaches.useQuery as any).mockReturnValue({
      ...mockCoachesQuery,
      isLoading: true,
    })

    const { container } = render(
      <CoachSelector
        collectionId="collection1"
        currentCoachId={null}
        onCoachAssigned={vi.fn()}
      />
    )

    const loadingElement = container.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })

  it('shows error state', () => {
    ;(api.coaches.getClubCoaches.useQuery as any).mockReturnValue({
      ...mockCoachesQuery,
      error: { message: 'Failed to load coaches' },
    })

    render(
      <CoachSelector
        collectionId="collection1"
        currentCoachId={null}
        onCoachAssigned={vi.fn()}
      />
    )

    expect(screen.getByText('Unable to Load Coaches')).toBeInTheDocument()
    expect(screen.getByText('There was an error loading coaches from your club. Please try again later.')).toBeInTheDocument()
  })

  it('shows no coaches available message', () => {
    ;(api.coaches.getClubCoaches.useQuery as any).mockReturnValue({
      ...mockCoachesQuery,
      data: {
        ...mockCoachesQuery.data,
        coaches: [],
      },
    })

    render(
      <CoachSelector
        collectionId="collection1"
        currentCoachId={null}
        onCoachAssigned={vi.fn()}
      />
    )

    expect(screen.getByText('No coaches available from your club. Contact your club administrator to add coaches.')).toBeInTheDocument()
  })
})