var vows = require('vows');
var assert = require('assert');
var config = require('../lib/config');
var path = require('path');

var _configLoad = config.load;
var _configLoadUrl = config.loadUrl;

vows.describe('config').addBatch({
  'loading from a file': {
    topic: function() {
      var configPath = path.join(__dirname, 'database.json');
      config.load = _configLoad;
      config.loadUrl = _configLoadUrl;
      config.load(configPath, 'dev');
      return config;
    },

    'should remove the load function': function (config) {
      assert.isUndefined(config.load);
    },

    'should remove the loadUrl function': function (config) {
      assert.isUndefined(config.loadUrl);
    },

    'should export all environment settings': function (config) {
      assert.isDefined(config.dev);
      assert.isDefined(config.test);
      assert.isDefined(config.prod);
    },

    'should export a getCurrent function with all current environment settings': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'sqlite3');
      assert.equal(current.settings.filename, ':memory:');
    }
  },
}).addBatch({
  'loading from a broken config file': {
    topic: function() {
      var configPath = path.join(__dirname, 'database_with_syntax_error.json');
      config.load = _configLoad;
      config.loadUrl = _configLoadUrl;
      try {
        config.load(configPath, 'dev');
      } catch (e) {
        return e;
      }
      return;
    },

    'should throw a syntax error': function (error) {
      assert.isDefined(error);
      assert.ok(error instanceof SyntaxError, "Expected broken file to produce syntax error");
    }
  }
}).addBatch({
  'loading from a file with ENV vars': {
    topic: function() {
      process.env['DB_MIGRATE_TEST_VAR'] = 'username_from_env';
      var configPath = path.join(__dirname, 'database_with_env.json');
      config.load = _configLoad;
      config.loadUrl = _configLoadUrl;
      config.load(configPath, 'prod');
      return config;
    },

    'should load a value from the environments': function (config) {
      assert.equal(config.prod.username, 'username_from_env');
    },
}

}).addBatch({
  'loading from an URL': {
    topic: function() {
      var databaseUrl = 'postgres://uname:pw@server.com/dbname';
      config.load = _configLoad;
      config.loadUrl = _configLoadUrl;
      config.loadUrl(databaseUrl, 'dev');
      return config;
    },

    'should remove the load function': function (config) {
      assert.isUndefined(config.load);
    },

    'should remove the loadUrl function': function (config) {
      assert.isUndefined(config.loadUrl);
    },

    'should export the settings as the current environment': function (config) {
      assert.isDefined(config.dev);
    },

    'should export a getCurrent function with all current environment settings': function (config) {
      assert.isDefined(config.getCurrent);
      var current = config.getCurrent();
      assert.equal(current.env, 'dev');
      assert.equal(current.settings.driver, 'postgres');
      assert.equal(current.settings.user, 'uname');
      assert.equal(current.settings.password, 'pw');
      assert.equal(current.settings.host, 'server.com');
      assert.equal(current.settings.database, 'dbname');
    }
  }
}).export(module);

