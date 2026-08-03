// ULTRA-SIMPLE Settings Manager
console.log("✅ app-settings-simple.js geladen");

class AppSettings {
  constructor(appName) {
    this.appName = appName;
    console.log("✅ AppSettings für", appName, "initialisiert");
  }

  getSetting(key) {
    try {
      const data = localStorage.getItem(this.appName + "_" + key);
      return data || "";
    } catch (e) {
      return "";
    }
  }

  setSetting(key, value) {
    try {
      localStorage.setItem(this.appName + "_" + key, value);
      console.log("✅ Gespeichert:", key, "=", value);
    } catch (e) {
      console.error("Fehler beim Speichern:", e);
    }
  }

  loadSettings() {
    console.log("Loading settings...");
    document.getElementById("setting_github_token").value = this.getSetting("github_token");
    document.getElementById("setting_github_owner").value = this.getSetting("github_owner");
    document.getElementById("setting_github_repo").value = this.getSetting("github_repo");
    const anthropicEl = document.getElementById("setting_anthropic_api_key");
    if (anthropicEl) {
      anthropicEl.value = this.getSetting("anthropic_api_key");
    }
  }

  saveSettings() {
    this.setSetting("github_token", document.getElementById("setting_github_token").value);
    this.setSetting("github_owner", document.getElementById("setting_github_owner").value);
    this.setSetting("github_repo", document.getElementById("setting_github_repo").value);
    const anthropicEl = document.getElementById("setting_anthropic_api_key");
    if (anthropicEl) {
      this.setSetting("anthropic_api_key", anthropicEl.value);
    }
    alert("✅ Settings gespeichert!");
  }

  testGitHub() {
    const token = document.getElementById("setting_github_token").value;
    const owner = document.getElementById("setting_github_owner").value;
    const repo = document.getElementById("setting_github_repo").value;
    
    if (!token || !owner || !repo) {
      alert("❌ Token, Owner oder Repo fehlt!");
      return;
    }

    alert("🧪 Teste GitHub... (in Browser Console sehen)");
    
    fetch("https://api.github.com/repos/" + owner + "/" + repo, {
      headers: { "Authorization": "token " + token }
    })
    .then(r => {
      if (r.ok) {
        alert("✅ GitHub Token funktioniert!");
      } else if (r.status === 401) {
        alert("❌ Token ungültig!");
      } else if (r.status === 404) {
        alert("❌ Repo nicht gefunden!");
      } else {
        alert("❌ Fehler: " + r.status);
      }
    })
    .catch(e => alert("❌ Fehler: " + e.message));
  }

  testAnthropicKey() {
    const key = document.getElementById("setting_anthropic_api_key").value;
    
    if (!key) {
      alert("❌ API Key fehlt!");
      return;
    }

    alert("🧪 Teste Anthropic... (in Browser Console sehen)");
    
    fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": key }
    })
    .then(r => {
      if (r.ok) {
        alert("✅ Anthropic API Key funktioniert!");
      } else if (r.status === 401) {
        alert("❌ API Key ungültig!");
      } else {
        alert("❌ Fehler: " + r.status);
      }
    })
    .catch(e => alert("❌ Fehler: " + e.message));
  }

  exportSettings() {
    const data = {
      app: this.appName,
      exported: new Date().toISOString(),
      settings: {
        github_token: this.getSetting("github_token"),
        github_owner: this.getSetting("github_owner"),
        github_repo: this.getSetting("github_repo"),
        anthropic_api_key: this.getSetting("anthropic_api_key")
      }
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.appName.toLowerCase() + "_settings.json";
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Exportiert!");
  }

  importSettings() {
    const json = prompt("Paste deine Settings JSON:");
    if (!json) return;
    
    try {
      const data = JSON.parse(json);
      this.setSetting("github_token", data.settings.github_token);
      this.setSetting("github_owner", data.settings.github_owner);
      this.setSetting("github_repo", data.settings.github_repo);
      this.setSetting("anthropic_api_key", data.settings.anthropic_api_key);
      this.loadSettings();
      alert("✅ Importiert!");
    } catch (e) {
      alert("❌ Fehler: " + e.message);
    }
  }

  clearAll() {
    if (confirm("Wirklich alle Settings löschen?")) {
      localStorage.clear();
      this.loadSettings();
      alert("✅ Gelöscht!");
    }
  }
}

console.log("✅ AppSettings Klasse definiert");
