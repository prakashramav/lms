const { JavaScriptRunner } = require('./javascript.runner');
const { NodeRunner } = require('./node.runner');
const { HtmlCssRunner } = require('./htmlcss.runner');
const { ReactRunner } = require('./react.runner');
const { ExpressRunner } = require('./express.runner');

const runners = {
  javascript: new JavaScriptRunner(),
  node: new NodeRunner(),
  html_css: new HtmlCssRunner(),
  react: new ReactRunner(),
  express: new ExpressRunner(),
};

function getRunner(language) {
  if (!language) return null;
  const langKey = language.toLowerCase();
  return runners[langKey] || null;
}

module.exports = {
  getRunner,
  runners,
};
