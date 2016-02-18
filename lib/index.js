'use strict';

import tv4 from 'tv4';

function getEnvironment (context, cb) {
  let isCb = (typeof cb === 'function');

  if (!context.hasOwnProperty('invokedFunctionArn')) {
    return (isCb ? cb(new Error('Failed get invokedFunctionArn')) : _trowError(new Error('Failed get invokedFunctionArn')));
  }

  let invokedFunctionArn = context.invokedFunctionArn;
  let env = invokedFunctionArn.substring(invokedFunctionArn.lastIndexOf(':') + 1, invokedFunctionArn.length);

  if (env === '') {
    return (isCb ? cb(new Error('Could not find environment in invokedFunctionArn ' + invokedFunctionArn)) : _trowError(new Error('Could not find environment in invokedFunctionArn ' + invokedFunctionArn)));
  }

  if (!isCb) return env;
  cb(null, env);
}

function validateWithSchema (event, payloadSchema, cb) {
  let isCb = (typeof cb === 'function');
  let validation = tv4.validateResult(event, payloadSchema, true);

  if (!validation.valid) {
    return (isCb ? cb(validation.error, false) : _trowError(validation.error));
  }

  if (!isCb) return true;
  cb(null, true);
}

function _trowError (error) {
  throw error;
}

export default {
  getEnvironment,
  validateWithSchema
};
