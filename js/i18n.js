// Süzülüş — Language: Turkish or English, picked from the device or the settings, applied to the page at load
'use strict';

// a saved choice wins; otherwise a Turkish device gets Turkish and every other device English
const LANG = (() => {
  try {
    const s = localStorage.getItem('suzulus-lang');
    if (s === 'tr' || s === 'en') return s;
  } catch (e) { /* storage blocked */ }
  const langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
  return /^tr\b/i.test(langs[0] || '') ? 'tr' : 'en';
})();
const EN = LANG === 'en';
// tx('Türkçe', 'English'): the text for the current language
const tx = (tr, en) => (EN ? en : tr);
function setLang(l) {
  if (l === LANG) return;
  try { localStorage.setItem('suzulus-lang', l); } catch (e) { /* the choice lasts until the page reloads */ }
  location.reload();
}

/* The page is written in Turkish; elements carry their English text in data-en (text),
   data-en-aria (aria-label) and data-en-title (title). Text inside an element that also
   holds child elements (a button with a key hint) replaces only its first text run. */
(function applyPageLang() {
  document.documentElement.lang = LANG;
  for (const n of document.querySelectorAll('.ui[lang]')) n.lang = LANG;
  if (!EN) return;
  for (const n of document.querySelectorAll('[data-en]')) {
    const en = n.dataset.en;
    if (!n.children.length) { n.textContent = en; continue; }
    const t = [...n.childNodes].find((c) => c.nodeType === 3 && c.nodeValue.trim());
    if (t) t.nodeValue = t.nodeValue.replace(t.nodeValue.trim(), en);
  }
  for (const n of document.querySelectorAll('[data-en-aria]')) n.setAttribute('aria-label', n.dataset.enAria);
  for (const n of document.querySelectorAll('[data-en-title]')) n.title = n.dataset.enTitle;
})();
