"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { Button } from "~/app/_components/shared/Button";
import { AlertCircle, Save, X } from "lucide-react";

interface CoachingNoteFormProps {
  mediaId: string;
  existingNote?: {
    noteId: string;
    noteContent: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CoachingNoteForm({ 
  mediaId, 
  existingNote, 
  onSuccess, 
  onCancel 
}: CoachingNoteFormProps) {
  const [noteContent, setNoteContent] = useState(existingNote?.noteContent || "");
  const [error, setError] = useState<string>("");
  
  const utils = api.useUtils();
  
  // Create note mutation
  const createNote = api.coachingNotes.createNote.useMutation({
    onSuccess: () => {
      setNoteContent("");
      setError("");
      // Invalidate and refetch notes and dashboard metrics
      utils.coachingNotes.getNotesByMedia.invalidate({ mediaId });
      utils.user.getCoachDashboardMetrics.invalidate();
      utils.videoCollection.getAllMediaForCoaches.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      setError(error.message);
    },
  });
  
  // Update note mutation
  const updateNote = api.coachingNotes.updateNote.useMutation({
    onSuccess: () => {
      setError("");
      // Invalidate and refetch notes and dashboard metrics
      utils.coachingNotes.getNotesByMedia.invalidate({ mediaId });
      utils.user.getCoachDashboardMetrics.invalidate();
      utils.videoCollection.getAllMediaForCoaches.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      setError(error.message);
    },
  });
  
  const isSubmitting = createNote.isPending || updateNote.isPending;
  const isEditing = !!existingNote;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!noteContent.trim()) {
      setError("Note content is required");
      return;
    }
    
    if (noteContent.length > 2000) {
      setError("Note content must be 2000 characters or less");
      return;
    }
    
    setError("");
    
    if (isEditing && existingNote) {
      updateNote.mutate({
        noteId: existingNote.noteId,
        noteContent: noteContent.trim(),
      });
    } else {
      createNote.mutate({
        mediaId,
        noteContent: noteContent.trim(),
      });
    }
  };
  
  const handleCancel = () => {
    if (isEditing) {
      setNoteContent(existingNote?.noteContent || "");
    } else {
      setNoteContent("");
    }
    setError("");
    onCancel?.();
  };
  
  const characterCount = noteContent.length;
  const isOverLimit = characterCount > 2000;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm">
          <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div>
        <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 mb-2">
          {isEditing ? "Edit Coaching Note" : "Add Coaching Note"}
        </label>
        <textarea
          id="noteContent"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-vertical min-h-[100px]",
            isOverLimit ? "border-red-300" : "border-gray-300"
          )}
          placeholder="Enter your coaching feedback and observations..."
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-gray-500">
            Provide detailed feedback to help the student improve their technique and gameplay.
          </div>
          <div className={cn(
            "text-xs",
            isOverLimit ? "text-red-600" : characterCount > 1800 ? "text-yellow-600" : "text-gray-500"
          )}>
            {characterCount}/2000
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !noteContent.trim() || isOverLimit}
        >
          <Save className="w-4 h-4 mr-1" />
          {isSubmitting 
            ? (isEditing ? "Updating..." : "Saving...") 
            : (isEditing ? "Update Note" : "Save Note")
          }
        </Button>
      </div>
    </form>
  );
}