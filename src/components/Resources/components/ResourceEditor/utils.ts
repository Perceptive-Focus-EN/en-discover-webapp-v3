// src/components/Resources/components/ResourceEditor/utils.ts
export interface SelectionRange {
  start: number;
  end: number;
  text: string;
}

export const getSelection = (element: HTMLTextAreaElement): SelectionRange => {
  return {
    start: element.selectionStart,
    end: element.selectionEnd,
    text: element.value.substring(element.selectionStart, element.selectionEnd)
  };
};

export const insertText = (
  element: HTMLTextAreaElement,
  insertBefore: string,
  insertAfter: string = ''
): void => {
  const selection = getSelection(element);
  const newText = insertBefore + selection.text + insertAfter;
  const newValue = element.value.substring(0, selection.start) + 
                  newText + 
                  element.value.substring(selection.end);
  
  element.value = newValue;
  element.focus();
  
  // Restore selection
  const newCursorPos = selection.start + insertBefore.length;
  element.setSelectionRange(
    newCursorPos,
    newCursorPos + selection.text.length
  );
};

export const formatText = (
  element: HTMLTextAreaElement,
  format: string
): void => {
  const formatMap: Record<string, [string, string]> = {
    bold: ['**', '**'],
    italic: ['_', '_'],
    code: ['`', '`'],
    quote: ['> ', ''],
    h1: ['# ', ''],
    h2: ['## ', ''],
    h3: ['### ', ''],
    list: ['- ', '']
  };

  const [before, after] = formatMap[format] || ['', ''];
  insertText(element, before, after);
};