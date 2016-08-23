
chainer.model("gui", function(init){
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


//makes the panel collapse by clicking
chainer.generator("gui-collapse", "heading", function(run){
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
      $(child.get()).slideToggle();
    });
  })
});

//creates a css grid with lots of options
chainer.generator("gui-grid", "row", function(run){
  var cols = run.data(1);
  var mobile = run.data("") == "mobile";
  var size = 0;
  var $rest = null;
  run.children("col", function(edit){
    var span = edit.data(1);
    var $edit = $(edit.get());
    edit.recieve("gui.media", function(refer){
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
chainer.modifier("gui-class", function(run){
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
    run.recieve("gui.media", function(refer){
        if (refer(object[c])){
          $run.addClass(c);
        }else {
          $run.removeClass(c);
        }
      })
    }
  }
});

//adds a click function to a element
chainer.modifier("gui-click", function(init){
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
