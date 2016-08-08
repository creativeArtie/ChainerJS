'use strict'
//ChainerJS is framework library like AngularJS. 
//TODO generally lack of error checking and might not be thrown correctly
var chainer = function (){
  //PART 1: Models==============================================================
  var models = {};// A group main models 
  
  //Builds and run the a model
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
        
        //Rebuild the part of the page
        for (var v in models[ns].write[field].loaders){
          var loader = models[ns].write[field].loaders[v];
          loader.$cur.empty();
          buildRunLoader(loader, []);
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
        //Loader = list of loaders the page if it set and field value is changed.
        models[ns].write[field] = {value: value, refers: [], loaders: []};
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
    api['use'] = function(id){
      var setup = parseID(id, "share");
      return models[setup.ns].share[setup.field].value;
    };
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
        if (!models[ns][type].hasOwnProperty(field)){
          throwError("Field not found: " + id);
        }
      } else {
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
  function initLoaders($cur){
    //Step 1: setup
    var deferreds = []; //for loading files
    for (var tag in rawViews){
      tagSetup(tag); //Add data- to all view if missing
      if(rawViews[tag].type == 1){
        $("[data-" + tag + "]", $cur).each(function(){
          buildRunLoader({$cur: $(this), init: rawViews[tag].init, tag: tag},
          deferreds);
        });
      }
    }
    return deferreds;
  }
  
  function buildRunLoader(loader, deferreds){
    //$cur, init, tag
    //Step 2: set up and runs system.init
    
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
      var pair = parseID(loader.$cur.data(loader.tag), "write");
      var ns = pair.ns;
      var field = pair.field;
      if(models.hasOwnProperty(ns) && 
        models[ns].write.hasOwnProperty(field)
      ){
        var model = models[ns].write[field];
        model.loaders.push(loader);
        path = checkPath(model.value);
        return this;
      }
      throwError("Field not found: " + ns + "." + field);
    };
    //Parse the attribute value as a URL path
    api['pathFromHTML'] = function(){
      path = checkPath(loader.$cur.data(loader.tag));
    };
    //The path is set up the view itself
    api['pathFromScript'] = function(value){
      path = checkPath(value);
    };
    var context = new loader.init(api);
    
    //Step 3: setup and runs system.init.prep
    var api = elementBasicAPI(loader.$cur, commonBasicAPI({}));
    if (prep != null){
      prep.call(context, api);
    }
    
    //Step 4: call $(this).load() if not null.
    if (path != null){
      //Step 4.1: setup the loading
      if (path == ""){
        throwError("Path is empty.");
      }
      var deferred = $.Deferred();
      loader.$cur.load(path, function(){
        //Step 4.2: recusive call when page is load
        $.when.apply(null, initLoaders(loader.$cur)).then(function (){
          if (post != null){
            //TODO use a child context for post
            post.call(context, api);
          }
          deferred.resolve();
        });
      });
      
      deferreds.push(deferred);
    }
  }
  
  //PART 2.3 Generator related functions =======================================
  var generators = [];
  //Create a data array and return the category and data
  function buildData(data){
    if (! $.isArray(data)){
      data = JSON.parse("[" + data + "]");
    }
    if (data.length < 1){
      throwError("Not enough data: " + data);
    }
    var category = data.shift();
    
    return {category: category, data: data};
    
  }
  
  //Builds the generator Calls by child init generators, virtual create or by
  //the main functions
  function runGenerator(generator){
    //context, run, $cur, tag, data, model
    var api = {};
    api['children'] = function(category, run){
      $(">[data-" + generator.tag + "]", generator.$cur).each(function(){
        var data = buildData($(this).data(generator.tag));
        if (data.category == category){
          var child = {context: generator.context, run, $cur: $(this), 
            tag: generator.tag, data: data.data};
          runGenerator(child);
        }
      });
    }
    var target = generator.target? generator.target: null;
    api['find'] = function(category, run){
      if (! target){
        if (generator.data.length > 0){
          target = generator.data.shift();
        } else {
          throwError("target not found");
        }
      }
      $("[data-" + generator.tag + "]").each(function(){
        var data = buildData($(this).data(generator.tag));
        if (data.category == category){
          data.target = data.data.length > 0? data.data.shift(): null;
          if (data.target && data.target == target){
            var child = {context: generator.context, run, $cur: $(this), 
              tag: generator.tag, data: data.data, target: data.target};
            runGenerator(child);
          }
        }
      })
    }
    api['data'] = function(defaulted){
      if (generator.data.length > 0){
        return generator.data.shift();
      }
      return defaulted;
    }
    api['append'] = function(tag, run){
      var $child = $("<" + tag + ">");
      generator.$cur.append($child);
      var child = {context: generator.context, run: run, $cur: $child, 
        tag: generator.tag,data: [], model: generator.model};
      runGenerator(child);
    }
    api['modifier'] = function(tag, attrVal){
      generator.$cur.attr("data-" + tag, attrVal);
      if (rawViews.hasOwnProperty(tag)){
        var view = rawViews[tag];
        if (view.type == 3){
          var modifier = {context: generator.context, run: view.run, 
            $cur: generator.$cur, data:attrVal, model: generator.model};
          return runModifier(modifier);
        }
      }
    }
    api['generator'] = function(tag, category, data){
      var use = data.slice();
      data.unshift(category);
      generator.$cur.attr("data-" + tag, JSON.stringify(data));
      if (rawViews.hasOwnProperty(tag)){
        var view = rawViews[tag];
        if (view.type == 2 && view.category == category){
          var gen = {context: generator.context, run: view.run, 
            $cur: generator.$cur, tag: tag, data: use, 
            model: generator.model}
          runGenerator(gen);
        }
      }
    }
    api['model'] = function(tag, id, func){
      var local = {};
      id = parseID(id, "write");
      function run(value){
        for(var v in value){
          if (! local.hasOwnProperty(v)){
            var $child = $("<" + tag + ">");
            local[v] = {$child: $child};
            generator.$cur.append($child);
          } else {
            var $child = local[v].$child;
          }
          $child.empty();
          var gen = {context: generator.context, run: func, $cur: $child,
            tag: generator.tag, data: [], model: value[v]};
          runGenerator(gen);
        }
        for(var v in local){
          if (! value.hasOwnProperty(v)){
            local[v].$child.remove();
            delete local[v];
          }
        }
      }
      models[id.ns].write[id.field].refers.push({
        $cur: generator.$cur, context: generator.context, func: run
      });
    }
    viewBasicAPI(generator.$cur, generator.context, api, generator.model);
    elementBasicAPI(generator.$cur, api);
    generator.run.call(generator.context, api);
  }
  
  var modifiers = [];
  function runModifier(modifier){
    //context:{}, run: rawViews[tag].run, $cur: $(this), data: ??, model: {}
    
    //Edits the element
    var api = {};
    //Get the attribute from virtual or actual dom.
    api['attr'] = function(){
      return modifier.data;
    };
    //other api
    viewBasicAPI(modifier.$cur, modifier.context, api, modifier.model);
    elementBasicAPI(modifier.$cur, api)
    modifier.run.call(modifier.context, api);
    return this;
  }
  
  //PART 2.4 Common API functions ==============================================
  //edits the element
  function elementBasicAPI($cur, api){
    api['get'] = function(){
      return ($cur.get());
    }
    return api;
  }
  
  //have a view to update a model read field
  function commonBasicAPI(api){
    api['update'] = function(id, value){
      var setup = parseID(id, "read");
      var target = models[setup.ns].read[setup.field].refer;
      target.func.call(target.context, value);
    };
    return api;
  }
  
  //have a view listen to a model write field only system has no access to this
  function viewBasicAPI($cur, context, api, virtual){
    if (virtual){
      //the requesting view is base on virtual dom
      api['recieve'] = function(id, updater){
        if (virtual.hasOwnProperty(id)){
          updater.call(context, virtual[id]);
        } else {
          updater.call(context, undefined);
        }
      }
      api['update'] = function(id, value){
        var setup = parseID(id, "read");
        var target = models[setup.ns].read[setup.field].refer;
        target.func.call(target.context, value);
      };
      api['use'] = function(id){
        return virtual[id];
      }
      api['hasID'] = function(id){
        return virtual.hasOwnProperty(id);
      }
    } else {
      //the requesting view is base on dom or serve
      api['recieve'] = function(id, updater){
        var setup = parseID(id, "write");
        models[setup.ns].write[setup.field].refers.push({
          $cur: $cur, context: context, func: updater
        })
        var value = models[setup.ns].write[setup.field].value;
        updater.call(context, value);
      }
      api['use'] = function(id){
        var setup = parseID(id, "write");
        return models[setup.ns].write[id.field].value;
      }
      api['hasID'] = function(id){
        var setup = parseID(id);
        return models.hasOwnProperty(setup.ns) && 
          models[setup.ns].write.hasOwnProperty(setup.field);
      }
      commonBasicAPI(api);
    }
  }
  
  //PART 3 Operation Functions==================================================
  
  //Method to call when all files are loaded
  $(document).ready(function(){
    
    //Calls all init functions
    for(var f in inits){
      inits[f](elementBasicAPI($("body"), commonBasicAPI({})));
    }
    
    for(var tag in rawViews){
      if (rawViews[tag].type == 1){
        tagSetup(tag);
        $("[data-" + tag + "]").empty();
        $("[" + tag + "]").empty();
      }
    }
    
    $.when(load($("html"))).then(function(){
      //Updates the ready functions
      for(var r in readys){
        readys[r](elementBasicAPI($("body"), commonBasicAPI({})));
      }
    })
  });
  
  //Actions share by model and $(document).ready()
  function load($from){
    var $deferred = $.Deferred();
    var generators = [];
    var modifiers = [];
    //Load leaders
    $.when.apply(null, initLoaders($from)).then(function(){
      //Creates views
      for(var tag in rawViews){
        if (rawViews[tag].type == 2){
          var raw = rawViews[tag];
          $("[data-" + tag + "]", $from).each(function(){
            var setup = buildData($(this).data(tag));
            if (setup.category == raw.category){
              generators.push({context: {}, run: rawViews[tag].run, $cur: 
              $(this), tag: tag, data: setup.data});
            }
          });
        } else if (rawViews[tag].type == 3){
          $("[data-" + tag + "]", $from).each(function(){
            modifiers.push({context:{}, run: rawViews[tag].run, $cur: $(this),
              data: $(this).data(tag)});
          });
        }
      }

      //Creates the html generators
      for(var g in generators){
        runGenerator(generators[g]);
      }
      
      //creates the html modifiers
      for(var m in modifiers){
        runModifier(modifiers[m]);
      }
      $deferred.resolve();
    });
    return $deferred;
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
  
  function checkNS(ns, list){
    if (! /^[0-9a-zA-Z_]+(\.[0-9a-zA-Z_]+)*$/.test(ns)){
      throwError("Namespace string pattern is wrong: " + ns);
    }
    if (list){
      if (list.hasOwnProperty(ns)){
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
      buildRunModel(checkNS(ns, models), init)
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
    'generator': function(tag, category, run){
      //Modifies an element from either base model or from generator
      rawViews[checkTag(tag, true)] = {
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
chainer.generator("std-collapse", "heading", function(run){
  var collapse = null;
  run.find("panel", function(child){
    if (collapse == null){
      collapse = run.data(false);
    }
    if (collapse){
      $(child.get()).hide();
    }
  });
  $(run.get()).click(function(){
    run.find("panel", function(child){
      $(child.get()).toggle();
    });
  })
});

//creates a css grid with lots of options
chainer.generator("std-grid", "row", function(run){
  var cols = run.data(1);
  var mobile = run.data("") == "mobile";
  var size = 0;
  var $rest = null;
  run.children("col", function(edit){
    var span = edit.data(1);
    var $edit = $(edit.get());
    edit.recieve("std.media", function(refer){
      var cal = span;
      var refer = refer();
      if (typeof span === "object"){
        cal = span.hasOwnProperty(refer)? span[refer]:1;
      }
      var width = "96%";
      if (refer != 'sm' || mobile){
        width = ((100 / cols) * cal) - 2 + "%";
    }
    $edit.css("width", width);
    });
    $edit.css("float", "left").css("min-heigth", "1px")
      .css("box-sizing", "border-box").css("margin", "0 1%");
  })
  run.append("br", function(br){
    $(br.get()).css("clear", "both");
  })
});

//creates a mobile sensitive modifier
chainer.modifier("std-class", function(run){
  var $run = $(run.get());
  var object = run.attr();
  for(var c in object){
    if (run.hasID(object[c])){
      run.recieve(object[c], function(value){
        if (value){
          $run.addClass(c);
        } else {
          $run.removeClass(c);
        }
      });
    } else {
    run.recieve("std.media", function(refer){
        if (refer(object[c])){
          $run.addClass(c);
        }else {
          $run.removeClass(c);
        }
      })
    }
  }
});

//creates a modifier that read from the model
chainer.modifier("std-write", function(init){
  init.recieve(init.attr(), function(refer){
    $(init.get()).html(refer);
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
  
  var $init = $(init.get());
  //set enabled
  if (typeof enable == "boolean"){
    $init.prop("disabled", ! enable);
  } else {
    init.recieve(enable, function(refer){
      $init.prop("disabled", ! refer);
    });
  }
  
  //set click function
  $init.click(function(){
    init.update(calls, arg);
  })
})
