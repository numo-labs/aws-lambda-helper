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
    InvocationType: params.lambdaInvocationType || 'RequestResponse',
    Payload: JSON.stringify(params.Payload),
    Qualifier: params.Qualifier || a.version,
    LogType: params.lambdaInvocationType || 'None'
  };
  return lambda.invoke(p, cb);
};

/*
* Wrapper around SNS publish to format the TopicARN.
* Params object has the same format as the params object
* of the sns.publish method on the AWS SDK with the addition of a
* TopicName param which is just a string of the topic name
*/

var Sns = {};

Sns.publish = function (params, cb) {
  if (!params || !params.TopicName) {
    throw new Error('params.TopicName is required');
  }
  AWS.config.region = a.region;
  var sns = new AWS.SNS();
  var TopicARN = 'arn:aws:sns:' + a.region + ':' + a.account + ':' + params.TopicName + a.env;

  var p = {
    Message: params.Message,
    TopicARN: TopicARN,
    MessageStructure: 'json',
    Subject: params.Subject || '',
    TargetArn: params.TargetArn || TopicARN
  };
  return sns.publish(p, cb);
};

/*
* Wrapper around DynamoDB putItem
* Adds the environment to the TableName parameter
*
*/

var DynamoDB = {};

DynamoDB.putItem = function (params, cb) {
  if (!params || !params.TableName) {
    throw new Error('params.TableName is required');
  }
  AWS.config.region = a.region;
  var dynamodb = new AWS.DynamoDB();

  var p = {
    Item: params.Item,
    TableName: params.TableName + '-' + a.env
  };

  return dynamodb.putItem(p, cb);
};

/*
* Initialisation method for the helper.
*
* Returns an object with the wrapped AWS SDK methods as well as the
* extracted parameters
*/

function initHelper (context) {
  if (!context) {
    throw new Error('context is required');
  }

  a._context = context;
  extractParams(context.invokedFunctionArn);
  return {
    contextParams: a,
    Lambda: Lambda,
    DynamoDB: DynamoDB,
    Sns: Sns
  };
}

module.exports = initHelper;
module.exports.getEnvironment = getEnvironment;
