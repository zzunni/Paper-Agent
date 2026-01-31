"use client";

import React from "react";
import { FileText, Plus } from "lucide-react";

export default function Sidebar({ onNewProject }: { onNewProject: () => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <FileText size={18} color="white" />
        </div>
        <span className="sidebar-title">Paper Agent</span>
      </div>
      <button className="sidebar-new-btn" onClick={onNewProject}>
        <Plus size={18} />
        새 논문
      </button>
    </aside>
  );
}
