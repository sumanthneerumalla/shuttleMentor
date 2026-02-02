import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/",
}));

// Mock tRPC
vi.mock("~/trpc/react", () => ({
	api: {
		useUtils: () => ({
			coachingNotes: {
				getNotesByMedia: {
					invalidate: vi.fn(),
				},
			},
		}),
		coachingNotes: {
			createNote: {
				useMutation: vi.fn(),
			},
			updateNote: {
				useMutation: vi.fn(),
			},
			deleteNote: {
				useMutation: vi.fn(),
			},
			getNotesByMedia: {
				useQuery: vi.fn(),
			},
		},
	},
}));

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
	useUser: () => ({
		user: {
			id: "test-user-id",
			firstName: "Test",
			lastName: "User",
		},
	}),
}));
