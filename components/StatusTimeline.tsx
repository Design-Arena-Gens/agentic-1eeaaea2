"use client";

import type { PropsWithChildren } from "react";

export type TimelineStatus = "pending" | "active" | "done" | "error";

export interface TimelineEntry {
  id: string;
  label: string;
  description: string;
  status: TimelineStatus;
}

interface StatusTimelineProps {
  entries: TimelineEntry[];
}

const StatusBadge = ({
  status,
  children
}: PropsWithChildren<{ status: TimelineStatus }>) => {
  return <span className={`status-badge status-${status}`}>{children}</span>;
};

const StatusTimeline = ({ entries }: StatusTimelineProps) => {
  if (!entries.length) {
    return null;
  }

  return (
    <aside className="card timeline-card">
      <h2>Status</h2>
      <ol className="timeline-list">
        {entries.map((entry) => (
          <li key={entry.id} className={`timeline-item timeline-${entry.status}`}>
            <div className="timeline-item-header">
              <span className="timeline-label">{entry.label}</span>
              <StatusBadge status={entry.status}>{entry.status}</StatusBadge>
            </div>
            <p className="timeline-description">{entry.description}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
};

export default StatusTimeline;
