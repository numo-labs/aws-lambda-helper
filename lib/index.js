'use strict';

var AWS = require('aws-sdk');
var bunyan = require('bunyan');
var A = require('async');

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

  if (event.Records && event.Records[0] && event.Records[0].Sns.Message) {
    try {
      var msg = JSON.parse(event.Records[0].Sns.Message);
      /* istanbul ignore else */
      if (msg && msg.headers) { // this if statement is just so it does not exploed!
        return msg.headers;
      }
    } catch (e) {
      // return undefined
    }
  }

  if (event.Records && event.Records[0]) {
    var record = event.Records[0];
    var attrs = record.Sns.MessageAttributes;
    /* istanbul ignore else */
    if (attrs && Object.keys(attrs).length > 0) { // prevents ugly fail
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
  // then we will forward the tracing header to the new lambda instance when
  // being invoked.
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
  var headers = AwsHelper._getEventHeaders();
  if (Object.keys(headers).length > 0) {
    params.Payload.headers = headers;
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

  if (Object.keys(headers).length > 0) {
    var message;

    try {
      message = JSON.parse(params.Message).default;
      message = JSON.parse(message);
      message.headers = headers;
      p.Message = JSON.stringify({
        default: JSON.stringify(message)
      });
    } catch (e) {
    }
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

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}

AwsHelper.Logger = function (tags) {
  tags = tags || [];
  /* istanbul ignore next */
  var context = AwsHelper._context || {};
  var headers = AwsHelper._getEventHeaders();
  /* istanbul ignore next */
  var log = bunyan.createLogger({
    serializers: { err: bunyan.stdSerializers.err },
    name: context.functionName || context.invokedFunctionArn || 'unknown',
    level: headers['request-log-level'] || process.env.LOG_LEVEL || 'info',
    'invoked_function_arn': context.invokedFunctionArn,
    version: context.functionVersion,
    'traceable_id': headers['trace-request-id'] || '',
    tags: Array.isArray(tags) ? tags : [tags],
    env: AwsHelper.env,
    headers: headers
  });
  return log;
};

/* istanbul ignore next */
process.on('uncaughtException', function (err) {
  var log = AwsHelper.log;
  if (Object.keys(AwsHelper.log).length === 0) {
    log = AwsHelper.Logger('exception');
  }
  log.fatal({err: err, stack: err.stack}, 'Uncaught Exception');
  throw err;
});

/**
 * @see pushResultToClient
 */
function pushToSNSTopic (params, callback) {
  if (!process.env.SEARCH_RESULT_TOPIC) {
    return callback(new Error('SEARCH_RESULT_TOPIC is not defined'));
  }
  AwsHelper.SNS.publish({
    Message: JSON.stringify({
      default: JSON.stringify(params)
    }),
    TopicArn: process.env.SEARCH_RESULT_TOPIC,
    MessageStructure: 'json'
  }, callback);
}

AwsHelper.pushToSNSTopic = pushToSNSTopic; // exported for testing

var resultBucket = new AWS.S3({ params:
  {Bucket: process.env.AWS_S3_SEARCH_RESULT_BUCKET}});

/**
 * saveRecordToS3
 * @param {Object} params - the object we want to retrieve
 */
function getRecord (params, callback) {
  var env = AwsHelper.env; // remember to Initialise this!
  var s3params = {
    Bucket: process.env.AWS_S3_SEARCH_RESULT_BUCKET,
    Key: env + '/' + params.url + '.json'
  };
  resultBucket.getObject(s3params, function (err, data) {
    if (err || !data.Body) {
      return callback(err);
    } else {
      return callback(err, JSON.parse(data.Body.toString()));
    }
  });
}

AwsHelper.getRecordFromS3 = getRecord; // export for testing

/**
 * Given a search result, deliver it to the client via SNS/WebSocket server,
 * and create an S3 object with the search result.
 * with all the information required to forward a search result item
 * on to the Client that requested the search.
 * See https://github.com/numo-labs/aws-lambda-helper/issues/40
 *
 * @param {Object} params - search results plus metadata needed to deliver those
 * to the right client
 * @param params.id - client id
 * @param params.searchId - search id
 * @param params.userId - user id
 * @param params.items - search results
 * @param {Function} callback - a callback
 */
AwsHelper.pushResultToClient = function (params, callback) {
  if (!params.id) {
    const msg = 'id property is required to return results to client';
    AwsHelper.log.error({data: params}, msg);
    return callback(new Error(msg));
  }

  var filtered = params.items.filter(function (item) {
    return item.url;
  });

  if (filtered.length === 0) {
    return callback(new Error('no valid items to save!'));
  }

  A.filterLimit(
    filtered,
    10,
    function (item, next) {
      var s3params = {
        Bucket: process.env.AWS_S3_SEARCH_RESULT_BUCKET,
        Key: AwsHelper.env + '/' + item.url + '.json',
        Body: JSON.stringify(item),
        ContentType: 'application/json',
        ACL: 'public-read'
      };
      resultBucket.upload(s3params, function (err, data) {
        /* istanbul ignore if */
        if (err) {
          AwsHelper.log.error({ err: err }, 'Error saving search result to S3 bucket');
        }
        return next(null, !err);
      });
    },
    function done (err, results) {
      /* istanbul ignore if */
      if (err) {
        return callback(err, null);
      }
      // results now only contains the items that were saved to S3 successfully
      var params2 = Object.assign({}, params);
      params2.items = results;
      pushToSNSTopic(params2, function (err, data) {
        if (err) {
          AwsHelper.log.error({err: err, data: data}, 'ERROR Sending Data via WebSocket');
        }
        return callback(err, data);
      });
    });
};

module.exports = AwsHelper;
module.exports.getEnvironment = AwsHelper.getEnvironment;
