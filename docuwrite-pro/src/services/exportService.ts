import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export async function exportToDocx(title: string, htmlContent: string) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const paragraphs: Paragraph[] = [];

  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) {
        paragraphs.push(new Paragraph({
          children: [new TextRun(node.textContent)],
        }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      
      // Handle non-paragraph containers that might contain paragraphs (like text-align wrappers)
      if (el.tagName === 'DIV' && el.style.textAlign) {
        Array.from(el.childNodes).forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const childEl = child as HTMLElement;
            childEl.style.textAlign = el.style.textAlign;
          }
        });
      }

      const text = el.innerText || el.textContent || '';
      if (!text.trim() && el.tagName !== 'BR') return;

      let heading: any = undefined;
      if (el.tagName === 'H1') heading = HeadingLevel.HEADING_1;
      if (el.tagName === 'H2') heading = HeadingLevel.HEADING_2;
      if (el.tagName === 'H3') heading = HeadingLevel.HEADING_3;

      let alignment: any = AlignmentType.LEFT;
      const textAlign = el.style.textAlign || el.getAttribute('align');
      if (textAlign === 'center') alignment = AlignmentType.CENTER;
      else if (textAlign === 'right') alignment = AlignmentType.RIGHT;
      else if (textAlign === 'justify') alignment = AlignmentType.BOTH;

      // Detect bullet points
      const isBullet = el.tagName === 'LI';

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: el.tagName === 'B' || el.tagName === 'STRONG' || el.style.fontWeight === 'bold',
            italics: el.tagName === 'I' || el.tagName === 'EM' || el.style.fontStyle === 'italic',
            underline: el.tagName === 'U' || el.style.textDecoration === 'underline' ? {} : undefined,
          })
        ],
        heading: heading,
        alignment: alignment,
        spacing: { after: 200, line: 360 }, // 1.5 line spacing approx
        bullet: isBullet ? { level: 0 } : undefined,
      }));
    }
  }

  // Iterate top-level nodes
  Array.from(tempDiv.childNodes).forEach(processNode);

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title || 'document'}.docx`);
}
