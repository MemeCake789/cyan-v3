// src/markdown.js
import MarkdownIt from 'markdown-it';
import mdKatex from 'markdown-it-katex';

const md = new MarkdownIt({
  html: true, // Enable HTML tags in source
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification
});

// Add KaTeX plugin
md.use(mdKatex);

export function renderMarkdown(markdownString) {
  if (!markdownString) {
    return '';
  }
  return md.render(markdownString);
}