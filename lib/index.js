'use strict';

import tv4 from 'tv4';

function getEnvironment (context) {
  if (!context || !context.hasOwnProperty('invokedFunctionArn')) return null;

  let invokedFunctionArn = context.invokedFunctionArn;
  let env = invokedFunctionArn.substring(invokedFunctionArn.lastIndexOf(':') + 1, invokedFunctionArn.length);

  return (env === '' ? null : env);
}

function validateWithSchema (event, payloadSchema) {
  let validation = tv4.validateResult(event, payloadSchema, true);

  if (!validation.valid) throw validation.error;
  return true;
}

export default {
  getEnvironment,
  validateWithSchema
};
