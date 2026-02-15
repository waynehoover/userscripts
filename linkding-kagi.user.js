// ==UserScript==
// @name         Linkding in Kagi
// @namespace    https://github.com/waynehoover/userscripts
// @downloadURL  https://github.com/waynehoover/userscripts/raw/main/linkding-kagi.user.js
// @updateURL    https://github.com/waynehoover/userscripts/raw/main/linkding-kagi.user.js
// @version      0.0.1
// @description  Injects Linkding bookmark results in Kagi search results
// @author       Wayne Hoover
// @match        https://kagi.com/*
// @match        https://www.kagi.com/*
// @icon         https://raw.githubusercontent.com/sissbruecker/linkding/master/linkding/static/logo.svg
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function () {
  "use strict";

  // Configuration - edit these values as needed
  const CONFIG = {
    url: "http://localhost:9090",  // Linkding instance URL
    apiToken: "YOUR_API_TOKEN",    // Settings > Integrations > REST API
    nbResults: 3,                  // Number of results to display
  };

  const sidebarSelector = ".right-content-box > ._0_right_sidebar";
  const resultsDivId = "LinkdingResults";
  const loadingSpanId = "LinkdingLoading";

  const style = document.createElement("style");
  style.textContent = `
    ._0_right_sidebar:has(#${resultsDivId}) {
      width: auto !important;
      min-width: 18rem;
    }
    #${resultsDivId} {
      margin-bottom: 2em;
    }
    #${resultsDivId} .linkding-header {
      margin-bottom: 1em;
    }
    #${resultsDivId} .linkding-header-title {
      font-size: 1.2em;
    }
    #${resultsDivId} .linkding-tags {
      margin-top: 0.3em;
      display: flex;
      flex-wrap: wrap;
      gap: 0.3em;
    }
    #${resultsDivId} .linkding-tag {
      font-size: 0.8em;
      padding: 0.1em 0.5em;
      border-radius: 3px;
      background: var(--search-result-tag-bg, #e8e8e8);
      color: var(--search-result-tag-text, #555);
    }
  `;
  document.head.appendChild(style);

  let lastQuery = "";

  const logo = `<svg height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<style>
.ld { fill: #5765f2; }
@media (prefers-color-scheme: dark) { .ld { fill: #7b87f5; } }
</style>
<path class="ld" d="M5 2h14a1 1 0 0 1 1 1v19.143a.5.5 0 0 1-.766.424L12 18.03l-7.234 4.536A.5.5 0 0 1 4 22.143V3a1 1 0 0 1 1-1z"/>
</svg>`;

  function searchLinkding() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (!query) return;

    if (query === lastQuery) return;
    lastQuery = query;

    if (!injectResultsContainer()) {
      lastQuery = "";
      return;
    }
    injectTitle();
    injectLoadingLabel();

    GM.xmlHttpRequest({
      method: "GET",
      url: `${CONFIG.url}/api/bookmarks/?q=${encodeURIComponent(query)}&limit=${CONFIG.nbResults}`,
      headers: { Authorization: `Token ${CONFIG.apiToken}` },
      onload: function (res) {
        const data = JSON.parse(res.response);
        const results = data.results || [];
        removeLoadingLabel(results.length > 0);

        const resultsDiv = document.getElementById(resultsDivId);
        if (!resultsDiv) return;

        document.querySelectorAll("[data-linkding-result]").forEach(el => el.remove());

        for (const item of results) {
          let hostname = "";
          try { hostname = new URL(item.url).hostname; } catch {}

          const tags = (item.tag_names || [])
            .map(t => `<span class="linkding-tag">#${t}</span>`)
            .join("");

          const element = document.createElement("div");
          element.className = "_0_SRI search-result";
          element.setAttribute("data-linkding-result", "");
          element.innerHTML = `
            <div class="_0_TITLE __sri-title">
              <h3 class="__sri-title-box">
                <a class="__sri_title_link _0_sri_title_link _0_URL"
                   title="${item.title}"
                   href="${item.url}" rel="noopener noreferrer">
                  ${item.title || item.url}
                </a>
              </h3>
            </div>
            <div class="__sri-url-box">
              <a class="_0_URL __sri-url" href="${item.url}" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">
                <div class="__sri_url_path_box">
                  <span class="host">${hostname}</span>
                </div>
              </a>
            </div>
            <div class="__sri-body">
              <div class="_0_DESC __sri-desc">
                ${item.description ? `<div>${item.description}</div>` : ""}
                ${tags ? `<div class="linkding-tags">${tags}</div>` : ""}
              </div>
            </div>
          `;
          resultsDiv.appendChild(element);
        }
      },
      onerror: function (res) {
        console.log("Linkding error", res);
        const span = document.getElementById(loadingSpanId);
        if (span) {
          span.innerHTML = "Error: Could not connect to Linkding.";
        }
      },
    });
  }

  function injectResultsContainer() {
    document.getElementById(resultsDivId)?.remove();
    let sidebar = document.querySelector(sidebarSelector);
    if (!sidebar) {
      let outerSidebar = document.querySelector(".right-content-box");
      if (!outerSidebar) {
        const main = document.querySelector("main");
        if (!main) return false;
        outerSidebar = document.createElement("div");
        outerSidebar.className = "right-content-box";
        main.insertAdjacentElement("afterend", outerSidebar);
      }
      sidebar = document.createElement("div");
      sidebar.className = "_0_right_sidebar";
      outerSidebar.prepend(sidebar);
    }
    const resultsDiv = document.createElement("div");
    resultsDiv.id = resultsDivId;
    sidebar.prepend(resultsDiv);
    return true;
  }

  function injectTitle() {
    const resultsDiv = document.getElementById(resultsDivId);
    if (!resultsDiv || resultsDiv.querySelector(".linkding-header")) return;
    const title = document.createElement("div");
    title.className = "linkding-header";
    title.innerHTML = `<span class="linkding-header-title">${logo}&nbsp;Linkding bookmarks</span>`;
    resultsDiv.appendChild(title);
  }

  function injectLoadingLabel() {
    if (document.getElementById(loadingSpanId)) return;
    const resultsDiv = document.getElementById(resultsDivId);
    if (!resultsDiv) return;
    const label = document.createElement("span");
    label.id = loadingSpanId;
    label.className = "linkding-loading";
    label.textContent = "Loading...";
    resultsDiv.appendChild(label);
  }

  function removeLoadingLabel(foundResults = true) {
    const span = document.getElementById(loadingSpanId);
    if (!span) return;
    if (foundResults) {
      span.remove();
    } else {
      span.textContent = "No bookmarks found";
    }
  }

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) return resolve(element);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }, timeout);
    });
  }

  function watchForSearchChanges() {
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        lastQuery = "";
        waitForElement("main").then(searchLinkding);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", () => {
      lastQuery = "";
      waitForElement("main").then(searchLinkding);
    });
  }

  console.log("Loading Linkding injector");
  watchForSearchChanges();
  waitForElement("main").then(searchLinkding);
})();
