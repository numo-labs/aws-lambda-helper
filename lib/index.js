'use strict';

import tv4 from 'tv4';

function getEnvironment (context, cb) {
  let isCb = (typeof cb === 'function');

  if (!context.hasOwnProperty('invokedFunctionArn')) {
    let error = new Error('Failed get invokedFunctionArn');
    return (isCb ? cb(error) : (function () { throw error; }()));
  }

  let invokedFunctionArn = context.invokedFunctionArn;
  let env = invokedFunctionArn.substring(invokedFunctionArn.lastIndexOf(':') + 1, invokedFunctionArn.length);

  if (env === '') {
    let error = new Error('Could not find environment in invokedFunctionArn ' + invokedFunctionArn);
    return (isCb ? cb(error) : (function () { throw error; }()));
  }

  if (!isCb) return env;
  cb(null, env);
}

function validateWithSchema (event, payloadSchema, cb) {
  let isCb = (typeof cb === 'function');
  let validation = tv4.validateResult(event, payloadSchema, true);

  if (!validation.valid) return (isCb ? cb(validation.error, false) : (function () { throw validation.error; }()));
  if (!isCb) return true;
  cb(null, true);
}

export default {
  getEnvironment,
  validateWithSchema
};
