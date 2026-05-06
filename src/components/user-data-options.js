/**
 * Component to handle exporting and importing user data (favorites, leaderboards).
 */
AFRAME.registerComponent('user-data-options', {
  init: function () {
    this.onExportClick = this.onExportClick.bind(this);
    this.onImportClick = this.onImportClick.bind(this);
    this.handleFileImport = this.handleFileImport.bind(this);

    // Create a hidden file input for importing JSON data
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', this.handleFileImport);
    document.body.appendChild(this.fileInput);

    // Setup listeners on the buttons. We'll find them by class or id inside the entity this component is attached to.
    this.exportBtn = this.el.querySelector('.exportDataBtn');
    this.importBtn = this.el.querySelector('.importDataBtn');

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', this.onExportClick);
    }
    if (this.importBtn) {
      this.importBtn.addEventListener('click', this.onImportClick);
    }
  },

  remove: function() {
    if (this.exportBtn) {
      this.exportBtn.removeEventListener('click', this.onExportClick);
    }
    if (this.importBtn) {
      this.importBtn.removeEventListener('click', this.onImportClick);
    }
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput);
    }
  },

  onExportClick: function () {
    const exportData = {
      favorites: localStorage.getItem('favorites-v2') || '[]',
      leaderboard: {}
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('leaderboard_')) {
        exportData.leaderboard[key] = localStorage.getItem(key);
      }
    }

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moonrider-userdata.json';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  },

  onImportClick: function () {
    this.fileInput.click();
  },

  handleFileImport: function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.favorites && !importedData.leaderboard) {
          window.alert('Invalid userdata file.');
          return;
        }

        const overwrite = window.confirm('Do you want to overwrite your existing data? Click "OK" to overwrite, or "Cancel" to merge with existing data.');
        
        if (overwrite) {
          // Overwrite
          if (importedData.favorites) {
            localStorage.setItem('favorites-v2', importedData.favorites);
          }
          
          if (importedData.leaderboard) {
            // Clear existing local leaderboards first
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('leaderboard_')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Set new ones
            for (const key in importedData.leaderboard) {
              if (Object.prototype.hasOwnProperty.call(importedData.leaderboard, key)) {
                localStorage.setItem(key, importedData.leaderboard[key]);
              }
            }
          }
        } else {
          // Merge
          if (importedData.favorites) {
            try {
              const importedFavs = JSON.parse(importedData.favorites);
              const currentFavsStr = localStorage.getItem('favorites-v2');
              const currentFavs = currentFavsStr ? JSON.parse(currentFavsStr) : [];
              
              const mergedFavs = [...currentFavs];
              const currentIds = new Set(currentFavs.map(f => f.id));
              
              for (const fav of importedFavs) {
                if (!currentIds.has(fav.id)) {
                  mergedFavs.push(fav);
                  currentIds.add(fav.id);
                }
              }
              localStorage.setItem('favorites-v2', JSON.stringify(mergedFavs));
            } catch (err) {
              console.error('Failed to merge favorites:', err);
            }
          }
          
          if (importedData.leaderboard) {
            for (const key in importedData.leaderboard) {
              if (Object.prototype.hasOwnProperty.call(importedData.leaderboard, key)) {
                try {
                  const importedScores = JSON.parse(importedData.leaderboard[key] || '[]');
                  const currentScoresStr = localStorage.getItem(key);
                  const currentScores = currentScoresStr ? JSON.parse(currentScoresStr) : [];
                  
                  const mergedScores = [...currentScores, ...importedScores];
                  
                  // Sort by score descending, then by time ascending
                  mergedScores.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return new Date(a.time) - new Date(b.time);
                  });
                  
                  // Deduplicate identical scores just in case
                  const uniqueScores = [];
                  const seen = new Set();
                  for (const s of mergedScores) {
                    const hash = `${s.username}_${s.score}_${s.time}`;
                    if (!seen.has(hash)) {
                      seen.add(hash);
                      uniqueScores.push(s);
                    }
                  }
                  
                  // Keep only top 10
                  const topScores = uniqueScores.slice(0, 10);
                  localStorage.setItem(key, JSON.stringify(topScores));
                } catch (err) {
                  console.error(`Failed to merge leaderboard for ${key}:`, err);
                }
              }
            }
          }
        }
        
        window.alert('Userdata imported successfully! The page will now reload to apply changes.');
        window.location.reload();
      } catch (err) {
        console.error(err);
        window.alert('Error parsing userdata file.');
      } finally {
        // Reset file input
        this.fileInput.value = '';
      }
    };
    reader.readAsText(file);
  }
});
