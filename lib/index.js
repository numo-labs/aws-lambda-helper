'use strict';

var AWS = require('aws-sdk');
var AwsHelper = {
  _AWS: AWS,
  _context: null,
  _Lambda: null,
  _SNS: null,
  _DynamoDB: null,
  region: null,
  version: null,
  account: null,
  Lambda: {},
  SNS: {},
  DynamoDB: {},
  init: init
};

// initialisation method (Optional)
function init (context) {
  AwsHelper._context = context;
  AwsHelper._Lambda = null;
  AwsHelper._SNS = null;
  AwsHelper._DynamoDB = null;
  AwsHelper._parseInvokedFunctionArn(context.invokedFunctionArn);
  AwsHelper._AWS.config.region = AwsHelper.region;
  return AwsHelper;
}

AwsHelper._parseInvokedFunctionArn = function (invokedFunctionArn) {
  if (!invokedFunctionArn) throw new Error('invokedFunctionArn needs to be specified:' + invokedFunctionArn);
  var invokedFunctionArnArray = invokedFunctionArn.split(':');
  // no label provided : e.g. "invokedFunctionArn": "arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda"
  if (invokedFunctionArnArray.length === 7) {
    AwsHelper.region = invokedFunctionArnArray[3];
    AwsHelper.account = invokedFunctionArnArray[4];
    AwsHelper.version = '$LATEST';
    AwsHelper.env = 'ci'; // default environment is ci
    return AwsHelper;
  }
  // label provided : e.g. "invokedFunctionArn": "arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda:ci"
  if (invokedFunctionArnArray.length === 8) {
    AwsHelper.region = invokedFunctionArnArray[3];
    AwsHelper.account = invokedFunctionArnArray[4];
    AwsHelper.version = AwsHelper.env = invokedFunctionArnArray[7];
    return AwsHelper;
  }
  throw new Error('Unexpected invokedFunctionArn format: ' + invokedFunctionArn);
};

// backwards compatability to retrieve the env from a givien context.
// better to use AwsHelper(context).env;
AwsHelper.getEnvironment = function (context) {
  return init(context).env;
};

// Lambda helper functions

// Invoke another lambda function by given the functionName
// The lambda ARN will be build up using the current context account information extracted from the invokedFunctionArn
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LambdAwsHelper.html#invoke-property
AwsHelper.Lambda.invoke = function (params, cb) {
  if (!params || !params.FunctionName) {
    throw new Error('params.FunctionName is required');
  }

  // Add account when only the functionName is provided, we should avoid giving full ARN qualifiers
  if (params.FunctionName.indexOf(':') === -1) {
    params.FunctionName = AwsHelper.account + ':' + params.FunctionName;
  }

  AwsHelper._initLambdaObject();

  var p = {
    FunctionName: params.FunctionName,
    InvocationType: params.InvocationType || 'RequestResponse',
    Payload: JSON.stringify(params.Payload),
    Qualifier: params.Qualifier || AwsHelper.version,
    LogType: params.LogType || 'None'
  };

  return AwsHelper._Lambda.invoke(p, function (err, data) {
    if (err) return cb(err);
    var payload = JSON.parse(data.Payload);
    if (payload.errorMessage) return cb(payload);
    return cb(null, payload);
  });
};

AwsHelper._initLambdaObject = function () {
  AwsHelper._Lambda = AwsHelper._Lambda || new AwsHelper._AWS.Lambda();
};

/*
* Wrapper around SNS publish to format the TopicARN.
* Params object has the same format as the params object
* of the sns.publish method on the AWS SDK with the addition of a
* TopicName param which is just a string of the topic name
*/
AwsHelper.SNS.publish = function (params, cb) {
  if (!params || !params.TopicArn) {
    throw new Error('params.TopicArn is required');
  }

  // Add account when only the functionName is provided, we should avoid giving full ARN qualifiers
  if (params.TopicArn.indexOf(':') === -1) {
    params.TopicArn = 'arn:aws:sns:' + AwsHelper.region + ':' + AwsHelper.account + ':' + params.TopicArn + '-' + AwsHelper.env;
  }

  AwsHelper._initSNSObject();

  var p = {
    Message: params.Message,
    MessageStructure: params.MessageStructure || 'json',
    Subject: params.Subject || '', // only used for eMail end-points
    TopicArn: params.TopicArn
  };

  return AwsHelper._SNS.publish(p, cb);
};

AwsHelper._initSNSObject = function () {
  AwsHelper._SNS = AwsHelper._SNS || new AwsHelper._AWS.SNS();
};

/*
* Wrapper around DynamoDB putItem
* Adds the environment to the TableName parameter
*
*/
AwsHelper.DynamoDB.putItem = function (params, cb) {
  if (!params || !params.TableName) {
    throw new Error('params.TableName is required');
  }

  AwsHelper._initDynamoDBObject();

  var p = {
    Item: params.Item,
    TableName: params.TableName + '-' + AwsHelper.env
  };

  return AwsHelper._DynamoDB.putItem(p, cb);
};

AwsHelper._initDynamoDBObject = function () {
  AwsHelper._DynamoDB = AwsHelper._DynamoDB || new AwsHelper._AWS.DynamoDB();
};

module.exports = AwsHelper;
module.exports.getEnvironment = AwsHelper.getEnvironment;
