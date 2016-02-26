'use strict';

import assert from 'assert';
import AwsHelper from './../../lib';
import awsMock from 'aws-sdk-mock';

describe('AWS Lambda helper', () => {
  it('should get environment variable from context', (done) => {
    const context = {
      'invokedFunctionArn': 'arn:aws:lambda:eu-west-1:447022989235:function:aws-canary-lambda:prod'
    };
    console.log(JSON.stringify(AwsHelper, null, 2));
    let awsHelper = new AwsHelper(awsMock, context, {});

    assert.equal(awsHelper.version, 'prod');
    assert.equal(awsHelper.env, 'prod');
    done();
  });
});
