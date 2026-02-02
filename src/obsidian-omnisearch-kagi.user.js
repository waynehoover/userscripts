// ==UserScript==
// @name         Obsidian Omnisearch in Kagi
// @namespace    https://github.com/waynehoover/userscripts
// @downloadURL  https://github.com/waynehoover/userscripts/raw/master/src/obsidian-omnisearch-kagi.user.js
// @updateURL    https://github.com/waynehoover/userscripts/raw/master/src/obsidian-omnisearch-kagi.user.js
// @version      0.0.1
// @description  Injects Obsidian notes in Kagi search results
// @author       Wayne Hoover
// @match        https://kagi.com/*
// @match        https://www.kagi.com/*
// @icon         https://obsidian.md/favicon.ico
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function () {
  "use strict";

  // Configuration - edit these values as needed
  const CONFIG = {
    port: 51361,      // Omnisearch HTTP server port
    nbResults: 3,     // Number of results to display
  };

  const sidebarSelector = ".right-content-box";
  const resultsDivId = "OmnisearchObsidianResults";
  const loadingSpanId = "OmnisearchObsidianLoading";

  let lastQuery = "";

  const logo = `<svg height="1em" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 256 256">
<style>
.purple { fill: #9974F8; }
@media (prefers-color-scheme: dark) { .purple { fill: #A88BFA; } }
</style>
<path class="purple" d="M94.82 149.44c6.53-1.94 17.13-4.9 29.26-5.71a102.97 102.97 0 0 1-7.64-48.84c1.63-16.51 7.54-30.38 13.25-42.1l3.47-7.14 4.48-9.18c2.35-5 4.08-9.38 4.9-13.56.81-4.07.81-7.64-.2-11.11-1.03-3.47-3.07-7.14-7.15-11.21a17.02 17.02 0 0 0-15.8 3.77l-52.81 47.5a17.12 17.12 0 0 0-5.5 10.2l-4.5 30.18a149.26 149.26 0 0 1 38.24 57.2ZM54.45 106l-1.02 3.06-27.94 62.2a17.33 17.33 0 0 0 3.27 18.96l43.94 45.16a88.7 88.7 0 0 0 8.97-88.5A139.47 139.47 0 0 0 54.45 106Z"/><path class="purple" d="m82.9 240.79 2.34.2c8.26.2 22.33 1.02 33.64 3.06 9.28 1.73 27.73 6.83 42.82 11.21 11.52 3.47 23.45-5.8 25.08-17.73 1.23-8.67 3.57-18.46 7.75-27.53a94.81 94.81 0 0 0-25.9-40.99 56.48 56.48 0 0 0-29.56-13.35 96.55 96.55 0 0 0-40.99 4.79 98.89 98.89 0 0 1-15.29 80.34h.1Z"/><path class="purple" d="M201.87 197.76a574.87 574.87 0 0 0 19.78-31.6 8.67 8.67 0 0 0-.61-9.48 185.58 185.58 0 0 1-21.82-35.9c-5.91-14.16-6.73-36.08-6.83-46.69 0-4.07-1.22-8.05-3.77-11.21l-34.16-43.33c0 1.94-.4 3.87-.81 5.81a76.42 76.42 0 0 1-5.71 15.9l-4.7 9.8-3.36 6.72a111.95 111.95 0 0 0-12.03 38.23 93.9 93.9 0 0 0 8.67 47.92 67.9 67.9 0 0 1 39.56 16.52 99.4 99.4 0 0 1 25.8 37.31Z"/></svg>
`;

  function omnisearch() {
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
      url: `http://localhost:${CONFIG.port}/search?q=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/json" },
      onload: function (res) {
        const data = JSON.parse(res.response);
        removeLoadingLabel(data.length > 0);

        data.splice(CONFIG.nbResults);
        const resultsDiv = document.getElementById(resultsDivId);
        if (!resultsDiv) return;

        document.querySelectorAll("[data-omnisearch-result]").forEach(el => el.remove());

        for (const item of data) {
          const url = `obsidian://open?vault=${encodeURIComponent(item.vault)}&file=${encodeURIComponent(item.path)}`;
          const element = document.createElement("div");
          element.className = "_0_SRI search-result";
          element.setAttribute("data-highlight", "");
          element.setAttribute("data-omnisearch-result", "");
          element.innerHTML = `
            <div class="_0_TITLE __sri-title">
              <h3 class="__sri-title-box">
                <a class="__sri_title_link _0_sri_title_link _0_URL" title="${item.basename}" href="${url}" rel="noopener noreferrer">
                  ${item.basename}
                </a>
              </h3>
            </div>
            <div class="__sri-url-box">
              <a class="_0_URL __sri-url" href="${url}" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">
                <div class="__sri_url_path_box">
                  <span class="host">${logo}Obsidian</span>&nbsp;<span class="path">› ${item.path}</span>
                </div>
              </a>
            </div>
            <div class="__sri-body">
              <div class="_0_DESC __sri-desc">
                <div>${item.excerpt.replaceAll("<br>", " ")}</div>
              </div>
            </div>`;
          resultsDiv.appendChild(element);
        }
      },
      onerror: function (res) {
        console.log("Omnisearch error", res);
        const span = document.getElementById(loadingSpanId);
        if (span) {
          span.innerHTML = `Error: Obsidian is not running or Omnisearch server is not enabled.<br/><a href="obsidian://open">Open Obsidian</a>`;
        }
      },
    });
  }

  function injectResultsContainer() {
    document.getElementById(resultsDivId)?.remove();
    const sidebar = document.querySelector(sidebarSelector);
    if (!sidebar) return false;
    const resultsDiv = document.createElement("div");
    resultsDiv.id = resultsDivId;
    resultsDiv.style.marginBottom = "2em";
    sidebar.prepend(resultsDiv);
    return true;
  }

  function injectTitle() {
    const resultsDiv = document.getElementById(resultsDivId);
    if (!resultsDiv || resultsDiv.querySelector(".omnisearch-title")) return;
    const title = document.createElement("div");
    title.className = "omnisearch-title";
    title.style.marginBottom = "1em";
    title.innerHTML = `<span style="font-size: 1.2em">${logo}&nbsp;Omnisearch results</span>`;
    resultsDiv.appendChild(title);
  }

  function injectLoadingLabel() {
    if (document.getElementById(loadingSpanId)) return;
    const resultsDiv = document.getElementById(resultsDivId);
    if (!resultsDiv) return;
    const label = document.createElement("span");
    label.id = loadingSpanId;
    label.textContent = "Loading...";
    resultsDiv.appendChild(label);
  }

  function removeLoadingLabel(foundResults = true) {
    const span = document.getElementById(loadingSpanId);
    if (!span) return;
    if (foundResults) {
      span.remove();
    } else {
      span.textContent = "No results found";
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
        waitForElement(sidebarSelector).then(omnisearch);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", () => {
      lastQuery = "";
      waitForElement(sidebarSelector).then(omnisearch);
    });
  }

  console.log("Loading Omnisearch injector");
  watchForSearchChanges();
  waitForElement(sidebarSelector).then(omnisearch);
})();
