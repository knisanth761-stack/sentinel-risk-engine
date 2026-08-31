import { History } from "lucide-react";
import EventRow from "./EventRow";
import EmptyState from "../shared/EmptyState";

export default function EventTimeline({ history }) {
  if (!history.length) {
    return (
      <EmptyState
        icon={<History size={30} />}
        title="No risk events this session"
        message="Analyzed transactions appear here in chronological order as real Sentinel results — nothing is fabricated."
      />
    );
  }

  return (
    <div className="event-timeline">
      {history.map((entry) => (
        <EventRow key={`${entry.id}-${entry.timestamp.getTime()}`} entry={entry} />
      ))}
    </div>
  );
}
