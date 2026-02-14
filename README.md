# Userscripts

Userscripts for Kagi search. Install with [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).

## Obsidian Omnisearch in Kagi

[Install](https://github.com/waynehoover/userscripts/raw/main/src/obsidian-omnisearch-kagi.user.js)

Injects [Obsidian Omnisearch](https://publish.obsidian.md/omnisearch/Inject+Omnisearch+results+into+your+search+engine) results into the Kagi sidebar. Requires the Omnisearch HTTP server to be running (default port 51361).

## Linkding in Kagi

[Install](https://github.com/waynehoover/userscripts/raw/main/src/linkding-kagi.user.js)

Injects [Linkding](https://github.com/sissbruecker/linkding) bookmark search results into the Kagi sidebar. Requires a running Linkding instance and an API token (Settings > Integrations > REST API). Edit the `CONFIG` block at the top of the script to set your instance URL and token.
