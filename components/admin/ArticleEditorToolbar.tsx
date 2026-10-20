'use client';

import { useState } from 'react';
import { Gift, Flame } from 'lucide-react';
import OfferPickerModal, { PickerOffer } from './OfferPickerModal';
import DealPickerModal, { PickerDeal } from './DealPickerModal';

interface ArticleEditorToolbarProps {
  /** Returns the live CKEditor instance (or null if not ready yet) */
  getEditor: () => any | null;
  /** Optional callback fired after a successful offer insert */
  onInserted?: (offer: PickerOffer) => void;
  /** Optional callback fired after a successful deal insert */
  onDealInserted?: (deal: PickerDeal) => void;
  /** Optional label override */
  hint?: string;
}

export default function ArticleEditorToolbar({
  getEditor,
  onInserted,
  onDealInserted,
  hint = 'Add an offer or deal card inside the article at the cursor position',
}: ArticleEditorToolbarProps) {
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [dealModalOpen, setDealModalOpen] = useState(false);

  // Insert raw shortcode at cursor
  const insertShortcode = (shortcode: string) => {
    const editor = getEditor();
    if (!editor) {
      alert('Editor is not ready yet. Please wait a moment and try again.');
      return false;
    }

    try {
      editor.model.change((writer: any) => {
        const selection = editor.model.document.selection;

        if (!selection.isCollapsed) {
          editor.model.deleteContent(selection, { doNotAutoparagraph: true });
        }

        const insertPosition =
          editor.model.document.selection.getFirstPosition();
        const textNode = writer.createText(shortcode);
        editor.model.insertContent(textNode, insertPosition);
      });

      editor.editing.view.focus();
      return true;
    } catch (err) {
      console.error('Failed to insert into editor:', err);
      return false;
    }
  };

  const handleInsertOffer = (offer: PickerOffer) => {
    if (insertShortcode(`[offer:${offer.id}]`)) {
      setOfferModalOpen(false);
      onInserted?.(offer);
    } else {
      alert('Could not insert the offer. Please try again.');
    }
  };

  const handleInsertDeal = (deal: PickerDeal) => {
    if (insertShortcode(`[deal:${deal.id}]`)) {
      setDealModalOpen(false);
      onDealInserted?.(deal);
    } else {
      alert('Could not insert the deal. Please try again.');
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
        <button
          type="button"
          onClick={() => setOfferModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow text-slate-950 text-xs font-bold rounded hover:bg-yellow/90 transition-colors"
        >
          <Gift size={14} />
          Insert Offer
        </button>

        <button
          type="button"
          onClick={() => setDealModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 transition-colors"
        >
          <Flame size={14} />
          Insert Deal
        </button>

        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      </div>

      <OfferPickerModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        onInsert={handleInsertOffer}
      />

      <DealPickerModal
        isOpen={dealModalOpen}
        onClose={() => setDealModalOpen(false)}
        onInsert={handleInsertDeal}
      />
    </>
  );
}