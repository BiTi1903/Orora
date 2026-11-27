// Normalize pasted copy without changing case or punctuation.
export function phraseKey(text) {
  return text.normalize("NFC").trim().replace(/\s+/gu, " ");
}

export function translateVisiblePhrases(root, entries, locale) {
  const dictionary = new Map(Object.values(entries).map(entry => [phraseKey(entry.vi), entry[locale]]));
  const modified = new Map();

  function translate(node) {
    if (!node.parentElement || node.parentElement.closest("script,style,noscript,input,textarea,[contenteditable],[translate=no]")) return;
    const original = node.data;
    if (modified.get(node)?.rendered === original) return;
    const replacement = dictionary.get(phraseKey(original));
    if (!replacement || replacement === original) return;
    const rendered = original.replace(original.trim(), () => replacement);
    modified.set(node, { original, rendered });
    node.data = rendered;
  }

  function scan(node) {
    if (node.nodeType === 3) return translate(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translate(walker.currentNode);
  }

  scan(root);
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "characterData" && modified.get(record.target)?.rendered !== record.target.data) {
        modified.delete(record.target);
        translate(record.target);
      }
      for (const node of record.addedNodes) scan(node);
    }
    for (const node of modified.keys()) if (!root.contains(node)) modified.delete(node);
  });
  observer.observe(root, {childList: true, characterData: true, subtree: true});
  return () => {
    observer.disconnect();
    for (const [node, state] of modified) {
      if (node.data === state.rendered) node.data = state.original;
    }
  };
}
