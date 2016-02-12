'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _tv = require('tv4');

var _tv2 = _interopRequireDefault(_tv);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function getEnvironment(context, cb) {
  if (!context.hasOwnProperty('invokedFunctionArn')) return cb(new Error('Failed get invokedFunctionArn'));

  var invokedFunctionArn = context.invokedFunctionArn;
  var env = invokedFunctionArn.substring(invokedFunctionArn.lastIndexOf(':') + 1, invokedFunctionArn.length);

  if (env === '') return cb(new Error('Could not find environment in invokedFunctionArn ' + invokedFunctionArn));
  cb(null, env);
}

function validateWithSchema(event, payloadSchema, cb) {
  var validation = _tv2.default.validateResult(event, payloadSchema, true);
  if (!validation.valid) return cb(validation.error);
  cb(null, true);
}

exports.default = {
  getEnvironment: getEnvironment,
  validateWithSchema: validateWithSchema
};