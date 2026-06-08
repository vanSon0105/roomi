import { observeReveal, renderShell } from './common.js?v=pages-path-1';

renderShell(document.body.dataset.page || '');
observeReveal();

