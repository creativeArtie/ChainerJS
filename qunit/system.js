QUnit.module("System");

QUnit.test( "Call Error", function( assert ) {
  assert.throws( function(){
    chainer.system(3);
  }, "Not a function: 3" );
});
