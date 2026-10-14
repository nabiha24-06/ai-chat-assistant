import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    mammoth?: any;
  }
}

const MAMMOTH_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

function loadMammothFromCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.mammoth) return resolve(window.mammoth);
    const script = document.createElement('script');
    script.src = MAMMOTH_CDN_URL;
    script.onload = () => resolve(window.mammoth);
    script.onerror = () => reject(new Error('Failed to load DOCX parser from CDN. Please check your internet connection and try again.'));
    document.head.appendChild(script);
  });
}

export async function parseDocument(file: File): Promise<{ text: string; type: string }> {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop() || '';

  if (ext === 'txt') {
    const text = await file.text();
    return { text, type: 'txt' };
  }

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n\n';
    }
    return { text: fullText.trim(), type: 'pdf' };
  }

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await loadMammothFromCDN();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: result.value, type: 'docx' };
  }

  throw new Error(`Unsupported file type: .${ext}. Please upload PDF, TXT, or DOCX files.`);
}
