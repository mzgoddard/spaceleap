// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 1*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-1)/1] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
function jsCall() {
  var args = Array.prototype.slice.call(arguments);
  return Runtime.functionPointers[args[0]].apply(null, args.slice(1));
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++;
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] !== 'N') {
        // not namespaced
        if (func[i] === 'K') i++;
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      } else {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      }
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 67108864;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_toFloat32 = Math.toFloat32;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 3656;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
/* memory initializer */ allocate([115,104,97,100,101,114,58,32,102,97,105,108,101,100,32,99,111,109,112,105,108,97,116,105,111,110,0,0,0,0,0,0,42,42,42,83,76,76,101,97,112,101,114,86,105,101,119,95,100,111,110,101,42,42,42,0,112,114,111,103,114,97,109,32,102,97,105,108,101,100,32,99,111,109,112,105,108,97,116,105,111,110,0,0,0,0,0,0,42,42,42,83,76,76,101,97,112,101,114,95,100,111,110,101,42,42,42,0,0,0,0,0,21,137,168,255,0,0,0,0,138,85,63,255,0,0,0,0,127,105,96,255,0,0,0,0,127,105,96,64,0,0,0,0,255,211,193,255,0,0,0,0,255,211,193,64,0,0,0,0,204,126,93,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,65,81,83,116,105,99,107,0,65,81,80,97,114,116,105,99,108,101,0,0,0,0,0,0,65,81,68,100,118,116,0,0,115,104,97,100,101,114,40,105,110,102,111,41,58,32,37,115,10,0,0,0,0,0,0,0,85,110,97,98,108,101,32,116,111,32,105,110,105,116,105,97,108,105,122,101,32,83,68,76,58,32,37,115,10,0,0,0,83,76,76,101,97,112,101,114,0,0,0,0,0,0,0,0,97,45,62,117,115,101,114,100,97,116,97,32,33,61,32,98,45,62,117,115,101,114,100,97,116,97,0,0,0,0,0,0,116,111,117,99,104,58,32,37,102,32,37,102,32,37,102,32,37,102,10,0,0,0,0,0,105,110,116,101,114,102,97,99,101,32,38,38,32,105,110,116,101,114,102,97,99,101,45,62,117,112,100,97,116,101,0,0,115,101,108,102,0,0,0,0,109,111,118,101,100,58,32,37,102,32,37,102,32,37,102,32,37,102,10,0,0,0,0,0,37,100,32,65,109,98,105,101,110,116,115,46,10,0,0,0,118,97,114,121,105,110,103,32,108,111,119,112,32,118,101,99,52,32,118,95,99,111,108,111,114,59,10,118,111,105,100,32,109,97,105,110,40,41,32,123,103,108,95,70,114,97,103,67,111,108,111,114,32,61,32,118,95,99,111,108,111,114,59,125,0,0,0,0,0,0,0,0,91,91,37,102,32,37,102,32,37,102,32,37,100,32,37,100,93,93,0,0,0,0,0,0,114,101,115,105,122,101,32,37,100,32,37,100,10,0,0,0,109,105,110,32,37,100,44,32,109,97,120,32,37,100,44,32,97,118,103,32,37,100,44,32,115,116,100,100,101,118,32,37,102,10,0,0,0,0,0,0,117,110,105,102,111,114,109,32,109,97,116,52,32,109,111,100,101,108,118,105,101,119,95,112,114,111,106,101,99,116,105,111,110,59,10,97,116,116,114,105,98,117,116,101,32,118,101,99,50,32,97,95,112,111,115,105,116,105,111,110,59,10,97,116,116,114,105,98,117,116,101,32,118,101,99,52,32,97,95,99,111,108,111,114,59,10,118,97,114,121,105,110,103,32,118,101,99,52,32,118,95,99,111,108,111,114,59,10,118,111,105,100,32,109,97,105,110,40,41,32,123,10,32,32,118,95,99,111,108,111,114,32,61,32,97,95,99,111,108,111,114,59,10,32,32,103,108,95,80,111,115,105,116,105,111,110,32,61,32,109,111,100,101,108,118,105,101,119,95,112,114,111,106,101,99,116,105,111,110,32,42,32,118,101,99,52,40,97,95,112,111,115,105,116,105,111,110,44,32,48,44,32,49,41,59,10,125,10,0,0,0,0,0,0,0,0,83,76,67,97,109,101,114,97,67,111,110,116,114,111,108,108,101,114,0,0,0,0,0,0,97,95,112,111,115,105,116,105,111,110,0,0,0,0,0,0,116,111,117,99,104,101,115,58,32,37,100,10,0,0,0,0,97,119,97,107,101,32,37,100,32,0,0,0,0,0,0,0,37,100,32,37,100,32,37,100,10,0,0,0,0,0,0,0,65,81,82,101,110,100,101,114,101,114,0,0,0,0,0,0,65,81,80,97,114,116,105,99,108,101,95,100,111,101,115,73,103,110,111,114,101,40,32,116,114,105,103,103,101,114,44,32,40,65,81,80,97,114,116,105,99,108,101,32,42,41,32,65,81,76,105,115,116,95,97,116,40,32,115,101,108,102,45,62,116,114,105,103,103,101,114,115,44,32,106,32,41,41,0,0,83,76,80,97,114,116,105,99,108,101,86,105,101,119,0,0,65,81,67,97,109,101,114,97,0,0,0,0,0,0,0,0,86,73,69,87,80,79,82,84,32,100,105,109,101,110,115,105,111,110,115,32,37,100,32,37,100,32,37,100,32,37,100,46,10,0,0,0,0,0,0,0,46,46,47,46,46,47,115,114,99,47,103,97,109,101,47,115,112,97,99,101,108,101,97,112,101,114,46,99,0,0,0,0,109,111,100,101,108,118,105,101,119,95,112,114,111,106,101,99,116,105,111,110,0,0,0,0,65,81,76,111,111,112,0,0,65,81,80,97,114,116,105,99,108,101,95,100,111,101,115,73,103,110,111,114,101,40,32,116,114,105,103,103,101,114,44,32,40,65,81,80,97,114,116,105,99,108,101,32,42,41,32,65,81,76,105,115,116,95,97,116,40,32,115,101,108,102,45,62,98,111,100,105,101,115,44,32,106,32,41,41,0,0,0,0,65,81,87,111,114,108,100,0,83,76,65,115,116,101,114,111,105,100,71,114,111,117,112,86,105,101,119,0,0,0,0,0,85,110,97,98,108,101,32,116,111,32,115,101,116,32,118,105,100,101,111,32,109,111,100,101,58,32,37,115,10,0,0,0,65,81,73,110,116,0,0,0,46,46,47,46,46,47,115,114,99,47,103,97,109,101,47,117,112,100,97,116,101,114,46,99,0,0,0,0,0,0,0,0,104,111,109,101,65,115,116,101,114,111,105,100,0,0,0,0,65,81,76,105,115,116,0,0,65,81,73,110,116,101,114,102,97,99,101,80,116,114,0,0,97,95,99,111,108,111,114,0,65,81,80,97,114,116,105,99,108,101,95,100,111,101,115,73,103,110,111,114,101,40,32,40,65,81,80,97,114,116,105,99,108,101,32,42,41,32,65,81,76,105,115,116,95,97,116,40,32,115,101,108,102,45,62,116,114,105,103,103,101,114,115,44,32,106,32,41,44,32,98,111,100,121,32,41,0,0,0,0,65,81,65,114,114,97,121,0,83,76,76,101,97,112,101,114,86,105,101,119,0,0,0,0,65,81,84,111,117,99,104,0,65,81,82,101,108,101,97,115,101,80,111,111,108,0,0,0,46,46,47,46,46,47,115,114,99,47,103,97,109,101,47,108,101,97,112,101,114,46,99,0,46,46,47,46,46,47,115,114,99,47,112,112,104,121,115,47,119,111,114,108,100,46,99,0,33,105,115,110,97,110,40,112,97,114,116,105,99,108,101,45,62,112,111,115,105,116,105,111,110,46,120,41,32,38,38,32,33,105,115,110,97,110,40,112,97,114,116,105,99,108,101,45,62,112,111,115,105,116,105,111,110,46,121,41,0,0,0,0,83,76,65,115,116,101,114,111,105,100,0,0,0,0,0,0,83,76,65,109,98,105,101,110,116,80,97,114,116,105,99,108,101,0,0,0,0,0,0,0,105,110,105,116,87,97,116,101,114,84,101,115,116,0,0,0,95,83,76,85,112,100,97,116,101,95,105,116,101,114,97,116,111,114,0,0,0,0,0,0,95,83,76,76,101,97,112,101,114,95,111,110,99,111,108,108,105,115,105,111,110,0,0,0,95,65,81,87,111,114,108,100,95,105,110,116,101,103,114,97,116,101,73,116,101,114,97,116,111,114,0,0,0,0,0,0,83,76,76,101,97,112,101,114,95,105,110,105,116,0,0,0,65,81,87,111,114,108,100,95,97,100,100,80,97,114,116,105,99,108,101,0,0,0,0,0,17,0,0,0,0,0,0,0,32,8,0,0,54,0,0,0,48,8,0,0,21,0,0,0,64,7,0,0,18,0,0,0,0,0,0,0,0,0,0,0,64,7,0,0,17,0,0,0,48,8,0,0,20,0,0,0,120,9,0,0,21,0,0,0,19,0,0,0,0,0,0,0,240,8,0,0,52,0,0,0,17,0,0,0,0,0,0,0,83,76,85,112,100,97,116,101,114,0,0,0,0,0,0,0,48,8,0,0,17,0,0,0,64,7,0,0,19,0,0,0,216,3,0,0,104,255,191,0,0,0,0,0,55,0,0,0,35,0,0,0,23,0,0,0,160,5,0,0,20,24,0,0,0,0,0,0,38,0,0,0,46,0,0,0,22,0,0,0,24,1,0,0,100,0,0,0,0,0,0,0,17,0,0,0,41,0,0,0,19,0,0,0,32,3,0,0,52,0,0,0,0,0,0,0,45,0,0,0,22,0,0,0,25,0,0,0,56,6,0,0,52,0,0,0,0,0,0,0,58,0,0,0,44,0,0,0,18,0,0,0,184,4,0,0,12,0,12,0,0,0,0,0,49,0,0,0,31,0,0,0,20,0,0,0,72,6,0,0,16,0,0,0,0,0,0,0,40,0,0,0,33,0,0,0,18,0,0,0,176,4,0,0,56,0,0,0,0,0,0,0,56,0,0,0,59,0,0,0,18,0,0,0,65,81,86,105,101,119,97,98,108,101,0,0,0,0,0,0,65,81,86,105,101,119,0,0,176,5,0,0,44,0,0,0,0,0,0,0,26,0,0,0,37,0,0,0,18,0,0,0,192,0,0,0,32,0,0,0,0,0,0,0,32,0,0,0,23,0,0,0,17,0,0,0,0,0,128,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,63,120,3,0,0,20,0,0,0,0,0,0,0,60,0,0,0,24,0,0,0,18,0,0,0,184,5,0,0,28,0,0,0,0,0,0,0,47,0,0,0,25,0,0,0,18,0,0,0,200,0,0,0,128,0,0,0,0,0,0,0,21,0,0,0,48,0,0,0,18,0,0,0,65,81,78,117,109,98,101,114,0,0,0,0,0,0,0,0,88,4,0,0,28,0,0,0,0,0,0,0,29,0,0,0,57,0,0,0,18,0,0,0,40,5,0,0,24,0,0,0,0,0,0,0,27,0,0,0,19,0,0,0,18,0,0,0,48,5,0,0,20,0,0,0,0,0,0,0,53,0,0,0,36,0,0,0,18,0,0,0,240,4,0,0,16,0,0,0,0,0,0,0,39,0,0,0,20,0,0,0,24,0,0,0,216,0,0,0,244,0,0,0,0,0,0,0,28,0,0,0,42,0,0,0,18,0,0,0,65,81,67,111,110,115,116,114,97,105,110,116,0,0,0,0,232,3,0,0,48,0,0,0,0,0,0,0,50,0,0,0,37,0,0,0,18,0,0,0,152,5,0,0,24,0,0,0,0,0,0,0,30,0,0,0,51,0,0,0,18,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function _llvm_dbg_value() {
  Module['printErr']('missing function: llvm_dbg_value'); abort(-1);
  }
  var _llvm_dbg_declare=undefined;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var GL={counter:1,buffers:[],programs:[],framebuffers:[],renderbuffers:[],textures:[],uniforms:[],shaders:[],currArrayBuffer:0,currElementArrayBuffer:0,byteSizeByTypeRoot:5120,byteSizeByType:[1,1,2,2,4,4,4,2,3,4,8],uniformTable:{},stringCache:{},packAlignment:4,unpackAlignment:4,init:function () {
        Browser.moduleContextCreatedCallbacks.push(GL.initExtensions);
      },getNewId:function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },MINI_TEMP_BUFFER_SIZE:16,miniTempBuffer:null,miniTempBufferViews:[0],MAX_TEMP_BUFFER_SIZE:2097152,tempBufferIndexLookup:null,tempVertexBuffers:null,tempIndexBuffers:null,tempQuadIndexBuffer:null,generateTempBuffers:function (quads) {
        GL.tempBufferIndexLookup = new Uint8Array(GL.MAX_TEMP_BUFFER_SIZE+1);
        GL.tempVertexBuffers = [];
        GL.tempIndexBuffers = [];
        var last = -1, curr = -1;
        var size = 1;
        for (var i = 0; i <= GL.MAX_TEMP_BUFFER_SIZE; i++) {
          if (i > size) {
            size <<= 1;
          }
          if (size != last) {
            curr++;
            GL.tempVertexBuffers[curr] = Module.ctx.createBuffer();
            Module.ctx.bindBuffer(Module.ctx.ARRAY_BUFFER, GL.tempVertexBuffers[curr]);
            Module.ctx.bufferData(Module.ctx.ARRAY_BUFFER, size, Module.ctx.DYNAMIC_DRAW);
            Module.ctx.bindBuffer(Module.ctx.ARRAY_BUFFER, null);
            GL.tempIndexBuffers[curr] = Module.ctx.createBuffer();
            Module.ctx.bindBuffer(Module.ctx.ELEMENT_ARRAY_BUFFER, GL.tempIndexBuffers[curr]);
            Module.ctx.bufferData(Module.ctx.ELEMENT_ARRAY_BUFFER, size, Module.ctx.DYNAMIC_DRAW);
            Module.ctx.bindBuffer(Module.ctx.ELEMENT_ARRAY_BUFFER, null);
            last = size;
          }
          GL.tempBufferIndexLookup[i] = curr;
        }
        if (quads) {
          // GL_QUAD indexes can be precalculated
          GL.tempQuadIndexBuffer = Module.ctx.createBuffer();
          Module.ctx.bindBuffer(Module.ctx.ELEMENT_ARRAY_BUFFER, GL.tempQuadIndexBuffer);
          var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
          var quadIndexes = new Uint16Array(numIndexes);
          var i = 0, v = 0;
          while (1) {
            quadIndexes[i++] = v;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+1;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+2;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+2;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+3;
            if (i >= numIndexes) break;
            v += 4;
          }
          Module.ctx.bufferData(Module.ctx.ELEMENT_ARRAY_BUFFER, quadIndexes, Module.ctx.STATIC_DRAW);
          Module.ctx.bindBuffer(Module.ctx.ELEMENT_ARRAY_BUFFER, null);
        }
      },findToken:function (source, token) {
        function isIdentChar(ch) {
          if (ch >= 48 && ch <= 57) // 0-9
            return true;
          if (ch >= 65 && ch <= 90) // A-Z
            return true;
          if (ch >= 97 && ch <= 122) // a-z
            return true;
          return false;
        }
        var i = -1;
        do {
          i = source.indexOf(token, i + 1);
          if (i < 0) {
            break;
          }
          if (i > 0 && isIdentChar(source[i - 1])) {
            continue;
          }
          i += token.length;
          if (i < source.length - 1 && isIdentChar(source[i + 1])) {
            continue;
          }
          return true;
        } while (true);
        return false;
      },getSource:function (shader, count, string, length) {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var frag;
          if (length) {
            var len = HEAP32[(((length)+(i*4))>>2)];
            if (len < 0) {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
            } else {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)], len);
            }
          } else {
            frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
          }
          source += frag;
        }
        // Let's see if we need to enable the standard derivatives extension
        type = Module.ctx.getShaderParameter(GL.shaders[shader], 0x8B4F /* GL_SHADER_TYPE */);
        if (type == 0x8B30 /* GL_FRAGMENT_SHADER */) {
          if (GL.findToken(source, "dFdx") ||
              GL.findToken(source, "dFdy") ||
              GL.findToken(source, "fwidth")) {
            source = "#extension GL_OES_standard_derivatives : enable\n" + source;
            var extension = Module.ctx.getExtension("OES_standard_derivatives");
          }
        }
        return source;
      },computeImageSize:function (width, height, sizePerPixel, alignment) {
        function roundedToNextMultipleOf(x, y) {
          return Math.floor((x + y - 1) / y) * y
        }
        var plainRowSize = width * sizePerPixel;
        var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
        return (height <= 0) ? 0 :
                 ((height - 1) * alignedRowSize + plainRowSize);
      },getTexPixelData:function (type, format, width, height, pixels, internalFormat) {
        var sizePerPixel;
        switch (type) {
          case 0x1401 /* GL_UNSIGNED_BYTE */:
            switch (format) {
              case 0x1906 /* GL_ALPHA */:
              case 0x1909 /* GL_LUMINANCE */:
                sizePerPixel = 1;
                break;
              case 0x1907 /* GL_RGB */:
                sizePerPixel = 3;
                break;
              case 0x1908 /* GL_RGBA */:
                sizePerPixel = 4;
                break;
              case 0x190A /* GL_LUMINANCE_ALPHA */:
                sizePerPixel = 2;
                break;
              default:
                throw 'Invalid format (' + format + ')';
            }
            break;
          case 0x1403 /* GL_UNSIGNED_SHORT */:
            if (format == 0x1902 /* GL_DEPTH_COMPONENT */) {
              sizePerPixel = 2;
            } else {
              throw 'Invalid format (' + format + ')';
            }
            break;
          case 0x1405 /* GL_UNSIGNED_INT */:
            if (format == 0x1902 /* GL_DEPTH_COMPONENT */) {
              sizePerPixel = 4;
            } else {
              throw 'Invalid format (' + format + ')';
            }
            break;
          case 0x84FA /* UNSIGNED_INT_24_8_WEBGL */:
            sizePerPixel = 4;
            break;
          case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
          case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
          case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
            sizePerPixel = 2;
            break;
          case 0x1406 /* GL_FLOAT */:
            switch (format) {
              case 0x1907 /* GL_RGB */:
                sizePerPixel = 3*4;
                break;
              case 0x1908 /* GL_RGBA */:
                sizePerPixel = 4*4;
                break;
              default:
                throw 'Invalid format (' + format + ')';
            }
            internalFormat = Module.ctx.RGBA;
            break;
          default:
            throw 'Invalid type (' + type + ')';
        }
        var bytes = GL.computeImageSize(width, height, sizePerPixel, GL.unpackAlignment);
        if (type == 0x1401 /* GL_UNSIGNED_BYTE */) {
          pixels = HEAPU8.subarray((pixels),(pixels+bytes));
        } else if (type == 0x1406 /* GL_FLOAT */) {
          pixels = HEAPF32.subarray((pixels)>>2,(pixels+bytes)>>2);
        } else if (type == 0x1405 /* GL_UNSIGNED_INT */ || type == 0x84FA /* UNSIGNED_INT_24_8_WEBGL */) {
          pixels = HEAPU32.subarray((pixels)>>2,(pixels+bytes)>>2);
        } else {
          pixels = HEAPU16.subarray((pixels)>>1,(pixels+bytes)>>1);
        }
        return {
          pixels: pixels,
          internalFormat: internalFormat
        }
      },initExtensions:function () {
        if (GL.initExtensions.done) return;
        GL.initExtensions.done = true;
        if (!Module.useWebGL) return; // an app might link both gl and 2d backends
        GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
          GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i+1);
        }
        GL.maxVertexAttribs = Module.ctx.getParameter(Module.ctx.MAX_VERTEX_ATTRIBS);
        // Detect the presence of a few extensions manually, this GL interop layer itself will need to know if they exist. 
        GL.compressionExt = Module.ctx.getExtension('WEBGL_compressed_texture_s3tc') ||
                            Module.ctx.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
                            Module.ctx.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
        GL.anisotropicExt = Module.ctx.getExtension('EXT_texture_filter_anisotropic') ||
                            Module.ctx.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                            Module.ctx.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        GL.floatExt = Module.ctx.getExtension('OES_texture_float');
        // These are the 'safe' feature-enabling extensions that don't add any performance impact related to e.g. debugging, and
        // should be enabled by default so that client GLES2/GL code will not need to go through extra hoops to get its stuff working.
        // As new extensions are ratified at http://www.khronos.org/registry/webgl/extensions/ , feel free to add your new extensions
        // here, as long as they don't produce a performance impact for users that might not be using those extensions.
        // E.g. debugging-related extensions should probably be off by default.
        var automaticallyEnabledExtensions = [ "OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives",
                                               "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture",
                                               "OES_element_index_uint", "EXT_texture_filter_anisotropic", "ANGLE_instanced_arrays",
                                               "OES_texture_float_linear", "OES_texture_half_float_linear", "WEBGL_compressed_texture_atc",
                                               "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float",
                                               "EXT_frag_depth", "EXT_sRGB", "WEBGL_draw_buffers", "WEBGL_shared_resources" ];
        function shouldEnableAutomatically(extension) {
          for(var i in automaticallyEnabledExtensions) {
            var include = automaticallyEnabledExtensions[i];
            if (ext.indexOf(include) != -1) {
              return true;
            }
          }
          return false;
        }
        var extensions = Module.ctx.getSupportedExtensions();
        for(var e in extensions) {
          var ext = extensions[e].replace('MOZ_', '').replace('WEBKIT_', '');
          if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
            Module.ctx.getExtension(ext); // Calling .getExtension enables that extension permanently, no need to store the return value to be enabled.
          }
        }
      },populateUniformTable:function (program) {
        var p = GL.programs[program];
        GL.uniformTable[program] = {};
        var ptable = GL.uniformTable[program];
        // A program's uniformTable maps the string name of an uniform to an integer location of that uniform.
        // The global GL.uniforms map maps integer locations to WebGLUniformLocations.
        var numUniforms = Module.ctx.getProgramParameter(p, Module.ctx.ACTIVE_UNIFORMS);
        for (var i = 0; i < numUniforms; ++i) {
          var u = Module.ctx.getActiveUniform(p, i);
          var name = u.name;
          // Strip off any trailing array specifier we might have got, e.g. "[0]".
          if (name.indexOf(']', name.length-1) !== -1) {
            var ls = name.lastIndexOf('[');
            name = name.slice(0, ls);
          }
          // Optimize memory usage slightly: If we have an array of uniforms, e.g. 'vec3 colors[3];', then 
          // only store the string 'colors' in ptable, and 'colors[0]', 'colors[1]' and 'colors[2]' will be parsed as 'colors'+i.
          // Note that for the GL.uniforms table, we still need to fetch the all WebGLUniformLocations for all the indices.
          var loc = Module.ctx.getUniformLocation(p, name);
          var id = GL.getNewId(GL.uniforms);
          ptable[name] = [u.size, id];
          GL.uniforms[id] = loc;
          for (var j = 1; j < u.size; ++j) {
            var n = name + '['+j+']';
            loc = Module.ctx.getUniformLocation(p, n);
            id = GL.getNewId(GL.uniforms);
            GL.uniforms[id] = loc;
          }
        }
      }};function _glGenBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = GL.getNewId(GL.buffers);
        var buffer = Module.ctx.createBuffer();
        buffer.name = id;
        GL.buffers[id] = buffer;
        HEAP32[(((buffers)+(i*4))>>2)]=id;
      }
    }
  function _glDeleteBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))>>2)];
        var buffer = GL.buffers[id];
        // From spec: "glDeleteBuffers silently ignores 0's and names that do not
        // correspond to existing buffer objects."
        if (!buffer) continue;
        Module.ctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
      }
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var _cos=Math_cos;
  var _sin=Math_sin;
  function _fmax(x, y) {
      return isNaN(x) ? y : isNaN(y) ? x : Math.max(x, y);
    }
  function _fmin(x, y) {
      return isNaN(x) ? y : isNaN(y) ? x : Math.min(x, y);
    }
  var _atan2=Math_atan2;
  var _sqrtf=Math_sqrt;
  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && buffer.buffer === HEAP8.buffer && offset === 0) {
              node.contents = buffer; // this is a subarray of the heap, and we can own it
              node.contentMode = MEMFS.CONTENT_OWNING;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        var done = function(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function() { done(null); };
            req.onerror = function() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function() { done(null); };
            req.onerror = function() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        var isRealDir = function(p) {
          return p !== '.' && p !== '..';
        };
        var toAbsolute = function(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = {};
          // compatibility
          Object.defineProperties(FS.FSStream, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        stream.prototype = FS.FSStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        var done = function(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {} : ['binary'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          var handleMessage = function(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _fmod(x, y) {
      return x % y;
    }
  var _fabs=Math_abs;
  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }
  var _fabsf=Math_abs;
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  function _glClearColor(x0, x1, x2, x3) { Module.ctx.clearColor(x0, x1, x2, x3) }
  function _glEnable(x0) { Module.ctx.enable(x0) }
  function _glBlendFunc(x0, x1) { Module.ctx.blendFunc(x0, x1) }
  function _glClear(x0) { Module.ctx.clear(x0) }
  function _glUseProgram(program) {
      Module.ctx.useProgram(program ? GL.programs[program] : null);
    }
  function _glGetAttribLocation(program, name) {
      program = GL.programs[program];
      name = Pointer_stringify(name);
      return Module.ctx.getAttribLocation(program, name);
    }
  function _glEnableVertexAttribArray(index) {
      Module.ctx.enableVertexAttribArray(index);
    }
  function _glGetUniformLocation(program, name) {
      name = Pointer_stringify(name);
      var arrayOffset = 0;
      // If user passed an array accessor "[index]", parse the array index off the accessor.
      if (name.indexOf(']', name.length-1) !== -1) {
        var ls = name.lastIndexOf('[');
        var arrayIndex = name.slice(ls+1, -1);
        if (arrayIndex.length > 0) {
          arrayOffset = parseInt(arrayIndex);
          if (arrayOffset < 0) {
            return -1;
          }
        }
        name = name.slice(0, ls);
      }
      var ptable = GL.uniformTable[program];
      if (!ptable) {
        return -1;
      }
      var uniformInfo = ptable[name]; // returns pair [ dimension_of_uniform_array, uniform_location ]
      if (uniformInfo && arrayOffset < uniformInfo[0]) { // Check if user asked for an out-of-bounds element, i.e. for 'vec4 colors[3];' user could ask for 'colors[10]' which should return -1.
        return uniformInfo[1]+arrayOffset;
      } else {
        return -1;
      }
    }
  function _glUniformMatrix4fv(location, count, transpose, value) {
      location = GL.uniforms[location];
      var view;
      if (count == 1) {
        // avoid allocation for the common case of uploading one uniform matrix
        view = GL.miniTempBufferViews[15];
        for (var i = 0; i < 16; i++) {
          view[i] = HEAPF32[(((value)+(i*4))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*64)>>2);
      }
      Module.ctx.uniformMatrix4fv(location, transpose, view);
    }
  function _glBindBuffer(target, buffer) {
      var bufferObj = buffer ? GL.buffers[buffer] : null;
      if (target == Module.ctx.ARRAY_BUFFER) {
        GL.currArrayBuffer = buffer;
      } else if (target == Module.ctx.ELEMENT_ARRAY_BUFFER) {
        GL.currElementArrayBuffer = buffer;
      }
      Module.ctx.bindBuffer(target, bufferObj);
    }
  function _glBufferData(target, size, data, usage) {
      switch (usage) { // fix usages, WebGL only has *_DRAW
        case 0x88E1: // GL_STREAM_READ
        case 0x88E2: // GL_STREAM_COPY
          usage = 0x88E0; // GL_STREAM_DRAW
          break;
        case 0x88E5: // GL_STATIC_READ
        case 0x88E6: // GL_STATIC_COPY
          usage = 0x88E4; // GL_STATIC_DRAW
          break;
        case 0x88E9: // GL_DYNAMIC_READ
        case 0x88EA: // GL_DYNAMIC_COPY
          usage = 0x88E8; // GL_DYNAMIC_DRAW
          break;
      }
      Module.ctx.bufferData(target, HEAPU8.subarray(data, data+size), usage);
    }
  function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
      Module.ctx.vertexAttribPointer(index, size, type, normalized, stride, ptr);
    }
  function _glDrawArrays(mode, first, count) {
      Module.ctx.drawArrays(mode, first, count);
    }
  function _glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = Module.ctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }
  function _glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = Module.ctx.createShader(shaderType);
      return id;
    }
  function _glAttachShader(program, shader) {
      Module.ctx.attachShader(GL.programs[program],
                              GL.shaders[shader]);
    }
  function _glLinkProgram(program) {
      Module.ctx.linkProgram(GL.programs[program]);
      GL.uniformTable[program] = {}; // uniforms no longer keep the same names after linking
      GL.populateUniformTable(program);
    }
  function _glGetProgramiv(program, pname, p) {
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        HEAP32[((p)>>2)]=Module.ctx.getProgramInfoLog(GL.programs[program]).length + 1;
      } else {
        HEAP32[((p)>>2)]=Module.ctx.getProgramParameter(GL.programs[program], pname);
      }
    }
  function _glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
      Module.ctx.shaderSource(GL.shaders[shader], source);
    }
  function _glCompileShader(shader) {
      Module.ctx.compileShader(GL.shaders[shader]);
    }
  function _glGetShaderiv(shader, pname, p) {
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        HEAP32[((p)>>2)]=Module.ctx.getShaderInfoLog(GL.shaders[shader]).length + 1;
      } else {
        HEAP32[((p)>>2)]=Module.ctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }
  function _llvm_stacksave() {
      var self = _llvm_stacksave;
      if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = [];
      }
      self.LLVM_SAVEDSTACKS.push(Runtime.stackSave());
      return self.LLVM_SAVEDSTACKS.length-1;
    }
  function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = Module.ctx.getShaderInfoLog(GL.shaders[shader]);
      // Work around a bug in Chromium which causes getShaderInfoLog to return null
      if (!log) {
        log = "";
      }
      log = log.substr(0, maxLength - 1);
      writeStringToMemory(log, infoLog);
      if (length) {
        HEAP32[((length)>>2)]=log.length
      }
    }
  function _llvm_stackrestore(p) {
      var self = _llvm_stacksave;
      var ret = self.LLVM_SAVEDSTACKS[p];
      self.LLVM_SAVEDSTACKS.splice(p, 1);
      Runtime.stackRestore(ret);
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  var _floor=Math_floor;
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            ctx = canvas.getContext('experimental-webgl', contextAttributes);
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,glAttributes:{0:3,1:3,2:2,3:0,4:0,5:1,6:16,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:1,16:0,17:0,18:0},keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},keyCodes:{16:1249,17:1248,18:1250,33:1099,34:1102,37:1104,38:1106,39:1103,40:1105,46:127,96:1112,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,173:45,188:44,190:46,191:47,192:96},scanCodes:{8:42,9:43,13:40,27:41,32:44,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,59:51,61:46,91:47,92:49,93:48,96:52,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,305:224,308:226},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
        };
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var surf = _malloc(60);  // SDL_Surface has 15 fields of quantum size
        var buffer = _malloc(width*height*4); // TODO: only allocate when locked the first time
        var pixelFormat = _malloc(44);
        flags |= 1; // SDL_HWSURFACE - this tells SDL_MUSTLOCK that this needs to be locked
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var is_SDL_HWPALETTE = flags & 0x00200000;  
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        HEAP32[((surf)>>2)]=flags         // SDL_Surface.flags
        HEAP32[(((surf)+(4))>>2)]=pixelFormat // SDL_Surface.format TODO
        HEAP32[(((surf)+(8))>>2)]=width         // SDL_Surface.w
        HEAP32[(((surf)+(12))>>2)]=height        // SDL_Surface.h
        HEAP32[(((surf)+(16))>>2)]=width * bpp       // SDL_Surface.pitch, assuming RGBA or indexed for now,
                                                                                 // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer      // SDL_Surface.pixels
        HEAP32[(((surf)+(36))>>2)]=0      // SDL_Surface.offset
        HEAP32[(((surf)+(56))>>2)]=1
        HEAP32[((pixelFormat)>>2)]=0 /* XXX missing C define SDL_PIXELFORMAT_RGBA8888 */ // SDL_PIXELFORMAT_RGBA8888
        HEAP32[(((pixelFormat)+(4))>>2)]=0 // TODO
        HEAP8[(((pixelFormat)+(8))|0)]=bpp * 8
        HEAP8[(((pixelFormat)+(9))|0)]=bpp
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000
        // Decide if we want to use WebGL or not
        var useWebGL = (flags & 0x04000000) != 0; // SDL_OPENGL
        SDL.GL = SDL.GL || useWebGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
        var webGLContextAttributes = {
          antialias: ((SDL.glAttributes[13 /*SDL_GL_MULTISAMPLEBUFFERS*/] != 0) && (SDL.glAttributes[14 /*SDL_GL_MULTISAMPLESAMPLES*/] > 1)),
          depth: (SDL.glAttributes[6 /*SDL_GL_DEPTH_SIZE*/] > 0),
          stencil: (SDL.glAttributes[7 /*SDL_GL_STENCIL_SIZE*/] > 0)
        };
        var ctx = Browser.createContext(canvas, useWebGL, usePageCanvas, webGLContextAttributes);
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
        var buffer  = surfData.buffer;
        var data    = surfData.image.data;
        var colors  = surfData.colors;
        for (var y = startY; y < endY; ++y) {
          var indexBase = y * fullWidth;
          var colorBase = indexBase * 4;
          for (var x = startX; x < endX; ++x) {
            // HWPALETTE have only 256 colors (not rgba)
            var index = HEAPU8[((buffer + indexBase + x)|0)] * 3;
            var colorOffset = colorBase + x * 4;
            data[colorOffset   ] = colors[index   ];
            data[colorOffset +1] = colors[index +1];
            data[colorOffset +2] = colors[index +2];
            //unused: data[colorOffset +3] = color[index +3];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + 56;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
      },touchX:0,touchY:0,savedKeydown:null,receiveEvent:function (event) {
        switch(event.type) {
          case 'touchstart':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            var event = {
              type: 'mousedown',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 1;
            SDL.events.push(event);
            break;
          case 'touchmove':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            event = {
              type: 'mousemove',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.events.push(event);
            break;
          case 'touchend':
            event.preventDefault();
            event = {
              type: 'mouseup',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(event);
            break;
          case 'mousemove':
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup': case 'DOMMouseScroll': case 'mousewheel':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
            if (event.type == 'DOMMouseScroll' || event.type == 'mousewheel') {
              var button = (event.type == 'DOMMouseScroll' ? event.detail : -event.wheelDelta) > 0 ? 4 : 3;
              var event2 = {
                type: 'mousedown',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
              SDL.events.push(event2);
              event = {
                type: 'mouseup',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
            } else if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
              SDL.DOMButtons[event.button] = 0;
            }
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullScreen'](true, true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'blur':
          case 'visibilitychange': {
            // Un-press all pressed keys: TODO
            for (var code in SDL.keyboardMap) {
              SDL.events.push({
                type: 'keyup',
                keyCode: SDL.keyboardMap[code]
              });
            }
            event.preventDefault();
            break;
          }
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        return;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = event.keyCode;
            if (code >= 65 && code <= 90) {
              code += 32; // make lowercase for SDL
            } else {
              code = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            HEAP8[(((SDL.keyboardState)+(code))|0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))|0)] ? 0x0040 | 0x0080 : 0) | // KMOD_LCTRL & KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))|0)] ? 0x0001 | 0x0002 : 0) | // KMOD_LSHIFT & KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))|0)] ? 0x0100 | 0x0200 : 0); // KMOD_LALT & KMOD_RALT
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, 28); // XXX
          return;
        }
        SDL.handleEvent(event);
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            //Module.print('Received key event: ' + event.keyCode);
            var key = event.keyCode;
            if (key >= 65 && key <= 90) {
              key += 32; // make lowercase for SDL
            } else {
              key = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type]
            HEAP8[(((ptr)+(8))|0)]=down ? 1 : 0
            HEAP8[(((ptr)+(9))|0)]=0 // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan
            HEAP32[(((ptr)+(16))>>2)]=key
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type]
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))|0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(9))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=SDL.buttonState;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num && num != 0) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = volume / 128;
          if (info.audio) info.audio.volume = info.volume;
        }
        return ret;
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      }};function _SDL_Init(what) {
      SDL.startTime = Date.now();
      // capture all key events. we just keep down and up, but also capture press to prevent default actions
      if (!Module['doNotCaptureKeyboard']) {
        document.addEventListener("keydown", SDL.receiveEvent);
        document.addEventListener("keyup", SDL.receiveEvent);
        document.addEventListener("keypress", SDL.receiveEvent);
        window.addEventListener("blur", SDL.receiveEvent);
        document.addEventListener("visibilitychange", SDL.receiveEvent);
      }
      window.addEventListener("unload", SDL.receiveEvent);
      SDL.keyboardState = _malloc(0x10000); // Our SDL needs 512, but 64K is safe for older SDLs
      _memset(SDL.keyboardState, 0, 0x10000);
      // Initialize this structure carefully for closure
      SDL.DOMEventToSDLEvent['keydown'] = 0x300 /* SDL_KEYDOWN */;
      SDL.DOMEventToSDLEvent['keyup'] = 0x301 /* SDL_KEYUP */;
      SDL.DOMEventToSDLEvent['keypress'] = 0x303 /* SDL_TEXTINPUT */;
      SDL.DOMEventToSDLEvent['mousedown'] = 0x401 /* SDL_MOUSEBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['mouseup'] = 0x402 /* SDL_MOUSEBUTTONUP */;
      SDL.DOMEventToSDLEvent['mousemove'] = 0x400 /* SDL_MOUSEMOTION */;
      SDL.DOMEventToSDLEvent['unload'] = 0x100 /* SDL_QUIT */;
      SDL.DOMEventToSDLEvent['resize'] = 0x7001 /* SDL_VIDEORESIZE/SDL_EVENT_COMPAT2 */;
      return 0; // success
    }
  function _SDL_GetError() {
      if (!SDL.errorMessage) {
        SDL.errorMessage = allocate(intArrayFromString("unknown SDL-emscripten error"), 'i8', ALLOC_NORMAL);
      }
      return SDL.errorMessage;
    }
  function _SDL_GL_SetAttribute(attr, value) {
      if (!(attr in SDL.glAttributes)) {
        abort('Unknown SDL GL attribute (' + attr + '). Please check if your SDL version is supported.');
      }
      SDL.glAttributes[attr] = value;
    }
  function _SDL_SetVideoMode(width, height, depth, flags) {
      ['mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
      // (0,0) means 'use fullscreen' in native; in Emscripten, use the current canvas size.
      if (width == 0 && height == 0) {
        var canvas = Module['canvas'];
        width = canvas.width;
        height = canvas.height;
      }
      Browser.setCanvasSize(width, height, true);
      // Free the old surface first.
      if (SDL.screen) {
        SDL.freeSurface(SDL.screen);
        SDL.screen = null;
      }
      SDL.screen = SDL.makeSurface(width, height, flags, true, 'screen');
      if (!SDL.addedResizeListener) {
        SDL.addedResizeListener = true;
        Browser.resizeListeners.push(function(w, h) {
          SDL.receiveEvent({
            type: 'resize',
            w: w,
            h: h
          });
        });
      }
      return SDL.screen;
    }
  function _enable_resizable() {
        window.addEventListener( 'resize', function() {
          Module.setCanvasSize( document.body.clientWidth, window.innerHeight );
        }, true );
        Module.setCanvasSize( document.body.clientWidth, window.innerHeight );
      }
  function _glViewport(x0, x1, x2, x3) { Module.ctx.viewport(x0, x1, x2, x3) }
  function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop) {
      Module['noExitRuntime'] = true;
      Browser.mainLoop.runner = function() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from non-main loop sources
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
        if (Module['preMainLoop']) {
          Module['preMainLoop']();
        }
        try {
          Runtime.dynCall('v', func);
        } catch (e) {
          if (e instanceof ExitStatus) {
            return;
          } else {
            if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
            throw e;
          }
        }
        if (Module['postMainLoop']) {
          Module['postMainLoop']();
        }
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from the main loop itself
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
        Browser.mainLoop.scheduler();
      }
      if (fps && fps > 0) {
        Browser.mainLoop.scheduler = function() {
          setTimeout(Browser.mainLoop.runner, 1000/fps); // doing this each time means that on exception, we stop
        }
      } else {
        Browser.mainLoop.scheduler = function() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        }
      }
      Browser.mainLoop.scheduler();
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }
  function _SDL_GetTicks() {
      return Math.floor(Date.now() - SDL.startTime);
    }
  function _SDL_PollEvent(ptr) {
      if (SDL.events.length === 0) return 0;
      if (ptr) {
        SDL.makeCEvent(SDL.events.shift(), ptr);
      }
      return 1;
    }
  function _SDL_Quit() {
      for (var i = 0; i < SDL.numChannels; ++i) {
        if (SDL.channels[i].audio) {
          SDL.channels[i].audio.pause();
        }
      }
      if (SDL.music.audio) {
        SDL.music.audio.pause();
      }
      Module.print('SDL_Quit called (and ignored)');
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module.print('exit(' + status + ') called');
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  var _llvm_memset_p0i8_i64=_memset;
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
GL.init()
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_fi(index,a1) {
  try {
    return Module["dynCall_fi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vif(index,a1,a2) {
  try {
    Module["dynCall_vif"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_i(index) {
  try {
    return Module["dynCall_i"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_fff(index,a1,a2) {
  try {
    return Module["dynCall_fff"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'use asm';
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var NaN=+env.NaN;
  var Infinity=+env.Infinity;
  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var abort=env.abort;
  var assert=env.assert;
  var asmPrintInt=env.asmPrintInt;
  var asmPrintFloat=env.asmPrintFloat;
  var Math_min=env.min;
  var jsCall=env.jsCall;
  var invoke_fi=env.invoke_fi;
  var invoke_vif=env.invoke_vif;
  var invoke_i=env.invoke_i;
  var invoke_vi=env.invoke_vi;
  var invoke_vii=env.invoke_vii;
  var invoke_ii=env.invoke_ii;
  var invoke_viii=env.invoke_viii;
  var invoke_v=env.invoke_v;
  var invoke_fff=env.invoke_fff;
  var invoke_iii=env.invoke_iii;
  var _llvm_lifetime_end=env._llvm_lifetime_end;
  var _rand=env._rand;
  var _glUseProgram=env._glUseProgram;
  var _fabsf=env._fabsf;
  var ___assert_fail=env.___assert_fail;
  var _llvm_dbg_value=env._llvm_dbg_value;
  var _glGetProgramiv=env._glGetProgramiv;
  var _glVertexAttribPointer=env._glVertexAttribPointer;
  var _glGetShaderInfoLog=env._glGetShaderInfoLog;
  var _abort=env._abort;
  var _fprintf=env._fprintf;
  var _glLinkProgram=env._glLinkProgram;
  var _printf=env._printf;
  var _glGetUniformLocation=env._glGetUniformLocation;
  var _fflush=env._fflush;
  var _sqrtf=env._sqrtf;
  var _glClearColor=env._glClearColor;
  var _fputc=env._fputc;
  var _glEnable=env._glEnable;
  var _llvm_stackrestore=env._llvm_stackrestore;
  var _fabs=env._fabs;
  var _llvm_lifetime_start=env._llvm_lifetime_start;
  var ___setErrNo=env.___setErrNo;
  var _fwrite=env._fwrite;
  var _SDL_SetVideoMode=env._SDL_SetVideoMode;
  var _glClear=env._glClear;
  var _send=env._send;
  var _glDrawArrays=env._glDrawArrays;
  var _write=env._write;
  var _fputs=env._fputs;
  var _glGenBuffers=env._glGenBuffers;
  var _SDL_PollEvent=env._SDL_PollEvent;
  var _glEnableVertexAttribArray=env._glEnableVertexAttribArray;
  var _glGetAttribLocation=env._glGetAttribLocation;
  var _glBindBuffer=env._glBindBuffer;
  var _exit=env._exit;
  var _glAttachShader=env._glAttachShader;
  var _glCompileShader=env._glCompileShader;
  var _sin=env._sin;
  var _glBlendFunc=env._glBlendFunc;
  var _glCreateProgram=env._glCreateProgram;
  var _sysconf=env._sysconf;
  var _fmod=env._fmod;
  var _glBufferData=env._glBufferData;
  var _fmax=env._fmax;
  var _glViewport=env._glViewport;
  var __reallyNegative=env.__reallyNegative;
  var __formatString=env.__formatString;
  var _SDL_GL_SetAttribute=env._SDL_GL_SetAttribute;
  var _glShaderSource=env._glShaderSource;
  var _enable_resizable=env._enable_resizable;
  var _SDL_GetTicks=env._SDL_GetTicks;
  var _glUniformMatrix4fv=env._glUniformMatrix4fv;
  var _cos=env._cos;
  var _pwrite=env._pwrite;
  var _puts=env._puts;
  var _sbrk=env._sbrk;
  var _llvm_stacksave=env._llvm_stacksave;
  var _SDL_Init=env._SDL_Init;
  var _SDL_GetError=env._SDL_GetError;
  var _floor=env._floor;
  var ___errno_location=env.___errno_location;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var _glDeleteBuffers=env._glDeleteBuffers;
  var _atan2=env._atan2;
  var _SDL_Quit=env._SDL_Quit;
  var _fmin=env._fmin;
  var _time=env._time;
  var _glGetShaderiv=env._glGetShaderiv;
  var __exit=env.__exit;
  var _glCreateShader=env._glCreateShader;
// EMSCRIPTEN_START_FUNCS
function _malloc($bytes) {
 $bytes = $bytes | 0;
 var $cond = 0, $shr = 0, $0 = 0, $shr3 = 0, $add8 = 0, $shl = 0, $1 = 0, $2 = 0, $3 = 0, $fd9 = 0, $4 = 0, $bk = 0, $shl22 = 0, $9 = 0, $shl37 = 0, $and41 = 0, $sub44 = 0, $and46 = 0, $shr47 = 0, $and49 = 0, $shr51 = 0, $and53 = 0, $shr55 = 0, $and57 = 0, $shr59 = 0, $and61 = 0, $add64 = 0, $shl65 = 0, $13 = 0, $14 = 0, $15 = 0, $fd69 = 0, $16 = 0, $bk78 = 0, $shl90 = 0, $sub91 = 0, $20 = 0, $21 = 0, $23 = 0, $24 = 0, $shr101 = 0, $shl102 = 0, $25 = 0, $26 = 0, $shl105 = 0, $27 = 0, $28 = 0, $_pre_phi = 0, $F104_0 = 0, $32 = 0, $sub2_i = 0, $and3_i = 0, $shr4_i = 0, $and6_i = 0, $shr7_i = 0, $and9_i = 0, $shr11_i = 0, $and13_i = 0, $shr15_i = 0, $and17_i = 0, $33 = 0, $rsize_0_i = 0, $v_0_i = 0, $t_0_i = 0, $35 = 0, $36 = 0, $cond7_i = 0, $sub31_i = 0, $cmp32_i = 0, $38 = 0, $39 = 0, $add_ptr_i = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $bk47_i = 0, $fd50_i = 0, $arrayidx61_i = 0, $47 = 0, $arrayidx65_i = 0, $48 = 0, $RP_0_i = 0, $R_0_i = 0, $arrayidx71_i = 0, $49 = 0, $arrayidx75_i = 0, $50 = 0, $R_1_i = 0, $index_i = 0, $arrayidx94_i = 0, $arrayidx113_i = 0, $61 = 0, $64 = 0, $add177_i = 0, $67 = 0, $70 = 0, $71 = 0, $shr194_i = 0, $shl195_i = 0, $72 = 0, $73 = 0, $shl198_i = 0, $74 = 0, $75 = 0, $_pre_phi_i = 0, $F197_0_i = 0, $add_ptr225_i = 0, $add143 = 0, $and144 = 0, $79 = 0, $sub_i107 = 0, $shr_i108 = 0, $and_i112 = 0, $shl_i113 = 0, $and8_i = 0, $shl9_i = 0, $and12_i = 0, $add17_i = 0, $idx_0_i = 0, $80 = 0, $cond_i = 0, $rst_0_i = 0, $sizebits_0_i = 0, $t_0_i121 = 0, $rsize_0_i122 = 0, $v_0_i123 = 0, $and32_i = 0, $sub33_i = 0, $rsize_1_i = 0, $v_1_i = 0, $82 = 0, $83 = 0, $rst_1_i = 0, $t_1_i = 0, $rsize_2_i = 0, $v_2_i = 0, $shl59_i = 0, $and63_i = 0, $sub69_i = 0, $and72_i = 0, $shr74_i = 0, $and76_i = 0, $shr78_i = 0, $and80_i = 0, $shr82_i = 0, $and84_i = 0, $shr86_i = 0, $and88_i = 0, $t_2_ph_i = 0, $v_326_i = 0, $rsize_325_i = 0, $t_224_i = 0, $sub100_i = 0, $cmp101_i = 0, $sub100_rsize_3_i = 0, $t_2_v_3_i = 0, $86 = 0, $87 = 0, $v_3_lcssa_i = 0, $rsize_3_lcssa_i = 0, $89 = 0, $90 = 0, $add_ptr_i128 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $bk135_i = 0, $fd138_i = 0, $arrayidx150_i = 0, $98 = 0, $arrayidx154_i133 = 0, $99 = 0, $RP_0_i136 = 0, $R_0_i137 = 0, $arrayidx160_i = 0, $100 = 0, $arrayidx164_i = 0, $101 = 0, $R_1_i139 = 0, $index_i140 = 0, $arrayidx183_i = 0, $arrayidx203_i = 0, $112 = 0, $115 = 0, $add267_i = 0, $118 = 0, $shr282_i = 0, $shl287_i = 0, $121 = 0, $122 = 0, $shl290_i = 0, $123 = 0, $124 = 0, $_pre_phi_i147 = 0, $F289_0_i = 0, $129 = 0, $shr317_i = 0, $and330_i = 0, $shl332_i = 0, $and335_i = 0, $shl337_i = 0, $and340_i = 0, $add345_i = 0, $I315_0_i = 0, $arrayidx354_i = 0, $132 = 0, $shl361_i = 0, $cond382_i = 0, $T_0_i = 0, $K372_0_i = 0, $arrayidx393_i = 0, $139 = 0, $fd412_i = 0, $145 = 0, $147 = 0, $add_ptr436_i = 0, $nb_0 = 0, $153 = 0, $sub159 = 0, $154 = 0, $155 = 0, $159 = 0, $162 = 0, $sub187 = 0, $163 = 0, $164 = 0, $call_i_i = 0, $add_i149 = 0, $169 = 0, $sub_i150 = 0, $add9_i = 0, $neg_i151 = 0, $and11_i = 0, $170 = 0, $171 = 0, $add17_i152 = 0, $173 = 0, $174 = 0, $sp_0_i_i = 0, $base_i_i = 0, $175 = 0, $size_i_i = 0, $177 = 0, $call34_i = 0, $178 = 0, $179 = 0, $sub38_i = 0, $ssize_0_i = 0, $180 = 0, $add51_i = 0, $181 = 0, $call65_i = 0, $cmp66_i160 = 0, $and77_i = 0, $call80_i = 0, $cmp82_i = 0, $ssize_1_i = 0, $br_0_i = 0, $tsize_0_i = 0, $tbase_0_i = 0, $sub109_i = 0, $185 = 0, $and101_i = 0, $ssize_2_i = 0, $tsize_0758385_i = 0, $tsize_1_i = 0, $call128_i = 0, $call129_i = 0, $sub_ptr_sub_i = 0, $cmp138_i166 = 0, $call128_tbase_1_i = 0, $tbase_292_i = 0, $tsize_291_i = 0, $add147_i = 0, $189 = 0, $190 = 0, $i_02_i_i = 0, $shl_i_i = 0, $192 = 0, $195 = 0, $cond_i_i = 0, $sub5_i_i = 0, $sp_0105_i = 0, $201 = 0, $size185_i = 0, $202 = 0, $203 = 0, $205 = 0, $206 = 0, $add212_i = 0, $208 = 0, $209 = 0, $cond_i28_i = 0, $sub5_i30_i = 0, $add_ptr224_i = 0, $sp_1101_i = 0, $base223_i = 0, $217 = 0, $size242_i = 0, $220 = 0, $cond_i43_i = 0, $222 = 0, $cond15_i_i = 0, $add_ptr16_i_i = 0, $224 = 0, $add_ptr4_sum_i50_i = 0, $add_ptr17_i_i = 0, $225 = 0, $sub18_i_i = 0, $add_i_i = 0, $add26_i_i = 0, $add_ptr16_sum_i_i = 0, $234 = 0, $and37_i_i = 0, $shr_i55_i = 0, $236 = 0, $238 = 0, $239 = 0, $fd59_i_i = 0, $fd68_pre_phi_i_i = 0, $247 = 0, $249 = 0, $251 = 0, $253 = 0, $bk82_i_i = 0, $fd85_i_i = 0, $add_ptr16_sum56_i_i = 0, $258 = 0, $259 = 0, $arrayidx99_i_i = 0, $260 = 0, $RP_0_i_i = 0, $R_0_i_i = 0, $arrayidx103_i_i = 0, $261 = 0, $arrayidx107_i_i = 0, $262 = 0, $R_1_i_i = 0, $265 = 0, $arrayidx123_i_i = 0, $arrayidx143_i_i = 0, $add_ptr16_sum2728_i_i = 0, $275 = 0, $279 = 0, $qsize_0_i_i = 0, $oldfirst_0_i_i = 0, $head208_i_i = 0, $shr214_i_i = 0, $shl221_i_i = 0, $285 = 0, $286 = 0, $shl226_i_i = 0, $287 = 0, $288 = 0, $_pre_phi_i68_i = 0, $F224_0_i_i = 0, $293 = 0, $shr253_i_i = 0, $and264_i_i = 0, $shl265_i_i = 0, $and268_i_i = 0, $shl270_i_i = 0, $and273_i_i = 0, $add278_i_i = 0, $I252_0_i_i = 0, $arrayidx287_i_i = 0, $296 = 0, $shl294_i_i = 0, $cond315_i_i = 0, $T_0_i69_i = 0, $K305_0_i_i = 0, $arrayidx325_i_i = 0, $303 = 0, $fd344_i_i = 0, $309 = 0, $311 = 0, $316 = 0, $sp_0_i_i_i = 0, $317 = 0, $318 = 0, $add_ptr_i_i_i = 0, $320 = 0, $cond_i18_i = 0, $add_ptr7_i_i = 0, $cond13_i_i = 0, $add_ptr14_i_i = 0, $323 = 0, $cond_i_i_i = 0, $sub5_i_i_i = 0, $330 = 0, $add_ptr2416_i_i = 0, $332 = 0, $sub_ptr_sub_i_i = 0, $335 = 0, $shr_i_i = 0, $shl_i21_i = 0, $337 = 0, $338 = 0, $shl39_i_i = 0, $339 = 0, $340 = 0, $_pre_phi_i_i = 0, $F_0_i_i = 0, $343 = 0, $shr58_i_i = 0, $and69_i_i = 0, $shl70_i_i = 0, $and73_i_i = 0, $shl75_i_i = 0, $and78_i_i = 0, $add83_i_i = 0, $I57_0_i_i = 0, $arrayidx91_i_i = 0, $345 = 0, $shl95_i_i = 0, $cond115_i_i = 0, $T_0_i_i = 0, $K105_0_i_i = 0, $arrayidx126_i_i = 0, $348 = 0, $fd145_i_i = 0, $351 = 0, $353 = 0, $355 = 0, $sub253_i = 0, $356 = 0, $357 = 0, $mem_0 = 0, label = 0;
 do {
  if ($bytes >>> 0 < 245) {
   if ($bytes >>> 0 < 11) {
    $cond = 16; //@line 14240
   } else {
    $cond = $bytes + 11 & -8; //@line 14244
   }
   $shr = $cond >>> 3; //@line 14247
   $0 = HEAP32[796] | 0; //@line 14248
   $shr3 = $0 >>> ($shr >>> 0); //@line 14249
   if (($shr3 & 3 | 0) != 0) {
    $add8 = ($shr3 & 1 ^ 1) + $shr | 0; //@line 14255
    $shl = $add8 << 1; //@line 14256
    $1 = 3224 + ($shl << 2) | 0; //@line 14258
    $2 = 3224 + ($shl + 2 << 2) | 0; //@line 14260
    $3 = HEAP32[$2 >> 2] | 0; //@line 14261
    $fd9 = $3 + 8 | 0; //@line 14262
    $4 = HEAP32[$fd9 >> 2] | 0; //@line 14263
    do {
     if (($1 | 0) == ($4 | 0)) {
      HEAP32[796] = $0 & ~(1 << $add8); //@line 14270
     } else {
      if ($4 >>> 0 < (HEAP32[800] | 0) >>> 0) {
       _abort(); //@line 14276
       return 0; //@line 14276
      }
      $bk = $4 + 12 | 0; //@line 14279
      if ((HEAP32[$bk >> 2] | 0) == ($3 | 0)) {
       HEAP32[$bk >> 2] = $1; //@line 14283
       HEAP32[$2 >> 2] = $4; //@line 14284
       break;
      } else {
       _abort(); //@line 14287
       return 0; //@line 14287
      }
     }
    } while (0);
    $shl22 = $add8 << 3; //@line 14292
    HEAP32[$3 + 4 >> 2] = $shl22 | 3; //@line 14295
    $9 = $3 + ($shl22 | 4) | 0; //@line 14299
    HEAP32[$9 >> 2] = HEAP32[$9 >> 2] | 1; //@line 14302
    $mem_0 = $fd9; //@line 14304
    return $mem_0 | 0; //@line 14306
   }
   if ($cond >>> 0 <= (HEAP32[798] | 0) >>> 0) {
    $nb_0 = $cond; //@line 14311
    break;
   }
   if (($shr3 | 0) != 0) {
    $shl37 = 2 << $shr; //@line 14317
    $and41 = $shr3 << $shr & ($shl37 | -$shl37); //@line 14320
    $sub44 = ($and41 & -$and41) - 1 | 0; //@line 14323
    $and46 = $sub44 >>> 12 & 16; //@line 14325
    $shr47 = $sub44 >>> ($and46 >>> 0); //@line 14326
    $and49 = $shr47 >>> 5 & 8; //@line 14328
    $shr51 = $shr47 >>> ($and49 >>> 0); //@line 14330
    $and53 = $shr51 >>> 2 & 4; //@line 14332
    $shr55 = $shr51 >>> ($and53 >>> 0); //@line 14334
    $and57 = $shr55 >>> 1 & 2; //@line 14336
    $shr59 = $shr55 >>> ($and57 >>> 0); //@line 14338
    $and61 = $shr59 >>> 1 & 1; //@line 14340
    $add64 = ($and49 | $and46 | $and53 | $and57 | $and61) + ($shr59 >>> ($and61 >>> 0)) | 0; //@line 14343
    $shl65 = $add64 << 1; //@line 14344
    $13 = 3224 + ($shl65 << 2) | 0; //@line 14346
    $14 = 3224 + ($shl65 + 2 << 2) | 0; //@line 14348
    $15 = HEAP32[$14 >> 2] | 0; //@line 14349
    $fd69 = $15 + 8 | 0; //@line 14350
    $16 = HEAP32[$fd69 >> 2] | 0; //@line 14351
    do {
     if (($13 | 0) == ($16 | 0)) {
      HEAP32[796] = $0 & ~(1 << $add64); //@line 14358
     } else {
      if ($16 >>> 0 < (HEAP32[800] | 0) >>> 0) {
       _abort(); //@line 14364
       return 0; //@line 14364
      }
      $bk78 = $16 + 12 | 0; //@line 14367
      if ((HEAP32[$bk78 >> 2] | 0) == ($15 | 0)) {
       HEAP32[$bk78 >> 2] = $13; //@line 14371
       HEAP32[$14 >> 2] = $16; //@line 14372
       break;
      } else {
       _abort(); //@line 14375
       return 0; //@line 14375
      }
     }
    } while (0);
    $shl90 = $add64 << 3; //@line 14380
    $sub91 = $shl90 - $cond | 0; //@line 14381
    HEAP32[$15 + 4 >> 2] = $cond | 3; //@line 14384
    $20 = $15; //@line 14385
    $21 = $20 + $cond | 0; //@line 14387
    HEAP32[$20 + ($cond | 4) >> 2] = $sub91 | 1; //@line 14392
    HEAP32[$20 + $shl90 >> 2] = $sub91; //@line 14395
    $23 = HEAP32[798] | 0; //@line 14396
    if (($23 | 0) != 0) {
     $24 = HEAP32[801] | 0; //@line 14399
     $shr101 = $23 >>> 3; //@line 14400
     $shl102 = $shr101 << 1; //@line 14401
     $25 = 3224 + ($shl102 << 2) | 0; //@line 14403
     $26 = HEAP32[796] | 0; //@line 14404
     $shl105 = 1 << $shr101; //@line 14405
     do {
      if (($26 & $shl105 | 0) == 0) {
       HEAP32[796] = $26 | $shl105; //@line 14411
       $F104_0 = $25; //@line 14414
       $_pre_phi = 3224 + ($shl102 + 2 << 2) | 0; //@line 14414
      } else {
       $27 = 3224 + ($shl102 + 2 << 2) | 0; //@line 14417
       $28 = HEAP32[$27 >> 2] | 0; //@line 14418
       if ($28 >>> 0 >= (HEAP32[800] | 0) >>> 0) {
        $F104_0 = $28; //@line 14423
        $_pre_phi = $27; //@line 14423
        break;
       }
       _abort(); //@line 14426
       return 0; //@line 14426
      }
     } while (0);
     HEAP32[$_pre_phi >> 2] = $24; //@line 14432
     HEAP32[$F104_0 + 12 >> 2] = $24; //@line 14434
     HEAP32[$24 + 8 >> 2] = $F104_0; //@line 14436
     HEAP32[$24 + 12 >> 2] = $25; //@line 14438
    }
    HEAP32[798] = $sub91; //@line 14440
    HEAP32[801] = $21; //@line 14441
    $mem_0 = $fd69; //@line 14443
    return $mem_0 | 0; //@line 14445
   }
   $32 = HEAP32[797] | 0; //@line 14447
   if (($32 | 0) == 0) {
    $nb_0 = $cond; //@line 14450
    break;
   }
   $sub2_i = ($32 & -$32) - 1 | 0; //@line 14455
   $and3_i = $sub2_i >>> 12 & 16; //@line 14457
   $shr4_i = $sub2_i >>> ($and3_i >>> 0); //@line 14458
   $and6_i = $shr4_i >>> 5 & 8; //@line 14460
   $shr7_i = $shr4_i >>> ($and6_i >>> 0); //@line 14462
   $and9_i = $shr7_i >>> 2 & 4; //@line 14464
   $shr11_i = $shr7_i >>> ($and9_i >>> 0); //@line 14466
   $and13_i = $shr11_i >>> 1 & 2; //@line 14468
   $shr15_i = $shr11_i >>> ($and13_i >>> 0); //@line 14470
   $and17_i = $shr15_i >>> 1 & 1; //@line 14472
   $33 = HEAP32[3488 + (($and6_i | $and3_i | $and9_i | $and13_i | $and17_i) + ($shr15_i >>> ($and17_i >>> 0)) << 2) >> 2] | 0; //@line 14477
   $t_0_i = $33; //@line 14482
   $v_0_i = $33; //@line 14482
   $rsize_0_i = (HEAP32[$33 + 4 >> 2] & -8) - $cond | 0; //@line 14482
   while (1) {
    $35 = HEAP32[$t_0_i + 16 >> 2] | 0; //@line 14488
    if (($35 | 0) == 0) {
     $36 = HEAP32[$t_0_i + 20 >> 2] | 0; //@line 14492
     if (($36 | 0) == 0) {
      break;
     } else {
      $cond7_i = $36; //@line 14497
     }
    } else {
     $cond7_i = $35; //@line 14500
    }
    $sub31_i = (HEAP32[$cond7_i + 4 >> 2] & -8) - $cond | 0; //@line 14506
    $cmp32_i = $sub31_i >>> 0 < $rsize_0_i >>> 0; //@line 14507
    $t_0_i = $cond7_i; //@line 14510
    $v_0_i = $cmp32_i ? $cond7_i : $v_0_i; //@line 14510
    $rsize_0_i = $cmp32_i ? $sub31_i : $rsize_0_i; //@line 14510
   }
   $38 = $v_0_i; //@line 14512
   $39 = HEAP32[800] | 0; //@line 14513
   if ($38 >>> 0 < $39 >>> 0) {
    _abort(); //@line 14516
    return 0; //@line 14516
   }
   $add_ptr_i = $38 + $cond | 0; //@line 14519
   $40 = $add_ptr_i; //@line 14520
   if ($38 >>> 0 >= $add_ptr_i >>> 0) {
    _abort(); //@line 14523
    return 0; //@line 14523
   }
   $41 = HEAP32[$v_0_i + 24 >> 2] | 0; //@line 14527
   $42 = HEAP32[$v_0_i + 12 >> 2] | 0; //@line 14529
   do {
    if (($42 | 0) == ($v_0_i | 0)) {
     $arrayidx61_i = $v_0_i + 20 | 0; //@line 14533
     $47 = HEAP32[$arrayidx61_i >> 2] | 0; //@line 14534
     if (($47 | 0) == 0) {
      $arrayidx65_i = $v_0_i + 16 | 0; //@line 14537
      $48 = HEAP32[$arrayidx65_i >> 2] | 0; //@line 14538
      if (($48 | 0) == 0) {
       $R_1_i = 0; //@line 14541
       break;
      } else {
       $R_0_i = $48; //@line 14544
       $RP_0_i = $arrayidx65_i; //@line 14544
      }
     } else {
      $R_0_i = $47; //@line 14547
      $RP_0_i = $arrayidx61_i; //@line 14547
     }
     while (1) {
      $arrayidx71_i = $R_0_i + 20 | 0; //@line 14552
      $49 = HEAP32[$arrayidx71_i >> 2] | 0; //@line 14553
      if (($49 | 0) != 0) {
       $R_0_i = $49; //@line 14556
       $RP_0_i = $arrayidx71_i; //@line 14556
       continue;
      }
      $arrayidx75_i = $R_0_i + 16 | 0; //@line 14559
      $50 = HEAP32[$arrayidx75_i >> 2] | 0; //@line 14560
      if (($50 | 0) == 0) {
       break;
      } else {
       $R_0_i = $50; //@line 14565
       $RP_0_i = $arrayidx75_i; //@line 14565
      }
     }
     if ($RP_0_i >>> 0 < $39 >>> 0) {
      _abort(); //@line 14571
      return 0; //@line 14571
     } else {
      HEAP32[$RP_0_i >> 2] = 0; //@line 14574
      $R_1_i = $R_0_i; //@line 14575
      break;
     }
    } else {
     $43 = HEAP32[$v_0_i + 8 >> 2] | 0; //@line 14580
     if ($43 >>> 0 < $39 >>> 0) {
      _abort(); //@line 14584
      return 0; //@line 14584
     }
     $bk47_i = $43 + 12 | 0; //@line 14587
     if ((HEAP32[$bk47_i >> 2] | 0) != ($v_0_i | 0)) {
      _abort(); //@line 14591
      return 0; //@line 14591
     }
     $fd50_i = $42 + 8 | 0; //@line 14594
     if ((HEAP32[$fd50_i >> 2] | 0) == ($v_0_i | 0)) {
      HEAP32[$bk47_i >> 2] = $42; //@line 14598
      HEAP32[$fd50_i >> 2] = $43; //@line 14599
      $R_1_i = $42; //@line 14600
      break;
     } else {
      _abort(); //@line 14603
      return 0; //@line 14603
     }
    }
   } while (0);
   L1975 : do {
    if (($41 | 0) != 0) {
     $index_i = $v_0_i + 28 | 0; //@line 14612
     $arrayidx94_i = 3488 + (HEAP32[$index_i >> 2] << 2) | 0; //@line 14614
     do {
      if (($v_0_i | 0) == (HEAP32[$arrayidx94_i >> 2] | 0)) {
       HEAP32[$arrayidx94_i >> 2] = $R_1_i; //@line 14619
       if (($R_1_i | 0) != 0) {
        break;
       }
       HEAP32[797] = HEAP32[797] & ~(1 << HEAP32[$index_i >> 2]); //@line 14629
       break L1975;
      } else {
       if ($41 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 14636
        return 0; //@line 14636
       }
       $arrayidx113_i = $41 + 16 | 0; //@line 14639
       if ((HEAP32[$arrayidx113_i >> 2] | 0) == ($v_0_i | 0)) {
        HEAP32[$arrayidx113_i >> 2] = $R_1_i; //@line 14643
       } else {
        HEAP32[$41 + 20 >> 2] = $R_1_i; //@line 14646
       }
       if (($R_1_i | 0) == 0) {
        break L1975;
       }
      }
     } while (0);
     if ($R_1_i >>> 0 < (HEAP32[800] | 0) >>> 0) {
      _abort(); //@line 14658
      return 0; //@line 14658
     }
     HEAP32[$R_1_i + 24 >> 2] = $41; //@line 14662
     $61 = HEAP32[$v_0_i + 16 >> 2] | 0; //@line 14664
     do {
      if (($61 | 0) != 0) {
       if ($61 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 14672
        return 0; //@line 14672
       } else {
        HEAP32[$R_1_i + 16 >> 2] = $61; //@line 14676
        HEAP32[$61 + 24 >> 2] = $R_1_i; //@line 14678
        break;
       }
      }
     } while (0);
     $64 = HEAP32[$v_0_i + 20 >> 2] | 0; //@line 14684
     if (($64 | 0) == 0) {
      break;
     }
     if ($64 >>> 0 < (HEAP32[800] | 0) >>> 0) {
      _abort(); //@line 14693
      return 0; //@line 14693
     } else {
      HEAP32[$R_1_i + 20 >> 2] = $64; //@line 14697
      HEAP32[$64 + 24 >> 2] = $R_1_i; //@line 14699
      break;
     }
    }
   } while (0);
   if ($rsize_0_i >>> 0 < 16) {
    $add177_i = $rsize_0_i + $cond | 0; //@line 14706
    HEAP32[$v_0_i + 4 >> 2] = $add177_i | 3; //@line 14709
    $67 = $38 + ($add177_i + 4) | 0; //@line 14712
    HEAP32[$67 >> 2] = HEAP32[$67 >> 2] | 1; //@line 14715
   } else {
    HEAP32[$v_0_i + 4 >> 2] = $cond | 3; //@line 14719
    HEAP32[$38 + ($cond | 4) >> 2] = $rsize_0_i | 1; //@line 14724
    HEAP32[$38 + ($rsize_0_i + $cond) >> 2] = $rsize_0_i; //@line 14728
    $70 = HEAP32[798] | 0; //@line 14729
    if (($70 | 0) != 0) {
     $71 = HEAP32[801] | 0; //@line 14732
     $shr194_i = $70 >>> 3; //@line 14733
     $shl195_i = $shr194_i << 1; //@line 14734
     $72 = 3224 + ($shl195_i << 2) | 0; //@line 14736
     $73 = HEAP32[796] | 0; //@line 14737
     $shl198_i = 1 << $shr194_i; //@line 14738
     do {
      if (($73 & $shl198_i | 0) == 0) {
       HEAP32[796] = $73 | $shl198_i; //@line 14744
       $F197_0_i = $72; //@line 14747
       $_pre_phi_i = 3224 + ($shl195_i + 2 << 2) | 0; //@line 14747
      } else {
       $74 = 3224 + ($shl195_i + 2 << 2) | 0; //@line 14750
       $75 = HEAP32[$74 >> 2] | 0; //@line 14751
       if ($75 >>> 0 >= (HEAP32[800] | 0) >>> 0) {
        $F197_0_i = $75; //@line 14756
        $_pre_phi_i = $74; //@line 14756
        break;
       }
       _abort(); //@line 14759
       return 0; //@line 14759
      }
     } while (0);
     HEAP32[$_pre_phi_i >> 2] = $71; //@line 14765
     HEAP32[$F197_0_i + 12 >> 2] = $71; //@line 14767
     HEAP32[$71 + 8 >> 2] = $F197_0_i; //@line 14769
     HEAP32[$71 + 12 >> 2] = $72; //@line 14771
    }
    HEAP32[798] = $rsize_0_i; //@line 14773
    HEAP32[801] = $40; //@line 14774
   }
   $add_ptr225_i = $v_0_i + 8 | 0; //@line 14776
   if (($add_ptr225_i | 0) == 0) {
    $nb_0 = $cond; //@line 14780
    break;
   } else {
    $mem_0 = $add_ptr225_i; //@line 14783
   }
   return $mem_0 | 0; //@line 14786
  } else {
   if ($bytes >>> 0 > 4294967231) {
    $nb_0 = -1; //@line 14790
    break;
   }
   $add143 = $bytes + 11 | 0; //@line 14793
   $and144 = $add143 & -8; //@line 14794
   $79 = HEAP32[797] | 0; //@line 14795
   if (($79 | 0) == 0) {
    $nb_0 = $and144; //@line 14798
    break;
   }
   $sub_i107 = -$and144 | 0; //@line 14801
   $shr_i108 = $add143 >>> 8; //@line 14802
   do {
    if (($shr_i108 | 0) == 0) {
     $idx_0_i = 0; //@line 14806
    } else {
     if ($and144 >>> 0 > 16777215) {
      $idx_0_i = 31; //@line 14810
      break;
     }
     $and_i112 = ($shr_i108 + 1048320 | 0) >>> 16 & 8; //@line 14815
     $shl_i113 = $shr_i108 << $and_i112; //@line 14816
     $and8_i = ($shl_i113 + 520192 | 0) >>> 16 & 4; //@line 14819
     $shl9_i = $shl_i113 << $and8_i; //@line 14821
     $and12_i = ($shl9_i + 245760 | 0) >>> 16 & 2; //@line 14824
     $add17_i = 14 - ($and8_i | $and_i112 | $and12_i) + ($shl9_i << $and12_i >>> 15) | 0; //@line 14829
     $idx_0_i = $and144 >>> (($add17_i + 7 | 0) >>> 0) & 1 | $add17_i << 1; //@line 14835
    }
   } while (0);
   $80 = HEAP32[3488 + ($idx_0_i << 2) >> 2] | 0; //@line 14840
   L1783 : do {
    if (($80 | 0) == 0) {
     $v_2_i = 0; //@line 14844
     $rsize_2_i = $sub_i107; //@line 14844
     $t_1_i = 0; //@line 14844
    } else {
     if (($idx_0_i | 0) == 31) {
      $cond_i = 0; //@line 14848
     } else {
      $cond_i = 25 - ($idx_0_i >>> 1) | 0; //@line 14852
     }
     $v_0_i123 = 0; //@line 14856
     $rsize_0_i122 = $sub_i107; //@line 14856
     $t_0_i121 = $80; //@line 14856
     $sizebits_0_i = $and144 << $cond_i; //@line 14856
     $rst_0_i = 0; //@line 14856
     while (1) {
      $and32_i = HEAP32[$t_0_i121 + 4 >> 2] & -8; //@line 14865
      $sub33_i = $and32_i - $and144 | 0; //@line 14866
      if ($sub33_i >>> 0 < $rsize_0_i122 >>> 0) {
       if (($and32_i | 0) == ($and144 | 0)) {
        $v_2_i = $t_0_i121; //@line 14871
        $rsize_2_i = $sub33_i; //@line 14871
        $t_1_i = $t_0_i121; //@line 14871
        break L1783;
       } else {
        $v_1_i = $t_0_i121; //@line 14874
        $rsize_1_i = $sub33_i; //@line 14874
       }
      } else {
       $v_1_i = $v_0_i123; //@line 14877
       $rsize_1_i = $rsize_0_i122; //@line 14877
      }
      $82 = HEAP32[$t_0_i121 + 20 >> 2] | 0; //@line 14882
      $83 = HEAP32[$t_0_i121 + 16 + ($sizebits_0_i >>> 31 << 2) >> 2] | 0; //@line 14885
      $rst_1_i = ($82 | 0) == 0 | ($82 | 0) == ($83 | 0) ? $rst_0_i : $82; //@line 14889
      if (($83 | 0) == 0) {
       $v_2_i = $v_1_i; //@line 14893
       $rsize_2_i = $rsize_1_i; //@line 14893
       $t_1_i = $rst_1_i; //@line 14893
       break;
      } else {
       $v_0_i123 = $v_1_i; //@line 14896
       $rsize_0_i122 = $rsize_1_i; //@line 14896
       $t_0_i121 = $83; //@line 14896
       $sizebits_0_i = $sizebits_0_i << 1; //@line 14896
       $rst_0_i = $rst_1_i; //@line 14896
      }
     }
    }
   } while (0);
   if (($t_1_i | 0) == 0 & ($v_2_i | 0) == 0) {
    $shl59_i = 2 << $idx_0_i; //@line 14908
    $and63_i = $79 & ($shl59_i | -$shl59_i); //@line 14911
    if (($and63_i | 0) == 0) {
     $nb_0 = $and144; //@line 14914
     break;
    }
    $sub69_i = ($and63_i & -$and63_i) - 1 | 0; //@line 14919
    $and72_i = $sub69_i >>> 12 & 16; //@line 14921
    $shr74_i = $sub69_i >>> ($and72_i >>> 0); //@line 14922
    $and76_i = $shr74_i >>> 5 & 8; //@line 14924
    $shr78_i = $shr74_i >>> ($and76_i >>> 0); //@line 14926
    $and80_i = $shr78_i >>> 2 & 4; //@line 14928
    $shr82_i = $shr78_i >>> ($and80_i >>> 0); //@line 14930
    $and84_i = $shr82_i >>> 1 & 2; //@line 14932
    $shr86_i = $shr82_i >>> ($and84_i >>> 0); //@line 14934
    $and88_i = $shr86_i >>> 1 & 1; //@line 14936
    $t_2_ph_i = HEAP32[3488 + (($and76_i | $and72_i | $and80_i | $and84_i | $and88_i) + ($shr86_i >>> ($and88_i >>> 0)) << 2) >> 2] | 0; //@line 14942
   } else {
    $t_2_ph_i = $t_1_i; //@line 14944
   }
   if (($t_2_ph_i | 0) == 0) {
    $rsize_3_lcssa_i = $rsize_2_i; //@line 14949
    $v_3_lcssa_i = $v_2_i; //@line 14949
   } else {
    $t_224_i = $t_2_ph_i; //@line 14951
    $rsize_325_i = $rsize_2_i; //@line 14951
    $v_326_i = $v_2_i; //@line 14951
    while (1) {
     $sub100_i = (HEAP32[$t_224_i + 4 >> 2] & -8) - $and144 | 0; //@line 14959
     $cmp101_i = $sub100_i >>> 0 < $rsize_325_i >>> 0; //@line 14960
     $sub100_rsize_3_i = $cmp101_i ? $sub100_i : $rsize_325_i; //@line 14961
     $t_2_v_3_i = $cmp101_i ? $t_224_i : $v_326_i; //@line 14962
     $86 = HEAP32[$t_224_i + 16 >> 2] | 0; //@line 14964
     if (($86 | 0) != 0) {
      $t_224_i = $86; //@line 14967
      $rsize_325_i = $sub100_rsize_3_i; //@line 14967
      $v_326_i = $t_2_v_3_i; //@line 14967
      continue;
     }
     $87 = HEAP32[$t_224_i + 20 >> 2] | 0; //@line 14971
     if (($87 | 0) == 0) {
      $rsize_3_lcssa_i = $sub100_rsize_3_i; //@line 14974
      $v_3_lcssa_i = $t_2_v_3_i; //@line 14974
      break;
     } else {
      $t_224_i = $87; //@line 14977
      $rsize_325_i = $sub100_rsize_3_i; //@line 14977
      $v_326_i = $t_2_v_3_i; //@line 14977
     }
    }
   }
   if (($v_3_lcssa_i | 0) == 0) {
    $nb_0 = $and144; //@line 14985
    break;
   }
   if ($rsize_3_lcssa_i >>> 0 >= ((HEAP32[798] | 0) - $and144 | 0) >>> 0) {
    $nb_0 = $and144; //@line 14992
    break;
   }
   $89 = $v_3_lcssa_i; //@line 14995
   $90 = HEAP32[800] | 0; //@line 14996
   if ($89 >>> 0 < $90 >>> 0) {
    _abort(); //@line 14999
    return 0; //@line 14999
   }
   $add_ptr_i128 = $89 + $and144 | 0; //@line 15002
   $91 = $add_ptr_i128; //@line 15003
   if ($89 >>> 0 >= $add_ptr_i128 >>> 0) {
    _abort(); //@line 15006
    return 0; //@line 15006
   }
   $92 = HEAP32[$v_3_lcssa_i + 24 >> 2] | 0; //@line 15010
   $93 = HEAP32[$v_3_lcssa_i + 12 >> 2] | 0; //@line 15012
   do {
    if (($93 | 0) == ($v_3_lcssa_i | 0)) {
     $arrayidx150_i = $v_3_lcssa_i + 20 | 0; //@line 15016
     $98 = HEAP32[$arrayidx150_i >> 2] | 0; //@line 15017
     if (($98 | 0) == 0) {
      $arrayidx154_i133 = $v_3_lcssa_i + 16 | 0; //@line 15020
      $99 = HEAP32[$arrayidx154_i133 >> 2] | 0; //@line 15021
      if (($99 | 0) == 0) {
       $R_1_i139 = 0; //@line 15024
       break;
      } else {
       $R_0_i137 = $99; //@line 15027
       $RP_0_i136 = $arrayidx154_i133; //@line 15027
      }
     } else {
      $R_0_i137 = $98; //@line 15030
      $RP_0_i136 = $arrayidx150_i; //@line 15030
     }
     while (1) {
      $arrayidx160_i = $R_0_i137 + 20 | 0; //@line 15035
      $100 = HEAP32[$arrayidx160_i >> 2] | 0; //@line 15036
      if (($100 | 0) != 0) {
       $R_0_i137 = $100; //@line 15039
       $RP_0_i136 = $arrayidx160_i; //@line 15039
       continue;
      }
      $arrayidx164_i = $R_0_i137 + 16 | 0; //@line 15042
      $101 = HEAP32[$arrayidx164_i >> 2] | 0; //@line 15043
      if (($101 | 0) == 0) {
       break;
      } else {
       $R_0_i137 = $101; //@line 15048
       $RP_0_i136 = $arrayidx164_i; //@line 15048
      }
     }
     if ($RP_0_i136 >>> 0 < $90 >>> 0) {
      _abort(); //@line 15054
      return 0; //@line 15054
     } else {
      HEAP32[$RP_0_i136 >> 2] = 0; //@line 15057
      $R_1_i139 = $R_0_i137; //@line 15058
      break;
     }
    } else {
     $94 = HEAP32[$v_3_lcssa_i + 8 >> 2] | 0; //@line 15063
     if ($94 >>> 0 < $90 >>> 0) {
      _abort(); //@line 15067
      return 0; //@line 15067
     }
     $bk135_i = $94 + 12 | 0; //@line 15070
     if ((HEAP32[$bk135_i >> 2] | 0) != ($v_3_lcssa_i | 0)) {
      _abort(); //@line 15074
      return 0; //@line 15074
     }
     $fd138_i = $93 + 8 | 0; //@line 15077
     if ((HEAP32[$fd138_i >> 2] | 0) == ($v_3_lcssa_i | 0)) {
      HEAP32[$bk135_i >> 2] = $93; //@line 15081
      HEAP32[$fd138_i >> 2] = $94; //@line 15082
      $R_1_i139 = $93; //@line 15083
      break;
     } else {
      _abort(); //@line 15086
      return 0; //@line 15086
     }
    }
   } while (0);
   L1833 : do {
    if (($92 | 0) != 0) {
     $index_i140 = $v_3_lcssa_i + 28 | 0; //@line 15095
     $arrayidx183_i = 3488 + (HEAP32[$index_i140 >> 2] << 2) | 0; //@line 15097
     do {
      if (($v_3_lcssa_i | 0) == (HEAP32[$arrayidx183_i >> 2] | 0)) {
       HEAP32[$arrayidx183_i >> 2] = $R_1_i139; //@line 15102
       if (($R_1_i139 | 0) != 0) {
        break;
       }
       HEAP32[797] = HEAP32[797] & ~(1 << HEAP32[$index_i140 >> 2]); //@line 15112
       break L1833;
      } else {
       if ($92 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 15119
        return 0; //@line 15119
       }
       $arrayidx203_i = $92 + 16 | 0; //@line 15122
       if ((HEAP32[$arrayidx203_i >> 2] | 0) == ($v_3_lcssa_i | 0)) {
        HEAP32[$arrayidx203_i >> 2] = $R_1_i139; //@line 15126
       } else {
        HEAP32[$92 + 20 >> 2] = $R_1_i139; //@line 15129
       }
       if (($R_1_i139 | 0) == 0) {
        break L1833;
       }
      }
     } while (0);
     if ($R_1_i139 >>> 0 < (HEAP32[800] | 0) >>> 0) {
      _abort(); //@line 15141
      return 0; //@line 15141
     }
     HEAP32[$R_1_i139 + 24 >> 2] = $92; //@line 15145
     $112 = HEAP32[$v_3_lcssa_i + 16 >> 2] | 0; //@line 15147
     do {
      if (($112 | 0) != 0) {
       if ($112 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 15155
        return 0; //@line 15155
       } else {
        HEAP32[$R_1_i139 + 16 >> 2] = $112; //@line 15159
        HEAP32[$112 + 24 >> 2] = $R_1_i139; //@line 15161
        break;
       }
      }
     } while (0);
     $115 = HEAP32[$v_3_lcssa_i + 20 >> 2] | 0; //@line 15167
     if (($115 | 0) == 0) {
      break;
     }
     if ($115 >>> 0 < (HEAP32[800] | 0) >>> 0) {
      _abort(); //@line 15176
      return 0; //@line 15176
     } else {
      HEAP32[$R_1_i139 + 20 >> 2] = $115; //@line 15180
      HEAP32[$115 + 24 >> 2] = $R_1_i139; //@line 15182
      break;
     }
    }
   } while (0);
   do {
    if ($rsize_3_lcssa_i >>> 0 < 16) {
     $add267_i = $rsize_3_lcssa_i + $and144 | 0; //@line 15190
     HEAP32[$v_3_lcssa_i + 4 >> 2] = $add267_i | 3; //@line 15193
     $118 = $89 + ($add267_i + 4) | 0; //@line 15196
     HEAP32[$118 >> 2] = HEAP32[$118 >> 2] | 1; //@line 15199
    } else {
     HEAP32[$v_3_lcssa_i + 4 >> 2] = $and144 | 3; //@line 15203
     HEAP32[$89 + ($and144 | 4) >> 2] = $rsize_3_lcssa_i | 1; //@line 15208
     HEAP32[$89 + ($rsize_3_lcssa_i + $and144) >> 2] = $rsize_3_lcssa_i; //@line 15212
     $shr282_i = $rsize_3_lcssa_i >>> 3; //@line 15213
     if ($rsize_3_lcssa_i >>> 0 < 256) {
      $shl287_i = $shr282_i << 1; //@line 15216
      $121 = 3224 + ($shl287_i << 2) | 0; //@line 15218
      $122 = HEAP32[796] | 0; //@line 15219
      $shl290_i = 1 << $shr282_i; //@line 15220
      do {
       if (($122 & $shl290_i | 0) == 0) {
        HEAP32[796] = $122 | $shl290_i; //@line 15226
        $F289_0_i = $121; //@line 15229
        $_pre_phi_i147 = 3224 + ($shl287_i + 2 << 2) | 0; //@line 15229
       } else {
        $123 = 3224 + ($shl287_i + 2 << 2) | 0; //@line 15232
        $124 = HEAP32[$123 >> 2] | 0; //@line 15233
        if ($124 >>> 0 >= (HEAP32[800] | 0) >>> 0) {
         $F289_0_i = $124; //@line 15238
         $_pre_phi_i147 = $123; //@line 15238
         break;
        }
        _abort(); //@line 15241
        return 0; //@line 15241
       }
      } while (0);
      HEAP32[$_pre_phi_i147 >> 2] = $91; //@line 15247
      HEAP32[$F289_0_i + 12 >> 2] = $91; //@line 15249
      HEAP32[$89 + ($and144 + 8) >> 2] = $F289_0_i; //@line 15253
      HEAP32[$89 + ($and144 + 12) >> 2] = $121; //@line 15257
      break;
     }
     $129 = $add_ptr_i128; //@line 15260
     $shr317_i = $rsize_3_lcssa_i >>> 8; //@line 15261
     do {
      if (($shr317_i | 0) == 0) {
       $I315_0_i = 0; //@line 15265
      } else {
       if ($rsize_3_lcssa_i >>> 0 > 16777215) {
        $I315_0_i = 31; //@line 15269
        break;
       }
       $and330_i = ($shr317_i + 1048320 | 0) >>> 16 & 8; //@line 15274
       $shl332_i = $shr317_i << $and330_i; //@line 15275
       $and335_i = ($shl332_i + 520192 | 0) >>> 16 & 4; //@line 15278
       $shl337_i = $shl332_i << $and335_i; //@line 15280
       $and340_i = ($shl337_i + 245760 | 0) >>> 16 & 2; //@line 15283
       $add345_i = 14 - ($and335_i | $and330_i | $and340_i) + ($shl337_i << $and340_i >>> 15) | 0; //@line 15288
       $I315_0_i = $rsize_3_lcssa_i >>> (($add345_i + 7 | 0) >>> 0) & 1 | $add345_i << 1; //@line 15294
      }
     } while (0);
     $arrayidx354_i = 3488 + ($I315_0_i << 2) | 0; //@line 15298
     HEAP32[$89 + ($and144 + 28) >> 2] = $I315_0_i; //@line 15302
     HEAP32[$89 + ($and144 + 20) >> 2] = 0; //@line 15308
     HEAP32[$89 + ($and144 + 16) >> 2] = 0; //@line 15310
     $132 = HEAP32[797] | 0; //@line 15311
     $shl361_i = 1 << $I315_0_i; //@line 15312
     if (($132 & $shl361_i | 0) == 0) {
      HEAP32[797] = $132 | $shl361_i; //@line 15317
      HEAP32[$arrayidx354_i >> 2] = $129; //@line 15318
      HEAP32[$89 + ($and144 + 24) >> 2] = $arrayidx354_i; //@line 15323
      HEAP32[$89 + ($and144 + 12) >> 2] = $129; //@line 15327
      HEAP32[$89 + ($and144 + 8) >> 2] = $129; //@line 15331
      break;
     }
     if (($I315_0_i | 0) == 31) {
      $cond382_i = 0; //@line 15337
     } else {
      $cond382_i = 25 - ($I315_0_i >>> 1) | 0; //@line 15341
     }
     $K372_0_i = $rsize_3_lcssa_i << $cond382_i; //@line 15345
     $T_0_i = HEAP32[$arrayidx354_i >> 2] | 0; //@line 15345
     while (1) {
      if ((HEAP32[$T_0_i + 4 >> 2] & -8 | 0) == ($rsize_3_lcssa_i | 0)) {
       break;
      }
      $arrayidx393_i = $T_0_i + 16 + ($K372_0_i >>> 31 << 2) | 0; //@line 15357
      $139 = HEAP32[$arrayidx393_i >> 2] | 0; //@line 15358
      if (($139 | 0) == 0) {
       label = 1560; //@line 15362
       break;
      } else {
       $K372_0_i = $K372_0_i << 1; //@line 15365
       $T_0_i = $139; //@line 15365
      }
     }
     if ((label | 0) == 1560) {
      if ($arrayidx393_i >>> 0 < (HEAP32[800] | 0) >>> 0) {
       _abort(); //@line 15373
       return 0; //@line 15373
      } else {
       HEAP32[$arrayidx393_i >> 2] = $129; //@line 15376
       HEAP32[$89 + ($and144 + 24) >> 2] = $T_0_i; //@line 15380
       HEAP32[$89 + ($and144 + 12) >> 2] = $129; //@line 15384
       HEAP32[$89 + ($and144 + 8) >> 2] = $129; //@line 15388
       break;
      }
     }
     $fd412_i = $T_0_i + 8 | 0; //@line 15392
     $145 = HEAP32[$fd412_i >> 2] | 0; //@line 15393
     $147 = HEAP32[800] | 0; //@line 15395
     if ($T_0_i >>> 0 < $147 >>> 0) {
      _abort(); //@line 15398
      return 0; //@line 15398
     }
     if ($145 >>> 0 < $147 >>> 0) {
      _abort(); //@line 15404
      return 0; //@line 15404
     } else {
      HEAP32[$145 + 12 >> 2] = $129; //@line 15408
      HEAP32[$fd412_i >> 2] = $129; //@line 15409
      HEAP32[$89 + ($and144 + 8) >> 2] = $145; //@line 15413
      HEAP32[$89 + ($and144 + 12) >> 2] = $T_0_i; //@line 15417
      HEAP32[$89 + ($and144 + 24) >> 2] = 0; //@line 15421
      break;
     }
    }
   } while (0);
   $add_ptr436_i = $v_3_lcssa_i + 8 | 0; //@line 15426
   if (($add_ptr436_i | 0) == 0) {
    $nb_0 = $and144; //@line 15430
    break;
   } else {
    $mem_0 = $add_ptr436_i; //@line 15433
   }
   return $mem_0 | 0; //@line 15436
  }
 } while (0);
 $153 = HEAP32[798] | 0; //@line 15440
 if ($nb_0 >>> 0 <= $153 >>> 0) {
  $sub159 = $153 - $nb_0 | 0; //@line 15443
  $154 = HEAP32[801] | 0; //@line 15444
  if ($sub159 >>> 0 > 15) {
   $155 = $154; //@line 15447
   HEAP32[801] = $155 + $nb_0; //@line 15450
   HEAP32[798] = $sub159; //@line 15451
   HEAP32[$155 + ($nb_0 + 4) >> 2] = $sub159 | 1; //@line 15456
   HEAP32[$155 + $153 >> 2] = $sub159; //@line 15459
   HEAP32[$154 + 4 >> 2] = $nb_0 | 3; //@line 15462
  } else {
   HEAP32[798] = 0; //@line 15464
   HEAP32[801] = 0; //@line 15465
   HEAP32[$154 + 4 >> 2] = $153 | 3; //@line 15468
   $159 = $154 + ($153 + 4) | 0; //@line 15472
   HEAP32[$159 >> 2] = HEAP32[$159 >> 2] | 1; //@line 15475
  }
  $mem_0 = $154 + 8 | 0; //@line 15479
  return $mem_0 | 0; //@line 15481
 }
 $162 = HEAP32[799] | 0; //@line 15483
 if ($nb_0 >>> 0 < $162 >>> 0) {
  $sub187 = $162 - $nb_0 | 0; //@line 15486
  HEAP32[799] = $sub187; //@line 15487
  $163 = HEAP32[802] | 0; //@line 15488
  $164 = $163; //@line 15489
  HEAP32[802] = $164 + $nb_0; //@line 15492
  HEAP32[$164 + ($nb_0 + 4) >> 2] = $sub187 | 1; //@line 15497
  HEAP32[$163 + 4 >> 2] = $nb_0 | 3; //@line 15500
  $mem_0 = $163 + 8 | 0; //@line 15503
  return $mem_0 | 0; //@line 15505
 }
 do {
  if ((HEAP32[632] | 0) == 0) {
   $call_i_i = _sysconf(30) | 0; //@line 15511
   if (($call_i_i - 1 & $call_i_i | 0) == 0) {
    HEAP32[634] = $call_i_i; //@line 15516
    HEAP32[633] = $call_i_i; //@line 15517
    HEAP32[635] = -1; //@line 15518
    HEAP32[636] = -1; //@line 15519
    HEAP32[637] = 0; //@line 15520
    HEAP32[907] = 0; //@line 15521
    HEAP32[632] = (_time(0) | 0) & -16 ^ 1431655768; //@line 15525
    break;
   } else {
    _abort(); //@line 15528
    return 0; //@line 15528
   }
  }
 } while (0);
 $add_i149 = $nb_0 + 48 | 0; //@line 15533
 $169 = HEAP32[634] | 0; //@line 15534
 $sub_i150 = $nb_0 + 47 | 0; //@line 15535
 $add9_i = $169 + $sub_i150 | 0; //@line 15536
 $neg_i151 = -$169 | 0; //@line 15537
 $and11_i = $add9_i & $neg_i151; //@line 15538
 if ($and11_i >>> 0 <= $nb_0 >>> 0) {
  $mem_0 = 0; //@line 15541
  return $mem_0 | 0; //@line 15543
 }
 $170 = HEAP32[906] | 0; //@line 15545
 do {
  if (($170 | 0) != 0) {
   $171 = HEAP32[904] | 0; //@line 15549
   $add17_i152 = $171 + $and11_i | 0; //@line 15550
   if ($add17_i152 >>> 0 <= $171 >>> 0 | $add17_i152 >>> 0 > $170 >>> 0) {
    $mem_0 = 0; //@line 15555
   } else {
    break;
   }
   return $mem_0 | 0; //@line 15560
  }
 } while (0);
 L2042 : do {
  if ((HEAP32[907] & 4 | 0) == 0) {
   $173 = HEAP32[802] | 0; //@line 15568
   L2044 : do {
    if (($173 | 0) == 0) {
     label = 1590; //@line 15572
    } else {
     $174 = $173; //@line 15574
     $sp_0_i_i = 3632; //@line 15575
     while (1) {
      $base_i_i = $sp_0_i_i | 0; //@line 15578
      $175 = HEAP32[$base_i_i >> 2] | 0; //@line 15579
      if ($175 >>> 0 <= $174 >>> 0) {
       $size_i_i = $sp_0_i_i + 4 | 0; //@line 15582
       if (($175 + (HEAP32[$size_i_i >> 2] | 0) | 0) >>> 0 > $174 >>> 0) {
        break;
       }
      }
      $177 = HEAP32[$sp_0_i_i + 8 >> 2] | 0; //@line 15591
      if (($177 | 0) == 0) {
       label = 1590; //@line 15594
       break L2044;
      } else {
       $sp_0_i_i = $177; //@line 15597
      }
     }
     if (($sp_0_i_i | 0) == 0) {
      label = 1590; //@line 15602
      break;
     }
     $and77_i = $add9_i - (HEAP32[799] | 0) & $neg_i151; //@line 15607
     if ($and77_i >>> 0 >= 2147483647) {
      $tsize_0758385_i = 0; //@line 15610
      break;
     }
     $call80_i = _sbrk($and77_i | 0) | 0; //@line 15613
     $cmp82_i = ($call80_i | 0) == ((HEAP32[$base_i_i >> 2] | 0) + (HEAP32[$size_i_i >> 2] | 0) | 0); //@line 15617
     $tbase_0_i = $cmp82_i ? $call80_i : -1; //@line 15620
     $tsize_0_i = $cmp82_i ? $and77_i : 0; //@line 15620
     $br_0_i = $call80_i; //@line 15620
     $ssize_1_i = $and77_i; //@line 15620
     label = 1599; //@line 15621
    }
   } while (0);
   do {
    if ((label | 0) == 1590) {
     $call34_i = _sbrk(0) | 0; //@line 15626
     if (($call34_i | 0) == -1) {
      $tsize_0758385_i = 0; //@line 15629
      break;
     }
     $178 = $call34_i; //@line 15632
     $179 = HEAP32[633] | 0; //@line 15633
     $sub38_i = $179 - 1 | 0; //@line 15634
     if (($sub38_i & $178 | 0) == 0) {
      $ssize_0_i = $and11_i; //@line 15638
     } else {
      $ssize_0_i = $and11_i - $178 + ($sub38_i + $178 & -$179) | 0; //@line 15645
     }
     $180 = HEAP32[904] | 0; //@line 15648
     $add51_i = $180 + $ssize_0_i | 0; //@line 15649
     if (!($ssize_0_i >>> 0 > $nb_0 >>> 0 & $ssize_0_i >>> 0 < 2147483647)) {
      $tsize_0758385_i = 0; //@line 15654
      break;
     }
     $181 = HEAP32[906] | 0; //@line 15657
     if (($181 | 0) != 0) {
      if ($add51_i >>> 0 <= $180 >>> 0 | $add51_i >>> 0 > $181 >>> 0) {
       $tsize_0758385_i = 0; //@line 15664
       break;
      }
     }
     $call65_i = _sbrk($ssize_0_i | 0) | 0; //@line 15668
     $cmp66_i160 = ($call65_i | 0) == ($call34_i | 0); //@line 15669
     $tbase_0_i = $cmp66_i160 ? $call34_i : -1; //@line 15672
     $tsize_0_i = $cmp66_i160 ? $ssize_0_i : 0; //@line 15672
     $br_0_i = $call65_i; //@line 15672
     $ssize_1_i = $ssize_0_i; //@line 15672
     label = 1599; //@line 15673
    }
   } while (0);
   L2064 : do {
    if ((label | 0) == 1599) {
     $sub109_i = -$ssize_1_i | 0; //@line 15682
     if (($tbase_0_i | 0) != -1) {
      $tsize_291_i = $tsize_0_i; //@line 15685
      $tbase_292_i = $tbase_0_i; //@line 15685
      label = 1610; //@line 15686
      break L2042;
     }
     do {
      if (($br_0_i | 0) != -1 & $ssize_1_i >>> 0 < 2147483647 & $ssize_1_i >>> 0 < $add_i149 >>> 0) {
       $185 = HEAP32[634] | 0; //@line 15696
       $and101_i = $sub_i150 - $ssize_1_i + $185 & -$185; //@line 15700
       if ($and101_i >>> 0 >= 2147483647) {
        $ssize_2_i = $ssize_1_i; //@line 15703
        break;
       }
       if ((_sbrk($and101_i | 0) | 0) == -1) {
        _sbrk($sub109_i | 0) | 0; //@line 15709
        $tsize_0758385_i = $tsize_0_i; //@line 15710
        break L2064;
       } else {
        $ssize_2_i = $and101_i + $ssize_1_i | 0; //@line 15714
        break;
       }
      } else {
       $ssize_2_i = $ssize_1_i; //@line 15718
      }
     } while (0);
     if (($br_0_i | 0) == -1) {
      $tsize_0758385_i = $tsize_0_i; //@line 15724
     } else {
      $tsize_291_i = $ssize_2_i; //@line 15726
      $tbase_292_i = $br_0_i; //@line 15726
      label = 1610; //@line 15727
      break L2042;
     }
    }
   } while (0);
   HEAP32[907] = HEAP32[907] | 4; //@line 15735
   $tsize_1_i = $tsize_0758385_i; //@line 15736
   label = 1607; //@line 15737
  } else {
   $tsize_1_i = 0; //@line 15739
   label = 1607; //@line 15740
  }
 } while (0);
 do {
  if ((label | 0) == 1607) {
   if ($and11_i >>> 0 >= 2147483647) {
    break;
   }
   $call128_i = _sbrk($and11_i | 0) | 0; //@line 15750
   $call129_i = _sbrk(0) | 0; //@line 15751
   if (!(($call129_i | 0) != -1 & ($call128_i | 0) != -1 & $call128_i >>> 0 < $call129_i >>> 0)) {
    break;
   }
   $sub_ptr_sub_i = $call129_i - $call128_i | 0; //@line 15762
   $cmp138_i166 = $sub_ptr_sub_i >>> 0 > ($nb_0 + 40 | 0) >>> 0; //@line 15764
   $call128_tbase_1_i = $cmp138_i166 ? $call128_i : -1; //@line 15766
   if (($call128_tbase_1_i | 0) != -1) {
    $tsize_291_i = $cmp138_i166 ? $sub_ptr_sub_i : $tsize_1_i; //@line 15769
    $tbase_292_i = $call128_tbase_1_i; //@line 15769
    label = 1610; //@line 15770
   }
  }
 } while (0);
 do {
  if ((label | 0) == 1610) {
   $add147_i = (HEAP32[904] | 0) + $tsize_291_i | 0; //@line 15779
   HEAP32[904] = $add147_i; //@line 15780
   if ($add147_i >>> 0 > (HEAP32[905] | 0) >>> 0) {
    HEAP32[905] = $add147_i; //@line 15784
   }
   $189 = HEAP32[802] | 0; //@line 15786
   L2084 : do {
    if (($189 | 0) == 0) {
     $190 = HEAP32[800] | 0; //@line 15790
     if (($190 | 0) == 0 | $tbase_292_i >>> 0 < $190 >>> 0) {
      HEAP32[800] = $tbase_292_i; //@line 15795
     }
     HEAP32[908] = $tbase_292_i; //@line 15797
     HEAP32[909] = $tsize_291_i; //@line 15798
     HEAP32[911] = 0; //@line 15799
     HEAP32[805] = HEAP32[632]; //@line 15801
     HEAP32[804] = -1; //@line 15802
     $i_02_i_i = 0; //@line 15803
     do {
      $shl_i_i = $i_02_i_i << 1; //@line 15806
      $192 = 3224 + ($shl_i_i << 2) | 0; //@line 15808
      HEAP32[3224 + ($shl_i_i + 3 << 2) >> 2] = $192; //@line 15811
      HEAP32[3224 + ($shl_i_i + 2 << 2) >> 2] = $192; //@line 15814
      $i_02_i_i = $i_02_i_i + 1 | 0; //@line 15815
     } while ($i_02_i_i >>> 0 < 32);
     $195 = $tbase_292_i + 8 | 0; //@line 15825
     if (($195 & 7 | 0) == 0) {
      $cond_i_i = 0; //@line 15829
     } else {
      $cond_i_i = -$195 & 7; //@line 15833
     }
     $sub5_i_i = $tsize_291_i - 40 - $cond_i_i | 0; //@line 15838
     HEAP32[802] = $tbase_292_i + $cond_i_i; //@line 15839
     HEAP32[799] = $sub5_i_i; //@line 15840
     HEAP32[$tbase_292_i + ($cond_i_i + 4) >> 2] = $sub5_i_i | 1; //@line 15845
     HEAP32[$tbase_292_i + ($tsize_291_i - 36) >> 2] = 40; //@line 15849
     HEAP32[803] = HEAP32[636]; //@line 15851
    } else {
     $sp_0105_i = 3632; //@line 15853
     while (1) {
      $201 = HEAP32[$sp_0105_i >> 2] | 0; //@line 15857
      $size185_i = $sp_0105_i + 4 | 0; //@line 15858
      $202 = HEAP32[$size185_i >> 2] | 0; //@line 15859
      if (($tbase_292_i | 0) == ($201 + $202 | 0)) {
       label = 1622; //@line 15863
       break;
      }
      $203 = HEAP32[$sp_0105_i + 8 >> 2] | 0; //@line 15867
      if (($203 | 0) == 0) {
       break;
      } else {
       $sp_0105_i = $203; //@line 15872
      }
     }
     do {
      if ((label | 0) == 1622) {
       if ((HEAP32[$sp_0105_i + 12 >> 2] & 8 | 0) != 0) {
        break;
       }
       $205 = $189; //@line 15884
       if (!($205 >>> 0 >= $201 >>> 0 & $205 >>> 0 < $tbase_292_i >>> 0)) {
        break;
       }
       HEAP32[$size185_i >> 2] = $202 + $tsize_291_i; //@line 15892
       $206 = HEAP32[802] | 0; //@line 15893
       $add212_i = (HEAP32[799] | 0) + $tsize_291_i | 0; //@line 15895
       $208 = $206; //@line 15896
       $209 = $206 + 8 | 0; //@line 15898
       if (($209 & 7 | 0) == 0) {
        $cond_i28_i = 0; //@line 15902
       } else {
        $cond_i28_i = -$209 & 7; //@line 15906
       }
       $sub5_i30_i = $add212_i - $cond_i28_i | 0; //@line 15911
       HEAP32[802] = $208 + $cond_i28_i; //@line 15912
       HEAP32[799] = $sub5_i30_i; //@line 15913
       HEAP32[$208 + ($cond_i28_i + 4) >> 2] = $sub5_i30_i | 1; //@line 15918
       HEAP32[$208 + ($add212_i + 4) >> 2] = 40; //@line 15922
       HEAP32[803] = HEAP32[636]; //@line 15924
       break L2084;
      }
     } while (0);
     if ($tbase_292_i >>> 0 < (HEAP32[800] | 0) >>> 0) {
      HEAP32[800] = $tbase_292_i; //@line 15931
     }
     $add_ptr224_i = $tbase_292_i + $tsize_291_i | 0; //@line 15933
     $sp_1101_i = 3632; //@line 15934
     while (1) {
      $base223_i = $sp_1101_i | 0; //@line 15937
      if ((HEAP32[$base223_i >> 2] | 0) == ($add_ptr224_i | 0)) {
       label = 1632; //@line 15941
       break;
      }
      $217 = HEAP32[$sp_1101_i + 8 >> 2] | 0; //@line 15945
      if (($217 | 0) == 0) {
       break;
      } else {
       $sp_1101_i = $217; //@line 15950
      }
     }
     do {
      if ((label | 0) == 1632) {
       if ((HEAP32[$sp_1101_i + 12 >> 2] & 8 | 0) != 0) {
        break;
       }
       HEAP32[$base223_i >> 2] = $tbase_292_i; //@line 15962
       $size242_i = $sp_1101_i + 4 | 0; //@line 15963
       HEAP32[$size242_i >> 2] = (HEAP32[$size242_i >> 2] | 0) + $tsize_291_i; //@line 15966
       $220 = $tbase_292_i + 8 | 0; //@line 15968
       if (($220 & 7 | 0) == 0) {
        $cond_i43_i = 0; //@line 15972
       } else {
        $cond_i43_i = -$220 & 7; //@line 15976
       }
       $222 = $tbase_292_i + ($tsize_291_i + 8) | 0; //@line 15982
       if (($222 & 7 | 0) == 0) {
        $cond15_i_i = 0; //@line 15986
       } else {
        $cond15_i_i = -$222 & 7; //@line 15990
       }
       $add_ptr16_i_i = $tbase_292_i + ($cond15_i_i + $tsize_291_i) | 0; //@line 15994
       $224 = $add_ptr16_i_i; //@line 15995
       $add_ptr4_sum_i50_i = $cond_i43_i + $nb_0 | 0; //@line 15999
       $add_ptr17_i_i = $tbase_292_i + $add_ptr4_sum_i50_i | 0; //@line 16000
       $225 = $add_ptr17_i_i; //@line 16001
       $sub18_i_i = $add_ptr16_i_i - ($tbase_292_i + $cond_i43_i) - $nb_0 | 0; //@line 16002
       HEAP32[$tbase_292_i + ($cond_i43_i + 4) >> 2] = $nb_0 | 3; //@line 16007
       do {
        if (($224 | 0) == (HEAP32[802] | 0)) {
         $add_i_i = (HEAP32[799] | 0) + $sub18_i_i | 0; //@line 16013
         HEAP32[799] = $add_i_i; //@line 16014
         HEAP32[802] = $225; //@line 16015
         HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 4) >> 2] = $add_i_i | 1; //@line 16020
        } else {
         if (($224 | 0) == (HEAP32[801] | 0)) {
          $add26_i_i = (HEAP32[798] | 0) + $sub18_i_i | 0; //@line 16026
          HEAP32[798] = $add26_i_i; //@line 16027
          HEAP32[801] = $225; //@line 16028
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 4) >> 2] = $add26_i_i | 1; //@line 16033
          HEAP32[$tbase_292_i + ($add26_i_i + $add_ptr4_sum_i50_i) >> 2] = $add26_i_i; //@line 16037
          break;
         }
         $add_ptr16_sum_i_i = $tsize_291_i + 4 | 0; //@line 16040
         $234 = HEAP32[$tbase_292_i + ($add_ptr16_sum_i_i + $cond15_i_i) >> 2] | 0; //@line 16044
         if (($234 & 3 | 0) == 1) {
          $and37_i_i = $234 & -8; //@line 16048
          $shr_i55_i = $234 >>> 3; //@line 16049
          L2129 : do {
           if ($234 >>> 0 < 256) {
            $236 = HEAP32[$tbase_292_i + (($cond15_i_i | 8) + $tsize_291_i) >> 2] | 0; //@line 16057
            $238 = HEAP32[$tbase_292_i + ($tsize_291_i + 12 + $cond15_i_i) >> 2] | 0; //@line 16062
            $239 = 3224 + ($shr_i55_i << 1 << 2) | 0; //@line 16065
            do {
             if (($236 | 0) != ($239 | 0)) {
              if ($236 >>> 0 < (HEAP32[800] | 0) >>> 0) {
               _abort(); //@line 16073
               return 0; //@line 16073
              }
              if ((HEAP32[$236 + 12 >> 2] | 0) == ($224 | 0)) {
               break;
              }
              _abort(); //@line 16082
              return 0; //@line 16082
             }
            } while (0);
            if (($238 | 0) == ($236 | 0)) {
             HEAP32[796] = HEAP32[796] & ~(1 << $shr_i55_i); //@line 16092
             break;
            }
            do {
             if (($238 | 0) == ($239 | 0)) {
              $fd68_pre_phi_i_i = $238 + 8 | 0; //@line 16099
             } else {
              if ($238 >>> 0 < (HEAP32[800] | 0) >>> 0) {
               _abort(); //@line 16105
               return 0; //@line 16105
              }
              $fd59_i_i = $238 + 8 | 0; //@line 16108
              if ((HEAP32[$fd59_i_i >> 2] | 0) == ($224 | 0)) {
               $fd68_pre_phi_i_i = $fd59_i_i; //@line 16112
               break;
              }
              _abort(); //@line 16115
              return 0; //@line 16115
             }
            } while (0);
            HEAP32[$236 + 12 >> 2] = $238; //@line 16121
            HEAP32[$fd68_pre_phi_i_i >> 2] = $236; //@line 16122
           } else {
            $247 = $add_ptr16_i_i; //@line 16124
            $249 = HEAP32[$tbase_292_i + (($cond15_i_i | 24) + $tsize_291_i) >> 2] | 0; //@line 16129
            $251 = HEAP32[$tbase_292_i + ($tsize_291_i + 12 + $cond15_i_i) >> 2] | 0; //@line 16134
            do {
             if (($251 | 0) == ($247 | 0)) {
              $add_ptr16_sum56_i_i = $cond15_i_i | 16; //@line 16138
              $258 = $tbase_292_i + ($add_ptr16_sum_i_i + $add_ptr16_sum56_i_i) | 0; //@line 16141
              $259 = HEAP32[$258 >> 2] | 0; //@line 16142
              if (($259 | 0) == 0) {
               $arrayidx99_i_i = $tbase_292_i + ($add_ptr16_sum56_i_i + $tsize_291_i) | 0; //@line 16147
               $260 = HEAP32[$arrayidx99_i_i >> 2] | 0; //@line 16148
               if (($260 | 0) == 0) {
                $R_1_i_i = 0; //@line 16151
                break;
               } else {
                $R_0_i_i = $260; //@line 16154
                $RP_0_i_i = $arrayidx99_i_i; //@line 16154
               }
              } else {
               $R_0_i_i = $259; //@line 16157
               $RP_0_i_i = $258; //@line 16157
              }
              while (1) {
               $arrayidx103_i_i = $R_0_i_i + 20 | 0; //@line 16162
               $261 = HEAP32[$arrayidx103_i_i >> 2] | 0; //@line 16163
               if (($261 | 0) != 0) {
                $R_0_i_i = $261; //@line 16166
                $RP_0_i_i = $arrayidx103_i_i; //@line 16166
                continue;
               }
               $arrayidx107_i_i = $R_0_i_i + 16 | 0; //@line 16169
               $262 = HEAP32[$arrayidx107_i_i >> 2] | 0; //@line 16170
               if (($262 | 0) == 0) {
                break;
               } else {
                $R_0_i_i = $262; //@line 16175
                $RP_0_i_i = $arrayidx107_i_i; //@line 16175
               }
              }
              if ($RP_0_i_i >>> 0 < (HEAP32[800] | 0) >>> 0) {
               _abort(); //@line 16182
               return 0; //@line 16182
              } else {
               HEAP32[$RP_0_i_i >> 2] = 0; //@line 16185
               $R_1_i_i = $R_0_i_i; //@line 16186
               break;
              }
             } else {
              $253 = HEAP32[$tbase_292_i + (($cond15_i_i | 8) + $tsize_291_i) >> 2] | 0; //@line 16194
              if ($253 >>> 0 < (HEAP32[800] | 0) >>> 0) {
               _abort(); //@line 16199
               return 0; //@line 16199
              }
              $bk82_i_i = $253 + 12 | 0; //@line 16202
              if ((HEAP32[$bk82_i_i >> 2] | 0) != ($247 | 0)) {
               _abort(); //@line 16206
               return 0; //@line 16206
              }
              $fd85_i_i = $251 + 8 | 0; //@line 16209
              if ((HEAP32[$fd85_i_i >> 2] | 0) == ($247 | 0)) {
               HEAP32[$bk82_i_i >> 2] = $251; //@line 16213
               HEAP32[$fd85_i_i >> 2] = $253; //@line 16214
               $R_1_i_i = $251; //@line 16215
               break;
              } else {
               _abort(); //@line 16218
               return 0; //@line 16218
              }
             }
            } while (0);
            if (($249 | 0) == 0) {
             break;
            }
            $265 = $tbase_292_i + ($tsize_291_i + 28 + $cond15_i_i) | 0; //@line 16231
            $arrayidx123_i_i = 3488 + (HEAP32[$265 >> 2] << 2) | 0; //@line 16233
            do {
             if (($247 | 0) == (HEAP32[$arrayidx123_i_i >> 2] | 0)) {
              HEAP32[$arrayidx123_i_i >> 2] = $R_1_i_i; //@line 16238
              if (($R_1_i_i | 0) != 0) {
               break;
              }
              HEAP32[797] = HEAP32[797] & ~(1 << HEAP32[$265 >> 2]); //@line 16248
              break L2129;
             } else {
              if ($249 >>> 0 < (HEAP32[800] | 0) >>> 0) {
               _abort(); //@line 16255
               return 0; //@line 16255
              }
              $arrayidx143_i_i = $249 + 16 | 0; //@line 16258
              if ((HEAP32[$arrayidx143_i_i >> 2] | 0) == ($247 | 0)) {
               HEAP32[$arrayidx143_i_i >> 2] = $R_1_i_i; //@line 16262
              } else {
               HEAP32[$249 + 20 >> 2] = $R_1_i_i; //@line 16265
              }
              if (($R_1_i_i | 0) == 0) {
               break L2129;
              }
             }
            } while (0);
            if ($R_1_i_i >>> 0 < (HEAP32[800] | 0) >>> 0) {
             _abort(); //@line 16277
             return 0; //@line 16277
            }
            HEAP32[$R_1_i_i + 24 >> 2] = $249; //@line 16281
            $add_ptr16_sum2728_i_i = $cond15_i_i | 16; //@line 16282
            $275 = HEAP32[$tbase_292_i + ($add_ptr16_sum2728_i_i + $tsize_291_i) >> 2] | 0; //@line 16286
            do {
             if (($275 | 0) != 0) {
              if ($275 >>> 0 < (HEAP32[800] | 0) >>> 0) {
               _abort(); //@line 16294
               return 0; //@line 16294
              } else {
               HEAP32[$R_1_i_i + 16 >> 2] = $275; //@line 16298
               HEAP32[$275 + 24 >> 2] = $R_1_i_i; //@line 16300
               break;
              }
             }
            } while (0);
            $279 = HEAP32[$tbase_292_i + ($add_ptr16_sum_i_i + $add_ptr16_sum2728_i_i) >> 2] | 0; //@line 16308
            if (($279 | 0) == 0) {
             break;
            }
            if ($279 >>> 0 < (HEAP32[800] | 0) >>> 0) {
             _abort(); //@line 16317
             return 0; //@line 16317
            } else {
             HEAP32[$R_1_i_i + 20 >> 2] = $279; //@line 16321
             HEAP32[$279 + 24 >> 2] = $R_1_i_i; //@line 16323
             break;
            }
           }
          } while (0);
          $oldfirst_0_i_i = $tbase_292_i + (($and37_i_i | $cond15_i_i) + $tsize_291_i) | 0; //@line 16333
          $qsize_0_i_i = $and37_i_i + $sub18_i_i | 0; //@line 16333
         } else {
          $oldfirst_0_i_i = $224; //@line 16335
          $qsize_0_i_i = $sub18_i_i; //@line 16335
         }
         $head208_i_i = $oldfirst_0_i_i + 4 | 0; //@line 16339
         HEAP32[$head208_i_i >> 2] = HEAP32[$head208_i_i >> 2] & -2; //@line 16342
         HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 4) >> 2] = $qsize_0_i_i | 1; //@line 16347
         HEAP32[$tbase_292_i + ($qsize_0_i_i + $add_ptr4_sum_i50_i) >> 2] = $qsize_0_i_i; //@line 16351
         $shr214_i_i = $qsize_0_i_i >>> 3; //@line 16352
         if ($qsize_0_i_i >>> 0 < 256) {
          $shl221_i_i = $shr214_i_i << 1; //@line 16355
          $285 = 3224 + ($shl221_i_i << 2) | 0; //@line 16357
          $286 = HEAP32[796] | 0; //@line 16358
          $shl226_i_i = 1 << $shr214_i_i; //@line 16359
          do {
           if (($286 & $shl226_i_i | 0) == 0) {
            HEAP32[796] = $286 | $shl226_i_i; //@line 16365
            $F224_0_i_i = $285; //@line 16368
            $_pre_phi_i68_i = 3224 + ($shl221_i_i + 2 << 2) | 0; //@line 16368
           } else {
            $287 = 3224 + ($shl221_i_i + 2 << 2) | 0; //@line 16371
            $288 = HEAP32[$287 >> 2] | 0; //@line 16372
            if ($288 >>> 0 >= (HEAP32[800] | 0) >>> 0) {
             $F224_0_i_i = $288; //@line 16377
             $_pre_phi_i68_i = $287; //@line 16377
             break;
            }
            _abort(); //@line 16380
            return 0; //@line 16380
           }
          } while (0);
          HEAP32[$_pre_phi_i68_i >> 2] = $225; //@line 16386
          HEAP32[$F224_0_i_i + 12 >> 2] = $225; //@line 16388
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 8) >> 2] = $F224_0_i_i; //@line 16392
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 12) >> 2] = $285; //@line 16396
          break;
         }
         $293 = $add_ptr17_i_i; //@line 16399
         $shr253_i_i = $qsize_0_i_i >>> 8; //@line 16400
         do {
          if (($shr253_i_i | 0) == 0) {
           $I252_0_i_i = 0; //@line 16404
          } else {
           if ($qsize_0_i_i >>> 0 > 16777215) {
            $I252_0_i_i = 31; //@line 16408
            break;
           }
           $and264_i_i = ($shr253_i_i + 1048320 | 0) >>> 16 & 8; //@line 16413
           $shl265_i_i = $shr253_i_i << $and264_i_i; //@line 16414
           $and268_i_i = ($shl265_i_i + 520192 | 0) >>> 16 & 4; //@line 16417
           $shl270_i_i = $shl265_i_i << $and268_i_i; //@line 16419
           $and273_i_i = ($shl270_i_i + 245760 | 0) >>> 16 & 2; //@line 16422
           $add278_i_i = 14 - ($and268_i_i | $and264_i_i | $and273_i_i) + ($shl270_i_i << $and273_i_i >>> 15) | 0; //@line 16427
           $I252_0_i_i = $qsize_0_i_i >>> (($add278_i_i + 7 | 0) >>> 0) & 1 | $add278_i_i << 1; //@line 16433
          }
         } while (0);
         $arrayidx287_i_i = 3488 + ($I252_0_i_i << 2) | 0; //@line 16437
         HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 28) >> 2] = $I252_0_i_i; //@line 16441
         HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 20) >> 2] = 0; //@line 16447
         HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 16) >> 2] = 0; //@line 16449
         $296 = HEAP32[797] | 0; //@line 16450
         $shl294_i_i = 1 << $I252_0_i_i; //@line 16451
         if (($296 & $shl294_i_i | 0) == 0) {
          HEAP32[797] = $296 | $shl294_i_i; //@line 16456
          HEAP32[$arrayidx287_i_i >> 2] = $293; //@line 16457
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 24) >> 2] = $arrayidx287_i_i; //@line 16462
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 12) >> 2] = $293; //@line 16466
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 8) >> 2] = $293; //@line 16470
          break;
         }
         if (($I252_0_i_i | 0) == 31) {
          $cond315_i_i = 0; //@line 16476
         } else {
          $cond315_i_i = 25 - ($I252_0_i_i >>> 1) | 0; //@line 16480
         }
         $K305_0_i_i = $qsize_0_i_i << $cond315_i_i; //@line 16484
         $T_0_i69_i = HEAP32[$arrayidx287_i_i >> 2] | 0; //@line 16484
         while (1) {
          if ((HEAP32[$T_0_i69_i + 4 >> 2] & -8 | 0) == ($qsize_0_i_i | 0)) {
           break;
          }
          $arrayidx325_i_i = $T_0_i69_i + 16 + ($K305_0_i_i >>> 31 << 2) | 0; //@line 16496
          $303 = HEAP32[$arrayidx325_i_i >> 2] | 0; //@line 16497
          if (($303 | 0) == 0) {
           label = 1705; //@line 16501
           break;
          } else {
           $K305_0_i_i = $K305_0_i_i << 1; //@line 16504
           $T_0_i69_i = $303; //@line 16504
          }
         }
         if ((label | 0) == 1705) {
          if ($arrayidx325_i_i >>> 0 < (HEAP32[800] | 0) >>> 0) {
           _abort(); //@line 16512
           return 0; //@line 16512
          } else {
           HEAP32[$arrayidx325_i_i >> 2] = $293; //@line 16515
           HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 24) >> 2] = $T_0_i69_i; //@line 16519
           HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 12) >> 2] = $293; //@line 16523
           HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 8) >> 2] = $293; //@line 16527
           break;
          }
         }
         $fd344_i_i = $T_0_i69_i + 8 | 0; //@line 16531
         $309 = HEAP32[$fd344_i_i >> 2] | 0; //@line 16532
         $311 = HEAP32[800] | 0; //@line 16534
         if ($T_0_i69_i >>> 0 < $311 >>> 0) {
          _abort(); //@line 16537
          return 0; //@line 16537
         }
         if ($309 >>> 0 < $311 >>> 0) {
          _abort(); //@line 16543
          return 0; //@line 16543
         } else {
          HEAP32[$309 + 12 >> 2] = $293; //@line 16547
          HEAP32[$fd344_i_i >> 2] = $293; //@line 16548
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 8) >> 2] = $309; //@line 16552
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 12) >> 2] = $T_0_i69_i; //@line 16556
          HEAP32[$tbase_292_i + ($add_ptr4_sum_i50_i + 24) >> 2] = 0; //@line 16560
          break;
         }
        }
       } while (0);
       $mem_0 = $tbase_292_i + ($cond_i43_i | 8) | 0; //@line 16567
       return $mem_0 | 0; //@line 16569
      }
     } while (0);
     $316 = $189; //@line 16572
     $sp_0_i_i_i = 3632; //@line 16573
     while (1) {
      $317 = HEAP32[$sp_0_i_i_i >> 2] | 0; //@line 16577
      if ($317 >>> 0 <= $316 >>> 0) {
       $318 = HEAP32[$sp_0_i_i_i + 4 >> 2] | 0; //@line 16581
       $add_ptr_i_i_i = $317 + $318 | 0; //@line 16582
       if ($add_ptr_i_i_i >>> 0 > $316 >>> 0) {
        break;
       }
      }
      $sp_0_i_i_i = HEAP32[$sp_0_i_i_i + 8 >> 2] | 0; //@line 16590
     }
     $320 = $317 + ($318 - 39) | 0; //@line 16595
     if (($320 & 7 | 0) == 0) {
      $cond_i18_i = 0; //@line 16599
     } else {
      $cond_i18_i = -$320 & 7; //@line 16603
     }
     $add_ptr7_i_i = $317 + ($318 - 47 + $cond_i18_i) | 0; //@line 16607
     $cond13_i_i = $add_ptr7_i_i >>> 0 < ($189 + 16 | 0) >>> 0 ? $316 : $add_ptr7_i_i; //@line 16611
     $add_ptr14_i_i = $cond13_i_i + 8 | 0; //@line 16612
     $323 = $tbase_292_i + 8 | 0; //@line 16616
     if (($323 & 7 | 0) == 0) {
      $cond_i_i_i = 0; //@line 16620
     } else {
      $cond_i_i_i = -$323 & 7; //@line 16624
     }
     $sub5_i_i_i = $tsize_291_i - 40 - $cond_i_i_i | 0; //@line 16629
     HEAP32[802] = $tbase_292_i + $cond_i_i_i; //@line 16630
     HEAP32[799] = $sub5_i_i_i; //@line 16631
     HEAP32[$tbase_292_i + ($cond_i_i_i + 4) >> 2] = $sub5_i_i_i | 1; //@line 16636
     HEAP32[$tbase_292_i + ($tsize_291_i - 36) >> 2] = 40; //@line 16640
     HEAP32[803] = HEAP32[636]; //@line 16642
     HEAP32[$cond13_i_i + 4 >> 2] = 27; //@line 16645
     HEAP32[$add_ptr14_i_i >> 2] = HEAP32[908]; //@line 16646
     HEAP32[$add_ptr14_i_i + 4 >> 2] = HEAP32[909]; //@line 16646
     HEAP32[$add_ptr14_i_i + 8 >> 2] = HEAP32[910]; //@line 16646
     HEAP32[$add_ptr14_i_i + 12 >> 2] = HEAP32[911]; //@line 16646
     HEAP32[908] = $tbase_292_i; //@line 16647
     HEAP32[909] = $tsize_291_i; //@line 16648
     HEAP32[911] = 0; //@line 16649
     HEAP32[910] = $add_ptr14_i_i; //@line 16650
     $330 = $cond13_i_i + 28 | 0; //@line 16652
     HEAP32[$330 >> 2] = 7; //@line 16653
     if (($cond13_i_i + 32 | 0) >>> 0 < $add_ptr_i_i_i >>> 0) {
      $add_ptr2416_i_i = $330; //@line 16657
      while (1) {
       $332 = $add_ptr2416_i_i + 4 | 0; //@line 16660
       HEAP32[$332 >> 2] = 7; //@line 16661
       if (($add_ptr2416_i_i + 8 | 0) >>> 0 < $add_ptr_i_i_i >>> 0) {
        $add_ptr2416_i_i = $332; //@line 16666
       } else {
        break;
       }
      }
     }
     if (($cond13_i_i | 0) == ($316 | 0)) {
      break;
     }
     $sub_ptr_sub_i_i = $cond13_i_i - $189 | 0; //@line 16678
     $335 = $316 + ($sub_ptr_sub_i_i + 4) | 0; //@line 16682
     HEAP32[$335 >> 2] = HEAP32[$335 >> 2] & -2; //@line 16685
     HEAP32[$189 + 4 >> 2] = $sub_ptr_sub_i_i | 1; //@line 16688
     HEAP32[$316 + $sub_ptr_sub_i_i >> 2] = $sub_ptr_sub_i_i; //@line 16690
     $shr_i_i = $sub_ptr_sub_i_i >>> 3; //@line 16691
     if ($sub_ptr_sub_i_i >>> 0 < 256) {
      $shl_i21_i = $shr_i_i << 1; //@line 16694
      $337 = 3224 + ($shl_i21_i << 2) | 0; //@line 16696
      $338 = HEAP32[796] | 0; //@line 16697
      $shl39_i_i = 1 << $shr_i_i; //@line 16698
      do {
       if (($338 & $shl39_i_i | 0) == 0) {
        HEAP32[796] = $338 | $shl39_i_i; //@line 16704
        $F_0_i_i = $337; //@line 16707
        $_pre_phi_i_i = 3224 + ($shl_i21_i + 2 << 2) | 0; //@line 16707
       } else {
        $339 = 3224 + ($shl_i21_i + 2 << 2) | 0; //@line 16710
        $340 = HEAP32[$339 >> 2] | 0; //@line 16711
        if ($340 >>> 0 >= (HEAP32[800] | 0) >>> 0) {
         $F_0_i_i = $340; //@line 16716
         $_pre_phi_i_i = $339; //@line 16716
         break;
        }
        _abort(); //@line 16719
        return 0; //@line 16719
       }
      } while (0);
      HEAP32[$_pre_phi_i_i >> 2] = $189; //@line 16725
      HEAP32[$F_0_i_i + 12 >> 2] = $189; //@line 16727
      HEAP32[$189 + 8 >> 2] = $F_0_i_i; //@line 16729
      HEAP32[$189 + 12 >> 2] = $337; //@line 16731
      break;
     }
     $343 = $189; //@line 16734
     $shr58_i_i = $sub_ptr_sub_i_i >>> 8; //@line 16735
     do {
      if (($shr58_i_i | 0) == 0) {
       $I57_0_i_i = 0; //@line 16739
      } else {
       if ($sub_ptr_sub_i_i >>> 0 > 16777215) {
        $I57_0_i_i = 31; //@line 16743
        break;
       }
       $and69_i_i = ($shr58_i_i + 1048320 | 0) >>> 16 & 8; //@line 16748
       $shl70_i_i = $shr58_i_i << $and69_i_i; //@line 16749
       $and73_i_i = ($shl70_i_i + 520192 | 0) >>> 16 & 4; //@line 16752
       $shl75_i_i = $shl70_i_i << $and73_i_i; //@line 16754
       $and78_i_i = ($shl75_i_i + 245760 | 0) >>> 16 & 2; //@line 16757
       $add83_i_i = 14 - ($and73_i_i | $and69_i_i | $and78_i_i) + ($shl75_i_i << $and78_i_i >>> 15) | 0; //@line 16762
       $I57_0_i_i = $sub_ptr_sub_i_i >>> (($add83_i_i + 7 | 0) >>> 0) & 1 | $add83_i_i << 1; //@line 16768
      }
     } while (0);
     $arrayidx91_i_i = 3488 + ($I57_0_i_i << 2) | 0; //@line 16772
     HEAP32[$189 + 28 >> 2] = $I57_0_i_i; //@line 16775
     HEAP32[$189 + 20 >> 2] = 0; //@line 16777
     HEAP32[$189 + 16 >> 2] = 0; //@line 16779
     $345 = HEAP32[797] | 0; //@line 16780
     $shl95_i_i = 1 << $I57_0_i_i; //@line 16781
     if (($345 & $shl95_i_i | 0) == 0) {
      HEAP32[797] = $345 | $shl95_i_i; //@line 16786
      HEAP32[$arrayidx91_i_i >> 2] = $343; //@line 16787
      HEAP32[$189 + 24 >> 2] = $arrayidx91_i_i; //@line 16790
      HEAP32[$189 + 12 >> 2] = $189; //@line 16792
      HEAP32[$189 + 8 >> 2] = $189; //@line 16794
      break;
     }
     if (($I57_0_i_i | 0) == 31) {
      $cond115_i_i = 0; //@line 16800
     } else {
      $cond115_i_i = 25 - ($I57_0_i_i >>> 1) | 0; //@line 16804
     }
     $K105_0_i_i = $sub_ptr_sub_i_i << $cond115_i_i; //@line 16808
     $T_0_i_i = HEAP32[$arrayidx91_i_i >> 2] | 0; //@line 16808
     while (1) {
      if ((HEAP32[$T_0_i_i + 4 >> 2] & -8 | 0) == ($sub_ptr_sub_i_i | 0)) {
       break;
      }
      $arrayidx126_i_i = $T_0_i_i + 16 + ($K105_0_i_i >>> 31 << 2) | 0; //@line 16820
      $348 = HEAP32[$arrayidx126_i_i >> 2] | 0; //@line 16821
      if (($348 | 0) == 0) {
       label = 1740; //@line 16825
       break;
      } else {
       $K105_0_i_i = $K105_0_i_i << 1; //@line 16828
       $T_0_i_i = $348; //@line 16828
      }
     }
     if ((label | 0) == 1740) {
      if ($arrayidx126_i_i >>> 0 < (HEAP32[800] | 0) >>> 0) {
       _abort(); //@line 16836
       return 0; //@line 16836
      } else {
       HEAP32[$arrayidx126_i_i >> 2] = $343; //@line 16839
       HEAP32[$189 + 24 >> 2] = $T_0_i_i; //@line 16842
       HEAP32[$189 + 12 >> 2] = $189; //@line 16844
       HEAP32[$189 + 8 >> 2] = $189; //@line 16846
       break;
      }
     }
     $fd145_i_i = $T_0_i_i + 8 | 0; //@line 16850
     $351 = HEAP32[$fd145_i_i >> 2] | 0; //@line 16851
     $353 = HEAP32[800] | 0; //@line 16853
     if ($T_0_i_i >>> 0 < $353 >>> 0) {
      _abort(); //@line 16856
      return 0; //@line 16856
     }
     if ($351 >>> 0 < $353 >>> 0) {
      _abort(); //@line 16862
      return 0; //@line 16862
     } else {
      HEAP32[$351 + 12 >> 2] = $343; //@line 16866
      HEAP32[$fd145_i_i >> 2] = $343; //@line 16867
      HEAP32[$189 + 8 >> 2] = $351; //@line 16870
      HEAP32[$189 + 12 >> 2] = $T_0_i_i; //@line 16873
      HEAP32[$189 + 24 >> 2] = 0; //@line 16875
      break;
     }
    }
   } while (0);
   $355 = HEAP32[799] | 0; //@line 16880
   if ($355 >>> 0 <= $nb_0 >>> 0) {
    break;
   }
   $sub253_i = $355 - $nb_0 | 0; //@line 16885
   HEAP32[799] = $sub253_i; //@line 16886
   $356 = HEAP32[802] | 0; //@line 16887
   $357 = $356; //@line 16888
   HEAP32[802] = $357 + $nb_0; //@line 16891
   HEAP32[$357 + ($nb_0 + 4) >> 2] = $sub253_i | 1; //@line 16896
   HEAP32[$356 + 4 >> 2] = $nb_0 | 3; //@line 16899
   $mem_0 = $356 + 8 | 0; //@line 16902
   return $mem_0 | 0; //@line 16904
  }
 } while (0);
 HEAP32[(___errno_location() | 0) >> 2] = 12; //@line 16908
 $mem_0 = 0; //@line 16909
 return $mem_0 | 0; //@line 16911
}
function __SLLeaper_update($self, $dt) {
 $self = $self | 0;
 $dt = +$dt;
 var $bodies = 0, $triggers = 0, $world = 0, $call = 0, $call1 = 0, $position3 = 0, $add_i194 = 0.0, $add3_i195 = 0.0, $7 = 0, $8 = 0, $9$1 = 0, $10 = 0, $11 = 0, $12$1 = 0, $call_1 = 0, $call1_1 = 0, $position3_1 = 0, $add_i194_1 = 0.0, $add3_i195_1 = 0.0, $20 = 0, $21 = 0, $22$1 = 0, $23 = 0, $24 = 0, $25$1 = 0, $call_2 = 0, $call1_2 = 0, $position3_2 = 0, $add_i194_2 = 0.0, $add3_i195_2 = 0.0, $33 = 0, $34 = 0, $35$1 = 0, $36 = 0, $37 = 0, $38$1 = 0, $position7 = 0, $39 = 0, $tmp8_sroa_0_0_insert_insert$1 = 0.0, $state = 0, $_attachedIndices93_pre = 0, $call16 = 0, $indexA_0_load554582 = 0, $indexB_0_load553581 = 0, $lastTouched = 0, $46 = 0, $call20 = 0, $sub_i = 0.0, $sub3_i = 0.0, $conv2_i = 0.0, $49 = 0, $call27 = 0, $sub_i210 = 0.0, $sub3_i211 = 0.0, $nearbyIndex_0_sroa_speculated = 0, $call34 = 0, $call36 = 0.0, $sub = 0.0, $cmp43 = 0, $speedDiff_0 = 0.0, $position48 = 0, $position7246_sroa_0_0_tmp248_idx = 0, $position7246_sroa_0_0_copyload = 0.0, $position7246_sroa_1_4_tmp248_idx561 = 0, $position7246_sroa_1_4_copyload = 0.0, $_sroa_0562_0_tmp250_idx = 0, $_sroa_0562_0_copyload = 0.0, $55 = 0, $sub_i_i259 = 0.0, $sub3_i_i260 = 0.0, $div_i_i265 = 0.0, $call2_i272 = 0.0, $conv = 0.0, $conv55 = 0.0, $conv60 = 0.0, $57 = 0, $tmp61_sroa_0_0_insert_insert$1 = 0.0, $62 = 0, $position7279_sroa_0_0_copyload = 0.0, $position7279_sroa_1_4_copyload = 0.0, $position82282_sroa_0_0_copyload = 0.0, $sub_i_i293 = 0.0, $sub3_i_i294 = 0.0, $div_i_i299 = 0.0, $sub_i309 = 0.0, $add5_i = 0.0, $lastTouched113 = 0, $distance_sroa_1_0_lcssa = 0.0, $lastTouched149 = 0, $i_1601 = 0, $distance_sroa_1_0600 = 0.0, $distance_sroa_0_0599 = 0.0, $69 = 0, $call111 = 0, $72 = 0, $sub_i321 = 0.0, $sub3_i322 = 0.0, $conv116 = 0.0, $distance_sroa_0_1 = 0.0, $distance_sroa_1_1 = 0.0, $inc132 = 0, $i_2596 = 0, $75 = 0, $call147 = 0, $78 = 0, $sub_i329 = 0.0, $sub3_i330 = 0.0, $80 = 0, $i_3 = 0, $82 = 0, $84 = 0, $lastTouched182 = 0, $call179 = 0, $call181 = 0, $90 = 0, $position_i = 0, $position1_09_val_i = 0.0, $position1_110_val_i = 0.0, $sub_i_i347 = 0.0, $sub3_i_i348 = 0.0, $conv2_i_i = 0.0, $92 = 0.0, $94 = 0.0, $div_i_i352 = 0.0, $add_i355 = 0.0, $95 = 0, $tmp_sroa_0_0_insert_insert_i$0 = 0.0, $tmp_sroa_0_0_insert_insert_i$1 = 0.0, $98 = 0, $call179_1 = 0, $call181_1 = 0, $102 = 0, $position_i_1 = 0, $position1_09_val_i_1 = 0.0, $position1_110_val_i_1 = 0.0, $sub_i_i347_1 = 0.0, $sub3_i_i348_1 = 0.0, $conv2_i_i_1 = 0.0, $104 = 0.0, $106 = 0.0, $107 = 0, $110 = 0, $111 = 0, $rotatingOnIndex = 0, $call247 = 0, $lastTouched248 = 0, $115 = 0, $position_i358 = 0, $position1_09_val_i364 = 0.0, $position1_110_val_i366 = 0.0, $sub_i_i367 = 0.0, $sub3_i_i368 = 0.0, $conv2_i_i372 = 0.0, $117 = 0.0, $119 = 0.0, $div_i_i380 = 0.0, $add_i383 = 0.0, $120 = 0, $tmp_sroa_0_0_insert_insert_i391$0 = 0.0, $tmp_sroa_0_0_insert_insert_i391$1 = 0.0, $123 = 0, $cmp251 = 0, $125 = 0, $127 = 0, $130 = 0, $detachedIndexA_0_load580 = 0, $detachedIndexB_0_load579 = 0, $call268 = 0, $position271 = 0, $position7418_sroa_0_0_tmp420_idx = 0, $position7418_sroa_0_0_copyload = 0.0, $position7418_sroa_1_4_tmp420_idx567 = 0, $position7418_sroa_1_4_copyload = 0.0, $_sroa_0568_0_copyload = 0.0, $sub_i_i431 = 0.0, $sub3_i_i432 = 0.0, $div_i_i437 = 0.0, $call2_i444 = 0.0, $position7445_sroa_0_0_copyload = 0.0, $position7445_sroa_1_4_copyload = 0.0, $_sroa_0572_0_copyload = 0.0, $sub_i_i458 = 0.0, $sub3_i_i459 = 0.0, $div_i_i464 = 0.0, $call2_i471 = 0.0, $sub_i474 = 0.0, $sub7_i481 = 0.0, $v_0_i485 = 0.0, $v_1_i490 = 0.0, $call286 = 0.0, $137 = 0, $position290493_sroa_0_0_copyload = 0.0, $position290493_sroa_1_4_copyload = 0.0, $position7496_sroa_0_0_copyload = 0.0, $sub_i_i507 = 0.0, $sub3_i_i508 = 0.0, $div_i_i513 = 0.0, $call294 = 0.0, $sub_i523 = 0.0, $sub7_i530 = 0.0, $v_0_i534 = 0.0, $v_1_i539 = 0.0, $conv_i540 = 0.0, $cond302 = 0, $cond306 = 0, $conv297 = 0.0, $139 = 0, $rotatingOnIndex321_pre_phi = 0, $140 = 0, $detachedIndexA318_0_load578 = 0, $detachedIndexB320_0_load577 = 0, $141 = 0, $position325214_sroa_0_0_copyload = 0.0, $position325214_sroa_1_4_copyload = 0.0, $position7217_sroa_0_0_tmp219_idx = 0, $position7217_sroa_0_0_copyload = 0.0, $position7217_sroa_1_4_tmp219_idx560 = 0, $sub_i_i228 = 0.0, $sub3_i_i229 = 0.0, $div_i_i234 = 0.0, $call331 = 0.0, $call335 = 0, $call338 = 0, $call342 = 0, $position346 = 0, $position347 = 0, $call348 = 0.0, $position7198_sroa_0_0_copyload = 0.0, $position7198_sroa_1_4_copyload = 0.0, $_sroa_0_0_copyload = 0.0, $sub_i_i = 0.0, $sub3_i_i = 0.0, $div_i_i = 0.0, $call2_i = 0.0, $bodyAAngle_0 = 0.0, $bodyBAngle_0 = 0.0, $conv366 = 0.0, $div = 0.0, $conv380 = 0.0, $conv383 = 0.0, $_0170 = 0, $151 = 0, $152 = 0, $tmp384_sroa_0_0_insert_insert$0 = 0.0, $tmp384_sroa_0_0_insert_insert$1 = 0.0, $155 = 0, $conv391 = 0.0, $conv394 = 0.0, $156 = 0, $tmp395_sroa_0_0_insert_insert$0 = 0.0, $tmp395_sroa_0_0_insert_insert$1 = 0.0, $159 = 0, $isHome = 0, $resource = 0, $161 = 0, $_ = 0, $oxygen404 = 0, $162 = 0, $div406 = 0, $oxygen_0 = 0, $163 = 0, $oxygen440_phi_trans_insert = 0, $_pre = 0, $sub429 = 0, $resource431 = 0, $164 = 0, $165 = 0, $167 = 0, $168 = 0, $call450 = 0, $call451 = 0, $call452 = 0, $169 = 0, $div_i_i352_1 = 0.0, $add_i355_1 = 0.0, $170 = 0, $tmp_sroa_0_0_insert_insert_i_1$0 = 0.0, $tmp_sroa_0_0_insert_insert_i_1$1 = 0.0, $173 = 0, $call191 = 0, $175 = 0, $176 = 0, $177$1 = 0, $call191_1 = 0, $179 = 0, $180 = 0, $181$1 = 0, $call191_2 = 0, $183 = 0, $184 = 0, $185$1 = 0, $187 = 0, label = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 1433
 $bodies = $self + 36 | 0; //@line 1434
 $triggers = $self + 40 | 0; //@line 1435
 $world = $self + 48 | 0; //@line 1436
 $call = _AQList_at(HEAP32[$bodies >> 2] | 0, 0) | 0; //@line 1438
 $call1 = _AQList_at(HEAP32[$triggers >> 2] | 0, 0) | 0; //@line 1441
 _AQWorld_wakeParticle(HEAP32[$world >> 2] | 0, $call); //@line 1444
 _AQWorld_wakeParticle(HEAP32[$world >> 2] | 0, $call1); //@line 1446
 $position3 = $call + 12 | 0; //@line 1447
 $add_i194 = +HEAPF32[$position3 >> 2] + 0.0; //@line 1453
 $add3_i195 = +HEAPF32[$call + 16 >> 2] + 0.0; //@line 1454
 $7 = $position3; //@line 1456
 $8 = $call1 + 12 | 0; //@line 1457
 $9$1 = HEAP32[$7 + 4 >> 2] | 0; //@line 1461
 HEAP32[$8 >> 2] = HEAP32[$7 >> 2]; //@line 1463
 HEAP32[$8 + 4 >> 2] = $9$1; //@line 1465
 $10 = $call + 48 | 0; //@line 1468
 $11 = $call1 + 48 | 0; //@line 1469
 $12$1 = HEAP32[$10 + 4 >> 2] | 0; //@line 1473
 HEAP32[$11 >> 2] = HEAP32[$10 >> 2]; //@line 1475
 HEAP32[$11 + 4 >> 2] = $12$1; //@line 1477
 $call_1 = _AQList_at(HEAP32[$bodies >> 2] | 0, 1) | 0; //@line 1479
 $call1_1 = _AQList_at(HEAP32[$triggers >> 2] | 0, 1) | 0; //@line 1482
 _AQWorld_wakeParticle(HEAP32[$world >> 2] | 0, $call_1); //@line 1485
 _AQWorld_wakeParticle(HEAP32[$world >> 2] | 0, $call1_1); //@line 1487
 $position3_1 = $call_1 + 12 | 0; //@line 1488
 $add_i194_1 = $add_i194 + +HEAPF32[$position3_1 >> 2]; //@line 1494
 $add3_i195_1 = $add3_i195 + +HEAPF32[$call_1 + 16 >> 2]; //@line 1495
 $20 = $position3_1; //@line 1497
 $21 = $call1_1 + 12 | 0; //@line 1498
 $22$1 = HEAP32[$20 + 4 >> 2] | 0; //@line 1502
 HEAP32[$21 >> 2] = HEAP32[$20 >> 2]; //@line 1504
 HEAP32[$21 + 4 >> 2] = $22$1; //@line 1506
 $23 = $call_1 + 48 | 0; //@line 1509
 $24 = $call1_1 + 48 | 0; //@line 1510
 $25$1 = HEAP32[$23 + 4 >> 2] | 0; //@line 1514
 HEAP32[$24 >> 2] = HEAP32[$23 >> 2]; //@line 1516
 HEAP32[$24 + 4 >> 2] = $25$1; //@line 1518
 $call_2 = _AQList_at(HEAP32[$bodies >> 2] | 0, 2) | 0; //@line 1520
 $call1_2 = _AQList_at(HEAP32[$triggers >> 2] | 0, 2) | 0; //@line 1523
 _AQWorld_wakeParticle(HEAP32[$world >> 2] | 0, $call_2); //@line 1526
 _AQWorld_wakeParticle(HEAP32[$world >> 2] | 0, $call1_2); //@line 1528
 $position3_2 = $call_2 + 12 | 0; //@line 1529
 $add_i194_2 = $add_i194_1 + +HEAPF32[$position3_2 >> 2]; //@line 1535
 $add3_i195_2 = $add3_i195_1 + +HEAPF32[$call_2 + 16 >> 2]; //@line 1536
 $33 = $position3_2; //@line 1538
 $34 = $call1_2 + 12 | 0; //@line 1539
 $35$1 = HEAP32[$33 + 4 >> 2] | 0; //@line 1543
 HEAP32[$34 >> 2] = HEAP32[$33 >> 2]; //@line 1545
 HEAP32[$34 + 4 >> 2] = $35$1; //@line 1547
 $36 = $call_2 + 48 | 0; //@line 1550
 $37 = $call1_2 + 48 | 0; //@line 1551
 $38$1 = HEAP32[$36 + 4 >> 2] | 0; //@line 1555
 HEAP32[$37 >> 2] = HEAP32[$36 >> 2]; //@line 1557
 HEAP32[$37 + 4 >> 2] = $38$1; //@line 1559
 $position7 = $self + 12 | 0; //@line 1560
 $39 = $position7; //@line 1563
 $tmp8_sroa_0_0_insert_insert$1 = +($add3_i195_2 * .3333333432674408); //@line 1573
 HEAPF32[$39 >> 2] = $add_i194_2 * .3333333432674408; //@line 1575
 HEAPF32[$39 + 4 >> 2] = $tmp8_sroa_0_0_insert_insert$1; //@line 1577
 $state = $self + 60 | 0; //@line 1578
 $_attachedIndices93_pre = $self + 56 | 0; //@line 1581
 do {
  if ((HEAP32[$state >> 2] | 0) != 2) {
   if ((_AQList_length(HEAP32[$_attachedIndices93_pre >> 2] | 0) | 0) != 1) {
    break;
   }
   $call16 = _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices93_pre >> 2] | 0, 0) | 0) | 0; //@line 1595
   if (($call16 | 0) == 0) {
    $indexB_0_load553581 = 2; //@line 1598
    $indexA_0_load554582 = 1; //@line 1598
   } else if (($call16 | 0) == 1) {
    $indexB_0_load553581 = 2; //@line 1601
    $indexA_0_load554582 = 0; //@line 1601
   } else if (($call16 | 0) == 2) {
    $indexB_0_load553581 = 1; //@line 1604
    $indexA_0_load554582 = 0; //@line 1604
   } else {
    $indexB_0_load553581 = 0; //@line 1606
    $indexA_0_load554582 = 0; //@line 1606
   }
   $lastTouched = $self + 64 | 0; //@line 1610
   $46 = HEAP32[$lastTouched >> 2] | 0; //@line 1611
   $call20 = _AQList_at(HEAP32[$bodies >> 2] | 0, $indexA_0_load554582) | 0; //@line 1613
   $sub_i = +HEAPF32[$46 + 12 >> 2] - +HEAPF32[$call20 + 12 >> 2]; //@line 1624
   $sub3_i = +HEAPF32[$46 + 16 >> 2] - +HEAPF32[$call20 + 16 >> 2]; //@line 1625
   $conv2_i = +Math_sqrt(+($sub_i * $sub_i + $sub3_i * $sub3_i)); //@line 1629
   $49 = HEAP32[$lastTouched >> 2] | 0; //@line 1630
   $call27 = _AQList_at(HEAP32[$bodies >> 2] | 0, $indexB_0_load553581) | 0; //@line 1632
   $sub_i210 = +HEAPF32[$49 + 12 >> 2] - +HEAPF32[$call27 + 12 >> 2]; //@line 1643
   $sub3_i211 = +HEAPF32[$49 + 16 >> 2] - +HEAPF32[$call27 + 16 >> 2]; //@line 1644
   $nearbyIndex_0_sroa_speculated = $conv2_i < +Math_sqrt(+($sub_i210 * $sub_i210 + $sub3_i211 * $sub3_i211)) ? $indexA_0_load554582 : $indexB_0_load553581; //@line 1650
   $call34 = _AQList_at(HEAP32[$bodies >> 2] | 0, $nearbyIndex_0_sroa_speculated) | 0; //@line 1652
   $call36 = +__SLLeaper_bodyAngularVelocity($self, $call34); //@line 1654
   $sub = 1.25 - +Math_abs(+$call36); //@line 1656
   $cmp43 = (HEAP32[$state >> 2] | 0) == 0; //@line 1659
   $speedDiff_0 = $cmp43 ? 5.0 : $sub; //@line 1660
   $position48 = $call34 + 12 | 0; //@line 1661
   $position7246_sroa_0_0_tmp248_idx = $self + 12 | 0; //@line 1662
   $position7246_sroa_0_0_copyload = (copyTempFloat($position7246_sroa_0_0_tmp248_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1663
   $position7246_sroa_1_4_tmp248_idx561 = $self + 16 | 0; //@line 1664
   $position7246_sroa_1_4_copyload = (copyTempFloat($position7246_sroa_1_4_tmp248_idx561 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1665
   $_sroa_0562_0_tmp250_idx = $position48; //@line 1666
   $_sroa_0562_0_copyload = (copyTempFloat($_sroa_0562_0_tmp250_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1667
   $55 = $call34 + 16 | 0; //@line 1669
   $sub_i_i259 = $_sroa_0562_0_copyload - $position7246_sroa_0_0_copyload; //@line 1671
   $sub3_i_i260 = (copyTempFloat($55 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position7246_sroa_1_4_copyload; //@line 1672
   $div_i_i265 = 1.0 / +Math_sqrt(+($sub_i_i259 * $sub_i_i259 + $sub3_i_i260 * $sub3_i_i260)); //@line 1677
   $call2_i272 = +_fmod(+(+Math_atan2(+($sub3_i_i260 * $div_i_i265), +($sub_i_i259 * $div_i_i265)) + 6.283185307179586), 6.283185307179586); //@line 1684
   $conv = $cmp43 ? 1.0 : $call36 < 0.0 ? -1.0 : 1.0; //@line 1688
   $conv55 = $conv * $speedDiff_0 * +Math_cos(+$call2_i272); //@line 1690
   $conv60 = $conv * $speedDiff_0 * +Math_sin(+$call2_i272); //@line 1694
   $57 = $position48; //@line 1699
   $tmp61_sroa_0_0_insert_insert$1 = +(+HEAPF32[$55 >> 2] + $conv60); //@line 1709
   HEAPF32[$57 >> 2] = +HEAPF32[$_sroa_0562_0_tmp250_idx >> 2] + $conv55; //@line 1711
   HEAPF32[$57 + 4 >> 2] = $tmp61_sroa_0_0_insert_insert$1; //@line 1713
   if (((HEAP32[$state >> 2] | 0) - 3 | 0) >>> 0 < 3) {
    break;
   }
   if ((_AQList_length(HEAP32[$_attachedIndices93_pre >> 2] | 0) | 0) != 1) {
    break;
   }
   $62 = HEAP32[$lastTouched >> 2] | 0; //@line 1728
   $position7279_sroa_0_0_copyload = (copyTempFloat($position7246_sroa_0_0_tmp248_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1729
   $position7279_sroa_1_4_copyload = (copyTempFloat($position7246_sroa_1_4_tmp248_idx561 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1730
   $position82282_sroa_0_0_copyload = (copyTempFloat($62 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1732
   $sub_i_i293 = $position82282_sroa_0_0_copyload - $position7279_sroa_0_0_copyload; //@line 1735
   $sub3_i_i294 = (copyTempFloat($62 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position7279_sroa_1_4_copyload; //@line 1736
   $div_i_i299 = 1.0 / +Math_sqrt(+($sub_i_i293 * $sub_i_i293 + $sub3_i_i294 * $sub3_i_i294)); //@line 1741
   $sub_i309 = +_fmod(+(+_fmod(+(+Math_atan2(+($sub3_i_i294 * $div_i_i299), +($sub_i_i293 * $div_i_i299)) + 6.283185307179586), 6.283185307179586) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 1751
   $add5_i = $sub_i309 - (+_fmod(+($call2_i272 + 3.141592653589793), 6.283185307179586) + -3.141592653589793) + 3.141592653589793; //@line 1756
   +_fmod(+$add5_i, 6.283185307179586);
   if ((HEAP32[$state >> 2] | 0) == 6) {
    break;
   }
   HEAP32[$self + 68 >> 2] = 0; //@line 1765
   HEAP32[$self + 52 >> 2] = _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices93_pre >> 2] | 0, 0) | 0) | 0; //@line 1771
   HEAP32[$state >> 2] = 3; //@line 1772
  }
 } while (0);
 do {
  if ((_AQList_length(HEAP32[$_attachedIndices93_pre >> 2] | 0) | 0) >>> 0 > 1) {
   if ((_AQList_length(HEAP32[$_attachedIndices93_pre >> 2] | 0) | 0) == 0) {
    $distance_sroa_1_0_lcssa = +Infinity; //@line 1787
   } else {
    $lastTouched113 = $self + 64 | 0; //@line 1789
    $distance_sroa_0_0599 = +Infinity; //@line 1791
    $distance_sroa_1_0600 = +Infinity; //@line 1791
    $i_1601 = 0; //@line 1791
    while (1) {
     $69 = HEAP32[$bodies >> 2] | 0; //@line 1796
     $call111 = _AQList_at($69, _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices93_pre >> 2] | 0, $i_1601) | 0) | 0) | 0; //@line 1801
     $72 = HEAP32[$lastTouched113 >> 2] | 0; //@line 1803
     $sub_i321 = +HEAPF32[$call111 + 12 >> 2] - +HEAPF32[$72 + 12 >> 2]; //@line 1813
     $sub3_i322 = +HEAPF32[$call111 + 16 >> 2] - +HEAPF32[$72 + 16 >> 2]; //@line 1814
     $conv116 = +Math_sqrt(+($sub_i321 * $sub_i321 + $sub3_i322 * $sub3_i322)); //@line 1819
     do {
      if ($conv116 < $distance_sroa_0_0599) {
       $distance_sroa_1_1 = $distance_sroa_0_0599; //@line 1824
       $distance_sroa_0_1 = $conv116; //@line 1824
      } else {
       if ($conv116 >= $distance_sroa_1_0600) {
        $distance_sroa_1_1 = $distance_sroa_1_0600; //@line 1829
        $distance_sroa_0_1 = $distance_sroa_0_0599; //@line 1829
        break;
       }
       $distance_sroa_1_1 = $conv116; //@line 1833
       $distance_sroa_0_1 = $distance_sroa_0_0599; //@line 1833
      }
     } while (0);
     $inc132 = $i_1601 + 1 | 0; //@line 1838
     if ($inc132 >>> 0 < (_AQList_length(HEAP32[$_attachedIndices93_pre >> 2] | 0) | 0) >>> 0) {
      $distance_sroa_0_0599 = $distance_sroa_0_1; //@line 1844
      $distance_sroa_1_0600 = $distance_sroa_1_1; //@line 1844
      $i_1601 = $inc132; //@line 1844
     } else {
      $distance_sroa_1_0_lcssa = $distance_sroa_1_1; //@line 1846
      break;
     }
    }
   }
   if ((_AQList_length(HEAP32[$_attachedIndices93_pre >> 2] | 0) | 0) != 0) {
    $lastTouched149 = $self + 64 | 0; //@line 1857
    $i_2596 = 0; //@line 1859
    do {
     $75 = HEAP32[$bodies >> 2] | 0; //@line 1862
     $call147 = _AQList_at($75, _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices93_pre >> 2] | 0, $i_2596) | 0) | 0) | 0; //@line 1867
     $78 = HEAP32[$lastTouched149 >> 2] | 0; //@line 1869
     $sub_i329 = +HEAPF32[$call147 + 12 >> 2] - +HEAPF32[$78 + 12 >> 2]; //@line 1879
     $sub3_i330 = +HEAPF32[$call147 + 16 >> 2] - +HEAPF32[$78 + 16 >> 2]; //@line 1880
     if (+Math_sqrt(+($sub_i329 * $sub_i329 + $sub3_i330 * $sub3_i330)) > $distance_sroa_1_0_lcssa) {
      $80 = HEAP32[$_attachedIndices93_pre >> 2] | 0; //@line 1889
      _AQList_removeAt($80, $i_2596) | 0; //@line 1890
      $i_3 = $i_2596 - 1 | 0; //@line 1893
     } else {
      $i_3 = $i_2596; //@line 1895
     }
     $i_2596 = $i_3 + 1 | 0; //@line 1898
    } while ($i_2596 >>> 0 < (_AQList_length(HEAP32[$_attachedIndices93_pre >> 2] | 0) | 0) >>> 0);
   }
   $82 = HEAP32[$state >> 2] | 0; //@line 1910
   if (($82 | 0) == 2) {
    label = 129; //@line 1912
    break;
   } else if (($82 | 0) == 6) {
    break;
   }
   $84 = HEAP32[(HEAP32[$self + 64 >> 2] | 0) + 104 >> 2] | 0; //@line 1920
   do {
    if (($84 | 0) != 0) {
     if ((_aqistype($84, 1984) | 0) == 0) {
      break;
     }
     if ((HEAP32[$84 + 48 >> 2] | 0) == 0) {
      break;
     }
     HEAP32[$self + 68 >> 2] = 1; //@line 1940
    }
   } while (0);
   HEAP32[$state >> 2] = 2; //@line 1944
   label = 129; //@line 1946
  } else {
   if ((HEAP32[$state >> 2] | 0) == 2) {
    label = 129; //@line 1952
   }
  }
 } while (0);
 do {
  if ((label | 0) == 129) {
   $lastTouched182 = $self + 64 | 0; //@line 1958
   $call179 = _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices93_pre >> 2] | 0, 0) | 0) | 0; //@line 1962
   $call181 = _AQList_at(HEAP32[$bodies >> 2] | 0, $call179) | 0; //@line 1964
   $90 = HEAP32[$lastTouched182 >> 2] | 0; //@line 1965
   $position_i = $call181 + 12 | 0; //@line 1966
   $position1_09_val_i = +HEAPF32[$90 + 12 >> 2]; //@line 1973
   $position1_110_val_i = +HEAPF32[$90 + 16 >> 2]; //@line 1975
   $sub_i_i347 = +HEAPF32[$position_i >> 2] - $position1_09_val_i; //@line 1976
   $sub3_i_i348 = +HEAPF32[$call181 + 16 >> 2] - $position1_110_val_i; //@line 1977
   $conv2_i_i = +Math_sqrt(+($sub_i_i347 * $sub_i_i347 + $sub3_i_i348 * $sub3_i_i348)); //@line 1981
   $92 = +HEAPF32[$90 + 20 >> 2]; //@line 1983
   $94 = +HEAPF32[$call181 + 20 >> 2]; //@line 1987
   if (+Math_abs(+($conv2_i_i - $92 - $94)) > 1.0e-5) {
    $div_i_i352 = 1.0 / $conv2_i_i; //@line 1994
    $add_i355 = $92 + $94; //@line 1997
    $95 = $position_i; //@line 2002
    $tmp_sroa_0_0_insert_insert_i$0 = +($position1_09_val_i + $add_i355 * $sub_i_i347 * $div_i_i352); //@line 2011
    $tmp_sroa_0_0_insert_insert_i$1 = +($position1_110_val_i + $add_i355 * $sub3_i_i348 * $div_i_i352); //@line 2012
    HEAPF32[$95 >> 2] = $tmp_sroa_0_0_insert_insert_i$0; //@line 2014
    HEAPF32[$95 + 4 >> 2] = $tmp_sroa_0_0_insert_insert_i$1; //@line 2016
    $98 = $call181 + 48 | 0; //@line 2018
    HEAPF32[$98 >> 2] = $tmp_sroa_0_0_insert_insert_i$0; //@line 2020
    HEAPF32[$98 + 4 >> 2] = $tmp_sroa_0_0_insert_insert_i$1; //@line 2022
   }
   $call179_1 = _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices93_pre >> 2] | 0, 1) | 0) | 0; //@line 2028
   $call181_1 = _AQList_at(HEAP32[$bodies >> 2] | 0, $call179_1) | 0; //@line 2030
   $102 = HEAP32[$lastTouched182 >> 2] | 0; //@line 2031
   $position_i_1 = $call181_1 + 12 | 0; //@line 2032
   $position1_09_val_i_1 = +HEAPF32[$102 + 12 >> 2]; //@line 2039
   $position1_110_val_i_1 = +HEAPF32[$102 + 16 >> 2]; //@line 2041
   $sub_i_i347_1 = +HEAPF32[$position_i_1 >> 2] - $position1_09_val_i_1; //@line 2042
   $sub3_i_i348_1 = +HEAPF32[$call181_1 + 16 >> 2] - $position1_110_val_i_1; //@line 2043
   $conv2_i_i_1 = +Math_sqrt(+($sub_i_i347_1 * $sub_i_i347_1 + $sub3_i_i348_1 * $sub3_i_i348_1)); //@line 2047
   $104 = +HEAPF32[$102 + 20 >> 2]; //@line 2049
   $106 = +HEAPF32[$call181_1 + 20 >> 2]; //@line 2053
   if (+Math_abs(+($conv2_i_i_1 - $104 - $106)) > 1.0e-5) {
    $div_i_i352_1 = 1.0 / $conv2_i_i_1; //@line 2060
    $add_i355_1 = $104 + $106; //@line 2063
    $170 = $position_i_1; //@line 2068
    $tmp_sroa_0_0_insert_insert_i_1$0 = +($position1_09_val_i_1 + $add_i355_1 * $sub_i_i347_1 * $div_i_i352_1); //@line 2077
    $tmp_sroa_0_0_insert_insert_i_1$1 = +($position1_110_val_i_1 + $add_i355_1 * $sub3_i_i348_1 * $div_i_i352_1); //@line 2078
    HEAPF32[$170 >> 2] = $tmp_sroa_0_0_insert_insert_i_1$0; //@line 2080
    HEAPF32[$170 + 4 >> 2] = $tmp_sroa_0_0_insert_insert_i_1$1; //@line 2082
    $173 = $call181_1 + 48 | 0; //@line 2084
    HEAPF32[$173 >> 2] = $tmp_sroa_0_0_insert_insert_i_1$0; //@line 2086
    HEAPF32[$173 + 4 >> 2] = $tmp_sroa_0_0_insert_insert_i_1$1; //@line 2088
   }
   $call191 = _AQList_at(HEAP32[$bodies >> 2] | 0, 0) | 0; //@line 2092
   $175 = $call191 + 12 | 0; //@line 2095
   $176 = $call191 + 48 | 0; //@line 2096
   $177$1 = HEAP32[$175 + 4 >> 2] | 0; //@line 2100
   HEAP32[$176 >> 2] = HEAP32[$175 >> 2]; //@line 2102
   HEAP32[$176 + 4 >> 2] = $177$1; //@line 2104
   $call191_1 = _AQList_at(HEAP32[$bodies >> 2] | 0, 1) | 0; //@line 2106
   $179 = $call191_1 + 12 | 0; //@line 2109
   $180 = $call191_1 + 48 | 0; //@line 2110
   $181$1 = HEAP32[$179 + 4 >> 2] | 0; //@line 2114
   HEAP32[$180 >> 2] = HEAP32[$179 >> 2]; //@line 2116
   HEAP32[$180 + 4 >> 2] = $181$1; //@line 2118
   $call191_2 = _AQList_at(HEAP32[$bodies >> 2] | 0, 2) | 0; //@line 2120
   $183 = $call191_2 + 12 | 0; //@line 2123
   $184 = $call191_2 + 48 | 0; //@line 2124
   $185$1 = HEAP32[$183 + 4 >> 2] | 0; //@line 2128
   HEAP32[$184 >> 2] = HEAP32[$183 >> 2]; //@line 2130
   HEAP32[$184 + 4 >> 2] = $185$1; //@line 2132
   $187 = HEAP32[(HEAP32[$lastTouched182 >> 2] | 0) + 104 >> 2] | 0; //@line 2135
   if (($187 | 0) == 0) {
    break;
   }
   if ((_aqistype($187, 1984) | 0) == 0) {
    break;
   }
   $107 = $187; //@line 2147
   __SLLeaper_showAsteroid($self, $107); //@line 2148
   __SLLeaper_drainAsteroid($self, $107); //@line 2149
  }
 } while (0);
 do {
  if (((HEAP32[$state >> 2] | 0) - 2 | 0) >>> 0 < 4) {
   $110 = HEAP32[(HEAP32[$self + 64 >> 2] | 0) + 104 >> 2] | 0; //@line 2162
   if (($110 | 0) == 0) {
    break;
   }
   if ((_aqistype($110, 1984) | 0) == 0) {
    break;
   }
   $111 = $110; //@line 2174
   __SLLeaper_showAsteroid($self, $111); //@line 2175
   __SLLeaper_drainAsteroid($self, $111); //@line 2176
  }
 } while (0);
 L173 : do {
  if (((HEAP32[$state >> 2] | 0) - 3 | 0) >>> 0 < 3) {
   $rotatingOnIndex = $self + 52 | 0; //@line 2186
   $call247 = _AQList_at(HEAP32[$bodies >> 2] | 0, HEAP32[$rotatingOnIndex >> 2] | 0) | 0; //@line 2189
   $lastTouched248 = $self + 64 | 0; //@line 2190
   $115 = HEAP32[$lastTouched248 >> 2] | 0; //@line 2191
   $position_i358 = $call247 + 12 | 0; //@line 2192
   $position1_09_val_i364 = +HEAPF32[$115 + 12 >> 2]; //@line 2199
   $position1_110_val_i366 = +HEAPF32[$115 + 16 >> 2]; //@line 2201
   $sub_i_i367 = +HEAPF32[$position_i358 >> 2] - $position1_09_val_i364; //@line 2202
   $sub3_i_i368 = +HEAPF32[$call247 + 16 >> 2] - $position1_110_val_i366; //@line 2203
   $conv2_i_i372 = +Math_sqrt(+($sub_i_i367 * $sub_i_i367 + $sub3_i_i368 * $sub3_i_i368)); //@line 2207
   $117 = +HEAPF32[$115 + 20 >> 2]; //@line 2209
   $119 = +HEAPF32[$call247 + 20 >> 2]; //@line 2213
   if (+Math_abs(+($conv2_i_i372 - $117 - $119)) > 1.0e-5) {
    $div_i_i380 = 1.0 / $conv2_i_i372; //@line 2220
    $add_i383 = $117 + $119; //@line 2223
    $120 = $position_i358; //@line 2228
    $tmp_sroa_0_0_insert_insert_i391$0 = +($position1_09_val_i364 + $add_i383 * $sub_i_i367 * $div_i_i380); //@line 2237
    $tmp_sroa_0_0_insert_insert_i391$1 = +($position1_110_val_i366 + $add_i383 * $sub3_i_i368 * $div_i_i380); //@line 2238
    HEAPF32[$120 >> 2] = $tmp_sroa_0_0_insert_insert_i391$0; //@line 2240
    HEAPF32[$120 + 4 >> 2] = $tmp_sroa_0_0_insert_insert_i391$1; //@line 2242
    $123 = $call247 + 48 | 0; //@line 2244
    HEAPF32[$123 >> 2] = $tmp_sroa_0_0_insert_insert_i391$0; //@line 2246
    HEAPF32[$123 + 4 >> 2] = $tmp_sroa_0_0_insert_insert_i391$1; //@line 2248
   }
   $cmp251 = (_AQList_length(HEAP32[$_attachedIndices93_pre >> 2] | 0) | 0) == 2; //@line 2253
   $125 = HEAP32[$state >> 2] | 0; //@line 2254
   if ($cmp251) {
    if (($125 | 0) == 6) {
     break;
    }
    $127 = HEAP32[(HEAP32[$lastTouched248 >> 2] | 0) + 104 >> 2] | 0; //@line 2264
    do {
     if (($127 | 0) != 0) {
      if ((_aqistype($127, 1984) | 0) == 0) {
       break;
      }
      if ((HEAP32[$127 + 48 >> 2] | 0) == 0) {
       break;
      }
      HEAP32[$self + 68 >> 2] = 1; //@line 2284
     }
    } while (0);
    HEAP32[$state >> 2] = 2; //@line 2288
    break;
   }
   do {
    if (($125 | 0) == 4) {
     $130 = HEAP32[$rotatingOnIndex >> 2] | 0; //@line 2296
     if (($130 | 0) == 0) {
      $detachedIndexB_0_load579 = 2; //@line 2299
      $detachedIndexA_0_load580 = 1; //@line 2299
     } else if (($130 | 0) == 1) {
      $detachedIndexB_0_load579 = 2; //@line 2302
      $detachedIndexA_0_load580 = 0; //@line 2302
     } else if (($130 | 0) == 2) {
      $detachedIndexB_0_load579 = 1; //@line 2305
      $detachedIndexA_0_load580 = 0; //@line 2305
     } else {
      $detachedIndexB_0_load579 = 0; //@line 2307
      $detachedIndexA_0_load580 = 0; //@line 2307
     }
     $call268 = _AQList_at(HEAP32[$bodies >> 2] | 0, $detachedIndexA_0_load580) | 0; //@line 2312
     $position271 = $call268 + 12 | 0; //@line 2313
     $position7418_sroa_0_0_tmp420_idx = $self + 12 | 0; //@line 2315
     $position7418_sroa_0_0_copyload = (copyTempFloat($position7418_sroa_0_0_tmp420_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2316
     $position7418_sroa_1_4_tmp420_idx567 = $self + 16 | 0; //@line 2317
     $position7418_sroa_1_4_copyload = (copyTempFloat($position7418_sroa_1_4_tmp420_idx567 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2318
     $_sroa_0568_0_copyload = (copyTempFloat($position271 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2320
     $sub_i_i431 = $_sroa_0568_0_copyload - $position7418_sroa_0_0_copyload; //@line 2324
     $sub3_i_i432 = (copyTempFloat($call268 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position7418_sroa_1_4_copyload; //@line 2325
     $div_i_i437 = 1.0 / +Math_sqrt(+($sub_i_i431 * $sub_i_i431 + $sub3_i_i432 * $sub3_i_i432)); //@line 2330
     $call2_i444 = +_fmod(+(+Math_atan2(+($sub3_i_i432 * $div_i_i437), +($sub_i_i431 * $div_i_i437)) + 6.283185307179586), 6.283185307179586); //@line 2337
     $position7445_sroa_0_0_copyload = (copyTempFloat($position7418_sroa_0_0_tmp420_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2339
     $position7445_sroa_1_4_copyload = (copyTempFloat($position7418_sroa_1_4_tmp420_idx567 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2340
     $_sroa_0572_0_copyload = (copyTempFloat($call268 + 48 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2342
     $sub_i_i458 = $_sroa_0572_0_copyload - $position7445_sroa_0_0_copyload; //@line 2346
     $sub3_i_i459 = (copyTempFloat($call268 + 52 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position7445_sroa_1_4_copyload; //@line 2347
     $div_i_i464 = 1.0 / +Math_sqrt(+($sub_i_i458 * $sub_i_i458 + $sub3_i_i459 * $sub3_i_i459)); //@line 2352
     $call2_i471 = +_fmod(+(+Math_atan2(+($sub3_i_i459 * $div_i_i464), +($sub_i_i458 * $div_i_i464)) + 6.283185307179586), 6.283185307179586); //@line 2359
     $sub_i474 = +_fmod(+($call2_i444 + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 2362
     $sub7_i481 = +_fmod(+($sub_i474 - (+_fmod(+($call2_i471 + 3.141592653589793), 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 2369
     if ($sub7_i481 < -3.141592653589793) {
      $v_0_i485 = $sub7_i481 + 6.283185307179586; //@line 2375
     } else {
      $v_0_i485 = $sub7_i481; //@line 2377
     }
     if ($v_0_i485 > 3.141592653589793) {
      $v_1_i490 = $v_0_i485 + -6.283185307179586; //@line 2385
     } else {
      $v_1_i490 = $v_0_i485; //@line 2387
     }
     $call286 = +__SLLeaper_angleOutward($position7, $position271, (_AQList_at(HEAP32[$bodies >> 2] | 0, $detachedIndexB_0_load579) | 0) + 12 | 0); //@line 2395
     $137 = HEAP32[$lastTouched248 >> 2] | 0; //@line 2396
     $position290493_sroa_0_0_copyload = (copyTempFloat($137 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2398
     $position290493_sroa_1_4_copyload = (copyTempFloat($137 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2400
     $position7496_sroa_0_0_copyload = (copyTempFloat($position7418_sroa_0_0_tmp420_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2401
     $sub_i_i507 = $position7496_sroa_0_0_copyload - $position290493_sroa_0_0_copyload; //@line 2403
     $sub3_i_i508 = (copyTempFloat($position7418_sroa_1_4_tmp420_idx567 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position290493_sroa_1_4_copyload; //@line 2404
     $div_i_i513 = 1.0 / +Math_sqrt(+($sub_i_i507 * $sub_i_i507 + $sub3_i_i508 * $sub3_i_i508)); //@line 2409
     $call294 = +_fmod(+(+_fmod(+(+Math_atan2(+($sub3_i_i508 * $div_i_i513), +($sub_i_i507 * $div_i_i513)) + 6.283185307179586), 6.283185307179586) + 6.283185307179586), 6.283185307179586); //@line 2418
     $sub_i523 = +_fmod(+($call294 + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 2421
     $sub7_i530 = +_fmod(+($sub_i523 - (+_fmod(+($call286 + 3.141592653589793), 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 2428
     if ($sub7_i530 < -3.141592653589793) {
      $v_0_i534 = $sub7_i530 + 6.283185307179586; //@line 2434
     } else {
      $v_0_i534 = $sub7_i530; //@line 2436
     }
     if ($v_0_i534 > 3.141592653589793) {
      $v_1_i539 = $v_0_i534 + -6.283185307179586; //@line 2444
     } else {
      $v_1_i539 = $v_0_i534; //@line 2446
     }
     $conv_i540 = $v_1_i539; //@line 2449
     $cond302 = $v_1_i490 >= 0.0 ? 1 : -1; //@line 2451
     $cond306 = $conv_i540 >= 0.0 ? 1 : -1; //@line 2453
     if (($cond306 | 0) == ($cond302 | 0)) {
      $139 = HEAP32[$state >> 2] | 0; //@line 2459
      label = 165; //@line 2460
      break;
     }
     $conv297 = $conv_i540; //@line 2463
     _printf(504, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 40 | 0, HEAPF64[tempVarArgs >> 3] = $call294, HEAPF64[tempVarArgs + 8 >> 3] = $call286, HEAPF64[tempVarArgs + 16 >> 3] = $conv297, HEAP32[tempVarArgs + 24 >> 2] = $cond302, HEAP32[tempVarArgs + 32 >> 2] = $cond306, tempVarArgs) | 0) | 0; //@line 2464
     STACKTOP = tempVarArgs; //@line 2464
     if ((HEAP32[$state >> 2] | 0) == 6) {
      break L173;
     }
     HEAP32[$self + 68 >> 2] = 0; //@line 2472
     HEAP32[$state >> 2] = 5; //@line 2473
     $rotatingOnIndex321_pre_phi = $rotatingOnIndex; //@line 2475
    } else {
     $139 = $125; //@line 2477
     label = 165; //@line 2478
    }
   } while (0);
   if ((label | 0) == 165) {
    if (($139 | 0) != 5) {
     break;
    }
    $rotatingOnIndex321_pre_phi = $self + 52 | 0; //@line 2490
   }
   $140 = HEAP32[$rotatingOnIndex321_pre_phi >> 2] | 0; //@line 2493
   if (($140 | 0) == 0) {
    $detachedIndexB320_0_load577 = 2; //@line 2496
    $detachedIndexA318_0_load578 = 1; //@line 2496
   } else if (($140 | 0) == 1) {
    $detachedIndexB320_0_load577 = 2; //@line 2499
    $detachedIndexA318_0_load578 = 0; //@line 2499
   } else if (($140 | 0) == 2) {
    $detachedIndexB320_0_load577 = 1; //@line 2502
    $detachedIndexA318_0_load578 = 0; //@line 2502
   } else {
    $detachedIndexB320_0_load577 = 0; //@line 2504
    $detachedIndexA318_0_load578 = 0; //@line 2504
   }
   $141 = HEAP32[$self + 64 >> 2] | 0; //@line 2509
   $position325214_sroa_0_0_copyload = (copyTempFloat($141 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2511
   $position325214_sroa_1_4_copyload = (copyTempFloat($141 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2513
   $position7217_sroa_0_0_tmp219_idx = $self + 12 | 0; //@line 2514
   $position7217_sroa_0_0_copyload = (copyTempFloat($position7217_sroa_0_0_tmp219_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2515
   $position7217_sroa_1_4_tmp219_idx560 = $self + 16 | 0; //@line 2516
   $sub_i_i228 = $position7217_sroa_0_0_copyload - $position325214_sroa_0_0_copyload; //@line 2518
   $sub3_i_i229 = (copyTempFloat($position7217_sroa_1_4_tmp219_idx560 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position325214_sroa_1_4_copyload; //@line 2519
   $div_i_i234 = 1.0 / +Math_sqrt(+($sub_i_i228 * $sub_i_i228 + $sub3_i_i229 * $sub3_i_i229)); //@line 2524
   $call331 = +_fmod(+(+_fmod(+(+Math_atan2(+($sub3_i_i229 * $div_i_i234), +($sub_i_i228 * $div_i_i234)) + 6.283185307179586), 6.283185307179586) + 6.283185307179586), 6.283185307179586); //@line 2533
   $call335 = _AQList_at(HEAP32[$bodies >> 2] | 0, HEAP32[$rotatingOnIndex321_pre_phi >> 2] | 0) | 0; //@line 2536
   $call338 = _AQList_at(HEAP32[$bodies >> 2] | 0, $detachedIndexA318_0_load578) | 0; //@line 2538
   $call342 = _AQList_at(HEAP32[$bodies >> 2] | 0, $detachedIndexB320_0_load577) | 0; //@line 2540
   $position346 = $call338 + 12 | 0; //@line 2541
   $position347 = $call342 + 12 | 0; //@line 2543
   $call348 = +__SLLeaper_angleOutward($position7, $position346, $position347); //@line 2545
   $position7198_sroa_0_0_copyload = (copyTempFloat($position7217_sroa_0_0_tmp219_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2546
   $position7198_sroa_1_4_copyload = (copyTempFloat($position7217_sroa_1_4_tmp219_idx560 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2547
   $_sroa_0_0_copyload = (copyTempFloat($position346 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 2549
   $sub_i_i = $_sroa_0_0_copyload - $position7198_sroa_0_0_copyload; //@line 2553
   $sub3_i_i = (copyTempFloat($call338 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position7198_sroa_1_4_copyload; //@line 2554
   $div_i_i = 1.0 / +Math_sqrt(+($sub_i_i * $sub_i_i + $sub3_i_i * $sub3_i_i)); //@line 2559
   $call2_i = +_fmod(+(+Math_atan2(+($sub3_i_i * $div_i_i), +($sub_i_i * $div_i_i)) + 6.283185307179586), 6.283185307179586); //@line 2566
   if (+FUNCTION_TABLE_fff[HEAP32[442] & 31]($call2_i, $call348) > 0.0) {
    $bodyBAngle_0 = $call331 + -.5235987755982988; //@line 2575
    $bodyAAngle_0 = $call331 + .5235987755982988; //@line 2575
   } else {
    $bodyBAngle_0 = $call331 + .5235987755982988; //@line 2579
    $bodyAAngle_0 = $call331 + -.5235987755982988; //@line 2579
   }
   $conv366 = +HEAPF32[$self + 20 >> 2]; //@line 2585
   $div = ($conv366 + $conv366 * .5000000000000001) / .8660254037844387; //@line 2588
   $conv380 = $div * +Math_cos(+$bodyAAngle_0); //@line 2593
   $conv383 = $div * +Math_sin(+$bodyAAngle_0); //@line 2596
   $_0170 = $call335 + 12 | 0; //@line 2597
   $151 = $call335 + 16 | 0; //@line 2600
   $152 = $call338 + 48 | 0; //@line 2604
   $tmp384_sroa_0_0_insert_insert$0 = +(+HEAPF32[$_0170 >> 2] + $conv380); //@line 2613
   $tmp384_sroa_0_0_insert_insert$1 = +(+HEAPF32[$151 >> 2] + $conv383); //@line 2614
   HEAPF32[$152 >> 2] = $tmp384_sroa_0_0_insert_insert$0; //@line 2616
   HEAPF32[$152 + 4 >> 2] = $tmp384_sroa_0_0_insert_insert$1; //@line 2618
   $155 = $position346; //@line 2619
   HEAPF32[$155 >> 2] = $tmp384_sroa_0_0_insert_insert$0; //@line 2621
   HEAPF32[$155 + 4 >> 2] = $tmp384_sroa_0_0_insert_insert$1; //@line 2623
   $conv391 = $div * +Math_cos(+$bodyBAngle_0); //@line 2627
   $conv394 = $div * +Math_sin(+$bodyBAngle_0); //@line 2630
   $156 = $call342 + 48 | 0; //@line 2635
   $tmp395_sroa_0_0_insert_insert$0 = +(+HEAPF32[$_0170 >> 2] + $conv391); //@line 2644
   $tmp395_sroa_0_0_insert_insert$1 = +(+HEAPF32[$151 >> 2] + $conv394); //@line 2645
   HEAPF32[$156 >> 2] = $tmp395_sroa_0_0_insert_insert$0; //@line 2647
   HEAPF32[$156 + 4 >> 2] = $tmp395_sroa_0_0_insert_insert$1; //@line 2649
   $159 = $position347; //@line 2650
   HEAPF32[$159 >> 2] = $tmp395_sroa_0_0_insert_insert$0; //@line 2652
   HEAPF32[$159 + 4 >> 2] = $tmp395_sroa_0_0_insert_insert$1; //@line 2654
  }
 } while (0);
 $isHome = $self + 68 | 0; //@line 2658
 if ((HEAP32[$isHome >> 2] | 0) != 0) {
  $resource = $self + 88 | 0; //@line 2663
  $161 = HEAP32[$resource >> 2] | 0; //@line 2664
  $_ = ($161 | 0) < 5 ? $161 : 5; //@line 2666
  $oxygen404 = $self + 84 | 0; //@line 2667
  $162 = HEAP32[$oxygen404 >> 2] | 0; //@line 2668
  $div406 = (2048 - $162 | 0) / 16 | 0; //@line 2670
  $oxygen_0 = ($_ | 0) > ($div406 | 0) ? $div406 : $_; //@line 2672
  HEAP32[$resource >> 2] = $161 - $oxygen_0; //@line 2674
  HEAP32[$oxygen404 >> 2] = ($oxygen_0 << 4) + $162; //@line 2677
 }
 $163 = HEAP32[$state >> 2] | 0; //@line 2680
 $oxygen440_phi_trans_insert = $self + 84 | 0; //@line 2682
 $_pre = HEAP32[$oxygen440_phi_trans_insert >> 2] | 0; //@line 2683
 do {
  if (($163 | 0) == 0) {
   $165 = $_pre; //@line 2687
   label = 182; //@line 2688
  } else {
   if (($_pre | 0) > 0) {
    $sub429 = $_pre - 1 | 0; //@line 2693
    HEAP32[$oxygen440_phi_trans_insert >> 2] = $sub429; //@line 2694
    $165 = $sub429; //@line 2696
    label = 182; //@line 2697
    break;
   }
   $resource431 = $self + 88 | 0; //@line 2700
   $164 = HEAP32[$resource431 >> 2] | 0; //@line 2701
   if (($164 | 0) <= 0) {
    break;
   }
   HEAP32[$resource431 >> 2] = $164 - 1; //@line 2708
   $165 = $_pre; //@line 2710
   label = 182; //@line 2711
  }
 } while (0);
 do {
  if ((label | 0) == 182) {
   if (($165 | 0) < 1) {
    break;
   }
   $167 = HEAP32[$_attachedIndices93_pre >> 2] | 0; //@line 2722
   $168 = $167; //@line 2723
   $call450 = _aqrelease($168) | 0; //@line 2724
   $call451 = _aqalloc(2328) | 0; //@line 2725
   $call452 = _aqinit($call451) | 0; //@line 2726
   $169 = $call452; //@line 2727
   HEAP32[$_attachedIndices93_pre >> 2] = $169; //@line 2728
   STACKTOP = sp; //@line 2729
   return;
  }
 } while (0);
 if ((HEAP32[$self + 88 >> 2] | 0) > 0 | ($163 | 0) == 6) {
  $167 = HEAP32[$_attachedIndices93_pre >> 2] | 0; //@line 2739
  $168 = $167; //@line 2740
  $call450 = _aqrelease($168) | 0; //@line 2741
  $call451 = _aqalloc(2328) | 0; //@line 2742
  $call452 = _aqinit($call451) | 0; //@line 2743
  $169 = $call452; //@line 2744
  HEAP32[$_attachedIndices93_pre >> 2] = $169; //@line 2745
  STACKTOP = sp; //@line 2746
  return;
 }
 HEAP32[$isHome >> 2] = 0; //@line 2748
 HEAP32[$state >> 2] = 6; //@line 2749
 $167 = HEAP32[$_attachedIndices93_pre >> 2] | 0; //@line 2751
 $168 = $167; //@line 2752
 $call450 = _aqrelease($168) | 0; //@line 2753
 $call451 = _aqalloc(2328) | 0; //@line 2754
 $call452 = _aqinit($call451) | 0; //@line 2755
 $169 = $call452; //@line 2756
 HEAP32[$_attachedIndices93_pre >> 2] = $169; //@line 2757
 STACKTOP = sp; //@line 2758
 return;
}
function _SLLeaper_applyDirection($self, $radians) {
 $self = $self | 0;
 $radians = +$radians;
 var $i = 0, $0 = 0, $position = 0, $bodies = 0, $1 = 0, $_attachedIndices = 0, $4 = 0, $5 = 0, $8 = 0, $call_i = 0, $add_i_i = 0.0, $add3_i_i = 0.0, $call_1_i = 0, $add_i_1_i = 0.0, $add3_i_1_i = 0.0, $call_2_i = 0, $mul_i_i = 0.0, $mul1_i_i = 0.0, $15 = 0, $position12104_sroa_0_0_copyload = 0.0, $sub_i_i = 0.0, $sub3_i_i = 0.0, $div_i_i = 0.0, $call2_i = 0.0, $sub_i = 0.0, $add1_i = 0.0, $sub7_i = 0.0, $v_0_i = 0.0, $v_1_i = 0.0, $conv_i111 = 0.0, $conv15 = 0.0, $16 = 0, $call30 = 0, $position112_sroa_0_0_copyload = 0.0, $position112_sroa_1_4_copyload = 0.0, $_sroa_0_0_copyload = 0.0, $sub_i_i125 = 0.0, $sub3_i_i126 = 0.0, $div_i_i131 = 0.0, $sub_i141 = 0.0, $sub7_i148 = 0.0, $v_0_i152 = 0.0, $v_1_i157 = 0.0, $20 = 0, $call51 = 0, $position160_sroa_0_0_copyload = 0.0, $position160_sroa_1_4_copyload = 0.0, $_sroa_0473_0_copyload = 0.0, $sub_i_i173 = 0.0, $sub3_i_i174 = 0.0, $div_i_i179 = 0.0, $sub_i189 = 0.0, $sub7_i196 = 0.0, $v_0_i200 = 0.0, $v_1_i205 = 0.0, $floatingBodyPower_0_ph = 0.0, $floatingRotateAngle_2_ph = 0.0, $detachingBodyPower_0_ph = 0.0, $detachedAttachedIndex_2_ph = 0, $targetState_0_ph = 0, $24 = 0, $storemerge = 0, $tobool71 = 0, $26 = 0, $floatingBodyIndex_0 = 0, $27 = 0, $call78 = 0, $position82 = 0, $conv88 = 0.0, $conv93 = 0.0, $32 = 0, $tmp_sroa_0_0_insert_insert$1 = 0.0, $35 = 0, $call101 = 0, $38 = 0, $position104 = 0, $40 = 0, $tmp117_sroa_0_0_insert_insert$1 = 0.0, $call124 = 0, $position125 = 0, $conv131 = 0.0, $conv135 = 0.0, $45 = 0, $tmp136_sroa_0_0_insert_insert$1 = 0.0, $position146 = 0, $48 = 0, $position146221_sroa_0_0_tmp223_idx = 0, $position146221_sroa_0_0_copyload = 0.0, $position146221_sroa_1_4_tmp223_idx476 = 0, $position146221_sroa_1_4_copyload = 0.0, $position148224_sroa_0_0_copyload = 0.0, $sub_i_i235 = 0.0, $sub3_i_i236 = 0.0, $div_i_i241 = 0.0, $call2_i248 = 0.0, $rotatingOnIndex = 0, $49 = 0, $detachedIndexA_0_load467499 = 0, $detachedIndexB_0_load460498 = 0, $bodies154 = 0, $51 = 0, $call160 = 0.0, $sub_i252 = 0.0, $sub7_i259 = 0.0, $v_0_i263 = 0.0, $v_1_i268 = 0.0, $conv_i269 = 0.0, $conv165 = 0.0, $call183 = 0, $position146271_sroa_0_0_copyload = 0.0, $position146271_sroa_1_4_copyload = 0.0, $_sroa_0479_0_copyload = 0.0, $sub_i_i284 = 0.0, $sub3_i_i285 = 0.0, $div_i_i290 = 0.0, $sub_i300 = 0.0, $sub7_i307 = 0.0, $v_0_i311 = 0.0, $v_1_i316 = 0.0, $57 = 0, $call_i320 = 0, $call2_i321 = 0, $_sroa_0_0_copyload_i = 0.0, $_sroa_1_4_copyload_i = 0.0, $_sroa_06_0_copyload_i = 0.0, $sub_i_i_i = 0.0, $sub3_i_i_i = 0.0, $div_i_i_i = 0.0, $call_i324 = 0, $call2_i326 = 0, $_sroa_0_0_copyload_i329 = 0.0, $_sroa_1_4_copyload_i331 = 0.0, $_sroa_06_0_copyload_i333 = 0.0, $sub_i_i_i336 = 0.0, $sub3_i_i_i337 = 0.0, $div_i_i_i342 = 0.0, $call203 = 0, $position146350_sroa_0_0_copyload = 0.0, $position146350_sroa_1_4_copyload = 0.0, $_sroa_0483_0_copyload = 0.0, $sub_i_i363 = 0.0, $sub3_i_i364 = 0.0, $div_i_i369 = 0.0, $sub_i379 = 0.0, $sub7_i386 = 0.0, $v_0_i390 = 0.0, $v_1_i395 = 0.0, $66 = 0, $call211 = 0, $call214 = 0, $_sroa_0486_0_copyload = 0.0, $_sroa_1487_4_copyload = 0.0, $_sroa_0489_0_copyload = 0.0, $sub_i_i410 = 0.0, $sub3_i_i411 = 0.0, $div_i_i416 = 0.0, $call219 = 0, $call222 = 0, $_sroa_0492_0_copyload = 0.0, $_sroa_1493_4_copyload = 0.0, $_sroa_0495_0_copyload = 0.0, $sub_i_i436 = 0.0, $sub3_i_i437 = 0.0, $div_i_i442 = 0.0, $boosterBodyIndex_2 = 0, $launchAngle_2 = 0.0, $launchVelocity_0 = 0.0, $targetState_1 = 0, $call234 = 0, $position237 = 0, $conv242 = 0.0, $conv245 = 0.0, $75 = 0, $tmp246_sroa_0_0_insert_insert$1 = 0.0, sp = 0;
 sp = STACKTOP; //@line 3621
 STACKTOP = STACKTOP + 8 | 0; //@line 3621
 $i = sp | 0; //@line 3622
 $0 = HEAP32[$self + 60 >> 2] | 0; //@line 3624
 if (($0 | 0) == 2) {
  $position = $self + 12 | 0; //@line 3626
  $bodies = $self + 36 | 0; //@line 3627
  $1 = HEAP32[$bodies >> 2] | 0; //@line 3628
  $_attachedIndices = $self + 56 | 0; //@line 3629
  $4 = (_AQList_at($1, _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices >> 2] | 0, 0) | 0) | 0) | 0) + 12 | 0; //@line 3636
  $5 = HEAP32[$bodies >> 2] | 0; //@line 3637
  $8 = (_AQList_at($5, _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices >> 2] | 0, 1) | 0) | 0) | 0) + 12 | 0; //@line 3644
  +__SLLeaper_angleOutward($position, $4, $8);
  $call_i = _AQList_at(HEAP32[$bodies >> 2] | 0, 0) | 0; //@line 3647
  $add_i_i = +HEAPF32[$call_i + 12 >> 2] + 0.0; //@line 3654
  $add3_i_i = +HEAPF32[$call_i + 16 >> 2] + 0.0; //@line 3655
  $call_1_i = _AQList_at(HEAP32[$bodies >> 2] | 0, 1) | 0; //@line 3657
  $add_i_1_i = $add_i_i + +HEAPF32[$call_1_i + 12 >> 2]; //@line 3664
  $add3_i_1_i = $add3_i_i + +HEAPF32[$call_1_i + 16 >> 2]; //@line 3665
  $call_2_i = _AQList_at(HEAP32[$bodies >> 2] | 0, 2) | 0; //@line 3667
  $mul_i_i = ($add_i_1_i + +HEAPF32[$call_2_i + 12 >> 2]) * .3333333432674408; //@line 3676
  $mul1_i_i = ($add3_i_1_i + +HEAPF32[$call_2_i + 16 >> 2]) * .3333333432674408; //@line 3677
  $15 = HEAP32[$self + 64 >> 2] | 0; //@line 3679
  $position12104_sroa_0_0_copyload = (copyTempFloat($15 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 3681
  $sub_i_i = $position12104_sroa_0_0_copyload - $mul_i_i; //@line 3684
  $sub3_i_i = (copyTempFloat($15 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $mul1_i_i; //@line 3685
  $div_i_i = 1.0 / +Math_sqrt(+($sub_i_i * $sub_i_i + $sub3_i_i * $sub3_i_i)); //@line 3690
  $call2_i = +_fmod(+(+Math_atan2(+($sub3_i_i * $div_i_i), +($sub_i_i * $div_i_i)) + 6.283185307179586), 6.283185307179586); //@line 3697
  $sub_i = +_fmod(+($radians + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 3701
  $add1_i = $call2_i + 3.141592653589793; //@line 3702
  $sub7_i = +_fmod(+($sub_i - (+_fmod(+$add1_i, 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 3708
  if ($sub7_i < -3.141592653589793) {
   $v_0_i = $sub7_i + 6.283185307179586; //@line 3714
  } else {
   $v_0_i = $sub7_i; //@line 3716
  }
  if ($v_0_i > 3.141592653589793) {
   $v_1_i = $v_0_i + -6.283185307179586; //@line 3724
  } else {
   $v_1_i = $v_0_i; //@line 3726
  }
  $conv_i111 = $v_1_i; //@line 3729
  $conv15 = $conv_i111; //@line 3730
  do {
   if (+Math_abs(+$conv_i111) < .7853981633974483) {
    $targetState_0_ph = 0; //@line 3737
    $detachedAttachedIndex_2_ph = 0; //@line 3737
    $detachingBodyPower_0_ph = 2.0; //@line 3737
    $floatingRotateAngle_2_ph = $add1_i; //@line 3737
    $floatingBodyPower_0_ph = 0.0; //@line 3737
   } else {
    if ($conv15 > .7853981633974483 & $conv15 < 2.356194490192345) {
     $16 = HEAP32[$bodies >> 2] | 0; //@line 3744
     $call30 = _AQList_at($16, _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices >> 2] | 0, 0) | 0) | 0) | 0; //@line 3749
     $position112_sroa_0_0_copyload = (copyTempFloat($self + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 3752
     $position112_sroa_1_4_copyload = (copyTempFloat($self + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 3754
     $_sroa_0_0_copyload = (copyTempFloat($call30 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 3756
     $sub_i_i125 = $_sroa_0_0_copyload - $position112_sroa_0_0_copyload; //@line 3760
     $sub3_i_i126 = (copyTempFloat($call30 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position112_sroa_1_4_copyload; //@line 3761
     $div_i_i131 = 1.0 / +Math_sqrt(+($sub_i_i125 * $sub_i_i125 + $sub3_i_i126 * $sub3_i_i126)); //@line 3766
     $sub_i141 = +_fmod(+(+_fmod(+(+Math_atan2(+($sub3_i_i126 * $div_i_i131), +($sub_i_i125 * $div_i_i131)) + 6.283185307179586), 6.283185307179586) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 3776
     $sub7_i148 = +_fmod(+($sub_i141 - (+_fmod(+$add1_i, 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 3782
     if ($sub7_i148 < -3.141592653589793) {
      $v_0_i152 = $sub7_i148 + 6.283185307179586; //@line 3788
     } else {
      $v_0_i152 = $sub7_i148; //@line 3790
     }
     if ($v_0_i152 > 3.141592653589793) {
      $v_1_i157 = $v_0_i152 + -6.283185307179586; //@line 3798
     } else {
      $v_1_i157 = $v_0_i152; //@line 3800
     }
     $targetState_0_ph = 3; //@line 3808
     $detachedAttachedIndex_2_ph = $v_1_i157 <= 0.0 | 0; //@line 3808
     $detachingBodyPower_0_ph = 1.0; //@line 3808
     $floatingRotateAngle_2_ph = $call2_i + -1.5707963267948966; //@line 3808
     $floatingBodyPower_0_ph = 1.0; //@line 3808
     break;
    }
    if (!($conv15 < -.7853981633974483 & $conv15 > -2.356194490192345)) {
     STACKTOP = sp; //@line 3816
     return;
    }
    $20 = HEAP32[$bodies >> 2] | 0; //@line 3818
    $call51 = _AQList_at($20, _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices >> 2] | 0, 0) | 0) | 0) | 0; //@line 3823
    $position160_sroa_0_0_copyload = (copyTempFloat($self + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 3826
    $position160_sroa_1_4_copyload = (copyTempFloat($self + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 3828
    $_sroa_0473_0_copyload = (copyTempFloat($call51 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 3830
    $sub_i_i173 = $_sroa_0473_0_copyload - $position160_sroa_0_0_copyload; //@line 3834
    $sub3_i_i174 = (copyTempFloat($call51 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position160_sroa_1_4_copyload; //@line 3835
    $div_i_i179 = 1.0 / +Math_sqrt(+($sub_i_i173 * $sub_i_i173 + $sub3_i_i174 * $sub3_i_i174)); //@line 3840
    $sub_i189 = +_fmod(+(+_fmod(+(+Math_atan2(+($sub3_i_i174 * $div_i_i179), +($sub_i_i173 * $div_i_i179)) + 6.283185307179586), 6.283185307179586) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 3850
    $sub7_i196 = +_fmod(+($sub_i189 - (+_fmod(+$add1_i, 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 3856
    if ($sub7_i196 < -3.141592653589793) {
     $v_0_i200 = $sub7_i196 + 6.283185307179586; //@line 3862
    } else {
     $v_0_i200 = $sub7_i196; //@line 3864
    }
    if ($v_0_i200 > 3.141592653589793) {
     $v_1_i205 = $v_0_i200 + -6.283185307179586; //@line 3872
    } else {
     $v_1_i205 = $v_0_i200; //@line 3874
    }
    $targetState_0_ph = 3; //@line 3882
    $detachedAttachedIndex_2_ph = $v_1_i205 >= 0.0 | 0; //@line 3882
    $detachingBodyPower_0_ph = 1.0; //@line 3882
    $floatingRotateAngle_2_ph = $call2_i + 1.5707963267948966; //@line 3882
    $floatingBodyPower_0_ph = 1.0; //@line 3882
   }
  } while (0);
  $24 = $i; //@line 3890
  $storemerge = 0; //@line 3892
  while (1) {
   HEAP32[$i >> 2] = $storemerge; //@line 3895
   if (($storemerge | 0) >= 3) {
    $floatingBodyIndex_0 = -1; //@line 3899
    break;
   }
   $tobool71 = (_AQList_findIndex(HEAP32[$_attachedIndices >> 2] | 0, 21, $24) | 0) == -1; //@line 3904
   $26 = HEAP32[$i >> 2] | 0; //@line 3905
   if ($tobool71) {
    $floatingBodyIndex_0 = $26; //@line 3909
    break;
   } else {
    $storemerge = $26 + 1 | 0; //@line 3912
   }
  }
  $27 = HEAP32[$bodies >> 2] | 0; //@line 3916
  $call78 = _AQList_at($27, _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices >> 2] | 0, $detachedAttachedIndex_2_ph) | 0) | 0) | 0; //@line 3921
  _AQList_removeAt(HEAP32[$_attachedIndices >> 2] | 0, $detachedAttachedIndex_2_ph) | 0; //@line 3923
  $position82 = $call78 + 12 | 0; //@line 3924
  $conv88 = $detachingBodyPower_0_ph * +Math_cos(+$add1_i) * 5.0; //@line 3928
  $conv93 = $detachingBodyPower_0_ph * +Math_sin(+$add1_i) * 5.0; //@line 3932
  $32 = $position82; //@line 3940
  $tmp_sroa_0_0_insert_insert$1 = +(+HEAPF32[$call78 + 16 >> 2] + $conv93); //@line 3950
  HEAPF32[$32 >> 2] = +HEAPF32[$position82 >> 2] + $conv88; //@line 3952
  HEAPF32[$32 + 4 >> 2] = $tmp_sroa_0_0_insert_insert$1; //@line 3954
  if (($targetState_0_ph | 0) == 0) {
   $35 = HEAP32[$bodies >> 2] | 0; //@line 3958
   $call101 = _AQList_at($35, _AQNumber_asInt(_AQList_at(HEAP32[$_attachedIndices >> 2] | 0, 0) | 0) | 0) | 0; //@line 3963
   $38 = HEAP32[$_attachedIndices >> 2] | 0; //@line 3964
   _AQList_removeAt($38, 0) | 0; //@line 3965
   $position104 = $call101 + 12 | 0; //@line 3966
   $40 = $position104; //@line 3974
   $tmp117_sroa_0_0_insert_insert$1 = +($conv93 + +HEAPF32[$call101 + 16 >> 2]); //@line 3984
   HEAPF32[$40 >> 2] = $conv88 + +HEAPF32[$position104 >> 2]; //@line 3986
   HEAPF32[$40 + 4 >> 2] = $tmp117_sroa_0_0_insert_insert$1; //@line 3988
  }
  if (($floatingBodyIndex_0 | 0) != -1) {
   $call124 = _AQList_at(HEAP32[$bodies >> 2] | 0, $floatingBodyIndex_0) | 0; //@line 3995
   $position125 = $call124 + 12 | 0; //@line 3996
   $conv131 = $floatingBodyPower_0_ph * +Math_cos(+$floatingRotateAngle_2_ph) * 5.0; //@line 4000
   $conv135 = $floatingBodyPower_0_ph * +Math_sin(+$floatingRotateAngle_2_ph) * 5.0; //@line 4004
   $45 = $position125; //@line 4012
   $tmp136_sroa_0_0_insert_insert$1 = +(+HEAPF32[$call124 + 16 >> 2] + $conv135); //@line 4022
   HEAPF32[$45 >> 2] = +HEAPF32[$position125 >> 2] + $conv131; //@line 4024
   HEAPF32[$45 + 4 >> 2] = $tmp136_sroa_0_0_insert_insert$1; //@line 4026
  }
  __SLLeaper_gotoState($self, $targetState_0_ph); //@line 4029
  STACKTOP = sp; //@line 4031
  return;
 } else if (($0 | 0) == 5) {
  $position146 = $self + 12 | 0; //@line 4033
  $48 = HEAP32[$self + 64 >> 2] | 0; //@line 4035
  $position146221_sroa_0_0_tmp223_idx = $self + 12 | 0; //@line 4036
  $position146221_sroa_0_0_copyload = (copyTempFloat($position146221_sroa_0_0_tmp223_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4037
  $position146221_sroa_1_4_tmp223_idx476 = $self + 16 | 0; //@line 4038
  $position146221_sroa_1_4_copyload = (copyTempFloat($position146221_sroa_1_4_tmp223_idx476 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4039
  $position148224_sroa_0_0_copyload = (copyTempFloat($48 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4041
  $sub_i_i235 = $position148224_sroa_0_0_copyload - $position146221_sroa_0_0_copyload; //@line 4044
  $sub3_i_i236 = (copyTempFloat($48 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position146221_sroa_1_4_copyload; //@line 4045
  $div_i_i241 = 1.0 / +Math_sqrt(+($sub_i_i235 * $sub_i_i235 + $sub3_i_i236 * $sub3_i_i236)); //@line 4050
  $call2_i248 = +_fmod(+(+Math_atan2(+($sub3_i_i236 * $div_i_i241), +($sub_i_i235 * $div_i_i241)) + 6.283185307179586), 6.283185307179586); //@line 4057
  $rotatingOnIndex = $self + 52 | 0; //@line 4058
  $49 = HEAP32[$rotatingOnIndex >> 2] | 0; //@line 4059
  if (($49 | 0) == 0) {
   $detachedIndexB_0_load460498 = 2; //@line 4062
   $detachedIndexA_0_load467499 = 1; //@line 4062
  } else if (($49 | 0) == 1) {
   $detachedIndexB_0_load460498 = 2; //@line 4065
   $detachedIndexA_0_load467499 = 0; //@line 4065
  } else if (($49 | 0) == 2) {
   $detachedIndexB_0_load460498 = 1; //@line 4068
   $detachedIndexA_0_load467499 = 0; //@line 4068
  } else {
   $detachedIndexB_0_load460498 = 0; //@line 4070
   $detachedIndexA_0_load467499 = 0; //@line 4070
  }
  $bodies154 = $self + 36 | 0; //@line 4074
  $51 = (_AQList_at(HEAP32[$bodies154 >> 2] | 0, $detachedIndexA_0_load467499) | 0) + 12 | 0; //@line 4078
  $call160 = +__SLLeaper_angleOutward($position146, $51, (_AQList_at(HEAP32[$bodies154 >> 2] | 0, $detachedIndexB_0_load460498) | 0) + 12 | 0); //@line 4083
  $sub_i252 = +_fmod(+($radians + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 4087
  $sub7_i259 = +_fmod(+($sub_i252 - (+_fmod(+($call2_i248 + 3.141592653589793), 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 4094
  if ($sub7_i259 < -3.141592653589793) {
   $v_0_i263 = $sub7_i259 + 6.283185307179586; //@line 4100
  } else {
   $v_0_i263 = $sub7_i259; //@line 4102
  }
  if ($v_0_i263 > 3.141592653589793) {
   $v_1_i268 = $v_0_i263 + -6.283185307179586; //@line 4110
  } else {
   $v_1_i268 = $v_0_i263; //@line 4112
  }
  $conv_i269 = $v_1_i268; //@line 4115
  $conv165 = $conv_i269; //@line 4116
  do {
   if (+Math_abs(+$conv_i269) < .7853981633974483) {
    $targetState_1 = 0; //@line 4125
    $launchVelocity_0 = 2.0; //@line 4125
    $launchAngle_2 = $call160; //@line 4125
    $boosterBodyIndex_2 = HEAP32[$rotatingOnIndex >> 2] | 0; //@line 4125
   } else {
    if ($conv165 > .7853981633974483 & $conv165 < 2.356194490192345) {
     $call183 = _AQList_at(HEAP32[$bodies154 >> 2] | 0, $detachedIndexA_0_load467499) | 0; //@line 4133
     $position146271_sroa_0_0_copyload = (copyTempFloat($position146221_sroa_0_0_tmp223_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4135
     $position146271_sroa_1_4_copyload = (copyTempFloat($position146221_sroa_1_4_tmp223_idx476 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4136
     $_sroa_0479_0_copyload = (copyTempFloat($call183 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4138
     $sub_i_i284 = $_sroa_0479_0_copyload - $position146271_sroa_0_0_copyload; //@line 4142
     $sub3_i_i285 = (copyTempFloat($call183 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position146271_sroa_1_4_copyload; //@line 4143
     $div_i_i290 = 1.0 / +Math_sqrt(+($sub_i_i284 * $sub_i_i284 + $sub3_i_i285 * $sub3_i_i285)); //@line 4148
     $sub_i300 = +_fmod(+(+_fmod(+(+Math_atan2(+($sub3_i_i285 * $div_i_i290), +($sub_i_i284 * $div_i_i290)) + 6.283185307179586), 6.283185307179586) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 4158
     $sub7_i307 = +_fmod(+($sub_i300 - (+_fmod(+($call160 + 3.141592653589793), 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 4165
     if ($sub7_i307 < -3.141592653589793) {
      $v_0_i311 = $sub7_i307 + 6.283185307179586; //@line 4171
     } else {
      $v_0_i311 = $sub7_i307; //@line 4173
     }
     if ($v_0_i311 > 3.141592653589793) {
      $v_1_i316 = $v_0_i311 + -6.283185307179586; //@line 4181
     } else {
      $v_1_i316 = $v_0_i311; //@line 4183
     }
     $57 = HEAP32[$bodies154 >> 2] | 0; //@line 4188
     if ($v_1_i316 > 0.0) {
      $call_i320 = _AQList_at($57, $detachedIndexB_0_load460498) | 0; //@line 4191
      $call2_i321 = _AQList_at(HEAP32[$bodies154 >> 2] | 0, $detachedIndexA_0_load467499) | 0; //@line 4194
      $_sroa_0_0_copyload_i = (copyTempFloat($call_i320 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4197
      $_sroa_1_4_copyload_i = (copyTempFloat($call_i320 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4200
      $_sroa_06_0_copyload_i = (copyTempFloat($call2_i321 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4202
      $sub_i_i_i = $_sroa_06_0_copyload_i - $_sroa_0_0_copyload_i; //@line 4206
      $sub3_i_i_i = (copyTempFloat($call2_i321 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $_sroa_1_4_copyload_i; //@line 4207
      $div_i_i_i = 1.0 / +Math_sqrt(+($sub_i_i_i * $sub_i_i_i + $sub3_i_i_i * $sub3_i_i_i)); //@line 4212
      $targetState_1 = 3; //@line 4221
      $launchVelocity_0 = 5.0; //@line 4221
      $launchAngle_2 = +_fmod(+(+Math_atan2(+($sub3_i_i_i * $div_i_i_i), +($sub_i_i_i * $div_i_i_i)) + 6.283185307179586), 6.283185307179586); //@line 4221
      $boosterBodyIndex_2 = $detachedIndexA_0_load467499; //@line 4221
      break;
     } else {
      $call_i324 = _AQList_at($57, $detachedIndexA_0_load467499) | 0; //@line 4224
      $call2_i326 = _AQList_at(HEAP32[$bodies154 >> 2] | 0, $detachedIndexB_0_load460498) | 0; //@line 4227
      $_sroa_0_0_copyload_i329 = (copyTempFloat($call_i324 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4230
      $_sroa_1_4_copyload_i331 = (copyTempFloat($call_i324 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4233
      $_sroa_06_0_copyload_i333 = (copyTempFloat($call2_i326 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4235
      $sub_i_i_i336 = $_sroa_06_0_copyload_i333 - $_sroa_0_0_copyload_i329; //@line 4239
      $sub3_i_i_i337 = (copyTempFloat($call2_i326 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $_sroa_1_4_copyload_i331; //@line 4240
      $div_i_i_i342 = 1.0 / +Math_sqrt(+($sub_i_i_i336 * $sub_i_i_i336 + $sub3_i_i_i337 * $sub3_i_i_i337)); //@line 4245
      $targetState_1 = 3; //@line 4253
      $launchVelocity_0 = 5.0; //@line 4253
      $launchAngle_2 = +_fmod(+(+Math_atan2(+($sub3_i_i_i337 * $div_i_i_i342), +($sub_i_i_i336 * $div_i_i_i342)) + 6.283185307179586), 6.283185307179586); //@line 4253
      $boosterBodyIndex_2 = $detachedIndexB_0_load460498; //@line 4253
      break;
     }
    }
    if (!($conv165 < -.7853981633974483 & $conv165 > -2.356194490192345)) {
     STACKTOP = sp; //@line 4262
     return;
    }
    $call203 = _AQList_at(HEAP32[$bodies154 >> 2] | 0, $detachedIndexA_0_load467499) | 0; //@line 4265
    $position146350_sroa_0_0_copyload = (copyTempFloat($position146221_sroa_0_0_tmp223_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4267
    $position146350_sroa_1_4_copyload = (copyTempFloat($position146221_sroa_1_4_tmp223_idx476 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4268
    $_sroa_0483_0_copyload = (copyTempFloat($call203 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4270
    $sub_i_i363 = $_sroa_0483_0_copyload - $position146350_sroa_0_0_copyload; //@line 4274
    $sub3_i_i364 = (copyTempFloat($call203 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position146350_sroa_1_4_copyload; //@line 4275
    $div_i_i369 = 1.0 / +Math_sqrt(+($sub_i_i363 * $sub_i_i363 + $sub3_i_i364 * $sub3_i_i364)); //@line 4280
    $sub_i379 = +_fmod(+(+_fmod(+(+Math_atan2(+($sub3_i_i364 * $div_i_i369), +($sub_i_i363 * $div_i_i369)) + 6.283185307179586), 6.283185307179586) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 4290
    $sub7_i386 = +_fmod(+($sub_i379 - (+_fmod(+($call160 + 3.141592653589793), 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 4297
    if ($sub7_i386 < -3.141592653589793) {
     $v_0_i390 = $sub7_i386 + 6.283185307179586; //@line 4303
    } else {
     $v_0_i390 = $sub7_i386; //@line 4305
    }
    if ($v_0_i390 > 3.141592653589793) {
     $v_1_i395 = $v_0_i390 + -6.283185307179586; //@line 4313
    } else {
     $v_1_i395 = $v_0_i390; //@line 4315
    }
    $66 = HEAP32[$bodies154 >> 2] | 0; //@line 4320
    if ($v_1_i395 < 0.0) {
     $call211 = _AQList_at($66, $detachedIndexB_0_load460498) | 0; //@line 4323
     $call214 = _AQList_at(HEAP32[$bodies154 >> 2] | 0, $detachedIndexA_0_load467499) | 0; //@line 4326
     $_sroa_0486_0_copyload = (copyTempFloat($call211 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4329
     $_sroa_1487_4_copyload = (copyTempFloat($call211 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4332
     $_sroa_0489_0_copyload = (copyTempFloat($call214 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4334
     $sub_i_i410 = $_sroa_0489_0_copyload - $_sroa_0486_0_copyload; //@line 4338
     $sub3_i_i411 = (copyTempFloat($call214 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $_sroa_1487_4_copyload; //@line 4339
     $div_i_i416 = 1.0 / +Math_sqrt(+($sub_i_i410 * $sub_i_i410 + $sub3_i_i411 * $sub3_i_i411)); //@line 4344
     $targetState_1 = 3; //@line 4353
     $launchVelocity_0 = 5.0; //@line 4353
     $launchAngle_2 = +_fmod(+(+Math_atan2(+($sub3_i_i411 * $div_i_i416), +($sub_i_i410 * $div_i_i416)) + 6.283185307179586), 6.283185307179586); //@line 4353
     $boosterBodyIndex_2 = $detachedIndexA_0_load467499; //@line 4353
     break;
    } else {
     $call219 = _AQList_at($66, $detachedIndexA_0_load467499) | 0; //@line 4356
     $call222 = _AQList_at(HEAP32[$bodies154 >> 2] | 0, $detachedIndexB_0_load460498) | 0; //@line 4359
     $_sroa_0492_0_copyload = (copyTempFloat($call219 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4362
     $_sroa_1493_4_copyload = (copyTempFloat($call219 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4365
     $_sroa_0495_0_copyload = (copyTempFloat($call222 + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4367
     $sub_i_i436 = $_sroa_0495_0_copyload - $_sroa_0492_0_copyload; //@line 4371
     $sub3_i_i437 = (copyTempFloat($call222 + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $_sroa_1493_4_copyload; //@line 4372
     $div_i_i442 = 1.0 / +Math_sqrt(+($sub_i_i436 * $sub_i_i436 + $sub3_i_i437 * $sub3_i_i437)); //@line 4377
     $targetState_1 = 3; //@line 4385
     $launchVelocity_0 = 5.0; //@line 4385
     $launchAngle_2 = +_fmod(+(+Math_atan2(+($sub3_i_i437 * $div_i_i442), +($sub_i_i436 * $div_i_i442)) + 6.283185307179586), 6.283185307179586); //@line 4385
     $boosterBodyIndex_2 = $detachedIndexB_0_load460498; //@line 4385
     break;
    }
   }
  } while (0);
  if (($boosterBodyIndex_2 | 0) == -1) {
   STACKTOP = sp; //@line 4397
   return;
  }
  $call234 = _AQList_at(HEAP32[$bodies154 >> 2] | 0, $boosterBodyIndex_2) | 0; //@line 4400
  $position237 = $call234 + 12 | 0; //@line 4401
  $conv242 = $launchVelocity_0 * +Math_cos(+$launchAngle_2); //@line 4404
  $conv245 = $launchVelocity_0 * +Math_sin(+$launchAngle_2); //@line 4407
  $75 = $position237; //@line 4415
  $tmp246_sroa_0_0_insert_insert$1 = +(+HEAPF32[$call234 + 16 >> 2] + $conv245); //@line 4425
  HEAPF32[$75 >> 2] = +HEAPF32[$position237 >> 2] + $conv242; //@line 4427
  HEAPF32[$75 + 4 >> 2] = $tmp246_sroa_0_0_insert_insert$1; //@line 4429
  __SLLeaper_gotoState($self, $targetState_1); //@line 4430
  STACKTOP = sp; //@line 4432
  return;
 } else {
  STACKTOP = sp; //@line 4434
  return;
 }
}
function _free($mem) {
 $mem = $mem | 0;
 var $add_ptr = 0, $0 = 0, $1 = 0, $3 = 0, $and = 0, $and5 = 0, $add_ptr6 = 0, $4 = 0, $5 = 0, $add_ptr_sum231 = 0, $add_ptr16 = 0, $6 = 0, $add17 = 0, $shr = 0, $9 = 0, $11 = 0, $12 = 0, $fd56 = 0, $fd67_pre_phi = 0, $18 = 0, $20 = 0, $22 = 0, $24 = 0, $bk82 = 0, $fd86 = 0, $28 = 0, $29 = 0, $arrayidx103 = 0, $30 = 0, $RP_0 = 0, $R_0 = 0, $arrayidx108 = 0, $31 = 0, $arrayidx113 = 0, $32 = 0, $R_1 = 0, $34 = 0, $arrayidx130 = 0, $arrayidx149 = 0, $44 = 0, $48 = 0, $51 = 0, $psize_0 = 0, $p_0 = 0, $55 = 0, $56 = 0, $57 = 0, $add243 = 0, $add254 = 0, $add262 = 0, $shr263 = 0, $64 = 0, $66 = 0, $67 = 0, $fd306 = 0, $fd317_pre_phi = 0, $75 = 0, $77 = 0, $79 = 0, $81 = 0, $bk338 = 0, $fd342 = 0, $86 = 0, $87 = 0, $arrayidx362 = 0, $88 = 0, $RP355_0 = 0, $R327_0 = 0, $arrayidx369 = 0, $89 = 0, $arrayidx374 = 0, $90 = 0, $R327_1 = 0, $93 = 0, $arrayidx395 = 0, $arrayidx414 = 0, $103 = 0, $107 = 0, $psize_1 = 0, $shr493 = 0, $shl500 = 0, $111 = 0, $112 = 0, $shl503 = 0, $113 = 0, $114 = 0, $_pre_phi = 0, $F502_0 = 0, $117 = 0, $shr527 = 0, $and537 = 0, $shl538 = 0, $and541 = 0, $shl543 = 0, $and546 = 0, $add551 = 0, $I526_0 = 0, $arrayidx559 = 0, $119 = 0, $shl565 = 0, $cond = 0, $T_0 = 0, $K575_0 = 0, $arrayidx591 = 0, $122 = 0, $fd609 = 0, $125 = 0, $127 = 0, $dec = 0, $sp_0_in_i = 0, $sp_0_i = 0, label = 0;
 if (($mem | 0) == 0) {
  return;
 }
 $add_ptr = $mem - 8 | 0; //@line 16944
 $0 = $add_ptr; //@line 16945
 $1 = HEAP32[800] | 0; //@line 16946
 if ($add_ptr >>> 0 < $1 >>> 0) {
  _abort(); //@line 16949
 }
 $3 = HEAP32[$mem - 4 >> 2] | 0; //@line 16954
 $and = $3 & 3; //@line 16955
 if (($and | 0) == 1) {
  _abort(); //@line 16958
 }
 $and5 = $3 & -8; //@line 16961
 $add_ptr6 = $mem + ($and5 - 8) | 0; //@line 16963
 $4 = $add_ptr6; //@line 16964
 L2301 : do {
  if (($3 & 1 | 0) == 0) {
   $5 = HEAP32[$add_ptr >> 2] | 0; //@line 16970
   if (($and | 0) == 0) {
    return;
   }
   $add_ptr_sum231 = -8 - $5 | 0; //@line 16975
   $add_ptr16 = $mem + $add_ptr_sum231 | 0; //@line 16976
   $6 = $add_ptr16; //@line 16977
   $add17 = $5 + $and5 | 0; //@line 16978
   if ($add_ptr16 >>> 0 < $1 >>> 0) {
    _abort(); //@line 16981
   }
   if (($6 | 0) == (HEAP32[801] | 0)) {
    $51 = $mem + ($and5 - 4) | 0; //@line 16989
    if ((HEAP32[$51 >> 2] & 3 | 0) != 3) {
     $p_0 = $6; //@line 16994
     $psize_0 = $add17; //@line 16994
     break;
    }
    HEAP32[798] = $add17; //@line 16997
    HEAP32[$51 >> 2] = HEAP32[$51 >> 2] & -2; //@line 17000
    HEAP32[$mem + ($add_ptr_sum231 + 4) >> 2] = $add17 | 1; //@line 17005
    HEAP32[$add_ptr6 >> 2] = $add17; //@line 17007
    return;
   }
   $shr = $5 >>> 3; //@line 17010
   if ($5 >>> 0 < 256) {
    $9 = HEAP32[$mem + ($add_ptr_sum231 + 8) >> 2] | 0; //@line 17016
    $11 = HEAP32[$mem + ($add_ptr_sum231 + 12) >> 2] | 0; //@line 17020
    $12 = 3224 + ($shr << 1 << 2) | 0; //@line 17023
    do {
     if (($9 | 0) != ($12 | 0)) {
      if ($9 >>> 0 < $1 >>> 0) {
       _abort(); //@line 17030
      }
      if ((HEAP32[$9 + 12 >> 2] | 0) == ($6 | 0)) {
       break;
      }
      _abort(); //@line 17039
     }
    } while (0);
    if (($11 | 0) == ($9 | 0)) {
     HEAP32[796] = HEAP32[796] & ~(1 << $shr); //@line 17049
     $p_0 = $6; //@line 17050
     $psize_0 = $add17; //@line 17050
     break;
    }
    do {
     if (($11 | 0) == ($12 | 0)) {
      $fd67_pre_phi = $11 + 8 | 0; //@line 17057
     } else {
      if ($11 >>> 0 < $1 >>> 0) {
       _abort(); //@line 17062
      }
      $fd56 = $11 + 8 | 0; //@line 17065
      if ((HEAP32[$fd56 >> 2] | 0) == ($6 | 0)) {
       $fd67_pre_phi = $fd56; //@line 17069
       break;
      }
      _abort(); //@line 17072
     }
    } while (0);
    HEAP32[$9 + 12 >> 2] = $11; //@line 17078
    HEAP32[$fd67_pre_phi >> 2] = $9; //@line 17079
    $p_0 = $6; //@line 17080
    $psize_0 = $add17; //@line 17080
    break;
   }
   $18 = $add_ptr16; //@line 17083
   $20 = HEAP32[$mem + ($add_ptr_sum231 + 24) >> 2] | 0; //@line 17087
   $22 = HEAP32[$mem + ($add_ptr_sum231 + 12) >> 2] | 0; //@line 17091
   do {
    if (($22 | 0) == ($18 | 0)) {
     $28 = $mem + ($add_ptr_sum231 + 20) | 0; //@line 17097
     $29 = HEAP32[$28 >> 2] | 0; //@line 17098
     if (($29 | 0) == 0) {
      $arrayidx103 = $mem + ($add_ptr_sum231 + 16) | 0; //@line 17103
      $30 = HEAP32[$arrayidx103 >> 2] | 0; //@line 17104
      if (($30 | 0) == 0) {
       $R_1 = 0; //@line 17107
       break;
      } else {
       $R_0 = $30; //@line 17110
       $RP_0 = $arrayidx103; //@line 17110
      }
     } else {
      $R_0 = $29; //@line 17113
      $RP_0 = $28; //@line 17113
     }
     while (1) {
      $arrayidx108 = $R_0 + 20 | 0; //@line 17118
      $31 = HEAP32[$arrayidx108 >> 2] | 0; //@line 17119
      if (($31 | 0) != 0) {
       $R_0 = $31; //@line 17122
       $RP_0 = $arrayidx108; //@line 17122
       continue;
      }
      $arrayidx113 = $R_0 + 16 | 0; //@line 17125
      $32 = HEAP32[$arrayidx113 >> 2] | 0; //@line 17126
      if (($32 | 0) == 0) {
       break;
      } else {
       $R_0 = $32; //@line 17131
       $RP_0 = $arrayidx113; //@line 17131
      }
     }
     if ($RP_0 >>> 0 < $1 >>> 0) {
      _abort(); //@line 17137
     } else {
      HEAP32[$RP_0 >> 2] = 0; //@line 17140
      $R_1 = $R_0; //@line 17141
      break;
     }
    } else {
     $24 = HEAP32[$mem + ($add_ptr_sum231 + 8) >> 2] | 0; //@line 17148
     if ($24 >>> 0 < $1 >>> 0) {
      _abort(); //@line 17152
     }
     $bk82 = $24 + 12 | 0; //@line 17155
     if ((HEAP32[$bk82 >> 2] | 0) != ($18 | 0)) {
      _abort(); //@line 17159
     }
     $fd86 = $22 + 8 | 0; //@line 17162
     if ((HEAP32[$fd86 >> 2] | 0) == ($18 | 0)) {
      HEAP32[$bk82 >> 2] = $22; //@line 17166
      HEAP32[$fd86 >> 2] = $24; //@line 17167
      $R_1 = $22; //@line 17168
      break;
     } else {
      _abort(); //@line 17171
     }
    }
   } while (0);
   if (($20 | 0) == 0) {
    $p_0 = $6; //@line 17179
    $psize_0 = $add17; //@line 17179
    break;
   }
   $34 = $mem + ($add_ptr_sum231 + 28) | 0; //@line 17184
   $arrayidx130 = 3488 + (HEAP32[$34 >> 2] << 2) | 0; //@line 17186
   do {
    if (($18 | 0) == (HEAP32[$arrayidx130 >> 2] | 0)) {
     HEAP32[$arrayidx130 >> 2] = $R_1; //@line 17191
     if (($R_1 | 0) != 0) {
      break;
     }
     HEAP32[797] = HEAP32[797] & ~(1 << HEAP32[$34 >> 2]); //@line 17201
     $p_0 = $6; //@line 17202
     $psize_0 = $add17; //@line 17202
     break L2301;
    } else {
     if ($20 >>> 0 < (HEAP32[800] | 0) >>> 0) {
      _abort(); //@line 17209
     }
     $arrayidx149 = $20 + 16 | 0; //@line 17212
     if ((HEAP32[$arrayidx149 >> 2] | 0) == ($18 | 0)) {
      HEAP32[$arrayidx149 >> 2] = $R_1; //@line 17216
     } else {
      HEAP32[$20 + 20 >> 2] = $R_1; //@line 17219
     }
     if (($R_1 | 0) == 0) {
      $p_0 = $6; //@line 17223
      $psize_0 = $add17; //@line 17223
      break L2301;
     }
    }
   } while (0);
   if ($R_1 >>> 0 < (HEAP32[800] | 0) >>> 0) {
    _abort(); //@line 17232
   }
   HEAP32[$R_1 + 24 >> 2] = $20; //@line 17236
   $44 = HEAP32[$mem + ($add_ptr_sum231 + 16) >> 2] | 0; //@line 17240
   do {
    if (($44 | 0) != 0) {
     if ($44 >>> 0 < (HEAP32[800] | 0) >>> 0) {
      _abort(); //@line 17248
     } else {
      HEAP32[$R_1 + 16 >> 2] = $44; //@line 17252
      HEAP32[$44 + 24 >> 2] = $R_1; //@line 17254
      break;
     }
    }
   } while (0);
   $48 = HEAP32[$mem + ($add_ptr_sum231 + 20) >> 2] | 0; //@line 17262
   if (($48 | 0) == 0) {
    $p_0 = $6; //@line 17265
    $psize_0 = $add17; //@line 17265
    break;
   }
   if ($48 >>> 0 < (HEAP32[800] | 0) >>> 0) {
    _abort(); //@line 17272
   } else {
    HEAP32[$R_1 + 20 >> 2] = $48; //@line 17276
    HEAP32[$48 + 24 >> 2] = $R_1; //@line 17278
    $p_0 = $6; //@line 17279
    $psize_0 = $add17; //@line 17279
    break;
   }
  } else {
   $p_0 = $0; //@line 17283
   $psize_0 = $and5; //@line 17283
  }
 } while (0);
 $55 = $p_0; //@line 17288
 if ($55 >>> 0 >= $add_ptr6 >>> 0) {
  _abort(); //@line 17291
 }
 $56 = $mem + ($and5 - 4) | 0; //@line 17296
 $57 = HEAP32[$56 >> 2] | 0; //@line 17297
 if (($57 & 1 | 0) == 0) {
  _abort(); //@line 17301
 }
 do {
  if (($57 & 2 | 0) == 0) {
   if (($4 | 0) == (HEAP32[802] | 0)) {
    $add243 = (HEAP32[799] | 0) + $psize_0 | 0; //@line 17312
    HEAP32[799] = $add243; //@line 17313
    HEAP32[802] = $p_0; //@line 17314
    HEAP32[$p_0 + 4 >> 2] = $add243 | 1; //@line 17317
    if (($p_0 | 0) != (HEAP32[801] | 0)) {
     return;
    }
    HEAP32[801] = 0; //@line 17323
    HEAP32[798] = 0; //@line 17324
    return;
   }
   if (($4 | 0) == (HEAP32[801] | 0)) {
    $add254 = (HEAP32[798] | 0) + $psize_0 | 0; //@line 17331
    HEAP32[798] = $add254; //@line 17332
    HEAP32[801] = $p_0; //@line 17333
    HEAP32[$p_0 + 4 >> 2] = $add254 | 1; //@line 17336
    HEAP32[$55 + $add254 >> 2] = $add254; //@line 17339
    return;
   }
   $add262 = ($57 & -8) + $psize_0 | 0; //@line 17343
   $shr263 = $57 >>> 3; //@line 17344
   L2404 : do {
    if ($57 >>> 0 < 256) {
     $64 = HEAP32[$mem + $and5 >> 2] | 0; //@line 17350
     $66 = HEAP32[$mem + ($and5 | 4) >> 2] | 0; //@line 17354
     $67 = 3224 + ($shr263 << 1 << 2) | 0; //@line 17357
     do {
      if (($64 | 0) != ($67 | 0)) {
       if ($64 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 17365
       }
       if ((HEAP32[$64 + 12 >> 2] | 0) == ($4 | 0)) {
        break;
       }
       _abort(); //@line 17374
      }
     } while (0);
     if (($66 | 0) == ($64 | 0)) {
      HEAP32[796] = HEAP32[796] & ~(1 << $shr263); //@line 17384
      break;
     }
     do {
      if (($66 | 0) == ($67 | 0)) {
       $fd317_pre_phi = $66 + 8 | 0; //@line 17391
      } else {
       if ($66 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 17397
       }
       $fd306 = $66 + 8 | 0; //@line 17400
       if ((HEAP32[$fd306 >> 2] | 0) == ($4 | 0)) {
        $fd317_pre_phi = $fd306; //@line 17404
        break;
       }
       _abort(); //@line 17407
      }
     } while (0);
     HEAP32[$64 + 12 >> 2] = $66; //@line 17413
     HEAP32[$fd317_pre_phi >> 2] = $64; //@line 17414
    } else {
     $75 = $add_ptr6; //@line 17416
     $77 = HEAP32[$mem + ($and5 + 16) >> 2] | 0; //@line 17420
     $79 = HEAP32[$mem + ($and5 | 4) >> 2] | 0; //@line 17424
     do {
      if (($79 | 0) == ($75 | 0)) {
       $86 = $mem + ($and5 + 12) | 0; //@line 17430
       $87 = HEAP32[$86 >> 2] | 0; //@line 17431
       if (($87 | 0) == 0) {
        $arrayidx362 = $mem + ($and5 + 8) | 0; //@line 17436
        $88 = HEAP32[$arrayidx362 >> 2] | 0; //@line 17437
        if (($88 | 0) == 0) {
         $R327_1 = 0; //@line 17440
         break;
        } else {
         $R327_0 = $88; //@line 17443
         $RP355_0 = $arrayidx362; //@line 17443
        }
       } else {
        $R327_0 = $87; //@line 17446
        $RP355_0 = $86; //@line 17446
       }
       while (1) {
        $arrayidx369 = $R327_0 + 20 | 0; //@line 17451
        $89 = HEAP32[$arrayidx369 >> 2] | 0; //@line 17452
        if (($89 | 0) != 0) {
         $R327_0 = $89; //@line 17455
         $RP355_0 = $arrayidx369; //@line 17455
         continue;
        }
        $arrayidx374 = $R327_0 + 16 | 0; //@line 17458
        $90 = HEAP32[$arrayidx374 >> 2] | 0; //@line 17459
        if (($90 | 0) == 0) {
         break;
        } else {
         $R327_0 = $90; //@line 17464
         $RP355_0 = $arrayidx374; //@line 17464
        }
       }
       if ($RP355_0 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 17471
       } else {
        HEAP32[$RP355_0 >> 2] = 0; //@line 17474
        $R327_1 = $R327_0; //@line 17475
        break;
       }
      } else {
       $81 = HEAP32[$mem + $and5 >> 2] | 0; //@line 17481
       if ($81 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 17486
       }
       $bk338 = $81 + 12 | 0; //@line 17489
       if ((HEAP32[$bk338 >> 2] | 0) != ($75 | 0)) {
        _abort(); //@line 17493
       }
       $fd342 = $79 + 8 | 0; //@line 17496
       if ((HEAP32[$fd342 >> 2] | 0) == ($75 | 0)) {
        HEAP32[$bk338 >> 2] = $79; //@line 17500
        HEAP32[$fd342 >> 2] = $81; //@line 17501
        $R327_1 = $79; //@line 17502
        break;
       } else {
        _abort(); //@line 17505
       }
      }
     } while (0);
     if (($77 | 0) == 0) {
      break;
     }
     $93 = $mem + ($and5 + 20) | 0; //@line 17517
     $arrayidx395 = 3488 + (HEAP32[$93 >> 2] << 2) | 0; //@line 17519
     do {
      if (($75 | 0) == (HEAP32[$arrayidx395 >> 2] | 0)) {
       HEAP32[$arrayidx395 >> 2] = $R327_1; //@line 17524
       if (($R327_1 | 0) != 0) {
        break;
       }
       HEAP32[797] = HEAP32[797] & ~(1 << HEAP32[$93 >> 2]); //@line 17534
       break L2404;
      } else {
       if ($77 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 17541
       }
       $arrayidx414 = $77 + 16 | 0; //@line 17544
       if ((HEAP32[$arrayidx414 >> 2] | 0) == ($75 | 0)) {
        HEAP32[$arrayidx414 >> 2] = $R327_1; //@line 17548
       } else {
        HEAP32[$77 + 20 >> 2] = $R327_1; //@line 17551
       }
       if (($R327_1 | 0) == 0) {
        break L2404;
       }
      }
     } while (0);
     if ($R327_1 >>> 0 < (HEAP32[800] | 0) >>> 0) {
      _abort(); //@line 17563
     }
     HEAP32[$R327_1 + 24 >> 2] = $77; //@line 17567
     $103 = HEAP32[$mem + ($and5 + 8) >> 2] | 0; //@line 17571
     do {
      if (($103 | 0) != 0) {
       if ($103 >>> 0 < (HEAP32[800] | 0) >>> 0) {
        _abort(); //@line 17579
       } else {
        HEAP32[$R327_1 + 16 >> 2] = $103; //@line 17583
        HEAP32[$103 + 24 >> 2] = $R327_1; //@line 17585
        break;
       }
      }
     } while (0);
     $107 = HEAP32[$mem + ($and5 + 12) >> 2] | 0; //@line 17593
     if (($107 | 0) == 0) {
      break;
     }
     if ($107 >>> 0 < (HEAP32[800] | 0) >>> 0) {
      _abort(); //@line 17602
     } else {
      HEAP32[$R327_1 + 20 >> 2] = $107; //@line 17606
      HEAP32[$107 + 24 >> 2] = $R327_1; //@line 17608
      break;
     }
    }
   } while (0);
   HEAP32[$p_0 + 4 >> 2] = $add262 | 1; //@line 17615
   HEAP32[$55 + $add262 >> 2] = $add262; //@line 17618
   if (($p_0 | 0) != (HEAP32[801] | 0)) {
    $psize_1 = $add262; //@line 17622
    break;
   }
   HEAP32[798] = $add262; //@line 17625
   return;
  } else {
   HEAP32[$56 >> 2] = $57 & -2; //@line 17629
   HEAP32[$p_0 + 4 >> 2] = $psize_0 | 1; //@line 17632
   HEAP32[$55 + $psize_0 >> 2] = $psize_0; //@line 17635
   $psize_1 = $psize_0; //@line 17636
  }
 } while (0);
 $shr493 = $psize_1 >>> 3; //@line 17640
 if ($psize_1 >>> 0 < 256) {
  $shl500 = $shr493 << 1; //@line 17643
  $111 = 3224 + ($shl500 << 2) | 0; //@line 17645
  $112 = HEAP32[796] | 0; //@line 17646
  $shl503 = 1 << $shr493; //@line 17647
  do {
   if (($112 & $shl503 | 0) == 0) {
    HEAP32[796] = $112 | $shl503; //@line 17653
    $F502_0 = $111; //@line 17656
    $_pre_phi = 3224 + ($shl500 + 2 << 2) | 0; //@line 17656
   } else {
    $113 = 3224 + ($shl500 + 2 << 2) | 0; //@line 17659
    $114 = HEAP32[$113 >> 2] | 0; //@line 17660
    if ($114 >>> 0 >= (HEAP32[800] | 0) >>> 0) {
     $F502_0 = $114; //@line 17665
     $_pre_phi = $113; //@line 17665
     break;
    }
    _abort(); //@line 17668
   }
  } while (0);
  HEAP32[$_pre_phi >> 2] = $p_0; //@line 17674
  HEAP32[$F502_0 + 12 >> 2] = $p_0; //@line 17676
  HEAP32[$p_0 + 8 >> 2] = $F502_0; //@line 17678
  HEAP32[$p_0 + 12 >> 2] = $111; //@line 17680
  return;
 }
 $117 = $p_0; //@line 17683
 $shr527 = $psize_1 >>> 8; //@line 17684
 do {
  if (($shr527 | 0) == 0) {
   $I526_0 = 0; //@line 17688
  } else {
   if ($psize_1 >>> 0 > 16777215) {
    $I526_0 = 31; //@line 17692
    break;
   }
   $and537 = ($shr527 + 1048320 | 0) >>> 16 & 8; //@line 17697
   $shl538 = $shr527 << $and537; //@line 17698
   $and541 = ($shl538 + 520192 | 0) >>> 16 & 4; //@line 17701
   $shl543 = $shl538 << $and541; //@line 17703
   $and546 = ($shl543 + 245760 | 0) >>> 16 & 2; //@line 17706
   $add551 = 14 - ($and541 | $and537 | $and546) + ($shl543 << $and546 >>> 15) | 0; //@line 17711
   $I526_0 = $psize_1 >>> (($add551 + 7 | 0) >>> 0) & 1 | $add551 << 1; //@line 17717
  }
 } while (0);
 $arrayidx559 = 3488 + ($I526_0 << 2) | 0; //@line 17721
 HEAP32[$p_0 + 28 >> 2] = $I526_0; //@line 17724
 HEAP32[$p_0 + 20 >> 2] = 0; //@line 17726
 HEAP32[$p_0 + 16 >> 2] = 0; //@line 17728
 $119 = HEAP32[797] | 0; //@line 17729
 $shl565 = 1 << $I526_0; //@line 17730
 do {
  if (($119 & $shl565 | 0) == 0) {
   HEAP32[797] = $119 | $shl565; //@line 17736
   HEAP32[$arrayidx559 >> 2] = $117; //@line 17737
   HEAP32[$p_0 + 24 >> 2] = $arrayidx559; //@line 17740
   HEAP32[$p_0 + 12 >> 2] = $p_0; //@line 17742
   HEAP32[$p_0 + 8 >> 2] = $p_0; //@line 17744
  } else {
   if (($I526_0 | 0) == 31) {
    $cond = 0; //@line 17749
   } else {
    $cond = 25 - ($I526_0 >>> 1) | 0; //@line 17753
   }
   $K575_0 = $psize_1 << $cond; //@line 17757
   $T_0 = HEAP32[$arrayidx559 >> 2] | 0; //@line 17757
   while (1) {
    if ((HEAP32[$T_0 + 4 >> 2] & -8 | 0) == ($psize_1 | 0)) {
     break;
    }
    $arrayidx591 = $T_0 + 16 + ($K575_0 >>> 31 << 2) | 0; //@line 17769
    $122 = HEAP32[$arrayidx591 >> 2] | 0; //@line 17770
    if (($122 | 0) == 0) {
     label = 1917; //@line 17774
     break;
    } else {
     $K575_0 = $K575_0 << 1; //@line 17777
     $T_0 = $122; //@line 17777
    }
   }
   if ((label | 0) == 1917) {
    if ($arrayidx591 >>> 0 < (HEAP32[800] | 0) >>> 0) {
     _abort(); //@line 17785
    } else {
     HEAP32[$arrayidx591 >> 2] = $117; //@line 17788
     HEAP32[$p_0 + 24 >> 2] = $T_0; //@line 17791
     HEAP32[$p_0 + 12 >> 2] = $p_0; //@line 17793
     HEAP32[$p_0 + 8 >> 2] = $p_0; //@line 17795
     break;
    }
   }
   $fd609 = $T_0 + 8 | 0; //@line 17799
   $125 = HEAP32[$fd609 >> 2] | 0; //@line 17800
   $127 = HEAP32[800] | 0; //@line 17802
   if ($T_0 >>> 0 < $127 >>> 0) {
    _abort(); //@line 17805
   }
   if ($125 >>> 0 < $127 >>> 0) {
    _abort(); //@line 17811
   } else {
    HEAP32[$125 + 12 >> 2] = $117; //@line 17815
    HEAP32[$fd609 >> 2] = $117; //@line 17816
    HEAP32[$p_0 + 8 >> 2] = $125; //@line 17819
    HEAP32[$p_0 + 12 >> 2] = $T_0; //@line 17822
    HEAP32[$p_0 + 24 >> 2] = 0; //@line 17824
    break;
   }
  }
 } while (0);
 $dec = (HEAP32[804] | 0) - 1 | 0; //@line 17830
 HEAP32[804] = $dec; //@line 17831
 if (($dec | 0) == 0) {
  $sp_0_in_i = 3640; //@line 17834
 } else {
  return;
 }
 while (1) {
  $sp_0_i = HEAP32[$sp_0_in_i >> 2] | 0; //@line 17840
  if (($sp_0_i | 0) == 0) {
   break;
  } else {
   $sp_0_in_i = $sp_0_i + 8 | 0; //@line 17846
  }
 }
 HEAP32[804] = -1; //@line 17849
 return;
}
function _initWaterTest() {
 var $_compoundliteral = 0, $agg_tmp = 0, $agg_tmp168 = 0, $call1 = 0, $call8 = 0, $call16 = 0, $_compoundliteral_sroa_0_0__idx_i = 0, $_compoundliteral_sroa_1_4__idx1_i = 0, $ambients_089 = 0, $homeAsteroid_088 = 0, $i_087 = 0, $conv49 = 0.0, $mul79 = 0.0, $ambients_186_us = 0, $homeAsteroid_185_us = 0, $j_084_us = 0, $div24_us = 0.0, $2 = 0, $3 = 0.0, $conv36_us = 0.0, $call37_us = 0, $div41_us = 0.0, $mul42_us = 0.0, $call53_us = 0, $div57_us = 0.0, $conv67_us = 0.0, $call71_us = 0, $conv100_us = 0.0, $radius_us = 0, $center_0_us = 0, $center_1_us = 0, $homeAsteroid_2_us = 0, $inc160_us = 0, $ambients_283_us = 0, $k_082_us = 0, $conv97_us = 0.0, $add106_us = 0.0, $conv119_us = 0.0, $add_i_i_us = 0.0, $sub_i_i_us = 0.0, $11 = 0.0, $center_0_val_us = 0.0, $center_1_val_us = 0.0, $call122_us = 0, $13 = 0, $position_sroa_0_0_insert_insert_us$0 = 0.0, $position_sroa_0_0_insert_insert_us$1 = 0.0, $16 = 0, $ambients_3_us = 0, $inc130_us = 0, $ambients_186 = 0, $j_084 = 0, $div24 = 0.0, $23 = 0, $24 = 0.0, $conv36 = 0.0, $call37 = 0, $div41 = 0.0, $mul42 = 0.0, $call53 = 0, $div57 = 0.0, $conv67 = 0.0, $call71 = 0, $conv100 = 0.0, $radius = 0, $center_0 = 0, $center_1 = 0, $ambients_283 = 0, $k_082 = 0, $conv97 = 0.0, $add106 = 0.0, $conv119 = 0.0, $add_i_i = 0.0, $sub_i_i = 0.0, $31 = 0.0, $center_0_val = 0.0, $center_1_val = 0.0, $call122 = 0, $33 = 0, $position_sroa_0_0_insert_insert$0 = 0.0, $position_sroa_0_0_insert_insert$1 = 0.0, $36 = 0, $ambients_3 = 0, $inc130 = 0, $inc160 = 0, $ambients_1_lcssa = 0, $homeAsteroid_1_lcssa = 0, $inc163 = 0, $call167 = 0, $43 = 0, $add3_i = 0.0, $call171 = 0, $call172 = 0, $call174 = 0, label = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 6146
 STACKTOP = STACKTOP + 32 | 0; //@line 6146
 $_compoundliteral = sp | 0; //@line 6147
 $agg_tmp = sp + 16 | 0; //@line 6148
 $agg_tmp168 = sp + 24 | 0; //@line 6149
 $call1 = _aqinit(_aqalloc(2240) | 0) | 0; //@line 6151
 _AQLoop_boot(); //@line 6152
 _AQRenderer_boot(); //@line 6153
 $call8 = _AQLoop_world() | 0; //@line 6154
 HEAP32[622] = $call8; //@line 6155
 HEAPF32[$_compoundliteral >> 2] = 12800.0; //@line 6157
 HEAPF32[$_compoundliteral + 4 >> 2] = 12800.0; //@line 6159
 HEAPF32[$_compoundliteral + 8 >> 2] = 0.0; //@line 6161
 HEAPF32[$_compoundliteral + 12 >> 2] = 0.0; //@line 6163
 _AQWorld_setAabb($call8, $_compoundliteral) | 0; //@line 6164
 _AQInput_setWorldFrame(12800.0, 12800.0, 0.0, 0.0); //@line 6165
 HEAP32[780] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 6169
 $call16 = _SLAsteroidGroupView_create() | 0; //@line 6170
 $_compoundliteral_sroa_0_0__idx_i = $agg_tmp | 0; //@line 6171
 $_compoundliteral_sroa_1_4__idx1_i = $agg_tmp + 4 | 0; //@line 6172
 $i_087 = 0; //@line 6174
 $homeAsteroid_088 = 0; //@line 6174
 $ambients_089 = 0; //@line 6174
 while (1) {
  $conv49 = +($i_087 | 0); //@line 6179
  $mul79 = $conv49 * 400.0; //@line 6180
  if (($i_087 - 13 | 0) >>> 0 < 7) {
   $j_084_us = 0; //@line 6184
   $homeAsteroid_185_us = $homeAsteroid_088; //@line 6184
   $ambients_186_us = $ambients_089; //@line 6184
   while (1) {
    $div24_us = +(_rand() | 0) / 2147483647.0; //@line 6191
    $2 = HEAP32[622] | 0; //@line 6192
    $3 = +HEAPF32[$2 + 16 >> 2]; //@line 6194
    $conv36_us = $3 * .03125 * .125 + $div24_us * $3 * .03125 * .125; //@line 6203
    $call37_us = _rand() | 0; //@line 6204
    $div41_us = +HEAPF32[(HEAP32[622] | 0) + 16 >> 2] * .03125; //@line 6208
    $mul42_us = $conv36_us * 2.0; //@line 6209
    $call53_us = _rand() | 0; //@line 6217
    $div57_us = +HEAPF32[(HEAP32[622] | 0) + 12 >> 2] * .03125; //@line 6221
    $conv67_us = +($j_084_us | 0); //@line 6226
    HEAPF32[$_compoundliteral_sroa_0_0__idx_i >> 2] = +(($call37_us | 0) % (~~($div41_us - $mul42_us) | 0) | 0 | 0) + $conv49 * $div41_us + $conv36_us; //@line 6230
    HEAPF32[$_compoundliteral_sroa_1_4__idx1_i >> 2] = $conv36_us + (+(($call53_us | 0) % (~~($div57_us - $mul42_us) | 0) | 0 | 0) + $conv67_us * $div57_us); //@line 6231
    $call71_us = _SLAsteroid_create($2, $agg_tmp, $conv36_us) | 0; //@line 6232
    _AQList_push(HEAP32[780] | 0, $call71_us | 0) | 0; //@line 6235
    _SLAsteroidGroupView_addAsteroid($call16, $call71_us); //@line 6236
    $conv100_us = $conv67_us * 400.0; //@line 6238
    $radius_us = $call71_us + 20 | 0; //@line 6239
    $center_0_us = $call71_us + 12 | 0; //@line 6240
    $center_1_us = $call71_us + 16 | 0; //@line 6241
    $k_082_us = 0; //@line 6243
    $ambients_283_us = $ambients_186_us; //@line 6243
    while (1) {
     $conv97_us = $mul79 + +(($k_082_us | 0) % 9 | 0 | 0) * 44.44444274902344 + +((_rand() | 0) % 22 | 0 | 0) + 11.11111068725586; //@line 6255
     $add106_us = $conv100_us + +Math_floor(+(+(($k_082_us | 0) / 9 | 0 | 0))) * 44.44444274902344; //@line 6260
     $conv119_us = $add106_us + +((_rand() | 0) % 22 | 0 | 0) + 11.11111068725586; //@line 6266
     $add_i_i_us = $conv119_us + 20.0; //@line 6267
     $sub_i_i_us = $conv119_us + -20.0; //@line 6268
     $11 = +HEAPF32[$radius_us >> 2]; //@line 6270
     $center_0_val_us = +HEAPF32[$center_0_us >> 2]; //@line 6271
     $center_1_val_us = +HEAPF32[$center_1_us >> 2]; //@line 6272
     do {
      if ($conv97_us + -20.0 - $11 > $center_0_val_us) {
       label = 466; //@line 6278
      } else {
       if ($conv97_us + 20.0 + $11 < $center_0_val_us) {
        label = 466; //@line 6285
        break;
       }
       if ($sub_i_i_us - $11 > $center_1_val_us) {
        label = 466; //@line 6292
        break;
       }
       if ($11 + $add_i_i_us < $center_1_val_us) {
        label = 466; //@line 6299
       } else {
        $ambients_3_us = $ambients_283_us; //@line 6301
       }
      }
     } while (0);
     if ((label | 0) == 466) {
      label = 0; //@line 6306
      $call122_us = _aqcreate(2264) | 0; //@line 6308
      $13 = $call122_us + 48 | 0; //@line 6312
      $position_sroa_0_0_insert_insert_us$0 = +$conv97_us; //@line 6321
      $position_sroa_0_0_insert_insert_us$1 = +$conv119_us; //@line 6322
      HEAPF32[$13 >> 2] = $position_sroa_0_0_insert_insert_us$0; //@line 6324
      HEAPF32[$13 + 4 >> 2] = $position_sroa_0_0_insert_insert_us$1; //@line 6326
      $16 = $call122_us + 12 | 0; //@line 6327
      HEAPF32[$16 >> 2] = $position_sroa_0_0_insert_insert_us$0; //@line 6329
      HEAPF32[$16 + 4 >> 2] = $position_sroa_0_0_insert_insert_us$1; //@line 6331
      HEAPF32[$call122_us + 20 >> 2] = 11.11111068725586; //@line 6334
      HEAPF32[$call122_us + 32 >> 2] = 1.0; //@line 6337
      HEAPF32[$call122_us + 28 >> 2] = .009999999776482582; //@line 6340
      HEAP32[$call122_us + 104 >> 2] = _aqretain(_aqcreate(2032) | 0) | 0; //@line 6345
      HEAP32[$call122_us + 100 >> 2] = 17; //@line 6348
      _AQWorld_addParticle(HEAP32[622] | 0, $call122_us); //@line 6350
      $ambients_3_us = $ambients_283_us + 1 | 0; //@line 6352
     }
     $inc130_us = $k_082_us + 1 | 0; //@line 6355
     if (($inc130_us | 0) < 81) {
      $k_082_us = $inc130_us; //@line 6359
      $ambients_283_us = $ambients_3_us; //@line 6359
     } else {
      break;
     }
    }
    do {
     if (($j_084_us - 13 | 0) >>> 0 < 7) {
      if (($homeAsteroid_185_us | 0) == 0) {
       $homeAsteroid_2_us = $call71_us; //@line 6372
       break;
      }
      $homeAsteroid_2_us = (_rand() | 0) < 21474836 ? $call71_us : $homeAsteroid_185_us; //@line 6379
     } else {
      $homeAsteroid_2_us = $homeAsteroid_185_us; //@line 6381
     }
    } while (0);
    $inc160_us = $j_084_us + 1 | 0; //@line 6385
    if (($inc160_us | 0) < 32) {
     $j_084_us = $inc160_us; //@line 6389
     $homeAsteroid_185_us = $homeAsteroid_2_us; //@line 6389
     $ambients_186_us = $ambients_3_us; //@line 6389
    } else {
     $homeAsteroid_1_lcssa = $homeAsteroid_2_us; //@line 6391
     $ambients_1_lcssa = $ambients_3_us; //@line 6391
     break;
    }
   }
  } else {
   $j_084 = 0; //@line 6396
   $ambients_186 = $ambients_089; //@line 6396
   while (1) {
    $div24 = +(_rand() | 0) / 2147483647.0; //@line 6402
    $23 = HEAP32[622] | 0; //@line 6403
    $24 = +HEAPF32[$23 + 16 >> 2]; //@line 6405
    $conv36 = $24 * .03125 * .125 + $div24 * $24 * .03125 * .125; //@line 6414
    $call37 = _rand() | 0; //@line 6415
    $div41 = +HEAPF32[(HEAP32[622] | 0) + 16 >> 2] * .03125; //@line 6419
    $mul42 = $conv36 * 2.0; //@line 6420
    $call53 = _rand() | 0; //@line 6428
    $div57 = +HEAPF32[(HEAP32[622] | 0) + 12 >> 2] * .03125; //@line 6432
    $conv67 = +($j_084 | 0); //@line 6437
    HEAPF32[$_compoundliteral_sroa_0_0__idx_i >> 2] = +(($call37 | 0) % (~~($div41 - $mul42) | 0) | 0 | 0) + $conv49 * $div41 + $conv36; //@line 6441
    HEAPF32[$_compoundliteral_sroa_1_4__idx1_i >> 2] = $conv36 + (+(($call53 | 0) % (~~($div57 - $mul42) | 0) | 0 | 0) + $conv67 * $div57); //@line 6442
    $call71 = _SLAsteroid_create($23, $agg_tmp, $conv36) | 0; //@line 6443
    _AQList_push(HEAP32[780] | 0, $call71 | 0) | 0; //@line 6446
    _SLAsteroidGroupView_addAsteroid($call16, $call71); //@line 6447
    $conv100 = $conv67 * 400.0; //@line 6449
    $radius = $call71 + 20 | 0; //@line 6450
    $center_0 = $call71 + 12 | 0; //@line 6451
    $center_1 = $call71 + 16 | 0; //@line 6452
    $k_082 = 0; //@line 6454
    $ambients_283 = $ambients_186; //@line 6454
    while (1) {
     $conv97 = $mul79 + +(($k_082 | 0) % 9 | 0 | 0) * 44.44444274902344 + +((_rand() | 0) % 22 | 0 | 0) + 11.11111068725586; //@line 6466
     $add106 = $conv100 + +Math_floor(+(+(($k_082 | 0) / 9 | 0 | 0))) * 44.44444274902344; //@line 6471
     $conv119 = $add106 + +((_rand() | 0) % 22 | 0 | 0) + 11.11111068725586; //@line 6477
     $add_i_i = $conv119 + 20.0; //@line 6478
     $sub_i_i = $conv119 + -20.0; //@line 6479
     $31 = +HEAPF32[$radius >> 2]; //@line 6481
     $center_0_val = +HEAPF32[$center_0 >> 2]; //@line 6482
     $center_1_val = +HEAPF32[$center_1 >> 2]; //@line 6483
     do {
      if ($conv97 + -20.0 - $31 > $center_0_val) {
       label = 473; //@line 6489
      } else {
       if ($conv97 + 20.0 + $31 < $center_0_val) {
        label = 473; //@line 6496
        break;
       }
       if ($sub_i_i - $31 > $center_1_val) {
        label = 473; //@line 6503
        break;
       }
       if ($31 + $add_i_i < $center_1_val) {
        label = 473; //@line 6510
       } else {
        $ambients_3 = $ambients_283; //@line 6512
       }
      }
     } while (0);
     if ((label | 0) == 473) {
      label = 0; //@line 6517
      $call122 = _aqcreate(2264) | 0; //@line 6519
      $33 = $call122 + 48 | 0; //@line 6523
      $position_sroa_0_0_insert_insert$0 = +$conv97; //@line 6532
      $position_sroa_0_0_insert_insert$1 = +$conv119; //@line 6533
      HEAPF32[$33 >> 2] = $position_sroa_0_0_insert_insert$0; //@line 6535
      HEAPF32[$33 + 4 >> 2] = $position_sroa_0_0_insert_insert$1; //@line 6537
      $36 = $call122 + 12 | 0; //@line 6538
      HEAPF32[$36 >> 2] = $position_sroa_0_0_insert_insert$0; //@line 6540
      HEAPF32[$36 + 4 >> 2] = $position_sroa_0_0_insert_insert$1; //@line 6542
      HEAPF32[$call122 + 20 >> 2] = 11.11111068725586; //@line 6545
      HEAPF32[$call122 + 32 >> 2] = 1.0; //@line 6548
      HEAPF32[$call122 + 28 >> 2] = .009999999776482582; //@line 6551
      HEAP32[$call122 + 104 >> 2] = _aqretain(_aqcreate(2032) | 0) | 0; //@line 6556
      HEAP32[$call122 + 100 >> 2] = 17; //@line 6559
      _AQWorld_addParticle(HEAP32[622] | 0, $call122); //@line 6561
      $ambients_3 = $ambients_283 + 1 | 0; //@line 6563
     }
     $inc130 = $k_082 + 1 | 0; //@line 6566
     if (($inc130 | 0) < 81) {
      $k_082 = $inc130; //@line 6570
      $ambients_283 = $ambients_3; //@line 6570
     } else {
      break;
     }
    }
    $inc160 = $j_084 + 1 | 0; //@line 6575
    if (($inc160 | 0) < 32) {
     $j_084 = $inc160; //@line 6579
     $ambients_186 = $ambients_3; //@line 6579
    } else {
     $homeAsteroid_1_lcssa = $homeAsteroid_088; //@line 6581
     $ambients_1_lcssa = $ambients_3; //@line 6581
     break;
    }
   }
  }
  $inc163 = $i_087 + 1 | 0; //@line 6588
  if (($inc163 | 0) < 32) {
   $i_087 = $inc163; //@line 6592
   $homeAsteroid_088 = $homeAsteroid_1_lcssa; //@line 6592
   $ambients_089 = $ambients_1_lcssa; //@line 6592
  } else {
   break;
  }
 }
 _printf(416, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $ambients_1_lcssa, tempVarArgs) | 0) | 0; //@line 6597
 STACKTOP = tempVarArgs; //@line 6597
 if (($homeAsteroid_1_lcssa | 0) == 0) {
  ___assert_fail(1304, 1056, 143, 1632); //@line 6601
 } else {
  _SLAsteroid_setIsHome($homeAsteroid_1_lcssa, 1); //@line 6604
  HEAP32[$homeAsteroid_1_lcssa + 36 >> 2] = 1; //@line 6606
  $call167 = _SLParticleView_getAmbientParticleView() | 0; //@line 6607
  $43 = $call167; //@line 6608
  _SLParticleView_setHomeAsteroid($call167, $homeAsteroid_1_lcssa); //@line 6609
  _AQRenderer_addView($43); //@line 6610
  _AQLoop_addUpdater($43); //@line 6611
  _AQRenderer_addView($call16); //@line 6613
  $add3_i = +HEAPF32[$homeAsteroid_1_lcssa + 16 >> 2] + 5.0; //@line 6619
  HEAPF32[$agg_tmp168 >> 2] = +HEAPF32[$homeAsteroid_1_lcssa + 12 >> 2] + 5.0; //@line 6621
  HEAPF32[$agg_tmp168 + 4 >> 2] = $add3_i; //@line 6623
  $call171 = _SLLeaper_create($agg_tmp168) | 0; //@line 6624
  HEAP32[656] = $call171; //@line 6625
  _AQRenderer_addView($call171); //@line 6627
  HEAPF32[(HEAP32[656] | 0) + 24 >> 2] = .7853981852531433; //@line 6630
  HEAP32[(HEAP32[656] | 0) + 72 >> 2] = HEAP32[624]; //@line 6634
  HEAP32[(HEAP32[656] | 0) + 76 >> 2] = HEAP32[628]; //@line 6638
  _SLParticleView_setLeaper($call167, HEAP32[656] | 0); //@line 6640
  $call172 = _SLCameraController_create() | 0; //@line 6641
  $call174 = _SLCameraController_setHome(_SLCameraController_setLeaper($call172, HEAP32[656] | 0) | 0, $homeAsteroid_1_lcssa) | 0; //@line 6644
  HEAP32[776] = $call174; //@line 6645
  _AQLoop_addUpdater($call174); //@line 6647
  HEAPF32[(HEAP32[776] | 0) + 36 >> 2] = 4.0; //@line 6650
  _glGenBuffers(1, 3112); //@line 6651
  _aqfree($call1); //@line 6652
  STACKTOP = sp; //@line 6653
  return;
 }
}
function __AQDdvt_updateParticleChild($self, $particle, $lastAabb, $aabb) {
 $self = $self | 0;
 $particle = $particle | 0;
 $lastAabb = $lastAabb | 0;
 $aabb = $aabb | 0;
 var $0 = 0, $1 = 0.0, $right_i = 0, $9 = 0, $right_i70 = 0, $cmp8_i82 = 0, $tobool = 0, $length_i91 = 0, $20 = 0, $21 = 0, $removed_0 = 0, $added_0 = 0, $updated_0 = 0, $22 = 0, $23 = 0.0, $31 = 0, $cmp8_i131 = 0, $tobool21 = 0, $length_i155 = 0, $42 = 0, $43 = 0, $removed_1 = 0, $added_1 = 0, $updated_1 = 0, $44 = 0, $45 = 0.0, $53 = 0, $cmp8_i195 = 0, $tobool42 = 0, $length_i219 = 0, $64 = 0, $65 = 0, $removed_2 = 0, $added_2 = 0, $updated_2 = 0, $66 = 0, $67 = 0.0, $75 = 0, $cmp8_i148 = 0, $tobool63 = 0, $length_i = 0, $86 = 0, $87 = 0, $removed_3 = 0, $added_3 = 0, $tobool81 = 0, $tobool83 = 0, $length = 0, $length90 = 0, label = 0;
 $0 = HEAP32[$self + 32 >> 2] | 0; //@line 8945
 $1 = +HEAPF32[$0 + 24 >> 2]; //@line 8947
 $right_i = $aabb + 4 | 0; //@line 8948
 do {
  if ($1 < +HEAPF32[$right_i >> 2]) {
   if (+HEAPF32[$0 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $9 = 0; //@line 8961
    break;
   }
   if (+HEAPF32[$0 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $9 = 0; //@line 8971
    break;
   }
   $9 = +HEAPF32[$0 + 12 >> 2] > +HEAPF32[$aabb + 8 >> 2] | 0; //@line 8980
  } else {
   $9 = 0; //@line 8982
  }
 } while (0);
 $right_i70 = $lastAabb + 4 | 0; //@line 8986
 do {
  if ($1 < +HEAPF32[$right_i70 >> 2]) {
   if (+HEAPF32[$0 + 16 >> 2] <= +HEAPF32[$lastAabb + 12 >> 2]) {
    label = 776; //@line 8999
    break;
   }
   if (+HEAPF32[$0 + 20 >> 2] >= +HEAPF32[$lastAabb >> 2]) {
    label = 776; //@line 9009
    break;
   }
   $cmp8_i82 = +HEAPF32[$0 + 12 >> 2] > +HEAPF32[$lastAabb + 8 >> 2]; //@line 9016
   $tobool = ($9 | 0) != 0; //@line 9017
   if ($tobool & $cmp8_i82) {
    __AQDdvt_updateParticle($0, $particle, $lastAabb, $aabb); //@line 9021
    $updated_0 = 1; //@line 9023
    $added_0 = 0; //@line 9023
    $removed_0 = 0; //@line 9023
    break;
   }
   if ($tobool) {
    label = 780; //@line 9028
    break;
   }
   if (!$cmp8_i82) {
    $updated_0 = 0; //@line 9033
    $added_0 = 0; //@line 9033
    $removed_0 = 0; //@line 9033
    break;
   }
   __AQDdvt_removeParticle($0, $particle, $lastAabb); //@line 9036
   $updated_0 = 0; //@line 9038
   $added_0 = 0; //@line 9038
   $removed_0 = 1; //@line 9038
  } else {
   label = 776; //@line 9040
  }
 } while (0);
 if ((label | 0) == 776) {
  if (($9 | 0) == 0) {
   $updated_0 = 0; //@line 9047
   $added_0 = 0; //@line 9047
   $removed_0 = 0; //@line 9047
  } else {
   label = 780; //@line 9049
  }
 }
 L985 : do {
  if ((label | 0) == 780) {
   HEAP32[$0 + 28 >> 2] = 0; //@line 9055
   do {
    if ((HEAP32[$0 + 32 >> 2] | 0) == 0) {
     $length_i91 = $0 + 240 | 0; //@line 9062
     if ((HEAP32[$length_i91 >> 2] | 0) < 48) {
      $20 = _aqretain($particle) | 0; //@line 9069
      $21 = HEAP32[$length_i91 >> 2] | 0; //@line 9070
      HEAP32[$length_i91 >> 2] = $21 + 1; //@line 9072
      HEAP32[$0 + 48 + ($21 << 2) >> 2] = $20; //@line 9074
      $updated_0 = 0; //@line 9076
      $added_0 = 1; //@line 9076
      $removed_0 = 0; //@line 9076
      break L985;
     } else {
      __AQDdvt_toChildren($0); //@line 9079
      break;
     }
    }
   } while (0);
   __AQDdvt_addParticleChild($0, $particle, $aabb); //@line 9085
   $updated_0 = 0; //@line 9086
   $added_0 = 1; //@line 9086
   $removed_0 = 0; //@line 9086
  }
 } while (0);
 $22 = HEAP32[$self + 36 >> 2] | 0; //@line 9093
 $23 = +HEAPF32[$22 + 24 >> 2]; //@line 9095
 do {
  if ($23 < +HEAPF32[$right_i >> 2]) {
   if (+HEAPF32[$22 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $31 = 0; //@line 9108
    break;
   }
   if (+HEAPF32[$22 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $31 = 0; //@line 9118
    break;
   }
   $31 = +HEAPF32[$22 + 12 >> 2] > +HEAPF32[$aabb + 8 >> 2] | 0; //@line 9127
  } else {
   $31 = 0; //@line 9129
  }
 } while (0);
 do {
  if ($23 < +HEAPF32[$right_i70 >> 2]) {
   if (+HEAPF32[$22 + 16 >> 2] <= +HEAPF32[$lastAabb + 12 >> 2]) {
    label = 794; //@line 9145
    break;
   }
   if (+HEAPF32[$22 + 20 >> 2] >= +HEAPF32[$lastAabb >> 2]) {
    label = 794; //@line 9155
    break;
   }
   $cmp8_i131 = +HEAPF32[$22 + 12 >> 2] > +HEAPF32[$lastAabb + 8 >> 2]; //@line 9162
   $tobool21 = ($31 | 0) != 0; //@line 9163
   if ($tobool21 & $cmp8_i131) {
    __AQDdvt_updateParticle($22, $particle, $lastAabb, $aabb); //@line 9167
    $updated_1 = 1; //@line 9169
    $added_1 = $added_0; //@line 9169
    $removed_1 = $removed_0; //@line 9169
    break;
   }
   if ($tobool21) {
    label = 798; //@line 9174
    break;
   }
   if (!$cmp8_i131) {
    $updated_1 = $updated_0; //@line 9179
    $added_1 = $added_0; //@line 9179
    $removed_1 = $removed_0; //@line 9179
    break;
   }
   __AQDdvt_removeParticle($22, $particle, $lastAabb); //@line 9182
   $updated_1 = $updated_0; //@line 9184
   $added_1 = $added_0; //@line 9184
   $removed_1 = 1; //@line 9184
  } else {
   label = 794; //@line 9186
  }
 } while (0);
 if ((label | 0) == 794) {
  if (($31 | 0) == 0) {
   $updated_1 = $updated_0; //@line 9193
   $added_1 = $added_0; //@line 9193
   $removed_1 = $removed_0; //@line 9193
  } else {
   label = 798; //@line 9195
  }
 }
 L1010 : do {
  if ((label | 0) == 798) {
   HEAP32[$22 + 28 >> 2] = 0; //@line 9201
   do {
    if ((HEAP32[$22 + 32 >> 2] | 0) == 0) {
     $length_i155 = $22 + 240 | 0; //@line 9208
     if ((HEAP32[$length_i155 >> 2] | 0) < 48) {
      $42 = _aqretain($particle) | 0; //@line 9215
      $43 = HEAP32[$length_i155 >> 2] | 0; //@line 9216
      HEAP32[$length_i155 >> 2] = $43 + 1; //@line 9218
      HEAP32[$22 + 48 + ($43 << 2) >> 2] = $42; //@line 9220
      $updated_1 = $updated_0; //@line 9222
      $added_1 = 1; //@line 9222
      $removed_1 = $removed_0; //@line 9222
      break L1010;
     } else {
      __AQDdvt_toChildren($22); //@line 9225
      break;
     }
    }
   } while (0);
   __AQDdvt_addParticleChild($22, $particle, $aabb); //@line 9231
   $updated_1 = $updated_0; //@line 9232
   $added_1 = 1; //@line 9232
   $removed_1 = $removed_0; //@line 9232
  }
 } while (0);
 $44 = HEAP32[$self + 40 >> 2] | 0; //@line 9239
 $45 = +HEAPF32[$44 + 24 >> 2]; //@line 9241
 do {
  if ($45 < +HEAPF32[$right_i >> 2]) {
   if (+HEAPF32[$44 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $53 = 0; //@line 9254
    break;
   }
   if (+HEAPF32[$44 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $53 = 0; //@line 9264
    break;
   }
   $53 = +HEAPF32[$44 + 12 >> 2] > +HEAPF32[$aabb + 8 >> 2] | 0; //@line 9273
  } else {
   $53 = 0; //@line 9275
  }
 } while (0);
 do {
  if ($45 < +HEAPF32[$right_i70 >> 2]) {
   if (+HEAPF32[$44 + 16 >> 2] <= +HEAPF32[$lastAabb + 12 >> 2]) {
    label = 812; //@line 9291
    break;
   }
   if (+HEAPF32[$44 + 20 >> 2] >= +HEAPF32[$lastAabb >> 2]) {
    label = 812; //@line 9301
    break;
   }
   $cmp8_i195 = +HEAPF32[$44 + 12 >> 2] > +HEAPF32[$lastAabb + 8 >> 2]; //@line 9308
   $tobool42 = ($53 | 0) != 0; //@line 9309
   if ($tobool42 & $cmp8_i195) {
    __AQDdvt_updateParticle($44, $particle, $lastAabb, $aabb); //@line 9313
    $updated_2 = 1; //@line 9315
    $added_2 = $added_1; //@line 9315
    $removed_2 = $removed_1; //@line 9315
    break;
   }
   if ($tobool42) {
    label = 816; //@line 9320
    break;
   }
   if (!$cmp8_i195) {
    $updated_2 = $updated_1; //@line 9325
    $added_2 = $added_1; //@line 9325
    $removed_2 = $removed_1; //@line 9325
    break;
   }
   __AQDdvt_removeParticle($44, $particle, $lastAabb); //@line 9328
   $updated_2 = $updated_1; //@line 9330
   $added_2 = $added_1; //@line 9330
   $removed_2 = 1; //@line 9330
  } else {
   label = 812; //@line 9332
  }
 } while (0);
 if ((label | 0) == 812) {
  if (($53 | 0) == 0) {
   $updated_2 = $updated_1; //@line 9339
   $added_2 = $added_1; //@line 9339
   $removed_2 = $removed_1; //@line 9339
  } else {
   label = 816; //@line 9341
  }
 }
 L1035 : do {
  if ((label | 0) == 816) {
   HEAP32[$44 + 28 >> 2] = 0; //@line 9347
   do {
    if ((HEAP32[$44 + 32 >> 2] | 0) == 0) {
     $length_i219 = $44 + 240 | 0; //@line 9354
     if ((HEAP32[$length_i219 >> 2] | 0) < 48) {
      $64 = _aqretain($particle) | 0; //@line 9361
      $65 = HEAP32[$length_i219 >> 2] | 0; //@line 9362
      HEAP32[$length_i219 >> 2] = $65 + 1; //@line 9364
      HEAP32[$44 + 48 + ($65 << 2) >> 2] = $64; //@line 9366
      $updated_2 = $updated_1; //@line 9368
      $added_2 = 1; //@line 9368
      $removed_2 = $removed_1; //@line 9368
      break L1035;
     } else {
      __AQDdvt_toChildren($44); //@line 9371
      break;
     }
    }
   } while (0);
   __AQDdvt_addParticleChild($44, $particle, $aabb); //@line 9377
   $updated_2 = $updated_1; //@line 9378
   $added_2 = 1; //@line 9378
   $removed_2 = $removed_1; //@line 9378
  }
 } while (0);
 $66 = HEAP32[$self + 44 >> 2] | 0; //@line 9385
 $67 = +HEAPF32[$66 + 24 >> 2]; //@line 9387
 do {
  if ($67 < +HEAPF32[$right_i >> 2]) {
   if (+HEAPF32[$66 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $75 = 0; //@line 9400
    break;
   }
   if (+HEAPF32[$66 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $75 = 0; //@line 9410
    break;
   }
   $75 = +HEAPF32[$66 + 12 >> 2] > +HEAPF32[$aabb + 8 >> 2] | 0; //@line 9419
  } else {
   $75 = 0; //@line 9421
  }
 } while (0);
 do {
  if ($67 < +HEAPF32[$right_i70 >> 2]) {
   if (+HEAPF32[$66 + 16 >> 2] <= +HEAPF32[$lastAabb + 12 >> 2]) {
    label = 830; //@line 9437
    break;
   }
   if (+HEAPF32[$66 + 20 >> 2] >= +HEAPF32[$lastAabb >> 2]) {
    label = 830; //@line 9447
    break;
   }
   $cmp8_i148 = +HEAPF32[$66 + 12 >> 2] > +HEAPF32[$lastAabb + 8 >> 2]; //@line 9454
   $tobool63 = ($75 | 0) != 0; //@line 9455
   if ($tobool63 & $cmp8_i148) {
    __AQDdvt_updateParticle($66, $particle, $lastAabb, $aabb); //@line 9459
    return;
   }
   if ($tobool63) {
    label = 834; //@line 9465
    break;
   }
   if (!$cmp8_i148) {
    $added_3 = $added_2; //@line 9470
    $removed_3 = $removed_2; //@line 9470
    break;
   }
   __AQDdvt_removeParticle($66, $particle, $lastAabb); //@line 9473
   $added_3 = $added_2; //@line 9475
   $removed_3 = 1; //@line 9475
  } else {
   label = 830; //@line 9477
  }
 } while (0);
 if ((label | 0) == 830) {
  if (($75 | 0) == 0) {
   $added_3 = $added_2; //@line 9484
   $removed_3 = $removed_2; //@line 9484
  } else {
   label = 834; //@line 9486
  }
 }
 L1061 : do {
  if ((label | 0) == 834) {
   HEAP32[$66 + 28 >> 2] = 0; //@line 9492
   do {
    if ((HEAP32[$66 + 32 >> 2] | 0) == 0) {
     $length_i = $66 + 240 | 0; //@line 9499
     if ((HEAP32[$length_i >> 2] | 0) < 48) {
      $86 = _aqretain($particle) | 0; //@line 9506
      $87 = HEAP32[$length_i >> 2] | 0; //@line 9507
      HEAP32[$length_i >> 2] = $87 + 1; //@line 9509
      HEAP32[$66 + 48 + ($87 << 2) >> 2] = $86; //@line 9511
      $added_3 = 1; //@line 9513
      $removed_3 = $removed_2; //@line 9513
      break L1061;
     } else {
      __AQDdvt_toChildren($66); //@line 9516
      break;
     }
    }
   } while (0);
   __AQDdvt_addParticleChild($66, $particle, $aabb); //@line 9522
   $added_3 = 1; //@line 9523
   $removed_3 = $removed_2; //@line 9523
  }
 } while (0);
 if (($updated_2 | 0) != 0) {
  return;
 }
 $tobool81 = ($added_3 | 0) != 0; //@line 9533
 $tobool83 = ($removed_3 | 0) == 0; //@line 9534
 if ($tobool81 & $tobool83) {
  $length = $self + 240 | 0; //@line 9538
  HEAP32[$length >> 2] = (HEAP32[$length >> 2] | 0) + 1; //@line 9541
 }
 if ($tobool83 | $tobool81) {
  return;
 }
 $length90 = $self + 240 | 0; //@line 9549
 HEAP32[$length90 >> 2] = (HEAP32[$length90 >> 2] | 0) - 1; //@line 9552
 return;
}
function __AQDdvt_toChildren($self) {
 $self = $self | 0;
 var $aabb15 = 0, $aabb59_sroa_0_0_tmp60_idx = 0, $aabb59_sroa_0_0_copyload = 0.0, $aabb59_sroa_1_4_tmp60_idx212 = 0, $aabb59_sroa_1_4_copyload = 0.0, $aabb59_sroa_2_8_tmp60_idx213 = 0, $aabb59_sroa_2_8_copyload = 0.0, $aabb59_sroa_3_12_tmp60_idx214 = 0, $aabb59_sroa_3_12_copyload = 0.0, $call_i = 0, $tl = 0, $aabb64_sroa_0_0_copyload = 0.0, $aabb64_sroa_1_4_copyload = 0.0, $aabb64_sroa_2_8_copyload = 0.0, $aabb64_sroa_3_12_copyload = 0.0, $mul_i_i_i71 = 0.0, $add_i3_i = 0.0, $add3_i_i = 0.0, $call_i80 = 0, $tr = 0, $aabb82_sroa_0_0_copyload = 0.0, $aabb82_sroa_1_4_copyload = 0.0, $aabb82_sroa_2_8_copyload = 0.0, $aabb82_sroa_3_12_copyload = 0.0, $mul1_i_i_i96 = 0.0, $sub3_i_i = 0.0, $call_i106 = 0, $bl = 0, $aabb108_sroa_0_0_copyload = 0.0, $aabb108_sroa_1_4_copyload = 0.0, $aabb108_sroa_2_8_copyload = 0.0, $aabb108_sroa_3_12_copyload = 0.0, $mul_i_i_i118 = 0.0, $mul1_i_i_i119 = 0.0, $add_i3_i120 = 0.0, $add3_i_i121 = 0.0, $call_i131 = 0, $br = 0, $4 = 0, $right_i134 = 0, $left2_i137 = 0, $top_i141 = 0, $bottom7_i145 = 0, $index_0236 = 0, $5 = 0, $6 = 0, $length_i = 0, $18 = 0, $19 = 0, $20 = 0, $length_i155 = 0, $32 = 0, $33 = 0, $34 = 0, $length_i171 = 0, $46 = 0, $47 = 0, $48 = 0, $length_i187 = 0, $60 = 0, $61 = 0, sp = 0;
 sp = STACKTOP; //@line 9631
 STACKTOP = STACKTOP + 16 | 0; //@line 9631
 $aabb15 = sp | 0; //@line 9632
 $aabb59_sroa_0_0_tmp60_idx = $self + 12 | 0; //@line 9633
 $aabb59_sroa_0_0_copyload = (copyTempFloat($aabb59_sroa_0_0_tmp60_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9634
 $aabb59_sroa_1_4_tmp60_idx212 = $self + 16 | 0; //@line 9635
 $aabb59_sroa_1_4_copyload = (copyTempFloat($aabb59_sroa_1_4_tmp60_idx212 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9636
 $aabb59_sroa_2_8_tmp60_idx213 = $self + 20 | 0; //@line 9637
 $aabb59_sroa_2_8_copyload = (copyTempFloat($aabb59_sroa_2_8_tmp60_idx213 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9638
 $aabb59_sroa_3_12_tmp60_idx214 = $self + 24 | 0; //@line 9639
 $aabb59_sroa_3_12_copyload = (copyTempFloat($aabb59_sroa_3_12_tmp60_idx214 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9640
 $call_i = _aqcreate(2400) | 0; //@line 9647
 HEAPF32[$call_i + 12 >> 2] = $aabb59_sroa_0_0_copyload; //@line 9650
 HEAPF32[$call_i + 16 >> 2] = $aabb59_sroa_3_12_copyload + ($aabb59_sroa_1_4_copyload - $aabb59_sroa_3_12_copyload) * .5; //@line 9653
 HEAPF32[$call_i + 20 >> 2] = $aabb59_sroa_0_0_copyload - ($aabb59_sroa_0_0_copyload - $aabb59_sroa_2_8_copyload) * .5; //@line 9656
 HEAPF32[$call_i + 24 >> 2] = $aabb59_sroa_3_12_copyload; //@line 9659
 $tl = $self + 32 | 0; //@line 9662
 HEAP32[$tl >> 2] = _aqretain($call_i) | 0; //@line 9663
 $aabb64_sroa_0_0_copyload = (copyTempFloat($aabb59_sroa_0_0_tmp60_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9664
 $aabb64_sroa_1_4_copyload = (copyTempFloat($aabb59_sroa_1_4_tmp60_idx212 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9665
 $aabb64_sroa_2_8_copyload = (copyTempFloat($aabb59_sroa_2_8_tmp60_idx213 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9666
 $aabb64_sroa_3_12_copyload = (copyTempFloat($aabb59_sroa_3_12_tmp60_idx214 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9667
 $mul_i_i_i71 = ($aabb64_sroa_1_4_copyload - $aabb64_sroa_3_12_copyload) * .5; //@line 9670
 $add_i3_i = $aabb64_sroa_3_12_copyload + $mul_i_i_i71; //@line 9672
 $add3_i_i = $aabb64_sroa_0_0_copyload + 0.0; //@line 9673
 $call_i80 = _aqcreate(2400) | 0; //@line 9676
 HEAPF32[$call_i80 + 12 >> 2] = $add3_i_i; //@line 9679
 HEAPF32[$call_i80 + 16 >> 2] = $mul_i_i_i71 + $add_i3_i; //@line 9682
 HEAPF32[$call_i80 + 20 >> 2] = $add3_i_i - ($aabb64_sroa_0_0_copyload - $aabb64_sroa_2_8_copyload) * .5; //@line 9685
 HEAPF32[$call_i80 + 24 >> 2] = $add_i3_i; //@line 9688
 $tr = $self + 36 | 0; //@line 9691
 HEAP32[$tr >> 2] = _aqretain($call_i80) | 0; //@line 9692
 $aabb82_sroa_0_0_copyload = (copyTempFloat($aabb59_sroa_0_0_tmp60_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9693
 $aabb82_sroa_1_4_copyload = (copyTempFloat($aabb59_sroa_1_4_tmp60_idx212 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9694
 $aabb82_sroa_2_8_copyload = (copyTempFloat($aabb59_sroa_2_8_tmp60_idx213 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9695
 $aabb82_sroa_3_12_copyload = (copyTempFloat($aabb59_sroa_3_12_tmp60_idx214 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9696
 $mul1_i_i_i96 = ($aabb82_sroa_0_0_copyload - $aabb82_sroa_2_8_copyload) * .5; //@line 9700
 $sub3_i_i = $aabb82_sroa_0_0_copyload - $mul1_i_i_i96; //@line 9701
 $call_i106 = _aqcreate(2400) | 0; //@line 9704
 HEAPF32[$call_i106 + 12 >> 2] = $sub3_i_i; //@line 9707
 HEAPF32[$call_i106 + 16 >> 2] = $aabb82_sroa_3_12_copyload + ($aabb82_sroa_1_4_copyload - $aabb82_sroa_3_12_copyload) * .5; //@line 9710
 HEAPF32[$call_i106 + 20 >> 2] = $sub3_i_i - $mul1_i_i_i96; //@line 9713
 HEAPF32[$call_i106 + 24 >> 2] = $aabb82_sroa_3_12_copyload; //@line 9716
 $bl = $self + 40 | 0; //@line 9719
 HEAP32[$bl >> 2] = _aqretain($call_i106) | 0; //@line 9720
 $aabb108_sroa_0_0_copyload = (copyTempFloat($aabb59_sroa_0_0_tmp60_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9721
 $aabb108_sroa_1_4_copyload = (copyTempFloat($aabb59_sroa_1_4_tmp60_idx212 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9722
 $aabb108_sroa_2_8_copyload = (copyTempFloat($aabb59_sroa_2_8_tmp60_idx213 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9723
 $aabb108_sroa_3_12_copyload = (copyTempFloat($aabb59_sroa_3_12_tmp60_idx214 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 9724
 $mul_i_i_i118 = ($aabb108_sroa_1_4_copyload - $aabb108_sroa_3_12_copyload) * .5; //@line 9727
 $mul1_i_i_i119 = ($aabb108_sroa_0_0_copyload - $aabb108_sroa_2_8_copyload) * .5; //@line 9728
 $add_i3_i120 = $aabb108_sroa_3_12_copyload + $mul_i_i_i118; //@line 9729
 $add3_i_i121 = $aabb108_sroa_0_0_copyload - $mul1_i_i_i119; //@line 9730
 $call_i131 = _aqcreate(2400) | 0; //@line 9733
 HEAPF32[$call_i131 + 12 >> 2] = $add3_i_i121; //@line 9736
 HEAPF32[$call_i131 + 16 >> 2] = $mul_i_i_i118 + $add_i3_i120; //@line 9739
 HEAPF32[$call_i131 + 20 >> 2] = $add3_i_i121 - $mul1_i_i_i119; //@line 9742
 HEAPF32[$call_i131 + 24 >> 2] = $add_i3_i120; //@line 9745
 $br = $self + 44 | 0; //@line 9748
 HEAP32[$br >> 2] = _aqretain($call_i131) | 0; //@line 9749
 $4 = HEAP32[$self + 240 >> 2] | 0; //@line 9751
 if (($4 | 0) <= 0) {
  STACKTOP = sp; //@line 9755
  return;
 }
 $right_i134 = $aabb15 + 4 | 0; //@line 9757
 $left2_i137 = $aabb15 + 12 | 0; //@line 9758
 $top_i141 = $aabb15 | 0; //@line 9759
 $bottom7_i145 = $aabb15 + 8 | 0; //@line 9760
 $index_0236 = 0; //@line 9762
 do {
  $5 = HEAP32[$self + 48 + ($index_0236 << 2) >> 2] | 0; //@line 9766
  _AQParticle_aabb($aabb15, $5); //@line 9767
  $6 = HEAP32[$tl >> 2] | 0; //@line 9768
  L1095 : do {
   if (+HEAPF32[$6 + 24 >> 2] < +HEAPF32[$right_i134 >> 2]) {
    if (+HEAPF32[$6 + 16 >> 2] <= +HEAPF32[$left2_i137 >> 2]) {
     break;
    }
    if (+HEAPF32[$6 + 20 >> 2] >= +HEAPF32[$top_i141 >> 2]) {
     break;
    }
    if (+HEAPF32[$6 + 12 >> 2] <= +HEAPF32[$bottom7_i145 >> 2]) {
     break;
    }
    HEAP32[$6 + 28 >> 2] = 0; //@line 9801
    do {
     if ((HEAP32[$6 + 32 >> 2] | 0) == 0) {
      $length_i = $6 + 240 | 0; //@line 9808
      if ((HEAP32[$length_i >> 2] | 0) < 48) {
       $18 = _aqretain($5) | 0; //@line 9815
       $19 = HEAP32[$length_i >> 2] | 0; //@line 9816
       HEAP32[$length_i >> 2] = $19 + 1; //@line 9818
       HEAP32[$6 + 48 + ($19 << 2) >> 2] = $18; //@line 9820
       break L1095;
      } else {
       __AQDdvt_toChildren($6); //@line 9824
       break;
      }
     }
    } while (0);
    __AQDdvt_addParticleChild($6, $5, $aabb15); //@line 9830
   }
  } while (0);
  $20 = HEAP32[$tr >> 2] | 0; //@line 9833
  L1107 : do {
   if (+HEAPF32[$20 + 24 >> 2] < +HEAPF32[$right_i134 >> 2]) {
    if (+HEAPF32[$20 + 16 >> 2] <= +HEAPF32[$left2_i137 >> 2]) {
     break;
    }
    if (+HEAPF32[$20 + 20 >> 2] >= +HEAPF32[$top_i141 >> 2]) {
     break;
    }
    if (+HEAPF32[$20 + 12 >> 2] <= +HEAPF32[$bottom7_i145 >> 2]) {
     break;
    }
    HEAP32[$20 + 28 >> 2] = 0; //@line 9866
    do {
     if ((HEAP32[$20 + 32 >> 2] | 0) == 0) {
      $length_i155 = $20 + 240 | 0; //@line 9873
      if ((HEAP32[$length_i155 >> 2] | 0) < 48) {
       $32 = _aqretain($5) | 0; //@line 9880
       $33 = HEAP32[$length_i155 >> 2] | 0; //@line 9881
       HEAP32[$length_i155 >> 2] = $33 + 1; //@line 9883
       HEAP32[$20 + 48 + ($33 << 2) >> 2] = $32; //@line 9885
       break L1107;
      } else {
       __AQDdvt_toChildren($20); //@line 9889
       break;
      }
     }
    } while (0);
    __AQDdvt_addParticleChild($20, $5, $aabb15); //@line 9895
   }
  } while (0);
  $34 = HEAP32[$bl >> 2] | 0; //@line 9898
  L1119 : do {
   if (+HEAPF32[$34 + 24 >> 2] < +HEAPF32[$right_i134 >> 2]) {
    if (+HEAPF32[$34 + 16 >> 2] <= +HEAPF32[$left2_i137 >> 2]) {
     break;
    }
    if (+HEAPF32[$34 + 20 >> 2] >= +HEAPF32[$top_i141 >> 2]) {
     break;
    }
    if (+HEAPF32[$34 + 12 >> 2] <= +HEAPF32[$bottom7_i145 >> 2]) {
     break;
    }
    HEAP32[$34 + 28 >> 2] = 0; //@line 9931
    do {
     if ((HEAP32[$34 + 32 >> 2] | 0) == 0) {
      $length_i171 = $34 + 240 | 0; //@line 9938
      if ((HEAP32[$length_i171 >> 2] | 0) < 48) {
       $46 = _aqretain($5) | 0; //@line 9945
       $47 = HEAP32[$length_i171 >> 2] | 0; //@line 9946
       HEAP32[$length_i171 >> 2] = $47 + 1; //@line 9948
       HEAP32[$34 + 48 + ($47 << 2) >> 2] = $46; //@line 9950
       break L1119;
      } else {
       __AQDdvt_toChildren($34); //@line 9954
       break;
      }
     }
    } while (0);
    __AQDdvt_addParticleChild($34, $5, $aabb15); //@line 9960
   }
  } while (0);
  $48 = HEAP32[$br >> 2] | 0; //@line 9963
  L1131 : do {
   if (+HEAPF32[$48 + 24 >> 2] < +HEAPF32[$right_i134 >> 2]) {
    if (+HEAPF32[$48 + 16 >> 2] <= +HEAPF32[$left2_i137 >> 2]) {
     break;
    }
    if (+HEAPF32[$48 + 20 >> 2] >= +HEAPF32[$top_i141 >> 2]) {
     break;
    }
    if (+HEAPF32[$48 + 12 >> 2] <= +HEAPF32[$bottom7_i145 >> 2]) {
     break;
    }
    HEAP32[$48 + 28 >> 2] = 0; //@line 9996
    do {
     if ((HEAP32[$48 + 32 >> 2] | 0) == 0) {
      $length_i187 = $48 + 240 | 0; //@line 10003
      if ((HEAP32[$length_i187 >> 2] | 0) < 48) {
       $60 = _aqretain($5) | 0; //@line 10010
       $61 = HEAP32[$length_i187 >> 2] | 0; //@line 10011
       HEAP32[$length_i187 >> 2] = $61 + 1; //@line 10013
       HEAP32[$48 + 48 + ($61 << 2) >> 2] = $60; //@line 10015
       break L1131;
      } else {
       __AQDdvt_toChildren($48); //@line 10019
       break;
      }
     }
    } while (0);
    __AQDdvt_addParticleChild($48, $5, $aabb15); //@line 10025
   }
  } while (0);
  _aqautorelease($5) | 0; //@line 10029
  $index_0236 = $index_0236 + 1 | 0; //@line 10030
 } while (($index_0236 | 0) < ($4 | 0));
 STACKTOP = sp; //@line 10039
 return;
}
function _main_loop() {
 var $event_i = 0, $screenWidth_i = 0, $screenHeight_i = 0, $call1_i = 0, $3 = 0, $state_i = 0, $4 = 0, $call2_i = 0, $6 = 0, $8 = 0, $call5_i = 0, $hadEvent_0_i = 0, $type_i = 0, $9 = 0, $h_i = 0, $10 = 0, $x_i = 0, $11 = 0, $12 = 0, $13 = 0, $15 = 0, $conv_i = 0.0, $conv23_i = 0.0, $conv26_i = 0, $conv27_i = 0.0, $20 = 0, $22 = 0, $26 = 0, $33 = 0, $36 = 0, $conv59_i = 0.0, $conv61_i = 0.0, $conv63_i = 0.0, $41 = 0, $call70_i = 0, $43 = 0, $45 = 0, $call75_i = 0, $57 = 0, $call95_i = 0, $61 = 0, $62 = 0, $conv98_i = 0.0, $conv100_i = 0.0, $conv102_i = 0.0, $conv104_i = 0.0, $67 = 0, $call = 0, $68 = 0, $sub = 0, $conv = 0.0, $div = 0.0, $conv1 = 0.0, label = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 7403
 STACKTOP = STACKTOP + 64 | 0; //@line 7403
 $event_i = sp | 0; //@line 7404
 $screenWidth_i = sp + 48 | 0; //@line 7405
 $screenHeight_i = sp + 56 | 0; //@line 7406
 $call1_i = _aqinit(_aqalloc(2240) | 0) | 0; //@line 7411
 $3 = HEAP32[638] | 0; //@line 7412
 do {
  if (($3 | 0) == 0) {
   $hadEvent_0_i = 0; //@line 7417
  } else {
   $state_i = $3 + 12 | 0; //@line 7419
   $4 = HEAP32[$state_i >> 2] | 0; //@line 7420
   if (($4 & 7 | 0) == 0) {
    $call2_i = _AQInput_getTouches() | 0; //@line 7425
    $6 = HEAP32[638] | 0; //@line 7427
    _AQArray_remove($call2_i, $6) | 0; //@line 7428
    $8 = HEAP32[638] | 0; //@line 7430
    _aqrelease($8) | 0; //@line 7431
    HEAP32[638] = 0; //@line 7432
    $call5_i = _AQArray_length($call2_i) | 0; //@line 7433
    _printf(840, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $call5_i, tempVarArgs) | 0) | 0; //@line 7434
    STACKTOP = tempVarArgs; //@line 7434
    $hadEvent_0_i = 0; //@line 7436
    break;
   }
   if (($4 & 3 | 0) == 0) {
    $hadEvent_0_i = 0; //@line 7443
    break;
   }
   HEAP32[$state_i >> 2] = 4; //@line 7446
   _stepInputWaterTest(); //@line 7447
   $hadEvent_0_i = 1; //@line 7449
  }
 } while (0);
 _AQInput_getScreenSize($screenWidth_i, $screenHeight_i); //@line 7453
 if ((_SDL_PollEvent($event_i | 0) | 0) == 0) {
  if (($hadEvent_0_i | 0) != 0) {
   _aqfree($call1_i); //@line 7461
   $call = _SDL_GetTicks() | 0; //@line 7462
   $68 = HEAP32[658] | 0; //@line 7463
   $sub = $call - $68 | 0; //@line 7464
   $conv = +($sub | 0); //@line 7465
   $div = $conv / 1.0e3; //@line 7466
   $conv1 = $div; //@line 7467
   _stepWaterTest($conv1); //@line 7468
   _drawWaterTest(); //@line 7469
   HEAP32[658] = $call; //@line 7470
   STACKTOP = sp; //@line 7471
   return;
  }
  _stepInputWaterTest(); //@line 7473
  _aqfree($call1_i); //@line 7475
  $call = _SDL_GetTicks() | 0; //@line 7476
  $68 = HEAP32[658] | 0; //@line 7477
  $sub = $call - $68 | 0; //@line 7478
  $conv = +($sub | 0); //@line 7479
  $div = $conv / 1.0e3; //@line 7480
  $conv1 = $div; //@line 7481
  _stepWaterTest($conv1); //@line 7482
  _drawWaterTest(); //@line 7483
  HEAP32[658] = $call; //@line 7484
  STACKTOP = sp; //@line 7485
  return;
 }
 $type_i = $event_i | 0; //@line 7487
 $9 = $event_i + 4 | 0; //@line 7488
 $h_i = $event_i + 8 | 0; //@line 7489
 $10 = $h_i; //@line 7490
 $x_i = $event_i + 12 | 0; //@line 7492
 $11 = $event_i + 16 | 0; //@line 7494
 $12 = $h_i; //@line 7495
 L742 : while (1) {
  $13 = HEAP32[$type_i >> 2] | 0; //@line 7498
  do {
   if (($13 | 0) == 1025) {
    $41 = HEAP32[638] | 0; //@line 7501
    if (($41 | 0) != 0) {
     HEAP32[$41 + 12 >> 2] = 16; //@line 7506
     $call70_i = _AQInput_getTouches() | 0; //@line 7507
     $43 = HEAP32[638] | 0; //@line 7509
     _AQArray_remove($call70_i, $43) | 0; //@line 7510
     $45 = HEAP32[638] | 0; //@line 7512
     _aqrelease($45) | 0; //@line 7513
    }
    $call75_i = _aqretain(_aqcreate(2104) | 0) | 0; //@line 7517
    HEAP32[638] = $call75_i; //@line 7519
    HEAP32[$call75_i + 12 >> 2] = 1; //@line 7522
    HEAP32[(HEAP32[638] | 0) + 16 >> 2] = HEAPU8[$12] | 0; //@line 7527
    HEAPF32[(HEAP32[638] | 0) + 20 >> 2] = +(HEAP32[$x_i >> 2] | 0); //@line 7532
    HEAPF32[(HEAP32[638] | 0) + 24 >> 2] = +HEAPF32[$screenHeight_i >> 2] - +(HEAP32[$11 >> 2] | 0); //@line 7539
    HEAPF32[(HEAP32[638] | 0) + 28 >> 2] = 0.0; //@line 7542
    HEAPF32[(HEAP32[638] | 0) + 32 >> 2] = 0.0; //@line 7545
    $57 = HEAP32[638] | 0; //@line 7546
    _AQInput_screenToWorld(+HEAPF32[$57 + 20 >> 2], +HEAPF32[$57 + 24 >> 2], $57 + 36 | 0, $57 + 40 | 0); //@line 7553
    $call95_i = _AQInput_getTouches() | 0; //@line 7554
    $61 = HEAP32[638] | 0; //@line 7556
    _AQArray_push($call95_i, $61) | 0; //@line 7557
    $62 = HEAP32[638] | 0; //@line 7558
    $conv98_i = +HEAPF32[$62 + 20 >> 2]; //@line 7561
    $conv100_i = +HEAPF32[$62 + 24 >> 2]; //@line 7564
    $conv102_i = +HEAPF32[$62 + 36 >> 2]; //@line 7567
    $conv104_i = +HEAPF32[$62 + 40 >> 2]; //@line 7570
    _printf(328, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 32 | 0, HEAPF64[tempVarArgs >> 3] = $conv98_i, HEAPF64[tempVarArgs + 8 >> 3] = $conv100_i, HEAPF64[tempVarArgs + 16 >> 3] = $conv102_i, HEAPF64[tempVarArgs + 24 >> 3] = $conv104_i, tempVarArgs) | 0) | 0; //@line 7571
    STACKTOP = tempVarArgs; //@line 7571
   } else if (($13 | 0) == 1026) {
    $67 = HEAP32[638] | 0; //@line 7574
    if (($67 | 0) == 0) {
     break;
    }
    HEAP32[$67 + 12 >> 2] = 8; //@line 7581
   } else if (($13 | 0) == 256) {
    label = 596; //@line 7584
    break L742;
   } else if (($13 | 0) == 28673) {
    $15 = HEAP32[$10 >> 2] | 0; //@line 7588
    _printf(528, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempVarArgs >> 2] = HEAP32[$9 >> 2], HEAP32[tempVarArgs + 8 >> 2] = $15, tempVarArgs) | 0) | 0; //@line 7589
    STACKTOP = tempVarArgs; //@line 7589
    $conv_i = +(HEAP32[$9 >> 2] | 0); //@line 7591
    HEAPF32[$screenWidth_i >> 2] = $conv_i; //@line 7592
    $conv23_i = +(HEAP32[$10 >> 2] | 0); //@line 7594
    HEAPF32[$screenHeight_i >> 2] = $conv23_i; //@line 7595
    $conv26_i = ~~($conv_i > $conv23_i ? $conv_i : $conv23_i); //@line 7598
    _AQInput_setScreenSize($conv_i, $conv23_i); //@line 7599
    $conv27_i = +($conv26_i | 0); //@line 7601
    _glViewport(~~((+HEAPF32[$screenWidth_i >> 2] - $conv27_i) * .5) | 0, ~~((+HEAPF32[$screenHeight_i >> 2] - $conv27_i) * .5) | 0, $conv26_i | 0, $conv26_i | 0); //@line 7609
   } else if (($13 | 0) == 1024) {
    $20 = HEAP32[638] | 0; //@line 7612
    if (($20 | 0) == 0) {
     break;
    }
    HEAP32[$20 + 12 >> 2] = 2; //@line 7619
    $22 = HEAP32[638] | 0; //@line 7622
    HEAPF32[$22 + 28 >> 2] = +(HEAP32[$x_i >> 2] | 0) - +HEAPF32[$22 + 20 >> 2]; //@line 7627
    $26 = HEAP32[638] | 0; //@line 7632
    HEAPF32[$26 + 32 >> 2] = +HEAPF32[$screenHeight_i >> 2] - +(HEAP32[$11 >> 2] | 0) - +HEAPF32[$26 + 24 >> 2]; //@line 7637
    HEAPF32[(HEAP32[638] | 0) + 20 >> 2] = +(HEAP32[$x_i >> 2] | 0); //@line 7642
    HEAPF32[(HEAP32[638] | 0) + 24 >> 2] = +HEAPF32[$screenHeight_i >> 2] - +(HEAP32[$11 >> 2] | 0); //@line 7649
    $33 = HEAP32[638] | 0; //@line 7650
    _AQInput_screenToWorld(+HEAPF32[$33 + 20 >> 2], +HEAPF32[$33 + 24 >> 2], $33 + 36 | 0, $33 + 40 | 0); //@line 7657
    $36 = HEAP32[638] | 0; //@line 7658
    $conv59_i = +HEAPF32[$36 + 24 >> 2]; //@line 7664
    $conv61_i = +HEAPF32[$36 + 36 >> 2]; //@line 7667
    $conv63_i = +HEAPF32[$36 + 40 >> 2]; //@line 7670
    _printf(392, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 32 | 0, HEAPF64[tempVarArgs >> 3] = +HEAPF32[$36 + 20 >> 2], HEAPF64[tempVarArgs + 8 >> 3] = $conv59_i, HEAPF64[tempVarArgs + 16 >> 3] = $conv61_i, HEAPF64[tempVarArgs + 24 >> 3] = $conv63_i, tempVarArgs) | 0) | 0; //@line 7671
    STACKTOP = tempVarArgs; //@line 7671
   }
  } while (0);
  _stepInputWaterTest(); //@line 7675
  if ((_SDL_PollEvent($event_i | 0) | 0) == 0) {
   label = 601; //@line 7680
   break;
  }
 }
 if ((label | 0) == 601) {
  _aqfree($call1_i); //@line 7685
  $call = _SDL_GetTicks() | 0; //@line 7686
  $68 = HEAP32[658] | 0; //@line 7687
  $sub = $call - $68 | 0; //@line 7688
  $conv = +($sub | 0); //@line 7689
  $div = $conv / 1.0e3; //@line 7690
  $conv1 = $div; //@line 7691
  _stepWaterTest($conv1); //@line 7692
  _drawWaterTest(); //@line 7693
  HEAP32[658] = $call; //@line 7694
  STACKTOP = sp; //@line 7695
  return;
 } else if ((label | 0) == 596) {
  _SDL_Quit(); //@line 7698
  _exit(0); //@line 7699
 }
}
function __SLCameraController_update($self, $dt) {
 $self = $self | 0;
 $dt = +$dt;
 var $screenWidth = 0, $screenHeight = 0, $call = 0, $1 = 0.0, $inputPressed = 0, $3 = 0, $currentScale = 0, $conv = 0.0, $conv10 = 0.0, $currentScale11 = 0, $conv12 = 0.0, $conv16 = 0.0, $7 = 0.0, $conv18 = 0.0, $currentScale20 = 0, $state31 = 0, $10 = 0, $11 = 0, $sub_i106 = 0.0, $sub3_i107 = 0.0, $div_i101 = 0.0, $targetRotation_0126 = 0.0, $conv56127 = 0.0, $radians = 0, $12 = 0.0, $conv57128 = 0.0, $sub58129 = 0.0, $targetRotation_0_lcssa = 0.0, $conv65119 = 0.0, $add68121 = 0.0, $conv56131 = 0.0, $targetRotation_0 = 0.0, $conv56 = 0.0, $conv65123 = 0.0, $conv74 = 0.0, $conv65 = 0.0, $targetRotation_1_lcssa = 0.0, $13 = 0, $14 = 0, $center = 0, $center_0_val = 0.0, $center_1_val = 0.0, $15 = 0, $tmp99_sroa_0_0_insert_insert$1 = 0.0, $radians101 = 0, $19 = 0, $position125_0_val = 0.0, $position125_1_val = 0.0, $sub_i86 = 0.0, $sub3_i = 0.0, $div_i = 0.0, $add133 = 0.0, $center134 = 0, $center134_0_val = 0.0, $center134_1_val = 0.0, $22 = 0, $tmp136_sroa_0_0_insert_insert$1 = 0.0, $center138 = 0, $center138_0_val = 0.0, $center138_1_val = 0.0, $25 = 0, $tmp141_sroa_0_0_insert_insert$1 = 0.0, $mul147 = 0.0, $30 = 0.0, $31 = 0.0, label = 0, sp = 0;
 sp = STACKTOP; //@line 670
 STACKTOP = STACKTOP + 16 | 0; //@line 670
 $screenWidth = sp | 0; //@line 671
 $screenHeight = sp + 8 | 0; //@line 672
 _AQInput_getScreenSize($screenWidth, $screenHeight); //@line 673
 $call = _AQRenderer_camera() | 0; //@line 674
 $1 = +HEAPF32[$screenWidth >> 2]; //@line 676
 HEAPF32[$call + 28 >> 2] = +HEAPF32[$screenHeight >> 2]; //@line 678
 HEAPF32[$call + 32 >> 2] = $1; //@line 680
 HEAPF32[$call + 36 >> 2] = 0.0; //@line 682
 HEAPF32[$call + 40 >> 2] = 0.0; //@line 684
 if (!(HEAP8[1800] | 0)) {
  HEAPF32[$call + 12 >> 2] = 640.0; //@line 689
  HEAPF32[$call + 16 >> 2] = 640.0; //@line 691
  HEAPF32[$call + 20 >> 2] = 0.0; //@line 693
  HEAPF32[$call + 24 >> 2] = 0.0; //@line 695
  HEAP8[1800] = 1; //@line 696
 }
 $inputPressed = $self + 24 | 0; //@line 699
 $3 = HEAP32[$self + 16 >> 2] | 0; //@line 703
 do {
  if ((HEAP32[$inputPressed >> 2] | 0) == 0) {
   if (((HEAP32[$3 + 60 >> 2] | 0) - 6 | 0) >>> 0 < 2) {
    label = 57; //@line 713
    break;
   }
   $currentScale11 = $self + 44 | 0; //@line 716
   $conv12 = +HEAPF32[$currentScale11 >> 2]; //@line 718
   $conv16 = $conv12 - $conv12 * .05; //@line 721
   HEAPF32[$currentScale11 >> 2] = $conv16; //@line 722
   $7 = $conv16; //@line 723
  } else {
   label = 57; //@line 725
  }
 } while (0);
 if ((label | 0) == 57) {
  $currentScale = $self + 44 | 0; //@line 729
  $conv = +HEAPF32[$currentScale >> 2]; //@line 731
  $conv10 = $conv + $conv * .1; //@line 734
  HEAPF32[$currentScale >> 2] = $conv10; //@line 735
  $7 = $conv10; //@line 737
 }
 $conv18 = +HEAPF32[$self + 36 >> 2]; //@line 742
 $currentScale20 = $self + 44 | 0; //@line 746
 HEAPF32[$currentScale20 >> 2] = +_fmax(+$conv18, +(+_fmin(+(+HEAPF32[$self + 40 >> 2]), +$7))); //@line 751
 L68 : do {
  if (($3 | 0) != 0) {
   $state31 = $3 + 60 | 0; //@line 756
   $10 = HEAP32[$state31 >> 2] | 0; //@line 757
   if (($10 - 2 | 0) >>> 0 < 4) {
    $11 = HEAP32[$3 + 64 >> 2] | 0; //@line 763
    $sub_i106 = +HEAPF32[$3 + 12 >> 2] - +HEAPF32[$11 + 12 >> 2]; //@line 772
    $sub3_i107 = +HEAPF32[$3 + 16 >> 2] - +HEAPF32[$11 + 16 >> 2]; //@line 773
    $div_i101 = 1.0 / +Math_sqrt(+($sub_i106 * $sub_i106 + $sub3_i107 * $sub3_i107)); //@line 778
    $targetRotation_0126 = +Math_atan2(+($sub3_i107 * $div_i101), +($sub_i106 * $div_i101)) + -1.5707963267948966; //@line 785
    $conv56127 = $targetRotation_0126; //@line 786
    $radians = $call + 44 | 0; //@line 787
    $12 = +HEAPF32[$radians >> 2]; //@line 788
    $conv57128 = $12; //@line 789
    $sub58129 = $conv57128 + -3.141592653589793; //@line 790
    if ($conv56127 < $sub58129) {
     $conv56131 = $conv56127; //@line 794
     while (1) {
      $targetRotation_0 = $conv56131 + 6.283185307179586; //@line 798
      $conv56 = $targetRotation_0; //@line 799
      if ($conv56 < $sub58129) {
       $conv56131 = $conv56; //@line 803
      } else {
       $targetRotation_0_lcssa = $targetRotation_0; //@line 805
       break;
      }
     }
    } else {
     $targetRotation_0_lcssa = $targetRotation_0126; //@line 810
    }
    $conv65119 = $targetRotation_0_lcssa; //@line 813
    $add68121 = $conv57128 + 3.141592653589793; //@line 814
    if ($conv65119 > $add68121) {
     $conv65123 = $conv65119; //@line 818
     while (1) {
      $conv74 = $conv65123 + -6.283185307179586; //@line 822
      $conv65 = $conv74; //@line 823
      if ($conv65 > $add68121) {
       $conv65123 = $conv65; //@line 827
      } else {
       $targetRotation_1_lcssa = $conv74; //@line 829
       break;
      }
     }
    } else {
     $targetRotation_1_lcssa = $targetRotation_0_lcssa; //@line 834
    }
    HEAPF32[$radians >> 2] = $conv57128 + ($targetRotation_1_lcssa - $12) * .1; //@line 842
    $13 = HEAP32[$state31 >> 2] | 0; //@line 845
   } else {
    $13 = $10; //@line 847
   }
   switch ($13 | 0) {
   case 7:
   case 6:
    {
     $14 = HEAP32[$self + 20 >> 2] | 0; //@line 853
     if (($14 | 0) != 0) {
      $center = $self + 28 | 0; //@line 857
      $center_0_val = +HEAPF32[$center >> 2]; //@line 859
      $center_1_val = +HEAPF32[$self + 32 >> 2]; //@line 861
      $15 = $center; //@line 872
      $tmp99_sroa_0_0_insert_insert$1 = +($center_1_val + (+HEAPF32[$14 + 16 >> 2] - $center_1_val) * .009999999776482582); //@line 882
      HEAPF32[$15 >> 2] = $center_0_val + (+HEAPF32[$14 + 12 >> 2] - $center_0_val) * .009999999776482582; //@line 884
      HEAPF32[$15 + 4 >> 2] = $tmp99_sroa_0_0_insert_insert$1; //@line 886
     }
     $radians101 = $call + 44 | 0; //@line 889
     HEAPF32[$radians101 >> 2] = +HEAPF32[$radians101 >> 2] + .01; //@line 894
     break L68;
     break;
    }
   case 2:
   case 3:
   case 4:
   case 5:
    {
     $19 = HEAP32[$3 + 64 >> 2] | 0; //@line 901
     $position125_0_val = +HEAPF32[$19 + 12 >> 2]; //@line 907
     $position125_1_val = +HEAPF32[$19 + 16 >> 2]; //@line 909
     $sub_i86 = +HEAPF32[$3 + 12 >> 2] - $position125_0_val; //@line 910
     $sub3_i = +HEAPF32[$3 + 16 >> 2] - $position125_1_val; //@line 911
     $div_i = 1.0 / +Math_sqrt(+($sub_i86 * $sub_i86 + $sub3_i * $sub3_i)); //@line 916
     $add133 = +HEAPF32[$3 + 20 >> 2] + +HEAPF32[$19 + 20 >> 2]; //@line 923
     $center134 = $self + 28 | 0; //@line 928
     $center134_0_val = +HEAPF32[$center134 >> 2]; //@line 930
     $center134_1_val = +HEAPF32[$self + 32 >> 2]; //@line 932
     $22 = $center134; //@line 939
     $tmp136_sroa_0_0_insert_insert$1 = +($center134_1_val + ($position125_1_val + $sub3_i * $div_i * $add133 - $center134_1_val) * .15000000596046448); //@line 949
     HEAPF32[$22 >> 2] = $center134_0_val + ($position125_0_val + $sub_i86 * $div_i * $add133 - $center134_0_val) * .15000000596046448; //@line 951
     HEAPF32[$22 + 4 >> 2] = $tmp136_sroa_0_0_insert_insert$1; //@line 953
     break L68;
     break;
    }
   default:
    {
     $center138 = $self + 28 | 0; //@line 959
     $center138_0_val = +HEAPF32[$center138 >> 2]; //@line 961
     $center138_1_val = +HEAPF32[$self + 32 >> 2]; //@line 963
     $25 = $center138; //@line 974
     $tmp141_sroa_0_0_insert_insert$1 = +($center138_1_val + (+HEAPF32[$3 + 16 >> 2] - $center138_1_val) * .15000000596046448); //@line 984
     HEAPF32[$25 >> 2] = $center138_0_val + (+HEAPF32[$3 + 12 >> 2] - $center138_0_val) * .15000000596046448; //@line 986
     HEAPF32[$25 + 4 >> 2] = $tmp141_sroa_0_0_insert_insert$1; //@line 988
     break L68;
    }
   }
  }
 } while (0);
 $mul147 = +HEAPF32[$currentScale20 >> 2] * +HEAPF32[$self + 48 >> 2]; //@line 997
 $30 = +HEAPF32[$self + 32 >> 2]; //@line 999
 $31 = +HEAPF32[$self + 28 >> 2]; //@line 1002
 HEAPF32[$call + 12 >> 2] = $30 + $mul147; //@line 1007
 HEAPF32[$call + 16 >> 2] = $mul147 + $31; //@line 1009
 HEAPF32[$call + 20 >> 2] = $30 - $mul147; //@line 1011
 HEAPF32[$call + 24 >> 2] = $31 - $mul147; //@line 1013
 HEAP32[$inputPressed >> 2] = 0; //@line 1014
 STACKTOP = sp; //@line 1015
 return;
}
function __SLLeaperView_draw($self) {
 $self = $self | 0;
 var $tmp = 0, $box1 = 0, $box2 = 0, $fullBar = 0, $filledBar = 0, $fullResourceBar = 0, $filledResourceBar = 0, $leaper = 0, $0 = 0, $3 = 0, $4$1 = 0, $5 = 0, $6 = 0, $8 = 0.0, $9 = 0.0, $10 = 0.0, $conv = 0.0, $conv12 = 0.0, $conv14 = 0.0, $conv17 = 0.0, $conv21 = 0.0, $sub_i186 = 0.0, $sub3_i187 = 0.0, $div = 0.0, $sub_i171 = 0.0, $sub3_i = 0.0, $div26 = 0.0, $div30 = 0.0, $vertices = 0, $11 = 0, $call42 = 0, $call44 = 0, $14 = 0, $call52 = 0, $21 = 0, $call61 = 0, $28 = 0, $call71 = 0, $add74 = 0.0, $conv76 = 0.0, $mul84 = 0.0, $add_i161 = 0.0, $add3_i162 = 0.0, $conv88 = 0.0, $call90 = 0, $add94 = 0.0, $conv96 = 0.0, $conv101 = 0.0, $div111 = 0.0, $sub112 = 0.0, $add_i133 = 0.0, $add3_i134 = 0.0, $call123 = 0, $sub126 = 0.0, $conv128 = 0.0, $add_i113 = 0.0, $add3_i114 = 0.0, $conv140 = 0.0, $call142 = 0, $sub146 = 0.0, $conv148 = 0.0, $conv153 = 0.0, $div163 = 0.0, $sub164 = 0.0, $add_i87 = 0.0, $add3_i88 = 0.0, $call175 = 0, sp = 0;
 sp = STACKTOP; //@line 4960
 STACKTOP = STACKTOP + 104 | 0; //@line 4960
 $tmp = sp | 0; //@line 4961
 $box1 = sp + 8 | 0; //@line 4962
 $box2 = sp + 24 | 0; //@line 4963
 $fullBar = sp + 40 | 0; //@line 4964
 $filledBar = sp + 56 | 0; //@line 4965
 $fullResourceBar = sp + 72 | 0; //@line 4966
 $filledResourceBar = sp + 88 | 0; //@line 4967
 $leaper = $self + 12 | 0; //@line 4968
 $0 = HEAP32[$leaper >> 2] | 0; //@line 4969
 if ((HEAP32[$0 + 60 >> 2] | 0) == 6) {
  _AQLoop_once(18, $self); //@line 4976
  STACKTOP = sp; //@line 4978
  return;
 } else {
  _SLLeaper_calcPosition($tmp, $0); //@line 4982
  $3 = $0 + 12 | 0; //@line 4983
  $4$1 = HEAP32[$tmp + 4 >> 2] | 0; //@line 4987
  HEAP32[$3 >> 2] = HEAP32[$tmp >> 2]; //@line 4989
  HEAP32[$3 + 4 >> 2] = $4$1; //@line 4991
  $5 = HEAP32[$leaper >> 2] | 0; //@line 4992
  $6 = $5 + 12 | 0; //@line 4994
  $8 = +HEAPF32[$6 >> 2]; //@line 5001
  $9 = +HEAPF32[$6 + 4 >> 2]; //@line 5006
  $10 = +HEAPF32[$5 + 20 >> 2]; //@line 5008
  $conv = +_SLLeaper_radians($5); //@line 5010
  $conv12 = $conv; //@line 5011
  $conv14 = +Math_cos(+$conv12); //@line 5013
  $conv17 = +Math_sin(+$conv12); //@line 5015
  $conv21 = $10 * -.75; //@line 5016
  $sub_i186 = $8 - $conv21 * $conv14; //@line 5019
  $sub3_i187 = $9 - $conv21 * $conv17; //@line 5020
  $div = $10 * .25; //@line 5021
  HEAPF32[$box1 + 4 >> 2] = $div + $sub_i186; //@line 5028
  HEAPF32[$box1 + 12 >> 2] = $sub_i186 - $div; //@line 5031
  $sub_i171 = $8 - $conv14 * 0.0; //@line 5034
  $sub3_i = $9 - $conv17 * 0.0; //@line 5035
  $div26 = $10 * 9.0 / 10.0; //@line 5037
  HEAPF32[$box2 >> 2] = $div26 + $sub3_i; //@line 5043
  HEAPF32[$box2 + 8 >> 2] = $sub3_i - $div26; //@line 5046
  HEAPF32[$box1 >> 2] = $div + ($div + $sub3_i187); //@line 5049
  HEAPF32[$box1 + 8 >> 2] = $sub3_i187 - $div - $div; //@line 5051
  $div30 = $10 / 3.0; //@line 5052
  HEAPF32[$box2 + 4 >> 2] = $div26 + $sub_i171 - $div30; //@line 5054
  HEAPF32[$box2 + 12 >> 2] = $div30 + ($sub_i171 - $div26); //@line 5056
  $vertices = $self + 20 | 0; //@line 5057
  $11 = $vertices; //@line 5058
  _memset($11 | 0, 0, 6144); //@line 5059
  $call42 = _AQDraw_color($11, _AQDraw_rotatedRect($11, 18, $box2, $conv) | 0, 18, 34, 168) | 0; //@line 5061
  $call44 = _AQDraw_color($call42, _AQDraw_rotatedRect($call42, 18, $box1, $conv) | 0, 18, 34, 168) | 0; //@line 5063
  $14 = (_AQList_at(HEAP32[(HEAP32[$leaper >> 2] | 0) + 36 >> 2] | 0, 2) | 0) + 12 | 0; //@line 5069
  $call52 = _AQDraw_polygon($call44, 18, 16, $14, +HEAPF32[(_AQList_at(HEAP32[(HEAP32[$leaper >> 2] | 0) + 36 >> 2] | 0, 2) | 0) + 20 >> 2], 0.0) | 0; //@line 5077
  $21 = (_AQList_at(HEAP32[(HEAP32[$leaper >> 2] | 0) + 36 >> 2] | 0, 1) | 0) + 12 | 0; //@line 5083
  $call61 = _AQDraw_polygon($call52, 18, 16, $21, +HEAPF32[(_AQList_at(HEAP32[(HEAP32[$leaper >> 2] | 0) + 36 >> 2] | 0, 1) | 0) + 20 >> 2], 0.0) | 0; //@line 5091
  $28 = (_AQList_at(HEAP32[(HEAP32[$leaper >> 2] | 0) + 36 >> 2] | 0, 0) | 0) + 12 | 0; //@line 5097
  $call71 = _AQDraw_color($call44, _AQDraw_polygon($call61, 18, 16, $28, +HEAPF32[(_AQList_at(HEAP32[(HEAP32[$leaper >> 2] | 0) + 36 >> 2] | 0, 0) | 0) + 20 >> 2], 0.0) | 0, 18, 34, 168) | 0; //@line 5106
  $add74 = $conv12 + 1.5707963267948966; //@line 5107
  $conv76 = +Math_cos(+$add74); //@line 5109
  $mul84 = $10 * 2.0; //@line 5112
  $add_i161 = $8 + $mul84 * $conv76; //@line 5115
  $add3_i162 = $9 + $mul84 * +Math_sin(+$add74); //@line 5116
  HEAPF32[$fullBar >> 2] = $add3_i162 + 1.0; //@line 5122
  HEAPF32[$fullBar + 4 >> 2] = $10 + $add_i161; //@line 5124
  HEAPF32[$fullBar + 8 >> 2] = $add3_i162 + -1.0; //@line 5126
  HEAPF32[$fullBar + 12 >> 2] = $add_i161 - $10; //@line 5128
  $conv88 = $conv12 + -.5235987755982988; //@line 5130
  $call90 = _AQDraw_color($call71, _AQDraw_rotatedRect($call71, 18, $fullBar, $conv88) | 0, 18, 34, 160) | 0; //@line 5132
  $add94 = $add74 + 1.0471975511965976; //@line 5133
  $conv96 = +Math_cos(+$add94); //@line 5135
  $conv101 = +Math_sin(+$add94); //@line 5137
  $div111 = $10 * +(HEAP32[(HEAP32[$leaper >> 2] | 0) + 84 >> 2] | 0) * .00048828125; //@line 5143
  $sub112 = $10 - $div111; //@line 5144
  $add_i133 = $add_i161 + $conv96 * $sub112; //@line 5147
  $add3_i134 = $add3_i162 + $conv101 * $sub112; //@line 5148
  HEAPF32[$filledBar >> 2] = $add3_i134 + 1.0; //@line 5154
  HEAPF32[$filledBar + 4 >> 2] = $div111 + $add_i133; //@line 5156
  HEAPF32[$filledBar + 8 >> 2] = $add3_i134 + -1.0; //@line 5158
  HEAPF32[$filledBar + 12 >> 2] = $add_i133 - $div111; //@line 5160
  $call123 = _AQDraw_color($call90, _AQDraw_rotatedRect($call90, 18, $filledBar, $conv88) | 0, 18, 34, 152) | 0; //@line 5162
  $sub126 = $conv12 + -1.5707963267948966; //@line 5163
  $conv128 = +Math_cos(+$sub126); //@line 5165
  $add_i113 = $8 + $mul84 * $conv128; //@line 5170
  $add3_i114 = $9 + $mul84 * +Math_sin(+$sub126); //@line 5171
  HEAPF32[$fullResourceBar >> 2] = $add3_i114 + 1.0; //@line 5177
  HEAPF32[$fullResourceBar + 4 >> 2] = $10 + $add_i113; //@line 5179
  HEAPF32[$fullResourceBar + 8 >> 2] = $add3_i114 + -1.0; //@line 5181
  HEAPF32[$fullResourceBar + 12 >> 2] = $add_i113 - $10; //@line 5183
  $conv140 = $conv12 + .5235987755982988; //@line 5185
  $call142 = _AQDraw_color($call123, _AQDraw_rotatedRect($call123, 18, $fullResourceBar, $conv140) | 0, 18, 34, 144) | 0; //@line 5187
  $sub146 = $sub126 + -1.0471975511965976; //@line 5188
  $conv148 = +Math_cos(+$sub146); //@line 5190
  $conv153 = +Math_sin(+$sub146); //@line 5192
  $div163 = $10 * +(HEAP32[(HEAP32[$leaper >> 2] | 0) + 88 >> 2] | 0) * .00390625; //@line 5198
  $sub164 = $10 - $div163; //@line 5199
  $add_i87 = $add_i113 + $conv148 * $sub164; //@line 5202
  $add3_i88 = $add3_i114 + $conv153 * $sub164; //@line 5203
  HEAPF32[$filledResourceBar >> 2] = $add3_i88 + 1.0; //@line 5209
  HEAPF32[$filledResourceBar + 4 >> 2] = $div163 + $add_i87; //@line 5211
  HEAPF32[$filledResourceBar + 8 >> 2] = $add3_i88 + -1.0; //@line 5213
  HEAPF32[$filledResourceBar + 12 >> 2] = $add_i87 - $div163; //@line 5215
  $call175 = _AQDraw_color($call142, _AQDraw_rotatedRect($call142, 18, $filledResourceBar, $conv140) | 0, 18, 34, 136) | 0; //@line 5217
  _AQShaders_useProgram(1); //@line 5218
  _AQShaders_draw(HEAP32[$self + 16 >> 2] | 0, $11, $call175 - $vertices | 0); //@line 5224
  STACKTOP = sp; //@line 5226
  return;
 }
}
function _AQParticle_test($self, $other, $col) {
 $self = $self | 0;
 $other = $other | 0;
 $col = $col | 0;
 var $sub = 0.0, $sub9 = 0.0, $6 = 0.0, $7 = 0.0, $add = 0.0, $add12 = 0.0, $collideWith = 0, $8 = 0, $self_addr_05_i = 0, $10 = 0, $12 = 0, $itr_06_i_i = 0, $16 = 0, $17 = 0, $itr_06_i34_i = 0, $21 = 0, $itr_06_i22_i = 0, $25 = 0, $26 = 0, $itr_06_i10_i = 0, $collideWithNext = 0, $30 = 0, $call_i = 0, $31 = 0, $call_i_i51 = 0, $32 = 0, $self_addr_0_i53_in = 0, $33 = 0, $34 = 0, $call_i6_i57 = 0, $35 = 0, $36 = 0, $37 = 0, $collideWithNext32 = 0, $39 = 0, $call_i64 = 0, $40 = 0, $call_i_i = 0, $41 = 0, $self_addr_0_i_in = 0, $42 = 0, $43 = 0, $call_i6_i = 0, $44 = 0, $45 = 0, $46 = 0, $conv44 = 0.0, $ingress_0 = 0.0, $sub53 = 0.0, $retval_0 = 0;
 do {
  if ((HEAP8[$self + 96 | 0] | 0) != 0) {
   if ((HEAP8[$other + 96 | 0] | 0) == 0) {
    break;
   } else {
    $retval_0 = 0; //@line 10832
   }
   return $retval_0 | 0; //@line 10835
  }
 } while (0);
 $sub = +HEAPF32[$self + 12 >> 2] - +HEAPF32[$other + 12 >> 2]; //@line 10846
 $sub9 = +HEAPF32[$self + 16 >> 2] - +HEAPF32[$other + 16 >> 2]; //@line 10847
 $6 = +HEAPF32[$self + 20 >> 2]; //@line 10849
 $7 = +HEAPF32[$other + 20 >> 2]; //@line 10851
 $add = $6 + $7; //@line 10852
 $add12 = $sub * $sub + $sub9 * $sub9; //@line 10855
 if ($add12 >= $add * $add) {
  $retval_0 = 0; //@line 10860
  return $retval_0 | 0; //@line 10862
 }
 $collideWith = $self + 108 | 0; //@line 10864
 $8 = HEAP32[$collideWith >> 2] | 0; //@line 10865
 L1277 : do {
  if (($8 | 0) != 0) {
   $self_addr_05_i = $8; //@line 10872
   while (1) {
    $10 = HEAP32[$self_addr_05_i >> 2] | 0; //@line 10876
    if (($10 | 0) == 0) {
     break L1277;
    }
    if (($10 | 0) == ($other | 0)) {
     $retval_0 = 0; //@line 10884
     break;
    }
    $self_addr_05_i = HEAP32[$self_addr_05_i + 4 >> 2] | 0; //@line 10888
    if (($self_addr_05_i | 0) == 0) {
     break L1277;
    }
   }
   return $retval_0 | 0; //@line 10898
  }
 } while (0);
 $12 = HEAP32[$self + 120 >> 2] | 0; //@line 10902
 L1285 : do {
  if (!(($12 | 0) == 0 | ($other | 0) == 0)) {
   $itr_06_i_i = $12; //@line 10911
   while (1) {
    if ((HEAP32[$itr_06_i_i >> 2] | 0) == ($other | 0)) {
     $retval_0 = 0; //@line 10919
     break;
    }
    $itr_06_i_i = HEAP32[$itr_06_i_i + 4 >> 2] | 0; //@line 10923
    if (($itr_06_i_i | 0) == 0) {
     break L1285;
    }
   }
   return $retval_0 | 0; //@line 10933
  }
 } while (0);
 $16 = HEAP32[$other + 116 >> 2] | 0; //@line 10938
 $17 = HEAP32[$self + 124 >> 2] | 0; //@line 10939
 L1292 : do {
  if (!(($17 | 0) == 0 | ($16 | 0) == 0)) {
   $itr_06_i34_i = $17; //@line 10948
   while (1) {
    if ((HEAP32[$itr_06_i34_i >> 2] | 0) == ($16 | 0)) {
     $retval_0 = 0; //@line 10956
     break;
    }
    $itr_06_i34_i = HEAP32[$itr_06_i34_i + 4 >> 2] | 0; //@line 10960
    if (($itr_06_i34_i | 0) == 0) {
     break L1292;
    }
   }
   return $retval_0 | 0; //@line 10970
  }
 } while (0);
 $21 = HEAP32[$other + 120 >> 2] | 0; //@line 10974
 L1299 : do {
  if (!(($21 | 0) == 0 | ($self | 0) == 0)) {
   $itr_06_i22_i = $21; //@line 10983
   while (1) {
    if ((HEAP32[$itr_06_i22_i >> 2] | 0) == ($self | 0)) {
     $retval_0 = 0; //@line 10991
     break;
    }
    $itr_06_i22_i = HEAP32[$itr_06_i22_i + 4 >> 2] | 0; //@line 10995
    if (($itr_06_i22_i | 0) == 0) {
     break L1299;
    }
   }
   return $retval_0 | 0; //@line 11005
  }
 } while (0);
 $25 = HEAP32[$self + 116 >> 2] | 0; //@line 11010
 $26 = HEAP32[$other + 124 >> 2] | 0; //@line 11011
 L1306 : do {
  if (!(($26 | 0) == 0 | ($25 | 0) == 0)) {
   $itr_06_i10_i = $26; //@line 11020
   while (1) {
    if ((HEAP32[$itr_06_i10_i >> 2] | 0) == ($25 | 0)) {
     $retval_0 = 0; //@line 11028
     break;
    }
    $itr_06_i10_i = HEAP32[$itr_06_i10_i + 4 >> 2] | 0; //@line 11032
    if (($itr_06_i10_i | 0) == 0) {
     break L1306;
    }
   }
   return $retval_0 | 0; //@line 11042
  }
 } while (0);
 $collideWithNext = $self + 112 | 0; //@line 11045
 $30 = HEAP32[$collideWithNext >> 2] | 0; //@line 11046
 do {
  if (($30 | 0) == 0) {
   $call_i = _malloc(8) | 0; //@line 11051
   $31 = $call_i; //@line 11052
   HEAP32[$31 >> 2] = 0; //@line 11056
   HEAP32[$31 + 4 >> 2] = 0; //@line 11058
   HEAP32[$collideWithNext >> 2] = $call_i; //@line 11059
   HEAP32[$collideWith >> 2] = $call_i; //@line 11060
   if (($call_i | 0) != 0) {
    $self_addr_0_i53_in = $call_i; //@line 11064
    break;
   }
   $call_i_i51 = _malloc(8) | 0; //@line 11067
   $32 = $call_i_i51; //@line 11068
   HEAP32[$32 >> 2] = 0; //@line 11072
   HEAP32[$32 + 4 >> 2] = 0; //@line 11074
   $self_addr_0_i53_in = $call_i_i51; //@line 11076
  } else {
   $self_addr_0_i53_in = $30; //@line 11078
  }
 } while (0);
 $33 = $self_addr_0_i53_in + 4 | 0; //@line 11083
 $34 = HEAP32[$33 >> 2] | 0; //@line 11084
 if (($34 | 0) == 0) {
  $call_i6_i57 = _malloc(8) | 0; //@line 11088
  $35 = $call_i6_i57; //@line 11089
  $36 = $call_i6_i57; //@line 11090
  HEAP32[$36 >> 2] = 0; //@line 11094
  HEAP32[$36 + 4 >> 2] = 0; //@line 11096
  HEAP32[$33 >> 2] = $35; //@line 11097
  $37 = $35; //@line 11099
 } else {
  HEAP32[$34 >> 2] = 0; //@line 11102
  $37 = HEAP32[$33 >> 2] | 0; //@line 11104
 }
 HEAP32[$self_addr_0_i53_in >> 2] = $other; //@line 11108
 HEAP32[$collideWithNext >> 2] = $37; //@line 11110
 $collideWithNext32 = $other + 112 | 0; //@line 11111
 $39 = HEAP32[$collideWithNext32 >> 2] | 0; //@line 11112
 do {
  if (($39 | 0) == 0) {
   $call_i64 = _malloc(8) | 0; //@line 11117
   $40 = $call_i64; //@line 11118
   HEAP32[$40 >> 2] = 0; //@line 11122
   HEAP32[$40 + 4 >> 2] = 0; //@line 11124
   HEAP32[$collideWithNext32 >> 2] = $call_i64; //@line 11125
   HEAP32[$other + 108 >> 2] = $call_i64; //@line 11127
   if (($call_i64 | 0) != 0) {
    $self_addr_0_i_in = $call_i64; //@line 11131
    break;
   }
   $call_i_i = _malloc(8) | 0; //@line 11134
   $41 = $call_i_i; //@line 11135
   HEAP32[$41 >> 2] = 0; //@line 11139
   HEAP32[$41 + 4 >> 2] = 0; //@line 11141
   $self_addr_0_i_in = $call_i_i; //@line 11143
  } else {
   $self_addr_0_i_in = $39; //@line 11145
  }
 } while (0);
 $42 = $self_addr_0_i_in + 4 | 0; //@line 11150
 $43 = HEAP32[$42 >> 2] | 0; //@line 11151
 if (($43 | 0) == 0) {
  $call_i6_i = _malloc(8) | 0; //@line 11155
  $44 = $call_i6_i; //@line 11156
  $45 = $call_i6_i; //@line 11157
  HEAP32[$45 >> 2] = 0; //@line 11161
  HEAP32[$45 + 4 >> 2] = 0; //@line 11163
  HEAP32[$42 >> 2] = $44; //@line 11164
  $46 = $44; //@line 11166
 } else {
  HEAP32[$43 >> 2] = 0; //@line 11169
  $46 = HEAP32[$42 >> 2] | 0; //@line 11171
 }
 HEAP32[$self_addr_0_i_in >> 2] = $self; //@line 11175
 HEAP32[$collideWithNext32 >> 2] = $46; //@line 11177
 $conv44 = +Math_sqrt(+$add12); //@line 11178
 HEAPF32[$col + 16 >> 2] = $add - $conv44; //@line 11181
 $ingress_0 = $conv44 == 0.0 ? 9999999747378752.0e-21 : $conv44; //@line 11183
 $sub53 = $7 / $ingress_0 - ($ingress_0 - $6) / $ingress_0; //@line 11187
 HEAPF32[$col + 8 >> 2] = $sub * $sub53; //@line 11190
 HEAPF32[$col + 12 >> 2] = $sub9 * $sub53; //@line 11193
 HEAP32[$col >> 2] = $self; //@line 11195
 HEAP32[$col + 4 >> 2] = $other; //@line 11197
 $retval_0 = 1; //@line 11199
 return $retval_0 | 0; //@line 11201
}
function _stepWaterTest($dt) {
 $dt = +$dt;
 var $call1 = 0, $add = 0.0, $2 = 0, $startTime_0 = 0, $4 = 0, $onvisit = 0, $6 = 0, $_pr_pre = 0, $_pr26 = 0, $onresource = 0, $11 = 0, $15 = 0, $17 = 0, $conv3021 = 0.0, $conv3023 = 0.0, $conv34 = 0.0, $19 = 0, $startTime_1 = 0, $endTime_0 = 0, $add41 = 0.0, $22 = 0, $inc52 = 0, $24 = 0, $min_07_i = 0, $i_06_i = 0, $25 = 0, $_min_0_i = 0, $inc_i = 0, $max_07_i = 0, $i_06_i8 = 0, $26 = 0, $_max_0_i = 0, $inc_i11 = 0, $i_07_i = 0, $sum_06_i = 0, $add_i15 = 0, $inc_i16 = 0, $i_07_i_i = 0, $sum_06_i_i = 0, $div_i19 = 0, $div_i_i = 0, $diffSum_010_i = 0, $i_09_i = 0, $sub_i = 0, $conv61 = 0.0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 6842
 if ((HEAP8[2520] | 0) != 0) {
  STACKTOP = sp; //@line 6847
  return;
 }
 $call1 = _aqinit(_aqalloc(2240) | 0) | 0; //@line 6850
 $add = +HEAPF32[44] + $dt; //@line 6852
 HEAPF32[44] = $add; //@line 6853
 do {
  if ($add > .05) {
   $2 = HEAP32[660] | 0; //@line 6859
   if (($2 | 0) == 0) {
    $startTime_0 = 0; //@line 6863
   } else {
    $startTime_0 = FUNCTION_TABLE_i[$2 & 31]() | 0; //@line 6868
   }
   HEAP32[662] = (HEAP32[662] | 0) + 1; //@line 6873
   $4 = HEAP32[656] | 0; //@line 6874
   do {
    if (($4 | 0) != 0) {
     $onvisit = $4 + 72 | 0; //@line 6879
     $6 = HEAP32[624] | 0; //@line 6881
     if ((HEAP32[$onvisit >> 2] | 0) == ($6 | 0)) {
      $_pr26 = $4; //@line 6885
     } else {
      HEAP32[$onvisit >> 2] = $6; //@line 6887
      FUNCTION_TABLE_vi[HEAP32[624] & 31](HEAP32[(HEAP32[656] | 0) + 80 >> 2] | 0); //@line 6892
      $_pr_pre = HEAP32[656] | 0; //@line 6893
      if (($_pr_pre | 0) == 0) {
       break;
      } else {
       $_pr26 = $_pr_pre; //@line 6899
      }
     }
     $onresource = $_pr26 + 76 | 0; //@line 6903
     $11 = HEAP32[628] | 0; //@line 6905
     if ((HEAP32[$onresource >> 2] | 0) == ($11 | 0)) {
      break;
     }
     HEAP32[$onresource >> 2] = $11; //@line 6911
     FUNCTION_TABLE_vi[HEAP32[628] & 31](HEAP32[(HEAP32[656] | 0) + 92 >> 2] | 0); //@line 6916
    }
   } while (0);
   _AQLoop_step(.05000000074505806); //@line 6920
   $15 = HEAP32[656] | 0; //@line 6921
   do {
    if (($15 | 0) != 0) {
     $17 = HEAP32[766] | 0; //@line 6929
     if (!((HEAP32[$15 + 60 >> 2] | 0) == 6 & ($17 | 0) != 0)) {
      break;
     }
     FUNCTION_TABLE_v[$17 & 31](); //@line 6937
    }
   } while (0);
   $conv3021 = +HEAPF32[44]; //@line 6942
   if ($conv3021 > .05) {
    $conv3023 = $conv3021; //@line 6946
    do {
     $conv34 = $conv3023 + -.05; //@line 6950
     $conv3023 = $conv34; //@line 6951
    } while ($conv3023 > .05);
    HEAPF32[44] = $conv34; //@line 6960
   }
   $19 = HEAP32[660] | 0; //@line 6963
   if (($19 | 0) == 0) {
    $endTime_0 = 0; //@line 6967
    $startTime_1 = $startTime_0; //@line 6967
    break;
   }
   $endTime_0 = FUNCTION_TABLE_i[$19 & 31]() | 0; //@line 6973
   $startTime_1 = $startTime_0; //@line 6973
  } else {
   $endTime_0 = 0; //@line 6975
   $startTime_1 = 0; //@line 6975
  }
 } while (0);
 $add41 = +HEAPF32[46] + $dt; //@line 6981
 HEAPF32[46] = $add41; //@line 6982
 if ($add41 > 1.0) {
  HEAPF32[46] = 0.0; //@line 6986
  HEAP32[662] = 0; //@line 6987
 }
 do {
  if (!((HEAP32[660] | 0) == 0 | ($startTime_1 | 0) == 0)) {
   $22 = HEAP32[764] | 0; //@line 6998
   $inc52 = $22 + 1 | 0; //@line 6999
   HEAP32[764] = $inc52; //@line 7000
   HEAP32[2656 + ($22 << 2) >> 2] = $endTime_0 - $startTime_1; //@line 7002
   if ($inc52 >>> 0 <= 99) {
    break;
   }
   $24 = HEAP32[(HEAP32[622] | 0) + 40 >> 2] | 0; //@line 7010
   _printf(856, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $24, tempVarArgs) | 0) | 0; //@line 7011
   STACKTOP = tempVarArgs; //@line 7011
   $i_06_i = 0; //@line 7012
   $min_07_i = 2147483647; //@line 7012
   while (1) {
    $25 = HEAP32[2656 + ($i_06_i << 2) >> 2] | 0; //@line 7017
    $_min_0_i = $25 >>> 0 < $min_07_i >>> 0 ? $25 : $min_07_i; //@line 7019
    $inc_i = $i_06_i + 1 | 0; //@line 7020
    if ($inc_i >>> 0 < 100) {
     $i_06_i = $inc_i; //@line 7024
     $min_07_i = $_min_0_i; //@line 7024
    } else {
     $i_06_i8 = 0; //@line 7026
     $max_07_i = 0; //@line 7026
     break;
    }
   }
   while (1) {
    $26 = HEAP32[2656 + ($i_06_i8 << 2) >> 2] | 0; //@line 7034
    $_max_0_i = $26 >>> 0 > $max_07_i >>> 0 ? $26 : $max_07_i; //@line 7036
    $inc_i11 = $i_06_i8 + 1 | 0; //@line 7037
    if ($inc_i11 >>> 0 < 100) {
     $i_06_i8 = $inc_i11; //@line 7041
     $max_07_i = $_max_0_i; //@line 7041
    } else {
     $sum_06_i = 0; //@line 7043
     $i_07_i = 0; //@line 7043
     break;
    }
   }
   while (1) {
    $add_i15 = (HEAP32[2656 + ($i_07_i << 2) >> 2] | 0) + $sum_06_i | 0; //@line 7052
    $inc_i16 = $i_07_i + 1 | 0; //@line 7053
    if ($inc_i16 >>> 0 < 100) {
     $sum_06_i = $add_i15; //@line 7057
     $i_07_i = $inc_i16; //@line 7057
    } else {
     $sum_06_i_i = 0; //@line 7059
     $i_07_i_i = 0; //@line 7059
     break;
    }
   }
   do {
    $sum_06_i_i = (HEAP32[2656 + ($i_07_i_i << 2) >> 2] | 0) + $sum_06_i_i | 0; //@line 7068
    $i_07_i_i = $i_07_i_i + 1 | 0; //@line 7069
   } while ($i_07_i_i >>> 0 < 100);
   $div_i19 = ($add_i15 >>> 0) / 100 | 0; //@line 7078
   $div_i_i = ($sum_06_i_i >>> 0) / 100 | 0; //@line 7079
   $i_09_i = 0; //@line 7080
   $diffSum_010_i = 0; //@line 7080
   do {
    $sub_i = (HEAP32[2656 + ($i_09_i << 2) >> 2] | 0) - $div_i_i | 0; //@line 7086
    $diffSum_010_i = (Math_imul($sub_i, $sub_i) | 0) + $diffSum_010_i | 0; //@line 7088
    $i_09_i = $i_09_i + 1 | 0; //@line 7089
   } while ($i_09_i >>> 0 < 100);
   $conv61 = +Math_sqrt(+(+($diffSum_010_i >>> 0 >>> 0) / 100.0)); //@line 7101
   _printf(544, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 32 | 0, HEAP32[tempVarArgs >> 2] = $_min_0_i, HEAP32[tempVarArgs + 8 >> 2] = $_max_0_i, HEAP32[tempVarArgs + 16 >> 2] = $div_i19, HEAPF64[tempVarArgs + 24 >> 3] = $conv61, tempVarArgs) | 0) | 0; //@line 7102
   STACKTOP = tempVarArgs; //@line 7102
   HEAP32[764] = 0; //@line 7103
  }
 } while (0);
 _aqfree($call1); //@line 7107
 STACKTOP = sp; //@line 7109
 return;
}
function _SLLeaper_init($self) {
 $self = $self | 0;
 var $radius = 0, $bodies = 0, $triggers = 0, $sticks = 0, $5 = 0, $i_067 = 0, $call8 = 0, $6 = 0, $j_0 = 0, $lastPosition = 0, $add = 0.0, $call19 = 0.0, $conv21 = 0.0, $conv31 = 0.0, $15 = 0, $16 = 0, $17$1 = 0, $call34 = 0, $21 = 0, $j35_0 = 0, $j52_0 = 0, $31 = 0, $32$0 = 0, $32$1 = 0, $33 = 0, $call80 = 0, $41 = 0, $42 = 0, $call88 = 0, $inc93 = 0, $visited = 0, $oxygen = 0, $resource = 0, $totalResource = 0, $view = 0, label = 0;
 _memset($self + 12 | 0, 0, 88); //@line 2931
 $radius = $self + 20 | 0; //@line 2932
 HEAPF32[$radius >> 2] = 8.0; //@line 2933
 $bodies = $self + 36 | 0; //@line 2937
 HEAP32[$bodies >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 2938
 $triggers = $self + 40 | 0; //@line 2942
 HEAP32[$triggers >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 2943
 $sticks = $self + 44 | 0; //@line 2947
 HEAP32[$sticks >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 2948
 HEAP32[$self + 56 >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 2953
 $5 = $self; //@line 2954
 $i_067 = 0; //@line 2956
 L243 : while (1) {
  $call8 = _aqcreate(2264) | 0; //@line 2959
  $6 = $call8; //@line 2960
  $j_0 = 0; //@line 2962
  while (1) {
   if (($j_0 | 0) >= ($i_067 | 0)) {
    break;
   }
   _AQParticle_ignoreParticle(_AQList_at(HEAP32[$triggers >> 2] | 0, $j_0) | 0, $6); //@line 2973
   if ((_AQParticle_doesIgnore(_AQList_at(HEAP32[$triggers >> 2] | 0, $j_0) | 0, $6) | 0) == 0) {
    label = 196; //@line 2982
    break L243;
   } else {
    $j_0 = $j_0 + 1 | 0; //@line 2985
   }
  }
  HEAPF32[$call8 + 20 >> 2] = 2.0; //@line 2990
  $lastPosition = $call8 + 48 | 0; //@line 2992
  $add = +($i_067 | 0) * 2.0943951023931953 + 1.5707963267948966; //@line 2995
  $call19 = +Math_cos(+$add); //@line 2996
  $conv21 = +HEAPF32[$radius >> 2]; //@line 2998
  $conv31 = +Math_sin(+$add) * $conv21; //@line 3003
  HEAPF32[$lastPosition >> 2] = $call19 * $conv21; //@line 3005
  HEAPF32[$call8 + 52 >> 2] = $conv31; //@line 3008
  $15 = $lastPosition; //@line 3009
  $16 = $call8 + 12 | 0; //@line 3010
  $17$1 = HEAP32[$15 + 4 >> 2] | 0; //@line 3014
  HEAP32[$16 >> 2] = HEAP32[$15 >> 2]; //@line 3016
  HEAP32[$16 + 4 >> 2] = $17$1; //@line 3018
  HEAP32[$call8 + 104 >> 2] = $5; //@line 3021
  _AQList_push(HEAP32[$bodies >> 2] | 0, $call8) | 0; //@line 3024
  $call34 = _aqcreate(2264) | 0; //@line 3025
  $21 = $call34; //@line 3026
  $j35_0 = 0; //@line 3028
  while (1) {
   if (($j35_0 | 0) > ($i_067 | 0)) {
    $j52_0 = 0; //@line 3034
    break;
   }
   _AQParticle_ignoreParticle($21, _AQList_at(HEAP32[$bodies >> 2] | 0, $j35_0) | 0); //@line 3040
   if ((_AQParticle_doesIgnore($21, _AQList_at(HEAP32[$bodies >> 2] | 0, $j35_0) | 0) | 0) == 0) {
    label = 200; //@line 3049
    break L243;
   } else {
    $j35_0 = $j35_0 + 1 | 0; //@line 3052
   }
  }
  while (1) {
   if (($j52_0 | 0) >= ($i_067 | 0)) {
    break;
   }
   _AQParticle_ignoreParticle($21, _AQList_at(HEAP32[$triggers >> 2] | 0, $j52_0) | 0); //@line 3065
   if ((_AQParticle_doesIgnore($21, _AQList_at(HEAP32[$triggers >> 2] | 0, $j52_0) | 0) | 0) == 0) {
    label = 203; //@line 3074
    break L243;
   } else {
    $j52_0 = $j52_0 + 1 | 0; //@line 3077
   }
  }
  HEAPF32[$call34 + 20 >> 2] = 2.5; //@line 3082
  $31 = $call34 + 48 | 0; //@line 3085
  $32$0 = HEAP32[$16 >> 2] | 0; //@line 3087
  $32$1 = HEAP32[$16 + 4 >> 2] | 0; //@line 3089
  HEAP32[$31 >> 2] = $32$0; //@line 3091
  HEAP32[$31 + 4 >> 2] = $32$1; //@line 3093
  $33 = $call34 + 12 | 0; //@line 3094
  HEAP32[$33 >> 2] = $32$0; //@line 3096
  HEAP32[$33 + 4 >> 2] = $32$1; //@line 3098
  HEAP8[$call34 + 97 | 0] = 1; //@line 3100
  HEAP32[$call34 + 104 >> 2] = $5; //@line 3103
  HEAP32[$call34 + 100 >> 2] = 20; //@line 3106
  _AQList_push(HEAP32[$triggers >> 2] | 0, $call34) | 0; //@line 3109
  if (($i_067 | 0) > 0) {
   $call80 = _AQStick_create(_AQList_at(HEAP32[$bodies >> 2] | 0, $i_067 - 1 | 0) | 0, $6) | 0; //@line 3117
   $41 = HEAP32[$sticks >> 2] | 0; //@line 3118
   $42 = $call80 | 0; //@line 3119
   _AQList_push($41, $42) | 0; //@line 3120
   if (($i_067 | 0) == 2) {
    label = 206; //@line 3124
    break;
   }
  }
  $inc93 = $i_067 + 1 | 0; //@line 3128
  if (($inc93 | 0) < 3) {
   $i_067 = $inc93; //@line 3132
  } else {
   label = 210; //@line 3134
   break;
  }
 }
 if ((label | 0) == 200) {
  ___assert_fail(1120, 1480, 111, 1728); //@line 3139
  return 0; //@line 3140
 } else if ((label | 0) == 196) {
  ___assert_fail(1352, 1480, 96, 1728); //@line 3143
  return 0; //@line 3144
 } else if ((label | 0) == 203) {
  ___assert_fail(904, 1480, 117, 1728); //@line 3147
  return 0; //@line 3148
 } else if ((label | 0) == 206) {
  $call88 = _AQStick_create($6, _AQList_at(HEAP32[$bodies >> 2] | 0, 0) | 0) | 0; //@line 3154
  _AQList_push(HEAP32[$sticks >> 2] | 0, $call88 | 0) | 0; //@line 3157
  $visited = $self + 80 | 0; //@line 3159
  HEAP32[$visited >> 2] = 0; //@line 3160
  $oxygen = $self + 84 | 0; //@line 3161
  HEAP32[$oxygen >> 2] = 2048; //@line 3162
  $resource = $self + 88 | 0; //@line 3163
  HEAP32[$resource >> 2] = 0; //@line 3164
  $totalResource = $self + 92 | 0; //@line 3165
  HEAP32[$totalResource >> 2] = 0; //@line 3166
  $view = $self + 96 | 0; //@line 3167
  HEAP32[$view >> 2] = 0; //@line 3168
  return $self | 0; //@line 3169
 } else if ((label | 0) == 210) {
  $visited = $self + 80 | 0; //@line 3172
  HEAP32[$visited >> 2] = 0; //@line 3173
  $oxygen = $self + 84 | 0; //@line 3174
  HEAP32[$oxygen >> 2] = 2048; //@line 3175
  $resource = $self + 88 | 0; //@line 3176
  HEAP32[$resource >> 2] = 0; //@line 3177
  $totalResource = $self + 92 | 0; //@line 3178
  HEAP32[$totalResource >> 2] = 0; //@line 3179
  $view = $self + 96 | 0; //@line 3180
  HEAP32[$view >> 2] = 0; //@line 3181
  return $self | 0; //@line 3182
 }
 return 0; //@line 3184
}
function __AQDdvt_addParticleChild($self, $particle, $aabb) {
 $self = $self | 0;
 $particle = $particle | 0;
 $aabb = $aabb | 0;
 var $0 = 0, $right_i = 0, $length_i107 = 0, $12 = 0, $13 = 0, $added_0 = 0, $14 = 0, $length_i91 = 0, $26 = 0, $27 = 0, $added_1 = 0, $28 = 0, $length_i75 = 0, $40 = 0, $41 = 0, $added_2 = 0, $42 = 0, $length_i = 0, $54 = 0, $55 = 0, $length = 0, label = 0;
 $0 = HEAP32[$self + 32 >> 2] | 0; //@line 8276
 $right_i = $aabb + 4 | 0; //@line 8279
 L869 : do {
  if (+HEAPF32[$0 + 24 >> 2] < +HEAPF32[$right_i >> 2]) {
   if (+HEAPF32[$0 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $added_0 = 0; //@line 8292
    break;
   }
   if (+HEAPF32[$0 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $added_0 = 0; //@line 8302
    break;
   }
   if (+HEAPF32[$0 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $added_0 = 0; //@line 8312
    break;
   }
   HEAP32[$0 + 28 >> 2] = 0; //@line 8316
   do {
    if ((HEAP32[$0 + 32 >> 2] | 0) == 0) {
     $length_i107 = $0 + 240 | 0; //@line 8323
     if ((HEAP32[$length_i107 >> 2] | 0) < 48) {
      $12 = _aqretain($particle) | 0; //@line 8330
      $13 = HEAP32[$length_i107 >> 2] | 0; //@line 8331
      HEAP32[$length_i107 >> 2] = $13 + 1; //@line 8333
      HEAP32[$0 + 48 + ($13 << 2) >> 2] = $12; //@line 8335
      $added_0 = 1; //@line 8337
      break L869;
     } else {
      __AQDdvt_toChildren($0); //@line 8340
      break;
     }
    }
   } while (0);
   __AQDdvt_addParticleChild($0, $particle, $aabb); //@line 8346
   $added_0 = 1; //@line 8347
  } else {
   $added_0 = 0; //@line 8349
  }
 } while (0);
 $14 = HEAP32[$self + 36 >> 2] | 0; //@line 8354
 L881 : do {
  if (+HEAPF32[$14 + 24 >> 2] < +HEAPF32[$right_i >> 2]) {
   if (+HEAPF32[$14 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $added_1 = $added_0; //@line 8369
    break;
   }
   if (+HEAPF32[$14 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $added_1 = $added_0; //@line 8379
    break;
   }
   if (+HEAPF32[$14 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $added_1 = $added_0; //@line 8389
    break;
   }
   HEAP32[$14 + 28 >> 2] = 0; //@line 8393
   do {
    if ((HEAP32[$14 + 32 >> 2] | 0) == 0) {
     $length_i91 = $14 + 240 | 0; //@line 8400
     if ((HEAP32[$length_i91 >> 2] | 0) < 48) {
      $26 = _aqretain($particle) | 0; //@line 8407
      $27 = HEAP32[$length_i91 >> 2] | 0; //@line 8408
      HEAP32[$length_i91 >> 2] = $27 + 1; //@line 8410
      HEAP32[$14 + 48 + ($27 << 2) >> 2] = $26; //@line 8412
      $added_1 = 1; //@line 8414
      break L881;
     } else {
      __AQDdvt_toChildren($14); //@line 8417
      break;
     }
    }
   } while (0);
   __AQDdvt_addParticleChild($14, $particle, $aabb); //@line 8423
   $added_1 = 1; //@line 8424
  } else {
   $added_1 = $added_0; //@line 8426
  }
 } while (0);
 $28 = HEAP32[$self + 40 >> 2] | 0; //@line 8431
 L893 : do {
  if (+HEAPF32[$28 + 24 >> 2] < +HEAPF32[$right_i >> 2]) {
   if (+HEAPF32[$28 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $added_2 = $added_1; //@line 8446
    break;
   }
   if (+HEAPF32[$28 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $added_2 = $added_1; //@line 8456
    break;
   }
   if (+HEAPF32[$28 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $added_2 = $added_1; //@line 8466
    break;
   }
   HEAP32[$28 + 28 >> 2] = 0; //@line 8470
   do {
    if ((HEAP32[$28 + 32 >> 2] | 0) == 0) {
     $length_i75 = $28 + 240 | 0; //@line 8477
     if ((HEAP32[$length_i75 >> 2] | 0) < 48) {
      $40 = _aqretain($particle) | 0; //@line 8484
      $41 = HEAP32[$length_i75 >> 2] | 0; //@line 8485
      HEAP32[$length_i75 >> 2] = $41 + 1; //@line 8487
      HEAP32[$28 + 48 + ($41 << 2) >> 2] = $40; //@line 8489
      $added_2 = 1; //@line 8491
      break L893;
     } else {
      __AQDdvt_toChildren($28); //@line 8494
      break;
     }
    }
   } while (0);
   __AQDdvt_addParticleChild($28, $particle, $aabb); //@line 8500
   $added_2 = 1; //@line 8501
  } else {
   $added_2 = $added_1; //@line 8503
  }
 } while (0);
 $42 = HEAP32[$self + 44 >> 2] | 0; //@line 8508
 L905 : do {
  if (+HEAPF32[$42 + 24 >> 2] < +HEAPF32[$right_i >> 2]) {
   if (+HEAPF32[$42 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    label = 725; //@line 8523
    break;
   }
   if (+HEAPF32[$42 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    label = 725; //@line 8533
    break;
   }
   if (+HEAPF32[$42 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    label = 725; //@line 8543
    break;
   }
   HEAP32[$42 + 28 >> 2] = 0; //@line 8547
   do {
    if ((HEAP32[$42 + 32 >> 2] | 0) == 0) {
     $length_i = $42 + 240 | 0; //@line 8554
     if ((HEAP32[$length_i >> 2] | 0) < 48) {
      $54 = _aqretain($particle) | 0; //@line 8561
      $55 = HEAP32[$length_i >> 2] | 0; //@line 8562
      HEAP32[$length_i >> 2] = $55 + 1; //@line 8564
      HEAP32[$42 + 48 + ($55 << 2) >> 2] = $54; //@line 8566
      break L905;
     } else {
      __AQDdvt_toChildren($42); //@line 8570
      break;
     }
    }
   } while (0);
   __AQDdvt_addParticleChild($42, $particle, $aabb); //@line 8576
  } else {
   label = 725; //@line 8578
  }
 } while (0);
 do {
  if ((label | 0) == 725) {
   if (($added_2 | 0) != 0) {
    break;
   }
   return;
  }
 } while (0);
 $length = $self + 240 | 0; //@line 8591
 HEAP32[$length >> 2] = (HEAP32[$length >> 2] | 0) + 1; //@line 8594
 return;
}
function __SLLeaper_setPosition($self, $position) {
 $self = $self | 0;
 $position = $position | 0;
 var $bodies = 0, $triggers = 0, $conv = 0.0, $radius = 0, $1 = 0.0, $conv13 = 0.0, $call = 0, $call1 = 0, $lastPosition4 = 0, $4 = 0.0, $7 = 0, $8 = 0, $9$0 = 0, $9$1 = 0, $10 = 0, $11 = 0, $call_1 = 0, $call1_1 = 0, $lastPosition4_1 = 0, $conv8_1 = 0.0, $17 = 0, $18 = 0, $19$0 = 0, $19$1 = 0, $20 = 0, $21 = 0, $call_2 = 0, $call1_2 = 0, $lastPosition4_2 = 0, $conv8_2 = 0.0, $27 = 0, $28 = 0, $29$0 = 0, $29$1 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34$1 = 0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 2772
 tempParam = $position; //@line 2773
 $position = STACKTOP; //@line 2773
 STACKTOP = STACKTOP + 8 | 0; //@line 2773
 HEAP32[$position >> 2] = HEAP32[tempParam >> 2]; //@line 2773
 HEAP32[$position + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 2773
 $bodies = $self + 36 | 0; //@line 2774
 $triggers = $self + 40 | 0; //@line 2775
 $conv = +HEAPF32[$position >> 2]; //@line 2778
 $radius = $self + 20 | 0; //@line 2779
 $1 = +HEAPF32[$position + 4 >> 2]; //@line 2781
 $conv13 = $1; //@line 2782
 $call = _AQList_at(HEAP32[$bodies >> 2] | 0, 0) | 0; //@line 2784
 $call1 = _AQList_at(HEAP32[$triggers >> 2] | 0, 0) | 0; //@line 2786
 $lastPosition4 = $call1 + 48 | 0; //@line 2790
 $4 = +HEAPF32[$radius >> 2]; //@line 2791
 HEAPF32[$lastPosition4 >> 2] = $conv + $4 * 6.123233995736766e-17; //@line 2798
 HEAPF32[$call1 + 52 >> 2] = $1 + $4; //@line 2801
 $7 = $lastPosition4; //@line 2802
 $8 = $call1 + 12 | 0; //@line 2803
 $9$0 = HEAP32[$7 >> 2] | 0; //@line 2805
 $9$1 = HEAP32[$7 + 4 >> 2] | 0; //@line 2807
 HEAP32[$8 >> 2] = $9$0; //@line 2809
 HEAP32[$8 + 4 >> 2] = $9$1; //@line 2811
 $10 = $call + 48 | 0; //@line 2812
 HEAP32[$10 >> 2] = $9$0; //@line 2814
 HEAP32[$10 + 4 >> 2] = $9$1; //@line 2816
 $11 = $call + 12 | 0; //@line 2817
 HEAP32[$11 >> 2] = $9$0; //@line 2819
 HEAP32[$11 + 4 >> 2] = $9$1; //@line 2821
 $call_1 = _AQList_at(HEAP32[$bodies >> 2] | 0, 1) | 0; //@line 2823
 $call1_1 = _AQList_at(HEAP32[$triggers >> 2] | 0, 1) | 0; //@line 2825
 $lastPosition4_1 = $call1_1 + 48 | 0; //@line 2829
 $conv8_1 = +HEAPF32[$radius >> 2]; //@line 2831
 HEAPF32[$lastPosition4_1 >> 2] = $conv + $conv8_1 * -.8660254037844388; //@line 2839
 HEAPF32[$call1_1 + 52 >> 2] = $conv13 + $conv8_1 * -.4999999999999998; //@line 2842
 $17 = $lastPosition4_1; //@line 2843
 $18 = $call1_1 + 12 | 0; //@line 2844
 $19$0 = HEAP32[$17 >> 2] | 0; //@line 2846
 $19$1 = HEAP32[$17 + 4 >> 2] | 0; //@line 2848
 HEAP32[$18 >> 2] = $19$0; //@line 2850
 HEAP32[$18 + 4 >> 2] = $19$1; //@line 2852
 $20 = $call_1 + 48 | 0; //@line 2853
 HEAP32[$20 >> 2] = $19$0; //@line 2855
 HEAP32[$20 + 4 >> 2] = $19$1; //@line 2857
 $21 = $call_1 + 12 | 0; //@line 2858
 HEAP32[$21 >> 2] = $19$0; //@line 2860
 HEAP32[$21 + 4 >> 2] = $19$1; //@line 2862
 $call_2 = _AQList_at(HEAP32[$bodies >> 2] | 0, 2) | 0; //@line 2864
 $call1_2 = _AQList_at(HEAP32[$triggers >> 2] | 0, 2) | 0; //@line 2866
 $lastPosition4_2 = $call1_2 + 48 | 0; //@line 2870
 $conv8_2 = +HEAPF32[$radius >> 2]; //@line 2872
 HEAPF32[$lastPosition4_2 >> 2] = $conv + $conv8_2 * .8660254037844384; //@line 2880
 HEAPF32[$call1_2 + 52 >> 2] = $conv13 + $conv8_2 * -.5000000000000004; //@line 2883
 $27 = $lastPosition4_2; //@line 2884
 $28 = $call1_2 + 12 | 0; //@line 2885
 $29$0 = HEAP32[$27 >> 2] | 0; //@line 2887
 $29$1 = HEAP32[$27 + 4 >> 2] | 0; //@line 2889
 HEAP32[$28 >> 2] = $29$0; //@line 2891
 HEAP32[$28 + 4 >> 2] = $29$1; //@line 2893
 $30 = $call_2 + 48 | 0; //@line 2894
 HEAP32[$30 >> 2] = $29$0; //@line 2896
 HEAP32[$30 + 4 >> 2] = $29$1; //@line 2898
 $31 = $call_2 + 12 | 0; //@line 2899
 HEAP32[$31 >> 2] = $29$0; //@line 2901
 HEAP32[$31 + 4 >> 2] = $29$1; //@line 2903
 $32 = $position; //@line 2905
 $33 = $self + 12 | 0; //@line 2906
 $34$1 = HEAP32[$32 + 4 >> 2] | 0; //@line 2910
 HEAP32[$33 >> 2] = HEAP32[$32 >> 2]; //@line 2912
 HEAP32[$33 + 4 >> 2] = $34$1; //@line 2914
 STACKTOP = sp; //@line 2915
 return;
}
function __AQDdvt_removeParticleChild($self, $particle, $aabb) {
 $self = $self | 0;
 $particle = $particle | 0;
 $aabb = $aabb | 0;
 var $0 = 0, $right_i21 = 0, $2 = 0.0, $9 = 0.0, $removed_0 = 0, $10 = 0, $18 = 0.0, $removed_1 = 0, $19 = 0, $27 = 0.0, $removed_2 = 0, $28 = 0, $removed_376 = 0, $length = 0, $removed_377 = 0, label = 0;
 $0 = HEAP32[$self + 32 >> 2] | 0; //@line 8611
 $right_i21 = $aabb + 4 | 0; //@line 8614
 $2 = +HEAPF32[$right_i21 >> 2]; //@line 8615
 do {
  if (+HEAPF32[$0 + 24 >> 2] < $2) {
   if (+HEAPF32[$0 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $removed_0 = 0; //@line 8627
    $9 = $2; //@line 8627
    break;
   }
   if (+HEAPF32[$0 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $removed_0 = 0; //@line 8637
    $9 = $2; //@line 8637
    break;
   }
   if (+HEAPF32[$0 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $removed_0 = 0; //@line 8647
    $9 = $2; //@line 8647
    break;
   }
   __AQDdvt_removeParticle($0, $particle, $aabb); //@line 8650
   $removed_0 = 1; //@line 8653
   $9 = +HEAPF32[$right_i21 >> 2]; //@line 8653
  } else {
   $removed_0 = 0; //@line 8655
   $9 = $2; //@line 8655
  }
 } while (0);
 $10 = HEAP32[$self + 36 >> 2] | 0; //@line 8661
 do {
  if (+HEAPF32[$10 + 24 >> 2] < $9) {
   if (+HEAPF32[$10 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $removed_1 = $removed_0; //@line 8675
    $18 = $9; //@line 8675
    break;
   }
   if (+HEAPF32[$10 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $removed_1 = $removed_0; //@line 8685
    $18 = $9; //@line 8685
    break;
   }
   if (+HEAPF32[$10 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $removed_1 = $removed_0; //@line 8695
    $18 = $9; //@line 8695
    break;
   }
   __AQDdvt_removeParticle($10, $particle, $aabb); //@line 8698
   $removed_1 = 1; //@line 8701
   $18 = +HEAPF32[$right_i21 >> 2]; //@line 8701
  } else {
   $removed_1 = $removed_0; //@line 8703
   $18 = $9; //@line 8703
  }
 } while (0);
 $19 = HEAP32[$self + 40 >> 2] | 0; //@line 8709
 do {
  if (+HEAPF32[$19 + 24 >> 2] < $18) {
   if (+HEAPF32[$19 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $removed_2 = $removed_1; //@line 8723
    $27 = $18; //@line 8723
    break;
   }
   if (+HEAPF32[$19 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $removed_2 = $removed_1; //@line 8733
    $27 = $18; //@line 8733
    break;
   }
   if (+HEAPF32[$19 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $removed_2 = $removed_1; //@line 8743
    $27 = $18; //@line 8743
    break;
   }
   __AQDdvt_removeParticle($19, $particle, $aabb); //@line 8746
   $removed_2 = 1; //@line 8749
   $27 = +HEAPF32[$right_i21 >> 2]; //@line 8749
  } else {
   $removed_2 = $removed_1; //@line 8751
   $27 = $18; //@line 8751
  }
 } while (0);
 $28 = HEAP32[$self + 44 >> 2] | 0; //@line 8757
 do {
  if (+HEAPF32[$28 + 24 >> 2] < $27) {
   if (+HEAPF32[$28 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    label = 750; //@line 8771
    break;
   }
   if (+HEAPF32[$28 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    label = 750; //@line 8781
    break;
   }
   if (+HEAPF32[$28 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    label = 750; //@line 8791
    break;
   }
   __AQDdvt_removeParticle($28, $particle, $aabb); //@line 8794
   $removed_376 = 1; //@line 8796
  } else {
   label = 750; //@line 8798
  }
 } while (0);
 do {
  if ((label | 0) == 750) {
   if (($removed_2 | 0) == 0) {
    $removed_377 = 0; //@line 8806
   } else {
    $removed_376 = $removed_2; //@line 8808
    break;
   }
   return $removed_377 | 0; //@line 8812
  }
 } while (0);
 $length = $self + 240 | 0; //@line 8816
 HEAP32[$length >> 2] = (HEAP32[$length >> 2] | 0) - 1; //@line 8819
 $removed_377 = $removed_376; //@line 8821
 return $removed_377 | 0; //@line 8823
}
function _AQParticle_solve($self, $other, $col) {
 $self = $self | 0;
 $other = $other | 0;
 $col = $col | 0;
 var $mul = 0.0, $mul6 = 0.0, $mul8 = 0.0, $4 = 0.0, $5 = 0.0, $add = 0.0, $x = 0, $x12 = 0, $sub = 0.0, $y = 0, $y13 = 0, $sub14 = 0.0, $conv2_i = 0.0, $x15 = 0, $x16 = 0, $sub17 = 0.0, $y18 = 0, $y19 = 0, $sub20 = 0.0, $conv2_i71 = 0.0, $call22 = 0.0, $conv28 = 0.0, $sub31 = 0.0, $avy_0 = 0.0, $avx_0 = 0.0, $sub40 = 0.0, $bvx_0 = 0.0, $bvy_0 = 0.0, $tobool48 = 0, $bm_0 = 0.0, $am_0 = 0.0, $isTrigger = 0, $isTrigger55 = 0, $31 = 0.0, $32 = 0.0, $33 = 0.0, $34 = 0.0;
 $mul = +HEAPF32[$self + 36 >> 2] * +HEAPF32[$other + 36 >> 2]; //@line 11386
 $mul6 = +HEAPF32[$col + 8 >> 2] * $mul; //@line 11389
 $mul8 = $mul * +HEAPF32[$col + 12 >> 2]; //@line 11392
 $4 = +HEAPF32[$self + 28 >> 2]; //@line 11394
 $5 = +HEAPF32[$other + 28 >> 2]; //@line 11396
 $add = $4 + $5; //@line 11397
 $x = $self + 48 | 0; //@line 11400
 $x12 = $self + 12 | 0; //@line 11402
 $sub = +HEAPF32[$x >> 2] - +HEAPF32[$x12 >> 2]; //@line 11404
 $y = $self + 52 | 0; //@line 11405
 $y13 = $self + 16 | 0; //@line 11407
 $sub14 = +HEAPF32[$y >> 2] - +HEAPF32[$y13 >> 2]; //@line 11409
 $conv2_i = +Math_sqrt(+($sub * $sub + $sub14 * $sub14)); //@line 11413
 $x15 = $other + 48 | 0; //@line 11414
 $x16 = $other + 12 | 0; //@line 11416
 $sub17 = +HEAPF32[$x15 >> 2] - +HEAPF32[$x16 >> 2]; //@line 11418
 $y18 = $other + 52 | 0; //@line 11419
 $y19 = $other + 16 | 0; //@line 11421
 $sub20 = +HEAPF32[$y18 >> 2] - +HEAPF32[$y19 >> 2]; //@line 11423
 $conv2_i71 = +Math_sqrt(+($sub17 * $sub17 + $sub20 * $sub20)); //@line 11427
 $call22 = +Math_abs(+(+HEAPF32[$col + 16 >> 2])); //@line 11431
 $conv28 = $call22 * +HEAPF32[$self + 32 >> 2] * +HEAPF32[$other + 32 >> 2]; //@line 11440
 if ($conv2_i != 0.0) {
  $sub31 = $conv2_i - $conv28; //@line 11445
  $avx_0 = $sub31 * ($sub / $conv2_i); //@line 11450
  $avy_0 = $sub31 * ($sub14 / $conv2_i); //@line 11450
 } else {
  $avx_0 = $sub; //@line 11452
  $avy_0 = $sub14; //@line 11452
 }
 if ($conv2_i71 != 0.0) {
  $sub40 = $conv2_i71 - $conv28; //@line 11460
  $bvy_0 = $sub40 * ($sub20 / $conv2_i71); //@line 11465
  $bvx_0 = $sub40 * ($sub17 / $conv2_i71); //@line 11465
 } else {
  $bvy_0 = $sub20; //@line 11467
  $bvx_0 = $sub17; //@line 11467
 }
 if ((HEAP8[$self + 96 | 0] | 0) == 0) {
  $tobool48 = (HEAP8[$other + 96 | 0] | 0) == 0; //@line 11478
  $am_0 = $tobool48 ? $5 / $add : 1.0; //@line 11482
  $bm_0 = $tobool48 ? $4 / $add : 0.0; //@line 11482
 } else {
  $am_0 = 0.0; //@line 11484
  $bm_0 = 1.0; //@line 11484
 }
 $isTrigger = $self + 97 | 0; //@line 11488
 if ((HEAP8[$isTrigger] | 0) != 0) {
  FUNCTION_TABLE_viii[HEAP32[$self + 100 >> 2] & 31]($self, $other, HEAP32[$self + 104 >> 2] | 0); //@line 11499
 }
 $isTrigger55 = $other + 97 | 0; //@line 11502
 if ((HEAP8[$isTrigger55] | 0) != 0) {
  FUNCTION_TABLE_viii[HEAP32[$other + 100 >> 2] & 31]($other, $self, HEAP32[$other + 104 >> 2] | 0); //@line 11513
 }
 if ((HEAP8[$isTrigger] | 0) != 0) {
  return;
 }
 if ((HEAP8[$isTrigger55] | 0) != 0) {
  return;
 }
 $31 = +HEAPF32[$x12 >> 2]; //@line 11528
 HEAPF32[$x >> 2] = $avx_0 + $31; //@line 11530
 $32 = +HEAPF32[$y13 >> 2]; //@line 11531
 HEAPF32[$y >> 2] = $avy_0 + $32; //@line 11533
 HEAPF32[$x12 >> 2] = $mul6 * $am_0 + $31; //@line 11536
 HEAPF32[$y13 >> 2] = $mul8 * $am_0 + $32; //@line 11539
 $33 = +HEAPF32[$x16 >> 2]; //@line 11540
 HEAPF32[$x15 >> 2] = $bvx_0 + $33; //@line 11542
 $34 = +HEAPF32[$y19 >> 2]; //@line 11543
 HEAPF32[$y18 >> 2] = $bvy_0 + $34; //@line 11545
 HEAPF32[$x16 >> 2] = $33 - $mul6 * $bm_0; //@line 11548
 HEAPF32[$y19 >> 2] = $34 - $mul8 * $bm_0; //@line 11551
 return;
}
function _AQDraw_polygon($vertices, $next, $sides, $center, $radius, $angle) {
 $vertices = $vertices | 0;
 $next = $next | 0;
 $sides = $sides | 0;
 $center = $center | 0;
 $radius = +$radius;
 $angle = +$angle;
 var $conv_i = 0.0, $conv1_i = 0.0, $call3_i = 0.0, $conv4_i = 0.0, $conv7_i = 0.0, $conv_i_i = 0.0, $conv1_i_i = 0.0, $call3_i_i = 0.0, $add_i_i = 0.0, $add6_i_i = 0.0, $center_19_val = 0.0, $center_08_val = 0.0, $i_079 = 0, $vertices_addr_078 = 0, $v2_sroa_0_0_load506977 = 0.0, $v2_sroa_1_4_load517076 = 0.0, $v_sroa_0_0_load537175 = 0.0, $v_sroa_1_4_load577274 = 0.0, $add_i20 = 0.0, $add3_i21 = 0.0, $call_i48 = 0, $call6_i = 0, $4 = 0, $add_i31 = 0.0, $inc = 0, $vertices_addr_0_lcssa = 0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 1228
 tempParam = $center; //@line 1229
 $center = STACKTOP; //@line 1229
 STACKTOP = STACKTOP + 8 | 0; //@line 1229
 HEAP32[$center >> 2] = HEAP32[tempParam >> 2]; //@line 1229
 HEAP32[$center + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 1229
 $conv_i = 6.283185307179586 / +($sides | 0); //@line 1233
 $conv1_i = +Math_cos(+$conv_i); //@line 1235
 $call3_i = +Math_sin(+$conv_i); //@line 1236
 $conv4_i = -0.0 - $call3_i; //@line 1238
 $conv7_i = $call3_i; //@line 1239
 $conv_i_i = $angle; //@line 1240
 $conv1_i_i = +Math_cos(+$conv_i_i); //@line 1242
 $call3_i_i = +Math_sin(+$conv_i_i); //@line 1243
 $add_i_i = $conv1_i_i * 0.0 + (-0.0 - $call3_i_i) * $radius; //@line 1249
 $add6_i_i = $conv1_i_i * $radius + $call3_i_i * 0.0; //@line 1252
 if (($sides | 0) <= 0) {
  $vertices_addr_0_lcssa = $vertices; //@line 1256
  STACKTOP = sp; //@line 1258
  return $vertices_addr_0_lcssa | 0; //@line 1258
 }
 $center_19_val = +HEAPF32[$center + 4 >> 2]; //@line 1262
 $center_08_val = +HEAPF32[$center >> 2]; //@line 1263
 $v_sroa_1_4_load577274 = $center_19_val + $add6_i_i; //@line 1273
 $v_sroa_0_0_load537175 = $center_08_val + $add_i_i; //@line 1273
 $v2_sroa_1_4_load517076 = $conv1_i * $add6_i_i + $conv7_i * $add_i_i; //@line 1273
 $v2_sroa_0_0_load506977 = $conv4_i * $add6_i_i + $conv1_i * $add_i_i; //@line 1273
 $vertices_addr_078 = $vertices; //@line 1273
 $i_079 = 0; //@line 1273
 while (1) {
  $add_i20 = $v2_sroa_0_0_load506977 + $center_08_val; //@line 1281
  $add3_i21 = $v2_sroa_1_4_load517076 + $center_19_val; //@line 1282
  HEAPF32[$vertices_addr_078 >> 2] = $v_sroa_0_0_load537175; //@line 1284
  HEAPF32[$vertices_addr_078 + 4 >> 2] = $v_sroa_1_4_load577274; //@line 1287
  $call_i48 = FUNCTION_TABLE_ii[$next & 63]($vertices_addr_078) | 0; //@line 1288
  HEAPF32[$call_i48 >> 2] = $add_i20; //@line 1290
  HEAPF32[$call_i48 + 4 >> 2] = $add3_i21; //@line 1292
  $call6_i = FUNCTION_TABLE_ii[$next & 63]($call_i48) | 0; //@line 1293
  HEAPF32[$call6_i >> 2] = $center_08_val; //@line 1295
  HEAPF32[$call6_i + 4 >> 2] = $center_19_val; //@line 1297
  $4 = FUNCTION_TABLE_ii[$next & 63]($call6_i) | 0; //@line 1299
  $add_i31 = $conv4_i * $v2_sroa_1_4_load517076 + $conv1_i * $v2_sroa_0_0_load506977; //@line 1302
  $inc = $i_079 + 1 | 0; //@line 1306
  if (($inc | 0) < ($sides | 0)) {
   $v_sroa_1_4_load577274 = $add3_i21; //@line 1310
   $v_sroa_0_0_load537175 = $add_i20; //@line 1310
   $v2_sroa_1_4_load517076 = $conv1_i * $v2_sroa_1_4_load517076 + $conv7_i * $v2_sroa_0_0_load506977; //@line 1310
   $v2_sroa_0_0_load506977 = $add_i31; //@line 1310
   $vertices_addr_078 = $4; //@line 1310
   $i_079 = $inc; //@line 1310
  } else {
   $vertices_addr_0_lcssa = $4; //@line 1312
   break;
  }
 }
 STACKTOP = sp; //@line 1317
 return $vertices_addr_0_lcssa | 0; //@line 1317
}
function __AQDdvt_wakeParticle($self, $particle, $aabb) {
 $self = $self | 0;
 $particle = $particle | 0;
 $aabb = $aabb | 0;
 var $0 = 0, $right_i = 0, $2 = 0.0, $9 = 0.0, $contained_0 = 0, $10 = 0, $18 = 0.0, $contained_1 = 0, $19 = 0, $27 = 0.0, $contained_2 = 0, $28 = 0, label = 0;
 $0 = HEAP32[$self + 32 >> 2] | 0; //@line 10174
 if (($0 | 0) == 0) {
  HEAP32[$self + 28 >> 2] = 0; //@line 10179
  return;
 }
 $right_i = $aabb + 4 | 0; //@line 10185
 $2 = +HEAPF32[$right_i >> 2]; //@line 10186
 do {
  if (+HEAPF32[$0 + 24 >> 2] < $2) {
   if (+HEAPF32[$0 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $contained_0 = 0; //@line 10198
    $9 = $2; //@line 10198
    break;
   }
   if (+HEAPF32[$0 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $contained_0 = 0; //@line 10208
    $9 = $2; //@line 10208
    break;
   }
   if (+HEAPF32[$0 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $contained_0 = 0; //@line 10218
    $9 = $2; //@line 10218
    break;
   }
   __AQDdvt_wakeParticle($0, $particle, $aabb); //@line 10221
   $contained_0 = 1; //@line 10224
   $9 = +HEAPF32[$right_i >> 2]; //@line 10224
  } else {
   $contained_0 = 0; //@line 10226
   $9 = $2; //@line 10226
  }
 } while (0);
 $10 = HEAP32[$self + 36 >> 2] | 0; //@line 10232
 do {
  if (+HEAPF32[$10 + 24 >> 2] < $9) {
   if (+HEAPF32[$10 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $contained_1 = $contained_0; //@line 10246
    $18 = $9; //@line 10246
    break;
   }
   if (+HEAPF32[$10 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $contained_1 = $contained_0; //@line 10256
    $18 = $9; //@line 10256
    break;
   }
   if (+HEAPF32[$10 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $contained_1 = $contained_0; //@line 10266
    $18 = $9; //@line 10266
    break;
   }
   __AQDdvt_wakeParticle($10, $particle, $aabb); //@line 10269
   $contained_1 = 1; //@line 10272
   $18 = +HEAPF32[$right_i >> 2]; //@line 10272
  } else {
   $contained_1 = $contained_0; //@line 10274
   $18 = $9; //@line 10274
  }
 } while (0);
 $19 = HEAP32[$self + 40 >> 2] | 0; //@line 10280
 do {
  if (+HEAPF32[$19 + 24 >> 2] < $18) {
   if (+HEAPF32[$19 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    $contained_2 = $contained_1; //@line 10294
    $27 = $18; //@line 10294
    break;
   }
   if (+HEAPF32[$19 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    $contained_2 = $contained_1; //@line 10304
    $27 = $18; //@line 10304
    break;
   }
   if (+HEAPF32[$19 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    $contained_2 = $contained_1; //@line 10314
    $27 = $18; //@line 10314
    break;
   }
   __AQDdvt_wakeParticle($19, $particle, $aabb); //@line 10317
   $contained_2 = 1; //@line 10320
   $27 = +HEAPF32[$right_i >> 2]; //@line 10320
  } else {
   $contained_2 = $contained_1; //@line 10322
   $27 = $18; //@line 10322
  }
 } while (0);
 $28 = HEAP32[$self + 44 >> 2] | 0; //@line 10328
 do {
  if (+HEAPF32[$28 + 24 >> 2] < $27) {
   if (+HEAPF32[$28 + 16 >> 2] <= +HEAPF32[$aabb + 12 >> 2]) {
    label = 938; //@line 10342
    break;
   }
   if (+HEAPF32[$28 + 20 >> 2] >= +HEAPF32[$aabb >> 2]) {
    label = 938; //@line 10352
    break;
   }
   if (+HEAPF32[$28 + 12 >> 2] <= +HEAPF32[$aabb + 8 >> 2]) {
    label = 938; //@line 10362
    break;
   }
   __AQDdvt_wakeParticle($28, $particle, $aabb); //@line 10365
  } else {
   label = 938; //@line 10368
  }
 } while (0);
 do {
  if ((label | 0) == 938) {
   if (($contained_2 | 0) != 0) {
    break;
   }
   return;
  }
 } while (0);
 HEAP32[$self + 28 >> 2] = 0; //@line 10382
 return;
}
function _AQDraw_rotatedRect($vertices, $itr, $rect, $radians) {
 $vertices = $vertices | 0;
 $itr = $itr | 0;
 $rect = $rect | 0;
 $radians = +$radians;
 var $conv = 0.0, $conv1 = 0.0, $conv4 = 0.0, $rect46_sroa_0_0_copyload = 0.0, $rect46_sroa_1_4_copyload = 0.0, $rect46_sroa_2_8_copyload = 0.0, $rect46_sroa_3_12_copyload = 0.0, $mul_i_i_i = 0.0, $mul1_i_i_i = 0.0, $add_i_i = 0.0, $add3_i_i = 0.0, $mul = 0.0, $add = 0.0, $mul6 = 0.0, $sub = 0.0, $mul9 = 0.0, $add10 = 0.0, $mul12 = 0.0, $add13 = 0.0, $call15 = 0, $sub19 = 0.0, $call32 = 0, $add39 = 0.0, $sub44 = 0.0, $sub47 = 0.0, $call49 = 0, $call66 = 0, $call83 = 0, $7 = 0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 1143
 tempParam = $rect; //@line 1144
 $rect = STACKTOP; //@line 1144
 STACKTOP = STACKTOP + 16 | 0; //@line 1144
 HEAP32[$rect >> 2] = HEAP32[tempParam >> 2]; //@line 1144
 HEAP32[$rect + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 1144
 HEAP32[$rect + 8 >> 2] = HEAP32[tempParam + 8 >> 2]; //@line 1144
 HEAP32[$rect + 12 >> 2] = HEAP32[tempParam + 12 >> 2]; //@line 1144
 $conv = $radians; //@line 1145
 $conv1 = +Math_cos(+$conv); //@line 1147
 $conv4 = +Math_sin(+$conv); //@line 1149
 $rect46_sroa_0_0_copyload = (copyTempFloat($rect | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1151
 $rect46_sroa_1_4_copyload = (copyTempFloat($rect + 4 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1153
 $rect46_sroa_2_8_copyload = (copyTempFloat($rect + 8 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1155
 $rect46_sroa_3_12_copyload = (copyTempFloat($rect + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 1157
 $mul_i_i_i = ($rect46_sroa_1_4_copyload - $rect46_sroa_3_12_copyload) * .5; //@line 1160
 $mul1_i_i_i = ($rect46_sroa_0_0_copyload - $rect46_sroa_2_8_copyload) * .5; //@line 1161
 $add_i_i = $rect46_sroa_3_12_copyload + $mul_i_i_i; //@line 1162
 $add3_i_i = $rect46_sroa_2_8_copyload + $mul1_i_i_i; //@line 1163
 $mul = $conv1 * $mul_i_i_i; //@line 1164
 $add = $add_i_i + $mul; //@line 1165
 $mul6 = $conv4 * $mul1_i_i_i; //@line 1166
 $sub = $add - $mul6; //@line 1167
 HEAPF32[$vertices >> 2] = $sub; //@line 1169
 $mul9 = $conv1 * $mul1_i_i_i; //@line 1170
 $add10 = $add3_i_i + $mul9; //@line 1171
 $mul12 = $conv4 * $mul_i_i_i; //@line 1172
 $add13 = $add10 + $mul12; //@line 1173
 HEAPF32[$vertices + 4 >> 2] = $add13; //@line 1176
 $call15 = FUNCTION_TABLE_ii[$itr & 63]($vertices) | 0; //@line 1177
 $sub19 = $add_i_i - $mul; //@line 1179
 HEAPF32[$call15 >> 2] = $sub19 - $mul6; //@line 1181
 HEAPF32[$call15 + 4 >> 2] = $add10 - $mul12; //@line 1184
 $call32 = FUNCTION_TABLE_ii[$itr & 63]($call15) | 0; //@line 1185
 $add39 = $mul6 + $sub19; //@line 1187
 HEAPF32[$call32 >> 2] = $add39; //@line 1188
 $sub44 = $add3_i_i - $mul9; //@line 1189
 $sub47 = $sub44 - $mul12; //@line 1190
 HEAPF32[$call32 + 4 >> 2] = $sub47; //@line 1192
 $call49 = FUNCTION_TABLE_ii[$itr & 63]($call32) | 0; //@line 1193
 HEAPF32[$call49 >> 2] = $sub; //@line 1195
 HEAPF32[$call49 + 4 >> 2] = $add13; //@line 1197
 $call66 = FUNCTION_TABLE_ii[$itr & 63]($call49) | 0; //@line 1198
 HEAPF32[$call66 >> 2] = $mul6 + $add; //@line 1201
 HEAPF32[$call66 + 4 >> 2] = $sub44 + $mul12; //@line 1204
 $call83 = FUNCTION_TABLE_ii[$itr & 63]($call66) | 0; //@line 1205
 HEAPF32[$call83 >> 2] = $add39; //@line 1207
 HEAPF32[$call83 + 4 >> 2] = $sub47; //@line 1209
 $7 = FUNCTION_TABLE_ii[$itr & 63]($call83) | 0; //@line 1211
 STACKTOP = sp; //@line 1212
 return $7 | 0; //@line 1212
}
function __AQDdvt_updateParticleLeaf($self, $particle, $old, $new) {
 $self = $self | 0;
 $particle = $particle | 0;
 $old = $old | 0;
 $new = $new | 0;
 var $aabb_i = 0, $aabb = 0, $0 = 0.0, $length1_i = 0, $8 = 0, $index_0_i = 0, $14 = 0, $15 = 0, $length1_i_i = 0, $23 = 0, $index_0_i_i = 0, $arrayidx_i_i = 0, label = 0, sp = 0;
 sp = STACKTOP; //@line 8037
 STACKTOP = STACKTOP + 16 | 0; //@line 8037
 $aabb_i = sp | 0; //@line 8038
 $aabb = $self + 12 | 0; //@line 8039
 $0 = +HEAPF32[$self + 24 >> 2]; //@line 8041
 do {
  if ($0 < +HEAPF32[$new + 4 >> 2]) {
   if (+HEAPF32[$self + 16 >> 2] <= +HEAPF32[$new + 12 >> 2]) {
    break;
   }
   if (+HEAPF32[$self + 20 >> 2] >= +HEAPF32[$new >> 2]) {
    break;
   }
   if (+HEAPF32[$aabb >> 2] <= +HEAPF32[$new + 8 >> 2]) {
    break;
   }
   $length1_i = $self + 240 | 0; //@line 8075
   $8 = HEAP32[$length1_i >> 2] | 0; //@line 8076
   $index_0_i = 0; //@line 8078
   while (1) {
    if (($index_0_i | 0) >= ($8 | 0)) {
     break;
    }
    if ((HEAP32[$self + 48 + ($index_0_i << 2) >> 2] | 0) == ($particle | 0)) {
     label = 655; //@line 8092
     break;
    } else {
     $index_0_i = $index_0_i + 1 | 0; //@line 8095
    }
   }
   do {
    if ((label | 0) == 655) {
     if (($index_0_i | 0) == -1) {
      break;
     }
     STACKTOP = sp; //@line 8105
     return;
    }
   } while (0);
   _AQParticle_aabb($aabb_i, $particle); //@line 8109
   HEAP32[$self + 28 >> 2] = 0; //@line 8111
   do {
    if ((HEAP32[$self + 32 >> 2] | 0) == 0) {
     if ((HEAP32[$length1_i >> 2] | 0) >= 48) {
      __AQDdvt_toChildren($self); //@line 8122
      break;
     }
     $14 = _aqretain($particle) | 0; //@line 8128
     $15 = HEAP32[$length1_i >> 2] | 0; //@line 8129
     HEAP32[$length1_i >> 2] = $15 + 1; //@line 8131
     HEAP32[$self + 48 + ($15 << 2) >> 2] = $14; //@line 8133
     STACKTOP = sp; //@line 8135
     return;
    }
   } while (0);
   __AQDdvt_addParticleChild($self, $particle, $aabb_i); //@line 8138
   STACKTOP = sp; //@line 8139
   return;
  }
 } while (0);
 if ($0 >= +HEAPF32[$old + 4 >> 2]) {
  STACKTOP = sp; //@line 8147
  return;
 }
 if (+HEAPF32[$self + 16 >> 2] <= +HEAPF32[$old + 12 >> 2]) {
  STACKTOP = sp; //@line 8156
  return;
 }
 if (+HEAPF32[$self + 20 >> 2] >= +HEAPF32[$old >> 2]) {
  STACKTOP = sp; //@line 8165
  return;
 }
 if (+HEAPF32[$aabb >> 2] <= +HEAPF32[$old + 8 >> 2]) {
  STACKTOP = sp; //@line 8174
  return;
 }
 $length1_i_i = $self + 240 | 0; //@line 8176
 $23 = HEAP32[$length1_i_i >> 2] | 0; //@line 8177
 $index_0_i_i = 0; //@line 8179
 while (1) {
  if (($index_0_i_i | 0) >= ($23 | 0)) {
   label = 673; //@line 8185
   break;
  }
  $arrayidx_i_i = $self + 48 + ($index_0_i_i << 2) | 0; //@line 8188
  if ((HEAP32[$arrayidx_i_i >> 2] | 0) == ($particle | 0)) {
   break;
  } else {
   $index_0_i_i = $index_0_i_i + 1 | 0; //@line 8196
  }
 }
 if ((label | 0) == 673) {
  STACKTOP = sp; //@line 8200
  return;
 }
 if (($index_0_i_i | 0) == -1) {
  STACKTOP = sp; //@line 8205
  return;
 }
 HEAP32[$arrayidx_i_i >> 2] = HEAP32[$self + 48 + ($23 - 1 << 2) >> 2]; //@line 8210
 HEAP32[$length1_i_i >> 2] = (HEAP32[$length1_i_i >> 2] | 0) - 1; //@line 8213
 _aqautorelease($particle) | 0; //@line 8215
 STACKTOP = sp; //@line 8217
 return;
}
function __SLLeaper_bodyAngularVelocity($self, $body) {
 $self = $self | 0;
 $body = $body | 0;
 var $position3_sroa_0_0_tmp4_idx = 0, $position3_sroa_0_0_copyload = 0.0, $position3_sroa_1_4_tmp4_idx40 = 0, $position3_sroa_1_4_copyload = 0.0, $position15_sroa_0_0_copyload = 0.0, $sub_i_i = 0.0, $sub3_i_i = 0.0, $div_i_i = 0.0, $call2_i = 0.0, $position8_sroa_0_0_copyload = 0.0, $position8_sroa_1_4_copyload = 0.0, $lastPosition11_sroa_0_0_copyload = 0.0, $sub_i_i22 = 0.0, $sub3_i_i23 = 0.0, $div_i_i28 = 0.0, $call2_i35 = 0.0, $sub_i = 0.0, $sub7_i = 0.0, $v_0_i = 0.0, $v_1_i = 0.0, $conv_i39 = 0.0, $conv = 0.0;
 $position3_sroa_0_0_tmp4_idx = $self + 12 | 0; //@line 4853
 $position3_sroa_0_0_copyload = (copyTempFloat($position3_sroa_0_0_tmp4_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4854
 $position3_sroa_1_4_tmp4_idx40 = $self + 16 | 0; //@line 4855
 $position3_sroa_1_4_copyload = (copyTempFloat($position3_sroa_1_4_tmp4_idx40 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4856
 $position15_sroa_0_0_copyload = (copyTempFloat($body + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4858
 $sub_i_i = $position15_sroa_0_0_copyload - $position3_sroa_0_0_copyload; //@line 4861
 $sub3_i_i = (copyTempFloat($body + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position3_sroa_1_4_copyload; //@line 4862
 $div_i_i = 1.0 / +Math_sqrt(+($sub_i_i * $sub_i_i + $sub3_i_i * $sub3_i_i)); //@line 4867
 $call2_i = +_fmod(+(+Math_atan2(+($sub3_i_i * $div_i_i), +($sub_i_i * $div_i_i)) + 6.283185307179586), 6.283185307179586); //@line 4874
 $position8_sroa_0_0_copyload = (copyTempFloat($position3_sroa_0_0_tmp4_idx | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4875
 $position8_sroa_1_4_copyload = (copyTempFloat($position3_sroa_1_4_tmp4_idx40 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4876
 $lastPosition11_sroa_0_0_copyload = (copyTempFloat($body + 48 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4878
 $sub_i_i22 = $lastPosition11_sroa_0_0_copyload - $position8_sroa_0_0_copyload; //@line 4881
 $sub3_i_i23 = (copyTempFloat($body + 52 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position8_sroa_1_4_copyload; //@line 4882
 $div_i_i28 = 1.0 / +Math_sqrt(+($sub_i_i22 * $sub_i_i22 + $sub3_i_i23 * $sub3_i_i23)); //@line 4887
 $call2_i35 = +_fmod(+(+Math_atan2(+($sub3_i_i23 * $div_i_i28), +($sub_i_i22 * $div_i_i28)) + 6.283185307179586), 6.283185307179586); //@line 4894
 $sub_i = +_fmod(+($call2_i + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 4897
 $sub7_i = +_fmod(+($sub_i - (+_fmod(+($call2_i35 + 3.141592653589793), 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 4904
 if ($sub7_i < -3.141592653589793) {
  $v_0_i = $sub7_i + 6.283185307179586; //@line 4910
 } else {
  $v_0_i = $sub7_i; //@line 4912
 }
 if ($v_0_i <= 3.141592653589793) {
  $v_1_i = $v_0_i; //@line 4918
  $conv_i39 = $v_1_i; //@line 4920
  $conv = $conv_i39; //@line 4921
  return +$conv;
 }
 $v_1_i = $v_0_i + -6.283185307179586; //@line 4926
 $conv_i39 = $v_1_i; //@line 4928
 $conv = $conv_i39; //@line 4929
 return +$conv;
}
function __SLParticleView_iterator($particle, $self) {
 $particle = $particle | 0;
 $self = $self | 0;
 var $glowColor = 0, $tmpcast = 0, $tmp = 0, $tmpcast19 = 0, $agg_tmp23 = 0, $currentVertex = 0, $0 = 0, $position = 0, $1 = 0, $sub_i = 0.0, $sub3_i = 0.0, $mul = 0.0, $userdata = 0, $5 = 0, $11 = 0, $12 = 0, $call20 = 0, $16 = 0, $conv3_i = 0, $conv12_i = 0, $conv25_i = 0, $conv38_i = 0, sp = 0;
 sp = STACKTOP; //@line 5669
 STACKTOP = STACKTOP + 8 | 0; //@line 5669
 $glowColor = sp | 0; //@line 5670
 $tmpcast = $glowColor; //@line 5671
 $tmp = STACKTOP; //@line 5672
 STACKTOP = STACKTOP + 4 | 0; //@line 5672
 STACKTOP = STACKTOP + 7 & -8; //@line 5672
 $tmpcast19 = $tmp; //@line 5673
 $agg_tmp23 = STACKTOP; //@line 5674
 STACKTOP = STACKTOP + 4 | 0; //@line 5674
 STACKTOP = STACKTOP + 7 & -8; //@line 5674
 $currentVertex = $self + 12582756 | 0; //@line 5675
 $0 = HEAP32[$currentVertex >> 2] | 0; //@line 5676
 $position = $particle + 12 | 0; //@line 5677
 $1 = HEAP32[$self + 28 >> 2] | 0; //@line 5679
 $sub_i = +HEAPF32[$position >> 2] - +HEAPF32[$1 + 12 >> 2]; //@line 5688
 $sub3_i = +HEAPF32[$particle + 16 >> 2] - +HEAPF32[$1 + 16 >> 2]; //@line 5689
 $mul = +Math_sqrt(+($sub_i * $sub_i + $sub3_i * $sub3_i)) / 18101.93359375 * 128.0; //@line 5695
 $userdata = $particle + 104 | 0; //@line 5703
 if (+Math_abs(+(+_fmod(+($mul - +HEAPF32[$self + 16 >> 2]), +8.0))) < 1.0) {
  _SLAmbientParticle_startPulse(HEAP32[$userdata >> 2] | 0); //@line 5708
 }
 HEAP32[$glowColor >> 2] = 0; //@line 5711
 $5 = HEAP32[$userdata >> 2] | 0; //@line 5712
 do {
  if (($5 | 0) != 0) {
   if ((_aqistype($5, 2032) | 0) == 0) {
    break;
   }
   _SLAmbientParticle_tick(HEAP32[$userdata >> 2] | 0); //@line 5725
   _SLAmbientParticle_color($tmpcast19, HEAP32[$userdata >> 2] | 0); //@line 5728
   HEAP32[$glowColor >> 2] = HEAP32[$tmp >> 2]; //@line 5730
  }
 } while (0);
 $11 = HEAP32[$currentVertex >> 2] | 0; //@line 5734
 $12 = $11; //@line 5735
 $call20 = _AQDraw_color($12, _AQDraw_polygon($12, 18, 8, $position, +HEAPF32[$particle + 20 >> 2], +($11 | 0) / 1.0e3) | 0, 18, 34, $tmpcast) | 0; //@line 5742
 HEAP32[$currentVertex >> 2] = $call20; //@line 5744
 $16 = $call20; //@line 5747
 $conv3_i = HEAPU8[$glowColor] | 0; //@line 5762
 $conv12_i = HEAPU8[$tmpcast + 1 | 0] | 0; //@line 5770
 $conv25_i = HEAPU8[$tmpcast + 2 | 0] | 0; //@line 5778
 $conv38_i = HEAPU8[$tmpcast + 3 | 0] | 0; //@line 5786
 HEAP8[$agg_tmp23 | 0] = ~~(+($conv3_i | 0) + +(192 - $conv3_i | 0) * .5); //@line 5794
 HEAP8[$agg_tmp23 + 1 | 0] = ~~(+($conv12_i | 0) + +(((($16 | 0) % 37 | 0) + 219 & 255) - $conv12_i | 0) * .5); //@line 5796
 HEAP8[$agg_tmp23 + 2 | 0] = ~~(+($conv25_i | 0) + +(((($16 | 0) % 53 | 0) + 203 & 255) - $conv25_i | 0) * .5); //@line 5798
 HEAP8[$agg_tmp23 + 3 | 0] = ~~(+($conv38_i | 0) + +(((($16 | 0) % 109 | 0) + 74 & 255) - $conv38_i | 0) * .5); //@line 5800
 _AQDraw_color($0 + 24 | 0, $call20, 43, 34, $agg_tmp23) | 0; //@line 5801
 STACKTOP = sp; //@line 5802
 return;
}
function _AQDdvt_iteratePairs($self, $pairIterator, $ctx) {
 $self = $self | 0;
 $pairIterator = $pairIterator | 0;
 $ctx = $ctx | 0;
 var $isSleeping = 0, $tl = 0, $1 = 0, $2 = 0, $sub = 0, $sleeping_040 = 0, $i_039 = 0, $arrayidx = 0, $3 = 0, $sleeping_0_inc = 0, $add = 0, $5 = 0, $j_037 = 0, $inc15 = 0, $sleeping_0_lcssa = 0, $i_0_lcssa = 0, $sleeping_2 = 0, $tr = 0, $bl = 0, $br = 0;
 $isSleeping = $self + 28 | 0; //@line 10437
 if ((HEAP32[$isSleeping >> 2] | 0) != 0) {
  return;
 }
 $tl = $self + 32 | 0; //@line 10444
 $1 = HEAP32[$tl >> 2] | 0; //@line 10445
 if (($1 | 0) != 0) {
  _AQDdvt_iteratePairs($1, $pairIterator, $ctx); //@line 10449
  $tr = $self + 36 | 0; //@line 10450
  _AQDdvt_iteratePairs(HEAP32[$tr >> 2] | 0, $pairIterator, $ctx); //@line 10452
  $bl = $self + 40 | 0; //@line 10453
  _AQDdvt_iteratePairs(HEAP32[$bl >> 2] | 0, $pairIterator, $ctx); //@line 10455
  $br = $self + 44 | 0; //@line 10456
  _AQDdvt_iteratePairs(HEAP32[$br >> 2] | 0, $pairIterator, $ctx); //@line 10458
  if ((HEAP32[(HEAP32[$tl >> 2] | 0) + 28 >> 2] | 0) == 0) {
   return;
  }
  if ((HEAP32[(HEAP32[$tr >> 2] | 0) + 28 >> 2] | 0) == 0) {
   return;
  }
  if ((HEAP32[(HEAP32[$bl >> 2] | 0) + 28 >> 2] | 0) == 0) {
   return;
  }
  if ((HEAP32[(HEAP32[$br >> 2] | 0) + 28 >> 2] | 0) == 0) {
   return;
  }
  HEAP32[$isSleeping >> 2] = 1; //@line 10491
  return;
 }
 $2 = HEAP32[$self + 240 >> 2] | 0; //@line 10496
 $sub = $2 - 1 | 0; //@line 10497
 if (($sub | 0) > 0) {
  $i_039 = 0; //@line 10501
  $sleeping_040 = 0; //@line 10501
  while (1) {
   $arrayidx = $self + 48 + ($i_039 << 2) | 0; //@line 10505
   $3 = HEAP32[$arrayidx >> 2] | 0; //@line 10506
   $sleeping_0_inc = ((HEAP8[$3 + 98 | 0] | 0) != 0) + $sleeping_040 | 0; //@line 10511
   $add = $i_039 + 1 | 0; //@line 10512
   L1222 : do {
    if (($add | 0) < ($2 | 0)) {
     $j_037 = $add; //@line 10517
     $5 = $3; //@line 10517
     while (1) {
      FUNCTION_TABLE_viii[$pairIterator & 31]($5, HEAP32[$self + 48 + ($j_037 << 2) >> 2] | 0, $ctx); //@line 10523
      $inc15 = $j_037 + 1 | 0; //@line 10524
      if (($inc15 | 0) >= ($2 | 0)) {
       break L1222;
      }
      $j_037 = $inc15; //@line 10532
      $5 = HEAP32[$arrayidx >> 2] | 0; //@line 10532
     }
    }
   } while (0);
   if (($add | 0) < ($sub | 0)) {
    $i_039 = $add; //@line 10539
    $sleeping_040 = $sleeping_0_inc; //@line 10539
   } else {
    $i_0_lcssa = $sub; //@line 10541
    $sleeping_0_lcssa = $sleeping_0_inc; //@line 10541
    break;
   }
  }
 } else {
  $i_0_lcssa = 0; //@line 10546
  $sleeping_0_lcssa = 0; //@line 10546
 }
 if (($2 | 0) > 0) {
  $sleeping_2 = ((HEAP8[(HEAP32[$self + 48 + ($i_0_lcssa << 2) >> 2] | 0) + 98 | 0] | 0) != 0) + $sleeping_0_lcssa | 0; //@line 10561
 } else {
  $sleeping_2 = $sleeping_0_lcssa; //@line 10563
 }
 if (($sleeping_2 | 0) != ($2 | 0)) {
  return;
 }
 HEAP32[$isSleeping >> 2] = 1; //@line 10571
 return;
}
function __SLAsteroidGroupView_iterator($asteroid, $self) {
 $asteroid = $asteroid | 0;
 $self = $self | 0;
 var $asteroidColor = 0, $tmpcast = 0, $_compoundliteral = 0, $agg_tmp = 0, $isHome = 0, $3 = 0, $storemerge21 = 0, $resource = 0, $5 = 0, $conv = 0, $currentVertex = 0, $6 = 0, $7 = 0, $call = 0, $call9 = 0, $add_ptr = 0, $10 = 0, $11 = 0, $12 = 0, $cond = 0, $call26 = 0, $16 = 0, $storemerge = 0, sp = 0;
 sp = STACKTOP; //@line 467
 STACKTOP = STACKTOP + 8 | 0; //@line 467
 $asteroidColor = sp | 0; //@line 468
 $tmpcast = $asteroidColor; //@line 469
 $_compoundliteral = STACKTOP; //@line 470
 STACKTOP = STACKTOP + 4 | 0; //@line 470
 STACKTOP = STACKTOP + 7 & -8; //@line 470
 $agg_tmp = STACKTOP; //@line 472
 STACKTOP = STACKTOP + 4 | 0; //@line 472
 STACKTOP = STACKTOP + 7 & -8; //@line 472
 if ((HEAP32[$asteroid + 36 >> 2] | 0) == 0) {
  STACKTOP = sp; //@line 479
  return;
 }
 $isHome = $asteroid + 48 | 0; //@line 481
 if ((HEAP32[$isHome >> 2] | 0) == 0) {
  $3 = $asteroid + 44 | 0; //@line 487
  $storemerge21 = HEAPU8[$3] | HEAPU8[$3 + 1 | 0] << 8 | HEAPU8[$3 + 2 | 0] << 16 | HEAPU8[$3 + 3 | 0] << 24 | 0; //@line 490
 } else {
  $storemerge21 = -4074497; //@line 492
 }
 HEAP32[$asteroidColor >> 2] = $storemerge21; //@line 495
 $resource = $asteroid + 40 | 0; //@line 496
 $5 = HEAP32[$resource >> 2] | 0; //@line 497
 $conv = $5 << 1 & 255; //@line 499
 HEAP8[$tmpcast + 3 | 0] = $conv; //@line 501
 $currentVertex = $self + 786440 | 0; //@line 502
 $6 = HEAP32[$currentVertex >> 2] | 0; //@line 503
 $7 = $6; //@line 504
 if ($conv << 24 >> 24 == 0) {
  $11 = $6; //@line 508
  $10 = $5; //@line 508
 } else {
  $call = _AQDraw_polygon($7, 18, 16, $asteroid + 12 | 0, +HEAPF32[$asteroid + 20 >> 2] * 5.0, .7853981852531433) | 0; //@line 514
  HEAP32[$_compoundliteral >> 2] = 0; //@line 515
  $call9 = _AQDraw_color($7, $call, 18, 34, $_compoundliteral) | 0; //@line 516
  HEAP32[$currentVertex >> 2] = $call9; //@line 518
  $add_ptr = $6 + 24 | 0; //@line 520
  _AQDraw_color($add_ptr, $call9, 43, 34, $tmpcast) | 0; //@line 521
  $11 = HEAP32[$currentVertex >> 2] | 0; //@line 525
  $10 = HEAP32[$resource >> 2] | 0; //@line 525
 }
 $12 = $11; //@line 529
 if (($10 | 0) == 0) {
  $cond = 16; //@line 533
 } else {
  $cond = ~~(+($10 | 0) * .0078125 * 16.0 + 16.0); //@line 541
 }
 $call26 = _AQDraw_polygon($12, 18, $cond, $asteroid + 12 | 0, +HEAPF32[$asteroid + 20 >> 2], .7853981852531433) | 0; //@line 547
 if ((HEAP32[$isHome >> 2] | 0) == 0) {
  $16 = $asteroid + 44 | 0; //@line 553
  $storemerge = HEAPU8[$16] | HEAPU8[$16 + 1 | 0] << 8 | HEAPU8[$16 + 2 | 0] << 16 | HEAPU8[$16 + 3 | 0] << 24 | 0; //@line 556
 } else {
  $storemerge = -4074497; //@line 558
 }
 HEAP32[$agg_tmp >> 2] = $storemerge; //@line 561
 HEAP32[$currentVertex >> 2] = _AQDraw_color($12, $call26, 18, 34, $agg_tmp) | 0; //@line 564
 STACKTOP = sp; //@line 566
 return;
}
function _stepInputWaterTest() {
 var $screenWidth = 0, $screenHeight = 0, $call1 = 0, $1 = 0, $sub = 0.0, $4 = 0, $sub7 = 0.0, $8 = 0, $conv2_i = 0.0, $div_i = 0.0, $call27 = 0.0, $conv31 = 0.0, $14 = 0, $sub60 = 0.0, $sub64 = 0.0, $div_i30 = 0.0, $call72 = 0.0, $conv77 = 0.0, label = 0, sp = 0;
 sp = STACKTOP; //@line 6673
 STACKTOP = STACKTOP + 16 | 0; //@line 6673
 $screenWidth = sp | 0; //@line 6674
 $screenHeight = sp + 8 | 0; //@line 6675
 if ((HEAP8[2520] | 0) != 0) {
  STACKTOP = sp; //@line 6680
  return;
 }
 _AQInput_getScreenSize($screenWidth, $screenHeight); //@line 6682
 $call1 = _AQArray_atIndex(_AQInput_getTouches() | 0, 0) | 0; //@line 6684
 if (($call1 | 0) == 0) {
  STACKTOP = sp; //@line 6688
  return;
 }
 $1 = $call1 + 20 | 0; //@line 6691
 $sub = +HEAPF32[$1 >> 2] - +HEAPF32[$screenWidth >> 2] * .5; //@line 6695
 $4 = $call1 + 24 | 0; //@line 6697
 $sub7 = +HEAPF32[$4 >> 2] - +HEAPF32[$screenHeight >> 2] * .5; //@line 6701
 $8 = HEAP32[$call1 + 12 >> 2] | 0; //@line 6704
 if (($8 | 0) == 1) {
  label = 484; //@line 6706
 } else if (!(($8 | 0) == 2 | ($8 | 0) == 4)) {
  STACKTOP = sp; //@line 6708
  return;
 }
 do {
  if ((label | 0) == 484) {
   if ((HEAP32[656] | 0) == 0) {
    break;
   }
   if ((HEAP32[$call1 + 16 >> 2] | 0) != 1) {
    break;
   }
   $conv2_i = +Math_sqrt(+($sub * $sub + $sub7 * $sub7)); //@line 6728
   if ($conv2_i <= 30.0) {
    break;
   }
   $div_i = 1.0 / $conv2_i; //@line 6734
   $call27 = +Math_atan2(+(-0.0 - $sub7 * $div_i), +(-0.0 - $sub * $div_i)); //@line 6741
   $conv31 = $call27 + +HEAPF32[(_AQRenderer_camera() | 0) + 44 >> 2]; //@line 6747
   _SLLeaper_applyDirection(HEAP32[656] | 0, $conv31); //@line 6749
  }
 } while (0);
 $14 = HEAP32[776] | 0; //@line 6753
 do {
  if (($14 | 0) != 0) {
   if ((HEAP32[$call1 + 16 >> 2] | 0) != 3) {
    if (+Math_sqrt(+($sub * $sub + $sub7 * $sub7)) >= 30.0) {
     break;
    }
   }
   _SLCameraController_inputPress($14); //@line 6773
  }
 } while (0);
 if ((HEAP32[656] | 0) == 0) {
  STACKTOP = sp; //@line 6781
  return;
 }
 if ((HEAP32[$call1 + 16 >> 2] | 0) != 1) {
  STACKTOP = sp; //@line 6788
  return;
 }
 if (+Math_sqrt(+($sub * $sub + $sub7 * $sub7)) <= 30.0) {
  STACKTOP = sp; //@line 6797
  return;
 }
 $sub60 = +HEAPF32[$1 >> 2] - +HEAPF32[$screenWidth >> 2] * .5; //@line 6802
 $sub64 = +HEAPF32[$4 >> 2] - +HEAPF32[$screenHeight >> 2] * .5; //@line 6806
 $div_i30 = 1.0 / +Math_sqrt(+($sub60 * $sub60 + $sub64 * $sub64)); //@line 6811
 $call72 = +Math_atan2(+(-0.0 - $div_i30 * $sub64), +(-0.0 - $sub60 * $div_i30)); //@line 6818
 $conv77 = $call72 + +HEAPF32[(_AQRenderer_camera() | 0) + 44 >> 2]; //@line 6824
 _SLLeaper_applyDirection(HEAP32[656] | 0, $conv77); //@line 6826
 STACKTOP = sp; //@line 6828
 return;
}
function __AQWorld_integrateIterator($item, $ctx) {
 $item = $item | 0;
 $ctx = $ctx | 0;
 var $newAabb = 0, $0 = 0, $position = 0, $x = 0, $3 = 0, $world = 0, $10 = 0, $13 = 0, $14 = 0, $oldPosition = 0, $sub_i = 0.0, $sub3_i = 0.0, $oldAabb = 0, $21 = 0, $22 = 0, $23$1 = 0, $24 = 0, sp = 0;
 sp = STACKTOP; //@line 11926
 STACKTOP = STACKTOP + 16 | 0; //@line 11926
 $newAabb = sp | 0; //@line 11927
 $0 = $item; //@line 11928
 $position = $item + 12 | 0; //@line 11929
 $x = $position; //@line 11930
 if (((HEAPF32[tempDoublePtr >> 2] = +HEAPF32[$x >> 2], HEAP32[tempDoublePtr >> 2] | 0) & 2147483647) >>> 0 > 2139095040) {
  ___assert_fail(1528, 1504, 42, 1696); //@line 11937
 }
 $3 = $item + 16 | 0; //@line 11941
 if (((HEAPF32[tempDoublePtr >> 2] = +HEAPF32[$3 >> 2], HEAP32[tempDoublePtr >> 2] | 0) & 2147483647) >>> 0 > 2139095040) {
  ___assert_fail(1528, 1504, 42, 1696); //@line 11948
 }
 if ((HEAP8[$0 + 98 | 0] | 0) == 0) {
  _AQParticle_integrate($0, +HEAPF32[$ctx + 4 >> 2]); //@line 11959
  _AQParticle_testPrep($0); //@line 11960
  _AQParticle_aabb($newAabb, $0); //@line 11961
  $13 = $item + 64 | 0; //@line 11963
  $14 = $newAabb; //@line 11964
  HEAP32[$13 >> 2] = HEAP32[$14 >> 2]; //@line 11965
  HEAP32[$13 + 4 >> 2] = HEAP32[$14 + 4 >> 2]; //@line 11965
  HEAP32[$13 + 8 >> 2] = HEAP32[$14 + 8 >> 2]; //@line 11965
  HEAP32[$13 + 12 >> 2] = HEAP32[$14 + 12 >> 2]; //@line 11965
  $oldPosition = $item + 40 | 0; //@line 11966
  $sub_i = +HEAPF32[$x >> 2] - +HEAPF32[$oldPosition >> 2]; //@line 11974
  $sub3_i = +HEAPF32[$3 >> 2] - +HEAPF32[$oldPosition + 4 >> 2]; //@line 11975
  if ($sub_i * $sub_i + $sub3_i * $sub3_i <= +HEAPF32[$item + 20 >> 2] / 10.0) {
   STACKTOP = sp; //@line 11986
   return;
  }
  $oldAabb = $item + 80 | 0; //@line 11992
  _AQDdvt_updateParticle(HEAP32[(HEAP32[$ctx >> 2] | 0) + 28 >> 2] | 0, $0, $oldAabb, $newAabb); //@line 11994
  $21 = $position; //@line 11995
  $22 = $oldPosition; //@line 11996
  $23$1 = HEAP32[$21 + 4 >> 2] | 0; //@line 12000
  HEAP32[$22 >> 2] = HEAP32[$21 >> 2]; //@line 12002
  HEAP32[$22 + 4 >> 2] = $23$1; //@line 12004
  $24 = $oldAabb; //@line 12005
  HEAP32[$24 >> 2] = HEAP32[$14 >> 2]; //@line 12006
  HEAP32[$24 + 4 >> 2] = HEAP32[$14 + 4 >> 2]; //@line 12006
  HEAP32[$24 + 8 >> 2] = HEAP32[$14 + 8 >> 2]; //@line 12006
  HEAP32[$24 + 12 >> 2] = HEAP32[$14 + 12 >> 2]; //@line 12006
  STACKTOP = sp; //@line 12008
  return;
 } else {
  $world = $ctx; //@line 12010
  if ((_AQList_length(HEAP32[(HEAP32[$world >> 2] | 0) + 44 >> 2] | 0) | 0) >>> 0 >= 128) {
   STACKTOP = sp; //@line 12018
   return;
  }
  $10 = HEAP32[(HEAP32[$world >> 2] | 0) + 44 >> 2] | 0; //@line 12022
  _AQList_push($10, $item) | 0; //@line 12023
  STACKTOP = sp; //@line 12025
  return;
 }
}
function __SLLeaper_angleOutward($position, $a, $b) {
 $position = $position | 0;
 $a = $a | 0;
 $b = $b | 0;
 var $position_016_val = 0.0, $position_117_val = 0.0, $sub_i = 0.0, $sub3_i = 0.0, $div_i22 = 0.0, $call3 = 0.0, $sub_i27 = 0.0, $sub3_i28 = 0.0, $div_i = 0.0, $call13 = 0.0, $cmp = 0, $thetaB_0 = 0.0, $thetaA_0 = 0.0, $thetaA_1 = 0.0, $add24 = 0.0, $div = 0.0, $call25 = 0.0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 3501
 tempParam = $position; //@line 3502
 $position = STACKTOP; //@line 3502
 STACKTOP = STACKTOP + 8 | 0; //@line 3502
 HEAP32[$position >> 2] = HEAP32[tempParam >> 2]; //@line 3502
 HEAP32[$position + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 3502
 tempParam = $a; //@line 3503
 $a = STACKTOP; //@line 3503
 STACKTOP = STACKTOP + 8 | 0; //@line 3503
 HEAP32[$a >> 2] = HEAP32[tempParam >> 2]; //@line 3503
 HEAP32[$a + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 3503
 tempParam = $b; //@line 3504
 $b = STACKTOP; //@line 3504
 STACKTOP = STACKTOP + 8 | 0; //@line 3504
 HEAP32[$b >> 2] = HEAP32[tempParam >> 2]; //@line 3504
 HEAP32[$b + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 3504
 $position_016_val = +HEAPF32[$position >> 2]; //@line 3510
 $position_117_val = +HEAPF32[$position + 4 >> 2]; //@line 3512
 $sub_i = +HEAPF32[$a >> 2] - $position_016_val; //@line 3513
 $sub3_i = +HEAPF32[$a + 4 >> 2] - $position_117_val; //@line 3514
 $div_i22 = 1.0 / +Math_sqrt(+($sub_i * $sub_i + $sub3_i * $sub3_i)); //@line 3519
 $call3 = +_fmod(+(+Math_atan2(+($sub3_i * $div_i22), +($sub_i * $div_i22)) + 6.283185307179586), 6.283185307179586); //@line 3526
 $sub_i27 = +HEAPF32[$b >> 2] - $position_016_val; //@line 3531
 $sub3_i28 = +HEAPF32[$b + 4 >> 2] - $position_117_val; //@line 3532
 $div_i = 1.0 / +Math_sqrt(+($sub_i27 * $sub_i27 + $sub3_i28 * $sub3_i28)); //@line 3537
 $call13 = +_fmod(+(+Math_atan2(+($sub3_i28 * $div_i), +($sub_i27 * $div_i)) + 6.283185307179586), 6.283185307179586); //@line 3544
 $cmp = $call13 < $call3; //@line 3545
 $thetaB_0 = $cmp ? $call3 : $call13; //@line 3546
 $thetaA_0 = $cmp ? $call13 : $call3; //@line 3547
 if (!($thetaB_0 > 3.141592653589793 & $thetaA_0 < $thetaB_0 + -3.141592653589793)) {
  $thetaA_1 = $thetaA_0; //@line 3554
  $add24 = $thetaB_0 + $thetaA_1; //@line 3556
  $div = $add24 * .5; //@line 3557
  $call25 = +_fmod(+$div, 6.283185307179586); //@line 3558
  STACKTOP = sp; //@line 3559
  return +$call25;
 }
 $thetaA_1 = $thetaA_0 + 6.283185307179586; //@line 3563
 $add24 = $thetaB_0 + $thetaA_1; //@line 3565
 $div = $add24 * .5; //@line 3566
 $call25 = +_fmod(+$div, 6.283185307179586); //@line 3567
 STACKTOP = sp; //@line 3568
 return +$call25;
}
function __SLLeaper_showAsteroid($self, $asteroid) {
 $self = $self | 0;
 $asteroid = $asteroid | 0;
 var $isVisible = 0, $visited = 0, $inc = 0, $3 = 0, $4 = 0, $resource = 0, $7 = 0, $div = 0.0, $conv20 = 0, $conv28 = 0, $conv37 = 0, $12 = 0, $14 = 0, $15 = 0, $16$1 = 0;
 $isVisible = $asteroid + 36 | 0; //@line 4618
 L417 : do {
  if ((HEAP32[$isVisible >> 2] | 0) == 0) {
   if ((HEAP32[$asteroid + 48 >> 2] | 0) != 0) {
    break;
   }
   $visited = $self + 80 | 0; //@line 4631
   $inc = (HEAP32[$visited >> 2] | 0) + 1 | 0; //@line 4633
   HEAP32[$visited >> 2] = $inc; //@line 4634
   $3 = HEAP32[$self + 72 >> 2] | 0; //@line 4636
   if (($3 | 0) == 0) {
    $4 = $inc; //@line 4640
   } else {
    FUNCTION_TABLE_vi[$3 & 31]($inc); //@line 4642
    $4 = HEAP32[$visited >> 2] | 0; //@line 4645
   }
   do {
    if (($4 | 0) != 3) {
     if (($4 | 0) > 3) {
      if ((_rand() | 0) < 1073741823) {
       break;
      }
     }
     $div = +(_rand() | 0) * 4.656612873077393e-10; //@line 4664
     $conv20 = HEAPU8[128] | 0; //@line 4666
     $conv28 = HEAPU8[129] | 0; //@line 4675
     $conv37 = HEAPU8[130] | 0; //@line 4684
     $12 = HEAP8[131] | 0; //@line 4692
     HEAP8[$asteroid + 44 | 0] = ~~(+($conv20 >>> 1 | 0) + $div * +($conv20 | 0) * .5); //@line 4694
     HEAP8[$asteroid + 45 | 0] = ~~(+($conv28 >>> 1 | 0) + $div * +($conv28 | 0) * .5); //@line 4696
     HEAP8[$asteroid + 46 | 0] = ~~(+($conv37 >>> 1 | 0) + $div * +($conv37 | 0) * .5); //@line 4698
     HEAP8[$asteroid + 47 | 0] = $12; //@line 4700
     break L417;
    }
   } while (0);
   $resource = $asteroid + 40 | 0; //@line 4707
   HEAP32[$resource >> 2] = ((_rand() | 0) % 64 | 0) + 64; //@line 4708
   if ((HEAP32[$visited >> 2] | 0) == 3) {
    HEAP32[$resource >> 2] = 128; //@line 4713
   }
   $7 = $asteroid + 44 | 0; //@line 4717
   tempBigInt = HEAP32[30] | 0; //@line 4719
   HEAP8[$7] = tempBigInt & 255; //@line 4719
   tempBigInt = tempBigInt >> 8; //@line 4719
   HEAP8[$7 + 1 | 0] = tempBigInt & 255; //@line 4719
   tempBigInt = tempBigInt >> 8; //@line 4719
   HEAP8[$7 + 2 | 0] = tempBigInt & 255; //@line 4719
   tempBigInt = tempBigInt >> 8; //@line 4719
   HEAP8[$7 + 3 | 0] = tempBigInt & 255; //@line 4719
  }
 } while (0);
 HEAP32[$isVisible >> 2] = 1; //@line 4723
 $14 = (HEAP32[$self + 64 >> 2] | 0) + 12 | 0; //@line 4728
 $15 = $asteroid + 12 | 0; //@line 4729
 $16$1 = HEAP32[$14 + 4 >> 2] | 0; //@line 4733
 HEAP32[$15 >> 2] = HEAP32[$14 >> 2]; //@line 4735
 HEAP32[$15 + 4 >> 2] = $16$1; //@line 4737
 return;
}
function _AQList_removeAt($_self, $index) {
 $_self = $_self | 0;
 $index = $index | 0;
 var $head = 0, $node_030 = 0, $length = 0, $1 = 0, $2 = 0, $tobool34 = 0, $node_037 = 0, $i_036 = 0, $inc = 0, $node_0 = 0, $tobool = 0, $tobool_lcssa = 0, $node_0_lcssa = 0, $tail = 0, $prev15 = 0, $7 = 0, $next22_pre = 0, $9 = 0, $item = 0, $13 = 0, $retval_0 = 0;
 if (($index | 0) == -1) {
  $retval_0 = 0; //@line 13331
  return $retval_0 | 0; //@line 13333
 }
 $head = $_self + 16 | 0; //@line 13335
 $node_030 = HEAP32[$head >> 2] | 0; //@line 13337
 $length = $_self + 12 | 0; //@line 13338
 $1 = $length; //@line 13339
 $2 = HEAP32[$1 >> 2] | 0; //@line 13340
 $tobool34 = ($node_030 | 0) == 0; //@line 13344
 if (($index | 0) < 1 | ($2 | 0) < 1 | $tobool34) {
  $node_0_lcssa = $node_030; //@line 13348
  $tobool_lcssa = $tobool34; //@line 13348
 } else {
  $i_036 = 0; //@line 13350
  $node_037 = $node_030; //@line 13350
  while (1) {
   $inc = $i_036 + 1 | 0; //@line 13355
   $node_0 = HEAP32[$node_037 >> 2] | 0; //@line 13356
   $tobool = ($node_0 | 0) == 0; //@line 13360
   if (($inc | 0) >= ($index | 0) | ($inc | 0) >= ($2 | 0) | $tobool) {
    $node_0_lcssa = $node_0; //@line 13364
    $tobool_lcssa = $tobool; //@line 13364
    break;
   } else {
    $i_036 = $inc; //@line 13367
    $node_037 = $node_0; //@line 13367
   }
  }
 }
 if ($tobool_lcssa) {
  $retval_0 = 0; //@line 13375
  return $retval_0 | 0; //@line 13377
 }
 $tail = $_self + 20 | 0; //@line 13379
 if ((HEAP32[$tail >> 2] | 0) == ($node_0_lcssa | 0)) {
  HEAP32[$tail >> 2] = HEAP32[$node_0_lcssa + 4 >> 2]; //@line 13388
 }
 if (($node_030 | 0) == ($node_0_lcssa | 0)) {
  HEAP32[$head >> 2] = HEAP32[$node_030 >> 2]; //@line 13397
 }
 $prev15 = $node_0_lcssa + 4 | 0; //@line 13400
 $7 = HEAP32[$prev15 >> 2] | 0; //@line 13401
 $next22_pre = $node_0_lcssa | 0; //@line 13403
 if (($7 | 0) != 0) {
  HEAP32[$7 >> 2] = HEAP32[$next22_pre >> 2]; //@line 13408
 }
 $9 = HEAP32[$next22_pre >> 2] | 0; //@line 13411
 if (($9 | 0) != 0) {
  HEAP32[$9 + 4 >> 2] = HEAP32[$prev15 >> 2]; //@line 13417
 }
 HEAP32[$prev15 >> 2] = 0; //@line 13420
 HEAP32[$next22_pre >> 2] = 0; //@line 13421
 $item = $node_0_lcssa + 8 | 0; //@line 13422
 $13 = _aqautorelease(HEAP32[$item >> 2] | 0) | 0; //@line 13426
 HEAP32[$item >> 2] = 0; //@line 13427
 _free(_aqlistnode_done($node_0_lcssa) | 0); //@line 13430
 HEAP32[$length >> 2] = (HEAP32[$1 >> 2] | 0) - 1; //@line 13435
 $retval_0 = $13; //@line 13437
 return $retval_0 | 0; //@line 13439
}
function _AQParticle_doesIgnore($self, $other) {
 $self = $self | 0;
 $other = $other | 0;
 var $0 = 0, $itr_06_i = 0, $4 = 0, $5 = 0, $itr_06_i34 = 0, $9 = 0, $itr_06_i22 = 0, $13 = 0, $14 = 0, $itr_06_i10 = 0, $17 = 0, $18 = 0, label = 0;
 $0 = HEAP32[$self + 120 >> 2] | 0; //@line 11213
 L1331 : do {
  if (!(($0 | 0) == 0 | ($other | 0) == 0)) {
   $itr_06_i = $0; //@line 11222
   while (1) {
    if ((HEAP32[$itr_06_i >> 2] | 0) == ($other | 0)) {
     $18 = 1; //@line 11230
     break;
    }
    $itr_06_i = HEAP32[$itr_06_i + 4 >> 2] | 0; //@line 11234
    if (($itr_06_i | 0) == 0) {
     break L1331;
    }
   }
   return $18 | 0; //@line 11244
  }
 } while (0);
 $4 = HEAP32[$other + 116 >> 2] | 0; //@line 11249
 $5 = HEAP32[$self + 124 >> 2] | 0; //@line 11250
 L1338 : do {
  if (!(($5 | 0) == 0 | ($4 | 0) == 0)) {
   $itr_06_i34 = $5; //@line 11259
   while (1) {
    if ((HEAP32[$itr_06_i34 >> 2] | 0) == ($4 | 0)) {
     $18 = 1; //@line 11267
     break;
    }
    $itr_06_i34 = HEAP32[$itr_06_i34 + 4 >> 2] | 0; //@line 11271
    if (($itr_06_i34 | 0) == 0) {
     break L1338;
    }
   }
   return $18 | 0; //@line 11281
  }
 } while (0);
 $9 = HEAP32[$other + 120 >> 2] | 0; //@line 11285
 L1345 : do {
  if (!(($9 | 0) == 0 | ($self | 0) == 0)) {
   $itr_06_i22 = $9; //@line 11294
   while (1) {
    if ((HEAP32[$itr_06_i22 >> 2] | 0) == ($self | 0)) {
     $18 = 1; //@line 11302
     break;
    }
    $itr_06_i22 = HEAP32[$itr_06_i22 + 4 >> 2] | 0; //@line 11306
    if (($itr_06_i22 | 0) == 0) {
     break L1345;
    }
   }
   return $18 | 0; //@line 11316
  }
 } while (0);
 $13 = HEAP32[$self + 116 >> 2] | 0; //@line 11321
 $14 = HEAP32[$other + 124 >> 2] | 0; //@line 11322
 if (($14 | 0) == 0 | ($13 | 0) == 0) {
  $18 = 0; //@line 11328
  return $18 | 0; //@line 11330
 }
 $itr_06_i10 = $14; //@line 11334
 while (1) {
  if ((HEAP32[$itr_06_i10 >> 2] | 0) == ($13 | 0)) {
   $18 = 1; //@line 11342
   label = 1064; //@line 11343
   break;
  }
  $17 = HEAP32[$itr_06_i10 + 4 >> 2] | 0; //@line 11347
  if (($17 | 0) == 0) {
   $18 = 0; //@line 11351
   label = 1066; //@line 11352
   break;
  } else {
   $itr_06_i10 = $17; //@line 11355
  }
 }
 if ((label | 0) == 1066) {
  return $18 | 0; //@line 11360
 } else if ((label | 0) == 1064) {
  return $18 | 0; //@line 11364
 }
 return 0; //@line 11366
}
function _aqcollision_pop($col) {
 $col = $col | 0;
 var $col_tr = 0, $call_i = 0, $0 = 0, $col_addr_05_i_i = 0, $a_i_i = 0, $3 = 0, $next = 0, $5 = 0, $call_i6 = 0, $6 = 0, $col_addr_05_i_i9 = 0, $a_i_i10 = 0, $retval_0 = 0, label = 0;
 $col_tr = $col; //@line 7771
 while (1) {
  if (($col_tr | 0) == 0) {
   label = 616; //@line 7777
   break;
  }
  if ((HEAP32[$col_tr >> 2] | 0) == 0) {
   $retval_0 = $col_tr; //@line 7785
   label = 628; //@line 7786
   break;
  }
  $next = $col_tr + 20 | 0; //@line 7789
  $5 = HEAP32[$next >> 2] | 0; //@line 7790
  if (($5 | 0) == 0) {
   label = 621; //@line 7794
   break;
  } else {
   $col_tr = $5; //@line 7797
  }
 }
 if ((label | 0) == 616) {
  $call_i = _malloc(24) | 0; //@line 7801
  $0 = $call_i; //@line 7802
  HEAP32[$call_i + 20 >> 2] = 0; //@line 7805
  if (($call_i | 0) == 0) {
   $retval_0 = $0; //@line 7809
   return $retval_0 | 0; //@line 7811
  } else {
   $col_addr_05_i_i = $0; //@line 7813
  }
  while (1) {
   $a_i_i = $col_addr_05_i_i | 0; //@line 7817
   if ((HEAP32[$a_i_i >> 2] | 0) == 0) {
    $retval_0 = $0; //@line 7821
    label = 627; //@line 7822
    break;
   }
   HEAP32[$a_i_i >> 2] = 0; //@line 7825
   $3 = HEAP32[$col_addr_05_i_i + 20 >> 2] | 0; //@line 7827
   if (($3 | 0) == 0) {
    $retval_0 = $0; //@line 7831
    label = 630; //@line 7832
    break;
   } else {
    $col_addr_05_i_i = $3; //@line 7835
   }
  }
  if ((label | 0) == 630) {
   return $retval_0 | 0; //@line 7840
  } else if ((label | 0) == 627) {
   return $retval_0 | 0; //@line 7844
  }
 } else if ((label | 0) == 621) {
  $call_i6 = _malloc(24) | 0; //@line 7848
  $6 = $call_i6; //@line 7849
  HEAP32[$call_i6 + 20 >> 2] = 0; //@line 7852
  L787 : do {
   if (($call_i6 | 0) != 0) {
    $col_addr_05_i_i9 = $6; //@line 7857
    do {
     $a_i_i10 = $col_addr_05_i_i9 | 0; //@line 7860
     if ((HEAP32[$a_i_i10 >> 2] | 0) == 0) {
      break L787;
     }
     HEAP32[$a_i_i10 >> 2] = 0; //@line 7866
     $col_addr_05_i_i9 = HEAP32[$col_addr_05_i_i9 + 20 >> 2] | 0; //@line 7868
    } while (($col_addr_05_i_i9 | 0) != 0);
   }
  } while (0);
  HEAP32[$next >> 2] = $6; //@line 7879
  $retval_0 = $6; //@line 7881
  return $retval_0 | 0; //@line 7883
 } else if ((label | 0) == 628) {
  return $retval_0 | 0; //@line 7887
 }
 return 0; //@line 7889
}
function _AQParticle_integrate($self, $dt) {
 $self = $self | 0;
 $dt = +$dt;
 var $sleepCounter = 0, $inc = 0, $isSleeping5 = 0, $3 = 0, $4$0 = 0, $4$1 = 0, $bitcast = 0.0, $lastPosition = 0, $mul = 0.0, $acceleration_0 = 0, $acceleration_1 = 0, $add_i = 0.0, $add3_i = 0.0, $tmp_sroa_0_0_insert_insert$1 = 0.0, $7 = 0, $sub_i = 0.0, $sub3_i = 0.0, $sleepCounter25 = 0, $inc26 = 0;
 if ((HEAP8[$self + 96 | 0] | 0) != 0) {
  $sleepCounter = $self + 99 | 0; //@line 10682
  $inc = (HEAP8[$sleepCounter] | 0) + 1 & 255; //@line 10684
  HEAP8[$sleepCounter] = $inc; //@line 10685
  if (($inc & 255) <= 20) {
   return;
  }
  HEAP8[$self + 98 | 0] = 1; //@line 10692
  return;
 }
 $isSleeping5 = $self + 98 | 0; //@line 10696
 if ((HEAP8[$isSleeping5] | 0) != 0) {
  return;
 }
 $3 = $self + 12 | 0; //@line 10704
 $4$0 = HEAP32[$3 >> 2] | 0; //@line 10706
 $4$1 = HEAP32[$3 + 4 >> 2] | 0; //@line 10708
 $bitcast = (HEAP32[tempDoublePtr >> 2] = $4$0, +HEAPF32[tempDoublePtr >> 2]); //@line 10711
 $lastPosition = $self + 48 | 0; //@line 10716
 $mul = $dt * $dt; //@line 10723
 $acceleration_0 = $self + 56 | 0; //@line 10724
 $acceleration_1 = $self + 60 | 0; //@line 10726
 $add_i = $bitcast * 2.0 - +HEAPF32[$lastPosition >> 2] + $mul * +HEAPF32[$acceleration_0 >> 2]; //@line 10730
 $add3_i = +HEAPF32[$self + 16 >> 2] * 2.0 - +HEAPF32[$self + 52 >> 2] + $mul * +HEAPF32[$acceleration_1 >> 2]; //@line 10731
 $tmp_sroa_0_0_insert_insert$1 = +$add3_i; //@line 10741
 HEAPF32[$3 >> 2] = $add_i; //@line 10743
 HEAPF32[$3 + 4 >> 2] = $tmp_sroa_0_0_insert_insert$1; //@line 10745
 $7 = $lastPosition; //@line 10746
 HEAP32[$7 >> 2] = $4$0; //@line 10748
 HEAP32[$7 + 4 >> 2] = $4$1; //@line 10750
 HEAPF32[$acceleration_0 >> 2] = 0.0; //@line 10751
 HEAPF32[$acceleration_1 >> 2] = 0.0; //@line 10752
 $sub_i = $add_i - $bitcast; //@line 10758
 $sub3_i = $add3_i - (HEAP32[tempDoublePtr >> 2] = $4$1, +HEAPF32[tempDoublePtr >> 2]); //@line 10759
 if (+Math_abs(+($sub_i * $sub_i + $sub3_i * $sub3_i)) >= .01) {
  return;
 }
 $sleepCounter25 = $self + 99 | 0; //@line 10770
 $inc26 = (HEAP8[$sleepCounter25] | 0) + 1 & 255; //@line 10772
 HEAP8[$sleepCounter25] = $inc26; //@line 10773
 if (($inc26 & 255) <= 20) {
  return;
 }
 HEAP8[$isSleeping5] = 1; //@line 10779
 return;
}
function __AQDdvt_removeParticle($self, $particle, $aabb) {
 $self = $self | 0;
 $particle = $particle | 0;
 $aabb = $aabb | 0;
 var $tl = 0, $length1_i_i = 0, $1 = 0, $index_0_i_i = 0, $arrayidx_i_i = 0, $length = 0, $8 = 0, $tr_i = 0, $bl_i = 0, $br_i = 0, $13 = 0, $15 = 0, $17 = 0, $19 = 0, label = 0;
 $tl = $self + 32 | 0; //@line 8835
 if ((HEAP32[$tl >> 2] | 0) != 0) {
  __AQDdvt_removeParticleChild($self, $particle, $aabb) | 0; //@line 8840
  $length = $self + 240 | 0; //@line 8841
  if ((HEAP32[$length >> 2] | 0) != 24) {
   return;
  }
  HEAP32[$length >> 2] = 0; //@line 8848
  $8 = $self; //@line 8850
  _AQDdvt_iterate(HEAP32[$tl >> 2] | 0, 31, $8); //@line 8851
  $tr_i = $self + 36 | 0; //@line 8852
  _AQDdvt_iterate(HEAP32[$tr_i >> 2] | 0, 31, $8); //@line 8854
  $bl_i = $self + 40 | 0; //@line 8855
  _AQDdvt_iterate(HEAP32[$bl_i >> 2] | 0, 31, $8); //@line 8857
  $br_i = $self + 44 | 0; //@line 8858
  _AQDdvt_iterate(HEAP32[$br_i >> 2] | 0, 31, $8); //@line 8860
  $13 = HEAP32[$tl >> 2] | 0; //@line 8862
  _aqrelease($13) | 0; //@line 8863
  HEAP32[$tl >> 2] = 0; //@line 8864
  $15 = HEAP32[$tr_i >> 2] | 0; //@line 8866
  _aqrelease($15) | 0; //@line 8867
  HEAP32[$tr_i >> 2] = 0; //@line 8868
  $17 = HEAP32[$bl_i >> 2] | 0; //@line 8870
  _aqrelease($17) | 0; //@line 8871
  HEAP32[$bl_i >> 2] = 0; //@line 8872
  $19 = HEAP32[$br_i >> 2] | 0; //@line 8874
  _aqrelease($19) | 0; //@line 8875
  HEAP32[$br_i >> 2] = 0; //@line 8876
  return;
 }
 $length1_i_i = $self + 240 | 0; //@line 8880
 $1 = HEAP32[$length1_i_i >> 2] | 0; //@line 8881
 $index_0_i_i = 0; //@line 8883
 while (1) {
  if (($index_0_i_i | 0) >= ($1 | 0)) {
   label = 768; //@line 8889
   break;
  }
  $arrayidx_i_i = $self + 48 + ($index_0_i_i << 2) | 0; //@line 8892
  if ((HEAP32[$arrayidx_i_i >> 2] | 0) == ($particle | 0)) {
   break;
  } else {
   $index_0_i_i = $index_0_i_i + 1 | 0; //@line 8900
  }
 }
 if ((label | 0) == 768) {
  return;
 }
 if (($index_0_i_i | 0) == -1) {
  return;
 }
 HEAP32[$arrayidx_i_i >> 2] = HEAP32[$self + 48 + ($1 - 1 << 2) >> 2]; //@line 8914
 HEAP32[$length1_i_i >> 2] = (HEAP32[$length1_i_i >> 2] | 0) - 1; //@line 8917
 _aqautorelease($particle) | 0; //@line 8919
 return;
}
function __AQWorld_boxTestIterator($a, $b, $ctx) {
 $a = $a | 0;
 $b = $b | 0;
 $ctx = $ctx | 0;
 var $isSleeping = 0, $10 = 0, $14 = 0, $call_i17 = 0, $17 = 0, $19 = 0, $call3_i20 = 0, $24 = 0, $call_i = 0, $27 = 0, $29 = 0, $call3_i = 0;
 $isSleeping = $a + 98 | 0; //@line 12039
 do {
  if ((HEAP8[$isSleeping] | 0) != 0) {
   if ((HEAP8[$b + 98 | 0] | 0) == 0) {
    break;
   }
   return;
  }
 } while (0);
 if (+HEAPF32[$a + 76 >> 2] >= +HEAPF32[$b + 68 >> 2]) {
  return;
 }
 if (+HEAPF32[$a + 68 >> 2] <= +HEAPF32[$b + 76 >> 2]) {
  return;
 }
 if (+HEAPF32[$a + 72 >> 2] >= +HEAPF32[$b + 64 >> 2]) {
  return;
 }
 if (+HEAPF32[$a + 64 >> 2] <= +HEAPF32[$b + 72 >> 2]) {
  return;
 }
 $10 = $ctx + 52 | 0; //@line 12092
 if ((_AQParticle_test($a, $b, HEAP32[$10 >> 2] | 0) | 0) == 0) {
  return;
 }
 HEAP32[$10 >> 2] = _aqcollision_pop(HEAP32[$10 >> 2] | 0) | 0; //@line 12102
 if ((HEAP8[$isSleeping] | 0) == 0) {
  HEAP8[$a + 99 | 0] = 0; //@line 12108
 } else {
  $14 = $ctx + 32 | 0; //@line 12111
  $call_i17 = _AQList_indexOf(HEAP32[$14 >> 2] | 0, $a | 0) | 0; //@line 12114
  $17 = $ctx + 40 | 0; //@line 12116
  if (($call_i17 | 0) > (HEAP32[$17 >> 2] | 0)) {
   $19 = HEAP32[$14 >> 2] | 0; //@line 12121
   $call3_i20 = _AQList_removeAt($19, $call_i17) | 0; //@line 12122
   _AQList_unshift($19, $call3_i20) | 0; //@line 12123
   HEAP32[$17 >> 2] = (HEAP32[$17 >> 2] | 0) + 1; //@line 12126
  }
  _AQDdvt_wakeParticle(HEAP32[$ctx + 28 >> 2] | 0, $a); //@line 12132
  _AQParticle_wake($a); //@line 12133
 }
 if ((HEAP8[$b + 98 | 0] | 0) == 0) {
  HEAP8[$b + 99 | 0] = 0; //@line 12142
  return;
 }
 $24 = $ctx + 32 | 0; //@line 12146
 $call_i = _AQList_indexOf(HEAP32[$24 >> 2] | 0, $b | 0) | 0; //@line 12149
 $27 = $ctx + 40 | 0; //@line 12151
 if (($call_i | 0) > (HEAP32[$27 >> 2] | 0)) {
  $29 = HEAP32[$24 >> 2] | 0; //@line 12156
  $call3_i = _AQList_removeAt($29, $call_i) | 0; //@line 12157
  _AQList_unshift($29, $call3_i) | 0; //@line 12158
  HEAP32[$27 >> 2] = (HEAP32[$27 >> 2] | 0) + 1; //@line 12161
 }
 _AQDdvt_wakeParticle(HEAP32[$ctx + 28 >> 2] | 0, $b); //@line 12167
 _AQParticle_wake($b); //@line 12168
 return;
}
function _AQList_unshift($_self, $obj) {
 $_self = $_self | 0;
 $obj = $obj | 0;
 var $head_i = 0, $0 = 0, $insertPt_027_i = 0, $call_i = 0, $1 = 0, $next_i_i = 0, $2 = 0, $3 = 0, $prev_i = 0, $7 = 0, $tail_i = 0, $8 = 0, $length_i = 0, $11 = 0, $12 = 0, $inc_i = 0, $13 = 0, $inc_c_i = 0;
 $head_i = $_self + 16 | 0; //@line 13175
 $0 = $head_i; //@line 13176
 $insertPt_027_i = HEAP32[$0 >> 2] | 0; //@line 13177
 $call_i = _malloc(12) | 0; //@line 13179
 $1 = $call_i; //@line 13180
 $next_i_i = $call_i; //@line 13181
 HEAP32[$next_i_i >> 2] = 0; //@line 13182
 $2 = $call_i + 4 | 0; //@line 13184
 HEAP32[$2 >> 2] = 0; //@line 13185
 $3 = $call_i + 8 | 0; //@line 13187
 HEAP32[$3 >> 2] = 0; //@line 13188
 if (($obj | 0) != 0) {
  HEAP32[$3 >> 2] = _aqretain($obj) | 0; //@line 13195
 }
 HEAP32[$next_i_i >> 2] = $insertPt_027_i; //@line 13198
 if (($insertPt_027_i | 0) == 0) {
  $tail_i = $_self + 20 | 0; //@line 13201
  $8 = HEAP32[$tail_i >> 2] | 0; //@line 13202
  HEAP32[$2 >> 2] = $8; //@line 13204
  if (($8 | 0) != 0) {
   HEAP32[$8 >> 2] = $1; //@line 13209
  }
  HEAP32[$tail_i >> 2] = $call_i; //@line 13212
 } else {
  $prev_i = $insertPt_027_i + 4 | 0; //@line 13214
  HEAP32[$2 >> 2] = HEAP32[$prev_i >> 2]; //@line 13216
  $7 = HEAP32[$prev_i >> 2] | 0; //@line 13217
  if (($7 | 0) != 0) {
   HEAP32[$7 >> 2] = $1; //@line 13222
  }
  HEAP32[$prev_i >> 2] = $1; //@line 13225
 }
 if ((HEAP32[$0 >> 2] | 0) != ($insertPt_027_i | 0)) {
  $length_i = $_self + 12 | 0; //@line 13232
  $11 = $length_i; //@line 13233
  $12 = HEAP32[$11 >> 2] | 0; //@line 13234
  $inc_i = $12 + 1 | 0; //@line 13235
  $13 = $length_i | 0; //@line 13236
  $inc_c_i = $inc_i; //@line 13237
  HEAP32[$13 >> 2] = $inc_c_i; //@line 13238
  return $_self | 0; //@line 13239
 }
 HEAP32[$head_i >> 2] = $call_i; //@line 13242
 $length_i = $_self + 12 | 0; //@line 13244
 $11 = $length_i; //@line 13245
 $12 = HEAP32[$11 >> 2] | 0; //@line 13246
 $inc_i = $12 + 1 | 0; //@line 13247
 $13 = $length_i | 0; //@line 13248
 $inc_c_i = $inc_i; //@line 13249
 HEAP32[$13 >> 2] = $inc_c_i; //@line 13250
 return $_self | 0; //@line 13251
}
function _AQStick_update($self) {
 $self = $self | 0;
 var $0 = 0, $1 = 0, $position = 0, $position3 = 0, $position_0_val = 0.0, $position_1_val = 0.0, $position3_015 = 0, $position3_116 = 0, $sub_i = 0.0, $sub3_i = 0.0, $conv2_i_i = 0.0, $div_i = 0.0, $conv4 = 0.0, $mul_i37 = 0.0, $mul1_i38 = 0.0, $3 = 0.0, $mass6 = 0, $conv7 = 0.0, $conv12 = 0.0, $5 = 0, $tmp13_sroa_0_0_insert_insert$1 = 0.0, $conv21 = 0.0, $9 = 0, $tmp22_sroa_0_0_insert_insert$1 = 0.0;
 $0 = HEAP32[$self + 12 >> 2] | 0; //@line 11682
 $1 = HEAP32[$self + 16 >> 2] | 0; //@line 11684
 $position = $0 + 12 | 0; //@line 11685
 $position3 = $1 + 12 | 0; //@line 11686
 $position_0_val = +HEAPF32[$position >> 2]; //@line 11688
 $position_1_val = +HEAPF32[$0 + 16 >> 2]; //@line 11690
 $position3_015 = $position3 | 0; //@line 11691
 $position3_116 = $1 + 16 | 0; //@line 11693
 $sub_i = $position_0_val - +HEAPF32[$position3_015 >> 2]; //@line 11695
 $sub3_i = $position_1_val - +HEAPF32[$position3_116 >> 2]; //@line 11696
 $conv2_i_i = +Math_sqrt(+($sub_i * $sub_i + $sub3_i * $sub3_i)); //@line 11700
 $div_i = 1.0 / $conv2_i_i; //@line 11701
 $conv4 = +HEAPF64[$self + 24 >> 3] - $conv2_i_i; //@line 11708
 $mul_i37 = $sub_i * $div_i * $conv4; //@line 11709
 $mul1_i38 = $sub3_i * $div_i * $conv4; //@line 11710
 $3 = +HEAPF32[$0 + 28 >> 2]; //@line 11712
 $mass6 = $1 + 28 | 0; //@line 11713
 $conv7 = $3 + +HEAPF32[$mass6 >> 2]; //@line 11716
 $conv12 = $3 / $conv7 * .5; //@line 11720
 $5 = $position; //@line 11725
 $tmp13_sroa_0_0_insert_insert$1 = +($position_1_val + $mul1_i38 * $conv12); //@line 11735
 HEAPF32[$5 >> 2] = $position_0_val + $mul_i37 * $conv12; //@line 11737
 HEAPF32[$5 + 4 >> 2] = $tmp13_sroa_0_0_insert_insert$1; //@line 11739
 $conv21 = +HEAPF32[$mass6 >> 2] / $conv7 * .5; //@line 11744
 $9 = $position3; //@line 11751
 $tmp22_sroa_0_0_insert_insert$1 = +(+HEAPF32[$position3_116 >> 2] - $mul1_i38 * $conv21); //@line 11761
 HEAPF32[$9 >> 2] = +HEAPF32[$position3_015 >> 2] - $mul_i37 * $conv21; //@line 11763
 HEAPF32[$9 + 4 >> 2] = $tmp22_sroa_0_0_insert_insert$1; //@line 11765
 return;
}
function _AQArray_remove($self, $obj) {
 $self = $self | 0;
 $obj = $obj | 0;
 var $length_i = 0, $0 = 0, $items_i = 0, $i_0_i = 0, $inc_i = 0, $4 = 0, $5 = 0, $inc_i_i12 = 0, $inc_i_i14 = 0, $_pre_i = 0, $6 = 0, $7 = 0, $inc_i_i = 0, $retval_0 = 0, label = 0;
 $length_i = $self + 12 | 0; //@line 12817
 $0 = HEAP32[$length_i >> 2] | 0; //@line 12818
 $items_i = $self + 20 | 0; //@line 12819
 $i_0_i = 0; //@line 12821
 while (1) {
  if (($i_0_i | 0) >= ($0 | 0)) {
   $retval_0 = 0; //@line 12827
   label = 1236; //@line 12828
   break;
  }
  $inc_i = $i_0_i + 1 | 0; //@line 12835
  if ((HEAP32[(HEAP32[$items_i >> 2] | 0) + ($i_0_i << 2) >> 2] | 0) == ($obj | 0)) {
   break;
  } else {
   $i_0_i = $inc_i; //@line 12840
  }
 }
 if ((label | 0) == 1236) {
  return $retval_0 | 0; //@line 12845
 }
 if (($i_0_i | 0) == -1) {
  $retval_0 = 0; //@line 12850
  return $retval_0 | 0; //@line 12852
 }
 _aqautorelease($obj) | 0; //@line 12855
 HEAP32[$length_i >> 2] = $i_0_i; //@line 12856
 if (($inc_i | 0) >= ($0 | 0)) {
  $retval_0 = 1; //@line 12860
  return $retval_0 | 0; //@line 12862
 }
 $4 = HEAP32[$items_i >> 2] | 0; //@line 12864
 $5 = HEAP32[$4 + ($inc_i << 2) >> 2] | 0; //@line 12866
 HEAP32[$length_i >> 2] = $inc_i; //@line 12867
 HEAP32[$4 + ($i_0_i << 2) >> 2] = $5; //@line 12869
 $inc_i_i12 = $i_0_i + 2 | 0; //@line 12870
 if (($inc_i_i12 | 0) < ($0 | 0)) {
  $inc_i_i14 = $inc_i_i12; //@line 12874
 } else {
  $retval_0 = 1; //@line 12876
  return $retval_0 | 0; //@line 12878
 }
 while (1) {
  $_pre_i = HEAP32[$length_i >> 2] | 0; //@line 12882
  $6 = HEAP32[$items_i >> 2] | 0; //@line 12883
  $7 = HEAP32[$6 + ($inc_i_i14 << 2) >> 2] | 0; //@line 12885
  HEAP32[$length_i >> 2] = $_pre_i + 1; //@line 12887
  HEAP32[$6 + ($_pre_i << 2) >> 2] = $7; //@line 12889
  $inc_i_i = $inc_i_i14 + 1 | 0; //@line 12890
  if (($inc_i_i | 0) < ($0 | 0)) {
   $inc_i_i14 = $inc_i_i; //@line 12894
  } else {
   $retval_0 = 1; //@line 12896
   break;
  }
 }
 return $retval_0 | 0; //@line 12901
}
function _AQParticle_ignoreParticle($self, $ignore) {
 $self = $self | 0;
 $ignore = $ignore | 0;
 var $ignoreParticle = 0, $0 = 0, $last_0_i = 0, $1 = 0, $call_i_i = 0, $3 = 0, $call_i_i_i = 0, $5 = 0, $self_addr_0_i_i = 0, $next_i_i = 0, $6 = 0, $call_i6_i_i = 0, $8 = 0, $particle7_i_i = 0, label = 0;
 $ignoreParticle = $self + 120 | 0; //@line 11563
 $0 = HEAP32[$ignoreParticle >> 2] | 0; //@line 11564
 $last_0_i = $0; //@line 11567
 while (1) {
  if (($last_0_i | 0) == 0) {
   label = 1090; //@line 11573
   break;
  }
  $1 = HEAP32[$last_0_i + 4 >> 2] | 0; //@line 11577
  if (($1 | 0) == 0) {
   $self_addr_0_i_i = $last_0_i; //@line 11580
   break;
  } else {
   $last_0_i = $1; //@line 11583
  }
 }
 do {
  if ((label | 0) == 1090) {
   $call_i_i = _malloc(8) | 0; //@line 11588
   $3 = $call_i_i; //@line 11590
   HEAP32[$3 >> 2] = 0; //@line 11594
   HEAP32[$3 + 4 >> 2] = 0; //@line 11596
   if (($0 | 0) == 0) {
    HEAP32[$ignoreParticle >> 2] = $call_i_i; //@line 11600
   }
   if (($call_i_i | 0) != 0) {
    $self_addr_0_i_i = $call_i_i; //@line 11606
    break;
   }
   $call_i_i_i = _malloc(8) | 0; //@line 11609
   $5 = $call_i_i_i; //@line 11611
   HEAP32[$5 >> 2] = 0; //@line 11615
   HEAP32[$5 + 4 >> 2] = 0; //@line 11617
   $self_addr_0_i_i = $call_i_i_i; //@line 11619
  }
 } while (0);
 $next_i_i = $self_addr_0_i_i + 4 | 0; //@line 11623
 $6 = HEAP32[$next_i_i >> 2] | 0; //@line 11624
 if (($6 | 0) == 0) {
  $call_i6_i_i = _malloc(8) | 0; //@line 11628
  $8 = $call_i6_i_i; //@line 11630
  HEAP32[$8 >> 2] = 0; //@line 11634
  HEAP32[$8 + 4 >> 2] = 0; //@line 11636
  HEAP32[$next_i_i >> 2] = $call_i6_i_i; //@line 11637
  $particle7_i_i = $self_addr_0_i_i | 0; //@line 11639
  HEAP32[$particle7_i_i >> 2] = $ignore; //@line 11640
  return;
 } else {
  HEAP32[$6 >> 2] = 0; //@line 11644
  $particle7_i_i = $self_addr_0_i_i | 0; //@line 11645
  HEAP32[$particle7_i_i >> 2] = $ignore; //@line 11646
  return;
 }
}
function __SLLeaper_drainAsteroid($self, $asteroid) {
 $self = $self | 0;
 $asteroid = $asteroid | 0;
 var $resource = 0, $0 = 0, $resource1 = 0, $_ = 0, $totalResource = 0, $add8 = 0, $4 = 0, $conv16 = 0.0, $conv3_i = 0, $conv12_i = 0, $conv25_i = 0, $conv38_i = 0, $7 = 0;
 $resource = $asteroid + 40 | 0; //@line 4750
 $0 = HEAP32[$resource >> 2] | 0; //@line 4751
 if (($0 | 0) == 0) {
  return;
 }
 $resource1 = $self + 88 | 0; //@line 4757
 if ((HEAP32[$resource1 >> 2] | 0) >= 256) {
  return;
 }
 $_ = ($0 | 0) < 1 ? $0 : 1; //@line 4765
 HEAP32[$resource >> 2] = $0 - $_; //@line 4767
 HEAP32[$resource1 >> 2] = (HEAP32[$resource1 >> 2] | 0) + $_; //@line 4770
 $totalResource = $self + 92 | 0; //@line 4771
 $add8 = (HEAP32[$totalResource >> 2] | 0) + $_ | 0; //@line 4773
 HEAP32[$totalResource >> 2] = $add8; //@line 4774
 $4 = HEAP32[$self + 76 >> 2] | 0; //@line 4776
 if (($4 | 0) != 0) {
  FUNCTION_TABLE_vi[$4 & 31]($add8); //@line 4780
 }
 $conv16 = 1.0 - +(HEAP32[$resource >> 2] | 0) * .0078125; //@line 4786
 $conv3_i = HEAPU8[120] | 0; //@line 4796
 $conv12_i = HEAPU8[121] | 0; //@line 4804
 $conv25_i = HEAPU8[122] | 0; //@line 4812
 $conv38_i = HEAPU8[123] | 0; //@line 4820
 $7 = $asteroid + 44 | 0; //@line 4828
 tempBigInt = (~~(+($conv12_i | 0) + $conv16 * +((HEAPU8[129] | 0) - $conv12_i | 0)) & 255) << 8 | ~~(+($conv3_i | 0) + $conv16 * +((HEAPU8[128] | 0) - $conv3_i | 0)) & 255 | (~~(+($conv25_i | 0) + $conv16 * +((HEAPU8[130] | 0) - $conv25_i | 0)) & 255) << 16 | (~~(+($conv38_i | 0) + $conv16 * +((HEAPU8[131] | 0) - $conv38_i | 0)) & 255) << 24; //@line 4839
 HEAP8[$7] = tempBigInt & 255; //@line 4839
 tempBigInt = tempBigInt >> 8; //@line 4839
 HEAP8[$7 + 1 | 0] = tempBigInt & 255; //@line 4839
 tempBigInt = tempBigInt >> 8; //@line 4839
 HEAP8[$7 + 2 | 0] = tempBigInt & 255; //@line 4839
 tempBigInt = tempBigInt >> 8; //@line 4839
 HEAP8[$7 + 3 | 0] = tempBigInt & 255; //@line 4839
 return;
}
function __SLLeaper_oncollision($a, $b, $collision) {
 $a = $a | 0;
 $b = $b | 0;
 $collision = $collision | 0;
 var $userdata = 0, $tobool = 0, $b_addr_0 = 0, $a_addr_0 = 0, $self_0_in = 0, $userdata3 = 0, $1 = 0, $6 = 0, $7 = 0, $8$1 = 0, $call15 = 0, $13 = 0, $17 = 0, label = 0;
 $userdata = $a + 104 | 0; //@line 3196
 $tobool = (_aqistype(HEAP32[$userdata >> 2] | 0, 1936) | 0) == 0; //@line 3199
 $b_addr_0 = $tobool ? $a : $b; //@line 3202
 $a_addr_0 = $tobool ? $b : $a; //@line 3203
 $self_0_in = HEAP32[($tobool ? $b + 104 | 0 : $userdata) >> 2] | 0; //@line 3204
 $userdata3 = $b_addr_0 + 104 | 0; //@line 3205
 $1 = HEAP32[$userdata3 >> 2] | 0; //@line 3206
 if (($1 | 0) == 0) {
  label = 213; //@line 3210
 } else {
  if ((_aqistype($1, 2032) | 0) != 0) {
   label = 213; //@line 3216
  }
 }
 do {
  if ((label | 0) == 213) {
   if (((HEAP32[$self_0_in + 60 >> 2] | 0) - 6 | 0) >>> 0 < 2) {
    break;
   }
   _SLAmbientParticle_startPulse(HEAP32[$userdata3 >> 2] | 0); //@line 3232
   _SLParticleView_addAmbientParticle($b_addr_0); //@line 3233
   $6 = $b_addr_0 + 12 | 0; //@line 3236
   $7 = $b_addr_0 + 48 | 0; //@line 3237
   $8$1 = HEAP32[$6 + 4 >> 2] | 0; //@line 3241
   HEAP32[$7 >> 2] = HEAP32[$6 >> 2]; //@line 3243
   HEAP32[$7 + 4 >> 2] = $8$1; //@line 3245
   return;
  }
 } while (0);
 $call15 = _AQList_findIndex(HEAP32[$self_0_in + 40 >> 2] | 0, 27, $a_addr_0) | 0; //@line 3254
 $13 = HEAP32[$self_0_in + 56 >> 2] | 0; //@line 3257
 _AQList_push($13, _aqint($call15) | 0) | 0; //@line 3260
 if (($self_0_in | 0) == 0) {
  ___assert_fail(384, 1480, 1077, 1672); //@line 3264
 }
 if ((HEAP32[$a_addr_0 + 104 >> 2] | 0) == (HEAP32[$userdata3 >> 2] | 0)) {
  ___assert_fail(296, 1480, 1078, 1672); //@line 3273
 }
 $17 = $self_0_in + 64 | 0; //@line 3277
 _aqrelease(HEAP32[$17 >> 2] | 0) | 0; //@line 3280
 HEAP32[$17 >> 2] = _aqretain($b_addr_0) | 0; //@line 3284
 return;
}
function _AQWorld_step($self, $dt) {
 $self = $self | 0;
 $dt = +$dt;
 var $integrateContext = 0, $particles = 0, $awakeParticles = 0, $_sleepingParticles = 0, $call218 = 0, $call220 = 0, $9 = 0, $headCollision = 0, sp = 0;
 sp = STACKTOP; //@line 12342
 STACKTOP = STACKTOP + 8 | 0; //@line 12342
 $integrateContext = sp | 0; //@line 12343
 HEAP32[$integrateContext >> 2] = $self; //@line 12345
 HEAPF32[$integrateContext + 4 >> 2] = $dt; //@line 12347
 $particles = $self + 32 | 0; //@line 12348
 $awakeParticles = $self + 40 | 0; //@line 12350
 _AQList_iterateN(HEAP32[$particles >> 2] | 0, HEAP32[$awakeParticles >> 2] | 0, 20, $integrateContext) | 0; //@line 12353
 $_sleepingParticles = $self + 44 | 0; //@line 12354
 $call218 = _AQList_pop(HEAP32[$_sleepingParticles >> 2] | 0) | 0; //@line 12356
 if (($call218 | 0) != 0) {
  $call220 = $call218; //@line 12360
  do {
   _AQList_remove(HEAP32[$particles >> 2] | 0, $call220) | 0; //@line 12364
   _AQList_push(HEAP32[$particles >> 2] | 0, $call220) | 0; //@line 12366
   HEAP32[$awakeParticles >> 2] = (HEAP32[$awakeParticles >> 2] | 0) - 1; //@line 12369
   $call220 = _AQList_pop(HEAP32[$_sleepingParticles >> 2] | 0) | 0; //@line 12371
  } while (($call220 | 0) != 0);
 }
 $9 = $self; //@line 12383
 _AQDdvt_iteratePairs(HEAP32[$self + 28 >> 2] | 0, 19, $9); //@line 12384
 $headCollision = $self + 48 | 0; //@line 12385
 _aqcollision_iterate(HEAP32[$headCollision >> 2] | 0, 32, $9); //@line 12387
 _aqcollision_clear(HEAP32[$headCollision >> 2] | 0); //@line 12389
 HEAP32[$self + 52 >> 2] = HEAP32[$headCollision >> 2]; //@line 12392
 _AQList_iterate(HEAP32[$self + 36 >> 2] | 0, 23, 0) | 0; //@line 12395
 _AQList_iterateN(HEAP32[$particles >> 2] | 0, HEAP32[$awakeParticles >> 2] | 0, 18, $9) | 0; //@line 12398
 STACKTOP = sp; //@line 12399
 return;
}
function _AQWorld_addParticle($self, $particle) {
 $self = $self | 0;
 $particle = $particle | 0;
 var $tmp = 0, $position = 0, $5 = 0, $6 = 0, $awakeParticles = 0, $9 = 0, $10 = 0, $11$1 = 0, $12 = 0, $13 = 0, sp = 0;
 sp = STACKTOP; //@line 12408
 STACKTOP = STACKTOP + 16 | 0; //@line 12408
 $tmp = sp | 0; //@line 12409
 $position = $particle + 12 | 0; //@line 12410
 if (((HEAPF32[tempDoublePtr >> 2] = +HEAPF32[$position >> 2], HEAP32[tempDoublePtr >> 2] | 0) & 2147483647) >>> 0 > 2139095040) {
  ___assert_fail(1528, 1504, 285, 1744); //@line 12418
 }
 if (((HEAPF32[tempDoublePtr >> 2] = +HEAPF32[$particle + 16 >> 2], HEAP32[tempDoublePtr >> 2] | 0) & 2147483647) >>> 0 > 2139095040) {
  ___assert_fail(1528, 1504, 285, 1744); //@line 12428
 } else {
  _AQDdvt_addParticle(HEAP32[$self + 28 >> 2] | 0, $particle); //@line 12433
  $5 = HEAP32[$self + 32 >> 2] | 0; //@line 12435
  $6 = $particle | 0; //@line 12436
  _AQList_unshift($5, $6) | 0; //@line 12437
  $awakeParticles = $self + 40 | 0; //@line 12438
  HEAP32[$awakeParticles >> 2] = (HEAP32[$awakeParticles >> 2] | 0) + 1; //@line 12441
  HEAPF32[$particle + 24 >> 2] = +HEAPF32[$particle + 20 >> 2]; //@line 12445
  $9 = $position; //@line 12447
  $10 = $particle + 40 | 0; //@line 12448
  $11$1 = HEAP32[$9 + 4 >> 2] | 0; //@line 12452
  HEAP32[$10 >> 2] = HEAP32[$9 >> 2]; //@line 12454
  HEAP32[$10 + 4 >> 2] = $11$1; //@line 12456
  _AQParticle_aabb($tmp, $particle); //@line 12458
  $12 = $particle + 80 | 0; //@line 12459
  $13 = $tmp; //@line 12460
  HEAP32[$12 >> 2] = HEAP32[$13 >> 2]; //@line 12461
  HEAP32[$12 + 4 >> 2] = HEAP32[$13 + 4 >> 2]; //@line 12461
  HEAP32[$12 + 8 >> 2] = HEAP32[$13 + 8 >> 2]; //@line 12461
  HEAP32[$12 + 12 >> 2] = HEAP32[$13 + 12 >> 2]; //@line 12461
  STACKTOP = sp; //@line 12462
  return;
 }
}
function _SLAsteroid_create($world, $center, $radius) {
 $world = $world | 0;
 $center = $center | 0;
 $radius = +$radius;
 var $call = 0, $1 = 0, $2 = 0, $3$0 = 0, $3$1 = 0, $conv = 0.0, $5 = 0, $call6 = 0, $7 = 0, $8 = 0, $14 = 0, $17 = 0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 282
 tempParam = $center; //@line 283
 $center = STACKTOP; //@line 283
 STACKTOP = STACKTOP + 8 | 0; //@line 283
 HEAP32[$center >> 2] = HEAP32[tempParam >> 2]; //@line 283
 HEAP32[$center + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 283
 $call = _aqcreate(1984) | 0; //@line 284
 $1 = $center; //@line 287
 $2 = $call + 12 | 0; //@line 288
 $3$0 = HEAP32[$1 >> 2] | 0; //@line 290
 $3$1 = HEAP32[$1 + 4 >> 2] | 0; //@line 292
 HEAP32[$2 >> 2] = $3$0; //@line 294
 HEAP32[$2 + 4 >> 2] = $3$1; //@line 296
 HEAPF32[$call + 20 >> 2] = $radius; //@line 299
 $conv = $radius; //@line 300
 $5 = $call + 24 | 0; //@line 305
 HEAPF32[$5 >> 2] = $conv * $conv * 3.141592653589793; //@line 306
 $call6 = _aqcreate(2264) | 0; //@line 307
 HEAPF32[$call6 + 20 >> 2] = $radius; //@line 310
 $7 = $call6 + 12 | 0; //@line 312
 HEAP32[$7 >> 2] = $3$0; //@line 314
 HEAP32[$7 + 4 >> 2] = $3$1; //@line 316
 $8 = $call6 + 48 | 0; //@line 318
 HEAP32[$8 >> 2] = $3$0; //@line 320
 HEAP32[$8 + 4 >> 2] = $3$1; //@line 322
 HEAPF32[$call6 + 28 >> 2] = +HEAPF32[$5 >> 2]; //@line 326
 HEAP32[$call6 + 104 >> 2] = $call; //@line 329
 HEAPF32[$call6 + 32 >> 2] = 1.0; //@line 332
 HEAP8[$call6 + 96 | 0] = 1; //@line 334
 $14 = $call + 32 | 0; //@line 336
 _AQList_push(HEAP32[$14 >> 2] | 0, $call6) | 0; //@line 339
 $17 = $world; //@line 340
 HEAP32[$call + 28 >> 2] = _aqretain($17) | 0; //@line 345
 _AQList_iterate(HEAP32[$14 >> 2] | 0, 22, $17) | 0; //@line 347
 STACKTOP = sp; //@line 348
 return $call | 0; //@line 348
}
function _main($argc, $argv) {
 $argc = $argc | 0;
 $argv = $argv | 0;
 var $call1 = 0, $call4 = 0, $call6 = 0, $retval_0 = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 7350
 if ((_SDL_Init(32) | 0) != 0) {
  $call1 = _SDL_GetError() | 0; //@line 7355
  _printf(248, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $call1, tempVarArgs) | 0) | 0; //@line 7356
  STACKTOP = tempVarArgs; //@line 7356
  $retval_0 = 1; //@line 7358
  STACKTOP = sp; //@line 7360
  return $retval_0 | 0; //@line 7360
 }
 _SDL_GL_SetAttribute(5, 1) | 0; //@line 7362
 $call4 = _SDL_SetVideoMode(640, 480, 16, 83886080) | 0; //@line 7363
 HEAP32[626] = $call4; //@line 7364
 if (($call4 | 0) == 0) {
  $call6 = _SDL_GetError() | 0; //@line 7368
  _printf(1232, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $call6, tempVarArgs) | 0) | 0; //@line 7369
  STACKTOP = tempVarArgs; //@line 7369
  $retval_0 = 1; //@line 7371
  STACKTOP = sp; //@line 7373
  return $retval_0 | 0; //@line 7373
 } else {
  _glClearColor(+0.0, +0.0, +0.0, +0.0); //@line 7375
  _enable_resizable(); //@line 7376
  _printf(1016, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 32 | 0, HEAP32[tempVarArgs >> 2] = 0, HEAP32[tempVarArgs + 8 >> 2] = -80, HEAP32[tempVarArgs + 16 >> 2] = 640, HEAP32[tempVarArgs + 24 >> 2] = 640, tempVarArgs) | 0) | 0; //@line 7377
  STACKTOP = tempVarArgs; //@line 7377
  _glViewport(0, -80 | 0, 640, 640); //@line 7378
  _AQInput_setScreenSize(640.0, 480.0); //@line 7379
  _emscripten_set_main_loop(17, 0, 0); //@line 7380
  _initWaterTest(); //@line 7381
  _setGetTicksFunction(17); //@line 7382
  $retval_0 = 0; //@line 7384
  STACKTOP = sp; //@line 7386
  return $retval_0 | 0; //@line 7386
 }
 return 0; //@line 7388
}
function _AQReleasePool_done($self) {
 $self = $self | 0;
 var $0 = 0, $4 = 0, $node_013 = 0, $5 = 0, $6 = 0, $7 = 0, $refCount_i10 = 0, $dec_i = 0, $parentPool = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0;
 $0 = HEAP32[$self + 20 >> 2] | 0; //@line 14073
 if (($0 | 0) != 0) {
  HEAP32[$0 + 4 >> 2] = 0; //@line 14079
  _free(FUNCTION_TABLE_ii[HEAP32[(HEAP32[$0 >> 2] | 0) + 16 >> 2] & 63]($0) | 0); //@line 14085
 }
 $4 = HEAP32[$self + 12 >> 2] | 0; //@line 14089
 if (($4 | 0) != 0) {
  $node_013 = $4; //@line 14093
  while (1) {
   $5 = HEAP32[$node_013 + 4 >> 2] | 0; //@line 14097
   $6 = HEAP32[$node_013 >> 2] | 0; //@line 14099
   $7 = $6; //@line 14100
   do {
    if (($6 | 0) != 0) {
     $refCount_i10 = $6 + 4 | 0; //@line 14105
     $dec_i = (HEAP32[$refCount_i10 >> 2] | 0) - 1 | 0; //@line 14107
     HEAP32[$refCount_i10 >> 2] = $dec_i; //@line 14108
     if (($dec_i | 0) != 0) {
      break;
     }
     HEAP32[$refCount_i10 >> 2] = 0; //@line 14114
     _free(FUNCTION_TABLE_ii[HEAP32[(HEAP32[$6 >> 2] | 0) + 16 >> 2] & 63]($7) | 0); //@line 14120
    }
   } while (0);
   _free($node_013); //@line 14125
   if (($5 | 0) == 0) {
    break;
   } else {
    $node_013 = $5; //@line 14131
   }
  }
 }
 $parentPool = $self + 24 | 0; //@line 14135
 $12 = HEAP32[$parentPool >> 2] | 0; //@line 14136
 if (($12 | 0) == 0) {
  $13 = 0; //@line 14140
  $14 = $13 | 0; //@line 14142
  HEAP32[768] = $14; //@line 14143
  $15 = $self | 0; //@line 14144
  return $15 | 0; //@line 14145
 }
 HEAP32[$12 + 20 >> 2] = 0; //@line 14148
 $13 = HEAP32[$parentPool >> 2] | 0; //@line 14151
 $14 = $13 | 0; //@line 14153
 HEAP32[768] = $14; //@line 14154
 $15 = $self | 0; //@line 14155
 return $15 | 0; //@line 14156
}
function _AQShaders_boot() {
 var $programStatus_i = 0, $call_i = 0, $call1_i = 0, $call3_i = 0, $call1 = 0, $call2 = 0, $call3 = 0, $6 = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 5966
 STACKTOP = STACKTOP + 8 | 0; //@line 5966
 $programStatus_i = sp | 0; //@line 5967
 $call_i = _glCreateProgram() | 0; //@line 5969
 $call1_i = _glCreateShader(35632) | 0; //@line 5970
 _compileShader($call1_i, 432); //@line 5971
 _glAttachShader($call_i | 0, $call1_i | 0); //@line 5972
 $call3_i = _glCreateShader(35633) | 0; //@line 5973
 _compileShader($call3_i, 584); //@line 5974
 _glAttachShader($call_i | 0, $call3_i | 0); //@line 5975
 _glLinkProgram($call_i | 0); //@line 5976
 _glGetProgramiv($call_i | 0, 35714, $programStatus_i | 0); //@line 5977
 if ((HEAP32[$programStatus_i >> 2] | 0) == 0) {
  _puts(64) | 0; //@line 5982
 }
 HEAP32[770] = $call_i; //@line 5985
 HEAP32[771] = 18; //@line 5986
 _glUseProgram($call_i | 0); //@line 5987
 $call1 = _glGetAttribLocation(HEAP32[770] | 0, 824) | 0; //@line 5989
 HEAP32[772] = $call1; //@line 5990
 _glEnableVertexAttribArray($call1 | 0); //@line 5991
 $call2 = _glGetAttribLocation(HEAP32[770] | 0, 1344) | 0; //@line 5993
 HEAP32[773] = $call2; //@line 5994
 _glEnableVertexAttribArray($call2 | 0); //@line 5995
 $call3 = _glGetUniformLocation(HEAP32[770] | 0, 1088) | 0; //@line 5997
 HEAP32[774] = $call3; //@line 5998
 $6 = HEAP32[772] | 0; //@line 6000
 _printf(872, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 24 | 0, HEAP32[tempVarArgs >> 2] = HEAP32[770], HEAP32[tempVarArgs + 8 >> 2] = $6, HEAP32[tempVarArgs + 16 >> 2] = $call3, tempVarArgs) | 0) | 0; //@line 6001
 STACKTOP = tempVarArgs; //@line 6001
 STACKTOP = sp; //@line 6002
 return;
}
function _compileShader($shader, $source) {
 $shader = $shader | 0;
 $source = $source | 0;
 var $length = 0, $compileStatus = 0, $infologlength = 0, $arrayinit_begin = 0, $add = 0, $2 = 0, $vla = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP; //@line 6084
 STACKTOP = STACKTOP + 32 | 0; //@line 6084
 $length = sp | 0; //@line 6085
 $compileStatus = sp + 16 | 0; //@line 6087
 $infologlength = sp + 24 | 0; //@line 6088
 HEAP32[$length >> 2] = _strlen($source | 0) | 0; //@line 6090
 $arrayinit_begin = sp + 8 | 0; //@line 6091
 HEAP32[$arrayinit_begin >> 2] = $source; //@line 6092
 _glShaderSource($shader | 0, 1, $arrayinit_begin | 0, $length | 0); //@line 6093
 _glCompileShader($shader | 0); //@line 6094
 _glGetShaderiv($shader | 0, 35713, $compileStatus | 0); //@line 6095
 if ((HEAP32[$compileStatus >> 2] | 0) != 0) {
  STACKTOP = sp; //@line 6100
  return;
 }
 _glGetShaderiv($shader | 0, 35716, $infologlength | 0); //@line 6102
 $add = (HEAP32[$infologlength >> 2] | 0) + 1 | 0; //@line 6104
 $2 = _llvm_stacksave() | 0; //@line 6105
 $vla = STACKTOP; //@line 6106
 STACKTOP = STACKTOP + $add | 0; //@line 6106
 STACKTOP = STACKTOP + 7 & -8; //@line 6106
 _glGetShaderInfoLog($shader | 0, HEAP32[$infologlength >> 2] | 0, 0, $vla | 0); //@line 6108
 _puts(8) | 0; //@line 6109
 _printf(224, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempVarArgs >> 2] = $vla, tempVarArgs) | 0) | 0; //@line 6110
 STACKTOP = tempVarArgs; //@line 6110
 _llvm_stackrestore($2 | 0); //@line 6111
 STACKTOP = sp; //@line 6113
 return;
}
function _AQArray_push($self, $obj) {
 $self = $self | 0;
 $obj = $obj | 0;
 var $length = 0, $0 = 0, $capacity = 0, $add = 0, $2 = 0, $items1_i = 0, $3 = 0, $tmpArray_sroa_3_12_load14_i = 0, $inc_i10_i = 0, $items_pre_phi = 0, $7 = 0, $8 = 0;
 $length = $self + 12 | 0; //@line 12749
 $0 = HEAP32[$length >> 2] | 0; //@line 12750
 $capacity = $self + 16 | 0; //@line 12751
 if (($0 | 0) == (HEAP32[$capacity >> 2] | 0)) {
  $add = $0 + 16 | 0; //@line 12756
  $2 = _calloc($add, 4) | 0; //@line 12758
  $items1_i = $self + 20 | 0; //@line 12759
  $3 = HEAP32[$items1_i >> 2] | 0; //@line 12760
  if (($3 | 0) != 0) {
   if (($0 | 0) > 0) {
    $tmpArray_sroa_3_12_load14_i = 0; //@line 12767
    while (1) {
     $inc_i10_i = $tmpArray_sroa_3_12_load14_i + 1 | 0; //@line 12772
     HEAP32[$2 + ($tmpArray_sroa_3_12_load14_i << 2) >> 2] = HEAP32[$3 + ($tmpArray_sroa_3_12_load14_i << 2) >> 2]; //@line 12774
     if (($inc_i10_i | 0) < ($0 | 0)) {
      $tmpArray_sroa_3_12_load14_i = $inc_i10_i; //@line 12778
     } else {
      break;
     }
    }
   }
   _free($3); //@line 12785
  }
  HEAP32[$capacity >> 2] = $add; //@line 12788
  HEAP32[$items1_i >> 2] = $2; //@line 12789
  $items_pre_phi = $items1_i; //@line 12791
 } else {
  $items_pre_phi = $self + 20 | 0; //@line 12795
 }
 $7 = _aqretain($obj) | 0; //@line 12800
 $8 = HEAP32[$length >> 2] | 0; //@line 12801
 HEAP32[$length >> 2] = $8 + 1; //@line 12803
 HEAP32[(HEAP32[$items_pre_phi >> 2] | 0) + ($8 << 2) >> 2] = $7; //@line 12806
 return 1; //@line 12807
}
function __AQWorld_maintainBoxIterator($particle, $ctx) {
 $particle = $particle | 0;
 $ctx = $ctx | 0;
 var $aabb = 0, $1 = 0.0, $3 = 0.0, $x = 0, $5 = 0.0, $7 = 0.0, $x17 = 0, $9 = 0.0, $11 = 0.0, $y = 0, $13 = 0.0, $14 = 0.0, $y40 = 0, sp = 0;
 sp = STACKTOP; //@line 12242
 STACKTOP = STACKTOP + 16 | 0; //@line 12242
 $aabb = sp | 0; //@line 12243
 if ((HEAP8[$particle + 98 | 0] | 0) != 0) {
  STACKTOP = sp; //@line 12249
  return;
 }
 _AQParticle_aabb($aabb, $particle); //@line 12251
 $1 = +HEAPF32[$aabb + 12 >> 2]; //@line 12253
 $3 = +HEAPF32[$ctx + 24 >> 2]; //@line 12257
 if ($1 < $3) {
  $x = $particle + 12 | 0; //@line 12262
  HEAPF32[$x >> 2] = $3 - $1 + +HEAPF32[$x >> 2]; //@line 12265
 }
 $5 = +HEAPF32[$aabb + 4 >> 2]; //@line 12269
 $7 = +HEAPF32[$ctx + 16 >> 2]; //@line 12272
 if ($5 > $7) {
  $x17 = $particle + 12 | 0; //@line 12277
  HEAPF32[$x17 >> 2] = $7 - $5 + +HEAPF32[$x17 >> 2]; //@line 12280
 }
 $9 = +HEAPF32[$aabb + 8 >> 2]; //@line 12284
 $11 = +HEAPF32[$ctx + 20 >> 2]; //@line 12287
 if ($9 < $11) {
  $y = $particle + 16 | 0; //@line 12292
  HEAPF32[$y >> 2] = $11 - $9 + +HEAPF32[$y >> 2]; //@line 12295
 }
 $13 = +HEAPF32[$aabb >> 2]; //@line 12299
 $14 = +HEAPF32[$ctx + 12 >> 2]; //@line 12301
 if ($13 <= $14) {
  STACKTOP = sp; //@line 12305
  return;
 }
 $y40 = $particle + 16 | 0; //@line 12308
 HEAPF32[$y40 >> 2] = $14 - $13 + +HEAPF32[$y40 >> 2]; //@line 12311
 STACKTOP = sp; //@line 12313
 return;
}
function _AQList_at($_self, $index) {
 $_self = $_self | 0;
 $index = $index | 0;
 var $node_09 = 0, $2 = 0, $cond613 = 0, $cond616 = 0, $node_015 = 0, $i_014 = 0, $inc = 0, $node_0 = 0, $cond6 = 0, $cond6_lcssa = 0, $node_0_lcssa = 0, $cond = 0;
 $node_09 = HEAP32[$_self + 16 >> 2] | 0; //@line 13263
 $2 = HEAP32[$_self + 12 >> 2] | 0; //@line 13266
 $cond613 = ($node_09 | 0) == 0; //@line 13270
 L1630 : do {
  if (($2 | 0) > 0 & ($index | 0) > 0) {
   $i_014 = 0; //@line 13274
   $node_015 = $node_09; //@line 13274
   $cond616 = $cond613; //@line 13274
   while (1) {
    if ($cond616) {
     $cond = 0; //@line 13280
     break;
    }
    $inc = $i_014 + 1 | 0; //@line 13284
    $node_0 = HEAP32[$node_015 >> 2] | 0; //@line 13285
    $cond6 = ($node_0 | 0) == 0; //@line 13289
    if (($inc | 0) < ($2 | 0) & ($inc | 0) < ($index | 0)) {
     $i_014 = $inc; //@line 13292
     $node_015 = $node_0; //@line 13292
     $cond616 = $cond6; //@line 13292
    } else {
     $node_0_lcssa = $node_0; //@line 13294
     $cond6_lcssa = $cond6; //@line 13294
     break L1630;
    }
   }
   return $cond | 0; //@line 13299
  } else {
   $node_0_lcssa = $node_09; //@line 13301
   $cond6_lcssa = $cond613; //@line 13301
  }
 } while (0);
 if ($cond6_lcssa) {
  $cond = 0; //@line 13308
  return $cond | 0; //@line 13310
 }
 $cond = HEAP32[$node_0_lcssa + 8 >> 2] | 0; //@line 13315
 return $cond | 0; //@line 13317
}
function _SLLeaper_done($self) {
 $self = $self | 0;
 var $world = 0, $0 = 0, $bodies9_pre = 0, $1 = 0, $2 = 0, $triggers = 0, $3 = 0, $5 = 0, $sticks = 0, $6 = 0, $8 = 0, $10 = 0, $sticks13_pre_phi = 0, $triggers11_pre_phi = 0;
 _puts(96) | 0; //@line 3319
 $world = $self + 48 | 0; //@line 3320
 $0 = HEAP32[$world >> 2] | 0; //@line 3321
 $bodies9_pre = $self + 36 | 0; //@line 3323
 if (($0 | 0) == 0) {
  $triggers11_pre_phi = $self + 40 | 0; //@line 3329
  $sticks13_pre_phi = $self + 44 | 0; //@line 3329
 } else {
  $1 = HEAP32[$bodies9_pre >> 2] | 0; //@line 3331
  $2 = $0; //@line 3332
  _AQList_iterate($1, 30, $2) | 0; //@line 3333
  $triggers = $self + 40 | 0; //@line 3334
  $3 = HEAP32[$triggers >> 2] | 0; //@line 3335
  $5 = HEAP32[$world >> 2] | 0; //@line 3337
  _AQList_iterate($3, 30, $5) | 0; //@line 3338
  $sticks = $self + 44 | 0; //@line 3339
  $6 = HEAP32[$sticks >> 2] | 0; //@line 3340
  $8 = HEAP32[$world >> 2] | 0; //@line 3342
  _AQList_iterate($6, 19, $8) | 0; //@line 3343
  $10 = HEAP32[$world >> 2] | 0; //@line 3345
  _aqrelease($10) | 0; //@line 3346
  $triggers11_pre_phi = $triggers; //@line 3348
  $sticks13_pre_phi = $sticks; //@line 3348
 }
 _aqrelease(HEAP32[$bodies9_pre >> 2] | 0) | 0; //@line 3354
 _aqrelease(HEAP32[$triggers11_pre_phi >> 2] | 0) | 0; //@line 3357
 _aqrelease(HEAP32[$sticks13_pre_phi >> 2] | 0) | 0; //@line 3360
 return $self | 0; //@line 3361
}
function _AQCamera_setGlMatrix($self, $matrix) {
 $self = $self | 0;
 $matrix = $matrix | 0;
 var $0 = 0.0, $1 = 0.0, $2 = 0.0, $3 = 0.0, $sub8 = 0.0, $div = 0.0, $sub11 = 0.0, $div12 = 0.0, $conv = 0.0, $conv17 = 0.0, $conv21 = 0.0, $div37 = 0.0, $div39 = 0.0, $sub44 = 0.0;
 $0 = +HEAPF32[$self + 16 >> 2]; //@line 601
 $1 = +HEAPF32[$self + 24 >> 2]; //@line 603
 $2 = +HEAPF32[$self + 12 >> 2]; //@line 605
 $3 = +HEAPF32[$self + 20 >> 2]; //@line 607
 $sub8 = $0 - $1; //@line 610
 $div = (-0.0 - ($0 + $1)) / $sub8; //@line 611
 $sub11 = $2 - $3; //@line 614
 $div12 = (-0.0 - ($2 + $3)) / $sub11; //@line 615
 $conv = +HEAPF32[$self + 44 >> 2]; //@line 618
 $conv17 = +Math_cos(+$conv); //@line 620
 $conv21 = +Math_sin(+$conv); //@line 622
 $div37 = 2.0 / $sub8; //@line 623
 HEAPF32[$matrix >> 2] = $conv17 * $div37; //@line 625
 $div39 = 2.0 / $sub11; //@line 626
 HEAPF32[$matrix + 16 >> 2] = $conv21 * $div39; //@line 629
 $sub44 = -0.0 - $conv21; //@line 630
 HEAPF32[$matrix + 4 >> 2] = $div37 * $sub44; //@line 633
 HEAPF32[$matrix + 20 >> 2] = $conv17 * $div39; //@line 636
 HEAPF32[$matrix + 40 >> 2] = -.0020000000949949026; //@line 638
 HEAPF32[$matrix + 48 >> 2] = $div * $conv17 + $div12 * $conv21; //@line 643
 HEAPF32[$matrix + 52 >> 2] = $div12 * $conv17 + $div * $sub44; //@line 648
 HEAPF32[$matrix + 56 >> 2] = -1.0; //@line 650
 return $self | 0; //@line 651
}
function _AQDraw_color($start, $end, $next, $getcolor, $color) {
 $start = $start | 0;
 $end = $end | 0;
 $next = $next | 0;
 $getcolor = $getcolor | 0;
 $color = $color | 0;
 var $0 = 0, $1 = 0, $ptr_05 = 0, $2 = 0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 1329
 tempParam = $color; //@line 1330
 $color = STACKTOP; //@line 1330
 STACKTOP = STACKTOP + 4 | 0; //@line 1330
 STACKTOP = STACKTOP + 7 & -8; //@line 1330
 HEAP32[$color >> 2] = HEAP32[tempParam >> 2]; //@line 1330
 if ($start >>> 0 >= $end >>> 0) {
  STACKTOP = sp; //@line 1334
  return $end | 0; //@line 1334
 }
 $0 = $color; //@line 1336
 $1 = HEAPU8[$0] | HEAPU8[$0 + 1 | 0] << 8 | HEAPU8[$0 + 2 | 0] << 16 | HEAPU8[$0 + 3 | 0] << 24 | 0; //@line 1337
 $ptr_05 = $start; //@line 1339
 do {
  $2 = FUNCTION_TABLE_ii[$getcolor & 63]($ptr_05) | 0; //@line 1343
  tempBigInt = $1; //@line 1344
  HEAP8[$2] = tempBigInt & 255; //@line 1344
  tempBigInt = tempBigInt >> 8; //@line 1344
  HEAP8[$2 + 1 | 0] = tempBigInt & 255; //@line 1344
  tempBigInt = tempBigInt >> 8; //@line 1344
  HEAP8[$2 + 2 | 0] = tempBigInt & 255; //@line 1344
  tempBigInt = tempBigInt >> 8; //@line 1344
  HEAP8[$2 + 3 | 0] = tempBigInt & 255; //@line 1344
  $ptr_05 = FUNCTION_TABLE_ii[$next & 63]($ptr_05) | 0; //@line 1346
 } while ($ptr_05 >>> 0 < $end >>> 0);
 STACKTOP = sp; //@line 1355
 return $end | 0; //@line 1355
}
function __AQDdvt_updateParticle($self, $particle, $old, $new) {
 $self = $self | 0;
 $particle = $particle | 0;
 $old = $old | 0;
 $new = $new | 0;
 var $tl = 0, $length = 0, $3 = 0, $tr_i = 0, $bl_i = 0, $br_i = 0;
 $tl = $self + 32 | 0; //@line 9566
 if ((HEAP32[$tl >> 2] | 0) == 0) {
  __AQDdvt_updateParticleLeaf($self, $particle, $old, $new); //@line 9571
  return;
 }
 __AQDdvt_updateParticleChild($self, $particle, $old, $new); //@line 9575
 $length = $self + 240 | 0; //@line 9576
 if ((HEAP32[$length >> 2] | 0) != 24) {
  return;
 }
 HEAP32[$length >> 2] = 0; //@line 9583
 $3 = $self; //@line 9585
 _AQDdvt_iterate(HEAP32[$tl >> 2] | 0, 31, $3); //@line 9586
 $tr_i = $self + 36 | 0; //@line 9587
 _AQDdvt_iterate(HEAP32[$tr_i >> 2] | 0, 31, $3); //@line 9589
 $bl_i = $self + 40 | 0; //@line 9590
 _AQDdvt_iterate(HEAP32[$bl_i >> 2] | 0, 31, $3); //@line 9592
 $br_i = $self + 44 | 0; //@line 9593
 _AQDdvt_iterate(HEAP32[$br_i >> 2] | 0, 31, $3); //@line 9595
 _aqrelease(HEAP32[$tl >> 2] | 0) | 0; //@line 9598
 HEAP32[$tl >> 2] = 0; //@line 9599
 _aqrelease(HEAP32[$tr_i >> 2] | 0) | 0; //@line 9602
 HEAP32[$tr_i >> 2] = 0; //@line 9603
 _aqrelease(HEAP32[$bl_i >> 2] | 0) | 0; //@line 9606
 HEAP32[$bl_i >> 2] = 0; //@line 9607
 _aqrelease(HEAP32[$br_i >> 2] | 0) | 0; //@line 9610
 HEAP32[$br_i >> 2] = 0; //@line 9611
 return;
}
function _SLAmbientParticle_color($agg_result, $self) {
 $agg_result = $agg_result | 0;
 $self = $self | 0;
 var $0 = 0, $div = 0.0, $conv7 = 0, $div24 = 0.0, $conv31 = 0, $1 = 0;
 $0 = HEAP32[$self + 12 >> 2] | 0; //@line 164
 if (($0 | 0) > 15) {
  $div = +(20 - $0 | 0) / 5.0; //@line 170
  $conv7 = ~~($div * 255.0); //@line 174
  HEAP8[$agg_result | 0] = ~~($div * 192.0); //@line 176
  HEAP8[$agg_result + 1 | 0] = $conv7; //@line 178
  HEAP8[$agg_result + 2 | 0] = $conv7; //@line 180
  HEAP8[$agg_result + 3 | 0] = $conv7; //@line 182
  return;
 }
 if (($0 | 0) > 0) {
  $div24 = +($0 | 0) / 15.0; //@line 190
  $conv31 = ~~($div24 * 255.0); //@line 194
  HEAP8[$agg_result | 0] = ~~($div24 * 192.0); //@line 196
  HEAP8[$agg_result + 1 | 0] = $conv31; //@line 198
  HEAP8[$agg_result + 2 | 0] = $conv31; //@line 200
  HEAP8[$agg_result + 3 | 0] = $conv31; //@line 202
  return;
 } else {
  $1 = $agg_result; //@line 206
  tempBigInt = 0; //@line 207
  HEAP8[$1] = tempBigInt & 255; //@line 207
  tempBigInt = tempBigInt >> 8; //@line 207
  HEAP8[$1 + 1 | 0] = tempBigInt & 255; //@line 207
  tempBigInt = tempBigInt >> 8; //@line 207
  HEAP8[$1 + 2 | 0] = tempBigInt & 255; //@line 207
  tempBigInt = tempBigInt >> 8; //@line 207
  HEAP8[$1 + 3 | 0] = tempBigInt & 255; //@line 207
  return;
 }
}
function _AQDdvt_iterate($self, $iterator, $ctx) {
 $self = $self | 0;
 $iterator = $iterator | 0;
 $ctx = $ctx | 0;
 var $0 = 0, $self_tr_lcssa = 0, $1 = 0, $index_017 = 0, $3 = 0, $self_tr20 = 0, $6 = 0, $7 = 0;
 $0 = HEAP32[$self + 32 >> 2] | 0; //@line 10104
 if (($0 | 0) == 0) {
  $self_tr_lcssa = $self; //@line 10108
 } else {
  $self_tr20 = $self; //@line 10110
  $3 = $0; //@line 10110
  while (1) {
   _AQDdvt_iterate($3, $iterator, $ctx); //@line 10114
   _AQDdvt_iterate(HEAP32[$self_tr20 + 36 >> 2] | 0, $iterator, $ctx); //@line 10117
   _AQDdvt_iterate(HEAP32[$self_tr20 + 40 >> 2] | 0, $iterator, $ctx); //@line 10120
   $6 = HEAP32[$self_tr20 + 44 >> 2] | 0; //@line 10122
   $7 = HEAP32[$6 + 32 >> 2] | 0; //@line 10124
   if (($7 | 0) == 0) {
    $self_tr_lcssa = $6; //@line 10128
    break;
   } else {
    $self_tr20 = $6; //@line 10131
    $3 = $7; //@line 10131
   }
  }
 }
 $1 = HEAP32[$self_tr_lcssa + 240 >> 2] | 0; //@line 10137
 if (($1 | 0) > 0) {
  $index_017 = 0; //@line 10141
 } else {
  return;
 }
 do {
  FUNCTION_TABLE_vii[$iterator & 63](HEAP32[$self_tr_lcssa + 48 + ($index_017 << 2) >> 2] | 0, $ctx); //@line 10149
  $index_017 = $index_017 + 1 | 0; //@line 10150
 } while (($index_017 | 0) < ($1 | 0));
 return;
}
function _AQLoop_once($fn, $ctx) {
 $fn = $fn | 0;
 $ctx = $ctx | 0;
 var $node_0_i = 0, $3 = 0, $node_0_lcssa_i = 0, $next5_i = 0, $4 = 0, $call_i_i = 0, $5 = 0, $6 = 0;
 $node_0_i = HEAP32[(HEAP32[794] | 0) + 24 >> 2] | 0; //@line 5372
 while (1) {
  if (($node_0_i | 0) == 0) {
   $node_0_lcssa_i = 0; //@line 5378
   break;
  }
  if ((HEAP32[$node_0_i >> 2] | 0) != 0) {
   $node_0_lcssa_i = $node_0_i; //@line 5386
   break;
  }
  $3 = HEAP32[$node_0_i + 8 >> 2] | 0; //@line 5390
  if (($3 | 0) == 0) {
   $node_0_lcssa_i = $node_0_i; //@line 5393
   break;
  } else {
   $node_0_i = $3; //@line 5396
  }
 }
 $next5_i = $node_0_lcssa_i + 8 | 0; //@line 5400
 $4 = HEAP32[$next5_i >> 2] | 0; //@line 5401
 if (($4 | 0) == 0) {
  $call_i_i = _malloc(12) | 0; //@line 5405
  $5 = $call_i_i; //@line 5406
  _memset($call_i_i | 0, 0, 12); //@line 5407
  HEAP32[$next5_i >> 2] = $5; //@line 5408
  $6 = $5; //@line 5410
 } else {
  $6 = $4; //@line 5412
 }
 HEAP32[$6 >> 2] = 0; //@line 5416
 HEAP32[$node_0_lcssa_i >> 2] = $fn; //@line 5418
 HEAP32[$node_0_lcssa_i + 4 >> 2] = $ctx; //@line 5420
 HEAP32[(HEAP32[794] | 0) + 24 >> 2] = HEAP32[$next5_i >> 2]; //@line 5424
 return;
}
function _AQWorld_setAabb($self, $aabb) {
 $self = $self | 0;
 $aabb = $aabb | 0;
 var $0 = 0, $1 = 0, $3 = 0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 12322
 tempParam = $aabb; //@line 12323
 $aabb = STACKTOP; //@line 12323
 STACKTOP = STACKTOP + 16 | 0; //@line 12323
 HEAP32[$aabb >> 2] = HEAP32[tempParam >> 2]; //@line 12323
 HEAP32[$aabb + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 12323
 HEAP32[$aabb + 8 >> 2] = HEAP32[tempParam + 8 >> 2]; //@line 12323
 HEAP32[$aabb + 12 >> 2] = HEAP32[tempParam + 12 >> 2]; //@line 12323
 $0 = $self + 12 | 0; //@line 12325
 $1 = $aabb; //@line 12326
 HEAP32[$0 >> 2] = HEAP32[$1 >> 2]; //@line 12327
 HEAP32[$0 + 4 >> 2] = HEAP32[$1 + 4 >> 2]; //@line 12327
 HEAP32[$0 + 8 >> 2] = HEAP32[$1 + 8 >> 2]; //@line 12327
 HEAP32[$0 + 12 >> 2] = HEAP32[$1 + 12 >> 2]; //@line 12327
 $3 = (HEAP32[$self + 28 >> 2] | 0) + 12 | 0; //@line 12331
 HEAP32[$3 >> 2] = HEAP32[$1 >> 2]; //@line 12332
 HEAP32[$3 + 4 >> 2] = HEAP32[$1 + 4 >> 2]; //@line 12332
 HEAP32[$3 + 8 >> 2] = HEAP32[$1 + 8 >> 2]; //@line 12332
 HEAP32[$3 + 12 >> 2] = HEAP32[$1 + 12 >> 2]; //@line 12332
 STACKTOP = sp; //@line 12333
 return $self | 0; //@line 12333
}
function _aqcreate($type) {
 $type = $type | 0;
 var $call_i = 0, $call_i1 = 0, $4 = 0, $call_i_i = 0, $headNode_i_i = 0, $tailNode4_i_i = 0;
 $call_i = _malloc(HEAP32[$type + 4 >> 2] | 0) | 0; //@line 13898
 HEAP32[$call_i >> 2] = $type; //@line 13900
 HEAP32[$call_i + 4 >> 2] = 1; //@line 13903
 HEAP32[$call_i + 8 >> 2] = 0; //@line 13906
 $call_i1 = FUNCTION_TABLE_ii[HEAP32[$type + 12 >> 2] & 63]($call_i) | 0; //@line 13909
 $4 = HEAP32[768] | 0; //@line 13910
 if (($4 | 0) == 0) {
  return $call_i1 | 0; //@line 13914
 }
 $call_i_i = _malloc(8) | 0; //@line 13917
 HEAP32[$call_i_i >> 2] = $call_i1; //@line 13919
 HEAP32[$call_i_i + 4 >> 2] = 0; //@line 13922
 $headNode_i_i = $4 + 12 | 0; //@line 13923
 $tailNode4_i_i = $4 + 16 | 0; //@line 13927
 if ((HEAP32[$headNode_i_i >> 2] | 0) == 0) {
  HEAP32[$tailNode4_i_i >> 2] = $call_i_i; //@line 13931
  HEAP32[$headNode_i_i >> 2] = $call_i_i; //@line 13934
  return $call_i1 | 0; //@line 13936
 } else {
  HEAP32[(HEAP32[$tailNode4_i_i >> 2] | 0) + 4 >> 2] = $call_i_i; //@line 13942
  HEAP32[$tailNode4_i_i >> 2] = $call_i_i; //@line 13944
  return $call_i1 | 0; //@line 13945
 }
 return 0; //@line 13947
}
function _AQList_push($_self, $item) {
 $_self = $_self | 0;
 $item = $item | 0;
 var $call = 0, $1 = 0, $tail = 0, $2 = 0, $_pre = 0, $5 = 0, $length = 0, $head = 0;
 $call = _malloc(12) | 0; //@line 13042
 HEAP32[$call >> 2] = 0; //@line 13044
 $1 = $call + 8 | 0; //@line 13048
 HEAP32[$1 >> 2] = 0; //@line 13049
 $tail = $_self + 20 | 0; //@line 13050
 $2 = HEAP32[$tail >> 2] | 0; //@line 13051
 HEAP32[$call + 4 >> 2] = $2; //@line 13053
 do {
  if (($2 | 0) != 0) {
   HEAP32[$2 >> 2] = $call; //@line 13060
   $_pre = HEAP32[$1 >> 2] | 0; //@line 13061
   if (($_pre | 0) == 0) {
    break;
   }
   $5 = $_pre; //@line 13067
   _aqrelease($5) | 0; //@line 13068
  }
 } while (0);
 HEAP32[$1 >> 2] = 0; //@line 13072
 if (($item | 0) != 0) {
  HEAP32[$1 >> 2] = _aqretain($item) | 0; //@line 13079
 }
 $length = $_self + 12 | 0; //@line 13082
 HEAP32[$length >> 2] = (HEAP32[$length >> 2] | 0) + 1; //@line 13088
 HEAP32[$tail >> 2] = $call; //@line 13089
 $head = $_self + 16 | 0; //@line 13090
 if ((HEAP32[$head >> 2] | 0) != 0) {
  return $_self | 0; //@line 13096
 }
 HEAP32[$head >> 2] = $call; //@line 13099
 return $_self | 0; //@line 13101
}
function __SLLeaper_gotoState($self, $newState) {
 $self = $self | 0;
 $newState = $newState | 0;
 var $state = 0, $2 = 0, $8 = 0, label = 0;
 $state = $self + 60 | 0; //@line 4492
 if ((HEAP32[$state >> 2] | 0) == 6) {
  return;
 }
 do {
  if (($newState | 0) == 2) {
   $2 = HEAP32[(HEAP32[$self + 64 >> 2] | 0) + 104 >> 2] | 0; //@line 4506
   if (($2 | 0) == 0) {
    break;
   }
   if ((_aqistype($2, 1984) | 0) == 0) {
    label = 319; //@line 4516
    break;
   }
   if ((HEAP32[$2 + 48 >> 2] | 0) == 0) {
    label = 319; //@line 4525
    break;
   }
   HEAP32[$self + 68 >> 2] = 1; //@line 4529
   label = 319; //@line 4531
  } else {
   HEAP32[$self + 68 >> 2] = 0; //@line 4534
   label = 319; //@line 4535
  }
 } while (0);
 do {
  if ((label | 0) == 319) {
   if (($newState - 3 | 0) >>> 0 < 2) {
    HEAP32[$self + 52 >> 2] = _AQNumber_asInt(_AQList_at(HEAP32[$self + 56 >> 2] | 0, 0) | 0) | 0; //@line 4550
    break;
   }
   if (($newState | 0) != 0) {
    break;
   }
   $8 = HEAP32[$self + 56 >> 2] | 0; //@line 4560
   _AQList_removeAt($8, 0) | 0; //@line 4561
  }
 } while (0);
 HEAP32[$state >> 2] = $newState; //@line 4565
 return;
}
function _AQList_pop($_self) {
 $_self = $_self | 0;
 var $tail = 0, $0 = 0, $1 = 0, $2 = 0, $4 = 0, $head = 0, $7 = 0, $10 = 0, $length = 0, $obj_0 = 0;
 $tail = $_self + 20 | 0; //@line 13110
 $0 = HEAP32[$tail >> 2] | 0; //@line 13111
 $1 = $0; //@line 13112
 if (($0 | 0) == 0) {
  $obj_0 = 0; //@line 13116
  return $obj_0 | 0; //@line 13118
 }
 $2 = $0 + 4 | 0; //@line 13121
 HEAP32[$tail >> 2] = HEAP32[$2 >> 2]; //@line 13124
 $4 = HEAP32[$2 >> 2] | 0; //@line 13125
 if (($4 | 0) != 0) {
  HEAP32[$4 >> 2] = 0; //@line 13130
 }
 $head = $_self + 16 | 0; //@line 13133
 if ((HEAP32[$head >> 2] | 0) == ($1 | 0)) {
  HEAP32[$head >> 2] = 0; //@line 13139
 }
 $7 = $0 + 8 | 0; //@line 13143
 $10 = _aqautorelease(HEAP32[$7 >> 2] | 0) | 0; //@line 13147
 HEAP32[$2 >> 2] = 0; //@line 13148
 HEAP32[$0 >> 2] = 0; //@line 13150
 HEAP32[$7 >> 2] = 0; //@line 13151
 _free(_aqlistnode_done($1) | 0); //@line 13154
 $length = $_self + 12 | 0; //@line 13155
 HEAP32[$length >> 2] = (HEAP32[$length >> 2] | 0) - 1; //@line 13161
 $obj_0 = $10; //@line 13163
 return $obj_0 | 0; //@line 13165
}
function _SLLeaper_radians($self) {
 $self = $self | 0;
 var $call = 0, $position2_sroa_0_0_copyload = 0.0, $position2_sroa_1_4_copyload = 0.0, $_sroa_0_0_copyload = 0.0, $sub_i_i = 0.0, $sub3_i_i = 0.0, $div_i_i = 0.0;
 $call = _AQList_at(HEAP32[$self + 36 >> 2] | 0, 0) | 0; //@line 4578
 $position2_sroa_0_0_copyload = (copyTempFloat($self + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4581
 $position2_sroa_1_4_copyload = (copyTempFloat($self + 16 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4583
 $_sroa_0_0_copyload = (copyTempFloat($call + 12 | 0), +HEAPF32[tempDoublePtr >> 2]); //@line 4585
 $sub_i_i = $_sroa_0_0_copyload - $position2_sroa_0_0_copyload; //@line 4589
 $sub3_i_i = (copyTempFloat($call + 16 | 0), +HEAPF32[tempDoublePtr >> 2]) - $position2_sroa_1_4_copyload; //@line 4590
 $div_i_i = 1.0 / +Math_sqrt(+($sub_i_i * $sub_i_i + $sub3_i_i * $sub3_i_i)); //@line 4595
 return +(+_fmod(+(+_fmod(+(+Math_atan2(+($sub3_i_i * $div_i_i), +($sub_i_i * $div_i_i)) + 6.283185307179586), 6.283185307179586) + 3.141592653589793), 6.283185307179586) + -3.141592653589793);
}
function _SLLeaper_create($position) {
 $position = $position | 0;
 var $call = 0, $0 = 0, $call2 = 0, $3 = 0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 3415
 tempParam = $position; //@line 3416
 $position = STACKTOP; //@line 3416
 STACKTOP = STACKTOP + 8 | 0; //@line 3416
 HEAP32[$position >> 2] = HEAP32[tempParam >> 2]; //@line 3416
 HEAP32[$position + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 3416
 $call = _aqcreate(1936) | 0; //@line 3417
 $0 = $call; //@line 3418
 __SLLeaper_setPosition($0, $position); //@line 3419
 $call2 = _aqretain(_AQLoop_world() | 0) | 0; //@line 3422
 $3 = $call + 48 | 0; //@line 3425
 HEAP32[$3 >> 2] = $call2; //@line 3426
 _AQList_iterate(HEAP32[$call + 36 >> 2] | 0, 17, $call2) | 0; //@line 3430
 _AQList_iterate(HEAP32[$call + 40 >> 2] | 0, 17, HEAP32[$3 >> 2] | 0) | 0; //@line 3436
 _AQList_iterate(HEAP32[$call + 44 >> 2] | 0, 27, HEAP32[$3 >> 2] | 0) | 0; //@line 3442
 _AQLoop_addUpdater($call); //@line 3443
 HEAP32[$call + 60 >> 2] = 0; //@line 3446
 STACKTOP = sp; //@line 3447
 return $0 | 0; //@line 3447
}
function _AQList_findIndex($_self, $iterator, $ctx) {
 $_self = $_self | 0;
 $iterator = $iterator | 0;
 $ctx = $ctx | 0;
 var $node_04 = 0, $node_07 = 0, $index_06 = 0, $node_0 = 0, $retval_0 = 0, label = 0;
 $node_04 = HEAP32[$_self + 16 >> 2] | 0; //@line 13635
 if (($node_04 | 0) == 0) {
  $retval_0 = -1; //@line 13639
  return $retval_0 | 0; //@line 13641
 } else {
  $index_06 = 0; //@line 13643
  $node_07 = $node_04; //@line 13643
 }
 while (1) {
  if ((FUNCTION_TABLE_iii[$iterator & 31](HEAP32[$node_07 + 8 >> 2] | 0, $ctx) | 0) != 0) {
   $retval_0 = $index_06; //@line 13654
   label = 1341; //@line 13655
   break;
  }
  $node_0 = HEAP32[$node_07 >> 2] | 0; //@line 13660
  if (($node_0 | 0) == 0) {
   $retval_0 = -1; //@line 13664
   label = 1342; //@line 13665
   break;
  } else {
   $index_06 = $index_06 + 1 | 0; //@line 13668
   $node_07 = $node_0; //@line 13668
  }
 }
 if ((label | 0) == 1341) {
  return $retval_0 | 0; //@line 13673
 } else if ((label | 0) == 1342) {
  return $retval_0 | 0; //@line 13677
 }
 return 0; //@line 13679
}
function _AQDdvt_updateParticle($self, $particle, $old, $new) {
 $self = $self | 0;
 $particle = $particle | 0;
 $old = $old | 0;
 $new = $new | 0;
 var tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 10420
 tempParam = $old; //@line 10421
 $old = STACKTOP; //@line 10421
 STACKTOP = STACKTOP + 16 | 0; //@line 10421
 HEAP32[$old >> 2] = HEAP32[tempParam >> 2]; //@line 10421
 HEAP32[$old + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 10421
 HEAP32[$old + 8 >> 2] = HEAP32[tempParam + 8 >> 2]; //@line 10421
 HEAP32[$old + 12 >> 2] = HEAP32[tempParam + 12 >> 2]; //@line 10421
 tempParam = $new; //@line 10422
 $new = STACKTOP; //@line 10422
 STACKTOP = STACKTOP + 16 | 0; //@line 10422
 HEAP32[$new >> 2] = HEAP32[tempParam >> 2]; //@line 10422
 HEAP32[$new + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 10422
 HEAP32[$new + 8 >> 2] = HEAP32[tempParam + 8 >> 2]; //@line 10422
 HEAP32[$new + 12 >> 2] = HEAP32[tempParam + 12 >> 2]; //@line 10422
 __AQDdvt_updateParticle($self, $particle, $old, $new); //@line 10423
 STACKTOP = sp; //@line 10424
 return;
}
function _AQDdvt_done($self) {
 $self = $self | 0;
 var $tl = 0, $0 = 0, $1 = 0, $i_015 = 0, $tr = 0, $bl = 0, $br = 0, $15 = 0;
 $tl = $self + 32 | 0; //@line 7953
 $0 = HEAP32[$tl >> 2] | 0; //@line 7954
 if (($0 | 0) != 0) {
  HEAP32[$tl >> 2] = _aqrelease($0) | 0; //@line 7961
  $tr = $self + 36 | 0; //@line 7962
  HEAP32[$tr >> 2] = _aqrelease(HEAP32[$tr >> 2] | 0) | 0; //@line 7967
  $bl = $self + 40 | 0; //@line 7968
  HEAP32[$bl >> 2] = _aqrelease(HEAP32[$bl >> 2] | 0) | 0; //@line 7973
  $br = $self + 44 | 0; //@line 7974
  HEAP32[$br >> 2] = _aqrelease(HEAP32[$br >> 2] | 0) | 0; //@line 7979
  $15 = $self; //@line 7980
  return $15 | 0; //@line 7981
 }
 $1 = HEAP32[$self + 240 >> 2] | 0; //@line 7984
 if (($1 | 0) > 0) {
  $i_015 = 0; //@line 7988
 } else {
  $15 = $self; //@line 7990
  return $15 | 0; //@line 7991
 }
 do {
  _aqautorelease(HEAP32[$self + 48 + ($i_015 << 2) >> 2] | 0) | 0; //@line 7998
  $i_015 = $i_015 + 1 | 0; //@line 7999
 } while (($i_015 | 0) < ($1 | 0));
 $15 = $self; //@line 8008
 return $15 | 0; //@line 8009
}
function _AQList_indexOf($_self, $item) {
 $_self = $_self | 0;
 $item = $item | 0;
 var $node_04 = 0, $node_07 = 0, $i_06 = 0, $node_0 = 0, $tobool_lcssa = 0, label = 0;
 $node_04 = HEAP32[$_self + 16 >> 2] | 0; //@line 13450
 if (($node_04 | 0) == 0) {
  $tobool_lcssa = -1; //@line 13454
  return $tobool_lcssa | 0; //@line 13456
 } else {
  $i_06 = 0; //@line 13458
  $node_07 = $node_04; //@line 13458
 }
 while (1) {
  if ((HEAP32[$node_07 + 8 >> 2] | 0) == ($item | 0)) {
   $tobool_lcssa = $i_06; //@line 13467
   label = 1321; //@line 13468
   break;
  }
  $node_0 = HEAP32[$node_07 >> 2] | 0; //@line 13473
  if (($node_0 | 0) == 0) {
   $tobool_lcssa = -1; //@line 13477
   label = 1319; //@line 13478
   break;
  } else {
   $i_06 = $i_06 + 1 | 0; //@line 13481
   $node_07 = $node_0; //@line 13481
  }
 }
 if ((label | 0) == 1321) {
  return $tobool_lcssa | 0; //@line 13486
 } else if ((label | 0) == 1319) {
  return $tobool_lcssa | 0; //@line 13490
 }
 return 0; //@line 13492
}
function _SLLeaper_calcPosition($agg_result, $self) {
 $agg_result = $agg_result | 0;
 $self = $self | 0;
 var $bodies = 0, $call = 0, $add_i = 0.0, $add3_i = 0.0, $call_1 = 0, $add_i_1 = 0.0, $add3_i_1 = 0.0, $call_2 = 0, $mul1_i = 0.0;
 $bodies = $self + 36 | 0; //@line 4445
 $call = _AQList_at(HEAP32[$bodies >> 2] | 0, 0) | 0; //@line 4447
 $add_i = +HEAPF32[$call + 12 >> 2] + 0.0; //@line 4454
 $add3_i = +HEAPF32[$call + 16 >> 2] + 0.0; //@line 4455
 $call_1 = _AQList_at(HEAP32[$bodies >> 2] | 0, 1) | 0; //@line 4457
 $add_i_1 = $add_i + +HEAPF32[$call_1 + 12 >> 2]; //@line 4464
 $add3_i_1 = $add3_i + +HEAPF32[$call_1 + 16 >> 2]; //@line 4465
 $call_2 = _AQList_at(HEAP32[$bodies >> 2] | 0, 2) | 0; //@line 4467
 $mul1_i = ($add3_i_1 + +HEAPF32[$call_2 + 16 >> 2]) * .3333333432674408; //@line 4477
 HEAPF32[$agg_result >> 2] = ($add_i_1 + +HEAPF32[$call_2 + 12 >> 2]) * .3333333432674408; //@line 4479
 HEAPF32[$agg_result + 4 >> 2] = $mul1_i; //@line 4481
 return;
}
function _AQDdvt_create($aabb) {
 $aabb = $aabb | 0;
 var $call = 0, $aabb1 = 0, $1 = 0, tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 8017
 tempParam = $aabb; //@line 8018
 $aabb = STACKTOP; //@line 8018
 STACKTOP = STACKTOP + 16 | 0; //@line 8018
 HEAP32[$aabb >> 2] = HEAP32[tempParam >> 2]; //@line 8018
 HEAP32[$aabb + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 8018
 HEAP32[$aabb + 8 >> 2] = HEAP32[tempParam + 8 >> 2]; //@line 8018
 HEAP32[$aabb + 12 >> 2] = HEAP32[tempParam + 12 >> 2]; //@line 8018
 $call = _aqcreate(2400) | 0; //@line 8019
 $aabb1 = $call + 12 | 0; //@line 8021
 $1 = $aabb; //@line 8022
 HEAP32[$aabb1 >> 2] = HEAP32[$1 >> 2]; //@line 8023
 HEAP32[$aabb1 + 4 >> 2] = HEAP32[$1 + 4 >> 2]; //@line 8023
 HEAP32[$aabb1 + 8 >> 2] = HEAP32[$1 + 8 >> 2]; //@line 8023
 HEAP32[$aabb1 + 12 >> 2] = HEAP32[$1 + 12 >> 2]; //@line 8023
 STACKTOP = sp; //@line 8024
 return $call | 0; //@line 8024
}
function _AQDdvt_addParticle($self, $particle) {
 $self = $self | 0;
 $particle = $particle | 0;
 var $aabb = 0, $length_i = 0, $3 = 0, $4 = 0, sp = 0;
 sp = STACKTOP; //@line 8225
 STACKTOP = STACKTOP + 16 | 0; //@line 8225
 $aabb = sp | 0; //@line 8226
 _AQParticle_aabb($aabb, $particle); //@line 8227
 HEAP32[$self + 28 >> 2] = 0; //@line 8229
 do {
  if ((HEAP32[$self + 32 >> 2] | 0) == 0) {
   $length_i = $self + 240 | 0; //@line 8236
   if ((HEAP32[$length_i >> 2] | 0) >= 48) {
    __AQDdvt_toChildren($self); //@line 8241
    break;
   }
   $3 = _aqretain($particle) | 0; //@line 8247
   $4 = HEAP32[$length_i >> 2] | 0; //@line 8248
   HEAP32[$length_i >> 2] = $4 + 1; //@line 8250
   HEAP32[$self + 48 + ($4 << 2) >> 2] = $3; //@line 8252
   STACKTOP = sp; //@line 8254
   return;
  }
 } while (0);
 __AQDdvt_addParticleChild($self, $particle, $aabb); //@line 8257
 STACKTOP = sp; //@line 8258
 return;
}
function _AQList_remove($self, $item) {
 $self = $self | 0;
 $item = $item | 0;
 var $node_04_i = 0, $node_07_i = 0, $i_06_i = 0, $node_0_i = 0, $tobool_lcssa_i = 0;
 $node_04_i = HEAP32[$self + 16 >> 2] | 0; //@line 13503
 L1674 : do {
  if (($node_04_i | 0) == 0) {
   $tobool_lcssa_i = -1; //@line 13508
  } else {
   $i_06_i = 0; //@line 13510
   $node_07_i = $node_04_i; //@line 13510
   while (1) {
    if ((HEAP32[$node_07_i + 8 >> 2] | 0) == ($item | 0)) {
     $tobool_lcssa_i = $i_06_i; //@line 13518
     break L1674;
    }
    $node_0_i = HEAP32[$node_07_i >> 2] | 0; //@line 13523
    if (($node_0_i | 0) == 0) {
     $tobool_lcssa_i = -1; //@line 13527
     break;
    } else {
     $i_06_i = $i_06_i + 1 | 0; //@line 13530
     $node_07_i = $node_0_i; //@line 13530
    }
   }
  }
 } while (0);
 return _AQList_removeAt($self, $tobool_lcssa_i) | 0; //@line 13537
}
function __AQDdvt_fromChildrenIterator($particle, $ctx) {
 $particle = $particle | 0;
 $ctx = $ctx | 0;
 var $0 = 0, $1 = 0, $2 = 0, $index_0_i = 0, $5 = 0, $6 = 0, label = 0;
 $0 = $ctx; //@line 10048
 $1 = $ctx + 240 | 0; //@line 10050
 $2 = HEAP32[$1 >> 2] | 0; //@line 10051
 $index_0_i = 0; //@line 10053
 while (1) {
  if (($index_0_i | 0) >= ($2 | 0)) {
   break;
  }
  if ((HEAP32[$0 + 48 + ($index_0_i << 2) >> 2] | 0) == ($particle | 0)) {
   label = 904; //@line 10067
   break;
  } else {
   $index_0_i = $index_0_i + 1 | 0; //@line 10070
  }
 }
 do {
  if ((label | 0) == 904) {
   if (($index_0_i | 0) == -1) {
    break;
   }
   return;
  }
 } while (0);
 $5 = _aqretain($particle) | 0; //@line 10085
 $6 = HEAP32[$1 >> 2] | 0; //@line 10086
 HEAP32[$1 >> 2] = $6 + 1; //@line 10088
 HEAP32[$0 + 48 + ($6 << 2) >> 2] = $5; //@line 10090
 return;
}
function _AQArray_done($self) {
 $self = $self | 0;
 var $items = 0, $0 = 0, $1 = 0, $2 = 0, $i_05_i = 0, $inc_i = 0, $_pre4 = 0, $5 = 0;
 $items = $self + 20 | 0; //@line 12676
 $0 = HEAP32[$items >> 2] | 0; //@line 12677
 if (($0 | 0) == 0) {
  return $self | 0; //@line 12681
 }
 $1 = HEAP32[$self + 12 >> 2] | 0; //@line 12684
 if (($1 | 0) > 0) {
  $i_05_i = 0; //@line 12688
  $2 = $0; //@line 12688
  while (1) {
   _aqrelease(HEAP32[$2 + ($i_05_i << 2) >> 2] | 0) | 0; //@line 12695
   $inc_i = $i_05_i + 1 | 0; //@line 12696
   $_pre4 = HEAP32[$items >> 2] | 0; //@line 12698
   if (($inc_i | 0) < ($1 | 0)) {
    $i_05_i = $inc_i; //@line 12701
    $2 = $_pre4; //@line 12701
   } else {
    $5 = $_pre4; //@line 12703
    break;
   }
  }
 } else {
  $5 = $0; //@line 12708
 }
 _free($5); //@line 12712
 return $self | 0; //@line 12714
}
function _AQWorld_removeParticle($self, $particle) {
 $self = $self | 0;
 $particle = $particle | 0;
 var $particles = 0, $call = 0, $awakeParticles = 0, $3 = 0, $4 = 0, $call3 = 0;
 _AQDdvt_removeParticle(HEAP32[$self + 28 >> 2] | 0, $particle, $particle + 80 | 0); //@line 12475
 $particles = $self + 32 | 0; //@line 12476
 $call = _AQList_indexOf(HEAP32[$particles >> 2] | 0, $particle | 0) | 0; //@line 12479
 $awakeParticles = $self + 40 | 0; //@line 12480
 $3 = HEAP32[$awakeParticles >> 2] | 0; //@line 12481
 if (($call | 0) >= ($3 | 0)) {
  $4 = HEAP32[$particles >> 2] | 0; //@line 12485
  $call3 = _AQList_removeAt($4, $call) | 0; //@line 12486
  return;
 }
 HEAP32[$awakeParticles >> 2] = $3 - 1; //@line 12490
 $4 = HEAP32[$particles >> 2] | 0; //@line 12492
 $call3 = _AQList_removeAt($4, $call) | 0; //@line 12493
 return;
}
function _AQWorld_init($self) {
 $self = $self | 0;
 var $agg_tmp = 0, $call6 = 0, sp = 0;
 sp = STACKTOP; //@line 11860
 STACKTOP = STACKTOP + 16 | 0; //@line 11860
 $agg_tmp = sp | 0; //@line 11861
 _memset($agg_tmp | 0, 0, 16); //@line 11863
 HEAP32[$self + 28 >> 2] = _aqretain(_AQDdvt_create($agg_tmp) | 0) | 0; //@line 11869
 HEAP32[$self + 32 >> 2] = _aqretain(_aqcreate(2328) | 0) | 0; //@line 11874
 HEAP32[$self + 36 >> 2] = _aqretain(_aqcreate(2328) | 0) | 0; //@line 11879
 $call6 = _aqcollision_pop(0) | 0; //@line 11880
 HEAP32[$self + 48 >> 2] = $call6; //@line 11882
 HEAP32[$self + 52 >> 2] = $call6; //@line 11884
 HEAP32[$self + 40 >> 2] = 0; //@line 11886
 HEAP32[$self + 44 >> 2] = _aqretain(_aqcreate(2328) | 0) | 0; //@line 11891
 STACKTOP = sp; //@line 11892
 return $self | 0; //@line 11892
}
function _memset(ptr, value, num) {
 ptr = ptr | 0;
 value = value | 0;
 num = num | 0;
 var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
 stop = ptr + num | 0; //@line 17899
 if ((num | 0) >= 20) {
  value = value & 255; //@line 17902
  unaligned = ptr & 3; //@line 17903
  value4 = value | value << 8 | value << 16 | value << 24; //@line 17904
  stop4 = stop & ~3; //@line 17905
  if (unaligned) {
   unaligned = ptr + 4 - unaligned | 0; //@line 17907
   while ((ptr | 0) < (unaligned | 0)) {
    HEAP8[ptr] = value; //@line 17909
    ptr = ptr + 1 | 0; //@line 17910
   }
  }
  while ((ptr | 0) < (stop4 | 0)) {
   HEAP32[ptr >> 2] = value4; //@line 17914
   ptr = ptr + 4 | 0; //@line 17915
  }
 }
 while ((ptr | 0) < (stop | 0)) {
  HEAP8[ptr] = value; //@line 17919
  ptr = ptr + 1 | 0; //@line 17920
 }
}
function _aqautorelease($self) {
 $self = $self | 0;
 var $0 = 0, $call_i = 0, $headNode_i = 0, $tailNode4_i = 0;
 $0 = HEAP32[768] | 0; //@line 13956
 if (($0 | 0) == 0) {
  return $self | 0; //@line 13960
 }
 $call_i = _malloc(8) | 0; //@line 13963
 HEAP32[$call_i >> 2] = $self; //@line 13965
 HEAP32[$call_i + 4 >> 2] = 0; //@line 13968
 $headNode_i = $0 + 12 | 0; //@line 13969
 $tailNode4_i = $0 + 16 | 0; //@line 13973
 if ((HEAP32[$headNode_i >> 2] | 0) == 0) {
  HEAP32[$tailNode4_i >> 2] = $call_i; //@line 13977
  HEAP32[$headNode_i >> 2] = $call_i; //@line 13980
  return $self | 0; //@line 13982
 } else {
  HEAP32[(HEAP32[$tailNode4_i >> 2] | 0) + 4 >> 2] = $call_i; //@line 13988
  HEAP32[$tailNode4_i >> 2] = $call_i; //@line 13990
  return $self | 0; //@line 13991
 }
 return 0; //@line 13993
}
function _memcpy(dest, src, num) {
 dest = dest | 0;
 src = src | 0;
 num = num | 0;
 var ret = 0;
 ret = dest | 0; //@line 17926
 if ((dest & 3) == (src & 3)) {
  while (dest & 3) {
   if ((num | 0) == 0) return ret | 0; //@line 17929
   HEAP8[dest] = HEAP8[src] | 0; //@line 17930
   dest = dest + 1 | 0; //@line 17931
   src = src + 1 | 0; //@line 17932
   num = num - 1 | 0; //@line 17933
  }
  while ((num | 0) >= 4) {
   HEAP32[dest >> 2] = HEAP32[src >> 2]; //@line 17936
   dest = dest + 4 | 0; //@line 17937
   src = src + 4 | 0; //@line 17938
   num = num - 4 | 0; //@line 17939
  }
 }
 while ((num | 0) > 0) {
  HEAP8[dest] = HEAP8[src] | 0; //@line 17943
  dest = dest + 1 | 0; //@line 17944
  src = src + 1 | 0; //@line 17945
  num = num - 1 | 0; //@line 17946
 }
 return ret | 0; //@line 17948
}
function _AQView_removeFromList($list, $object) {
 $list = $list | 0;
 $object = $object | 0;
 var $object_tr_lcssa = 0, $object_tr9 = 0, $call2 = 0, $call6 = 0;
 L709 : do {
  if ((_aqcast($object, 2096) | 0) == 0) {
   $object_tr9 = $object; //@line 7300
   while (1) {
    $call2 = _aqcast($object_tr9, 2080) | 0; //@line 7303
    if (($call2 | 0) == 0) {
     break;
    }
    $call6 = FUNCTION_TABLE_ii[HEAP32[$call2 + 4 >> 2] & 63]($object_tr9) | 0; //@line 7312
    if ((_aqcast($call6, 2096) | 0) == 0) {
     $object_tr9 = $call6; //@line 7317
    } else {
     $object_tr_lcssa = $call6; //@line 7319
     break L709;
    }
   }
   return;
  } else {
   $object_tr_lcssa = $object; //@line 7325
  }
 } while (0);
 _AQList_remove($list, $object_tr_lcssa) | 0; //@line 7330
 return;
}
function _AQWorld_wakeParticle($self, $particle) {
 $self = $self | 0;
 $particle = $particle | 0;
 var $particles = 0, $call = 0, $awakeParticles = 0, $3 = 0, $call3 = 0;
 $particles = $self + 32 | 0; //@line 12179
 $call = _AQList_indexOf(HEAP32[$particles >> 2] | 0, $particle | 0) | 0; //@line 12182
 $awakeParticles = $self + 40 | 0; //@line 12183
 if (($call | 0) > (HEAP32[$awakeParticles >> 2] | 0)) {
  $3 = HEAP32[$particles >> 2] | 0; //@line 12188
  $call3 = _AQList_removeAt($3, $call) | 0; //@line 12189
  _AQList_unshift($3, $call3) | 0; //@line 12190
  HEAP32[$awakeParticles >> 2] = (HEAP32[$awakeParticles >> 2] | 0) + 1; //@line 12193
 }
 _AQDdvt_wakeParticle(HEAP32[$self + 28 >> 2] | 0, $particle); //@line 12198
 _AQParticle_wake($particle); //@line 12199
 return;
}
function _AQView_addToList($list, $object) {
 $list = $list | 0;
 $object = $object | 0;
 var $object_tr_lcssa = 0, $object_tr9 = 0, $call2 = 0, $call6 = 0;
 L701 : do {
  if ((_aqcast($object, 2096) | 0) == 0) {
   $object_tr9 = $object; //@line 7254
   while (1) {
    $call2 = _aqcast($object_tr9, 2080) | 0; //@line 7257
    if (($call2 | 0) == 0) {
     break;
    }
    $call6 = FUNCTION_TABLE_ii[HEAP32[$call2 + 4 >> 2] & 63]($object_tr9) | 0; //@line 7266
    if ((_aqcast($call6, 2096) | 0) == 0) {
     $object_tr9 = $call6; //@line 7271
    } else {
     $object_tr_lcssa = $call6; //@line 7273
     break L701;
    }
   }
   return;
  } else {
   $object_tr_lcssa = $object; //@line 7279
  }
 } while (0);
 _AQList_push($list, $object_tr_lcssa) | 0; //@line 7284
 return;
}
function _calloc($n_elements, $elem_size) {
 $n_elements = $n_elements | 0;
 $elem_size = $elem_size | 0;
 var $mul = 0, $req_0 = 0, $call = 0;
 do {
  if (($n_elements | 0) == 0) {
   $req_0 = 0; //@line 17862
  } else {
   $mul = Math_imul($elem_size, $n_elements) | 0; //@line 17864
   if (($elem_size | $n_elements) >>> 0 <= 65535) {
    $req_0 = $mul; //@line 17868
    break;
   }
   $req_0 = (($mul >>> 0) / ($n_elements >>> 0) | 0 | 0) == ($elem_size | 0) ? $mul : -1; //@line 17874
  }
 } while (0);
 $call = _malloc($req_0) | 0; //@line 17878
 if (($call | 0) == 0) {
  return $call | 0; //@line 17881
 }
 if ((HEAP32[$call - 4 >> 2] & 3 | 0) == 0) {
  return $call | 0; //@line 17889
 }
 _memset($call | 0, 0, $req_0 | 0); //@line 17891
 return $call | 0; //@line 17892
}
function _AQLoop_step($dt) {
 $dt = +$dt;
 var $0 = 0, $onceFunctions = 0, $node_06_i = 0, $3 = 0;
 $0 = HEAP32[794] | 0; //@line 5446
 _SLUpdater_iterateList(HEAP32[$0 + 16 >> 2] | 0, $dt); //@line 5449
 $onceFunctions = $0 + 20 | 0; //@line 5450
 $node_06_i = HEAP32[$onceFunctions >> 2] | 0; //@line 5453
 do {
  $3 = HEAP32[$node_06_i >> 2] | 0; //@line 5457
  if (($3 | 0) == 0) {
   break;
  }
  FUNCTION_TABLE_vi[$3 & 31](HEAP32[$node_06_i + 4 >> 2] | 0); //@line 5464
  $node_06_i = HEAP32[$node_06_i + 8 >> 2] | 0; //@line 5466
 } while (($node_06_i | 0) != 0);
 HEAP32[HEAP32[$onceFunctions >> 2] >> 2] = 0; //@line 5477
 HEAP32[$0 + 24 >> 2] = HEAP32[$onceFunctions >> 2]; //@line 5480
 _AQWorld_step(HEAP32[$0 + 12 >> 2] | 0, $dt); //@line 5483
 return;
}
function _AQList_iterate($_self, $iterator, $ctx) {
 $_self = $_self | 0;
 $iterator = $iterator | 0;
 $ctx = $ctx | 0;
 var $1 = 0, $node_04_i = 0, $node_09_i = 0, $n_addr_08_i = 0;
 $1 = HEAP32[$_self + 12 >> 2] | 0; //@line 13549
 $node_04_i = HEAP32[$_self + 16 >> 2] | 0; //@line 13552
 if (($node_04_i | 0) == 0 | ($1 | 0) == 0) {
  return $_self | 0; //@line 13558
 } else {
  $n_addr_08_i = $1; //@line 13560
  $node_09_i = $node_04_i; //@line 13560
 }
 do {
  $n_addr_08_i = $n_addr_08_i - 1 | 0; //@line 13565
  FUNCTION_TABLE_vii[$iterator & 63](HEAP32[$node_09_i + 8 >> 2] | 0, $ctx); //@line 13568
  $node_09_i = HEAP32[$node_09_i >> 2] | 0; //@line 13570
 } while (!(($node_09_i | 0) == 0 | ($n_addr_08_i | 0) == 0));
 return $_self | 0; //@line 13581
}
function _SLParticleView_draw($_self) {
 $_self = $_self | 0;
 var $0 = 0, $vertices2_pre = 0, $2 = 0, $4 = 0, $_pre_phi = 0;
 $0 = $_self + 12 | 0; //@line 5494
 $vertices2_pre = $_self + 36 | 0; //@line 5497
 if ((HEAP32[$0 >> 2] | 0) == 0) {
  $_pre_phi = $_self + 12582756 | 0; //@line 5503
 } else {
  $2 = $_self + 12582756 | 0; //@line 5507
  HEAP32[$2 >> 2] = $vertices2_pre; //@line 5508
  $4 = HEAP32[$_self + 20 >> 2] | 0; //@line 5511
  _AQList_iterate($4, 26, $_self) | 0; //@line 5512
  HEAP32[$0 >> 2] = 0; //@line 5513
  $_pre_phi = $2; //@line 5515
 }
 _AQShaders_useProgram(1); //@line 5518
 _AQShaders_draw(HEAP32[$_self + 32 >> 2] | 0, $vertices2_pre, (HEAP32[$_pre_phi >> 2] | 0) - $vertices2_pre | 0); //@line 5526
 return;
}
function _aqangle_diff($a, $b) {
 $a = +$a;
 $b = +$b;
 var $sub = 0.0, $sub7 = 0.0, $v_0 = 0.0, $v_1 = 0.0, $conv = 0.0;
 $sub = +_fmod(+($a + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 3458
 $sub7 = +_fmod(+($sub - (+_fmod(+($b + 3.141592653589793), 6.283185307179586) + -3.141592653589793) + 3.141592653589793), 6.283185307179586) + -3.141592653589793; //@line 3465
 if ($sub7 < -3.141592653589793) {
  $v_0 = $sub7 + 6.283185307179586; //@line 3471
 } else {
  $v_0 = $sub7; //@line 3473
 }
 if ($v_0 <= 3.141592653589793) {
  $v_1 = $v_0; //@line 3479
  $conv = $v_1; //@line 3481
  return +$conv;
 }
 $v_1 = $v_0 + -6.283185307179586; //@line 3486
 $conv = $v_1; //@line 3488
 return +$conv;
}
function _AQList_iterateN($_self, $n, $iterator, $ctx) {
 $_self = $_self | 0;
 $n = $n | 0;
 $iterator = $iterator | 0;
 $ctx = $ctx | 0;
 var $node_04 = 0, $node_09 = 0, $n_addr_08 = 0;
 $node_04 = HEAP32[$_self + 16 >> 2] | 0; //@line 13594
 if (($node_04 | 0) == 0 | ($n | 0) == 0) {
  return $_self | 0; //@line 13600
 } else {
  $n_addr_08 = $n; //@line 13602
  $node_09 = $node_04; //@line 13602
 }
 do {
  $n_addr_08 = $n_addr_08 - 1 | 0; //@line 13607
  FUNCTION_TABLE_vii[$iterator & 63](HEAP32[$node_09 + 8 >> 2] | 0, $ctx); //@line 13610
  $node_09 = HEAP32[$node_09 >> 2] | 0; //@line 13612
 } while (!(($node_09 | 0) == 0 | ($n_addr_08 | 0) == 0));
 return $_self | 0; //@line 13623
}
function _AQStick_create($a, $b) {
 $a = $a | 0;
 $b = $b | 0;
 var $call = 0, $3 = 0, $call3 = 0, $7 = 0, $sub_i = 0.0, $sub3_i = 0.0;
 $call = _aqcreate(2128) | 0; //@line 11817
 $3 = $call + 12 | 0; //@line 11823
 HEAP32[$3 >> 2] = _aqretain($a) | 0; //@line 11824
 $call3 = _aqretain($b) | 0; //@line 11826
 HEAP32[$call + 16 >> 2] = $call3; //@line 11830
 $7 = HEAP32[$3 >> 2] | 0; //@line 11831
 $sub_i = +HEAPF32[$7 + 12 >> 2] - +HEAPF32[$call3 + 12 >> 2]; //@line 11842
 $sub3_i = +HEAPF32[$7 + 16 >> 2] - +HEAPF32[$call3 + 16 >> 2]; //@line 11843
 HEAPF64[$call + 24 >> 3] = +Math_sqrt(+($sub_i * $sub_i + $sub3_i * $sub3_i)); //@line 11851
 return $call | 0; //@line 11852
}
function _SLParticleView_update($_self, $dt) {
 $_self = $_self | 0;
 $dt = +$dt;
 var $4 = 0, $conv = 0.0, $conv1 = 0.0, $conv9 = 0.0;
 HEAP32[$_self + 12 >> 2] = 1; //@line 5538
 $4 = $_self + 16 | 0; //@line 5546
 $conv = +HEAPF32[$4 >> 2]; //@line 5548
 if ((HEAP32[(HEAP32[$_self + 24 >> 2] | 0) + 84 >> 2] | 0) < 1024) {
  $conv1 = $conv + -.1; //@line 5552
  HEAPF32[$4 >> 2] = $conv1; //@line 5553
  if ($conv1 >= 0.0) {
   return;
  }
  HEAPF32[$4 >> 2] = 127.0; //@line 5559
  return;
 } else {
  $conv9 = $conv + .1; //@line 5564
  HEAPF32[$4 >> 2] = $conv9; //@line 5565
  if ($conv9 <= 128.0) {
   return;
  }
  HEAPF32[$4 >> 2] = 0.0; //@line 5571
  return;
 }
}
function _aqcollision_iterate($col, $iterator, $ctx) {
 $col = $col | 0;
 $iterator = $iterator | 0;
 $ctx = $ctx | 0;
 var $col_addr_05 = 0, $1 = 0, label = 0;
 if (($col | 0) == 0) {
  return;
 } else {
  $col_addr_05 = $col; //@line 7904
 }
 while (1) {
  if ((HEAP32[$col_addr_05 >> 2] | 0) == 0) {
   label = 635; //@line 7912
   break;
  }
  FUNCTION_TABLE_vii[$iterator & 63]($col_addr_05, $ctx); //@line 7915
  $1 = HEAP32[$col_addr_05 + 20 >> 2] | 0; //@line 7917
  if (($1 | 0) == 0) {
   label = 637; //@line 7921
   break;
  } else {
   $col_addr_05 = $1; //@line 7924
  }
 }
 if ((label | 0) == 635) {
  return;
 } else if ((label | 0) == 637) {
  return;
 }
}
function _AQDdvt_removeParticle($self, $particle, $aabb) {
 $self = $self | 0;
 $particle = $particle | 0;
 $aabb = $aabb | 0;
 var tempParam = 0, sp = 0;
 sp = STACKTOP; //@line 10394
 tempParam = $aabb; //@line 10395
 $aabb = STACKTOP; //@line 10395
 STACKTOP = STACKTOP + 16 | 0; //@line 10395
 HEAP32[$aabb >> 2] = HEAP32[tempParam >> 2]; //@line 10395
 HEAP32[$aabb + 4 >> 2] = HEAP32[tempParam + 4 >> 2]; //@line 10395
 HEAP32[$aabb + 8 >> 2] = HEAP32[tempParam + 8 >> 2]; //@line 10395
 HEAP32[$aabb + 12 >> 2] = HEAP32[tempParam + 12 >> 2]; //@line 10395
 __AQDdvt_removeParticle($self, $particle, $aabb); //@line 10396
 STACKTOP = sp; //@line 10397
 return;
}
function _AQCamera_init($self) {
 $self = $self | 0;
 var $0 = 0, $1 = 0;
 $0 = $self + 12 | 0; //@line 575
 HEAPF32[$self + 12 >> 2] = 1.0; //@line 577
 HEAPF32[$self + 16 >> 2] = 1.0; //@line 579
 HEAPF32[$self + 20 >> 2] = 0.0; //@line 581
 HEAPF32[$self + 24 >> 2] = 0.0; //@line 583
 $1 = $self + 28 | 0; //@line 585
 HEAP32[$1 >> 2] = HEAP32[$0 >> 2]; //@line 586
 HEAP32[$1 + 4 >> 2] = HEAP32[$0 + 4 >> 2]; //@line 586
 HEAP32[$1 + 8 >> 2] = HEAP32[$0 + 8 >> 2]; //@line 586
 HEAP32[$1 + 12 >> 2] = HEAP32[$0 + 12 >> 2]; //@line 586
 HEAPF32[$self + 44 >> 2] = 0.0; //@line 588
 return $self | 0; //@line 589
}
function _aqrelease($self) {
 $self = $self | 0;
 var $0 = 0, $dec = 0, $retval_0 = 0;
 if (($self | 0) == 0) {
  $retval_0 = 0; //@line 13861
  return $retval_0 | 0; //@line 13863
 }
 $0 = $self + 4 | 0; //@line 13866
 $dec = (HEAP32[$0 >> 2] | 0) - 1 | 0; //@line 13868
 HEAP32[$0 >> 2] = $dec; //@line 13869
 if (($dec | 0) != 0) {
  $retval_0 = $self; //@line 13873
  return $retval_0 | 0; //@line 13875
 }
 HEAP32[$0 >> 2] = 0; //@line 13877
 _free(FUNCTION_TABLE_ii[HEAP32[(HEAP32[$self >> 2] | 0) + 16 >> 2] & 63]($self) | 0); //@line 13883
 $retval_0 = 0; //@line 13885
 return $retval_0 | 0; //@line 13887
}
function _AQParticle_aabb($agg_result, $self) {
 $agg_result = $agg_result | 0;
 $self = $self | 0;
 var $0 = 0.0, $position_0_val = 0.0, $position_1_val = 0.0;
 $0 = +HEAPF32[$self + 20 >> 2]; //@line 10648
 $position_0_val = +HEAPF32[$self + 12 >> 2]; //@line 10650
 $position_1_val = +HEAPF32[$self + 16 >> 2]; //@line 10652
 HEAPF32[$agg_result >> 2] = $0 + $position_1_val; //@line 10658
 HEAPF32[$agg_result + 4 >> 2] = $0 + $position_0_val; //@line 10660
 HEAPF32[$agg_result + 8 >> 2] = $position_1_val - $0; //@line 10662
 HEAPF32[$agg_result + 12 >> 2] = $position_0_val - $0; //@line 10664
 return;
}
function _aqcollision_clear($col) {
 $col = $col | 0;
 var $col_addr_05 = 0, $a = 0, $1 = 0, label = 0;
 if (($col | 0) == 0) {
  return;
 } else {
  $col_addr_05 = $col; //@line 7714
 }
 while (1) {
  $a = $col_addr_05 | 0; //@line 7718
  if ((HEAP32[$a >> 2] | 0) == 0) {
   label = 610; //@line 7722
   break;
  }
  HEAP32[$a >> 2] = 0; //@line 7725
  $1 = HEAP32[$col_addr_05 + 20 >> 2] | 0; //@line 7727
  if (($1 | 0) == 0) {
   label = 608; //@line 7731
   break;
  } else {
   $col_addr_05 = $1; //@line 7734
  }
 }
 if ((label | 0) == 608) {
  return;
 } else if ((label | 0) == 610) {
  return;
 }
}
function _ColorShader_draw($buffer, $data, $bytes) {
 $buffer = $buffer | 0;
 $data = $data | 0;
 $bytes = $bytes | 0;
 if ((HEAP32[775] | 0) != 0) {
  _glUniformMatrix4fv(HEAP32[774] | 0, 1, 0, 2560); //@line 6017
  HEAP32[775] = 0; //@line 6018
 }
 _glBindBuffer(34962, $buffer | 0); //@line 6021
 _glBufferData(34962, $bytes | 0, $data | 0, 35048); //@line 6022
 _glVertexAttribPointer(HEAP32[772] | 0, 2, 5126, 0, 12, 0); //@line 6024
 _glVertexAttribPointer(HEAP32[773] | 0, 4, 5121, 1, 12, 8); //@line 6026
 _glDrawArrays(4, 0, ($bytes >>> 0) / 12 | 0 | 0); //@line 6028
 return;
}
function _SLParticleView_addAmbientParticle($particle) {
 $particle = $particle | 0;
 var $0 = 0, $1 = 0, $2 = 0, $particles_i = 0, $4 = 0;
 $0 = HEAP32[914] | 0; //@line 5832
 if (($0 | 0) == 0) {
  $1 = _aqretain(_aqcreate(1888) | 0) | 0; //@line 5838
  HEAP32[914] = $1; //@line 5839
  $2 = $1; //@line 5841
 } else {
  $2 = $0; //@line 5843
 }
 $particles_i = $2 + 20 | 0; //@line 5846
 $4 = $particle | 0; //@line 5848
 if ((_AQList_indexOf(HEAP32[$particles_i >> 2] | 0, $4) | 0) != -1) {
  return;
 }
 _AQList_push(HEAP32[$particles_i >> 2] | 0, $4) | 0; //@line 5856
 return;
}
function _AQReleasePool_init($self) {
 $self = $self | 0;
 var $2 = 0, $3 = 0;
 HEAP32[$self + 12 >> 2] = 0; //@line 14040
 HEAP32[$self + 16 >> 2] = 0; //@line 14042
 HEAP32[$self + 20 >> 2] = 0; //@line 14044
 HEAP32[$self + 24 >> 2] = HEAP32[768]; //@line 14048
 $2 = HEAP32[768] | 0; //@line 14049
 if (($2 | 0) == 0) {
  $3 = $self | 0; //@line 14053
  HEAP32[768] = $3; //@line 14054
  return $3 | 0; //@line 14055
 }
 HEAP32[$2 + 20 >> 2] = $self; //@line 14059
 $3 = $self | 0; //@line 14061
 HEAP32[768] = $3; //@line 14062
 return $3 | 0; //@line 14063
}
function copyTempDouble(ptr) {
 ptr = ptr | 0;
 HEAP8[tempDoublePtr] = HEAP8[ptr]; //@line 32
 HEAP8[tempDoublePtr + 1 | 0] = HEAP8[ptr + 1 | 0]; //@line 33
 HEAP8[tempDoublePtr + 2 | 0] = HEAP8[ptr + 2 | 0]; //@line 34
 HEAP8[tempDoublePtr + 3 | 0] = HEAP8[ptr + 3 | 0]; //@line 35
 HEAP8[tempDoublePtr + 4 | 0] = HEAP8[ptr + 4 | 0]; //@line 36
 HEAP8[tempDoublePtr + 5 | 0] = HEAP8[ptr + 5 | 0]; //@line 37
 HEAP8[tempDoublePtr + 6 | 0] = HEAP8[ptr + 6 | 0]; //@line 38
 HEAP8[tempDoublePtr + 7 | 0] = HEAP8[ptr + 7 | 0]; //@line 39
}
function __SLAsteroidGroupView_draw($self) {
 $self = $self | 0;
 var $arraydecay = 0, $currentVertex = 0;
 $arraydecay = $self + 20 | 0; //@line 367
 $currentVertex = $self + 786440 | 0; //@line 368
 HEAP32[$currentVertex >> 2] = $arraydecay; //@line 369
 _AQList_iterate(HEAP32[$self + 12 >> 2] | 0, 24, $self) | 0; //@line 373
 _AQShaders_useProgram(1); //@line 374
 _AQShaders_draw(HEAP32[$self + 16 >> 2] | 0, $arraydecay, (HEAP32[$currentVertex >> 2] | 0) - $arraydecay | 0); //@line 382
 return;
}
function _aqcastptr($obj, $id) {
 $obj = $obj | 0;
 $id = $id | 0;
 var $call = 0, $call_i = 0, $retval_0 = 0;
 $call = _aqcast($obj, $id) | 0; //@line 12944
 if (($call | 0) == 0) {
  $retval_0 = 0; //@line 12948
  return $retval_0 | 0; //@line 12950
 }
 $call_i = _aqcreate(2352) | 0; //@line 12953
 HEAP32[$call_i + 12 >> 2] = _aqretain($obj) | 0; //@line 12959
 HEAP32[$call_i + 16 >> 2] = $call; //@line 12962
 $retval_0 = $call_i; //@line 12964
 return $retval_0 | 0; //@line 12966
}
function __SLUpdate_iterator($object, $ctx) {
 $object = $object | 0;
 $ctx = $ctx | 0;
 var $0 = 0, $call = 0, $2 = 0;
 $0 = $object; //@line 7173
 $call = _aqcast($0, 1856) | 0; //@line 7174
 if (($call | 0) == 0) {
  ___assert_fail(352, 1272, 9, 1648); //@line 7178
 }
 $2 = HEAP32[$call + 4 >> 2] | 0; //@line 7183
 if (($2 | 0) == 0) {
  ___assert_fail(352, 1272, 9, 1648); //@line 7187
 } else {
  FUNCTION_TABLE_vif[$2 & 31]($0, +HEAPF32[$ctx >> 2]); //@line 7192
  return;
 }
}
function _AQLoop_init($self) {
 $self = $self | 0;
 var $call_i = 0, $2 = 0;
 HEAP32[$self + 12 >> 2] = _aqinit(_aqalloc(2056) | 0) | 0; //@line 5309
 HEAP32[$self + 16 >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 5314
 $call_i = _malloc(12) | 0; //@line 5315
 $2 = $call_i; //@line 5316
 _memset($call_i | 0, 0, 12); //@line 5317
 HEAP32[$self + 20 >> 2] = $2; //@line 5319
 HEAP32[$self + 24 >> 2] = $2; //@line 5321
 return $self | 0; //@line 5322
}
function _AQWorld_addConstraint($self, $_constraint) {
 $self = $self | 0;
 $_constraint = $_constraint | 0;
 var $call = 0;
 $call = _aqcastptr($_constraint, 2424) | 0; //@line 12503
 if (($call | 0) == 0) {
  return;
 }
 FUNCTION_TABLE_vii[HEAP32[(HEAP32[$call + 16 >> 2] | 0) + 4 >> 2] & 63](HEAP32[$call + 12 >> 2] | 0, $self); //@line 12518
 _AQList_push(HEAP32[$self + 36 >> 2] | 0, $call | 0) | 0; //@line 12522
 return;
}
function _AQWorld_removeConstraint($self, $_constraint) {
 $self = $self | 0;
 $_constraint = $_constraint | 0;
 var $constraints = 0, $call = 0;
 $constraints = $self + 36 | 0; //@line 12547
 $call = _AQList_findIndex(HEAP32[$constraints >> 2] | 0, 26, $_constraint) | 0; //@line 12549
 if (($call | 0) == -1) {
  return;
 }
 _AQList_removeAt(HEAP32[$constraints >> 2] | 0, $call) | 0; //@line 12556
 return;
}
function __SLLeaper_view($self) {
 $self = $self | 0;
 var $view = 0, $0 = 0, $1 = 0, $2 = 0;
 $view = $self + 96 | 0; //@line 1363
 $0 = HEAP32[$view >> 2] | 0; //@line 1364
 if (($0 | 0) != 0) {
  $2 = $0; //@line 1368
  return $2 | 0; //@line 1370
 }
 $1 = _SLLeaperView_create($self) | 0; //@line 1373
 HEAP32[$view >> 2] = $1; //@line 1374
 $2 = $1; //@line 1376
 return $2 | 0; //@line 1378
}
function _SLAmbientParticle_startPulse($self) {
 $self = $self | 0;
 var $contactPulseValue = 0, $0 = 0;
 $contactPulseValue = $self + 12 | 0; //@line 119
 $0 = HEAP32[$contactPulseValue >> 2] | 0; //@line 120
 if (($0 | 0) == 0) {
  HEAP32[$contactPulseValue >> 2] = 20; //@line 124
  return;
 }
 if (($0 | 0) >= 15) {
  return;
 }
 HEAP32[$contactPulseValue >> 2] = 15; //@line 133
 return;
}
function _AQDdvt_wakeParticle($self, $particle) {
 $self = $self | 0;
 $particle = $particle | 0;
 var $aabb = 0, sp = 0;
 sp = STACKTOP; //@line 10405
 STACKTOP = STACKTOP + 16 | 0; //@line 10405
 $aabb = sp | 0; //@line 10406
 _AQParticle_aabb($aabb, $particle); //@line 10407
 __AQDdvt_wakeParticle($self, $particle, $aabb); //@line 10408
 STACKTOP = sp; //@line 10409
 return;
}
function _AQInput_screenToWorld($x, $y, $wx, $wy) {
 $x = +$x;
 $y = +$y;
 $wx = $wx | 0;
 $wy = $wy | 0;
 var $2 = 0.0, $5 = 0.0;
 $2 = +HEAPF32[787]; //@line 12622
 HEAPF32[$wx >> 2] = $2 + $x / +HEAPF32[790] * (+HEAPF32[785] - $2); //@line 12626
 $5 = +HEAPF32[786]; //@line 12630
 HEAPF32[$wy >> 2] = $5 + $y / +HEAPF32[791] * (+HEAPF32[784] - $5); //@line 12634
 return;
}
function _AQRenderer_draw() {
 _glClearColor(+.03921568766236305, +.08627451211214066, +.12156862765550613, +1.0); //@line 5948
 _glClear(16384); //@line 5949
 _AQCamera_setGlMatrix(HEAP32[(HEAP32[792] | 0) + 12 >> 2] | 0, 2152) | 0; //@line 5953
 _AQShaders_setMatrix(2152); //@line 5954
 _AQView_iterateList(HEAP32[(HEAP32[792] | 0) + 16 >> 2] | 0); //@line 5958
 return;
}
function _aqcast($self, $interface) {
 $self = $self | 0;
 $interface = $interface | 0;
 var $retval_0 = 0;
 if (($self | 0) == 0) {
  $retval_0 = 0; //@line 14005
  return $retval_0 | 0; //@line 14007
 }
 $retval_0 = FUNCTION_TABLE_iii[HEAP32[(HEAP32[$self >> 2] | 0) + 20 >> 2] & 31]($self, $interface) | 0; //@line 14016
 return $retval_0 | 0; //@line 14018
}
function _SLAsteroid_done($_self) {
 $_self = $_self | 0;
 var $1 = 0, $3 = 0;
 $1 = $_self + 32 | 0; //@line 257
 $3 = $_self + 28 | 0; //@line 260
 _AQList_iterate(HEAP32[$1 >> 2] | 0, 25, HEAP32[$3 >> 2] | 0) | 0; //@line 263
 _aqrelease(HEAP32[$3 >> 2] | 0) | 0; //@line 266
 _aqrelease(HEAP32[$1 >> 2] | 0) | 0; //@line 269
 return $_self | 0; //@line 270
}
function _AQNumber_asInt($_self) {
 $_self = $_self | 0;
 var $call = 0, $retval_0 = 0;
 $call = _aqcast($_self, 2288) | 0; //@line 13749
 if (($call | 0) == 0) {
  $retval_0 = 0; //@line 13753
  return $retval_0 | 0; //@line 13755
 }
 $retval_0 = FUNCTION_TABLE_ii[HEAP32[$call + 4 >> 2] & 63]($_self) | 0; //@line 13762
 return $retval_0 | 0; //@line 13764
}
function _AQArray_atIndex($self, $index) {
 $self = $self | 0;
 $index = $index | 0;
 var $retval_0 = 0;
 if ((HEAP32[$self + 12 >> 2] | 0) <= ($index | 0)) {
  $retval_0 = 0; //@line 12728
  return $retval_0 | 0; //@line 12730
 }
 $retval_0 = HEAP32[(HEAP32[$self + 20 >> 2] | 0) + ($index << 2) >> 2] | 0; //@line 12737
 return $retval_0 | 0; //@line 12739
}
function _SLParticleView_init($_self) {
 $_self = $_self | 0;
 HEAP32[$_self + 12 >> 2] = 1; //@line 5584
 HEAP32[$_self + 20 >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 5590
 HEAP32[$_self + 24 >> 2] = 0; //@line 5593
 HEAP32[$_self + 28 >> 2] = 0; //@line 5596
 _glGenBuffers(1, $_self + 32 | 0); //@line 5599
 return $_self | 0; //@line 5600
}
function _SLUpdater_iterateList($list, $dt) {
 $list = $list | 0;
 $dt = +$dt;
 var $dt_addr = 0, sp = 0;
 sp = STACKTOP; //@line 7220
 STACKTOP = STACKTOP + 8 | 0; //@line 7220
 $dt_addr = sp | 0; //@line 7221
 HEAPF32[$dt_addr >> 2] = $dt; //@line 7222
 _AQList_iterate($list, 28, $dt_addr) | 0; //@line 7224
 STACKTOP = sp; //@line 7225
 return;
}
function _AQParticle_init($self) {
 $self = $self | 0;
 _memset($self + 12 | 0, 0, 116); //@line 10583
 HEAPF32[$self + 20 >> 2] = 1.0; //@line 10585
 HEAPF32[$self + 28 >> 2] = 1.0; //@line 10587
 HEAPF32[$self + 32 >> 2] = 9999999747378752.0e-21; //@line 10589
 HEAPF32[$self + 36 >> 2] = .5; //@line 10591
 return $self | 0; //@line 10593
}
function _SLLeaper_getInterface($self, $interfaceId) {
 $self = $self | 0;
 $interfaceId = $interfaceId | 0;
 var $retval_0 = 0;
 if (($interfaceId | 0) == 2080) {
  $retval_0 = 1776; //@line 3373
  return $retval_0 | 0; //@line 3375
 }
 $retval_0 = ($interfaceId | 0) == 1856 ? 1792 : 0; //@line 3380
 return $retval_0 | 0; //@line 3382
}
function _SLParticleView_getAmbientParticleView() {
 var $0 = 0, $1 = 0, $2 = 0;
 $0 = HEAP32[914] | 0; //@line 5809
 if (($0 | 0) != 0) {
  $2 = $0; //@line 5813
  return $2 | 0; //@line 5815
 }
 $1 = _aqretain(_aqcreate(1888) | 0) | 0; //@line 5819
 HEAP32[914] = $1; //@line 5820
 $2 = $1; //@line 5822
 return $2 | 0; //@line 5824
}
function _AQWorld_done($self) {
 $self = $self | 0;
 _aqrelease(HEAP32[$self + 28 >> 2] | 0) | 0; //@line 11903
 _aqrelease(HEAP32[$self + 32 >> 2] | 0) | 0; //@line 11907
 _aqrelease(HEAP32[$self + 36 >> 2] | 0) | 0; //@line 11911
 _aqcollision_done(HEAP32[$self + 48 >> 2] | 0) | 0; //@line 11914
 return $self | 0; //@line 11915
}
function _SLCameraController_init($self) {
 $self = $self | 0;
 _memset($self + 12 | 0, 0, 36); //@line 1025
 HEAPF32[$self + 36 >> 2] = 1.0; //@line 1027
 HEAPF32[$self + 40 >> 2] = 100.0; //@line 1029
 HEAPF32[$self + 44 >> 2] = 1.0; //@line 1031
 HEAPF32[$self + 48 >> 2] = 80.0; //@line 1033
 return $self | 0; //@line 1034
}
function _SLAsteroidGroupView_init($self) {
 $self = $self | 0;
 var $asteroids = 0;
 $asteroids = $self + 12 | 0; //@line 391
 _memset($asteroids | 0, 0, 786432); //@line 393
 HEAP32[$asteroids >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 397
 _glGenBuffers(1, $self + 16 | 0); //@line 399
 return $self | 0; //@line 400
}
function _AQInput_getTouches() {
 var $0 = 0, $1 = 0, $2 = 0;
 $0 = HEAP32[788] | 0; //@line 12642
 if (($0 | 0) != 0) {
  $2 = $0; //@line 12646
  return $2 | 0; //@line 12648
 }
 $1 = _aqinit(_aqalloc(2464) | 0) | 0; //@line 12652
 HEAP32[788] = $1; //@line 12653
 $2 = $1; //@line 12655
 return $2 | 0; //@line 12657
}
function _SLCameraController_setLeaper($self, $target) {
 $self = $self | 0;
 $target = $target | 0;
 var $leaper = 0;
 $leaper = $self + 16 | 0; //@line 1075
 _aqrelease(HEAP32[$leaper >> 2] | 0) | 0; //@line 1078
 HEAP32[$leaper >> 2] = _aqretain($target) | 0; //@line 1082
 return $self | 0; //@line 1083
}
function _SLCameraController_setHome($self, $asteroid) {
 $self = $self | 0;
 $asteroid = $asteroid | 0;
 var $home = 0;
 $home = $self + 20 | 0; //@line 1092
 _aqrelease(HEAP32[$home >> 2] | 0) | 0; //@line 1095
 HEAP32[$home >> 2] = _aqretain($asteroid) | 0; //@line 1099
 return $self | 0; //@line 1100
}
function _SLAmbientParticle_tick($self) {
 $self = $self | 0;
 var $contactPulseValue = 0, $0 = 0;
 $contactPulseValue = $self + 12 | 0; //@line 143
 $0 = HEAP32[$contactPulseValue >> 2] | 0; //@line 144
 if (($0 | 0) <= 0) {
  return;
 }
 HEAP32[$contactPulseValue >> 2] = $0 - 1; //@line 151
 return;
}
function _SLParticleView_getInterface($_self, $id) {
 $_self = $_self | 0;
 $id = $id | 0;
 var $retval_0 = 0;
 if (($id | 0) == 2096) {
  $retval_0 = 1872; //@line 5625
  return $retval_0 | 0; //@line 5627
 }
 $retval_0 = ($id | 0) == 1856 ? 1880 : 0; //@line 5632
 return $retval_0 | 0; //@line 5634
}
function _AQParticle_done($self) {
 $self = $self | 0;
 _aqcollidewith_done(HEAP32[$self + 108 >> 2] | 0) | 0; //@line 10604
 _aqcollidewith_done(HEAP32[$self + 120 >> 2] | 0) | 0; //@line 10608
 _aqcollidewith_done(HEAP32[$self + 124 >> 2] | 0) | 0; //@line 10612
 return $self | 0; //@line 10614
}
function _aqcollidewith_done($self) {
 $self = $self | 0;
 var $0 = 0;
 if (($self | 0) == 0) {
  return 0; //@line 10625
 }
 $0 = HEAP32[$self + 4 >> 2] | 0; //@line 10628
 if (($0 | 0) != 0) {
  _aqcollidewith_done($0) | 0; //@line 10632
 }
 _free($self); //@line 10636
 return 0; //@line 10638
}
function _AQInput_setWorldFrame($top, $right, $bottom, $left) {
 $top = +$top;
 $right = +$right;
 $bottom = +$bottom;
 $left = +$left;
 HEAPF32[784] = $top; //@line 12604
 HEAPF32[785] = $right; //@line 12605
 HEAPF32[786] = $bottom; //@line 12606
 HEAPF32[787] = $left; //@line 12607
 return;
}
function _aqcollision_done($col) {
 $col = $col | 0;
 var $0 = 0;
 $0 = HEAP32[$col + 20 >> 2] | 0; //@line 7751
 if (($0 | 0) == 0) {
  return $col | 0; //@line 7755
 } else {
  _free(_aqcollision_done($0) | 0); //@line 7759
  return $col | 0; //@line 7760
 }
 return 0; //@line 7762
}
function copyTempFloat(ptr) {
 ptr = ptr | 0;
 HEAP8[tempDoublePtr] = HEAP8[ptr]; //@line 25
 HEAP8[tempDoublePtr + 1 | 0] = HEAP8[ptr + 1 | 0]; //@line 26
 HEAP8[tempDoublePtr + 2 | 0] = HEAP8[ptr + 2 | 0]; //@line 27
 HEAP8[tempDoublePtr + 3 | 0] = HEAP8[ptr + 3 | 0]; //@line 28
}
function _aqalloc($st) {
 $st = $st | 0;
 var $call = 0;
 $call = _malloc(HEAP32[$st + 4 >> 2] | 0) | 0; //@line 13792
 HEAP32[$call >> 2] = $st; //@line 13794
 HEAP32[$call + 4 >> 2] = 1; //@line 13797
 HEAP32[$call + 8 >> 2] = 0; //@line 13800
 return $call | 0; //@line 13801
}
function _aqlistnode_done($self) {
 $self = $self | 0;
 var $0 = 0;
 $0 = HEAP32[$self >> 2] | 0; //@line 12975
 if (($0 | 0) != 0) {
  _free(_aqlistnode_done($0) | 0); //@line 12981
 }
 _aqrelease(HEAP32[$self + 8 >> 2] | 0) | 0; //@line 12987
 return $self | 0; //@line 12988
}
function _AQShaders_useProgram($shaderEnum) {
 $shaderEnum = $shaderEnum | 0;
 if ((HEAP32[782] | 0) == ($shaderEnum | 0)) {
  return;
 }
 HEAP32[782] = $shaderEnum; //@line 6043
 if (($shaderEnum | 0) != 1) {
  return;
 }
 _glUseProgram(HEAP32[770] | 0); //@line 6050
 return;
}
function __AQWorld_performConstraints($interfacePtr, $ctx) {
 $interfacePtr = $interfacePtr | 0;
 $ctx = $ctx | 0;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[$interfacePtr + 16 >> 2] | 0) + 8 >> 2] & 31](HEAP32[$interfacePtr + 12 >> 2] | 0); //@line 12231
 return;
}
function _AQRenderer_boot() {
 HEAP32[792] = _aqinit(_aqalloc(2216) | 0) | 0; //@line 5902
 _glClearColor(+0.0, +0.0, +0.0, +0.0); //@line 5903
 _glEnable(3042); //@line 5904
 _glBlendFunc(770, 771); //@line 5905
 _AQShaders_boot(); //@line 5906
 return;
}
function _AQList_done($self) {
 $self = $self | 0;
 var $0 = 0;
 $0 = HEAP32[$self + 16 >> 2] | 0; //@line 13011
 if (($0 | 0) == 0) {
  return $self | 0; //@line 13015
 }
 _free(_aqlistnode_done($0) | 0); //@line 13019
 return $self | 0; //@line 13021
}
function _AQParticle_testPrep($self) {
 $self = $self | 0;
 var $0 = 0;
 $0 = HEAP32[$self + 108 >> 2] | 0; //@line 10790
 HEAP32[$self + 112 >> 2] = $0; //@line 10792
 if (($0 | 0) == 0) {
  return;
 }
 HEAP32[$0 >> 2] = 0; //@line 10799
 return;
}
function _aqfree($self) {
 $self = $self | 0;
 if (($self | 0) == 0) {
  return;
 }
 HEAP32[$self + 4 >> 2] = 0; //@line 13816
 _free(FUNCTION_TABLE_ii[HEAP32[(HEAP32[$self >> 2] | 0) + 16 >> 2] & 63]($self) | 0); //@line 13822
 return;
}
function _AQRenderer_init($self) {
 $self = $self | 0;
 HEAP32[$self + 12 >> 2] = _aqinit(_aqalloc(2440) | 0) | 0; //@line 5870
 HEAP32[$self + 16 >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 5875
 return $self | 0; //@line 5876
}
function _SLLeaperView_done($self) {
 $self = $self | 0;
 _puts(40) | 0; //@line 5245
 _glDeleteBuffers(1, $self + 16 | 0); //@line 5247
 _aqrelease(HEAP32[$self + 12 >> 2] | 0) | 0; //@line 5251
 return $self | 0; //@line 5252
}
function __AQView_iterator($object, $ctx) {
 $object = $object | 0;
 $ctx = $ctx | 0;
 var $0 = 0;
 $0 = $object; //@line 7234
 FUNCTION_TABLE_vi[HEAP32[(_aqcast($0, 2096) | 0) + 4 >> 2] & 31]($0); //@line 7239
 return;
}
function _SLLeaperView_create($leaper) {
 $leaper = $leaper | 0;
 var $call = 0;
 $call = _aqcreate(1912) | 0; //@line 5271
 HEAP32[$call + 12 >> 2] = _aqretain($leaper) | 0; //@line 5278
 return $call | 0; //@line 5279
}
function _AQStick_init($self) {
 $self = $self | 0;
 HEAP32[$self + 12 >> 2] = 0; //@line 11775
 HEAP32[$self + 16 >> 2] = 0; //@line 11777
 HEAPF64[$self + 24 >> 3] = 0.0; //@line 11779
 return $self | 0; //@line 11780
}
function _loopfuncnode_done($self) {
 $self = $self | 0;
 var $0 = 0;
 $0 = HEAP32[$self + 8 >> 2] | 0; //@line 5288
 if (($0 | 0) != 0) {
  _loopfuncnode_done($0); //@line 5292
 }
 _free($self); //@line 5296
 return;
}
function _AQList_init($self) {
 $self = $self | 0;
 HEAP32[$self + 12 >> 2] = 0; //@line 12997
 HEAP32[$self + 16 >> 2] = 0; //@line 12999
 HEAP32[$self + 20 >> 2] = 0; //@line 13001
 return $self | 0; //@line 13002
}
function _drawWaterTest() {
 var $call1 = 0;
 $call1 = _aqinit(_aqalloc(2240) | 0) | 0; //@line 7117
 _AQRenderer_draw(); //@line 7118
 _AQShaders_useProgram(1); //@line 7119
 _aqfree($call1); //@line 7120
 return;
}
function __SLLeaper_numberEqualInt($obj, $ctx) {
 $obj = $obj | 0;
 $ctx = $ctx | 0;
 var $call = 0;
 $call = _AQNumber_asInt($obj) | 0; //@line 3578
 return ($call | 0) == (HEAP32[$ctx >> 2] | 0) | 0; //@line 3583
}
function _AQInput_getScreenSize($width, $height) {
 $width = $width | 0;
 $height = $height | 0;
 HEAPF32[$width >> 2] = +HEAPF32[790]; //@line 12590
 HEAPF32[$height >> 2] = +HEAPF32[791]; //@line 12592
 return;
}
function _SLAsteroid_init($_self) {
 $_self = $_self | 0;
 _memset($_self + 12 | 0, 0, 40); //@line 240
 HEAP32[$_self + 32 >> 2] = _aqinit(_aqalloc(2328) | 0) | 0; //@line 246
 return $_self | 0; //@line 247
}
function _AQStick_done($self) {
 $self = $self | 0;
 _aqrelease(HEAP32[$self + 12 >> 2] | 0) | 0; //@line 11791
 _aqrelease(HEAP32[$self + 16 >> 2] | 0) | 0; //@line 11795
 return $self | 0; //@line 11796
}
function _AQRenderer_done($self) {
 $self = $self | 0;
 _aqrelease(HEAP32[$self + 12 >> 2] | 0) | 0; //@line 5887
 _aqrelease(HEAP32[$self + 16 >> 2] | 0) | 0; //@line 5891
 return $self | 0; //@line 5892
}
function _AQLoop_done($self) {
 $self = $self | 0;
 _aqrelease(HEAP32[$self + 16 >> 2] | 0) | 0; //@line 5333
 _loopfuncnode_done(HEAP32[$self + 20 >> 2] | 0); //@line 5336
 return $self | 0; //@line 5337
}
function _SLUpdater_addToList($list, $object) {
 $list = $list | 0;
 $object = $object | 0;
 if ((_aqcast($object, 1856) | 0) == 0) {
  return;
 }
 _AQList_push($list, $object) | 0; //@line 7210
 return;
}
function _SLAsteroidGroupView_done($self) {
 $self = $self | 0;
 _aqrelease(HEAP32[$self + 12 >> 2] | 0) | 0; //@line 411
 _glDeleteBuffers(1, $self + 16 | 0); //@line 413
 return $self | 0; //@line 414
}
function _AQShaders_draw($buffer, $data, $bytes) {
 $buffer = $buffer | 0;
 $data = $data | 0;
 $bytes = $bytes | 0;
 FUNCTION_TABLE_viii[HEAP32[771] & 31]($buffer, $data, $bytes); //@line 6074
 return;
}
function __AQWorld_findConstraintIterator($constraintPtr, $ctx) {
 $constraintPtr = $constraintPtr | 0;
 $ctx = $ctx | 0;
 return (HEAP32[$constraintPtr + 12 >> 2] | 0) == ($ctx | 0) | 0; //@line 12538
}
function stackAlloc(size) {
 size = size | 0;
 var ret = 0;
 ret = STACKTOP; //@line 3
 STACKTOP = STACKTOP + size | 0; //@line 4
 STACKTOP = STACKTOP + 7 & -8; //@line 5
 return ret | 0; //@line 6
}
function _AQShaders_setMatrix($_matrix) {
 $_matrix = $_matrix | 0;
 var $0 = 0;
 HEAP32[775] = 1; //@line 6060
 $0 = $_matrix; //@line 6061
 _memcpy(2560, $0 | 0, 64) | 0; //@line 6062
 return;
}
function _SLAsteroidGroupView_addAsteroid($self, $asteroid) {
 $self = $self | 0;
 $asteroid = $asteroid | 0;
 _AQList_push(HEAP32[$self + 12 >> 2] | 0, $asteroid | 0) | 0; //@line 446
 return;
}
function _SLCameraController_getInterface($self, $interfaceName) {
 $self = $self | 0;
 $interfaceName = $interfaceName | 0;
 return (($interfaceName | 0) == 1856 ? 1808 : 0) | 0; //@line 1057
}
function _aqint($value) {
 $value = $value | 0;
 var $call = 0;
 $call = _aqcreate(2376) | 0; //@line 13737
 HEAP32[$call + 12 >> 2] = $value; //@line 13740
 return $call | 0; //@line 13741
}
function _aqretain($self) {
 $self = $self | 0;
 var $0 = 0;
 $0 = $self + 4 | 0; //@line 13846
 HEAP32[$0 >> 2] = (HEAP32[$0 >> 2] | 0) + 1; //@line 13849
 return $self | 0; //@line 13850
}
function _strlen(ptr) {
 ptr = ptr | 0;
 var curr = 0;
 curr = ptr; //@line 17953
 while (HEAP8[curr] | 0) {
  curr = curr + 1 | 0; //@line 17955
 }
 return curr - ptr | 0; //@line 17957
}
function __AQWorld_solveIterator($col, $ctx) {
 $col = $col | 0;
 $ctx = $ctx | 0;
 _AQParticle_solve(HEAP32[$col >> 2] | 0, HEAP32[$col + 4 >> 2] | 0, $col); //@line 12213
 return;
}
function __SLAsteroid_worldParticleRemover($particle, $world) {
 $particle = $particle | 0;
 $world = $world | 0;
 _AQWorld_removeParticle($world, $particle); //@line 229
 return;
}
function _AQInterfacePtr_init($self) {
 $self = $self | 0;
 HEAP32[$self + 12 >> 2] = 0; //@line 12920
 HEAP32[$self + 16 >> 2] = 0; //@line 12922
 return $self | 0; //@line 12923
}
function _SLLeaperView_getInterface($self, $interfaceId) {
 $self = $self | 0;
 $interfaceId = $interfaceId | 0;
 return (($interfaceId | 0) == 2096 ? 1784 : 0) | 0; //@line 5263
}
function dynCall_viii(index, a1, a2, a3) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 FUNCTION_TABLE_viii[index & 31](a1 | 0, a2 | 0, a3 | 0); //@line 18682
}
function _AQInput_setScreenSize($width, $height) {
 $width = +$width;
 $height = +$height;
 HEAPF32[790] = $width; //@line 12578
 HEAPF32[791] = $height; //@line 12579
 return;
}
function __SLAsteroid_worldParticleAdder($particle, $world) {
 $particle = $particle | 0;
 $world = $world | 0;
 _AQWorld_addParticle($world, $particle); //@line 219
 return;
}
function setThrew(threw, value) {
 threw = threw | 0;
 value = value | 0;
 if ((__THREW__ | 0) == 0) {
  __THREW__ = threw; //@line 19
  threwValue = value; //@line 20
 }
}
function __SLLeaper_sameParticleFindIterator($obj, $_particle) {
 $obj = $obj | 0;
 $_particle = $_particle | 0;
 return ($_particle | 0) == ($obj | 0) | 0; //@line 4942
}
function __SLLeaper_removeConstraintIterator($obj, $_world) {
 $obj = $obj | 0;
 $_world = $_world | 0;
 _AQWorld_removeConstraint($_world, $obj); //@line 3309
 return;
}
function __SLLeaper_removeParticleIterator($obj, $_world) {
 $obj = $obj | 0;
 $_world = $_world | 0;
 _AQWorld_removeParticle($_world, $obj); //@line 3297
 return;
}
function _AQRenderer_removeView($object) {
 $object = $object | 0;
 _AQView_removeFromList(HEAP32[(HEAP32[792] | 0) + 16 >> 2] | 0, $object); //@line 5940
 return;
}
function __SLLeaper_addConstraintIterator($obj, $_world) {
 $obj = $obj | 0;
 $_world = $_world | 0;
 _AQWorld_addConstraint($_world, $obj); //@line 3405
 return;
}
function dynCall_iii(index, a1, a2) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 return FUNCTION_TABLE_iii[index & 31](a1 | 0, a2 | 0) | 0; //@line 19039
}
function __SLLeaper_addParticleIterator($obj, $_world) {
 $obj = $obj | 0;
 $_world = $_world | 0;
 _AQWorld_addParticle($_world, $obj); //@line 3393
 return;
}
function _AQLoop_addUpdater($object) {
 $object = $object | 0;
 _SLUpdater_addToList(HEAP32[(HEAP32[794] | 0) + 16 >> 2] | 0, $object); //@line 5436
 return;
}
function _AQRenderer_addView($object) {
 $object = $object | 0;
 _AQView_addToList(HEAP32[(HEAP32[792] | 0) + 16 >> 2] | 0, $object); //@line 5928
 return;
}
function _SLParticleView_setLeaper($self, $leaper) {
 $self = $self | 0;
 $leaper = $leaper | 0;
 HEAP32[$self + 24 >> 2] = $leaper; //@line 5644
 return;
}
function _SLParticleView_done($_self) {
 $_self = $_self | 0;
 _aqrelease(HEAP32[$_self + 20 >> 2] | 0) | 0; //@line 5612
 return $_self | 0; //@line 5613
}
function _SLCameraController_done($self) {
 $self = $self | 0;
 _aqrelease(HEAP32[$self + 16 >> 2] | 0) | 0; //@line 1045
 return $self | 0; //@line 1046
}
function _SLParticleView_setHomeAsteroid($self, $home) {
 $self = $self | 0;
 $home = $home | 0;
 HEAP32[$self + 28 >> 2] = $home; //@line 5655
 return;
}
function _SLAsteroidGroupView_getInterface($self, $ifn) {
 $self = $self | 0;
 $ifn = $ifn | 0;
 return (($ifn | 0) == 2096 ? 1816 : 0) | 0; //@line 425
}
function _AQInterfacePtr_done($self) {
 $self = $self | 0;
 _aqrelease(HEAP32[$self + 12 >> 2] | 0) | 0; //@line 12934
 return $self | 0; //@line 12935
}
function dynCall_vii(index, a1, a2) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 FUNCTION_TABLE_vii[index & 63](a1 | 0, a2 | 0); //@line 18444
}
function _AQParticle_wake($self) {
 $self = $self | 0;
 HEAP8[$self + 98 | 0] = 0; //@line 11657
 HEAP8[$self + 99 | 0] = 0; //@line 11659
 return;
}
function _aqinit($self) {
 $self = $self | 0;
 return FUNCTION_TABLE_ii[HEAP32[(HEAP32[$self >> 2] | 0) + 12 >> 2] & 63]($self) | 0; //@line 13837
}
function dynCall_vif(index, a1, a2) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = +a2;
 FUNCTION_TABLE_vif[index & 31](a1 | 0, +a2); //@line 18087
}
function _aqistype($self, $type) {
 $self = $self | 0;
 $type = $type | 0;
 return (HEAP32[$self >> 2] | 0) == ($type | 0) | 0; //@line 14031
}
function _SLAsteroid_setIsHome($self, $home) {
 $self = $self | 0;
 $home = $home | 0;
 HEAP32[$self + 48 >> 2] = $home; //@line 358
 return;
}
function _SLAmbientParticle_init($_self) {
 $_self = $_self | 0;
 HEAP32[$_self + 12 >> 2] = 0; //@line 102
 return $_self | 0; //@line 103
}
function _AQStick_getInterface($self, $id) {
 $self = $self | 0;
 $id = $id | 0;
 return (($id | 0) == 2424 ? 1824 : 0) | 0; //@line 11807
}
function _SLLeaperView_init($self) {
 $self = $self | 0;
 _glGenBuffers(1, $self + 16 | 0); //@line 5236
 return $self | 0; //@line 5237
}
function _AQInt_getInterface($self, $id) {
 $self = $self | 0;
 $id = $id | 0;
 return (($id | 0) == 2288 ? 1840 : 0) | 0; //@line 13729
}
function dynCall_ii(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 return FUNCTION_TABLE_ii[index & 63](a1 | 0) | 0; //@line 18563
}
function _AQTouch_init($self) {
 $self = $self | 0;
 _memset($self + 12 | 0, 0, 32); //@line 12568
 return $self | 0; //@line 12569
}
function _AQArray_init($self) {
 $self = $self | 0;
 _memset($self + 12 | 0, 0, 12); //@line 12667
 return $self | 0; //@line 12668
}
function jsCall_viii_15(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(15, a1 | 0, a2 | 0, a3 | 0); //@line 18793
}
function jsCall_viii_14(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(14, a1 | 0, a2 | 0, a3 | 0); //@line 18786
}
function jsCall_viii_13(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(13, a1 | 0, a2 | 0, a3 | 0); //@line 18779
}
function jsCall_viii_12(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(12, a1 | 0, a2 | 0, a3 | 0); //@line 18772
}
function jsCall_viii_11(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(11, a1 | 0, a2 | 0, a3 | 0); //@line 18765
}
function jsCall_viii_10(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(10, a1 | 0, a2 | 0, a3 | 0); //@line 18758
}
function dynCall_fff(index, a1, a2) {
 index = index | 0;
 a1 = +a1;
 a2 = +a2;
 return +FUNCTION_TABLE_fff[index & 31](+a1, +a2);
}
function _setSpaceLeaperResourceCallback($callback) {
 $callback = $callback | 0;
 HEAP32[628] = $callback; //@line 7163
 return;
}
function _AQDdvt_init($self) {
 $self = $self | 0;
 _memset($self + 12 | 0, 0, 232); //@line 7942
 return $self | 0; //@line 7944
}
function jsCall_viii_9(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(9, a1 | 0, a2 | 0, a3 | 0); //@line 18751
}
function jsCall_viii_8(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(8, a1 | 0, a2 | 0, a3 | 0); //@line 18744
}
function jsCall_viii_7(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(7, a1 | 0, a2 | 0, a3 | 0); //@line 18737
}
function jsCall_viii_6(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(6, a1 | 0, a2 | 0, a3 | 0); //@line 18730
}
function jsCall_viii_5(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(5, a1 | 0, a2 | 0, a3 | 0); //@line 18723
}
function jsCall_viii_4(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(4, a1 | 0, a2 | 0, a3 | 0); //@line 18716
}
function jsCall_viii_3(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(3, a1 | 0, a2 | 0, a3 | 0); //@line 18709
}
function jsCall_viii_2(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(2, a1 | 0, a2 | 0, a3 | 0); //@line 18702
}
function jsCall_viii_1(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(1, a1 | 0, a2 | 0, a3 | 0); //@line 18695
}
function jsCall_viii_0(a1, a2, a3) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 jsCall(0, a1 | 0, a2 | 0, a3 | 0); //@line 18688
}
function _setSpaceLeaperVisitedCallback($callback) {
 $callback = $callback | 0;
 HEAP32[624] = $callback; //@line 7154
 return;
}
function _setSpaceLeaperEndCallback($callback) {
 $callback = $callback | 0;
 HEAP32[766] = $callback; //@line 7145
 return;
}
function _AQObj_getInterface($self, $interface) {
 $self = $self | 0;
 $interface = $interface | 0;
 return 0; //@line 13782
}
function _setGetTicksFunction($_getTicks) {
 $_getTicks = $_getTicks | 0;
 HEAP32[660] = $_getTicks; //@line 6662
 return;
}
function dynCall_vi(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 FUNCTION_TABLE_vi[index & 31](a1 | 0); //@line 18325
}
function _SLCameraController_inputPress($self) {
 $self = $self | 0;
 HEAP32[$self + 24 >> 2] = 1; //@line 1109
 return;
}
function _AQView_iterateList($list) {
 $list = $list | 0;
 _AQList_iterate($list, 29, 0) | 0; //@line 7340
 return;
}
function jsCall_iii_15(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(15, a1 | 0, a2 | 0) | 0; //@line 19150
}
function jsCall_iii_14(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(14, a1 | 0, a2 | 0) | 0; //@line 19143
}
function jsCall_iii_13(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(13, a1 | 0, a2 | 0) | 0; //@line 19136
}
function jsCall_iii_12(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(12, a1 | 0, a2 | 0) | 0; //@line 19129
}
function jsCall_iii_11(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(11, a1 | 0, a2 | 0) | 0; //@line 19122
}
function jsCall_iii_10(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(10, a1 | 0, a2 | 0) | 0; //@line 19115
}
function dynCall_fi(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 return +FUNCTION_TABLE_fi[index & 31](a1 | 0);
}
function jsCall_iii_9(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(9, a1 | 0, a2 | 0) | 0; //@line 19108
}
function jsCall_iii_8(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(8, a1 | 0, a2 | 0) | 0; //@line 19101
}
function jsCall_iii_7(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(7, a1 | 0, a2 | 0) | 0; //@line 19094
}
function jsCall_iii_6(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(6, a1 | 0, a2 | 0) | 0; //@line 19087
}
function jsCall_iii_5(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(5, a1 | 0, a2 | 0) | 0; //@line 19080
}
function jsCall_iii_4(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(4, a1 | 0, a2 | 0) | 0; //@line 19073
}
function jsCall_iii_3(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(3, a1 | 0, a2 | 0) | 0; //@line 19066
}
function jsCall_iii_2(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(2, a1 | 0, a2 | 0) | 0; //@line 19059
}
function jsCall_iii_1(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(1, a1 | 0, a2 | 0) | 0; //@line 19052
}
function jsCall_iii_0(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 return jsCall(0, a1 | 0, a2 | 0) | 0; //@line 19045
}
function _colorvertex_next($vertices) {
 $vertices = $vertices | 0;
 return $vertices + 12 | 0; //@line 1120
}
function _AQList_length($_self) {
 $_self = $_self | 0;
 return HEAP32[$_self + 12 >> 2] | 0; //@line 13032
}
function dynCall_i(index) {
 index = index | 0;
 return FUNCTION_TABLE_i[index & 31]() | 0; //@line 18206
}
function _AQInt_asInt($_self) {
 $_self = $_self | 0;
 return HEAP32[$_self + 12 >> 2] | 0; //@line 13690
}
function _AQArray_length($self) {
 $self = $self | 0;
 return HEAP32[$self + 12 >> 2] | 0; //@line 12911
}
function jsCall_vii_15(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(15, a1 | 0, a2 | 0); //@line 18555
}
function jsCall_vii_14(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(14, a1 | 0, a2 | 0); //@line 18548
}
function jsCall_vii_13(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(13, a1 | 0, a2 | 0); //@line 18541
}
function jsCall_vii_12(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(12, a1 | 0, a2 | 0); //@line 18534
}
function jsCall_vii_11(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(11, a1 | 0, a2 | 0); //@line 18527
}
function jsCall_vii_10(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(10, a1 | 0, a2 | 0); //@line 18520
}
function _colorvertex_getcolor($vertex) {
 $vertex = $vertex | 0;
 return $vertex + 8 | 0; //@line 1130
}
function jsCall_vii_9(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(9, a1 | 0, a2 | 0); //@line 18513
}
function jsCall_vii_8(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(8, a1 | 0, a2 | 0); //@line 18506
}
function jsCall_vii_7(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(7, a1 | 0, a2 | 0); //@line 18499
}
function jsCall_vii_6(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(6, a1 | 0, a2 | 0); //@line 18492
}
function jsCall_vii_5(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(5, a1 | 0, a2 | 0); //@line 18485
}
function jsCall_vii_4(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(4, a1 | 0, a2 | 0); //@line 18478
}
function jsCall_vii_3(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(3, a1 | 0, a2 | 0); //@line 18471
}
function jsCall_vii_2(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(2, a1 | 0, a2 | 0); //@line 18464
}
function jsCall_vii_1(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(1, a1 | 0, a2 | 0); //@line 18457
}
function jsCall_vii_0(a1, a2) {
 a1 = a1 | 0;
 a2 = a2 | 0;
 jsCall(0, a1 | 0, a2 | 0); //@line 18450
}
function __colorvertex_next3($vertex) {
 $vertex = $vertex | 0;
 return $vertex + 36 | 0; //@line 457
}
function _AQInt_asDouble($_self) {
 $_self = $_self | 0;
 return +(+(HEAP32[$_self + 12 >> 2] | 0));
}
function b9(p0, p1) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 abort(9); //@line 19163
 return 0; //@line 19163
}
function jsCall_vif_15(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(15, a1 | 0, +a2); //@line 18198
}
function jsCall_vif_14(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(14, a1 | 0, +a2); //@line 18191
}
function jsCall_vif_13(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(13, a1 | 0, +a2); //@line 18184
}
function jsCall_vif_12(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(12, a1 | 0, +a2); //@line 18177
}
function jsCall_vif_11(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(11, a1 | 0, +a2); //@line 18170
}
function jsCall_vif_10(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(10, a1 | 0, +a2); //@line 18163
}
function _SLAmbientParticle_done($_self) {
 $_self = $_self | 0;
 return $_self | 0; //@line 111
}
function jsCall_vif_9(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(9, a1 | 0, +a2); //@line 18156
}
function jsCall_vif_8(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(8, a1 | 0, +a2); //@line 18149
}
function jsCall_vif_7(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(7, a1 | 0, +a2); //@line 18142
}
function jsCall_vif_6(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(6, a1 | 0, +a2); //@line 18135
}
function jsCall_vif_5(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(5, a1 | 0, +a2); //@line 18128
}
function jsCall_vif_4(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(4, a1 | 0, +a2); //@line 18121
}
function jsCall_vif_3(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(3, a1 | 0, +a2); //@line 18114
}
function jsCall_vif_2(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(2, a1 | 0, +a2); //@line 18107
}
function jsCall_vif_1(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(1, a1 | 0, +a2); //@line 18100
}
function jsCall_vif_0(a1, a2) {
 a1 = a1 | 0;
 a2 = +a2;
 jsCall(0, a1 | 0, +a2); //@line 18093
}
function _collision_noop($a, $b, $col) {
 $a = $a | 0;
 $b = $b | 0;
 $col = $col | 0;
 return;
}
function _AQLoop_boot() {
 HEAP32[794] = _aqinit(_aqalloc(2304) | 0) | 0; //@line 5347
 return;
}
function dynCall_v(index) {
 index = index | 0;
 FUNCTION_TABLE_v[index & 31](); //@line 18801
}
function _AQStick_setWorld($self, $world) {
 $self = $self | 0;
 $world = $world | 0;
 return;
}
function _AQRenderer_camera() {
 return HEAP32[(HEAP32[792] | 0) + 12 >> 2] | 0; //@line 5917
}
function b6(p0, p1, p2) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 p2 = p2 | 0;
 abort(6); //@line 19160
}
function _AQLoop_world() {
 return HEAP32[(HEAP32[794] | 0) + 12 >> 2] | 0; //@line 5358
}
function jsCall_ii_15(a1) {
 a1 = a1 | 0;
 return jsCall(15, a1 | 0) | 0; //@line 18674
}
function jsCall_ii_14(a1) {
 a1 = a1 | 0;
 return jsCall(14, a1 | 0) | 0; //@line 18667
}
function jsCall_ii_13(a1) {
 a1 = a1 | 0;
 return jsCall(13, a1 | 0) | 0; //@line 18660
}
function jsCall_ii_12(a1) {
 a1 = a1 | 0;
 return jsCall(12, a1 | 0) | 0; //@line 18653
}
function jsCall_ii_11(a1) {
 a1 = a1 | 0;
 return jsCall(11, a1 | 0) | 0; //@line 18646
}
function jsCall_ii_10(a1) {
 a1 = a1 | 0;
 return jsCall(10, a1 | 0) | 0; //@line 18639
}
function jsCall_ii_9(a1) {
 a1 = a1 | 0;
 return jsCall(9, a1 | 0) | 0; //@line 18632
}
function jsCall_ii_8(a1) {
 a1 = a1 | 0;
 return jsCall(8, a1 | 0) | 0; //@line 18625
}
function jsCall_ii_7(a1) {
 a1 = a1 | 0;
 return jsCall(7, a1 | 0) | 0; //@line 18618
}
function jsCall_ii_6(a1) {
 a1 = a1 | 0;
 return jsCall(6, a1 | 0) | 0; //@line 18611
}
function jsCall_ii_5(a1) {
 a1 = a1 | 0;
 return jsCall(5, a1 | 0) | 0; //@line 18604
}
function jsCall_ii_4(a1) {
 a1 = a1 | 0;
 return jsCall(4, a1 | 0) | 0; //@line 18597
}
function jsCall_ii_3(a1) {
 a1 = a1 | 0;
 return jsCall(3, a1 | 0) | 0; //@line 18590
}
function jsCall_ii_2(a1) {
 a1 = a1 | 0;
 return jsCall(2, a1 | 0) | 0; //@line 18583
}
function jsCall_ii_1(a1) {
 a1 = a1 | 0;
 return jsCall(1, a1 | 0) | 0; //@line 18576
}
function jsCall_ii_0(a1) {
 a1 = a1 | 0;
 return jsCall(0, a1 | 0) | 0; //@line 18569
}
function jsCall_fff_15(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(15, +a1, +a2);
}
function jsCall_fff_14(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(14, +a1, +a2);
}
function jsCall_fff_13(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(13, +a1, +a2);
}
function jsCall_fff_12(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(12, +a1, +a2);
}
function jsCall_fff_11(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(11, +a1, +a2);
}
function jsCall_fff_10(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(10, +a1, +a2);
}
function jsCall_fff_9(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(9, +a1, +a2);
}
function jsCall_fff_8(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(8, +a1, +a2);
}
function jsCall_fff_7(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(7, +a1, +a2);
}
function jsCall_fff_6(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(6, +a1, +a2);
}
function jsCall_fff_5(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(5, +a1, +a2);
}
function jsCall_fff_4(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(4, +a1, +a2);
}
function jsCall_fff_3(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(3, +a1, +a2);
}
function jsCall_fff_2(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(2, +a1, +a2);
}
function jsCall_fff_1(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(1, +a1, +a2);
}
function jsCall_fff_0(a1, a2) {
 a1 = +a1;
 a2 = +a2;
 return +jsCall(0, +a1, +a2);
}
function _AQObj_done($self) {
 $self = $self | 0;
 return $self | 0; //@line 13773
}
function _AQInt_init($self) {
 $self = $self | 0;
 return $self | 0; //@line 13710
}
function _AQInt_done($self) {
 $self = $self | 0;
 return $self | 0; //@line 13718
}
function b8(p0, p1) {
 p0 = +p0;
 p1 = +p1;
 abort(8); //@line 19162
 return 0.0;
}
function b5(p0) {
 p0 = p0 | 0;
 abort(5); //@line 19159
 return 0; //@line 19159
}
function _SLCameraController_create() {
 return _aqcreate(1960) | 0; //@line 1066
}
function _SLAsteroidGroupView_create() {
 return _aqcreate(2008) | 0; //@line 434
}
function i__SDL_GetTicks__wrapper() {
 return _SDL_GetTicks() | 0; //@line 17963
}
function setTempRet9(value) {
 value = value | 0;
 tempRet9 = value; //@line 89
}
function setTempRet8(value) {
 value = value | 0;
 tempRet8 = value; //@line 84
}
function setTempRet7(value) {
 value = value | 0;
 tempRet7 = value; //@line 79
}
function setTempRet6(value) {
 value = value | 0;
 tempRet6 = value; //@line 74
}
function setTempRet5(value) {
 value = value | 0;
 tempRet5 = value; //@line 69
}
function setTempRet4(value) {
 value = value | 0;
 tempRet4 = value; //@line 64
}
function setTempRet3(value) {
 value = value | 0;
 tempRet3 = value; //@line 59
}
function setTempRet2(value) {
 value = value | 0;
 tempRet2 = value; //@line 54
}
function setTempRet1(value) {
 value = value | 0;
 tempRet1 = value; //@line 49
}
function setTempRet0(value) {
 value = value | 0;
 tempRet0 = value; //@line 44
}
function jsCall_vi_15(a1) {
 a1 = a1 | 0;
 jsCall(15, a1 | 0); //@line 18436
}
function jsCall_vi_14(a1) {
 a1 = a1 | 0;
 jsCall(14, a1 | 0); //@line 18429
}
function jsCall_vi_13(a1) {
 a1 = a1 | 0;
 jsCall(13, a1 | 0); //@line 18422
}
function jsCall_vi_12(a1) {
 a1 = a1 | 0;
 jsCall(12, a1 | 0); //@line 18415
}
function jsCall_vi_11(a1) {
 a1 = a1 | 0;
 jsCall(11, a1 | 0); //@line 18408
}
function jsCall_vi_10(a1) {
 a1 = a1 | 0;
 jsCall(10, a1 | 0); //@line 18401
}
function jsCall_vi_9(a1) {
 a1 = a1 | 0;
 jsCall(9, a1 | 0); //@line 18394
}
function jsCall_vi_8(a1) {
 a1 = a1 | 0;
 jsCall(8, a1 | 0); //@line 18387
}
function jsCall_vi_7(a1) {
 a1 = a1 | 0;
 jsCall(7, a1 | 0); //@line 18380
}
function jsCall_vi_6(a1) {
 a1 = a1 | 0;
 jsCall(6, a1 | 0); //@line 18373
}
function jsCall_vi_5(a1) {
 a1 = a1 | 0;
 jsCall(5, a1 | 0); //@line 18366
}
function jsCall_vi_4(a1) {
 a1 = a1 | 0;
 jsCall(4, a1 | 0); //@line 18359
}
function jsCall_vi_3(a1) {
 a1 = a1 | 0;
 jsCall(3, a1 | 0); //@line 18352
}
function jsCall_vi_2(a1) {
 a1 = a1 | 0;
 jsCall(2, a1 | 0); //@line 18345
}
function jsCall_vi_1(a1) {
 a1 = a1 | 0;
 jsCall(1, a1 | 0); //@line 18338
}
function jsCall_vi_0(a1) {
 a1 = a1 | 0;
 jsCall(0, a1 | 0); //@line 18331
}
function b4(p0, p1) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 abort(4); //@line 19158
}
function stackRestore(top) {
 top = top | 0;
 STACKTOP = top; //@line 13
}
function b1(p0, p1) {
 p0 = p0 | 0;
 p1 = +p1;
 abort(1); //@line 19155
}
function _resumeSpaceLeaper() {
 HEAP8[2520] = 0; //@line 7136
 return;
}
function jsCall_fi_15(a1) {
 a1 = a1 | 0;
 return +jsCall(15, a1 | 0);
}
function jsCall_fi_14(a1) {
 a1 = a1 | 0;
 return +jsCall(14, a1 | 0);
}
function jsCall_fi_13(a1) {
 a1 = a1 | 0;
 return +jsCall(13, a1 | 0);
}
function jsCall_fi_12(a1) {
 a1 = a1 | 0;
 return +jsCall(12, a1 | 0);
}
function jsCall_fi_11(a1) {
 a1 = a1 | 0;
 return +jsCall(11, a1 | 0);
}
function jsCall_fi_10(a1) {
 a1 = a1 | 0;
 return +jsCall(10, a1 | 0);
}
function _pauseSpaceLeaper() {
 HEAP8[2520] = 1; //@line 7128
 return;
}
function b0(p0) {
 p0 = p0 | 0;
 abort(0); //@line 19154
 return 0.0;
}
function jsCall_fi_9(a1) {
 a1 = a1 | 0;
 return +jsCall(9, a1 | 0);
}
function jsCall_fi_8(a1) {
 a1 = a1 | 0;
 return +jsCall(8, a1 | 0);
}
function jsCall_fi_7(a1) {
 a1 = a1 | 0;
 return +jsCall(7, a1 | 0);
}
function jsCall_fi_6(a1) {
 a1 = a1 | 0;
 return +jsCall(6, a1 | 0);
}
function jsCall_fi_5(a1) {
 a1 = a1 | 0;
 return +jsCall(5, a1 | 0);
}
function jsCall_fi_4(a1) {
 a1 = a1 | 0;
 return +jsCall(4, a1 | 0);
}
function jsCall_fi_3(a1) {
 a1 = a1 | 0;
 return +jsCall(3, a1 | 0);
}
function jsCall_fi_2(a1) {
 a1 = a1 | 0;
 return +jsCall(2, a1 | 0);
}
function jsCall_fi_1(a1) {
 a1 = a1 | 0;
 return +jsCall(1, a1 | 0);
}
function jsCall_fi_0(a1) {
 a1 = a1 | 0;
 return +jsCall(0, a1 | 0);
}
function b2() {
 abort(2); //@line 19156
 return 0; //@line 19156
}
function jsCall_i_15() {
 return jsCall(15) | 0; //@line 18317
}
function jsCall_i_14() {
 return jsCall(14) | 0; //@line 18310
}
function jsCall_i_13() {
 return jsCall(13) | 0; //@line 18303
}
function jsCall_i_12() {
 return jsCall(12) | 0; //@line 18296
}
function jsCall_i_11() {
 return jsCall(11) | 0; //@line 18289
}
function jsCall_i_10() {
 return jsCall(10) | 0; //@line 18282
}
function jsCall_i_9() {
 return jsCall(9) | 0; //@line 18275
}
function jsCall_i_8() {
 return jsCall(8) | 0; //@line 18268
}
function jsCall_i_7() {
 return jsCall(7) | 0; //@line 18261
}
function jsCall_i_6() {
 return jsCall(6) | 0; //@line 18254
}
function jsCall_i_5() {
 return jsCall(5) | 0; //@line 18247
}
function jsCall_i_4() {
 return jsCall(4) | 0; //@line 18240
}
function jsCall_i_3() {
 return jsCall(3) | 0; //@line 18233
}
function jsCall_i_2() {
 return jsCall(2) | 0; //@line 18226
}
function jsCall_i_1() {
 return jsCall(1) | 0; //@line 18219
}
function jsCall_i_0() {
 return jsCall(0) | 0; //@line 18212
}
function b3(p0) {
 p0 = p0 | 0;
 abort(3); //@line 19157
}
function stackSave() {
 return STACKTOP | 0; //@line 9
}
function jsCall_v_15() {
 jsCall(15); //@line 18912
}
function jsCall_v_14() {
 jsCall(14); //@line 18905
}
function jsCall_v_13() {
 jsCall(13); //@line 18898
}
function jsCall_v_12() {
 jsCall(12); //@line 18891
}
function jsCall_v_11() {
 jsCall(11); //@line 18884
}
function jsCall_v_10() {
 jsCall(10); //@line 18877
}
function jsCall_v_9() {
 jsCall(9); //@line 18870
}
function jsCall_v_8() {
 jsCall(8); //@line 18863
}
function jsCall_v_7() {
 jsCall(7); //@line 18856
}
function jsCall_v_6() {
 jsCall(6); //@line 18849
}
function jsCall_v_5() {
 jsCall(5); //@line 18842
}
function jsCall_v_4() {
 jsCall(4); //@line 18835
}
function jsCall_v_3() {
 jsCall(3); //@line 18828
}
function jsCall_v_2() {
 jsCall(2); //@line 18821
}
function jsCall_v_1() {
 jsCall(1); //@line 18814
}
function jsCall_v_0() {
 jsCall(0); //@line 18807
}
function b7() {
 abort(7); //@line 19161
}
function runPostSets() {
}
// EMSCRIPTEN_END_FUNCS
  var FUNCTION_TABLE_fi = [b0,jsCall_fi_0,jsCall_fi_1,jsCall_fi_2,jsCall_fi_3,jsCall_fi_4,jsCall_fi_5,jsCall_fi_6,jsCall_fi_7,jsCall_fi_8,jsCall_fi_9,jsCall_fi_10,jsCall_fi_11,jsCall_fi_12,jsCall_fi_13,jsCall_fi_14,jsCall_fi_15,_AQInt_asDouble,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0
  ,b0,b0,b0];
  var FUNCTION_TABLE_vif = [b1,jsCall_vif_0,jsCall_vif_1,jsCall_vif_2,jsCall_vif_3,jsCall_vif_4,jsCall_vif_5,jsCall_vif_6,jsCall_vif_7,jsCall_vif_8,jsCall_vif_9,jsCall_vif_10,jsCall_vif_11,jsCall_vif_12,jsCall_vif_13,jsCall_vif_14,jsCall_vif_15,__SLCameraController_update,__SLLeaper_update,_SLParticleView_update,b1,b1,b1,b1,b1,b1,b1,b1,b1
  ,b1,b1,b1];
  var FUNCTION_TABLE_i = [b2,jsCall_i_0,jsCall_i_1,jsCall_i_2,jsCall_i_3,jsCall_i_4,jsCall_i_5,jsCall_i_6,jsCall_i_7,jsCall_i_8,jsCall_i_9,jsCall_i_10,jsCall_i_11,jsCall_i_12,jsCall_i_13,jsCall_i_14,jsCall_i_15,i__SDL_GetTicks__wrapper,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2
  ,b2,b2,b2];
  var FUNCTION_TABLE_vi = [b3,jsCall_vi_0,jsCall_vi_1,jsCall_vi_2,jsCall_vi_3,jsCall_vi_4,jsCall_vi_5,jsCall_vi_6,jsCall_vi_7,jsCall_vi_8,jsCall_vi_9,jsCall_vi_10,jsCall_vi_11,jsCall_vi_12,jsCall_vi_13,jsCall_vi_14,jsCall_vi_15,_SLParticleView_draw,_AQRenderer_removeView,_AQStick_update,__SLAsteroidGroupView_draw,__SLLeaperView_draw,b3,b3,b3,b3,b3,b3,b3
  ,b3,b3,b3];
  var FUNCTION_TABLE_vii = [b4,jsCall_vii_0,jsCall_vii_1,jsCall_vii_2,jsCall_vii_3,jsCall_vii_4,jsCall_vii_5,jsCall_vii_6,jsCall_vii_7,jsCall_vii_8,jsCall_vii_9,jsCall_vii_10,jsCall_vii_11,jsCall_vii_12,jsCall_vii_13,jsCall_vii_14,jsCall_vii_15,__SLLeaper_addParticleIterator,__AQWorld_maintainBoxIterator,__SLLeaper_removeConstraintIterator,__AQWorld_integrateIterator,_AQStick_setWorld,__SLAsteroid_worldParticleAdder,__AQWorld_performConstraints,__SLAsteroidGroupView_iterator,__SLAsteroid_worldParticleRemover,__SLParticleView_iterator,__SLLeaper_addConstraintIterator,__SLUpdate_iterator
  ,__AQView_iterator,__SLLeaper_removeParticleIterator,__AQDdvt_fromChildrenIterator,__AQWorld_solveIterator,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4
  ,b4,b4,b4,b4,b4];
  var FUNCTION_TABLE_ii = [b5,jsCall_ii_0,jsCall_ii_1,jsCall_ii_2,jsCall_ii_3,jsCall_ii_4,jsCall_ii_5,jsCall_ii_6,jsCall_ii_7,jsCall_ii_8,jsCall_ii_9,jsCall_ii_10,jsCall_ii_11,jsCall_ii_12,jsCall_ii_13,jsCall_ii_14,jsCall_ii_15,_SLLeaper_init,_colorvertex_next,_AQList_done,_AQInt_done,_AQParticle_init,_SLCameraController_done,_AQStick_done,_AQRenderer_done,_AQReleasePool_done,_AQTouch_init,_AQList_init,_AQDdvt_init
  ,_AQLoop_init,_AQArray_init,_SLAsteroidGroupView_done,_AQStick_init,_SLAmbientParticle_done,_colorvertex_getcolor,_SLParticleView_done,_AQInterfacePtr_done,_AQObj_done,_SLLeaperView_init,_AQInt_init,_SLAmbientParticle_init,_SLLeaper_done,_AQDdvt_done,__colorvertex_next3,_SLAsteroid_done,_SLCameraController_init,_SLLeaperView_done,_AQReleasePool_init,_AQParticle_done,_SLAsteroidGroupView_init,_AQCamera_init,_AQArray_done,_AQInt_asInt,_AQInterfacePtr_init,__SLLeaper_view,_SLParticleView_init,_AQWorld_init,_AQLoop_done,_SLAsteroid_init
  ,_AQWorld_done,_AQRenderer_init,b5,b5,b5];
  var FUNCTION_TABLE_viii = [b6,jsCall_viii_0,jsCall_viii_1,jsCall_viii_2,jsCall_viii_3,jsCall_viii_4,jsCall_viii_5,jsCall_viii_6,jsCall_viii_7,jsCall_viii_8,jsCall_viii_9,jsCall_viii_10,jsCall_viii_11,jsCall_viii_12,jsCall_viii_13,jsCall_viii_14,jsCall_viii_15,_collision_noop,_ColorShader_draw,__AQWorld_boxTestIterator,__SLLeaper_oncollision,b6,b6,b6,b6,b6,b6,b6,b6
  ,b6,b6,b6];
  var FUNCTION_TABLE_v = [b7,jsCall_v_0,jsCall_v_1,jsCall_v_2,jsCall_v_3,jsCall_v_4,jsCall_v_5,jsCall_v_6,jsCall_v_7,jsCall_v_8,jsCall_v_9,jsCall_v_10,jsCall_v_11,jsCall_v_12,jsCall_v_13,jsCall_v_14,jsCall_v_15,_main_loop,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7,b7
  ,b7,b7,b7];
  var FUNCTION_TABLE_fff = [b8,jsCall_fff_0,jsCall_fff_1,jsCall_fff_2,jsCall_fff_3,jsCall_fff_4,jsCall_fff_5,jsCall_fff_6,jsCall_fff_7,jsCall_fff_8,jsCall_fff_9,jsCall_fff_10,jsCall_fff_11,jsCall_fff_12,jsCall_fff_13,jsCall_fff_14,jsCall_fff_15,_aqangle_diff,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8,b8
  ,b8,b8,b8];
  var FUNCTION_TABLE_iii = [b9,jsCall_iii_0,jsCall_iii_1,jsCall_iii_2,jsCall_iii_3,jsCall_iii_4,jsCall_iii_5,jsCall_iii_6,jsCall_iii_7,jsCall_iii_8,jsCall_iii_9,jsCall_iii_10,jsCall_iii_11,jsCall_iii_12,jsCall_iii_13,jsCall_iii_14,jsCall_iii_15,_AQStick_getInterface,_AQObj_getInterface,_SLLeaper_getInterface,_SLAsteroidGroupView_getInterface,__SLLeaper_numberEqualInt,_SLLeaperView_getInterface,_SLParticleView_getInterface,_AQInt_getInterface,_SLCameraController_getInterface,__AQWorld_findConstraintIterator,__SLLeaper_sameParticleFindIterator,b9
  ,b9,b9,b9];
  return { _strlen: _strlen, _free: _free, _main: _main, _pauseSpaceLeaper: _pauseSpaceLeaper, _memset: _memset, _malloc: _malloc, _resumeSpaceLeaper: _resumeSpaceLeaper, _setSpaceLeaperVisitedCallback: _setSpaceLeaperVisitedCallback, _calloc: _calloc, _setSpaceLeaperResourceCallback: _setSpaceLeaperResourceCallback, _memcpy: _memcpy, _setSpaceLeaperEndCallback: _setSpaceLeaperEndCallback, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, setTempRet1: setTempRet1, setTempRet2: setTempRet2, setTempRet3: setTempRet3, setTempRet4: setTempRet4, setTempRet5: setTempRet5, setTempRet6: setTempRet6, setTempRet7: setTempRet7, setTempRet8: setTempRet8, setTempRet9: setTempRet9, dynCall_fi: dynCall_fi, dynCall_vif: dynCall_vif, dynCall_i: dynCall_i, dynCall_vi: dynCall_vi, dynCall_vii: dynCall_vii, dynCall_ii: dynCall_ii, dynCall_viii: dynCall_viii, dynCall_v: dynCall_v, dynCall_fff: dynCall_fff, dynCall_iii: dynCall_iii };
})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "jsCall": jsCall, "invoke_fi": invoke_fi, "invoke_vif": invoke_vif, "invoke_i": invoke_i, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_fff": invoke_fff, "invoke_iii": invoke_iii, "_llvm_lifetime_end": _llvm_lifetime_end, "_rand": _rand, "_glUseProgram": _glUseProgram, "_fabsf": _fabsf, "___assert_fail": ___assert_fail, "_llvm_dbg_value": _llvm_dbg_value, "_glGetProgramiv": _glGetProgramiv, "_glVertexAttribPointer": _glVertexAttribPointer, "_glGetShaderInfoLog": _glGetShaderInfoLog, "_abort": _abort, "_fprintf": _fprintf, "_glLinkProgram": _glLinkProgram, "_printf": _printf, "_glGetUniformLocation": _glGetUniformLocation, "_fflush": _fflush, "_sqrtf": _sqrtf, "_glClearColor": _glClearColor, "_fputc": _fputc, "_glEnable": _glEnable, "_llvm_stackrestore": _llvm_stackrestore, "_fabs": _fabs, "_llvm_lifetime_start": _llvm_lifetime_start, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_SDL_SetVideoMode": _SDL_SetVideoMode, "_glClear": _glClear, "_send": _send, "_glDrawArrays": _glDrawArrays, "_write": _write, "_fputs": _fputs, "_glGenBuffers": _glGenBuffers, "_SDL_PollEvent": _SDL_PollEvent, "_glEnableVertexAttribArray": _glEnableVertexAttribArray, "_glGetAttribLocation": _glGetAttribLocation, "_glBindBuffer": _glBindBuffer, "_exit": _exit, "_glAttachShader": _glAttachShader, "_glCompileShader": _glCompileShader, "_sin": _sin, "_glBlendFunc": _glBlendFunc, "_glCreateProgram": _glCreateProgram, "_sysconf": _sysconf, "_fmod": _fmod, "_glBufferData": _glBufferData, "_fmax": _fmax, "_glViewport": _glViewport, "__reallyNegative": __reallyNegative, "__formatString": __formatString, "_SDL_GL_SetAttribute": _SDL_GL_SetAttribute, "_glShaderSource": _glShaderSource, "_enable_resizable": _enable_resizable, "_SDL_GetTicks": _SDL_GetTicks, "_glUniformMatrix4fv": _glUniformMatrix4fv, "_cos": _cos, "_pwrite": _pwrite, "_puts": _puts, "_sbrk": _sbrk, "_llvm_stacksave": _llvm_stacksave, "_SDL_Init": _SDL_Init, "_SDL_GetError": _SDL_GetError, "_floor": _floor, "___errno_location": ___errno_location, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_glDeleteBuffers": _glDeleteBuffers, "_atan2": _atan2, "_SDL_Quit": _SDL_Quit, "_fmin": _fmin, "_time": _time, "_glGetShaderiv": _glGetShaderiv, "__exit": __exit, "_glCreateShader": _glCreateShader, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _pauseSpaceLeaper = Module["_pauseSpaceLeaper"] = asm["_pauseSpaceLeaper"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _resumeSpaceLeaper = Module["_resumeSpaceLeaper"] = asm["_resumeSpaceLeaper"];
var _setSpaceLeaperVisitedCallback = Module["_setSpaceLeaperVisitedCallback"] = asm["_setSpaceLeaperVisitedCallback"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _setSpaceLeaperResourceCallback = Module["_setSpaceLeaperResourceCallback"] = asm["_setSpaceLeaperResourceCallback"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _setSpaceLeaperEndCallback = Module["_setSpaceLeaperEndCallback"] = asm["_setSpaceLeaperEndCallback"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_fi = Module["dynCall_fi"] = asm["dynCall_fi"];
var dynCall_vif = Module["dynCall_vif"] = asm["dynCall_vif"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_fff = Module["dynCall_fff"] = asm["dynCall_fff"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
//@ sourceMappingURL=spaceleaper.js.map