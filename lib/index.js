'use strict';

 // Context example
 // {
 //    "awsRequestId": "ebb337f8-dbe6-11e5-993d-8d772de156ef",
 //    "invokeid": "ebb337f8-dbe6-11e5-993d-8d772de156ef",
 //    "logGroupName": "/aws/lambda/aws-canary-lambda",
 //    "logStreamName": "2016/02/25/[$LATEST]af43675df7bd4d128d14ea3669d45635",
 //    "functionName": "aws-canary-lambda",
 //    "memoryLimitInMB": "128",
 //    "functionVersion": "$LATEST",
 //    "invokedFunctionArn": "arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda"
 //  }

class AwsHelper {
  constructor (aws, context, config) {
    this._aws = aws;
    this._context = context || {};
    this._config = config || {};
    this._extractParams(this._context.invokedFunctionArn || '');
  }

  _extractParams (invokedFunctionArn) {
    let invokedFunctionArnArray = invokedFunctionArn.split(':');
    // no label provided : e.g. "invokedFunctionArn": "arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda"
    if (invokedFunctionArnArray === 7) {
      this.region = invokedFunctionArnArray[3];
      this.accountId = invokedFunctionArnArray[4];
      this.version = '$LATEST';
      return;
    }
    // label provided : e.g. "invokedFunctionArn": "arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda:ci"
    if (invokedFunctionArnArray === 8) {
      this.region = invokedFunctionArnArray[3];
      this.accountId = invokedFunctionArnArray[4];
      this.version = '$LATEST';
      return;
    }

    throw new Error('Unexpected invokedFunctionArn format: ' + invokedFunctionArn);
  }

  invokeLambdaFunction (lambdaFunctionMame, payload, cb) {
    if (!lambdaFunctionMame) throw new Error('lambdaFunctionMame is required');
    let params = {
      FunctionName: this.accountId + ':' + lambdaFunctionMame,
      InvocationType: this._config.lambdaInvocationType || 'RequestResponse',
      Payload: JSON.stringify(payload),
      Qualifier: this.version,
      LogType: this._config.lambdaInvocationType || 'None'
    };
    this._aws.ambda.invoke(params, cb);
  }
}

export default {
  AwsHelper
};
