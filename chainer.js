'use strict'
//ChainerJS is framework library like AngularJS. 
//TODO generally lack of error checking and might not be thrown correctly
var chainer = function (){
  //PART 1: Models==============================================================
  var models = {};// A group main models 
  
  //Builds and run the a rawModels of type = 0 (Model)
  //ns is the namespace of the model, which acts like a class in java
  //init is from the programmer using this framework
  function buildRunModel(ns, init){
    if (! models.hasOwnProperty(ns)){
      // May not be created by Refer
      // Read = data to be recieve from view
      // Write = data to be send to a view
      // Share = data to be share amoung models
      models[ns] = {read: {}, write: {}, share: {}};
    }
    
    var context = {}; //Context of the model (TODO maybe remove in the future)
    //Create a field or sends data to be read by views.
    var api = {} //interface of the model
    api['write']= function(field, value){
      if (models[ns].write.hasOwnProperty(field)){
        //This is an field that has been set
        models[ns].write[field].value = value;
        
        //Rebuild the entire page
        if (models[ns].write[field].reload){
          reload();
          return;
        }
        
        //Update the listeners
        for(var r in models[ns].write[field].refers){
          var refer = models[ns].write[field].refers[r];
          refer.func.call(refer.context, value);
        }
      } else {
        //Creates a new field
        //Value = value assoicated with the field
        //Refers = the list of views (excludes loader) that listen to it
        //Reload = reload the page if it set and field value is changed.
        models[ns].write[field] = {value: value, refers: [], reload: false};
      }
    }
    // Share data amoung the models
    api['share'] = function(field, init){
      if (models[ns].share.hasOwnProperty(field)){
        //This is a field that has been set
        models[ns].share[field].value = init;
        
        //Updates the listeners
        for(var r in models[ns].share[field].refers){
          var refer = models[ns].share[field].refers[r];
          refer.func.call(refer.context, init);
        }
      } else {
        //Creates a new field
        models[ns].share[field] = {value: init, refers: []};
      }
    };
    //Listen to a field in another model
    api['refer'] = function(r_id, updater){
      //Ckecking parameters
      var r_parsed = parseID(r_id);
      var r_ns = r_parsed.ns;
      var r_field = r_parsed.field;

      if (models.hasOwnProperty(r_ns)){
        if(models[r_ns].share.hasOwnProperty(r_field)){
          //Field is found.
          models[r_ns].share[r_field].refers.push({
            context: context, func: updater
          });
          return;
        }
      } else {
        models[r_ns] = {read: {}, write: {}, share: {}, context: null};
        //continue to add r_field...
      }
      models[r_ns].share[r_field] = {value: init, refers: [{
        context: context, func: updater}]};
    };
    //Setup a field that a view can set its value and listen to it
    api['read'] = function(field, updater){
      if (! models[ns].read.hasOwnProperty(field)){
        models[ns].read[field] = {}
      }
      models[ns].read[field].refer = {context: context, func: updater};
    };
    //Gets the shared data without the needs to listen to it.
    api['get'] = function(id, value){
      var setup = parseID(id);
      return models[setup.ns].share[setup.field].value;
    };
    //TODO create delete function to free space?
    init.call(context, api);
  }
  
  //PART 2: Views===============================================================
  //PART 2.1: View related functions============================================
  //Adds data- to views that misses them
  function tagSetup(tag){
    $("[" + tag + "]").each(function(){
      $(this).attr("data-" + tag, $(this).attr(tag))
        .removeAttr(tag);
    });
  }
  
  //Change from html's id into a namespace and field
  function parseID(id, type){
    var raw = id.split(".");
    var field = raw.pop();
    var ns = raw.join(".");
    if (type){
      if (models.hasOwnProperty(ns)){
        switch (type){
          case 1:
            if (!models[ns].write.hasOwnProperty(field)){
              throwError("Field not found: " + id);
            }
            break;
          case 2:
            if (!models[ns].read.hasOwnProperty(field)){
              throwError("Field not found: " + id);
            }
        }
      } else {
        console.log(models);
        throwError("Namespace not found: " + id);
      }
    }
    return {ns: ns, field: field};
  }

  //PART 2.2: Server============================================================
  //These are the type of views that communictes to a page on the server

  //TODO Server view is not made yet.
  
  //PART 2.2: Loaders===========================================================
  //These are views that do distructive html editing by loading files into it.
  
  //Build and run all loaders and make all view asoicate tag 
  function buildRunLoaders($cur){
    //Step 1: setup
    var deferreds = []; //for loading files
    for (var tag in rawViews){
      tagSetup(tag); //Add data- to all view if missing
      if(rawViews[tag].type == 1){
        $("[data-" + tag + "]", $cur).each(function(){
        
          //Step 2: set up and runs system.init
          var $cur = $(this);
          var prep = null;
          var path = null;
          var post = null;
          
          //Set 3: setup the api 
          var api = {};
          //What to do before loading
          api['init'] = function(func){
            checkFunction(func)
            if (prep == null){
              prep = func;
            } else {
              throwError("Prep function is already set.");
            }
            return this;
          };
          //What to do after loading 
          api['ready'] = function(func){
            checkFunction(func)
            if (post == null){
              post = func;
            } else {
              throwError("Ready function is already set.");
            }
              return this;
          };
          //Parse the attribute value as an id and listen to a model write field
          api['pathFromModel'] = function(){
            var pair = parseID($cur.data(tag), 1);
            var ns = pair.ns;
            var field = pair.field;
            if(models.hasOwnProperty(ns) && 
              models[ns].write.hasOwnProperty(field)
            ){
              var model = models[ns].write[field];
              model.reload = true;
              path = checkPath(model.value);
              return this;
            }
            throwError("Field not found: " + ns + "." + field);
          };
          //Parse the attribute value as a URL path
          api['pathFromHTML'] = function(){
            path = checkPath($cur.data(tag));
          };
          //The path is set up the view itself
          api['pathFromScript'] = function(value){
            path = checkPath(value);
          };
          var context = new rawViews[tag].init(api);
          
          //Step 3: setup and runs system.init.prep
          var api = elementBasicAPI($cur, commonBasicAPI({}));
          if (prep != null){
            //TODO use a child context for prep
            prep.call(context, api);
          }
          
          //Step 4: call $(this).load() if not null.
          if (path != null){
            //Step 4.1: setup the loading
            if (path == ""){
              throwError("Path is empty.");
            }
            var deferred = $.Deferred();
            $(this).load(path, function(){
              //Step 4.2: recusive call when page is load
              $.when.apply(null, buildRunLoaders($cur)).then(function (){
                if (post != null){
                  //TODO use a child context for post
                  post.call(context, api);
                }
                deferred.resolve();
              });
            });
            
            deferreds.push(deferred);
          }

        });
      }
    }
    return deferreds;
  }
  
  //PART 2.3 Generator related functions =======================================
  var generators = [];
  //Create a data array and return the category and data
  function buildData(data){
    //TODO check if the data dosen't needs "[]"
    var raw = $.parseJSON("[" + data + "]");
    if (raw.length < 1){
      throwError("Not enough data: " + data);
    }
    var category = raw.shift();
    
    return {category: category, data: raw};
    
  }
  
  //Builds the generator Calls by child init generators, virtual create or by
  //the main functions
  function buildGenerator(tag, init, $cur, data, context = {}, children){
    //Step 1: setup the list of things needed for api
    var rawChildren = {};
    var id = null;
    
    //Step 2: setup the api and call it
    var api = {};
    if (children){//virtual dom found!
      //Find the direct children of the virtual dom
      api['children'] = function(subCategory, subInit){
        //check parameters
        checkCategory(subCategory);
        checkFunction(subInit);
        
        //setup
        rawChildren[subCategory] = [];
        for(var c in children.children){
          var child = children.children[c];
          for(var a in child.attrs){
            var attr = child.attrs[a];
            if (attr.tag == tag && attr.category == subCategory){
              //All checking is done and pass
              rawChildren[subCategory].push(
                {$cur: child.$cur, init: subInit, data: attr.data}
              );
            }
          }
        }
      }
      //TODO create api['find']
      //TODO attempt to connect with other establish views
      
    } else {//Use actual DOM
      //Find the direct children in the html file
      api['children'] = function(subCategory, subInit){
        //check parameters
        checkCategory(subCategory);
        checkFunction(subInit);
        
        //setup
        rawChildren[subCategory] = [];
        $(">[data-" + tag + "]", $cur).each(function(){
          var setup = buildData($(this).data(tag));
          if (subCategory == setup.category){
            rawChildren[subCategory].push( 
              {$cur: $(this), init: subInit, data: setup.data});
          }
        });
      };
      //Find the view with the same id as this one
      //TODO attempts to conntent with virtual views too
      api['find'] = function(subCategory, subInit){
        //check parameters
        checkCategory(subCategory);
        checkFunction(subInit);
        
        //setup
        rawChildren[subCategory] = [];
        id = id == null? (data.length > 0? data.shift(): ""): id;
        $("[data-" + tag + "*=\"" + subCategory + "\"]").each(function(){
          //child id setup
          var setup = buildData($(this).data(tag));
          var refer = setup.data.shift();
          
          if (subCategory == setup.category && id == refer){
            rawChildren[subCategory].push( 
              {$cur: $(this), init: subInit, data: setup.data});
          }
        });
      };
    }
    //Return the next value in the array or the defaulted if not found.
    api['data'] = function(defaulted){
      if (data.length > 0){
        return data.shift();
      } else {
        return defaulted;
      }
    };
    //TODO create a model but only has read/write fields
    init.call(context, api);
    
    //create the children
    var children = {};
    for(var s in rawChildren){
      children[s] = [];
      for (var c in rawChildren[s]){
        var subContext = {};
        for(var d in context){
          subContext[d] = context[d];
        }
        var raw = rawChildren[s][c];
        children[s].push(buildGenerator(tag, raw.init, raw.$cur, raw.data, 
          subContext));
        
        for(d in context){
          context[d] = subContext[d];
        }
      }
    }
    return {$cur: $cur, context: context, children: children}
  }
  
  //Runs a generator 
  function runGenerator(generator, run){
    //generator: {$cur: jQuery, context: {}, children: generator}
    //creating virtual dom.
    var newChildren = {children: [], attrs: []};
    
    var api = {};
    //edits the children in the subRun
    //API GROUP 1: edit the view children and create attributes
    api['children'] = function(subCategory, subRun){
      for(var c in generator.children[subCategory]){
        var child = generator.children[subCategory][c];
        callFunction(
          child.context, generator.context, runGenerator, [child, subRun]);
      }
      return this;
    };
    //Create a virtual view attribute
    //TODO maybe not allow this at the top level.
    api['genData'] = function(tag, category, data){
      newChildren.attrs.push({tag: tag, category: category, data: data});
    }
    //API GROUP 2: edit the children in the HTML using basic tags
    //clear out the child elements
    api['empty'] = function(){
      generator.$cur.empty();
      newChildren = {children: [], attrs: []};
      return this;
    }
    //add after the last element
    api['append'] = function(tag, func){
      var $create = $("<" + tag + ">");
      var api = {};
      generator.$cur.append($create);
      if (func){
        var child = {$cur: $create, context: generator.context, 
          children: generator.children}
        newChildren.children.push(runGenerator(child, func));
      }
      return elementBasicAPI($create, api);
    };
    //TODO more HTML DOM editing
    //API GROUP 3: edit the children in the HTML using views 
    api['modifier'] = function(tag, attrVal){
      if (rawViews.hasOwnProperty(tag)){
        var view = rawViews[tag];
        if (view.type == 3){
          var modifier = {context: generator.context, run: view.run, 
            $cur: generator.$cur, data: attrVal};
          return runModifier(modifier, false);
        }
      }
    }
    api['generator'] = function(tag, category, data){
      if (rawViews.hasOwnProperty(tag)){
        var view = rawViews[tag];
        if (view.type == 2){
          var gen = buildGenerator(tag, view.init, generator.$cur, data,
            generator.context, newChildren);
          var run = view.run;
          runGenerator(gen, run);
        }
      }
    }
    //API GROUP 4: other shared api
    viewBasicAPI(generator.$cur, generator.context, api);
    elementBasicAPI(generator.$cur, api);
    run.call(generator.context, api);
    
    return {children: newChildren.children, $cur: generator.$cur, 
      attrs: newChildren.attrs}
  }
  
  var modifiers = [];
  function runModifier(modifier, isMain = true){
    //context:{}, run: rawViews[tag].run, $cur: $(this), data: ??
    
    //Edits the element
    var api = {};
    //Get the attribute from virtual or actual dom.
    api['attr'] = function(){
      return modifier.data;
    };
    //other api
    var input = isMain? modifier.$cur: modifier.data;
    viewBasicAPI(input, modifier.context, api);
    elementBasicAPI(modifier.$cur, api)
    modifier.run.call(modifier.context, api);
    return this;
  }
  
  //PART 2.4 Common API functions ==============================================
  //edits the element
  function elementBasicAPI($cur, api){
    //text editing
    api['html'] = function(value){
      $cur.html(value);
      return api;
    };
    //styles editing
    api['addClass'] = function(value){
      $cur.addClass(value);
      return api;
    };
    api['removeClass'] = function(value){
      $cur.removeClass(value);
      return api;
    };
    api['css'] = function(arg0, arg1){
      if (arg1 == null){
        $cur.css(arg0);
      } else {
        $cur.css(arg0, arg1);
      }
      return api;
    };
    //animation
    api['show'] = function(){
      $cur.show();
    }
    api['hide'] = function(){
      $cur.hide();
      return api;
    };
    api['toggle'] = function(){
      $cur.toggle();
      return api;
    };
    api['fadeIn'] = function(time){
      $cur.fadeIn(time);
    }
    api['fadeOut'] = function(time){
      $cur.fadeOut(time);
    }
    api['slideUp'] = function(time){
      $cur.slideUp(time);
    }
    api['slideDown'] = function(time){
      $cur.slideDown(time);
    }
    //events
    api['click'] = function(updater){
      $cur.click(updater);
    }
    //input options
    api['enable'] = function(){
      $cur.prop('disabled', false)
    }
    api['disable'] = function(){
      $cur.prop('disabled', true);
    }
    //TODO a lot more element editing API
    return api;
  }
  
  //have a view to update a model read field
  function commonBasicAPI(api){
    api['update'] = function(id, value){
      var setup = parseID(id, 2);
      var target = models[setup.ns].read[setup.field].refer;
      target.func.call(target.context, value);
    };
    return api;
  }
  
  //have a view listen to a model write field only system has no access to this
  function viewBasicAPI(input, context, api){
    commonBasicAPI(api);
    if (input instanceof jQuery){
      //the requesting view is base on dom or serve
      api['recieve'] = function(id, updater){
        var setup = parseID(id, 1);
        models[setup.ns].write[setup.field].refers.push({
          $cur: input, context: context, func: updater, type: 3
        })
        var value = models[setup.ns].write[setup.field].value;
        updater.call(context, value);
      }
    } else {
      //the requesting view is base on virtual dom
      api['recieve'] = function(id, updater){
        updater.call(context, input);
      }
    }
  }
  //PART 3: Common Functions ===================================================
  //Call function with a context that has a parent context
  //TODO this function *should* be call everywhere but it isn't
  function callFunction(context, subContext, func, args){
    for(var d in context){
      subContext[d] = context[d];
    }
    func.apply(subContext, args);
    for(d in context){
      if (subContext.hasOwnProperty(d)){
        context[d] = subContext[d];
      } else {
        delete context[d];
      }
    }
  }
  
  //PART 4 Operation Functions==================================================
  //Method called by model.write when it's reload is set
  function reload(){
    //Calls all init functions
    for(var f in inits){
      inits[f](elementBasicAPI($("body"), commonBasicAPI({})));
    }
    //Clear all views listeners
    for (ns in models){
      for(m in models[ns].read){
        models[ns].read[m].refers = [];
      }
      for(m in models[ns].write){
        models[ns].write[m].refers = [];
      }
    }
    //clear all views
    loaders = [];
    generators = [];
    modifiers = [];
    
    load();
  }

  //Method to call when all files are loaded
  $(document).ready(function(){
    //builds the models
    for(var r in rawModels){
      buildRunModel(r, rawModels[r]);
    }
    
    //Calls all init functions
    for(var f in inits){
      inits[f](elementBasicAPI($("body"), commonBasicAPI({})));
    }
    
    load();
  });
  
  //Actions share by reload() and $(document).ready()
  function load(){
    //Clear all loaders' children
    for(var tag in rawViews){
      if (rawViews[tag].type == 1){
        tagSetup(tag);
        $("[data-" + tag + "]").empty();
      }
    }
    
    //Load leaders
    $.when.apply(null, buildRunLoaders($("html"))).then(function(){
      //Creates views
      for(tag in rawViews){
        if (rawViews[tag].type == 2){
          var raw = rawViews[tag];
          $("[data-" + tag + "]").each(function(){
            var setup = buildData($(this).attr("data-" + tag));
            if (setup.category == raw.category){
              generators.push({gen:
                buildGenerator(tag, raw.init, $(this), setup.data),
                run: raw.run
              });
            }
          });
        } else if (rawViews[tag].type == 3){
          $("[data-" + tag + "]").each(function(){
            modifiers.push({context:{}, run: rawViews[tag].run, $cur: $(this),
              data: $(this).data(tag)});
          });
        }
      }

      //Creates the html generators
      for(var g in generators){
        runGenerator(generators[g].gen, generators[g].run);
      }
      
      //TODO maybe work the virtual generators here?
      
      //creates the html modifiers
      for(var m in modifiers){
        runModifier(modifiers[m]);
      }
      
      //Updates the ready functions
      for(var r in readys){
        readys[r](elementBasicAPI($("body"), commonBasicAPI({})));
      }
    });
  }

  //PART 5: Checking Functions==================================================
  function checkNumeric(value){
    if ($.isNumeric(value)){ 
      return value;
    }
    throwError("Not a number: " + value);
  }
  
  function checkFunction(value){
    if ($.isFunction(value)){
      return value;
    }
    throwError("Not a function: " + value);
  }
  
  function checkPath(value){
    //TODO check path
    if (typeof value === 'string'){
      return value;
    }
    throwError("Not a path: " + value);
  }
  
  function checkObject(value){
    if (typeof value == 'object'){
      return value;
    }
    throwError("Not an object: " + value);
  }

  function checkArray(value){
    if ($.isArray(value)){
      return value;
    }
    throwError("Not an array: " + value);
  }
  
  function checkNS(ns, checkUsed = false){
    if (! /^[0-9a-zA-Z]+(\.[0-9a-zA-Z]+)*$/.test(ns)){
      throwError("Namespace string pattern is wrong: " + ns);
    }
    if (checkUsed){
      if (rawModels.hasOwnProperty(ns)){
        throwError("Model with this namespace is in use: " + ns);
      }
    }
    return ns;
  }

  function checkTag(tag, checkUsed = false){
    if (! /^[0-9a-z]+(\-[0-9a-z]+)*$/.test(tag)){
      throwError("Tag string pattern is wrong: " + tag);
    }
    if (checkUsed){
      for(var u in rawViews){
        if (tag == u){
          throwError("Tag is already in use: " + tag);
        }
      }
    }
    return tag;
  }
  
  function checkCategory(value){
    if (/^[0-9a-zA-Z]+/.test(value)){
      return value;
    }  else if (! value && typeof value === 'string'){
      return value;
    }
    throwError("category string prattern is wrong: " + value);
  }
  
  function throwError(msg){
    var error = new Error(msg);
    console.error(error);
    throw error;
  }
  
  //PART 6: Setup the api for ChainerJS=========================================
  var inits = [];
  var readys = [];
  var rawModels = {};
  var rawViews = {};
  return {
    //Allows the setting of function what to do before and after loading
    'system': function(func){
      checkFunction(func);
      func({
        //What to do before loading
        'init': function(priority, func){
          if ($.isFunction(priority)){
            inits.push(priority);
            return this;
          }
          checkNumeric(priority);
          checkFunction(func);
          inits.splice(priority, 0, func);
          return this;
        },
        //What to do after loading
        'ready': function(priority, func){
          if ($.isFunction(priority)){
            readys.push(priority);
            return this;
          }
          checkNumeric(priority);
          checkFunction(func);
          readys.splice(priority, 0, func);
          return this;
        },
      })
      return this;
    },
    //Creates a model but store it for now
    //TODO is it better load as soon as the file is being load?
    'model': function(ns, init){
      //Creates a model to use in modifiers, models, and system 
      rawModels[checkNS(ns, true)] = checkFunction(init);
      return this;
    },
    //Creates a loader but store it for now
    'loader': function(tag, init){
      //Sets up the html by loading files
      rawViews[checkTag(tag, true)] = {
        init: checkFunction(init),
        type: 1
      }
      return this;
    },
    //Creates a generator but store it for now
    'generator': function(tag, category, init, run){
      //Modifies an element from either base model or from generator
      rawViews[checkTag(tag, true)] = {
        init: checkFunction(init),
        category: checkCategory(category),
        run: checkFunction(run),
        type: 2
      }
      return this;
    },
    //Creates a modifier but store it for now
    'modifier': function(tag, run){
      //Modifies an element from either base models or from generator
      rawViews[checkTag(tag, true)] = {
        run: checkFunction(run),
        type: 3
      }
      return this;
    },
  }
}();
//PART 6: std built in libary===================================================
//PART 6.1 model================================================================
chainer.model("std", function(init){
  //Data for screen size
  var options = {
  'sm': [true, false, false],  'sm-md': [true, true, false],
  'sm-lg': [true, false, true],'md': [false, true, false],
  'md-sm': [true, true, false],'md-lg': [false, true, true],
  'lg': [false, false, true],  'lg-sm': [true, false, true],
  'lg-md': [false, true, true]
  }
  function media(value){
    var type = $(window).width() < 768 
      ? 0 : ($(window).width() < 992? 1: 2);
    if(typeof value === 'undefined'){
      return type == 0 ? "sm" : (type == 1? 'md' : 'lg');
    }
    if (options.hasOwnProperty(value)){
      return options[value][type];
    }
    return value;
  }
  init.write("media", media);
  $(window).resize(function(){
    init.write("media", media);
  })
  //TODO more to come
})

