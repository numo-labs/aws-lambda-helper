'use strict';

import tv4 from 'tv4';

function getEnvironment (context, cb) {
  if (!context.hasOwnProperty('invokedFunctionArn')) return cb(new Error('Failed get invokedFunctionArn'));

  let invokedFunctionArn = context.invokedFunctionArn;
  let env = invokedFunctionArn.substring(invokedFunctionArn.lastIndexOf(':') + 1, invokedFunctionArn.length);

  if (env === '') return cb(new Error('Could not find environment in invokedFunctionArn ' + invokedFunctionArn));
  cb(null, env);
}

function validateWithSchema (event, payloadSchema, cb) {
  let validation = tv4.validateResult(event, payloadSchema, true);
  if (!validation.valid) return cb(validation.error, false);
  cb(null, true);
}

export {
  getEnvironment,
  validateWithSchema
};
