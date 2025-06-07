async function getCurrentTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function createListItems(container, items, isScript = false) {
  container.innerHTML = "";
  for (let item of items || []) {
    const li = document.createElement("li");
    if (typeof item === "string") {
      li.textContent = item;
      li.className = item.toLowerCase().includes("missing") || item.toLowerCase().includes("unsafe") || item.toLowerCase().includes("no suspicious") ? "issue" : "ok";
    } else if (isScript) {
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = `Keyword "${item.keyword}" found at position ${item.position} in script: ${item.script.slice(0, 50)}...`;
      link.className = "issue";
		link.onclick = (e) => {
		  e.preventDefault();
		  const fullScript = item.script.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		  const htmlContent = `
			<html>
			  <head><title>Script snippet - keyword: ${item.keyword}</title></head>
			  <body>
				<pre style="white-space: pre-wrap; word-break: break-word;">${fullScript}</pre>
			  </body>
			</html>`;

		  const blob = new Blob([htmlContent], { type: "text/html" });
		  const blobUrl = URL.createObjectURL(blob);

		  browser.tabs.create({ url: blobUrl }).then(() => {
			// Μετά το άνοιγμα, μπορείς να κάνεις revoke αν θες
			setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
		  });
		};
      li.appendChild(link);
    } else {
      li.textContent = item;
    }
    container.appendChild(li);
  }
}



async function loadResults() {
  const tab = await getCurrentTab();
  if (!tab) return;
  try {
    const results = await browser.runtime.sendMessage({ type: "getResults", tabId: tab.id, url: tab.url });
    createListItems(document.getElementById("headersList"), results.headers);
    createListItems(document.getElementById("scriptsList"), results.scripts, true);
    loadHistory(tab);
  } catch (err) {
    document.getElementById("headersList").innerHTML = `<li>Error loading results: ${err.message}</li>`;
    document.getElementById("scriptsList").innerHTML = `<li>Error loading results: ${err.message}</li>`;
  }
}

async function loadHistory(tab) {
  const domain = new URL(tab.url).hostname;
  const history = await browser.runtime.sendMessage({ type: "getHistory", domain });

  const historySelect = document.getElementById("historySelect");
  const historyList = document.getElementById("historyList");
  const clearBtn = document.getElementById("clearHistoryBtn");

  historySelect.innerHTML = '<option value="">Select previous scan</option>';

  if (!history.length) {
    historyList.textContent = "No scan history.";
    historySelect.disabled = true;
    clearBtn.disabled = true;
  } else {
    historySelect.disabled = false;
    clearBtn.disabled = false;
    for (let i = history.length - 1; i >= 0; i--) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = new Date(history[i].timestamp).toLocaleString();
      historySelect.appendChild(option);
    }
    historyList.textContent = "";
  }

  historySelect.onchange = () => {
    const idx = historySelect.value;
    if (idx === "") {
      loadResults();
      return;
    }
    const past = history[idx];
    if (!past) return;
    createListItems(document.getElementById("headersList"), past.result.headers);
    createListItems(document.getElementById("scriptsList"), past.result.scripts, true);
    historyList.textContent = `Loaded scan from ${new Date(past.timestamp).toLocaleString()}`;
  };

  clearBtn.onclick = () => {
    if (!domain) return;
    if (confirm("Are you sure you want to clear scan history for this domain?")) {
      browser.runtime.sendMessage({ type: "clearHistory", domain }).then(() => {
        historySelect.innerHTML = '<option value="">Select previous scan</option>';
        historySelect.disabled = true;
        clearBtn.disabled = true;
        historyList.textContent = "Scan history cleared.";
        loadResults();
      });
    }
  };
}


document.getElementById("exportBtn").addEventListener("click", () => {
  const headers = [...document.getElementById("headersList").children].map(li => li.textContent);
  const scripts = [...document.getElementById("scriptsList").children].map(li => li.textContent);
  const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), headers, scripts }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `smart-recon-scan-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.addEventListener("DOMContentLoaded", loadResults);
