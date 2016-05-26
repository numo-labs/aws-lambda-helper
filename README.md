# aws-lambda-helper
Collection of helper methods for lambda

[![Build Status](https://travis-ci.org/numo-labs/aws-lambda-helper.svg?branch=master)](https://travis-ci.org/numo-labs/aws-lambda-helper)
[![codecov.io](https://codecov.io/github/numo-labs/aws-lambda-helper/coverage.svg?branch=master)](https://codecov.io/github/numo-labs/aws-lambda-helper?branch=master)
[![Dependency Status](https://david-dm.org/numo-labs/aws-lambda-helper.svg)](https://david-dm.org/numo-labs/aws-lambda-helper)
[![devDependency Status](https://david-dm.org/numo-labs/aws-lambda-helper/dev-status.svg)](https://david-dm.org/numo-labs/aws-lambda-helper#info=devDependencies)

## Installation
`$ npm install aws-lambda-helper --save`

## Usage

```javascript
  var AwsHelper = require('aws-lambda-helper');

  exports.handler = function(event, context) {
    ...
    //Initialise the helper by passing in the context
    AwsHelper.init(context);
    ...
  }
```

### Invoke a Lamda function

```javascript

  var AwsHelper = require('aws-lambda-helper');

  exports.handler = function(event, context){
    // assume : context.invokedFunctionArn = invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:prod'

    //Initialise the helper by passing in the context
    AwsHelper.init(context);

    console.log(AwsHelper.env); //prints: prod
    console.log(AwsHelper.region); //prints: eu-west-1
    console.log(AwsHelper.account); //prints: 123456789

    var params = {
        FunctionName: 'MyAmazingLambda',
        Payload: { 'hello': 'world' },
        Qualifier: ''
      };
    AwsHelper.Lambda.invoke(params, function (err, data) {
      AwsHelper.failOnError(err, event, context);
      context.succeed(data);
    });
  }
```

### fn: failOnError

This function will intercept the error if exists and then will call 'context.fail'.
The purpose of this function is to avoid the need of checking for errors so that in callback you could just focus on the succesfull procedure.

It can be used as follows:
```js

 AwsHelper.Lambda.invoke(params, function (err, data) {
      AwsHelper.failOnError(err, event, context);
      context.succeed(data);
  });

```

### Logging JSON messages

```js
var AwsHelper = require('aws-lambda-helper');

exports.handler = function(event, context){
  // assume : context.invokedFunctionArn = invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:prod'

  //Initialise the helper by passing in the context
  AwsHelper.init(context, event);

  var log = AwsHelper.Logger('example');

  log.info();     // Returns a boolean: is the "info" level enabled?
  // This is equivalent to `log.isInfoEnabled()` or
  // `log.isEnabledFor(INFO)` in log4j.

  log.info('hi');                     // Log a simple string message (or number).
  log.info('hi %s', bob, anotherVar); // Uses `util.format` for msg formatting.

  log.info({foo: 'bar'}, 'hi');
  // The first field can optionally be a "fields" object, which
  // is merged into the log record.

  log.info(err);  // Special case to log an `Error` instance to the record.
  // This adds an "err" field with exception details
  // (including the stack) and sets "msg" to the exception
  // message.
  log.info(err, 'more on this: %s', more);
  // ... or you can specify the "msg".

  log.info({foo: 'bar', err: err}, 'some msg about this error');
  // To pass in an Error *and* other fields, use the `err`
  // field name for the Error instance.
}
```

### Pushing Data Back to Client(s) Via WebSocket Server

```js
var params = {
  id: sessionId, // the id provided by the WebSocket Server
  searchId: 12345, // the id of this particular search request
  userId: 'UniqueFingerprint', // the super long string that uniquely identifies a client
  items: [
    // your list of one or more tiles or packages go here
  ]
};
AwsHelper.pushResultToClient(params, function (err, res) {
  console.log(err, res); // do what ever you want after the result is pushed
});
```

### Retrieving a Search Result (*Artile Tile or Package*)

When a user shares a result tile (*e.g. an article or package*)
we retrieve the result they saw from S3:

```js
var params = {
  userId: 'UniqueFingerprint', // the super long string that uniquely identifies a client
  sessionId: 12345, // the session as defined by the WebSocket id
  itemId: ABC1234, // the tile (article/pacakge) id
};
AwsHelper.getRecordFromS3(params, function (err, res) {
  console.log(err, res); // do what ever you want after the result is pushed
});
```

#### Environment Variables

You will require an the following Environment Variables to push results to S3
and retrieve them later:
```
export WEBSOCKET_SERVER_URL=get_this_from_codeship
export AWS_S3_SEARCH_RESULT_BUCKET=get_this_from_codeship
```

(*see below for complete list of required Environment Variables*)

> if you get stuck get the Environment Variables from CodeShip:
> https://codeship.com/projects/143221/configure_environment
