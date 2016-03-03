'use strict';

var a = {}; // re-useable Object
var Lambda = {};

// initialisation method (Optional)
function AwsHelper (aws, context, config) {
  a = {};
  a._AWS = aws;
  a._context = context;
  a._config = config || {};
  a.Lambda = Lambda;

  extractParams(context.invokedFunctionArn);
  a._AWS.config.region = a.region;
  return a;
}

// extract the params (region, account, versionLabel) from the invokedFunctionArn
function extractParams (invokedFunctionArn) {
  var invokedFunctionArnArray = invokedFunctionArn.split(':');
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

// backwards compatability to retrieve the env from a givien context.
// better to use AwsHelper
function getEnvironment (context) {
  if (!context || !context.invokedFunctionArn) {
    return null;
  }
  var env = a.env || extractParams(context.invokedFunctionArn).env;
  return env;
}

// Lambda helper functions

// Invoke another lambda function by given the functionName
// The lambda ARN will be build up using the current context account information extracted from the invokedFunctionArn
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property
Lambda.invoke = function (params, cb) {
  if (!params || !params.FunctionName) {
    throw new Error('params.FunctionName is required');
  }

  var lambda = new a._AWS.Lambda();
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

// Backwards compatability, should not be used
module.exports.Lambda = Lambda;
module.exports.getEnvironment = getEnvironment;
