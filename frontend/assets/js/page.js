import { observeReveal, renderShell } from './common.js?v=nav-public-1';

renderShell(document.body.dataset.page || '');
observeReveal();
