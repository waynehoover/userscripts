// ==UserScript==
// @name         GitHub Copy PR Link
// @namespace    https://github.com/waynehoover/userscripts
// @downloadURL  https://github.com/waynehoover/userscripts/raw/main/github-copy-link.user.js
// @updateURL    https://github.com/waynehoover/userscripts/raw/main/github-copy-link.user.js
// @version      0.0.1
// @description  Press 'e' to copy the current PR/issue as a clickable HTML link
// @author       Wayne Hoover
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea, select, [contenteditable]")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "e") copyLink();
  });

  function copyLink() {
    const el = document.querySelector(".markdown-title");
    if (!el) return;

    const title = el.textContent.trim();
    if (!title) return;

    const meta = document.querySelector('meta[property="og:url"]');
    const url = meta ? meta.content.trim() : location.href.trim();

    const html = `<a href="${url}">${title}</a>`;

    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([url], { type: "text/plain" }),
      }),
    ]).then(() => {
      showBanner("Copied: " + title);
    }).catch((err) => {
      showBanner("Copy failed: " + err.message);
    });
  }

  function showBanner(message) {
    const banner = document.createElement("div");
    banner.textContent = message;
    Object.assign(banner.style, {
      position: "fixed",
      top: "12px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1f2328",
      color: "#f0f0f0",
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "14px",
      zIndex: "99999",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      transition: "opacity 0.3s",
    });
    document.body.appendChild(banner);
    setTimeout(() => {
      banner.style.opacity = "0";
      setTimeout(() => banner.remove(), 300);
    }, 2000);
  }
})();
