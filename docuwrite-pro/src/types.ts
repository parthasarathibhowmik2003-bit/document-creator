/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink, FileText, Download, Wand2, Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, Type, Undo, Redo, Eraser, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface DocumentState {
  id: string;
  title: string;
  content: string;
  alignment: TextAlignment;
  lastSaved: Date;
}

export const DOCUMENT_THEMES = {
  modern: {
    primary: 'indigo',
    font: 'font-sans',
  },
  classic: {
    primary: 'slate',
    font: 'font-serif',
  },
  technical: {
    primary: 'blue',
    font: 'font-mono',
  }
};
