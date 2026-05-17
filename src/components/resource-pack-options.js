const JSZip = require('jszip');
const { saveResourcePack, clearResourcePack, getResourcePackName } = require('../utils/resourcePackDb');

AFRAME.registerComponent('resource-pack-options', {
  init: function () {
    this.onImportClick = this.onImportClick.bind(this);
    this.onClearClick = this.onClearClick.bind(this);
    this.handleFileImport = this.handleFileImport.bind(this);
    this.updatePackName = this.updatePackName.bind(this);

    // Create a hidden file input for importing ZIP data
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.zip';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', this.handleFileImport);
    document.body.appendChild(this.fileInput);

    this.importBtn = this.el.querySelector('.importPackBtn');
    this.clearBtn = this.el.querySelector('.clearPackBtn');
    this.nameText = this.el.querySelector('#resourcePackName');

    if (this.importBtn) {
      this.importBtn.addEventListener('click', this.onImportClick);
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', this.onClearClick);
    }

    this.updatePackName();
  },

  remove: function () {
    if (this.importBtn) {
      this.importBtn.removeEventListener('click', this.onImportClick);
    }
    if (this.clearBtn) {
      this.clearBtn.removeEventListener('click', this.onClearClick);
    }
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput);
    }
  },

  updatePackName: async function () {
    if (!this.nameText) return;
    try {
      const name = await getResourcePackName();
      if (name) {
        this.nameText.setAttribute('text', 'value', 'Active: ' + name);
      } else {
        this.nameText.setAttribute('text', 'value', 'Active: None');
      }
    } catch (e) {
      console.error(e);
      this.nameText.setAttribute('text', 'value', 'Active: Error');
    }
  },

  onImportClick: function () {
    this.fileInput.click();
  },

  onClearClick: async function () {
    const confirm = window.confirm('Are you sure you want to clear the active resource pack?');
    if (confirm) {
      try {
        await clearResourcePack();
        window.alert('Resource pack cleared. The page will now reload.');
        window.location.reload();
      } catch (err) {
        console.error(err);
        window.alert('Error clearing resource pack.');
      }
    }
  },

  handleFileImport: async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (this.nameText) {
        this.nameText.setAttribute('text', 'value', 'Loading...');
      }

      const zip = await JSZip.loadAsync(file);
      let manifest = null;
      let rootPrefix = '';

      // Try to find manifest.json to determine the root folder of the pack
      for (const relativePath of Object.keys(zip.files)) {
        if (relativePath.endsWith('manifest.json')) {
          rootPrefix = relativePath.substring(0, relativePath.length - 'manifest.json'.length);
          const manifestStr = await zip.files[relativePath].async('string');
          try {
            manifest = JSON.parse(manifestStr);
          } catch (e) {
            console.warn('Invalid manifest.json in resource pack');
          }
          break;
        }
      }

      const packName = manifest && manifest.name ? manifest.name : 'Custom Resource Pack';
      const extractedFiles = {};

      const getMimeType = (filename) => {
        const lower = filename.toLowerCase();
        if (lower.endsWith('.png')) return 'image/png';
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
        if (lower.endsWith('.ogg')) return 'audio/ogg';
        if (lower.endsWith('.json')) return 'application/json';
        if (lower.endsWith('.obj')) return 'text/plain';
        if (lower.endsWith('.mtl')) return 'text/plain';
        if (lower.endsWith('.gltf')) return 'model/gltf+json';
        if (lower.endsWith('.glb')) return 'model/gltf-binary';
        return 'application/octet-stream';
      };

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        if (!relativePath.startsWith(rootPrefix)) continue;

        const pathWithoutRoot = relativePath.substring(rootPrefix.length);
        if (pathWithoutRoot === 'manifest.json') continue;

        // Ensure path prefix is assets/
        let dbPath = pathWithoutRoot;
        if (!dbPath.startsWith('assets/')) {
          dbPath = 'assets/' + dbPath;
        }

        const arrayBuffer = await zipEntry.async('arraybuffer');
        const blob = new Blob([arrayBuffer], { type: getMimeType(pathWithoutRoot) });
        extractedFiles[dbPath] = blob;
      }

      await saveResourcePack(packName, extractedFiles);

      window.alert('Resource pack "' + packName + '" loaded successfully! The page will now reload.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      window.alert('Error reading resource pack zip file.');
      this.updatePackName();
    } finally {
      this.fileInput.value = '';
    }
  }
});
