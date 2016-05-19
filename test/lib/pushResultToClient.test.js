// 'use strict';
//
// var assert = require('assert');
// var AwsHelper = require('./../../lib/index');
//
// var MSG = {hello: 'world'}; // doesn't need to be a "real" event
// var EVENT = {
//   Records: [{
//     Sns: {
//       Message: JSON.stringify(MSG)
//     }
//   }]
// };
//
// // I don't see the point in mocking this so these are real ("End-to-End") tests.
// describe('httpRequest', function () {
//   it('issue a GET request to Guardian API (confirms internet accessible)', function (done) {
//     AwsHelper.init({
//       invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:mylambda:ci'
//     }, EVENT); // Don't worry about the Dummy Event.
//     AwsHelper._getEventHeaders; // exercise "else" branch. where should we put this?
//
//     var options = {
//       'host': 'content.guardianapis.com',
//       'path': '/search?api-key=test',
//       // 'port': 443
//
//     };
//     AwsHelper.httpRequest(options, function (e, res) {
//       // console.log(res);
//       assert.equal(res.response.pageSize, 10);
//       done();
//     });
//   });
//
//   it('make GET request to invalid url (error branch check)', function (done) {
//     var options = {
//       'host': 'example.not',
//       'path': '/thiswillfail'
//     };
//     AwsHelper.httpRequest(options, function (e, res) {
//       assert.equal(e.code, 'ENOTFOUND');
//       done();
//     });
//   });
// });
