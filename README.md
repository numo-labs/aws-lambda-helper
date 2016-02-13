# aws-lambda-helper
Collection of helper methods for lambda


## Installation
`$ npm install aws-lambda-helper --save`

## Usage
`const helper = require('aws-lambda-helper');`


### getEnvironment

Function to get environment from context object

Example:

```
  const context = {
    invokedFunctionArn: 'arn:123:abs:prod'
  };

  helper.getEnvironment(context, function (err, env) {
    console.log(env);
    //print 'prod'
  });

```

### validateWithSchema

Function to validate input data with defined schema

```
  import payloadSchema from '../schemas/validationSchema';

  const data = {
    a: 1,
    b: 'Hello World'
  };

  helper.validateWithSchema(data, payloadSchema, function (err, valid) {
    console.log(valid);
    //print  'true'
  });

```