# Smart Recon Assistant - Browser Extension

## Overview

Smart Recon Assistant is a Firefox browser extension designed to help you quickly assess the security posture of any website by analyzing HTTP security headers and scanning for suspicious inline scripts. It highlights missing or weak security headers and flags potentially dangerous JavaScript code snippets.

---

## Features

- **Security Headers Check:** Verifies the presence of key security headers such as Content-Security-Policy, Strict-Transport-Security, Referrer-Policy, and others.
- **Suspicious Script Detection:** Scans page scripts for keywords like `eval`, `setTimeout`, `document.write` and highlights their exact position.
- **Clickable Script Snippets:** Allows opening suspicious script snippets in a new tab for easier inspection.
- **Scan History:** Keeps a history of scans per domain for easy reference.
- **Export Results:** Export scan results as a JSON file for offline review or sharing.
- **Badge Notifications:** Shows the number of issues detected as a badge on the extension icon.

---

## Installation

1. Clone or download the repository to your local machine.
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select the `manifest.json` file from the extension folder.
5. The extension will load and start working immediately.

---

## Usage

1. Visit any website you want to scan.
2. Click on the extension icon to open the popup.
3. View the detected security header issues and suspicious scripts.
4. Use the dropdown to check previous scan history for the domain.
5. Click on suspicious scripts to open their snippet in a new tab.
6. Use the **Export Results** button to download scan data as JSON.

---

## Development

- **Manifest Version:** 2 (for Firefox compatibility)
- **Permissions:**
  - `webRequest`, `webRequestBlocking` for monitoring headers
  - `tabs` for creating new tabs and querying active tabs
  - `storage` for saving scan history
- **Background Script:** Listens for web requests and messages from the content script.
- **Content Script:** Injected into pages to collect scripts and send to background.
- **Popup Script:** Displays scan results and manages UI interactions.

---

## Troubleshooting

- If no headers appear, make sure you are scanning a main frame page (not iframe).
- Some sites may not expose all headers to browser extensions due to security policies.
- The extension currently supports Firefox with Manifest V2 only.
- Clear scan history by removing the extension or programmatically clearing `scanHistory` object.

---

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

---

## License

MIT License © Your Name




