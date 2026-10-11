/* ============================================================
   识食 · 图标系统
   内联 SVG，24×24 视框，currentColor 描边
   替代 emoji —— emoji 在安卓/Windows/iOS 渲染差异极大且显廉价
   ============================================================ */
const ICON = {
  // 底部导航
  today: '<path d="M3 20h18"/><rect x="5" y="11" width="3.2" height="7" rx="1"/><rect x="10.4" y="7" width="3.2" height="11" rx="1"/><rect x="15.8" y="13" width="3.2" height="5" rx="1"/>',
  stock: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M12 11.5 20 7"/><path d="M12 11.5v8.5"/><path d="M12 11.5 4 7"/>',
  scan: '<path d="M3 8.5V6a2 2 0 0 1 2-2h2.5"/><path d="M16.5 4H19a2 2 0 0 1 2 2v2.5"/><path d="M21 15.5V18a2 2 0 0 1-2 2h-2.5"/><path d="M7.5 20H6a2 2 0 0 1-2-2v-2.5"/><circle cx="12" cy="12" r="3.2"/>',
  me: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>',

  // 功能
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14.5 5.5l4 4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  chevronDown: '<path d="M5 9l7 7 7-7"/>',
  bolt: '<path d="M13 3 5 13.5h6L11 21l8-10.5h-6z"/>',
  flame: '<path d="M12 3s5 5 5 9.5a5 5 0 0 1-10 0C7 9 12 3 12 3z"/><path d="M12 21a3.2 3.2 0 0 0 3.2-3.2c0-2.1-3.2-4.6-3.2-4.6s-3.2 2.5-3.2 4.6A3.2 3.2 0 0 0 12 21z"/>',
  scale: '<path d="M12 4v16"/><path d="M6 8h12"/><path d="M6 8 4 14a3 3 0 0 0 4 0z"/><path d="M18 8l-2 6a3 3 0 0 0 4 0z"/>',
  alert: '<path d="M12 4 3 19h18z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
  trash2: '<path d="M4 7h16"/><path d="M10 11v5M14 11v5"/><path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/>',
  save: '<path d="M5 5h11l3 3v11H5z"/><path d="M8 5v5h7V5"/><path d="M8 19v-5h8v5"/>',
  download: '<path d="M12 4v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>',
  upload: '<path d="M12 20V9"/><path d="M7.5 13.5 12 9l4.5 4.5"/><path d="M5 5h14"/>',
  trashAll: '<path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/><path d="M10 11.5v4M14 11.5v4"/>',
  dumbbell: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6"/><path d="M7 12h10"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  book: '<path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M17 7h2v13H8"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
  drop: '<path d="M12 3.5s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
};
/** 生成图标 SVG 字符串。size 默认 24 */
function icon(name, size = 24, cls = '') {
  const p = ICON[name] || '';
  return `<svg class="ic-svg ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
