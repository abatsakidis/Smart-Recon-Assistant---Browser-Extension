(function() {
  const scripts = [];
  for (let script of document.scripts) {
    if (script.src) {
      scripts.push(script.src);
    } else if (script.textContent) {
      scripts.push(script.textContent.slice(0, 1000));
    }
  }
  browser.runtime.sendMessage({ type: "scripts", scripts });
})();