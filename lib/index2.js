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
    a.env = null;
    return a;
  }
  // label provided : e.g. "invokedFunctionArn": "arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda:ci"
  if (invokedFunctionArnArray.length === 8) {
    a.region = invokedFunctionArnArray[3];
    a.account = invokedFunctionArnArray[4];
    a.version = a.env = invokedFunctionArnArray[7];
    return a;
  }
  console.log(invokedFunctionArnArray);
  throw new Error('Unexpected invokedFunctionArn format: ' + invokedFunctionArn);
}

// initialisation method (Optional)
function AwsHelper (aws, context, config) {
  a._aws = aws;
  a._context = context || {};
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

// function invokeLambdaFunction (lambdaFunctionName, payload, cb) {
//   if (!lambdaFunctionMame) throw new Error('lambdaFunctionName is required');
//   var params = {
//     FunctionName: a.account + ':' + lambdaFunctionName,
//     InvocationType: a.config.lambdaInvocationType || 'RequestResponse',
//     Payload: JSON.stringify(payload),
//     Qualifier: a.version,
//     LogType: a._config.lambdaInvocationType || 'None'
//   };
//   a._aws.lambda.invoke(params, cb);
// }

module.exports = AwsHelper;
module.exports.getEnvironment = getEnvironment;
