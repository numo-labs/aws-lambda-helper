# aws-lambda-helper
Collection of helper methods for lambda

[![Build Status](https://travis-ci.org/numo-labs/aws-lambda-helper.svg?branch=master)](https://travis-ci.org/numo-labs/aws-lambda-helper)
[![codecov.io](https://codecov.io/github/numo-labs/aws-lambda-helper/coverage.svg?branch=master)](https://codecov.io/github/numo-labs/aws-lambda-helper?branch=master)

## Installation
`$ npm install aws-lambda-helper --save`

## Usage

```javascript
  var AwsHelper = require('aws-lambda-helper');

  exports.handler = function(event, context) {
    ...
    //Initialise the helper by passing in the context
    var awsHelper = AwsHelper(context);
    ...
  }
```

### Invoke a Lamda function

```javascript

  var AwsHelper = require('aws-lambda-helper');
  var AWS = require('aws-sdk');

  exports.handler = function(event, context){
    // assume : context.invokedFunctionArn = invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:prod'

    //Initialise the helper by passing in the context
    var awsHelper = AwsHelper(context);

    console.log(awsHelper.env); //prints: prod
    console.log(awsHelper.region); //prints: eu-west-1
    console.log(awsHelper.region); //prints: 123456789

    var params = {
        FunctionName: 'MyAmazingLambda',
        Payload: { 'hello': 'world' },
        Qualifier: ''
      };
    awsHelper.Lambda.invoke(params, function (err, data) {
      if(err) return context.fail(err);
      context.succeed(data);
    });
  }
```

### Invoke a Lamda function
