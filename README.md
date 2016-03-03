# aws-lambda-helper
Collection of helper methods for lambda

[![Build Status](https://travis-ci.org/tcdl/aws-lambda-helper.svg?branch=master)](https://travis-ci.org/tcdl/aws-lambda-helper)
[![codecov.io](https://codecov.io/github/tcdl/aws-lambda-helper/coverage.svg?branch=master)](https://codecov.io/github/tcdl/aws-lambda-helper?branch=master)

## Installation
`$ npm install aws-lambda-helper --save`

## Usage
`var helper = require('aws-lambda-helper');`

Initialise the helper inside the lambda function by passing in the context object. This returns an object with the following properties



`var aws = helper(context);`

##


### **Deprecated** : getEnvironment

Function to get environment from context object

Example:

```javascript
  var context = {
    invokedFunctionArn: 'arn:123:abs:prod'
  };

  var env = helper.getEnvironment(context); // 'prod';

```
