/**
 * APP-SPEZIFISCHE SETTINGS – ALLE 4 APPS
 * Version: 1.0 – FEHLER-FREI
 */

const APP_SETTINGS = {
  'Rezeptbuch': {
    version: '3.3',
    fields: [
      { id: 'github_token', label: 'GitHub Token', type: 'password' },
      { id: 'github_owner', label: 'GitHub Owner', type: 'text', placeholder: 'roger-manser' },
      { id: 'github_repo', label: 'GitHub Repo', type: 'text', placeholder: 'rezeptbuch' },
      { id: 'anthropic_api_key', label: 'Anthropic API Key', type: 'password' }
    ]
  },
  'Haushaltbuch': {
    version: '17.3',
    fields: [
      { id: 'github_token', label: 'GitHub Token', type: 'password' },
      { id: 'github_owner', label: 'GitHub Owner', type: 'text', placeholder: 'roger-manser' },
      { id: 'github_repo', label: 'GitHub Repo', type: 'text', placeholder: 'haushaltbuch' },
      { id: 'anthropic_api_key', label: 'Anthropic API Key', type: 'password' }
    ]
  },
  'Fahrtenbuch': {
    version: '3.1',
    fields: [
      { id: 'github_token', label: 'GitHub Token', type: 'password' },
      { id: 'github_owner', label: 'GitHub Owner', type: 'text', placeholder: 'roger-manser' },
      { id: 'github_repo', label: 'GitHub Repo', type: 'text', placeholder: 'fahrtenbuch' }
    ]
  },
  'Lebenskosten': {
    version: '2.9',
    fields: [
      { id: 'github_token', label: 'GitHub Token', type: 'password' },
      { id: 'github_owner', label: 'GitHub Owner', type: 'text', placeholder: 'roger-manser' },
      { id: 'github_repo', label: 'GitHub Repo', type: 'text', placeholder: 'lebenskosten-daten' },
      { id: 'anthropic_api_key', label: 'Anthropic API Key', type: 'password' }
    ]
  }
};

class AppSettings {
  constructor(appName) {
    this.appName = appName;
    this.config = APP_SETTINGS[appName] || {};
    this.storageKey = appName + '_settings';
  }

  getSetting(key) {
    try {
      const all = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      return all[key] || '';
    } catch (e) {
      console.error('Error getting setting:', e);
      return '';
    }
  }

  setSetting(key, value) {
    try {
      const all = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      all[key] = value;
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    } catch (e) {
      console.error('Error setting setting:', e);
    }
  }

  getAllSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    } catch (e) {
      console.error('Error getting all settings:', e);
      return {};
    }
  }

  loadAllIntoUI() {
    try {
      if (!this.config.fields) return;
      this.config.fields.forEach(field => {
        const input = document.getElementById('setting_' + field.id);
        if (input) {
          input.value = this.getSetting(field.id);
        }
      });
    } catch (e) {
      console.error('Error loading settings to UI:', e);
    }
  }

  saveAll() {
    try {
      if (!this.config.fields) return;
      this.config.fields.forEach(field => {
        const input = document.getElementById('setting_' + field.id);
        if (input) {
          this.setSetting(field.id, input.value);
        }
      });
      alert('✅ Settings gespeichert!');
    } catch (e) {
      console.error('Error saving settings:', e);
      alert('❌ Fehler beim Speichern');
    }
  }

  async testGitHub() {
    try {
      const token = this.getSetting('github_token');
      const owner = this.getSetting('github_owner');
      const repo = this.getSetting('github_repo');
      const resultDiv = document.getElementById('test_github_token');

      if (!resultDiv) return;

      if (!token || !owner || !repo) {
        resultDiv.innerHTML = '❌ Token, Owner oder Repo fehlt';
        resultDiv.className = 'test-result error';
        return;
      }

      resultDiv.innerHTML = '🔄 Teste...';
      resultDiv.className = 'test-result loading';

      const response = await fetch(
        'https://api.github.com/repos/' + owner + '/' + repo,
        { headers: { 'Authorization': 'token ' + token } }
      );

      if (response.ok) {
        resultDiv.innerHTML = '✅ GitHub Token valid!';
        resultDiv.className = 'test-result success';
      } else if (response.status === 401) {
        resultDiv.innerHTML = '❌ Token ungültig (401)';
        resultDiv.className = 'test-result error';
      } else if (response.status === 404) {
        resultDiv.innerHTML = '❌ Repo nicht gefunden (404)';
        resultDiv.className = 'test-result error';
      } else {
        resultDiv.innerHTML = '❌ Fehler: ' + response.status;
        resultDiv.className = 'test-result error';
      }
    } catch (err) {
      const resultDiv = document.getElementById('test_github_token');
      if (resultDiv) {
        resultDiv.innerHTML = '❌ ' + err.message;
        resultDiv.className = 'test-result error';
      }
    }
  }

  async testAnthropicKey() {
    try {
      const apiKey = this.getSetting('anthropic_api_key');
      const resultDiv = document.getElementById('test_anthropic_api_key');

      if (!resultDiv) return;

      if (!apiKey) {
        resultDiv.innerHTML = '❌ API Key fehlt';
        resultDiv.className = 'test-result error';
        return;
      }

      resultDiv.innerHTML = '🔄 Teste...';
      resultDiv.className = 'test-result loading';

      const response = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey }
      });

      if (response.ok) {
        resultDiv.innerHTML = '✅ Anthropic API Key valid!';
        resultDiv.className = 'test-result success';
      } else if (response.status === 401) {
        resultDiv.innerHTML = '❌ API Key ungültig (401)';
        resultDiv.className = 'test-result error';
      } else {
        resultDiv.innerHTML = '❌ Fehler: ' + response.status;
        resultDiv.className = 'test-result error';
      }
    } catch (err) {
      const resultDiv = document.getElementById('test_anthropic_api_key');
      if (resultDiv) {
        resultDiv.innerHTML = '❌ ' + err.message;
        resultDiv.className = 'test-result error';
      }
    }
  }

  exportSettings() {
    try {
      const settings = this.getAllSettings();
      const data = {
        app: this.appName,
        version: this.config.version || '1.0',
        exported: new Date().toISOString(),
        settings: settings
      };

      const json = JSON.stringify(data, null, 2);
      const filename = this.appName.toLowerCase() + '_settings_' + new Date().toISOString().split('T')[0] + '.json';
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exporting:', e);
      alert('❌ Export fehlgeschlagen');
    }
  }

  importSettings() {
    try {
      const json = prompt('Paste deine Settings JSON:');
      if (!json) return;

      const data = JSON.parse(json);
      if (data.app !== this.appName) {
        alert('❌ Falsche App! Erwartet: ' + this.appName + ', Erhalten: ' + data.app);
        return;
      }

      const settings = data.settings || {};
      Object.keys(settings).forEach(key => {
        this.setSetting(key, settings[key]);
      });

      alert('✅ Settings importiert!');
      this.loadAllIntoUI();
    } catch (err) {
      console.error('Error importing:', err);
      alert('❌ Fehler: ' + err.message);
    }
  }

  clearAll() {
    if (confirm('🗑️ Wirklich alle Settings löschen?')) {
      try {
        localStorage.removeItem(this.storageKey);
        alert('✅ Gelöscht!');
        this.loadAllIntoUI();
      } catch (e) {
        console.error('Error clearing:', e);
      }
    }
  }
}

console.log('✅ AppSettings loaded');
