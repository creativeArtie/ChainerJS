# ChainerJS
## Overview:
ChainerJS is a Javascript MVP framework. The framework is currently is in working alpha but many of its functionarities are not implmented and have not been test thoroughly. The article below show what I have desgined and some of it is not implemented.

ChainerJS requires [JQuery](https://jquery.com/), but hopefully there will be a milestone to stop depending on it.

There are some example usage stored on here:
1. [ChainerJS mix with AngularJS](angular): ChainerJS and AngularJS communcating to each other
2. [Loader and Basic](loader): Loading a pages into the div elements
3. [Loading tabs](loadtab): Using JQuery UI download from [it's download page](http://jqueryui.com/download/) to create the tabs using elements loaded by ChainerJS
4. [Modifly and Delete](modiferDelete): Editing and deleting data

### Why Use ChainerJS?
* *ChainerJS is easy to learn*: There are very few methods in the core framework and they are uses the same syntax. You can and will directly manipiate the DOM inside the presenters. The presenters have clear define purpose: loaders loads HTML files, generators generates more presenters, and modifiers do simple DOM manipulation. In the future, there is also a way to quickly and easily communicate to the server.
* *ChainerJS is reflexiable.*: ChainerJS works only with the elements that have customized attributes and `data-` attributes that matches it's presenters' name. You can modify, move or even delete an element without do anything special with ChainerJS. This allows things like using [AngularJS with ChainerJS](angular). 
* *ChainerJS has clear separation of concern.*: ChainerJS doesn't resolve expressions in the HTML. Model data scope are restricted to the method that creates is namespace and will only updatable when the model is explicitly being told to share it.
* *ChainerJS has a low resource demand.*: A model's data listener can be counted by the number of time when `receive` or `refer` is being called and the listeners only run when `write` or `share` is being called. Loading data from presenters are even easier to count the number of listeners and callers: there is only one listener for each data and called by the number of time when `update` is being called. ChainerJS does nothing fancy with the DOM. 

### Syntax
Everything in ChainerJS uses this syntax:
~~~
chainer.type(arg0, arg1, function(api){
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

## ChainerJS Interface
### Model
Model takes two paremeters: namespace and init function. The namespace uses this pattern `/^[0-9a-zA-Z]+(\.[0-9a-zA-Z]+)*$/` and unique for each model. The init is a function that inits the function. It has these functions:
* `write(field, value)` is either: (a) create a field with a value or (b) set a field with a value and call its listeners.
* `read(field, updater)` opens a way for a presentater to send updates. When there is an update the `updater` will be called.
* `share(field, value)` is either: (a) send data to models listening to it or (b) opens a function that another model can call this model
* `refer(id, updater)` listen to another model and allowed to call its function if the value store is one.
* `use(id)` get the value from another model without listen to it. This is lighter function call then `refer`

### Server
TODO not yet desgined

### Loader
This is a presenter that loads a file to an element and can do things before and after the loading the file. It is the only presenter that load elements from a different file. It takes two parameters a unique `data-*` attribute name and an init function. The attribute name uses this pattern `/^[0-9a-z]+(\-[0-9a-z]+)*$/`. It's api has these functions:
* `pathFromModel()`, `pathFromScript(value)`, `pathFromHTML()` shows where to look for a path
* `init(func)` and `ready(func)`  calls a func at a certain time, `init` for before loading and `ready` for after. Both of these has the following functions:
  * `get()` get underlining HTML element.
  * `update(id, value)` inform a model that one of its field has been updated.

### Generator
This is the most complex presenter due its abilty to produce more presenters. It has three parameters: a unique `data-*` attribute, generator category, and a run function. The attribute have this pattern `/^[0-9a-z]+(\-[0-9a-z]+)*$/`. The category uses `/[0-9a-zA-Z_]+/` pattern and is optional. Each generator attribute value is an array might be starts with a category. The generators only picks the tag with the same category if the category is specified. 

The init function has the following function.
* `children(category, init)` creates a new generator of the element's children with the same tag of a different category.
* `find(category, init)` creates a new generator with the same tag and id but with a different category. Id comes from calling `data()`
* `data(defaulted)` gets the next value in generator data list.
* `generator(tag, category, data)` use a generator presenter and use it.
* `modifier(tag, data)` use a modifier presenter and use it.
* `model(tag, id, func)` create a generator with a localized model based on an object from a main model data.
* `update(id, value)` inform a model that one of its field has been updated.
* `get()` gets the underlining HTML element. In the future, this HTML tag can be deleted.

Child init and run function calls recusively with the same functions.

### Modifier
This is a simple presenter with two parameters: a unique tag name and run function. It comes with these functions
* `attr()` gets the data from either it's `data-*` attribute or from virtual attribute
* `update(id, value)` inform a model that one of its field has been updated.
* `get()` gets the underlining HTML tag. In the future, this HTML tag can be deleted.

### System
This tells the ChainerJS what to do when ChainerJS is first start and when it is finish the inital presenters creation. It comes with these functions
* `init(priority, func)`, `init(func)` tell the framework what to do before initialization. 
* `ready(priority, func)`, `ready(func)` tell the framework what to do afte initialization.
* All child functions comes with:
  * `update(id, value)` inform a model that one of its field has been updated.
  * `get()` gets the `<body>` element.

## Libraries
There are pre-built presenters and models grouped into different javascript files.

### Core Library
These presenters are in the [main file](chainer.js).

* `std-load`: a loader that uses the attribute value as a path to find the file to load.
* `std-frame`: a loader that uses the attribute value as an model id to find the file path.
* `std-write`: a modifier that uses the attribute value as model id to update the text.
* `std-read` : a modifier that uses the attribute value as model id to update the model. 

## Project goals
I have no idea when I will be around updating the script and unless I get pay to continue, I might not be able work on this project long-term.
