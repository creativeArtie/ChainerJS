QUnit.module("Model Names");
QUnit.test( "Start Error", function( assert ) {
  assert.throws( function(){
    chainer.models(".abc", function(){})
  }, "Namespace string pattern is wrong: .abc" );
});
QUnit.test( "Text Error", function( assert ) {
  assert.throws( function(){
    chainer.model("a_bc", function(){});
  }, "Namespace string pattern is wrong: a_bc" );
});
QUnit.test( "Repeat Error", function( assert ) {
  assert.throws( function(){
    chainer.model("abc", function(){});
    chainer.model("abc", function(){});
  }, "Model with this namespace is in use: abc" );
});
QUnit.test( "End Error", function( assert ) {
  assert.throws( function(){
    chainer.modes("_abc", function(){});
  }, "Namespace string pattern is wrong: abc." );
});
QUnit.test( "Basic" , function( assert ){
  chainer.model("joy", function(){});
  chainer.model("test.123", function(){});
  assert.expect(0);
});