//6.2 views=====================================================================
//load file directly from the attribute
chainer.loader("std-load", function(init){
  init.pathFromHTML();
});

//load file directly from the model 
chainer.loader("std-frame", function(init){
  init.pathFromModel();
});

//makes the panel collapse by clicking
chainer.generator("std-collapse", "heading", function(init){
  init.find("panel", function(child){});
  this.collapse = init.data(false);
}, function(run){
  if(this.collapse){
    run.children("panel", function(child){
      child.hide();
    });
  }
  this.run = run;
  run.click(function(){
    run.children("panel", function(child){
      child.toggle();
    });
  })
});

//creates a css grid with lots of options
chainer.generator("std-grid", "row", function(init){
  init.children("col", function(edit){
    this.span = edit.data(1);
    //TODO more data is needed here
  });
  this.cols = init.data(1);
  this.mobile = init.data("") == "mobile";
}, function(run){
  run.children("col", function(edit){
    edit.recieve("std.media", function(refer){
      var width = "96%";
      if (refer() != 'sm' || this.mobile){
        width = ((100 / this.cols) * this.span) - 2 + "%";
      }
      edit.css("width", width);
    })
    edit.css("float", "left").css("min-heigth", "1px")
      .css("box-sizing", "border-box").css("margin", "0 1%");
  })
  run.append("br").css("clear", "both");
});

//creates a mobile sensitive modifier
chainer.modifier("std-class", function(run){
  run.recieve("std.media", function(refer){
    var object = run.attr();
    for(var c in object){
      if (refer(object[c])){
        run.addClass(c);
      }else {
        run.removeClass(c);
      }
    }
  })
});

//creates a modifier that read from the model
chainer.modifier("std-write", function(init){
  init.recieve(init.attr(), function(refer){
    init.html(refer);
  });
})

//adds a click function to a element
chainer.modifier("std-click", function(init){
  //TODO checking of data is needed
  var data = init.attr();
  //Things needed for click 
  var calls = data.shift(); //which model read field to call
  var enable = data.shift(); //check if the button is enable or not
  var arg = data.length > 0? data.shift() : null; //arguments for the call
  
  //set enabled
  init.recieve(enable, function(refer){
    if (refer){
      init.enable();
    } else {
      init.disable();
    }
  });
  
  //set click function
  init.click(function(){
    init.update(calls, arg);
  })
})
