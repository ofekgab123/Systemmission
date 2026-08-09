"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StickyNoteCapture, StickyNotesGrid } from "@/components/sticky-notes/sticky-notes-grid";
import { he } from "@/lib/i18n/he";

export default function DontForgetPage() {
  return (
    <div>
      <PageHeader title={he.dontForget.title} description={he.dontForget.description} />
      <div className="page-content">
        <StickyNoteCapture className="mb-6" />
        <StickyNotesGrid />
      </div>
    </div>
  );
}
