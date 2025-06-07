const SECURITY_HEADERS = [
  "content-security-policy",
  "x-frame-options",
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy"
];

function checkHeaderDetails(headerName, value) {
  const issues = [];
  if (headerName === "content-security-policy") {
    if (value.includes("unsafe-inline")) issues.push("CSP contains unsafe-inline");
    if (value.includes("unsafe-eval")) issues.push("CSP contains unsafe-eval");
  }
  if (headerName === "strict-transport-security") {
    if (!value.includes("max-age")) {
      issues.push("HSTS missing max-age directive");
    } else {
      const match = value.match(/max-age=(\d+)/);
      if (match && parseInt(match[1]) < 10886400) issues.push("HSTS max-age is less than recommended 18 weeks");
    }
  }
  if (headerName === "referrer-policy") {
    const allowed = ["no-referrer", "no-referrer-when-downgrade", "same-origin", "origin", "strict-origin", "origin-when-cross-origin", "strict-origin-when-cross-origin", "unsafe-url"];
    if (!allowed.includes(value.trim())) issues.push(`Referrer-Policy has unusual value: ${value}`);
  }
  return issues;
}

const scanResults = {};
const scanHistory = {};

function getDomainFromUrl(url) {
  try { return new URL(url).hostname; } catch { return null; }
}
function addToHistory(domain, result) {
  if (!domain) return;
  if (!scanHistory[domain]) scanHistory[domain] = [];
  scanHistory[domain].push({ timestamp: Date.now(), result });
  if (scanHistory[domain].length > 20) scanHistory[domain].shift();
}
function updateBadge(tabId, issuesCount) {
  if (issuesCount > 0) {
    browser.browserAction.setBadgeText({ text: String(issuesCount), tabId });
    browser.browserAction.setBadgeBackgroundColor({ color: "red", tabId });
  } else {
    browser.browserAction.setBadgeText({ text: "", tabId });
  }
}

browser.webRequest.onHeadersReceived.addListener(
  details => {
    console.log("Headers received for tabId:", details.tabId, "url:", details.url);
    console.log("Response headers:", details.responseHeaders);

    const headers = {};
    for (let header of details.responseHeaders) {
      headers[header.name.toLowerCase()] = header.value;
    }

    const issues = [];
    for (let name of SECURITY_HEADERS) {
      if (!headers[name]) {
        issues.push(`Missing header: ${name}`);
      } else {
        issues.push(...checkHeaderDetails(name, headers[name]));
      }
    }
    console.log("Security issues found:", issues);

    // Προσοχή: Σε Firefox μερικές φορές tabId = -1
    if (details.tabId === -1) {
      console.log("Ignoring headers for tabId -1");
      return;
    }

    scanResults[details.tabId] = scanResults[details.tabId] || {};
    scanResults[details.tabId].headers = issues.length ? issues : ["All important security headers present"];
    updateBadge(details.tabId, issues.length);
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["responseHeaders"]
);


browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "scripts") {
    
	const suspiciousKeywords = [
	  "eval",
	  "disable-devtool",
	  "Function",
	  "document.write",
	  "setTimeout",
	  "setInterval",
	  "unescape",
	  "window.location",
	  "innerHTML",
	  "document.cookie",
	  "atob",
	  "btoa"
	];
	
		const found = [];
		for (let script of message.scripts) {
		  for (let keyword of suspiciousKeywords) {
			let pos = script.indexOf(keyword);
			if (pos !== -1) {
			  found.push({ script, keyword, position: pos });
			  break;
			}
		  }
		}
	  scanResults[sender.tab.id] = scanResults[sender.tab.id] || {};
	  scanResults[sender.tab.id].scripts = found.length ? found : ["No suspicious scripts found"];
	  updateBadge(sender.tab.id, found.length + (scanResults[sender.tab.id].headers?.filter(h => h.toLowerCase().includes("missing") || h.toLowerCase().includes("unsafe")).length || 0));
}

  if (message.type === "getResults") {
    const results = scanResults[message.tabId] || { headers: ["No data"], scripts: ["No data"] };
    const domain = getDomainFromUrl(message.url);
    if (domain) addToHistory(domain, results);
    return Promise.resolve(results);
  }

  if (message.type === "getHistory") {
    return Promise.resolve(scanHistory[message.domain] || []);
  }
  
  if (message.type === "clearHistory") {
    if (message.domain && scanHistory[message.domain]) {
      delete scanHistory[message.domain];
    }
    return Promise.resolve({ success: true });
  }	
  
  
  return Promise.resolve({ success: true });
});

browser.tabs.onRemoved.addListener(tabId => {
  delete scanResults[tabId];
  browser.browserAction.setBadgeText({ text: "", tabId });
});

browser.webNavigation.onCommitted.addListener(details => {
  if (details.frameId === 0) {
    delete scanResults[details.tabId];
    browser.browserAction.setBadgeText({ text: "", tabId: details.tabId });
  }
});
