module.exports = {
  setupTestFrameworkScriptFile: "<rootDir>/testSetup.js",
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
    "^.+\\.[t|j]s?$": "babel-jest"
  }
};
