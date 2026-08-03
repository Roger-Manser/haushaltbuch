/**
 * APP-SPEZIFISCHE SETTINGS KONFIGURATIONEN
 * Für: Rezeptbuch, Haushaltbuch, Fahrtenbuch, Lebenskosten
 */

const APP_SETTINGS = {
  'Rezeptbuch': {
    version: '3.3',
    fields: [
      { id: 'github_token', label: 'GitHub Token', type: 'password', test: true },
      { id: 'github_owner', label: 'GitHub Owner', type: 'text', placeholder: 'roger-manser' },
      { id: 'github_repo', label: 'GitHub Repo', type: 'text', placeholder: 'rezeptbuch' },
      { id: 'anthropic_api_key', label: 'Anthropic API Key', type: 'password', test: true }
    ]
  },
  'Haushaltbuch': {
    version: '17.3',
    fields: [
      { id: 'github_token', label: 'GitHub Token', type: 'password', test: true },
      { id: 'github_owner', label: 'GitHub Owner', type: 'text', placeholder: 'roger-manser' },
      { id: 'github_repo', label: 'GitHub Repo', type: 'text', placeholder: 'haushaltbuch' },
      { id: 'anthropic_api_key', label: 'Anthropic API Key', type: 'password', test: true }
    ]
  },
  'Fahrtenbuch': {
    version: '3.1',
    fields: [
      { id: 'github_token', label: 'GitHub Token', type: 'password', test: true },
      { id: 'github_owner', label: 'GitHub Owner', type: 'text', placeholder: 'roger-manser' },
      { id: 'github_repo', label: 'GitHub Repo', type: 'text', placeholder: 'fahrtenbuch' },
      { id: 'vehicle_name', label: 'Fahrzeug Name', type: 'text', placeholder: 'Cupra Terramar' }
    ]
  },
  'Lebenskosten': {
    version: '2.9',
    fields: [
      { id: 'github_token', label: 'GitHub Token', type: 'password', test: true },
      { id: 'github_owner', label: 'GitHub Owner', type: 'text', placeholder: 'roger-manser' },
      { id: 'github_repo', label: 'GitHub Repo', type: 'text', placeholder: 'lebenskosten-daten' },
      { id: 'anthropic_api_key', label: 'Anthropic API Key', type: 'password', test: true }
    ]
  }
};

class AppSettings {
  constructor(appName) {
    this.appName = appName;
    this.config = APP_SETTINGS[appName];
    this.storageKey = `${appName}_settings`;
  }

  // CRUD
  getSetting(key) {
    const all = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    return all[key] || '';
  }

  setSetting(key, value) {
    const all = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    all[key] = value;
    localStorage.setItem(this.storageKey, JSON.stringify(all));
  }

  getAllSettings() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
  }

  loadAllIntoUI() {
    this.config.fields.forEach(field => {
      const input = document.getElementById(`setting_${field.id}`);
      if (input) {
        input.value = this.getSetting(field.id);
      }
    });
  }

  saveAllFromUI() {
    this.config.fields.forEach(field => {
      const input = document.getElementById(`setting_${field.id}`);
      if (input) {
        this.setSetting(field.id, input.value);
      }
    });
    alert('✅ Settings gespeichert!');
  }

  // TESTS
  async testGitHub() {
    const token = this.getSetting('github_token');
    const owner = this.getSetting('github_owner');
    const repo = this.getSetting('github_repo');
    const resultDiv = document.getElementById('test_github_token');

    if (!token || !owner || !repo) {
      resultDiv.innerHTML = '<span class="error">❌ Token, Owner oder Repo fehlt</span>';
      return;
    }

    resultDiv.innerHTML = '<span class="loading">🔄 Teste...</span>';

    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers: { 'Authorization': `token ${token}` } }
      );

      if (response.ok) {
        resultDiv.innerHTML = '<span class="success">✅ GitHub Token valid!</span>';
      } else if (response.status === 401) {
        resultDiv.innerHTML = '<span class="error">❌ Token ungültig (401)</span>';
      } else if (response.status === 404) {
        resultDiv.innerHTML = '<span class="error">❌ Repo nicht gefunden (404)</span>';
      } else {
        resultDiv.innerHTML = `<span class="error">❌ Fehler: ${response.status}</span>`;
      }
    } catch (err) {
      resultDiv.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    }
  }

  async testAnthropicKey() {
    const apiKey = this.getSetting('anthropic_api_key');
    const resultDiv = document.getElementById('test_anthropic_api_key');

    if (!apiKey) {
      resultDiv.innerHTML = '<span class="error">❌ API Key fehlt</span>';
      return;
    }

    resultDiv.innerHTML = '<span class="loading">🔄 Teste...</span>';

    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey }
      });

      if (response.ok) {
        resultDiv.innerHTML = '<span class="success">✅ Anthropic API Key valid!</span>';
      } else if (response.status === 401) {
        resultDiv.innerHTML = '<span class="error">❌ API Key ungültig (401)</span>';
      } else {
        resultDiv.innerHTML = `<span class="error">❌ Fehler: ${response.status}</span>`;
      }
    } catch (err) {
      resultDiv.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    }
  }

  // EXPORT
  exportSettings() {
    const settings = this.getAllSettings();
    const data = {
      app: this.appName,
      version: this.config.version,
      exported: new Date().toISOString(),
      settings: settings
    };

    const json = JSON.stringify(data, null, 2);
    const filename = `${this.appName.toLowerCase()}_settings_${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // IMPORT
  importSettings() {
    const json = prompt('Paste deine Settings JSON:');
    if (!json) return;

    try {
      const data = JSON.parse(json);
      if (data.app !== this.appName) {
        alert(`❌ Falsche App! Erwartet: ${this.appName}, Erhalten: ${data.app}`);
        return;
      }

      Object.keys(data.settings).forEach(key => {
        this.setSetting(key, data.settings[key]);
      });

      alert('✅ Settings importiert! Seite wird neu geladen...');
      this.loadAllIntoUI();
    } catch (err) {
      alert(`❌ Fehler: ${err.message}`);
    }
  }

  clearAll() {
    if (confirm('🗑️ Wirklich alle Settings löschen?')) {
      localStorage.removeItem(this.storageKey);
      alert('✅ Gelöscht!');
      this.loadAllIntoUI();
    }
  }
}
