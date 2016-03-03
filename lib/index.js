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

var SNS = {};

/*
* Wrapper around SNS publish to format the TopicARN. Params object has the same
* format as the params object of the sns.publish method on the AWS SDK
* with the addition of a TopicName param which is just a string of the topic name
*/

SNS.publish = function (params, cb) {
  if (!params || !params.TopicName) {
    throw new Error('params.topicName is required');
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

module.exports = AwsHelper;
module.exports.Lambda = Lambda;
module.exports.getEnvironment = getEnvironment;
