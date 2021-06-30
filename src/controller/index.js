const Base = require('./base.js');

module.exports = class extends Base {
  indexAction() {
    return this.success("Hello! Let's ship 🚢 Ghost to RSS3 Network");
  }
};
