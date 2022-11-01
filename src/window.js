/**
* WindowJS is a library for displaying windows inside of a webpage.
*
* @author Matthias Thalmann (https://github.com/m-thalmann/)
* @license MIT
*/
function Window(title, options){
  'use strict'

  var self = this;
  var container = null;
  var num = Window.count++;

  var living = true;

  var events = {};

  var display_state = WindowState.HIDDEN;
  var size_state = WindowState.NORMAL;

  var selected = false;

  var size = {
    width: 0,
    height: 0
  };

  var position = {
    x: 0,
    y: 0
  };

  var drag_position = {
    x: 0,
    y: 0
  }

  var resize_position = {
    x: 0,
    y: 0
  }

  var current_resize = null;

  var cursor_resize = {
    "n": "ns-resize",
    "e": "ew-resize",
    "s": "ns-resize",
    "w": "ew-resize",
    "ne": "nesw-resize",
    "se": "nwse-resize",
    "sw": "nesw-resize",
    "nw": "nwse-resize"
  };

  var mousedown_bar = false;
  var mousedown_resize = false;

  this.content = null;

  if(typeof title !== "string"){
    throw new Error("Parameter 1 must be of type string");
  }

  if(typeof options !== "undefined"){
    if(typeof options !== "object"){
      throw new Error("Parameter 2 must be of type object");
    }

    size_state = WindowUtil.getProperty(options, "state", WindowState.NORMAL);

    if(size_state != WindowState.NORMAL && size_state != WindowState.MAXIMIZED){
      throw new Error("'state' must be WindowState.NORMAL or WindowState.MAXIMIZED");
    }
  }else{
    options = {};
  }

  if(typeof options.position !== "object"){
    options.position = {};
  }
  
  this.getTitle = function(){
    if(!living){
      return;
    }

    return title;
  }

  this.setTitle = function(_title){
    if(!living){
      return;
    }

    if(typeof _title !== "string"){
      throw new Error("Parameter 1 must be of type string");
    }

    self.on("change_title")({old_title: title, new_title: _title});

    title = _title;

    if(typeof container !== null){
      container.getElementsByClassName('window_title')[0].innerHTML = title;
    }
  }

  this.getContainer = function(){
    if(!living){
      return;
    }

    if(container == null){
        console.warn("Container not yet created");
    }

    return container;
  }

  this.changeOption = function(option, value){
    if(!living){
      return;
    }

    if(typeof option === "string"){
      if(typeof value !== "undefined"){
        options[option] = value;

        if(container != null){
          switch(option){
            case 'icon':{
              container.getElementsByClassName('window_icon')[0].innerHTML = value;
              break;
            }
            case 'minimize_icon':{
              container.getElementsByClassName('window_button_minimize')[0].innerHTML = value;
              break;
            }
            case 'maximize_icon':{
              changeSizeState(size_state);
              break;
            }
            case 'normalsize_icon':{
              changeSizeState(size_state);
              break;
            }
            case 'close_icon':{
              container.getElementsByClassName('window_button_close')[0].innerHTML = value;
              break;
            }
            case 'size':{
              updateSize();
              break;
            }
            case 'position':{
              updatePosition();
              break;
            }
            case 'selected':{
              updateSelected();
              break;
            }
            case 'min_size':{
              updateSize();
              break;
            }
            case 'max_size':{
              updateSize();
              break;
            }
            case 'events':{
              updateEvents();
              break;
            }
            case 'bar_visible':{
              updateBarVisible();
              break;
            }
            case 'resizable':{
              updateResizable();
              break;
            }
            case 'movable':{
              updateMovable();
              break;
            }
            case 'maximizable':{
              updateMaximizable();
              break;
            }
            case 'minimizable':{
              updateMinimizable();
              break;
            }
            case 'always_on_top':{
              updateAlwaysOnTop();
              break;
            }
            default:{
              this.reload();
            }
          }
        }
      }else{
        throw new Error("Parameter 2 must be set");
      }
    }else{
      throw new Error("Parameter 1 must be of type string");
    }
  }

  this.getOptions = function(){
    if(!living){
      return;
    }

    return options;
  }

  this.reload = function(){
    living = true;

    if(WindowUtil.getProperty(options, "container", null) !== container){
      if(container != null){
        container.remove();
        container = null;
      }
    }

    if(container == null){
      var outer = WindowUtil.getProperty(options, "container", document.body);

      container = document.createElement("div");
      container.className = "window";
      container.id = "window_" + num;
      container.window = self;

      outer.appendChild(container);
    }

    updateSize();
    updatePosition();
    updateSelected();
    updateEvents();
    updateBarVisible();
    updateResizable();
    updateMovable();
    updateMaximizable();
    updateMinimizable();
    updateAlwaysOnTop();

    display_state = WindowUtil.getProperty(options, "window_state", WindowState.SHOWN);
    changeDisplayState(display_state);

    container.innerHTML = "";

    var bar = document.createElement("div");
    bar.className = "window_bar";

    var icon = document.createElement("span");
    icon.className = "window_icon";
    icon.innerHTML = WindowUtil.getProperty(options, "icon", "");

    var title_bar = document.createElement("span");
    title_bar.className = "window_title";
    title_bar.innerHTML = title;

    var toggle_win = document.createElement("div");
    toggle_win.className = "window_toggle_buttons";

    var toggle_min = document.createElement("span");
    toggle_min.className = "window_button_minimize";
    toggle_min.innerHTML = WindowUtil.getProperty(options, "minimize_icon", "_");

    var toggle_max = document.createElement("span");
    toggle_max.className = "window_button_toggle_maximize";

    var toggle_close = document.createElement("span");
    toggle_close.className = "window_button_close";
    toggle_close.innerHTML = WindowUtil.getProperty(options, "close_icon", "&#9587;");

    toggle_win.appendChild(toggle_min);
    toggle_win.appendChild(toggle_max);
    toggle_win.appendChild(toggle_close);

    bar.appendChild(icon);
    bar.appendChild(title_bar);
    bar.appendChild(toggle_win);

    container.appendChild(bar);

    var resize_handles = new Array();
    var resize_pos = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

    for(var i = 0; i < 8; i++){
      var handle = document.createElement("div");
      handle.className = "window_resize_handle window_resize_handle_" + resize_pos[i];
      handle.setAttribute("data-resize", resize_pos[i]);
      handle.addEventListener("mousedown", resize_mouseDown);

      handle.style.cursor = cursor_resize[resize_pos[i]];

      resize_handles.push(handle);
      container.appendChild(handle);
    }

    changeSizeState(size_state);

    if(this.content == null){
      this.content = document.createElement("div");
      this.content.className = "window_content";
    }

    container.appendChild(this.content);

    var clicks_bar = 0;

    bar.addEventListener("mousedown", function(e){
      if(e.button != 0){
        return;
      }

      mousedown_bar = true;

      if(WindowUtil.getProperty(options, "movable", true)){
        var target = e.target;

        while(target != bar){
          if(target != toggle_min && target != toggle_max && target != toggle_close){
            target = target.parentElement;
          }else{
            return;
          }
        }

        e.preventDefault();

        drag_position.x = e.clientX;
        drag_position.y = e.clientY;

        container.classList.add("window_moving");
        document.addEventListener("mousemove", move_mouseDrag);
        document.addEventListener("mouseup", move_mouseUp);
      }

      clicks_bar++;

      if (clicks_bar == 1) {
        setTimeout(function(){
          if(clicks_bar == 1) {
            self.on("move_start")(e);
          } else {
            self.toggleMaximize();
          }
          clicks_bar = 0;
        }, Window.DOUBLE_CLICK_DELAY);
      }
    });

    bar.addEventListener("mouseup", function(e){
      if(e.button != 0){
        return;
      }

      mousedown_bar = false;
    });

    toggle_min.addEventListener("click", function(e){
      e.preventDefault();
      self.minimize();
    });

    toggle_max.addEventListener("click", function(e){
      e.preventDefault();
      self.toggleMaximize();
    });

    toggle_close.addEventListener("click", function(e){
      e.preventDefault();
      self.close();
    });

    updateEvents();

    self.on("reload")();
  }

  function resize_mouseDown(e){
    if(!WindowUtil.getProperty(options, "resizable", true)){
      return;
    }

    mousedown_resize = true;
    container.classList.add("window_resizing");

    current_resize = e.target.getAttribute("data-resize");
    document.body.style.cursor = cursor_resize[current_resize];

    resize_position.x = e.clientX;
    resize_position.y = e.clientY;

    container.classList.add("window_no_animation");

    document.addEventListener("mouseup", resize_mouseUp);
    document.addEventListener("mousemove", resize_mouseDrag);

    document.body.classList.add("text_not_selectable");

    self.on("resize_start")(e);
  }

  function resize_mouseUp(e){
    if(e){
      e.preventDefault();
    }

    if(options.position.y <= 0){
      self.maximize();
    }

    document.body.style.cursor = "";
    container.classList.remove("window_no_animation");
    container.classList.remove("window_resizing");

    mousedown_resize = false;
    document.removeEventListener("mouseup", resize_mouseUp);
    document.removeEventListener("mousemove", resize_mouseDrag);
    document.body.classList.remove("text_not_selectable");

    self.on("resize_stop")(e);
  }

  function resize_mouseDrag(e){
    e.preventDefault();

    if(mousedown_resize == false){
      resize_mouseUp();
      return;
    }

    var delta_x = 0;
    var delta_y = 0;

    var min_size = WindowUtil.getProperty(options, "min_size", { width: 200, height: 150 });
    var max_size = WindowUtil.getProperty(options, "max_size", "");

    if(current_resize == "nw" || current_resize == "n" || current_resize == "ne"){
      if(size.height > min_size.height || e.clientY < options.position.y){
        delta_y = -(resize_position.y - e.clientY);

        if(min_size.height <= size.height - delta_y && (max_size == "" || max_size.height >= size.height - delta_y)){
          options.position.y += delta_y;
        }
      }
    }

    if(current_resize == "ne" || current_resize == "e" || current_resize == "se"){
      if(size.width > min_size.width || e.clientX > options.position.x + size.width){
        delta_x = resize_position.x - e.clientX;
      }
    }

    if(current_resize == "sw" || current_resize == "s" || current_resize == "se"){
      if(size.height > min_size.height || e.clientY > options.position.y + size.height){
        delta_y = resize_position.y - e.clientY;
      }
    }

    if(current_resize == "nw" || current_resize == "w" || current_resize == "sw"){
      if(size.width > min_size.width || e.clientX < options.position.x){
        delta_x = -(resize_position.x - e.clientX);

        if(min_size.width <= size.width - delta_x && (max_size == "" || max_size.width >= size.width - delta_x)){
          options.position.x += delta_x;
        }
      }
    }

    if(current_resize == "nw" || current_resize == "n" || current_resize == "ne" || current_resize == "w" || current_resize == "sw"){
      updatePosition();
    }

    resize_position.x = e.clientX;
    resize_position.y = e.clientY;

    self.changeOption("size", {
      width: (size.width - delta_x),
      height: (size.height - delta_y)
    });

    updateSize();

    self.on("resize")(e);
  }

  function move_mouseDrag(e){
    if(mousedown_resize){
      return;
    }

    if(!self.isNormalSized()){
      container.classList.add('window_no_animation');

      self.normalSize();

      var _bar = container.getElementsByClassName('window_bar')[0];

      self.changeOption("position", {
        x: e.clientX - (_bar.offsetWidth / 2),
        y: e.clientY - (_bar.offsetHeight / 2)
      });

      container.classList.remove('window_no_animation');
    }

    e.preventDefault();

    if(mousedown_bar == false){
      move_mouseUp();
      return;
    }

    var delta_x = drag_position.x - e.clientX;
    var delta_y = drag_position.y - e.clientY;

    drag_position.x = e.clientX;
    drag_position.y = e.clientY;

    self.changeOption("position", {
      x: (container.offsetLeft - delta_x),
      y: (container.offsetTop - delta_y)
    });

    updatePosition();

    self.on("move")(e);
  }

  function move_mouseUp(e){
    //Stop drag
    if(e){
      e.preventDefault();
    }

    container.classList.remove("window_moving");

    if(options.position.y <= 0){
      self.maximize();
    }

    document.removeEventListener("mousemove", move_mouseDrag);
    document.removeEventListener("mouseup", move_mouseUp);

    self.on("move_stop")(e);
  }

  this.changeState = function(_state){
    if(!living){
      return;
    }

    if(_state != WindowState.NORMAL && _state != WindowState.MAXIMIZED){
      throw new Error("Parameter 1 must be WindowState.NORMAL or WindowState.MAXIMIZED");
    }

    self.on("change_state")({old_state: size_state, new_state: _state});

    size_state = _state;

    changeSizeState(_state);
  }

  this.changeWindowState = function(_window_state){
    if(!living){
      return;
    }

    if(_window_state != WindowState.MINIMIZED && _window_state != WindowState.HIDDEN && _window_state != WindowState.SHOWN){
      throw new Error("Parameter 1 must be WindowState.HIDDEN or WindowState.MINIMIZED or WindowState.SHOWN");
    }

    self.on("change_window_state")({old_window_state: display_state, new_window_state: _window_state});

    display_state = _window_state;

    changeDisplayState(display_state);
  }

  function changeSizeState(_size_state){
    container.classList.remove("window_maximized");
    var toggle_max = container.getElementsByClassName('window_button_toggle_maximize')[0];

    switch(_size_state){
      case WindowState.MAXIMIZED:{
        container.classList.add("window_maximized");
        toggle_max.innerHTML = WindowUtil.getProperty(options, "normalsize_icon", "&#10697;");
        break;
      }
      case WindowState.NORMAL:{
        toggle_max.innerHTML = WindowUtil.getProperty(options, "maximize_icon", "&#9744;");
        break;
      }
      default:{
        toggle_max.innerHTML = WindowUtil.getProperty(options, "maximize_icon", "&#9744;");
        console.warn("This state is not allowed (" + _size_state + "); skipping");
      }
    }

  }

  function changeDisplayState(_display_state){
    container.classList.remove("window_hidden");
    container.classList.remove("window_minimized");

    switch(_display_state){
      case WindowState.HIDDEN:{
        container.classList.add("window_hidden");
        break;
      }
      case WindowState.MINIMIZED:{
        container.classList.add("window_minimized");
        break;
      }
      case WindowState.SHOWN:{
        break;
      }
      default:{
        console.warn("This window-state is not allowed (" + _display_state + "); skipping");
      }
    }
  }

  function updateSize(){
    if(!living){
      return;
    }

    var _size = WindowUtil.getProperty(options, "size", "");

    if(_size == ""){
      options.size = { width: 640, height: 480 };
      _size = options.size;
    }

    var old_size = {
      width: options.size.width,
      height: options.size.height
    };

    size.width = WindowUtil.getProperty(_size, "width", 200);
    size.height = WindowUtil.getProperty(_size, "height", 150);

    var _min_size = WindowUtil.getProperty(options, "min_size", { width: 200, height: 150 });
    var _max_size = WindowUtil.getProperty(options, "max_size", "");

    if(_min_size != ""){
      var _min_width = WindowUtil.getProperty(_min_size, "width", "");
      var _min_height = WindowUtil.getProperty(_min_size, "height", "");

      if(_min_width != ""){
        if(size.width < _min_width){
          size.width = _min_width;
          options.size.width = size.width;
        }
      }

      if(_min_height != ""){
        if(size.height < _min_height){
          size.height = _min_height;
          options.size.height = size.height;
        }
      }
    }

    if(_max_size != ""){
      var _max_width = WindowUtil.getProperty(_max_size, "width", "");
      var _max_height = WindowUtil.getProperty(_max_size, "height", "");

      if(_max_width != ""){
        if(size.width > _max_width){
          size.width = _max_width;
          options.size.width = size.width;
        }
      }

      if(_max_height != ""){
        if(size.height > _max_height){
          size.height = _max_height;
          options.size.height = size.height;
        }
      }
    }

    var parent = container.parentElement;

    if(size.height > parent.offsetHeight){
      size.height = parent.offsetHeight;
      options.size.height = size.height;
      options.position.y = 0;
    }

    if(size.width > parent.offsetWidth){
      size.width = parent.offsetWidth;
      options.size.width = size.width;
      options.position.x = 0;
    }

    container.style.width = size.width + "px";
    container.style.height = size.height + "px";

    updatePosition();

    self.on("update_size")({old_size: old_size, new_size: size});
  }

  function updateSelected(){
    if(!living){
      return;
    }

    self.on("update_selected")();

    var _selected = WindowUtil.getProperty(options, "selected", false);

    if(_selected){
      container.classList.add("window_selected");
      self.on("select")();
    }else{
      container.classList.remove("window_selected");
      self.on("deselect")();
    }
  }

  this.minimize = function(){
    if(!living || !WindowUtil.getProperty(options, "minimizable", true) || self.on("minimizing") === false){
      return;
    }

    this.changeWindowState(WindowState.MINIMIZED);

    self.on("minimize")();
  }

  this.normalSize = function(){
    if(!living){
      return;
    }

    this.changeState(WindowState.NORMAL);

    self.on("normalSize")();
  }

  this.maximize = function(){
    if(!living || !WindowUtil.getProperty(options, "maximizable", true) || self.on("maximizing") === false){
      return;
    }

    this.changeState(WindowState.MAXIMIZED);
    updateSize();

    self.on("maximize")();
  }

  this.toggleMaximize = function(){
    if(!living){
      return;
    }

    if(size_state == WindowState.NORMAL){
      self.maximize();
    }else{
      self.normalSize();
    }
  }

  this.hide = function(){
    if(!living){
      return;
    }

    this.changeWindowState(WindowState.HIDDEN);

    self.on("hide")();
  }

  this.show = function(){
    if(!living){
      return;
    }

    this.changeWindowState(WindowState.SHOWN);

    self.on("show")();
  }

  function updatePosition(){
    if(!living){
      return;
    }

    var parent = container.parentElement;

    if(typeof options.position.x !== "number"){
      options.position.x = (parent.offsetWidth / 2 - container.offsetWidth / 2);
    }
    if(typeof options.position.y !== "number"){
      options.position.y = (parent.offsetHeight / 2 - container.offsetHeight / 2);
    }

    var _position = options.position;

    var old_position = {
      x: options.position.x,
      y: options.position.y
    }

    position.x = WindowUtil.getProperty(_position, "x", 0);
    position.y = WindowUtil.getProperty(_position, "y", 0);

    if(position.x < 0){
      position.x = 0;
    }

    if(position.y < 0){
      position.y = 0;
    }

    if(position.x > parent.offsetWidth - container.offsetWidth){
      position.x = parent.offsetWidth - container.offsetWidth;
      options.position.x = position.x;
    }

    if(position.y > parent.offsetHeight - container.offsetHeight){
      position.y = parent.offsetHeight - container.offsetHeight;
      options.position.y = position.y;
    }

    container.style.left = position.x + "px";
    container.style.top = position.y + "px";

    self.on("update_position")({old_position: old_position, new_position: position});
  }

  function updateEvents(){
    var ev = WindowUtil.getProperty(options, "events", {});

    var keys = Object.keys(ev);

    for(var i = 0; i < keys.length; i++){
      events[keys[i]] = ev[keys[i]];
    }
  }

  this.on = function(ev, callback){
    if(!living){
      return;
    }

    if(typeof callback === "undefined"){
      if(typeof events[ev] === "function"){
        return events[ev];
      }else{
        return function(){};
      }
    }

    events[ev] = callback;
  }

  this.removeOn = function(ev){
    if(!living){
      return;
    }

    delete events[ev];
  }

  function updateBarVisible(){
    if(!living){
      return;
    }

    if(WindowUtil.getProperty(options, "bar_visible", true)){
      container.classList.remove("window_bar_hidden");
    }else{
      container.classList.add("window_bar_hidden");
    }
  }

  function updateResizable(){
    if(WindowUtil.getProperty(options, "resizable", true)){
      container.classList.remove("window_not_resizable");
    }else{
      container.classList.add("window_not_resizable");
    }
  }

  function updateMovable(){
    if(WindowUtil.getProperty(options, "movable", true)){
      container.classList.remove("window_not_movable");
    }else{
      container.classList.add("window_not_movable");
    }
  }

  function updateMaximizable(){
    if(WindowUtil.getProperty(options, "maximizable", true)){
      container.classList.remove("window_not_maximizable");
    }else{
      container.classList.add("window_not_maximizable");
    }
  }

  function updateMinimizable(){
    if(WindowUtil.getProperty(options, "minimizable", true)){
      container.classList.remove("window_not_minimizable");
    }else{
      container.classList.add("window_not_minimizable");
    }
  }

  function updateAlwaysOnTop(){
    if(WindowUtil.getProperty(options, "always_on_top", false)){
      container.classList.add("window_alway_on_top");
    }else{
      container.classList.remove("window_alway_on_top");
    }
  }

  this.getState = function(){
    if(!living){
      return;
    }

    return size_state;
  }

  this.getWindowState = function(){
    if(!living){
      return;
    }

    return display_state;
  }

  this.getSize = function(){
    if(!living){
      return;
    }

    return size;
  }

  this.getPosition = function(){
    if(!living){
      return;
    }

    return position;
  }

  this.isMinimized = function(){
    if(!living){
      return;
    }

    return display_state == WindowState.MINIMIZED;
  }

  this.isHidden = function(){
    if(!living){
      return;
    }

    return display_state == WindowState.HIDDEN;
  }

  this.isShown = function(){
    if(!living){
      return;
    }

    return display_state == WindowState.SHOWN;
  }

  this.isVisible = function(){
    if(!living){
      return;
    }

    return !(this.isMinimized() || this.isHidden());
  }

  this.isMaximized = function(){
    if(!living){
      return;
    }

    return size_state == WindowState.MAXIMIZED;
  }

  this.isNormalSized = function(){
    if(!living){
      return;
    }

    return size_state == WindowState.NORMAL;
  }

  this.isSelected = function(){
    if(!living){
      return;
    }

    return WindowUtil.getProperty(options, "selected", false);
  }

  this.reset = function(){
    if(!living){
      return;
    }

    this.show();
    this.normalSize();

    self.on("reset")();
  }

  this.close = this.minimize
  // function(){
  //   var close_option = WindowUtil.getProperty(options, "close_action", Window.DISPOSE_ON_CLOSE);
  //   if(!living || close_option == Window.DO_NOTHING_ON_CLOSE){
  //     return;
  //   }

  //   if(self.on("closing")() !== false){
  //     this.hide();

  //     self.on("closed")();

  //     if(close_option == Window.DISPOSE_ON_CLOSE){
  //       this.dispose();
  //     }
  //   }
  // }

  this.dispose = function(){
    if(self.on("disposing")() !== false){
      this.content.remove(); this.content = null;
      container.remove();    container = null;

      self.on("disposed")();

      living = false;
    }
  }

  this.reload();

  self.on("init")();
}

Window.count = 0;

Window.DISPOSE_ON_CLOSE = 0;
Window.HIDE_ON_CLOSE = 1;
Window.DO_NOTHING_ON_CLOSE = 2;

Window.DOUBLE_CLICK_DELAY = 300; //ms

const WindowState = {
  NORMAL: 0,
  MAXIMIZED: 1,

  MINIMIZED: 2,
  SHOWN: 3,
  HIDDEN: 4
}

const WindowUtil = {
  getProperty: function(options, opt, def){
		if(typeof options[opt] !== "undefined"){
			return options[opt];
		}else{
			return def;
		}
	}
}
