QUnit.test( "Start Error", function( assert ) {
  assert.throws( function(){
    chainer.models(".abc", function(){})
  }, "Namespace string pattern is wrong: .abc" );
});
QUnit.test( "Text Error", function( assert ) {
  assert.throws( function(){
    chainer.models("a_bc", function(){});
  }, "Namespace string pattern is wrong: a_bc" );
});
QUnit.test( "Repeat Error", function( assert ) {
  assert.throws( function(){
    chainer.models("abc", function(){});
    chainer.models("abc", function(){});
  }, "Model with this namespace is in use: abc" );
});
QUnit.test( "End Error", function( assert ) {
  assert.throws( function(){
    chainer.models("_abc", function(){});
  }, "Namespace string pattern is wrong: abc." );
});
