var window = self;

var JSZip = require('jszip')

const difficulties = [];

const xhrs = {};

// Fetch and unzip.
addEventListener('message', function (evt) {
  const difficulties = JSON.parse(evt.data.difficulties);
  const version = evt.data.version;
  const hash = evt.data.hash;

  const [short] = version.split('-');



  fetch(evt.data.directDownload)
    .then(function (r) { return r.arrayBuffer() })
    .then(function (ab) { return JSZip.loadAsync(ab) })
    .then(function (zip) {
      const data = { audio: undefined, beats: {} };
      const beatFiles = {};

      const filePromises = [];
      zip.forEach(function (relativePath, file) {
        if (relativePath.toLowerCase().endsWith('.egg') || relativePath.toLowerCase().endsWith('.ogg')) {
          filePromises.push(file.async('blob').then(function (blob) {
            data.audio = URL.createObjectURL(blob);
          }));
        } else if (relativePath.toLowerCase().endsWith('.dat')) {
          filePromises.push(file.async('string').then(function (str) {
            const value = JSON.parse(str);
            if (relativePath.toLowerCase() === 'info.dat') {
              data.info = value;
            } else {
              value._beatsPerMinute = evt.data.bpm;
              beatFiles[relativePath] = value;
            }
          }));
        }
      });

      Promise.all(filePromises).then(function () {
        if (!data.audio || !data.info) return postMessage({ message: 'error', error: 'missing audio or info.dat' });

        for (const difficultyBeatmapSet of data.info._difficultyBeatmapSets) {
          const beatmapCharacteristicName = difficultyBeatmapSet._beatmapCharacteristicName;
          for (const difficultyBeatmap of difficultyBeatmapSet._difficultyBeatmaps) {
            const difficulty = difficultyBeatmap._difficulty;
            const beatmapFilename = difficultyBeatmap._beatmapFilename;
            if (beatFiles[beatmapFilename] === undefined) continue;
            const id = beatmapCharacteristicName + '-' + difficulty;
            if (data.beats[id] === undefined) {
              data.beats[id] = beatFiles[beatmapFilename];
            }
          }
        }

        postMessage({ message: 'load', data: data, version: version, hash: hash });
      });
    })
    .catch(function (err) { postMessage({ message: 'error', error: String(err) }) });
  return;



});

// data: {audio url, beats { difficulty JSONs },
