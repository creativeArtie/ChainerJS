# ChainerJS
##Overview:
ChainnerJS is a Javascript MVVM framework. The framework is currently is in working alpha but many of its functionarities are not implmented and have not been test thoroughly. I also need funding to keep working at it long-term.
###Why Use ChainerJS
So why would ChainerJS can become great?
* *ChainerJS probably has fast preformance*  
  The changes to the model this framework are very explicit, therefore it know when the models are being updated and never need to use do any dirty checking like AngularJS.
* *ChainerJS is more flexiable*  
  You can use setInterval directly. You can also add new `data-*` attributes that have nothing to do ChainerJS as long as there are no naming conflicts. ChainerJS don't even care about elements. You can use different javascript libraries along with ChainerJS.  
  In fact, you can put the html together using ChainerJS's `data-std-load` and then load the 3rd party library in the ChainerJS's ready function and your 3rd party JS library will act as if the whole html comes in one piece.
* *ChainerJS has a lower learning curve then AngularJS*  
  To share data amoung the models, you just call the function `share` in sharing model and call the function `refer` or `get` in the recieving models. Compare this AngularJS, which require you to learn services which have several way of creating them.
* *ChainerJS model data are controlled*  
  The only way to change data in ChainerJS is through the one object api which declares it. Each 

###Syntax
This framework uses this syntax:
~~~
chainer.type(function(api){
  api.doSomething(argument1, argument2, function(api1){
  });
});
~~~
Where:
* type are the either model or a view. A view has four different types, which are:
  * server (conntects to the a page in the server)
  * loader (loads files into the page)
  * generators (generates elements and sometimes use a internal model)
  * modifier (edits the elements)
* api is interacting with the model or a view

###About the scope
Each of the nested function has its own 
