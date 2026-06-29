/**
 * Inline, render-blocking script that applies the saved theme before paint
 * to prevent a flash of the wrong color scheme. Injected via a <script> tag
 * with dangerouslySetInnerHTML in the root layout.
 */
export const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : systemDark;
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;
