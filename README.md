# ChainerJS
##Overview:
ChainerJS is a Javascript MVP framework. The framework is currently is in working alpha but many of its functionarities are not implmented and have not been test thoroughly. The article below show what I have desgined and some of it is not implemented.

ChainerJS requires [JQuery](https://jquery.com/), but there will be a milestone to stop depending on it.
###Why Use ChainerJS?
* *ChainerJS probably has fast preformance*  
  The changes to the model this framework are very explicit, therefore it know when the models are being updated and never need to use do any dirty checking like AngularJS.
* *ChainerJS is more flexiable*  
  You can use setInterval directly. You can also add `data-*` attributes that have nothing to do ChainerJS as long as there are no naming conflicts. ChainerJS don't even care about elements name. You can use different javascript libraries along with ChainerJS.  
  In fact, you can put the html together using ChainerJS's `data-std-load` and then load the 3rd party library in the ChainerJS's ready function and your 3rd party JS library will act as if the whole html comes in one piece.
* *ChainerJS has a low learning curve*  
  To share data amoung the models, you just call the function `share` in sharing model and call the function `refer` or `get` in the recieving models. Compare this AngularJS, which require you to learn [services](https://docs.angularjs.org/guide/services) which have several way of [creating them](http://stackoverflow.com/questions/15666048/angularjs-service-vs-provider-vs-factory#15666049). You also worked with native function like setTimeout unlike in AngularJS where you have to learn to use [$timeout](https://docs.angularjs.org/api/ng/service/$timeout)
* *ChainerJS model data are organized*  
  The only way to change data in ChainerJS is through the one object api which declares it. Every data being shared outside of a model has a unique id and the id itself begins with a namespace to clearly indicate which model it come from. Compare this to AngularJS [inheritance scope](https://medium.com/@mnemon1ck/why-you-should-not-use-angularjs-1df5ddf6fc99#c14d)
* *ChainerJS has a foucs on separation of concern*  
  HTML file and its elements are representated is the view of the ChainerJS's MVP architecture and will only stores the static data. All the actual coding are in the javascript. Presenters uses `data-*` attributes but they no way knowing that attribute are made by other presenters. 
* *ChainerJS's presenters are easy to reuse*  
  When you want to use another presenter in a custom presenter you would just call `api.modifier` `api.genData` or `api.generator`. You can call presenters recusively just as easily. You don't need an [entire page](http://sporto.github.io/blog/2013/06/24/nested-recursive-directives-in-angular/) to teach you to how to build recusive presenters.
(Note: Nothing against AngularJS, it was the framework that I kind of know.)

###Syntax
Everything in ChainerJS uses this syntax:
~~~
chainer.type(function(arg0, arg1, api){
  api.doSomething(argument1, argument2, function(api1){
  });
});
~~~
Where:
* type is the either a model or a presenter function call. The word "type" is either:
  * `server` (connects to a page in the server)
  * `loader` (loads files into the page)
  * `generators` (generates elements and sometimes use a internal model)
  * `modifier` (edits the elements)
  * `model` (defines and edits the model)
  * `system` (sets prepation and ready function)
* api holds the function to work with the model or a presenter, you can replace the word `api` with any javascript accept-able variable name. It fact, it is often better to use a different name so you can use the api inside the inner function.
* doSomething is a function provided by the api. It return itself if no other data is needed.
* the function with the api as parameter is call the parent function to the nested function
* the function with the api1 as a parameter is call the child function 

##ChainerJS Interface
###Model
Model takes two paremeters: namespace and init function. The namespace uses this pattern `/^[0-9a-zA-Z]+(\.[0-9a-zA-Z]+)*$/` and must be by other models. The init is a function that inits the function. It has these functions:
* `write(field, value)` is either: (a) create a field with a value or (b) set a field with a value and call its listeners.
* `read(field, updater)` opens a way for a presentater to send updates. When there is an update the updater will be called.
* `share(field, value)` is either: (a) send data to models listening to it or (b) opens a function that another model can call this model
* `refer(id, updater)` listen to another model and allowed to call its function if the value store is one.
* `use(id)` get the value from another model without listen to it. This is lighter function call then `refer`

###Server
TODO not yet desgined

###Loader
This is a presenter that should be use the least as it will force the most of the page to reload. It is the only presenter that load elements from a different file. It takes two parameters a unique `data-*` attribute name and an init function. The attribute name uses this pattern `/^[0-9a-z]+(\-[0-9a-z]+)*$/`. It's api has these functions:
* `pathFromModel()`, `pathFromScript(value)`, `pathFromHTML()` shows where to look for a path
* `init(func)` and `ready(func)`  calls a func at a certain time, `init` for before loading and `ready` for after. Both of these has the following functions:
  * `get()` get underlining HTML element. In the future, this HTML tag can be deleted.
  * `update(id, value)` inform a model that one of its field has been updated.

###Generator
This is the most complex presenter due its abilty to produce more presenters. It has three parameters: a unique `data-*` attribute, generator category, and a run function. The attribute have this pattern `/^[0-9a-z]+(\-[0-9a-z]+)*$/`. The category uses `/[0-9a-zA-Z_]+/` pattern. Each generator attribute value is an array starts with a category. The generators only picks the tag with the same category.

The init function has the following function.
* `children(category, init)` creates a new generator of the element's children with the same tag of a different category.
* `find(category, init)` creates a new generator with the same tag and id but with a different category. Id comes from calling `data()`
* `data(defaulted)` gets the next value in generator data list.
* `generator(tag, category, data)` use a generator presenter and call if possible
* `modifier(tag, data)` use a modifier presenter and call it.
* `model(tag, id, func)` create a generator with a localized model based on an object from a main model data.
* `update(id, value)` inform a model that one of its field has been updated.
* `get()` gets the underlining HTML element. In the future, this HTML tag can be deleted.

Child init and run function calls recusively with the same functions.

###Modifier
This is a simple presenter with two parameters: a unique tag name and run function. It comes with these functions
* `attr` gets the data from either it's `data-*` attribute or from virtual attribute
* `update(id, value)` inform a model that one of its field has been updated.
* `get()` gets the underlining HTML tag. In the future, this HTML tag can be deleted.

###System
This tells the ChainerJS what to do when it is reloading or loading the html files. It comes with these functions
* `init(priority, func)`, `init(func)` tell the framework what to do before loading
* `ready(priority, func)`, `ready(func)` tell the framework what to do after loading
* All child functions comes with:
  * `update(id, value)` inform a model that one of its field has been updated.
  * `get()` gets the `<body>` element.

##Project goals
I have no idea when I will be around updating the script and unless I get pay to continue, I might not be able work on this project long-term.
