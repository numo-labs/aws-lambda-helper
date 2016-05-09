'use strict';

var AWS = require('aws-sdk');
var bunyan = require('bunyan');

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
  init: init,
  log: {}
};

// initialisation method (Optional)
function init (context, event) {
  AwsHelper._context = context;
  AwsHelper._event = event;
  AwsHelper._Lambda = null;
  AwsHelper._SNS = null;
  AwsHelper._DynamoDB = null;
  AwsHelper._parseInvokedFunctionArn(context.invokedFunctionArn);
  AwsHelper._AWS.config.region = AwsHelper.region;
  AwsHelper.log = AwsHelper.Logger();
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

// This is a helper function that retrieves the headers from the event, that
// depending on if it is an event from SNS, a lambda invoke, etc will return a
// like-for-like object.
AwsHelper._getEventHeaders = function () {
  var event = AwsHelper._event || {};

  // This is a event header from an invocation of lambda or a API Gateway.
  var headers = event.headers;
  if (headers) {
    return headers;
  }

  if (event.Records && event.Records[0]) {
    var record = event.Records[0];
    var attrs = record.Sns.MessageAttributes;
    if (attrs && Object.keys(attrs).length > 0) {
      headers = {};
      Object.keys(attrs).map(function (key) {
        headers[key] = attrs[key].Value;
      });
      return headers;
    }
  }

  // Default to an empty object
  return {};
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

  // If a trace-request-id is present on the header of the consuming lambda
  // then we forward this the new lambda instance when it is being invoked.
  //
  // Eventually this payload should be move to:
  // {
  //    body: { ... },
  //    headers: {
  //     'trace-request-id': 'some-id'
  //    }
  // }
  //
  // Where { ... } is the current params.Payload.
  if (AwsHelper._event &&
      AwsHelper._event.headers &&
      AwsHelper._event.headers['trace-request-id']) {
    params.Payload.headers = {
      'trace-request-id': AwsHelper._event.headers['trace-request-id']
    };
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

  var headers = AwsHelper._getEventHeaders();

  var p = {
    Message: params.Message,
    MessageStructure: params.MessageStructure || 'json',
    TopicArn: params.TopicArn
  };

  if (headers['trace-request-id']) {
    p.MessageAttributes = {
      'trace-request-id': {
        DataType: 'String',
        StringValue: headers['trace-request-id']
      }
    };
  }

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
  AwsHelper._initDynamoDBObject();

  var p = {
    Item: params.Item,
    TableName: params.TableName + '-' + AwsHelper.env
  };

  return AwsHelper._DynamoDB.putItem(p, cb);
};

AwsHelper.DynamoDB.query = function (params, cb) {
  AwsHelper._initDynamoDBObject();

  var p = clone(params);
  p.TableName = params.TableName + '-' + AwsHelper.env;

  return AwsHelper._DynamoDB.query(p, cb);
};

AwsHelper.DynamoDB.batchGetItem = function (params, cb) {
  AwsHelper._initDynamoDBObject();

  var p = clone(params);
  Object.keys(p.RequestItems).map(function (table) {
    p.RequestItems[table + '-' + AwsHelper.env] = p.RequestItems[table];
    delete p.RequestItems[table];
  });

  return AwsHelper._DynamoDB.batchGetItem(p, cb);
};

AwsHelper._initDynamoDBObject = function () {
  AwsHelper._DynamoDB = AwsHelper._DynamoDB || new AwsHelper._AWS.DynamoDB();
};

/**
 * Error interceptor function. This function will intercept any error and
 * launch context fail function in order to response. It also will be responsible
 * of logging the errors as needed.
 * @param  {object} err         Lambda error object.
 * @param  {object} event       Event input object. Unusued right now. It could
 *                              be used for logging purposes.
 * @param  {object} context     Lambda runtime data object.
 * @return {undefined/function} Returns undefined if there is no error and
*                               function execution if there is anyone.
 */
AwsHelper.failOnError = function (err, event, context) {
  if (!err) return;
  return context.fail(err);
};

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}

AwsHelper.Logger = function (tags) {
  tags = tags || [];
  var context = AwsHelper._context || {};
  var headers = AwsHelper._getEventHeaders();

  var log = bunyan.createLogger({
    name: context.functionName || context.invokedFunctionArn || 'unknown',
    'invoked_function_arn': context.invokedFunctionArn,
    version: context.functionVersion,
    'traceable_id': headers['trace-request-id'] || '',
    tags: Array.isArray(tags) ? tags : [tags]
  });
  return log;
};

module.exports = AwsHelper;
module.exports.getEnvironment = AwsHelper.getEnvironment;
