const fs = require('fs');
const { ensureDir, generateFilename } = require('../core/utils');

module.exports = {
  async writeMarkdown(content, topic, subfolder = '') {
    ensureDir('outputs/markdown');
    const filename = generateFilename(topic + '-' + subfolder, 'md');
    const filepath = `outputs/markdown/${subfolder ? subfolder + '/' : ''}${filename}`;
    fs.writeFileSync(filepath, content, 'utf8');
    return filepath;
  },

  async writeJSON(data, topic, subfolder = '') {
    ensureDir('outputs/json');
    const filename = generateFilename(topic + '-' + subfolder, 'json');
    const filepath = `outputs/json/${subfolder ? subfolder + '/' : ''}${filename}`;
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    return filepath;
  },

  async writeRaw(content, topic, ext, subfolder = '') {
    ensureDir(`outputs/${subfolder || 'raw'}`);
    const filename = generateFilename(topic, ext);
    const filepath = `outputs/${subfolder || 'raw'}/${filename}`;
    fs.writeFileSync(filepath, content, 'utf8');
    return filepath;
  }
};
