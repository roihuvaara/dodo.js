'use strict';

/**
 * Currently we are using gulp as only build system, but I wouldn't want to
 * hang to it too much (maybe own client would be better to have...)
 *
 * Biggest problem is that when writing dodo plugins which registers their
 * own tasks, it would be nasty to have to write support for multiple build
 * systems there... so lets try to write all real build code platform
 * independently and then gulp-base just wraps common implementations to gulp...
 * (if one likes to use gulp in their common implementation that is fine too
 * not my problem)
 */

 var _ = require('lodash')
   , fs = require('fs')
   , path = require('path')
   ;

 module.exports = {
  /**
   * TODO: read also configuration to be able to tell which plugins /
   *       plugin tasks are available for each service
   */
  scanServices: function (serviceDir, selectedConfiguration) {
    // Create services folder if it doesn't exist.
    if (!fs.existsSync(serviceDir)) {
      fs.mkdirSync(serviceDir);
    }

    // Names of all the services (must have directory serviceName/config)
    var serviceNames = _.filter(fs.readdirSync(serviceDir), function(fileName) {
      var serviceConfigPath = path.join(serviceDir, fileName, 'config');
      try {
        return fs.lstatSync(serviceConfigPath).isDirectory();
      } catch (err) {
        return false;
      }
    });

    return _.map(serviceNames, function (serviceName) {
      var configurationPath = path.join(serviceDir, serviceName, 'config', selectedConfiguration);
      var configuration = null;
      try {
        // TODO: add support ES6 modules
        configuration = require(configurationPath);
      } catch (err) {
        // could not read configuration, maybe given profile was not defined for
        // the service, which is totally cool... no prob bro!
      }

      return {
        name: serviceName,
        configPath: configurationPath,
        config: configuration,

        tasks: [
          {
            name: 'serve',
            run: function (serviceConfig) {
              var app = require('dodo/lib/app/express/main');
              return app.start(serviceConfig);
            },
            description: 'Start the express app of the service.'
          },
          {
            name: 'test',
            run: function (serviceConfig) {
              // TODO: run mocha / coveralls etc.
              return false;
            },
            description: 'Runs all tests of the service.'
          }
        ]
      };
    });
  }
};