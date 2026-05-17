AFRAME.registerComponent('menu-selected-challenge-image', {
  schema: {
    coverURL: { type: 'string' }
  },

  update: function (oldData) {
    if (this.data.coverURL === oldData.coverURL && this.data.coverURL) { return; }
    
    const el = this.el;
    if (!this.data.coverURL) {
      el.setAttribute('material', 'src', '');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      el.setAttribute('material', 'src', img.src);
    };
    img.onerror = () => {
      img.onerror = null;
      el.setAttribute('material', 'src', 'assets/img/favicon.png');
    };
    
    img.src = this.data.coverURL;
    
    if (img.complete && img.naturalWidth === 0) {
      img.onerror();
    }
  }
});
