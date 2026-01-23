"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { Button } from "~/app/_components/shared/Button";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

type ClubOption = {
  clubId: string;
  clubName: string;
};

interface AdminClubIdSelectorProps {
  selectedClubId: string;
  selectedClubName: string;
  onSelect: (club: ClubOption) => void;
  className?: string;
}

export default function AdminClubIdSelector({
  selectedClubId,
  selectedClubName,
  onSelect,
  className,
}: AdminClubIdSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const {
    data: clubs,
    isLoading,
    error,
  } = api.user.getAvailableClubs.useQuery(undefined, {
    enabled: true,
  });

  const filteredClubs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const list: ClubOption[] = clubs ?? [];

    if (!normalizedQuery) return list;

    return list.filter((club: ClubOption) => {
      return (
        club.clubId.toLowerCase().includes(normalizedQuery) ||
        club.clubName.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [clubs, query]);

  const currentLabel = selectedClubName
    ? `${selectedClubName} (${selectedClubId})`
    : selectedClubId || "Select a club";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Club ID</label>
      </div>

      <Button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        variant="outline"
        className="w-full justify-between"
      >
        <span className="truncate">{currentLabel}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {isOpen && (
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              placeholder="Search clubs by id or name"
            />
          </div>

          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error.message}</div>
          ) : filteredClubs.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No clubs found</div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {filteredClubs.map((club) => {
                const isSelected = club.clubId === selectedClubId;

                return (
                  <button
                    key={club.clubId}
                    type="button"
                    className="dropdown-item w-full text-left"
                    onClick={() => {
                      onSelect(club);
                      setIsOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 truncate">{club.clubId}</div>
                        <div className="text-xs text-gray-500 truncate">{club.clubName}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[var(--primary)] mt-0.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">Admins can only select from existing clubs.</p>
    </div>
  );
}
