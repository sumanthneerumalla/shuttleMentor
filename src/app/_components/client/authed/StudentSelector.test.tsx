import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StudentSelector from "./StudentSelector";
import { SharingType } from "@prisma/client";

describe("StudentSelector", () => {
  const mockStudents = [
    {
      userId: "student1",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@example.com",
      studentProfile: {
        displayUsername: "alice_badminton",
      },
    },
    {
      userId: "student2",
      firstName: "Bob",
      lastName: "Smith",
      email: "bob@example.com",
      studentProfile: {
        displayUsername: null,
      },
    },
    {
      userId: "student3",
      firstName: "Charlie",
      lastName: "Brown",
      email: "charlie@example.com",
      studentProfile: {
        displayUsername: "charlie_player",
      },
    },
  ];

  const defaultProps = {
    students: mockStudents,
    selectedStudentIds: [],
    sharingType: SharingType.SPECIFIC_STUDENTS,
    onSharingTypeChange: vi.fn(),
    onStudentSelectionChange: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sharing type options", () => {
    render(<StudentSelector {...defaultProps} />);

    expect(screen.getByText("All Students in My Club")).toBeInTheDocument();
    expect(screen.getByText("Specific Students")).toBeInTheDocument();
  });

  it("shows student list when SPECIFIC_STUDENTS is selected", () => {
    render(<StudentSelector {...defaultProps} />);

    expect(screen.getByText("alice_badminton")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("charlie_player")).toBeInTheDocument();
  });

  it("hides student list when ALL_STUDENTS is selected", () => {
    render(
      <StudentSelector
        {...defaultProps}
        sharingType={SharingType.ALL_STUDENTS}
      />
    );

    expect(screen.queryByText("Select Students")).not.toBeInTheDocument();
    expect(screen.queryByText("alice_badminton")).not.toBeInTheDocument();
  });

  it("handles sharing type change to ALL_STUDENTS", () => {
    const onSharingTypeChange = vi.fn();
    render(
      <StudentSelector {...defaultProps} onSharingTypeChange={onSharingTypeChange} />
    );

    const allStudentsOption = screen.getByText("All Students in My Club").closest("div");
    if (allStudentsOption) {
      fireEvent.click(allStudentsOption);
    }

    expect(onSharingTypeChange).toHaveBeenCalledWith(SharingType.ALL_STUDENTS);
  });

  it("handles sharing type change to SPECIFIC_STUDENTS", () => {
    const onSharingTypeChange = vi.fn();
    render(
      <StudentSelector
        {...defaultProps}
        sharingType={SharingType.ALL_STUDENTS}
        onSharingTypeChange={onSharingTypeChange}
      />
    );

    const specificStudentsOption = screen.getByText("Specific Students").closest("div");
    if (specificStudentsOption) {
      fireEvent.click(specificStudentsOption);
    }

    expect(onSharingTypeChange).toHaveBeenCalledWith(SharingType.SPECIFIC_STUDENTS);
  });

  it("handles individual student selection", () => {
    const onStudentSelectionChange = vi.fn();
    render(
      <StudentSelector
        {...defaultProps}
        onStudentSelectionChange={onStudentSelectionChange}
      />
    );

    const studentItem = screen.getByText("alice_badminton").closest("div");
    if (studentItem) {
      fireEvent.click(studentItem);
    }

    expect(onStudentSelectionChange).toHaveBeenCalledWith(["student1"]);
  });

  it("handles student deselection", () => {
    const onStudentSelectionChange = vi.fn();
    render(
      <StudentSelector
        {...defaultProps}
        selectedStudentIds={["student1"]}
        onStudentSelectionChange={onStudentSelectionChange}
      />
    );

    const studentItem = screen.getByText("alice_badminton").closest("div");
    if (studentItem) {
      fireEvent.click(studentItem);
    }

    expect(onStudentSelectionChange).toHaveBeenCalledWith([]);
  });

  it("handles select all students", () => {
    const onStudentSelectionChange = vi.fn();
    render(
      <StudentSelector
        {...defaultProps}
        onStudentSelectionChange={onStudentSelectionChange}
      />
    );

    const selectAllButton = screen.getByText("Select All");
    fireEvent.click(selectAllButton);

    expect(onStudentSelectionChange).toHaveBeenCalledWith([
      "student1",
      "student2",
      "student3",
    ]);
  });

  it("handles clear all students", () => {
    const onStudentSelectionChange = vi.fn();
    render(
      <StudentSelector
        {...defaultProps}
        selectedStudentIds={["student1", "student2"]}
        onStudentSelectionChange={onStudentSelectionChange}
      />
    );

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(onStudentSelectionChange).toHaveBeenCalledWith([]);
  });

  it("shows search bar when there are more than 5 students", () => {
    const manyStudents = Array.from({ length: 10 }, (_, i) => ({
      userId: `student${i}`,
      firstName: `Student${i}`,
      lastName: `Last${i}`,
      email: `student${i}@example.com`,
      studentProfile: { displayUsername: null },
    }));

    render(<StudentSelector {...defaultProps} students={manyStudents} />);

    expect(
      screen.getByPlaceholderText("Search students by name or email...")
    ).toBeInTheDocument();
  });

  it("filters students based on search query", () => {
    const manyStudents = Array.from({ length: 10 }, (_, i) => ({
      userId: `student${i}`,
      firstName: `Student${i}`,
      lastName: `Last${i}`,
      email: `student${i}@example.com`,
      studentProfile: { displayUsername: null },
    }));

    render(<StudentSelector {...defaultProps} students={manyStudents} />);

    const searchInput = screen.getByPlaceholderText(
      "Search students by name or email..."
    );
    fireEvent.change(searchInput, { target: { value: "Student1" } });

    // Should show Student1 but not Student2
    expect(screen.getByText("Student1 Last1")).toBeInTheDocument();
    expect(screen.queryByText("Student2 Last2")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    const { container } = render(
      <StudentSelector {...defaultProps} isLoading={true} />
    );

    const loadingElement = container.querySelector(".animate-pulse");
    expect(loadingElement).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(
      <StudentSelector
        {...defaultProps}
        error="Failed to load students"
      />
    );

    expect(screen.getByText("Failed to load students")).toBeInTheDocument();
  });

  it("shows no students message when list is empty", () => {
    render(<StudentSelector {...defaultProps} students={[]} />);

    expect(
      screen.getByText(
        /No students found in your club/
      )
    ).toBeInTheDocument();
  });

  it("displays selection count", () => {
    render(
      <StudentSelector
        {...defaultProps}
        selectedStudentIds={["student1", "student2"]}
      />
    );

    expect(screen.getByText("2 students selected")).toBeInTheDocument();
  });

  it("displays singular form for single selection", () => {
    render(
      <StudentSelector
        {...defaultProps}
        selectedStudentIds={["student1"]}
      />
    );

    expect(screen.getByText("1 student selected")).toBeInTheDocument();
  });

  it("uses display username when available", () => {
    render(<StudentSelector {...defaultProps} />);

    expect(screen.getByText("alice_badminton")).toBeInTheDocument();
    expect(screen.getByText("charlie_player")).toBeInTheDocument();
  });

  it("uses full name when display username is not available", () => {
    render(<StudentSelector {...defaultProps} />);

    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("disables Select All button when loading", () => {
    render(<StudentSelector {...defaultProps} isLoading={true} />);

    const selectAllButton = screen.getByText("Select All");
    expect(selectAllButton).toBeDisabled();
  });

  it("disables Clear button when no students selected", () => {
    render(<StudentSelector {...defaultProps} selectedStudentIds={[]} />);

    const clearButton = screen.getByText("Clear");
    expect(clearButton).toBeDisabled();
  });
});
