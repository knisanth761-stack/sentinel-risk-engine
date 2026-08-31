import { CircleDot } from "lucide-react";

export default function Topbar({ eyebrow, title, subtitle }) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">
          <CircleDot size={11} />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-right">
        <div className="service">
          <span className="status-dot" />
          ENGINE <b>ONLINE</b>
        </div>
        <div className="service">
          <span className="status-dot" />
          ML <b>ONLINE</b>
        </div>
      </div>
    </header>
  );
}
