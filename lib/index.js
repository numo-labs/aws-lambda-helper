'use strict';

var a = {}; // re-useable Object

function extractParams (invokedFunctionArn) {
  // console.log(' >> ', invokedFunctionArn);
  var invokedFunctionArnArray = invokedFunctionArn.split(':');
  // console.log(' >> invokedFunctionArnArray.length: ', invokedFunctionArnArray.length);
  // no label provided : e.g. "invokedFunctionArn": "arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda"
  if (invokedFunctionArnArray.length === 7) {
    a.region = invokedFunctionArnArray[3];
    a.account = invokedFunctionArnArray[4];
    a.version = '$LATEST';
    return a;
  }
  // label provided : e.g. "invokedFunctionArn": "arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda:ci"
  if (invokedFunctionArnArray.length === 8) {
    a.region = invokedFunctionArnArray[3];
    a.account = invokedFunctionArnArray[4];
    a.version = a.env = invokedFunctionArnArray[7];
    return a;
  }

  throw new Error('Unexpected invokedFunctionArn format: ' + invokedFunctionArn);
}

// initialisation method (Optional)
function AwsHelper (aws, context, config) {
  a._aws = aws;
  a._context = context;
  a._config = config || {};
  extractParams(context.invokedFunctionArn);
  return a;
}

function getEnvironment (context) {
  if (!context || !context.invokedFunctionArn) {
    return null;
  }
  var env = a.env || extractParams(context.invokedFunctionArn).env;
  return env;
}

var AWS = require('aws-sdk');
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property
var Lambda = {};

Lambda.invoke = function (params, cb) {
  if (!params || !params.FunctionName) {
    throw new Error('params.FunctionName is required');
  }
  AWS.config.region = a.region;
  var lambda = new AWS.Lambda();
  var p = {
    FunctionName: a.account + ':' + params.FunctionName,
    InvocationType: a._config.lambdaInvocationType || 'RequestResponse',
    Payload: JSON.stringify(params.Payload),
    Qualifier: params.Qualifier || a.version,
    LogType: a._config.lambdaInvocationType || 'None'
  };
  return lambda.invoke(p, cb);
};
module.exports = AwsHelper;
module.exports.Lambda = Lambda;
module.exports.getEnvironment = getEnvironment;
