// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
  Module.test;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (typeof module === "object") {
  module.exports = Module;
}
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
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
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
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
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
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
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
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
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
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
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
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
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
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
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
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
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
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
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
//                   'array' for JavaScript arrays and typed arrays).
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
    var func = globalScope['Module']['_' + ident]; // closure exported function
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
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
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
      case 'i64': (tempI64 = [value>>>0,((Math.min((+(Math.floor((value)/(+(4294967296))))), (+(4294967295))))|0)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
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
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
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
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var runtimeInitialized = false;
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
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 2936;
/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,114,111,103,114,97,109,32,102,97,105,108,101,100,32,99,111,109,112,105,108,97,116,105,111,110,0,0,0,0,0,0,115,104,97,100,101,114,58,32,102,97,105,108,101,100,32,99,111,109,112,105,108,97,116,105,111,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,65,81,84,111,117,99,104,0,46,46,47,46,46,47,115,114,99,47,112,112,104,121,115,47,119,111,114,108,100,46,99,0,115,104,97,100,101,114,40,105,110,102,111,41,58,32,37,115,10,0,0,0,0,0,0,0,65,81,80,97,114,116,105,99,108,101,0,0,0,0,0,0,65,81,68,100,118,116,0,0,85,110,97,98,108,101,32,116,111,32,105,110,105,116,105,97,108,105,122,101,32,83,68,76,58,32,37,115,10,0,0,0,46,46,47,46,46,47,115,114,99,47,103,97,109,101,47,117,112,100,97,116,101,114,46,99,0,0,0,0,0,0,0,0,118,97,114,121,105,110,103,32,108,111,119,112,32,118,101,99,52,32,118,95,99,111,108,111,114,59,10,118,111,105,100,32,109,97,105,110,40,41,32,123,103,108,95,70,114,97,103,67,111,108,111,114,32,61,32,118,95,99,111,108,111,114,59,125,0,0,0,0,0,0,0,0,116,111,117,99,104,58,32,37,102,32,37,102,32,37,102,32,37,102,10,0,0,0,0,0,46,46,47,46,46,47,115,114,99,47,103,97,109,101,47,115,112,97,99,101,108,101,97,112,101,114,46,99,0,0,0,0,40,97,113,118,101,99,50,41,123,37,102,32,37,102,125,0,117,110,105,102,111,114,109,32,109,97,116,52,32,109,111,100,101,108,118,105,101,119,95,112,114,111,106,101,99,116,105,111,110,59,10,97,116,116,114,105,98,117,116,101,32,118,101,99,50,32,97,95,112,111,115,105,116,105,111,110,59,10,97,116,116,114,105,98,117,116,101,32,118,101,99,52,32,97,95,99,111,108,111,114,59,10,118,97,114,121,105,110,103,32,118,101,99,52,32,118,95,99,111,108,111,114,59,10,118,111,105,100,32,109,97,105,110,40,41,32,123,10,32,32,118,95,99,111,108,111,114,32,61,32,97,95,99,111,108,111,114,59,10,32,32,103,108,95,80,111,115,105,116,105,111,110,32,61,32,109,111,100,101,108,118,105,101,119,95,112,114,111,106,101,99,116,105,111,110,32,42,32,118,101,99,52,40,97,95,112,111,115,105,116,105,111,110,44,32,48,44,32,49,41,59,10,125,10,0,0,0,0,0,0,0,0,109,111,118,101,100,58,32,37,102,32,37,102,32,37,102,32,37,102,10,0,0,0,0,0,109,105,110,32,37,100,44,32,109,97,120,32,37,100,44,32,97,118,103,32,37,100,44,32,115,116,100,100,101,118,32,37,102,10,0,0,0,0,0,0,97,95,112,111,115,105,116,105,111,110,0,0,0,0,0,0,37,100,32,37,100,32,37,100,10,0,0,0,0,0,0,0,83,76,76,101,97,112,101,114,0,0,0,0,0,0,0,0,83,76,67,97,109,101,114,97,67,111,110,116,114,111,108,108,101,114,0,0,0,0,0,0,65,81,82,101,110,100,101,114,101,114,0,0,0,0,0,0,65,81,87,111,114,108,100,0,116,111,117,99,104,101,115,58,32,37,100,10,0,0,0,0,37,102,32,37,115,10,0,0,109,111,100,101,108,118,105,101,119,95,112,114,111,106,101,99,116,105,111,110,0,0,0,0,65,81,76,111,111,112,0,0,98,32,33,61,32,115,101,108,102,45,62,98,111,100,121,0,65,81,67,97,109,101,114,97,0,0,0,0,0,0,0,0,83,76,76,101,97,112,101,114,86,105,101,119,0,0,0,0,33,105,115,110,97,110,40,112,97,114,116,105,99,108,101,45,62,112,111,115,105,116,105,111,110,46,120,41,32,38,38,32,33,105,115,110,97,110,40,112,97,114,116,105,99,108,101,45,62,112,111,115,105,116,105,111,110,46,121,41,0,0,0,0,85,110,97,98,108,101,32,116,111,32,115,101,116,32,118,105,100,101,111,32,109,111,100,101,58,32,37,115,10,0,0,0,65,81,83,116,114,105,110,103,0,0,0,0,0,0,0,0,105,110,116,101,114,102,97,99,101,32,38,38,32,105,110,116,101,114,102,97,99,101,45,62,117,112,100,97,116,101,0,0,104,111,109,101,65,115,116,101,114,111,105,100,0,0,0,0,97,95,99,111,108,111,114,0,46,46,47,46,46,47,115,114,99,47,103,97,109,101,47,108,101,97,112,101,114,46,99,0,65,81,76,105,115,116,0,0,115,101,108,102,0,0,0,0,65,81,82,101,108,101,97,115,101,80,111,111,108,0,0,0,65,81,65,114,114,97,121,0,83,76,65,115,116,101,114,111,105,100,71,114,111,117,112,86,105,101,119,0,0,0,0,0,83,76,65,115,116,101,114,111,105,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,110,105,116,87,97,116,101,114,84,101,115,116,0,0,0,95,83,76,85,112,100,97,116,101,95,105,116,101,114,97,116,111,114,0,0,0,0,0,0,95,83,76,76,101,97,112,101,114,95,111,110,99,111,108,108,105,115,105,111,110,0,0,0,95,65,81,87,111,114,108,100,95,105,110,116,101,103,114,97,116,101,73,116,101,114,97,116,111,114,0,0,0,0,0,0,65,81,87,111,114,108,100,95,97,100,100,80,97,114,116,105,99,108,101,0,0,0,0,0,56,10,0,0,44,0,0,0,72,10,0,0,38,0,0,0,152,9,0,0,36,0,0,0,0,0,0,0,0,0,0,0,152,9,0,0,34,0,0,0,72,10,0,0,34,0,0,0,83,76,85,112,100,97,116,101,114,0,0,0,0,0,0,0,224,5,0,0,220,2,0,0,0,0,0,0,94,0,0,0,66,0,0,0,38,0,0,0,72,5,0,0,96,0,0,0,0,0,0,0,36,0,0,0,50,0,0,0,40,0,0,0,88,5,0,0,40,0,0,0,0,0,0,0,64,0,0,0,90,0,0,0,34,0,0,0,240,6,0,0,72,0,0,0,0,0,0,0,38,0,0,0,34,0,0,0,36,0,0,0,216,6,0,0,12,0,12,0,0,0,0,0,86,0,0,0,74,0,0,0,42,0,0,0,128,5,0,0,64,0,0,0,0,0,0,0,68,0,0,0,92,0,0,0,36,0,0,0,65,81,86,105,101,119,97,98,108,101,0,0,0,0,0,0,65,81,86,105,101,119,0,0,240,2,0,0,44,0,0,0,0,0,0,0,100,0,0,0,96,0,0,0,36,0,0,0,80,6,0,0,20,0,0,0,0,0,0,0,76,0,0,0,48,0,0,0,36,0,0,0,0,0,128,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,63,112,5,0,0,20,0,0,0,0,0,0,0,88,0,0,0,62,0,0,0,36,0,0,0,192,6,0,0,28,0,0,0,0,0,0,0,72,0,0,0,46,0,0,0,36,0,0,0,40,3,0,0,224,0,0,0,0,0,0,0,78,0,0,0,84,0,0,0,36,0,0,0,184,5,0,0,20,0,0,0,0,0,0,0,60,0,0,0,70,0,0,0,36,0,0,0,176,6,0,0,24,0,0,0,0,0,0,0,52,0,0,0,58,0,0,0,36,0,0,0,56,3,0,0,8,1,0,0,0,0,0,0,56,0,0,0,54,0,0,0,36,0,0,0,208,5,0,0,80,0,0,0,0,0,0,0,98,0,0,0,96,0,0,0,36,0,0,0,208,6,0,0,24,0,0,0,0,0,0,0,80,0,0,0,40,0,0,0,36,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
}
if (!awaitingMemoryInitializer) runPostSets();
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
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var GL={counter:1,buffers:[],programs:[],framebuffers:[],renderbuffers:[],textures:[],uniforms:[],shaders:[],currArrayBuffer:0,currElementArrayBuffer:0,byteSizeByTypeRoot:5120,byteSizeByType:[1,1,2,2,4,4,4,2,3,4,8],uniformTable:{},packAlignment:4,unpackAlignment:4,init:function () {
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
      },scan:function (table, object) {
        for (var item in table) {
          if (table[item] == object) return item;
        }
        return 0;
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
          case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
          case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
          case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
            sizePerPixel = 2;
            break;
          case 0x1406 /* GL_FLOAT */:
            assert(GL.floatExt, 'Must have OES_texture_float to use float textures');
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
        GL.compressionExt = Module.ctx.getExtension('WEBGL_compressed_texture_s3tc') ||
                            Module.ctx.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
                            Module.ctx.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
        GL.anisotropicExt = Module.ctx.getExtension('EXT_texture_filter_anisotropic') ||
                            Module.ctx.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                            Module.ctx.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        GL.floatExt = Module.ctx.getExtension('OES_texture_float');
        GL.elementIndexUintExt = Module.ctx.getExtension('OES_element_index_uint');
        GL.standardDerivativesExt = Module.ctx.getExtension('OES_standard_derivatives');
      }};function _glGenBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = GL.getNewId(GL.buffers);
        GL.buffers[id] = Module.ctx.createBuffer();
        HEAP32[(((buffers)+(i*4))>>2)]=id;
      }
    }
  function _glDeleteBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))>>2)];
        Module.ctx.deleteBuffer(GL.buffers[id]);
        GL.buffers[id] = null;
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
      }
    }
  var _cos=Math.cos;
  var _sin=Math.sin;
  var _llvm_memset_p0i8_i64=_memset;
  function _fmax(x, y) {
      return isNaN(x) ? y : isNaN(y) ? x : Math.max(x, y);
    }
  function _fmin(x, y) {
      return isNaN(x) ? y : isNaN(y) ? x : Math.min(x, y);
    }
  var _atan2=Math.atan2;
  var _sqrt=Math.sqrt;
  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
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
      var ptable = GL.uniformTable[program];
      if (!ptable) ptable = GL.uniformTable[program] = {};
      var id = ptable[name];
      if (id) return id;
      var loc = Module.ctx.getUniformLocation(GL.programs[program], name);
      if (!loc) return -1;
      id = GL.getNewId(GL.uniforms);
      GL.uniforms[id] = loc;
      ptable[name] = id;
      return id;
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:35,EIDRM:36,ECHRNG:37,EL2NSYNC:38,EL3HLT:39,EL3RST:40,ELNRNG:41,EUNATCH:42,ENOCSI:43,EL2HLT:44,EDEADLK:45,ENOLCK:46,EBADE:50,EBADR:51,EXFULL:52,ENOANO:53,EBADRQC:54,EBADSLT:55,EDEADLOCK:56,EBFONT:57,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:74,ELBIN:75,EDOTDOT:76,EBADMSG:77,EFTYPE:79,ENOTUNIQ:80,EBADFD:81,EREMCHG:82,ELIBACC:83,ELIBBAD:84,ELIBSCN:85,ELIBMAX:86,ELIBEXEC:87,ENOSYS:88,ENMFILE:89,ENOTEMPTY:90,ENAMETOOLONG:91,ELOOP:92,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:106,EPROTOTYPE:107,ENOTSOCK:108,ENOPROTOOPT:109,ESHUTDOWN:110,ECONNREFUSED:111,EADDRINUSE:112,ECONNABORTED:113,ENETUNREACH:114,ENETDOWN:115,ETIMEDOUT:116,EHOSTDOWN:117,EHOSTUNREACH:118,EINPROGRESS:119,EALREADY:120,EDESTADDRREQ:121,EMSGSIZE:122,EPROTONOSUPPORT:123,ESOCKTNOSUPPORT:124,EADDRNOTAVAIL:125,ENETRESET:126,EISCONN:127,ENOTCONN:128,ETOOMANYREFS:129,EPROCLIM:130,EUSERS:131,EDQUOT:132,ESTALE:133,ENOTSUP:134,ENOMEDIUM:135,ENOSHARE:136,ECASECLASH:137,EILSEQ:138,EOVERFLOW:139,ECANCELED:140,ENOTRECOVERABLE:141,EOWNERDEAD:142,ESTRPIPE:143};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STATIC);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,createFileHandle:function (stream, fd) {
        if (typeof stream === 'undefined') {
          stream = null;
        }
        if (!fd) {
          if (stream && stream.socket) {
            for (var i = 1; i < 64; i++) {
              if (!FS.streams[i]) {
                fd = i;
                break;
              }
            }
            assert(fd, 'ran out of low fds for sockets');
          } else {
            fd = Math.max(FS.streams.length, 64);
            for (var i = FS.streams.length; i < fd; i++) {
              FS.streams[i] = null; // Keep dense
            }
          }
        }
        // Close WebSocket first if we are about to replace the fd (i.e. dup2)
        if (FS.streams[fd] && FS.streams[fd].socket && FS.streams[fd].socket.close) {
          FS.streams[fd].socket.close();
        }
        FS.streams[fd] = stream;
        return fd;
      },removeFileHandle:function (fd) {
        FS.streams[fd] = null;
      },joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
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
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
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
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
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
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        FS.createDevice(devFolder, 'null', function(){}, function(){});
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        // TODO: put these low in memory like we used to assert on: assert(Math.max(_stdin, _stdout, _stderr) < 15000); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_NORMAL) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  function _send(fd, buf, len, flags) {
      var info = FS.streams[fd];
      if (!info) return -1;
      info.sender(HEAPU8.subarray(buf, buf+len));
      return len;
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (stream && ('socket' in stream)) {
          return _send(fildes, buf, nbyte, 0);
      } else if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
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
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
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
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
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
      GL.programs[id] = Module.ctx.createProgram();
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
        if (FS.streams[stream]) FS.streams[stream].error = true;
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
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  var _sqrtf=Math.sqrt;
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
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
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
              var b = new Blob([byteArray], { type: getMimetype(name) });
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
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
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
          var x = event.pageX - (window.scrollX + rect.left);
          var y = event.pageY - (window.scrollY + rect.top);
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
      }};var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},events:[],fonts:[null],audios:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,keyboardState:null,keyboardMap:{},textInput:false,startTime:null,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},keyCodes:{16:1249,17:1248,18:1250,33:1099,34:1102,37:1104,38:1106,39:1103,40:1105,46:127,96:1112,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,173:45,188:44,190:46,191:47,192:96},scanCodes:{9:43,13:40,27:41,32:44,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,92:49,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,305:224,308:226},structs:{Rect:{__size__:16,x:0,y:4,w:8,h:12},PixelFormat:{__size__:36,format:0,palette:4,BitsPerPixel:8,BytesPerPixel:9,padding1:10,padding2:11,Rmask:12,Gmask:16,Bmask:20,Amask:24,Rloss:28,Gloss:29,Bloss:30,Aloss:31,Rshift:32,Gshift:33,Bshift:34,Ashift:35},KeyboardEvent:{__size__:16,type:0,windowID:4,state:8,repeat:9,padding2:10,padding3:11,keysym:12},keysym:{__size__:16,scancode:0,sym:4,mod:8,unicode:12},TextInputEvent:{__size__:264,type:0,windowID:4,text:8},MouseMotionEvent:{__size__:28,type:0,windowID:4,state:8,padding1:9,padding2:10,padding3:11,x:12,y:16,xrel:20,yrel:24},MouseButtonEvent:{__size__:20,type:0,windowID:4,button:8,state:9,padding1:10,padding2:11,x:12,y:16},ResizeEvent:{__size__:12,type:0,w:4,h:8},AudioSpec:{__size__:24,freq:0,format:4,channels:6,silence:7,samples:8,size:12,callback:16,userdata:20},version:{__size__:3,major:0,minor:1,patch:2}},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + SDL.structs.Rect.x)>>2)],
          y: HEAP32[((rect + SDL.structs.Rect.y)>>2)],
          w: HEAP32[((rect + SDL.structs.Rect.w)>>2)],
          h: HEAP32[((rect + SDL.structs.Rect.h)>>2)]
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
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (a/255) + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var surf = _malloc(14*Runtime.QUANTUM_SIZE);  // SDL_Surface has 14 fields of quantum size
        var buffer = _malloc(width*height*4); // TODO: only allocate when locked the first time
        var pixelFormat = _malloc(18*Runtime.QUANTUM_SIZE);
        flags |= 1; // SDL_HWSURFACE - this tells SDL_MUSTLOCK that this needs to be locked
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var is_SDL_HWPALETTE = flags & 0x00200000;  
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        HEAP32[((surf+Runtime.QUANTUM_SIZE*0)>>2)]=flags         // SDL_Surface.flags
        HEAP32[((surf+Runtime.QUANTUM_SIZE*1)>>2)]=pixelFormat // SDL_Surface.format TODO
        HEAP32[((surf+Runtime.QUANTUM_SIZE*2)>>2)]=width         // SDL_Surface.w
        HEAP32[((surf+Runtime.QUANTUM_SIZE*3)>>2)]=height        // SDL_Surface.h
        HEAP32[((surf+Runtime.QUANTUM_SIZE*4)>>2)]=width * bpp       // SDL_Surface.pitch, assuming RGBA or indexed for now,
                                                                                 // since that is what ImageData gives us in browsers
        HEAP32[((surf+Runtime.QUANTUM_SIZE*5)>>2)]=buffer      // SDL_Surface.pixels
        HEAP32[((surf+Runtime.QUANTUM_SIZE*6)>>2)]=0      // SDL_Surface.offset
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.format)>>2)]=-2042224636 // SDL_PIXELFORMAT_RGBA8888
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.palette)>>2)]=0 // TODO
        HEAP8[((pixelFormat + SDL.structs.PixelFormat.BitsPerPixel)|0)]=bpp * 8
        HEAP8[((pixelFormat + SDL.structs.PixelFormat.BytesPerPixel)|0)]=bpp
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.Rmask)>>2)]=rmask || 0x000000ff
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.Gmask)>>2)]=gmask || 0x0000ff00
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.Bmask)>>2)]=bmask || 0x00ff0000
        HEAP32[((pixelFormat + SDL.structs.PixelFormat.Amask)>>2)]=amask || 0xff000000
        // Decide if we want to use WebGL or not
        var useWebGL = (flags & 0x04000000) != 0; // SDL_OPENGL
        SDL.GL = SDL.GL || useWebGL;
        var canvas;
        if (!usePageCanvas) {
          canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
        var ctx = Browser.createContext(canvas, useWebGL, usePageCanvas);
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
          isFlagSet: function (flag) {
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
        _free(SDL.surfaces[surf].buffer);
        _free(SDL.surfaces[surf].pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
      },receiveEvent:function (event) {
        switch(event.type) {
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
                event.preventDefault();
                return;
              }
              SDL.DOMButtons[event.button] = 0;
            }
            if (event.type == 'keypress' && !SDL.textInput) {
              break;
            }
            SDL.events.push(event);
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
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        // manually triggered resize event doesn't have a preventDefault member
        if (event.preventDefault) {
          event.preventDefault();
        }
        return;
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, SDL.structs.KeyboardEvent.__size__); // XXX
          return;
        }
        switch(event.type) {
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
            var code = SDL.keyCodes[event.keyCode] || event.keyCode;
            HEAP8[(((SDL.keyboardState)+(code))|0)]=down;
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))|0)] ? 0x0040 | 0x0080 : 0) | // KMOD_LCTRL & KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))|0)] ? 0x0001 | 0x0002 : 0) | // KMOD_LSHIFT & KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))|0)] ? 0x0100 | 0x0200 : 0); // KMOD_LALT & KMOD_RALT
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type]
            HEAP8[(((ptr)+(SDL.structs.KeyboardEvent.state))|0)]=down ? 1 : 0
            HEAP8[(((ptr)+(SDL.structs.KeyboardEvent.repeat))|0)]=0 // TODO
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.scancode))>>2)]=scan
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.sym))>>2)]=key
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.mod))>>2)]=SDL.modState
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.keysym + SDL.structs.keysym.unicode))>>2)]=key
            break;
          }
          case 'keypress': {
            HEAP32[(((ptr)+(SDL.structs.TextInputEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type]
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(SDL.structs.TextInputEvent.text + i))|0)]=cStr[i];
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
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[(((ptr)+(SDL.structs.MouseButtonEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(SDL.structs.MouseButtonEvent.button))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(SDL.structs.MouseButtonEvent.state))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(SDL.structs.MouseButtonEvent.x))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(SDL.structs.MouseButtonEvent.y))>>2)]=Browser.mouseY;
            } else {
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(SDL.structs.MouseMotionEvent.state))|0)]=SDL.buttonState;
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.x))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.y))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.xrel))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(SDL.structs.MouseMotionEvent.yrel))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'unload': {
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[(((ptr)+(SDL.structs.KeyboardEvent.type))>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(SDL.structs.ResizeEvent.w))>>2)]=event.w;
            HEAP32[(((ptr)+(SDL.structs.ResizeEvent.h))>>2)]=event.h;
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
        if (SDL.numChannels && SDL.numChannels >= num) return;
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
        document.addEventListener("blur", SDL.receiveEvent);
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
      console.log('TODO: SDL_GL_SetAttribute');
    }
  function _SDL_SetVideoMode(width, height, depth, flags) {
      ['mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
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
        Runtime.dynCall('v', func);
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
      function ExitStatus() {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
        Module.print('Exit Status: ' + status);
      };
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      exitRuntime();
      ABORT = true;
      throw new ExitStatus();
    }function _exit(status) {
      __exit(status);
    }
  var _fabs=Math.abs;
  function ___fpclassifyf(x) {
      if (isNaN(x)) return 0;
      if (!isFinite(x)) return 1;
      if (x == 0) return 2;
      // FP_SUBNORMAL..?
      return 4;
    }var ___fpclassifyd=___fpclassifyf;
  Module["_strncpy"] = _strncpy;
  var _llvm_expect_i32=undefined;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
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
GL.init()
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
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
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=+env.NaN;var n=+env.Infinity;var o=0;var p=0;var q=0;var r=0;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=global.Math.floor;var M=global.Math.abs;var N=global.Math.sqrt;var O=global.Math.pow;var P=global.Math.cos;var Q=global.Math.sin;var R=global.Math.tan;var S=global.Math.acos;var T=global.Math.asin;var U=global.Math.atan;var V=global.Math.atan2;var W=global.Math.exp;var X=global.Math.log;var Y=global.Math.ceil;var Z=global.Math.imul;var _=env.abort;var $=env.assert;var aa=env.asmPrintInt;var ab=env.asmPrintFloat;var ac=env.min;var ad=env.jsCall;var ae=env.invoke_vif;var af=env.invoke_i;var ag=env.invoke_vi;var ah=env.invoke_vii;var ai=env.invoke_ii;var aj=env.invoke_viii;var ak=env.invoke_v;var al=env.invoke_iii;var am=env._llvm_lifetime_end;var an=env._rand;var ao=env._glUseProgram;var ap=env._glClearColor;var aq=env._snprintf;var ar=env._glGetProgramiv;var as=env._glVertexAttribPointer;var at=env._glGetShaderInfoLog;var au=env._abort;var av=env._fprintf;var aw=env._send;var ax=env._glLinkProgram;var ay=env._printf;var az=env._glGetUniformLocation;var aA=env.___fpclassifyf;var aB=env._SDL_SetVideoMode;var aC=env._fabs;var aD=env._glDrawArrays;var aE=env._fputc;var aF=env._glEnable;var aG=env._llvm_stackrestore;var aH=env._puts;var aI=env._llvm_lifetime_start;var aJ=env.___setErrNo;var aK=env._fwrite;var aL=env._glClear;var aM=env._sqrt;var aN=env._sqrtf;var aO=env._write;var aP=env._fputs;var aQ=env._glGenBuffers;var aR=env._glEnableVertexAttribArray;var aS=env._glGetAttribLocation;var aT=env._glBindBuffer;var aU=env._exit;var aV=env._glAttachShader;var aW=env._glCompileShader;var aX=env._sin;var aY=env._glBlendFunc;var aZ=env._glCreateProgram;var a_=env._sysconf;var a$=env._glBufferData;var a0=env._fmax;var a1=env._glViewport;var a2=env.__reallyNegative;var a3=env.__formatString;var a4=env._SDL_GL_SetAttribute;var a5=env._sprintf;var a6=env._SDL_GetTicks;var a7=env._glShaderSource;var a8=env.___assert_func;var a9=env._glUniformMatrix4fv;var ba=env._cos;var bb=env._pwrite;var bc=env._SDL_PollEvent;var bd=env._sbrk;var be=env._llvm_stacksave;var bf=env._SDL_Init;var bg=env._SDL_GetError;var bh=env._emscripten_set_main_loop;var bi=env.___errno_location;var bj=env._glDeleteBuffers;var bk=env._atan2;var bl=env._SDL_Quit;var bm=env._fmin;var bn=env._time;var bo=env._glGetShaderiv;var bp=env.__exit;var bq=env._glCreateShader;
// EMSCRIPTEN_START_FUNCS
function bz(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7>>3<<3;return b|0}function bA(){return i|0}function bB(a){a=a|0;i=a}function bC(a,b){a=a|0;b=b|0;if((o|0)==0){o=a;p=b}}function bD(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function bE(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function bF(a){a=a|0;B=a}function bG(a){a=a|0;C=a}function bH(a){a=a|0;D=a}function bI(a){a=a|0;E=a}function bJ(a){a=a|0;F=a}function bK(a){a=a|0;G=a}function bL(a){a=a|0;H=a}function bM(a){a=a|0;I=a}function bN(a){a=a|0;J=a}function bO(a){a=a|0;K=a}function bP(a,b){a=a|0;b=b|0;return((b|0)==(2632|0)?2448:0)|0}function bQ(a,b){a=a|0;b=b|0;return((b|0)==(2456|0)?2440:0)|0}function bR(a,b){a=a|0;b=b|0;c[a+68>>2]=b;return}function bS(a){a=a|0;c[a+20>>2]=1;return}function bT(a){a=a|0;return a+12|0}function bU(a){a=a|0;return a+8|0}function bV(a,b){a=a|0;b=b|0;eb(b,a);return}function bW(a,b){a=a|0;b=b|0;dS(b,a);return}function bX(a){a=a|0;ev(a+16|0,0,60);c[a+52>>2]=d5(d3(2848)|0)|0;return a|0}function bY(a){a=a|0;var b=0,d=0;b=a+52|0;d=a+48|0;d2(c[b>>2]|0,50,c[d>>2]|0)|0;d6(c[d>>2]|0)|0;d6(c[b>>2]|0)|0;return a|0}function bZ(a,b,d){a=a|0;b=b|0;d=+d;var e=0,f=0,g=0,j=0,k=0;e=i;f=b;b=i;i=i+16|0;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];f=d7(2544)|0;g=f+16|0;j=b;c[g>>2]=c[j>>2];c[g+4>>2]=c[j+4>>2];c[g+8>>2]=c[j+8>>2];c[g+12>>2]=c[j+12>>2];h[f+32>>3]=d;g=f+40|0;h[g>>3]=d*3.141592653589793*d;b=d7(2800)|0;h[b+32>>3]=d;k=b+16|0;c[k>>2]=c[j>>2];c[k+4>>2]=c[j+4>>2];c[k+8>>2]=c[j+8>>2];c[k+12>>2]=c[j+12>>2];k=b+80|0;c[k>>2]=c[j>>2];c[k+4>>2]=c[j+4>>2];c[k+8>>2]=c[j+8>>2];c[k+12>>2]=c[j+12>>2];h[b+48>>3]=+h[g>>3];c[b+196>>2]=f;g=f+52|0;d$(c[g>>2]|0,b)|0;b=a;c[f+48>>2]=dN(b)|0;d2(c[g>>2]|0,36,b)|0;i=e;return f|0}function b_(a){a=a|0;var b=0,d=0,e=0;do{if((a|0)==0){b=0}else{d=a+196|0;e=c[d>>2]|0;if((e|0)==0){b=0;break}if((dJ(e,2544)|0)==0){b=0;break}b=c[(c[d>>2]|0)+68>>2]|0}}while(0);return b|0}function b$(a){a=a|0;var b=0,d=0;b=a+20|0;d=a+786440|0;c[d>>2]=b;d2(c[a+12>>2]|0,38,a)|0;cK(1);cM(c[a+16>>2]|0,b,(c[d>>2]|0)-b|0);return}function b0(a){a=a|0;var b=0;b=a+12|0;ev(b|0,0,786432);c[b>>2]=d5(d3(2848)|0)|0;aQ(1,a+16|0);return a|0}function b1(a){a=a|0;bj(1,a+16|0);return a|0}function b2(){return d7(2568)|0}function b3(a,b){a=a|0;b=b|0;d$(c[a+12>>2]|0,b|0)|0;return}function b4(b,e){b=b|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0;f=i;i=i+40|0;g=f|0;j=f+32|0;k=j;if((c[b+56>>2]|0)==0){i=f;return}l=e+786440|0;e=c[l>>2]|0;m=+h[b+32>>3];n=+h[b+16>>3];o=+h[b+24>>3];h[g>>3]=m+o;h[g+8>>3]=m+n;h[g+16>>3]=o-m;h[g+24>>3]=n-m;p=cc(e,42,g)|0;if((c[b+68>>2]|0)==0){g=b+64|0;c[j>>2]=d[g]|d[g+1|0]<<8|d[g+2|0]<<16|d[g+3|0]<<24}else{a[j]=-111;a[k+1|0]=-1;a[k+2|0]=85;a[k+3|0]=-1}c[l>>2]=ce(e,p,42,82,k)|0;i=f;return}function b5(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b|0;ev(d|0,0,16);e=a+8|0;h[a+8>>3]=1.0;h[a+16>>3]=1.0;f=a+24|0;c[f>>2]=c[d>>2];c[f+4>>2]=c[d+4>>2];c[f+8>>2]=c[d+8>>2];c[f+12>>2]=c[d+12>>2];d=a+40|0;c[d>>2]=c[e>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];c[d+16>>2]=c[e+16>>2];c[d+20>>2]=c[e+20>>2];c[d+24>>2]=c[e+24>>2];c[d+28>>2]=c[e+28>>2];h[a+72>>3]=0.0;i=b;return a|0}function b6(a,b){a=a|0;b=b|0;var c=0.0,d=0.0,e=0.0,f=0.0,i=0.0,j=0.0,k=0.0;c=+h[a+16>>3];d=+h[a+32>>3];e=+h[a+8>>3];f=+h[a+24>>3];i=c-d;j=(-0.0-(c+d))/i;d=e-f;c=(-0.0-(e+f))/d;f=+h[a+72>>3];e=+P(+f);k=+Q(+f);f=2.0/i;g[b>>2]=e*f;i=2.0/d;g[b+16>>2]=k*i;d=-0.0-k;g[b+4>>2]=f*d;g[b+20>>2]=e*i;g[b+40>>2]=-.0020000000949949026;g[b+48>>2]=j*e+c*k;g[b+52>>2]=c*e+j*d;g[b+56>>2]=-1.0;return a|0}function b7(b,d){b=b|0;d=+d;var e=0,f=0,j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0;e=i;i=i+16|0;f=e|0;j=e+8|0;dG(f,j);k=cy()|0;d=+g[f>>2];h[k+40>>3]=+g[j>>2];h[k+48>>3]=d;ev(k+56|0,0,16);if(!(a[2432]|0)){h[k+8>>3]=640.0;h[k+16>>3]=640.0;ev(k+24|0,0,16);a[2432]=1}j=b+20|0;f=c[b+16>>2]|0;do{if((c[j>>2]|0)==0){if(((c[f+52>>2]|0)-3|0)>>>0<2){l=36;break}m=b+32|0;d=+g[m>>2]+-.05;g[m>>2]=d;n=d}else{l=36}}while(0);if((l|0)==36){l=b+32|0;d=+g[l>>2]+.1;g[l>>2]=d;n=d}d=+g[b+24>>2];o=+a0(+d,+(+bm(+(+g[b+28>>2]),+n)));g[b+32>>2]=o;l=b+16|0;do{if((f|0)!=0){n=+h[f+16>>3];d=o*+g[b+36>>2];p=+h[f+8>>3];h[k+8>>3]=n+d;h[k+16>>3]=p+d;h[k+24>>3]=n-d;h[k+32>>3]=p-d;if((c[f+52>>2]|0)!=2){break}m=c[f+40>>2]|0;q=c[(c[l>>2]|0)+56>>2]|0;d=+h[m+16>>3]- +h[q+16>>3];p=+h[m+24>>3]- +h[q+24>>3];n=1.0/+N(+(d*d+p*p));r=+V(+(p*n),+(d*n))-1.5707963267948966;n=r;q=k+72|0;d=+h[q>>3];p=d-3.141592653589793;if(n<p){s=n;while(1){n=s+6.283185307179586;t=n;if(t<p){s=t}else{u=n;break}}}else{u=r}s=u;p=d+3.141592653589793;if(s>p){n=s;while(1){t=n-6.283185307179586;if(t>p){n=t}else{v=t;break}}}else{v=s}h[q>>3]=d+(v-d)*.1}}while(0);if(((c[(c[l>>2]|0)+52>>2]|0)-3|0)>>>0>=2){c[j>>2]=0;i=e;return}l=k+72|0;h[l>>3]=+h[l>>3]+.01;c[j>>2]=0;i=e;return}function b8(a){a=a|0;ev(a+12|0,0,24);g[a+24>>2]=1.0;g[a+28>>2]=10.0;g[a+32>>2]=1.0;g[a+36>>2]=80.0;return a|0}function b9(a){a=a|0;d6(c[a+16>>2]|0)|0;return a|0}function ca(){return d7(2520)|0}function cb(a,b){a=a|0;b=b|0;var d=0;d=a+16|0;d6(c[d>>2]|0)|0;c[d>>2]=dN(b)|0;return a|0}function cc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0.0,j=0.0,k=0.0,l=0.0;d=i;e=c;c=i;i=i+32|0;ew(c,e,32)|0;f=+h[c+24>>3];g[a>>2]=f;j=+h[c>>3];g[a+4>>2]=j;e=bv[b&127](a)|0;k=+h[c+8>>3];g[e>>2]=k;g[e+4>>2]=j;a=bv[b&127](e)|0;g[a>>2]=k;l=+h[c+16>>3];g[a+4>>2]=l;c=bv[b&127](a)|0;g[c>>2]=f;g[c+4>>2]=j;a=bv[b&127](c)|0;g[a>>2]=f;g[a+4>>2]=l;c=bv[b&127](a)|0;g[c>>2]=k;g[c+4>>2]=l;a=bv[b&127](c)|0;i=d;return a|0}function cd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=+f;var j=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0;j=i;l=e;e=i;i=i+32|0;ew(e,l,32)|0;m=+P(+f);n=+Q(+f);l=e|0;f=(c[k>>2]=d[l]|d[l+1|0]<<8|d[l+2|0]<<16|d[l+3|0]<<24,c[k+4>>2]=d[l+4|0]|d[l+5|0]<<8|d[l+6|0]<<16|d[l+7|0]<<24,+h[k>>3]);l=e+8|0;o=(c[k>>2]=d[l]|d[l+1|0]<<8|d[l+2|0]<<16|d[l+3|0]<<24,c[k+4>>2]=d[l+4|0]|d[l+5|0]<<8|d[l+6|0]<<16|d[l+7|0]<<24,+h[k>>3]);l=e+16|0;p=(c[k>>2]=d[l]|d[l+1|0]<<8|d[l+2|0]<<16|d[l+3|0]<<24,c[k+4>>2]=d[l+4|0]|d[l+5|0]<<8|d[l+6|0]<<16|d[l+7|0]<<24,+h[k>>3]);l=e+24|0;q=(c[k>>2]=d[l]|d[l+1|0]<<8|d[l+2|0]<<16|d[l+3|0]<<24,c[k+4>>2]=d[l+4|0]|d[l+5|0]<<8|d[l+6|0]<<16|d[l+7|0]<<24,+h[k>>3]);r=(o-q)*.5;o=(f-p)*.5;f=q+r;q=p+o;p=m;m=p*r;s=f+m;t=n;n=t*o;u=s-n;g[a>>2]=u;v=p*o;o=q+v;p=t*r;r=o+p;g[a+4>>2]=r;l=bv[b&127](a)|0;t=f-m;g[l>>2]=t-n;g[l+4>>2]=o-p;a=bv[b&127](l)|0;o=n+t;g[a>>2]=o;t=q-v;v=t-p;g[a+4>>2]=v;l=bv[b&127](a)|0;g[l>>2]=u;g[l+4>>2]=r;a=bv[b&127](l)|0;g[a>>2]=n+s;g[a+4>>2]=t+p;l=bv[b&127](a)|0;g[l>>2]=o;g[l+4>>2]=v;a=bv[b&127](l)|0;i=j;return a|0}function ce(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;j=i;k=h;h=i;i=i+4|0;i=i+7>>3<<3;c[h>>2]=c[k>>2];if(b>>>0>=e>>>0){i=j;return e|0}k=h;h=d[k]|d[k+1|0]<<8|d[k+2|0]<<16|d[k+3|0]<<24|0;k=b;do{b=bv[g&127](k)|0;t=h;a[b]=t&255;t=t>>8;a[b+1|0]=t&255;t=t>>8;a[b+2|0]=t&255;t=t>>8;a[b+3|0]=t&255;k=bv[f&127](k)|0;}while(k>>>0<e>>>0);i=j;return e|0}function cf(a){a=a|0;var b=0,d=0,e=0;b=a+88|0;d=c[b>>2]|0;if((d|0)!=0){e=d;return e|0}d=cr(a)|0;c[b>>2]=d;e=d;return e|0}function cg(a,b){a=a|0;b=b|0;var c=0;if((b|0)==(2616|0)){c=2408;return c|0}c=(b|0)==(2456|0)?2424:0;return c|0}function ch(a,b){a=a|0;b=b|0;return((b|0)==(2632|0)?2416:0)|0}function ci(){return c[(c[452]|0)+4>>2]|0}function cj(b,d){b=b|0;d=+d;var e=0,f=0,g=0,i=0,j=0.0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0,v=0,w=0,x=0;e=b+40|0;f=b+8|0;g=(c[e>>2]|0)+16|0;c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];f=b+44|0;i=(c[f>>2]|0)+16|0;c[i>>2]=c[g>>2];c[i+4>>2]=c[g+4>>2];c[i+8>>2]=c[g+8>>2];c[i+12>>2]=c[g+12>>2];g=(c[f>>2]|0)+80|0;f=(c[e>>2]|0)+80|0;c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];f=b+52|0;g=c[f>>2]|0;do{if((g|0)==0){i=c[e>>2]|0;d=+V(+(+h[i+88>>3]- +h[i+24>>3]),+(+h[i+80>>3]- +h[i+16>>3]));i=b+32|0;j=+h[i>>3];h[i>>3]=j+(d-j)*.2}else if((g|0)==2){i=c[e>>2]|0;k=b+56|0;l=c[k>>2]|0;m=i+16|0;n=i+24|0;j=+h[l+16>>3];d=+h[l+24>>3];o=+h[m>>3]-j;p=+h[n>>3]-d;q=+N(+(o*o+p*p));r=+h[l+32>>3]+ +h[i+32>>3];if(q>r){s=1.0/q;h[m>>3]=j+r*o*s;h[n>>3]=d+r*p*s;t=c[e>>2]|0}else{t=i}i=t+80|0;n=t+16|0;c[i>>2]=c[n>>2];c[i+4>>2]=c[n+4>>2];c[i+8>>2]=c[n+8>>2];c[i+12>>2]=c[n+12>>2];n=c[(c[k>>2]|0)+196>>2]|0;if((n|0)==0){break}if((dJ(n,2544)|0)==0){break}i=n+56|0;L93:do{if((c[i>>2]|0)==0){if((c[n+68>>2]|0)!=0){break}m=b+72|0;l=(c[m>>2]|0)+1|0;c[m>>2]=l;u=c[b+64>>2]|0;if((u|0)==0){v=l}else{bt[u&63](l);v=c[m>>2]|0}do{if((v|0)!=3){if((v|0)>3){if((an()|0)<1073741823){break}}s=+(an()|0)*4.656612873077393e-10;a[n+64|0]=~~(s*138.0*.5+69.0);a[n+65|0]=~~(s*85.0*.5+42.0);a[n+66|0]=~~(s*63.0*.5+31.0);a[n+67|0]=-1;break L93}}while(0);c[n+60>>2]=(an()|0)%128&-1;a[n+64|0]=27;a[n+65|0]=43;a[n+66|0]=-52;a[n+67|0]=-1}}while(0);c[i>>2]=1;m=n+16|0;l=(c[k>>2]|0)+16|0;c[m>>2]=c[l>>2];c[m+4>>2]=c[l+4>>2];c[m+8>>2]=c[l+8>>2];c[m+12>>2]=c[l+12>>2];l=n+60|0;m=c[l>>2]|0;if((m|0)==0){break}u=b+80|0;if((c[u>>2]|0)>=128){break}w=(m|0)<1?m:1;c[l>>2]=m-w;c[u>>2]=(c[u>>2]|0)+w;u=b+84|0;m=(c[u>>2]|0)+w|0;c[u>>2]=m;u=c[b+68>>2]|0;if((u|0)!=0){bt[u&63](m)}s=1.0- +(c[l>>2]|0)*.0078125;a[n+64|0]=~~(s*111.0+27.0);a[n+65|0]=~~(s*42.0+43.0);a[n+66|0]=~~(s*-141.0+204.0)}}while(0);v=b+60|0;if((c[v>>2]|0)==0){x=c[b+76>>2]|0}else{t=b+80|0;e=c[t>>2]|0;g=(e|0)<5?e:5;l=b+76|0;m=c[l>>2]|0;u=(512-m|0)/16&-1;w=(g|0)>(u|0)?u:g;c[t>>2]=e-w;e=(w<<4)+m|0;c[l>>2]=e;x=e}e=x-1|0;c[b+76>>2]=e;if((e|0)>=0){return}if((c[f>>2]|0)==3){return}c[v>>2]=0;c[f>>2]=3;return}function ck(a){a=a|0;var b=0,d=0,e=0,f=0;ev(a+8|0,0,84);h[a+24>>3]=5.0;b=d5(d3(2800)|0)|0;d=a+40|0;c[d>>2]=b;h[b+32>>3]=5.0;b=a;c[(c[d>>2]|0)+196>>2]=b;e=d5(d3(2800)|0)|0;f=a+44|0;c[f>>2]=e;dx(e,c[d>>2]|0);h[(c[f>>2]|0)+32>>3]=5.0;c[(c[f>>2]|0)+180>>2]=1;c[(c[f>>2]|0)+196>>2]=b;c[(c[f>>2]|0)+192>>2]=38;c[a+76>>2]=512;return a|0}function cl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a+48|0;d=c[b>>2]|0;e=a+40|0;if((d|0)==0){f=a+44|0}else{dS(d,c[e>>2]|0);d=a+44|0;dS(c[b>>2]|0,c[d>>2]|0);g=c[b>>2]|0;d6(g)|0;f=d}d6(c[e>>2]|0)|0;d6(c[f>>2]|0)|0;return a|0}function cm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=a;a=i;i=i+16|0;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];c[a+8>>2]=c[d+8>>2];c[a+12>>2]=c[d+12>>2];d=d7(2496)|0;e=d+40|0;f=c[e>>2]|0;g=f+80|0;h=a;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];c[g+12>>2]=c[h+12>>2];g=f+16|0;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];c[g+12>>2]=c[h+12>>2];g=d+44|0;f=c[g>>2]|0;a=f+80|0;c[a>>2]=c[h>>2];c[a+4>>2]=c[h+4>>2];c[a+8>>2]=c[h+8>>2];c[a+12>>2]=c[h+12>>2];a=f+16|0;c[a>>2]=c[h>>2];c[a+4>>2]=c[h+4>>2];c[a+8>>2]=c[h+8>>2];c[a+12>>2]=c[h+12>>2];h=dN(ci()|0)|0;a=d+48|0;c[a>>2]=h;eb(h,c[e>>2]|0);eb(c[a>>2]|0,c[g>>2]|0);cA(d);c[d+52>>2]=0;i=b;return d|0}function cn(a,b){a=a|0;b=+b;var d=0,e=0.0,f=0.0,g=0,i=0,j=0,k=0;d=a+52|0;if((c[d>>2]|0)!=2){return}e=+P(+b);f=+Q(+b);g=a+40|0;i=c[g>>2]|0;j=i+16|0;k=i+24|0;b=+h[k>>3]+f*.2;h[j>>3]=+h[j>>3]+e*.2;h[k>>3]=b;k=c[g>>2]|0;b=f*10.0+ +h[k+24>>3];h[k+80>>3]=e*10.0+ +h[k+16>>3];h[k+88>>3]=b;if((c[d>>2]|0)==3){return}c[a+60>>2]=0;c[d>>2]=0;return}function co(b){b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0.0,y=0.0,z=0.0,A=0,B=0,C=0.0,D=0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0,K=0.0,L=0.0,M=0.0;d=i;i=i+272|0;e=d|0;f=d+32|0;g=d+64|0;j=d+96|0;k=d+104|0;l=d+112|0;m=d+144|0;n=d+152|0;o=d+184|0;p=d+192|0;q=d+224|0;r=d+232|0;s=d+264|0;t=b+4|0;u=c[t>>2]|0;if((c[u+52>>2]|0)==3){cz(36,b);i=d;return}else{dk(e,c[u+40>>2]|0);u=c[t>>2]|0;v=+h[u+24>>3]*1.5;w=u+32|0;x=+h[w>>3];y=+P(+x);z=+Q(+x);u=e|0;A=e+8|0;B=e+16|0;C=+h[B>>3];D=e+24|0;E=+h[D>>3];F=E+(+h[A>>3]-E)*.5;E=C+(+h[u>>3]-C)*.5;C=v*-.5;G=F-y*C;H=E-z*C;C=v*.25;h[f+8>>3]=C+G;h[f+24>>3]=G-C;G=v*.5;I=F-y*G;y=E-z*G;G=v;h[g>>3]=G+y;h[g+16>>3]=y-G;h[f>>3]=C+(C+H);h[f+16>>3]=H-C-C;h[g+8>>3]=G+I-C;h[g+24>>3]=C+(I-G);e=b+12|0;ev(e|0,0,720);J=cd(e,42,g,+h[w>>3])|0;a[j|0]=-1;a[j+1|0]=116;a[j+2|0]=59;a[j+3|0]=-1;w=ce(e,J,42,82,j)|0;j=cd(w,42,f,+h[(c[t>>2]|0)+32>>3])|0;a[k|0]=-1;a[k+1|0]=116;a[k+2|0]=59;a[k+3|0]=-1;f=ce(w,j,42,82,k)|0;I=x+1.5707963267948966;C=+P(+I);H=+Q(+I);y=+h[B>>3];z=+h[D>>3];E=v*2.0;F=E*C;C=E*H;H=F+(z+(+h[A>>3]-z)*.5);z=C+(y+(+h[u>>3]-y)*.5);h[l>>3]=z+1.0;h[l+8>>3]=G+H;h[l+16>>3]=z+-1.0;h[l+24>>3]=H-G;k=cd(f,42,l,+h[(c[t>>2]|0)+32>>3]+-.5235987755982988)|0;a[m|0]=-111;a[m+1|0]=-1;a[m+2|0]=85;a[m+3|0]=64;l=ce(f,k,42,82,m)|0;H=I+1.0471975511965976;I=+P(+H);z=+Q(+H);H=+h[B>>3];y=+h[D>>3];m=c[t>>2]|0;K=v*+(c[m+76>>2]|0)*.001953125;L=v-K;M=F+(y+(+h[A>>3]-y)*.5)+I*L;I=C+(H+(+h[u>>3]-H)*.5)+z*L;L=K;h[n>>3]=I+1.0;h[n+8>>3]=L+M;h[n+16>>3]=I+-1.0;h[n+24>>3]=M-L;k=cd(l,42,n,+h[m+32>>3]+-.5235987755982988)|0;a[o|0]=-111;a[o+1|0]=-1;a[o+2|0]=85;a[o+3|0]=-1;m=ce(l,k,42,82,o)|0;L=x-1.5707963267948966;x=+P(+L);M=+Q(+L);I=+h[B>>3];K=+h[D>>3];z=E*x;x=E*M;M=z+(K+(+h[A>>3]-K)*.5);K=x+(I+(+h[u>>3]-I)*.5);h[p>>3]=K+1.0;h[p+8>>3]=G+M;h[p+16>>3]=K+-1.0;h[p+24>>3]=M-G;o=cd(m,42,p,+h[(c[t>>2]|0)+32>>3]+.5235987755982988)|0;a[q|0]=27;a[q+1|0]=43;a[q+2|0]=-52;a[q+3|0]=64;p=ce(m,o,42,82,q)|0;G=L-1.0471975511965976;L=+P(+G);M=+Q(+G);G=+h[B>>3];K=+h[D>>3];D=c[t>>2]|0;I=v*+(c[D+80>>2]|0)*.0078125;E=v-I;v=z+(K+(+h[A>>3]-K)*.5)+L*E;L=x+(G+(+h[u>>3]-G)*.5)+M*E;E=I;h[r>>3]=L+1.0;h[r+8>>3]=E+v;h[r+16>>3]=L+-1.0;h[r+24>>3]=v-E;u=cd(p,42,r,+h[D+32>>3]+.5235987755982988)|0;a[s|0]=27;a[s+1|0]=43;a[s+2|0]=-52;a[s+3|0]=-1;ce(p,u,42,82,s)|0;cK(1);cM(c[b+8>>2]|0,e,432);i=d;return}}function cp(a){a=a|0;aQ(1,a+8|0);return a|0}function cq(a){a=a|0;bj(1,a+8|0);d6(c[a+4>>2]|0)|0;return a|0}function cr(a){a=a|0;var b=0;b=d7(2472)|0;c[b+4>>2]=dN(a)|0;return b|0}function cs(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)!=0){cs(b)}ek(a);return}function ct(a){a=a|0;var b=0,d=0;c[a+4>>2]=d5(d3(2592)|0)|0;c[a+8>>2]=d5(d3(2848)|0)|0;b=eg(12)|0;d=b;ev(b|0,0,12);c[a+12>>2]=d;c[a+16>>2]=d;return a|0}function cu(a){a=a|0;d6(c[a+8>>2]|0)|0;cs(c[a+12>>2]|0);return a|0}function cv(){c[452]=d5(d3(2824)|0)|0;return}function cw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;d=a+196|0;e=(dJ(c[d>>2]|0,2496)|0)==0;f=e?a:b;a=c[(e?b+196|0:d)>>2]|0;if((a|0)==0){a8(1688,224,2328,1720)}if((f|0)==(c[a+40>>2]|0)){a8(1688,225,2328,1472)}d=a+56|0;d6(c[d>>2]|0)|0;b=dN(f)|0;c[d>>2]=b;d=a+52|0;if((c[d>>2]|0)==3){return}f=c[b+196>>2]|0;do{if((f|0)!=0){if((dJ(f,2544)|0)==0){break}if((c[f+68>>2]|0)==0){break}c[a+60>>2]=1}}while(0);c[d>>2]=2;return}function cx(a){a=a|0;c[56]=a;return}function cy(){return c[(c[450]|0)+12>>2]|0}function cz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=c[(c[452]|0)+16>>2]|0;while(1){if((d|0)==0){e=0;break}if((c[d>>2]|0)!=0){e=d;break}f=c[d+8>>2]|0;if((f|0)==0){e=d;break}else{d=f}}d=e+8|0;f=c[d>>2]|0;if((f|0)==0){g=eg(12)|0;h=g;ev(g|0,0,12);c[d>>2]=h;i=h}else{i=f}c[i>>2]=0;c[e>>2]=a;c[e+4>>2]=b;c[(c[452]|0)+16>>2]=c[d>>2];return}function cA(a){a=a|0;cY(c[(c[452]|0)+8>>2]|0,a);return}function cB(a){a=+a;var b=0,d=0,e=0,f=0;b=c[452]|0;cZ(c[b+8>>2]|0,a);d=b+12|0;e=c[d>>2]|0;do{f=c[e>>2]|0;if((f|0)==0){break}bt[f&63](c[e+4>>2]|0);e=c[e+8>>2]|0;}while((e|0)!=0);c[c[d>>2]>>2]=0;c[b+16>>2]=c[d>>2];dR(c[b+4>>2]|0,a);return}function cC(a){a=a|0;c[a+12>>2]=d5(d3(2896)|0)|0;c[a+16>>2]=d5(d3(2848)|0)|0;return a|0}function cD(a){a=a|0;d6(c[a+12>>2]|0)|0;d6(c[a+16>>2]|0)|0;return a|0}function cE(){c[450]=d5(d3(2752)|0)|0;ap(0.0,0.0,0.0,0.0);aF(3042);aY(770,771);cI();return}function cF(a){a=a|0;c$(c[(c[450]|0)+16>>2]|0,a);return}function cG(a){a=a|0;c0(c[(c[450]|0)+16>>2]|0,a);return}function cH(){ap(.03921568766236305,.08627451211214066,.12156862765550613,1.0);aL(16384);b6(c[(c[450]|0)+12>>2]|0,2688)|0;cL(2688);c1(c[(c[450]|0)+16>>2]|0);return}function cI(){var a=0,b=0,d=0,e=0;a=i;i=i+8|0;b=a|0;d=aZ()|0;e=bq(35632)|0;cN(e,896);aV(d|0,e|0);e=bq(35633)|0;cN(e,1040);aV(d|0,e|0);ax(d|0);ar(d|0,35714,b|0);if((c[b>>2]|0)==0){aH(24)|0}c[168]=d;c[169]=34;ao(d|0);d=aS(c[168]|0,1320)|0;c[170]=d;aR(d|0);d=aS(c[168]|0,1680)|0;c[171]=d;aR(d|0);d=az(c[168]|0,1440)|0;c[172]=d;b=c[170]|0;ay(1336,(s=i,i=i+24|0,c[s>>2]=c[168],c[s+8>>2]=b,c[s+16>>2]=d,s)|0)|0;i=a;return}function cJ(a,b,d){a=a|0;b=b|0;d=d|0;if((c[173]|0)!=0){a9(c[172]|0,1,0,136);c[173]=0}aT(34962,a|0);a$(34962,d|0,b|0,35048);as(c[170]|0,2,5126,0,12,0);as(c[171]|0,4,5121,1,12,8);aD(4,0,(d>>>0)/12>>>0|0);return}function cK(a){a=a|0;if((c[180]|0)==(a|0)){return}c[180]=a;if((a|0)!=1){return}ao(c[168]|0);return}function cL(a){a=a|0;var b=0;c[173]=1;b=a;ew(136,b|0,64)|0;return}function cM(a,b,d){a=a|0;b=b|0;d=d|0;bw[c[169]&63](a,b,d);return}function cN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+32|0;e=d|0;f=d+16|0;g=d+24|0;c[e>>2]=ex(b|0)|0;h=d+8|0;c[h>>2]=b;a7(a|0,1,h|0,e|0);aW(a|0);bo(a|0,35713,f|0);if((c[f>>2]|0)!=0){i=d;return}bo(a|0,35716,g|0);f=(c[g>>2]|0)+1|0;e=be()|0;h=i;i=i+f|0;i=i+7>>3<<3;at(a|0,c[g>>2]|0,0,h|0);aH(56)|0;ay(784,(s=i,i=i+8|0,c[s>>2]=h,s)|0)|0;aG(e|0);i=d;return}function cO(b){b=+b;var d=0,e=0,f=0,j=0,k=0,l=0,m=0.0,n=0.0,o=0,p=0.0,q=0.0,r=0.0,t=0.0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=i;i=i+272|0;e=d|0;f=d+256|0;j=d+264|0;if((c[24]|0)!=0){i=d;return}k=d5(d3(2776)|0)|0;g[54]=+g[54]+b;dG(f,j);l=dK(dU()|0,0)|0;L220:do{if((l|0)!=0){m=+g[l+20>>2]- +g[f>>2]*.5;n=+g[l+24>>2]- +g[j>>2]*.5;o=c[l+12>>2]|0;do{if((o|0)==1){if((c[50]|0)==0){break}if((c[l+16>>2]|0)!=1){break}p=+N(+(m*m+n*n));if(p<=30.0){break}q=1.0/p;p=m*q;r=n*q;q=+V(+(-0.0-r),+(-0.0-p));t=q+ +h[(cy()|0)+72>>3];u=e|0;ev(u|0,0,256);a[e+(a5(u|0,1024,(s=i,i=i+16|0,h[s>>3]=p,h[s+8>>3]=r,s)|0)|0)|0]=0;v=ed(ef(u)|0)|0;ay(1432,(s=i,i=i+16|0,h[s>>3]=t,c[s+8>>2]=v,s)|0)|0;cn(c[50]|0,t)}else if(!((o|0)==2|(o|0)==4)){break L220}}while(0);o=c[174]|0;if((o|0)==0){break}if((c[l+16>>2]|0)!=3){if(+N(+(m*m+n*n))>=30.0){break}}bS(o)}}while(0);do{if(+g[54]>.05){l=c[56]|0;if((l|0)==0){w=0}else{w=bs[l&63]()|0}c[58]=(c[58]|0)+1;l=c[50]|0;do{if((l|0)!=0){e=l+64|0;j=c[4]|0;if((c[e>>2]|0)==(j|0)){x=l}else{c[e>>2]=j;bt[c[4]&63](c[(c[50]|0)+72>>2]|0);j=c[50]|0;if((j|0)==0){break}else{x=j}}j=x+68|0;e=c[22]|0;if((c[j>>2]|0)==(e|0)){break}c[j>>2]=e;bt[c[22]&63](c[(c[50]|0)+84>>2]|0)}}while(0);cB(.05);l=c[50]|0;do{if((l|0)!=0){e=c[164]|0;if(!((c[l+52>>2]|0)==3&(e|0)!=0)){break}bx[e&63]()}}while(0);n=+g[54];if(n>.05){m=n;do{y=m+-.05;m=y;}while(m>.05);g[54]=y}l=c[56]|0;if((l|0)==0){z=w;A=0;break}z=w;A=bs[l&63]()|0}else{z=0;A=0}}while(0);y=+g[162]+b;g[162]=y;if(y>1.0){g[162]=0.0;c[58]=0}do{if(!((c[56]|0)==0|(z|0)==0)){w=c[160]|0;x=w+1|0;c[160]=x;c[240+(w<<2)>>2]=A-z;if(x>>>0>99){B=0;C=2147483647}else{break}while(1){x=c[240+(B<<2)>>2]|0;D=x>>>0<C>>>0?x:C;x=B+1|0;if(x>>>0<100){B=x;C=D}else{E=0;F=0;break}}while(1){x=c[240+(E<<2)>>2]|0;G=x>>>0>F>>>0?x:F;x=E+1|0;if(x>>>0<100){E=x;F=G}else{H=0;I=0;break}}while(1){J=(c[240+(I<<2)>>2]|0)+H|0;x=I+1|0;if(x>>>0<100){H=J;I=x}else{K=0;L=0;break}}do{K=(c[240+(L<<2)>>2]|0)+K|0;L=L+1|0;}while(L>>>0<100);x=(J>>>0)/100>>>0;w=(K>>>0)/100>>>0;l=0;e=0;do{j=(c[240+(l<<2)>>2]|0)-w|0;e=(Z(j,j)|0)+e|0;l=l+1|0;}while(l>>>0<100);y=+N(+(+(e>>>0>>>0)/100.0));ay(1280,(s=i,i=i+32|0,c[s>>2]=D,c[s+8>>2]=G,c[s+16>>2]=x,h[s+24>>3]=y,s)|0)|0;c[160]=0}}while(0);d4(k);i=d;return}function cP(){var a=0,b=0,d=0,e=0;a=i;i=i+663560|0;b=a|0;d=d5(d3(2776)|0)|0;cH();cK(1);e=b|0;c[e>>2]=0;d2(c[(c[2]|0)+52>>2]|0,40,b)|0;cM(c[176]|0,b+4|0,(c[e>>2]|0)*72&-1);d4(d);i=a;return}function cQ(b,d){b=b|0;d=d|0;var e=0,f=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0.0,q=0.0,r=0.0;e=i;i=i+32|0;f=e|0;j=((c[b+176>>2]|0)==0)<<31>>31;k=(b_(b)|0)==0;l=k?j:0;m=k?j:-1;j=k<<31>>31;if((c[b+196>>2]|0)!=0){i=e;return}dk(f,b);n=+h[f+24>>3];b=d;k=c[b>>2]|0;o=d+4|0;g[o+(k*72&-1)>>2]=n;p=+h[f>>3];g[o+(k*72&-1)+4>>2]=p;k=c[b>>2]|0;a[o+(k*72&-1)+8|0]=l;a[o+(k*72&-1)+9|0]=m;a[o+(k*72&-1)+10|0]=j;a[o+(k*72&-1)+11|0]=-128;q=+h[f+8>>3];g[o+(k*72&-1)+12>>2]=q;k=c[b>>2]|0;g[o+(k*72&-1)+16>>2]=p;a[o+(k*72&-1)+20|0]=l;a[o+(k*72&-1)+21|0]=m;a[o+(k*72&-1)+22|0]=j;a[o+(k*72&-1)+23|0]=-128;k=c[b>>2]|0;g[o+(k*72&-1)+24>>2]=q;r=+h[f+16>>3];g[o+(k*72&-1)+28>>2]=r;k=c[b>>2]|0;a[o+(k*72&-1)+32|0]=l;a[o+(k*72&-1)+33|0]=m;a[o+(k*72&-1)+34|0]=j;a[o+(k*72&-1)+35|0]=-128;g[o+(k*72&-1)+36>>2]=n;k=c[b>>2]|0;g[o+(k*72&-1)+40>>2]=p;a[o+(k*72&-1)+44|0]=l;a[o+(k*72&-1)+45|0]=m;a[o+(k*72&-1)+46|0]=j;a[o+(k*72&-1)+47|0]=-128;k=c[b>>2]|0;g[o+(k*72&-1)+48>>2]=n;g[o+(k*72&-1)+52>>2]=r;k=c[b>>2]|0;a[o+(k*72&-1)+56|0]=l;a[o+(k*72&-1)+57|0]=m;a[o+(k*72&-1)+58|0]=j;a[o+(k*72&-1)+59|0]=-128;g[o+(k*72&-1)+60>>2]=q;k=c[b>>2]|0;g[o+(k*72&-1)+64>>2]=r;a[o+(k*72&-1)+68|0]=l;a[o+(k*72&-1)+69|0]=m;a[o+(k*72&-1)+70|0]=j;a[o+(k*72&-1)+71|0]=-128;c[b>>2]=(c[b>>2]|0)+1;i=e;return}function cR(){var a=0,b=0,d=0,e=0,f=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0,q=0.0,r=0,s=0.0,t=0.0,u=0,v=0.0,w=0,x=0,y=0;a=i;i=i+64|0;b=a|0;d=a+32|0;e=a+48|0;f=d5(d3(2776)|0)|0;cv();cE();j=ci()|0;c[2]=j;h[b>>3]=6400.0;h[b+8>>3]=6400.0;ev(b+16|0,0,16);dQ(j,b)|0;dE(6400.0,6400.0,0.0,0.0);c[178]=d5(d3(2848)|0)|0;b=b2()|0;j=d|0;k=d+8|0;l=0;m=0;while(1){n=+(l|0);if((l-25|0)>>>0<15){o=0;p=m;while(1){q=+(an()|0)/2147483647.0;r=c[2]|0;s=+h[r+24>>3];t=s*.015625*.125+q*s*.015625*.125;u=an()|0;s=+h[(c[2]|0)+24>>3]*.015625;q=t*2.0;v=t;w=an()|0;t=+h[(c[2]|0)+16>>3]*.015625;h[j>>3]=+((u|0)%(~~(s-q)|0)&-1|0)+n*s+v;h[k>>3]=v+(+((w|0)%(~~(t-q)|0)&-1|0)+ +(o|0)*t);w=bZ(r,d,v)|0;d$(c[178]|0,w|0)|0;b3(b,w);do{if((o-25|0)>>>0<15){if((p|0)==0){x=w;break}x=(an()|0)<21474836?w:p}else{x=p}}while(0);w=o+1|0;if((w|0)<64){o=w;p=x}else{y=x;break}}}else{p=0;while(1){v=+(an()|0)/2147483647.0;o=c[2]|0;t=+h[o+24>>3];q=t*.015625*.125+v*t*.015625*.125;w=an()|0;t=+h[(c[2]|0)+24>>3]*.015625;v=q*2.0;s=q;r=an()|0;q=+h[(c[2]|0)+16>>3]*.015625;h[j>>3]=+((w|0)%(~~(t-v)|0)&-1|0)+n*t+s;h[k>>3]=s+(+((r|0)%(~~(q-v)|0)&-1|0)+ +(p|0)*q);r=bZ(o,d,s)|0;d$(c[178]|0,r|0)|0;b3(b,r);r=p+1|0;if((r|0)<64){p=r}else{y=m;break}}}p=l+1|0;if((p|0)<64){l=p;m=y}else{break}}if((y|0)==0){a8(992,95,2288,1664)}else{bR(y,1);cF(b);n=+h[y+24>>3]+5.0;h[e>>3]=+h[y+16>>3]+5.0;h[e+8>>3]=n;y=cm(e)|0;c[50]=y;cF(y);y=c[50]|0;h[y+32>>3]=.7853981633974483;c[y+64>>2]=c[4];c[(c[50]|0)+68>>2]=c[22];y=ca()|0;e=cb(y,c[50]|0)|0;c[174]=e;cA(e);g[(c[174]|0)+24>>2]=2.0;aQ(1,704);d4(f);i=a;return}}function cS(){c[24]=1;return}function cT(){c[24]=0;return}function cU(a){a=a|0;c[164]=a;return}function cV(a){a=a|0;c[4]=a;return}function cW(a){a=a|0;c[22]=a;return}function cX(a){a=a|0;var b=0,d=0;if((a|0)==0){return}else{b=a}while(1){a=b|0;if((c[a>>2]|0)==0){d=254;break}c[a>>2]=0;a=c[b+32>>2]|0;if((a|0)==0){d=255;break}else{b=a}}if((d|0)==254){return}else if((d|0)==255){return}}function cY(a,b){a=a|0;b=b|0;if((d9(b,2456)|0)==0){return}d$(a,b)|0;return}function cZ(a,b){a=a|0;b=+b;var c=0,d=0;c=i;i=i+8|0;d=c|0;h[d>>3]=b;d2(a,42,d)|0;i=c;return}function c_(a,b){a=a|0;b=b|0;b=a;bt[c[(d9(b,2632)|0)+4>>2]&63](b);return}function c$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;L320:do{if((d9(b,2632)|0)==0){d=b;while(1){e=d9(d,2616)|0;if((e|0)==0){break}f=bv[c[e+4>>2]&127](d)|0;if((d9(f,2632)|0)==0){d=f}else{g=f;break L320}}return}else{g=b}}while(0);d$(a,g)|0;return}function c0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;L328:do{if((d9(b,2632)|0)==0){d=b;while(1){e=d9(d,2616)|0;if((e|0)==0){break}f=bv[c[e+4>>2]&127](d)|0;if((d9(f,2632)|0)==0){d=f}else{g=f;break L328}}return}else{g=b}}while(0);d1(a,g)|0;return}function c1(a){a=a|0;d2(a,52,0)|0;return}function c2(a,b){a=a|0;b=b|0;var d=0;b=i;if((bf(32)|0)!=0){a=bg()|0;ay(832,(s=i,i=i+8|0,c[s>>2]=a,s)|0)|0;d=1;i=b;return d|0}a4(5,1)|0;if((aB(640,480,16,67108864)|0)==0){a=bg()|0;ay(1584,(s=i,i=i+8|0,c[s>>2]=a,s)|0)|0;d=1;i=b;return d|0}else{ap(0.0,0.0,0.0,0.0);a1(0,-80|0,640,640);dD(640.0,480.0);bh(34,0,0);cR();cx(34);d=0;i=b;return d|0}return 0}function c3(a){a=a|0;var b=0;b=c[a+32>>2]|0;if((b|0)==0){return a|0}else{ek(c3(b)|0);return a|0}return 0}function c4(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=a;while(1){if((b|0)==0){d=292;break}if((c[b>>2]|0)==0){e=b;d=302;break}f=b+32|0;a=c[f>>2]|0;if((a|0)==0){d=297;break}else{b=a}}if((d|0)==297){b=eg(40)|0;a=b;c[b+32>>2]=0;L357:do{if((b|0)!=0){g=a;do{h=g|0;if((c[h>>2]|0)==0){break L357}c[h>>2]=0;g=c[g+32>>2]|0;}while((g|0)!=0)}}while(0);c[f>>2]=a;e=a;return e|0}else if((d|0)==302){return e|0}else if((d|0)==292){a=eg(40)|0;f=a;c[a+32>>2]=0;if((a|0)==0){e=f;return e|0}else{i=f}while(1){a=i|0;if((c[a>>2]|0)==0){e=f;d=305;break}c[a>>2]=0;a=c[i+32>>2]|0;if((a|0)==0){e=f;d=306;break}else{i=a}}if((d|0)==305){return e|0}else if((d|0)==306){return e|0}}return 0}function c5(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;if((a|0)==0){return}else{e=a}while(1){if((c[e>>2]|0)==0){f=311;break}bu[b&63](e,d);a=c[e+32>>2]|0;if((a|0)==0){f=312;break}else{e=a}}if((f|0)==311){return}else if((f|0)==312){return}}function c6(a){a=a|0;ev(a+16|0,0,252);return a|0}function c7(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+48|0;d=c[b>>2]|0;if((d|0)!=0){c[b>>2]=d6(d)|0;d=a+52|0;c[d>>2]=d6(c[d>>2]|0)|0;d=a+56|0;c[d>>2]=d6(c[d>>2]|0)|0;d=a+60|0;c[d>>2]=d6(c[d>>2]|0)|0;e=a;return e|0}d=c[a+256>>2]|0;if((d|0)>0){f=0}else{e=a;return e|0}do{d8(c[a+64+(f<<2)>>2]|0)|0;f=f+1|0;}while((f|0)<(d|0));e=a;return e|0}function c8(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;a=i;i=i+32|0;ew(a,d,32)|0;d=d7(2872)|0;e=d+16|0;f=a;c[e>>2]=c[f>>2];c[e+4>>2]=c[f+4>>2];c[e+8>>2]=c[f+8>>2];c[e+12>>2]=c[f+12>>2];c[e+16>>2]=c[f+16>>2];c[e+20>>2]=c[f+20>>2];c[e+24>>2]=c[f+24>>2];c[e+28>>2]=c[f+28>>2];i=b;return d|0}function c9(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0.0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+32|0;g=f|0;j=a+16|0;k=+h[a+40>>3];do{if(k<+h[e+8>>3]){if(+h[a+24>>3]<=+h[e+24>>3]){break}if(+h[a+32>>3]>=+h[e>>3]){break}if(+h[j>>3]<=+h[e+16>>3]){break}l=a+256|0;m=c[l>>2]|0;n=0;while(1){if((n|0)>=(m|0)){break}if((c[a+64+(n<<2)>>2]|0)==(b|0)){o=331;break}else{n=n+1|0}}do{if((o|0)==331){if((n|0)==-1){break}i=f;return}}while(0);dk(g,b);do{if((c[a+48>>2]|0)==0){if((c[l>>2]|0)>=48){di(a);break}n=dN(b)|0;m=c[l>>2]|0;c[l>>2]=m+1;c[a+64+(m<<2)>>2]=n;i=f;return}}while(0);dd(a,b,g);i=f;return}}while(0);if(k>=+h[d+8>>3]){i=f;return}if(+h[a+24>>3]<=+h[d+24>>3]){i=f;return}if(+h[a+32>>3]>=+h[d>>3]){i=f;return}if(+h[j>>3]<=+h[d+16>>3]){i=f;return}d=a+256|0;j=c[d>>2]|0;g=0;while(1){if((g|0)>=(j|0)){o=349;break}p=a+64+(g<<2)|0;if((c[p>>2]|0)==(b|0)){break}else{g=g+1|0}}if((o|0)==349){i=f;return}if((g|0)==-1){i=f;return}c[p>>2]=c[a+64+(j-1<<2)>>2];c[d>>2]=(c[d>>2]|0)-1;d8(b)|0;i=f;return}function da(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+32|0;e=d|0;dk(e,b);do{if((c[a+48>>2]|0)==0){f=a+256|0;if((c[f>>2]|0)>=48){di(a);break}g=dN(b)|0;h=c[f>>2]|0;c[f>>2]=h+1;c[a+64+(h<<2)>>2]=g;i=d;return}}while(0);dd(a,b,e);i=d;return}function db(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=d9(d,2456)|0;do{if((a|0)!=0){e=c[a+4>>2]|0;if((e|0)==0){break}br[e&63](d,+h[b>>3]);return}}while(0);a8(864,9,2304,1632)}function dc(){var a=0,b=0,e=0,f=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0;a=i;i=i+64|0;b=a|0;e=a+48|0;f=a+56|0;j=d5(d3(2776)|0)|0;k=c[32]|0;do{if((k|0)!=0){l=k+12|0;m=c[l>>2]|0;if((m&7|0)==0){n=dU()|0;o=c[32]|0;dY(n,o)|0;o=c[32]|0;d6(o)|0;c[32]=0;o=dL(n)|0;ay(1416,(s=i,i=i+8|0,c[s>>2]=o,s)|0)|0;break}if((m&3|0)==0){break}c[l>>2]=4}}while(0);dG(e,f);if((bc(b|0)|0)==0){d4(j);p=a6()|0;q=c[52]|0;r=p-q|0;t=+(r|0);u=t/1.0e3;v=u;cO(v);cP();c[52]=p;i=a;return}e=b|0;k=b+12|0;l=b+16|0;m=b+8|0;L463:while(1){o=c[e>>2]|0;do{if((o|0)==1024){n=c[32]|0;if((n|0)==0){break}c[n+12>>2]=2;n=c[32]|0;g[n+28>>2]=+(c[k>>2]|0)- +g[n+20>>2];n=c[32]|0;g[n+32>>2]=+g[f>>2]- +(c[l>>2]|0)- +g[n+24>>2];g[(c[32]|0)+20>>2]=+(c[k>>2]|0);g[(c[32]|0)+24>>2]=+g[f>>2]- +(c[l>>2]|0);n=c[32]|0;dH(+g[n+20>>2],+g[n+24>>2],n+36|0,n+40|0);n=c[32]|0;w=+g[n+20>>2];x=+g[n+24>>2];y=+g[n+36>>2];z=+g[n+40>>2];ay(1256,(s=i,i=i+32|0,h[s>>3]=w,h[s+8>>3]=x,h[s+16>>3]=y,h[s+24>>3]=z,s)|0)|0}else if((o|0)==1025){n=c[32]|0;if((n|0)!=0){c[n+12>>2]=16;n=dU()|0;A=c[32]|0;dY(n,A)|0;A=c[32]|0;d6(A)|0}A=dN(d7(2640)|0)|0;c[32]=A;c[A+12>>2]=1;c[(c[32]|0)+16>>2]=d[m]|0;g[(c[32]|0)+20>>2]=+(c[k>>2]|0);g[(c[32]|0)+24>>2]=+g[f>>2]- +(c[l>>2]|0);g[(c[32]|0)+28>>2]=0.0;g[(c[32]|0)+32>>2]=0.0;A=c[32]|0;dH(+g[A+20>>2],+g[A+24>>2],A+36|0,A+40|0);A=dU()|0;dX(A,c[32]|0)|0;A=c[32]|0;z=+g[A+24>>2];y=+g[A+36>>2];x=+g[A+40>>2];ay(968,(s=i,i=i+32|0,h[s>>3]=+g[A+20>>2],h[s+8>>3]=z,h[s+16>>3]=y,h[s+24>>3]=x,s)|0)|0}else if((o|0)==1026){A=c[32]|0;if((A|0)==0){break}c[A+12>>2]=8}else if((o|0)==256){B=385;break L463}}while(0);if((bc(b|0)|0)==0){B=388;break}}if((B|0)==385){bl();aU(0)}else if((B|0)==388){d4(j);p=a6()|0;q=c[52]|0;r=p-q|0;t=+(r|0);u=t/1.0e3;v=u;cO(v);cP();c[52]=p;i=a;return}}function dd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0;e=c[a+48>>2]|0;f=d+8|0;L479:do{if(+h[e+40>>3]<+h[f>>3]){if(+h[e+24>>3]<=+h[d+24>>3]){g=0;break}if(+h[e+32>>3]>=+h[d>>3]){g=0;break}if(+h[e+16>>3]<=+h[d+16>>3]){g=0;break}do{if((c[e+48>>2]|0)==0){i=e+256|0;if((c[i>>2]|0)<48){j=dN(b)|0;k=c[i>>2]|0;c[i>>2]=k+1;c[e+64+(k<<2)>>2]=j;g=1;break L479}else{di(e);break}}}while(0);dd(e,b,d);g=1}else{g=0}}while(0);e=c[a+52>>2]|0;L491:do{if(+h[e+40>>3]<+h[f>>3]){if(+h[e+24>>3]<=+h[d+24>>3]){l=g;break}if(+h[e+32>>3]>=+h[d>>3]){l=g;break}if(+h[e+16>>3]<=+h[d+16>>3]){l=g;break}do{if((c[e+48>>2]|0)==0){j=e+256|0;if((c[j>>2]|0)<48){k=dN(b)|0;i=c[j>>2]|0;c[j>>2]=i+1;c[e+64+(i<<2)>>2]=k;l=1;break L491}else{di(e);break}}}while(0);dd(e,b,d);l=1}else{l=g}}while(0);g=c[a+56>>2]|0;L503:do{if(+h[g+40>>3]<+h[f>>3]){if(+h[g+24>>3]<=+h[d+24>>3]){m=l;break}if(+h[g+32>>3]>=+h[d>>3]){m=l;break}if(+h[g+16>>3]<=+h[d+16>>3]){m=l;break}do{if((c[g+48>>2]|0)==0){e=g+256|0;if((c[e>>2]|0)<48){k=dN(b)|0;i=c[e>>2]|0;c[e>>2]=i+1;c[g+64+(i<<2)>>2]=k;m=1;break L503}else{di(g);break}}}while(0);dd(g,b,d);m=1}else{m=l}}while(0);l=c[a+60>>2]|0;L515:do{if(+h[l+40>>3]<+h[f>>3]){if(+h[l+24>>3]<=+h[d+24>>3]){n=425;break}if(+h[l+32>>3]>=+h[d>>3]){n=425;break}if(+h[l+16>>3]<=+h[d+16>>3]){n=425;break}do{if((c[l+48>>2]|0)==0){g=l+256|0;if((c[g>>2]|0)<48){k=dN(b)|0;i=c[g>>2]|0;c[g>>2]=i+1;c[l+64+(i<<2)>>2]=k;break L515}else{di(l);break}}}while(0);dd(l,b,d)}else{n=425}}while(0);do{if((n|0)==425){if((m|0)!=0){break}return}}while(0);m=a+256|0;c[m>>2]=(c[m>>2]|0)+1;return}function de(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0.0,i=0,j=0.0,k=0,l=0.0,m=0,n=0.0,o=0,p=0,q=0;e=c[a+48>>2]|0;f=d+8|0;g=+h[f>>3];do{if(+h[e+40>>3]<g){if(+h[e+24>>3]<=+h[d+24>>3]){i=0;j=g;break}if(+h[e+32>>3]>=+h[d>>3]){i=0;j=g;break}if(+h[e+16>>3]<=+h[d+16>>3]){i=0;j=g;break}df(e,b,d);i=1;j=+h[f>>3]}else{i=0;j=g}}while(0);e=c[a+52>>2]|0;do{if(+h[e+40>>3]<j){if(+h[e+24>>3]<=+h[d+24>>3]){k=i;l=j;break}if(+h[e+32>>3]>=+h[d>>3]){k=i;l=j;break}if(+h[e+16>>3]<=+h[d+16>>3]){k=i;l=j;break}df(e,b,d);k=1;l=+h[f>>3]}else{k=i;l=j}}while(0);i=c[a+56>>2]|0;do{if(+h[i+40>>3]<l){if(+h[i+24>>3]<=+h[d+24>>3]){m=k;n=l;break}if(+h[i+32>>3]>=+h[d>>3]){m=k;n=l;break}if(+h[i+16>>3]<=+h[d+16>>3]){m=k;n=l;break}df(i,b,d);m=1;n=+h[f>>3]}else{m=k;n=l}}while(0);k=c[a+60>>2]|0;do{if(+h[k+40>>3]<n){if(+h[k+24>>3]<=+h[d+24>>3]){o=450;break}if(+h[k+32>>3]>=+h[d>>3]){o=450;break}if(+h[k+16>>3]<=+h[d+16>>3]){o=450;break}df(k,b,d);p=1}else{o=450}}while(0);do{if((o|0)==450){if((m|0)==0){q=0}else{p=m;break}return q|0}}while(0);m=a+256|0;c[m>>2]=(c[m>>2]|0)-1;q=p;return q|0}function df(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=a+48|0;if((c[e>>2]|0)!=0){de(a,b,d)|0;d=a+256|0;if((c[d>>2]|0)!=24){return}c[d>>2]=0;d=a;dm(c[e>>2]|0,46,d);f=a+52|0;dm(c[f>>2]|0,46,d);g=a+56|0;dm(c[g>>2]|0,46,d);h=a+60|0;dm(c[h>>2]|0,46,d);d=c[e>>2]|0;d6(d)|0;c[e>>2]=0;e=c[f>>2]|0;d6(e)|0;c[f>>2]=0;f=c[g>>2]|0;d6(f)|0;c[g>>2]=0;g=c[h>>2]|0;d6(g)|0;c[h>>2]=0;return}h=a+256|0;g=c[h>>2]|0;f=0;while(1){if((f|0)>=(g|0)){i=464;break}j=a+64+(f<<2)|0;if((c[j>>2]|0)==(b|0)){break}else{f=f+1|0}}if((i|0)==464){return}if((f|0)==-1){return}c[j>>2]=c[a+64+(g-1<<2)>>2];c[h>>2]=(c[h>>2]|0)-1;d8(b)|0;return}function dg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0.0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=c[a+48>>2]|0;g=+h[f+40>>3];i=e+8|0;do{if(g<+h[i>>3]){if(+h[f+24>>3]<=+h[e+24>>3]){j=0;break}if(+h[f+32>>3]>=+h[e>>3]){j=0;break}j=+h[f+16>>3]>+h[e+16>>3]&1}else{j=0}}while(0);k=d+8|0;do{if(g<+h[k>>3]){if(+h[f+24>>3]<=+h[d+24>>3]){l=476;break}if(+h[f+32>>3]>=+h[d>>3]){l=476;break}m=+h[f+16>>3]>+h[d+16>>3];n=(j|0)!=0;if(n&m){dh(f,b,d,e);o=1;p=0;q=0;break}if(n){l=480;break}if(!m){o=0;p=0;q=0;break}df(f,b,d);o=0;p=0;q=1}else{l=476}}while(0);if((l|0)==476){if((j|0)==0){o=0;p=0;q=0}else{l=480}}L595:do{if((l|0)==480){do{if((c[f+48>>2]|0)==0){j=f+256|0;if((c[j>>2]|0)<48){m=dN(b)|0;n=c[j>>2]|0;c[j>>2]=n+1;c[f+64+(n<<2)>>2]=m;o=0;p=1;q=0;break L595}else{di(f);break}}}while(0);dd(f,b,e);o=0;p=1;q=0}}while(0);f=c[a+52>>2]|0;g=+h[f+40>>3];do{if(g<+h[i>>3]){if(+h[f+24>>3]<=+h[e+24>>3]){r=0;break}if(+h[f+32>>3]>=+h[e>>3]){r=0;break}r=+h[f+16>>3]>+h[e+16>>3]&1}else{r=0}}while(0);do{if(g<+h[k>>3]){if(+h[f+24>>3]<=+h[d+24>>3]){l=494;break}if(+h[f+32>>3]>=+h[d>>3]){l=494;break}m=+h[f+16>>3]>+h[d+16>>3];n=(r|0)!=0;if(n&m){dh(f,b,d,e);s=1;t=p;u=q;break}if(n){l=498;break}if(!m){s=o;t=p;u=q;break}df(f,b,d);s=o;t=p;u=1}else{l=494}}while(0);if((l|0)==494){if((r|0)==0){s=o;t=p;u=q}else{l=498}}L620:do{if((l|0)==498){do{if((c[f+48>>2]|0)==0){p=f+256|0;if((c[p>>2]|0)<48){r=dN(b)|0;m=c[p>>2]|0;c[p>>2]=m+1;c[f+64+(m<<2)>>2]=r;s=o;t=1;u=q;break L620}else{di(f);break}}}while(0);dd(f,b,e);s=o;t=1;u=q}}while(0);q=c[a+56>>2]|0;g=+h[q+40>>3];do{if(g<+h[i>>3]){if(+h[q+24>>3]<=+h[e+24>>3]){v=0;break}if(+h[q+32>>3]>=+h[e>>3]){v=0;break}v=+h[q+16>>3]>+h[e+16>>3]&1}else{v=0}}while(0);do{if(g<+h[k>>3]){if(+h[q+24>>3]<=+h[d+24>>3]){l=512;break}if(+h[q+32>>3]>=+h[d>>3]){l=512;break}o=+h[q+16>>3]>+h[d+16>>3];f=(v|0)!=0;if(f&o){dh(q,b,d,e);w=1;x=t;y=u;break}if(f){l=516;break}if(!o){w=s;x=t;y=u;break}df(q,b,d);w=s;x=t;y=1}else{l=512}}while(0);if((l|0)==512){if((v|0)==0){w=s;x=t;y=u}else{l=516}}L645:do{if((l|0)==516){do{if((c[q+48>>2]|0)==0){t=q+256|0;if((c[t>>2]|0)<48){v=dN(b)|0;o=c[t>>2]|0;c[t>>2]=o+1;c[q+64+(o<<2)>>2]=v;w=s;x=1;y=u;break L645}else{di(q);break}}}while(0);dd(q,b,e);w=s;x=1;y=u}}while(0);u=c[a+60>>2]|0;g=+h[u+40>>3];do{if(g<+h[i>>3]){if(+h[u+24>>3]<=+h[e+24>>3]){z=0;break}if(+h[u+32>>3]>=+h[e>>3]){z=0;break}z=+h[u+16>>3]>+h[e+16>>3]&1}else{z=0}}while(0);do{if(g<+h[k>>3]){if(+h[u+24>>3]<=+h[d+24>>3]){l=530;break}if(+h[u+32>>3]>=+h[d>>3]){l=530;break}i=+h[u+16>>3]>+h[d+16>>3];s=(z|0)!=0;if(s&i){dh(u,b,d,e);return}if(s){l=534;break}if(!i){A=x;B=y;break}df(u,b,d);A=x;B=1}else{l=530}}while(0);if((l|0)==530){if((z|0)==0){A=x;B=y}else{l=534}}L671:do{if((l|0)==534){do{if((c[u+48>>2]|0)==0){x=u+256|0;if((c[x>>2]|0)<48){z=dN(b)|0;d=c[x>>2]|0;c[x>>2]=d+1;c[u+64+(d<<2)>>2]=z;A=1;B=y;break L671}else{di(u);break}}}while(0);dd(u,b,e);A=1;B=y}}while(0);if((w|0)!=0){return}w=(A|0)!=0;A=(B|0)==0;if(w&A){B=a+256|0;c[B>>2]=(c[B>>2]|0)+1}if(A|w){return}w=a+256|0;c[w>>2]=(c[w>>2]|0)-1;return}function dh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=a+48|0;if((c[f>>2]|0)==0){c9(a,b,d,e);return}dg(a,b,d,e);e=a+256|0;if((c[e>>2]|0)!=24){return}c[e>>2]=0;e=a;dm(c[f>>2]|0,46,e);d=a+52|0;dm(c[d>>2]|0,46,e);b=a+56|0;dm(c[b>>2]|0,46,e);g=a+60|0;dm(c[g>>2]|0,46,e);d6(c[f>>2]|0)|0;c[f>>2]=0;d6(c[d>>2]|0)|0;c[d>>2]=0;d6(c[b>>2]|0)|0;c[b>>2]=0;d6(c[g>>2]|0)|0;c[g>>2]=0;return}function di(a){a=a|0;var b=0,e=0,f=0,g=0.0,j=0,l=0.0,m=0,n=0.0,o=0,p=0.0,q=0,r=0,s=0.0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;b=i;i=i+32|0;e=b|0;f=a+16|0;g=(c[k>>2]=d[f]|d[f+1|0]<<8|d[f+2|0]<<16|d[f+3|0]<<24,c[k+4>>2]=d[f+4|0]|d[f+5|0]<<8|d[f+6|0]<<16|d[f+7|0]<<24,+h[k>>3]);j=a+24|0;l=(c[k>>2]=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24,c[k+4>>2]=d[j+4|0]|d[j+5|0]<<8|d[j+6|0]<<16|d[j+7|0]<<24,+h[k>>3]);m=a+32|0;n=(c[k>>2]=d[m]|d[m+1|0]<<8|d[m+2|0]<<16|d[m+3|0]<<24,c[k+4>>2]=d[m+4|0]|d[m+5|0]<<8|d[m+6|0]<<16|d[m+7|0]<<24,+h[k>>3]);o=a+40|0;p=(c[k>>2]=d[o]|d[o+1|0]<<8|d[o+2|0]<<16|d[o+3|0]<<24,c[k+4>>2]=d[o+4|0]|d[o+5|0]<<8|d[o+6|0]<<16|d[o+7|0]<<24,+h[k>>3]);q=d7(2872)|0;h[q+16>>3]=g;h[q+24>>3]=p+(l-p)*.5;h[q+32>>3]=g-(g-n)*.5;h[q+40>>3]=p;r=a+48|0;c[r>>2]=dN(q)|0;p=(c[k>>2]=d[f]|d[f+1|0]<<8|d[f+2|0]<<16|d[f+3|0]<<24,c[k+4>>2]=d[f+4|0]|d[f+5|0]<<8|d[f+6|0]<<16|d[f+7|0]<<24,+h[k>>3]);n=(c[k>>2]=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24,c[k+4>>2]=d[j+4|0]|d[j+5|0]<<8|d[j+6|0]<<16|d[j+7|0]<<24,+h[k>>3]);g=(c[k>>2]=d[m]|d[m+1|0]<<8|d[m+2|0]<<16|d[m+3|0]<<24,c[k+4>>2]=d[m+4|0]|d[m+5|0]<<8|d[m+6|0]<<16|d[m+7|0]<<24,+h[k>>3]);l=(c[k>>2]=d[o]|d[o+1|0]<<8|d[o+2|0]<<16|d[o+3|0]<<24,c[k+4>>2]=d[o+4|0]|d[o+5|0]<<8|d[o+6|0]<<16|d[o+7|0]<<24,+h[k>>3]);s=(n-l)*.5;n=l+s;l=p+0.0;q=d7(2872)|0;h[q+16>>3]=l;h[q+24>>3]=s+n;h[q+32>>3]=l-(p-g)*.5;h[q+40>>3]=n;t=a+52|0;c[t>>2]=dN(q)|0;n=(c[k>>2]=d[f]|d[f+1|0]<<8|d[f+2|0]<<16|d[f+3|0]<<24,c[k+4>>2]=d[f+4|0]|d[f+5|0]<<8|d[f+6|0]<<16|d[f+7|0]<<24,+h[k>>3]);g=(c[k>>2]=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24,c[k+4>>2]=d[j+4|0]|d[j+5|0]<<8|d[j+6|0]<<16|d[j+7|0]<<24,+h[k>>3]);p=(c[k>>2]=d[m]|d[m+1|0]<<8|d[m+2|0]<<16|d[m+3|0]<<24,c[k+4>>2]=d[m+4|0]|d[m+5|0]<<8|d[m+6|0]<<16|d[m+7|0]<<24,+h[k>>3]);l=(c[k>>2]=d[o]|d[o+1|0]<<8|d[o+2|0]<<16|d[o+3|0]<<24,c[k+4>>2]=d[o+4|0]|d[o+5|0]<<8|d[o+6|0]<<16|d[o+7|0]<<24,+h[k>>3]);s=(n-p)*.5;p=n-s;q=d7(2872)|0;h[q+16>>3]=p;h[q+24>>3]=l+(g-l)*.5;h[q+32>>3]=p-s;h[q+40>>3]=l;u=a+56|0;c[u>>2]=dN(q)|0;l=(c[k>>2]=d[f]|d[f+1|0]<<8|d[f+2|0]<<16|d[f+3|0]<<24,c[k+4>>2]=d[f+4|0]|d[f+5|0]<<8|d[f+6|0]<<16|d[f+7|0]<<24,+h[k>>3]);s=(c[k>>2]=d[j]|d[j+1|0]<<8|d[j+2|0]<<16|d[j+3|0]<<24,c[k+4>>2]=d[j+4|0]|d[j+5|0]<<8|d[j+6|0]<<16|d[j+7|0]<<24,+h[k>>3]);p=(c[k>>2]=d[m]|d[m+1|0]<<8|d[m+2|0]<<16|d[m+3|0]<<24,c[k+4>>2]=d[m+4|0]|d[m+5|0]<<8|d[m+6|0]<<16|d[m+7|0]<<24,+h[k>>3]);g=(c[k>>2]=d[o]|d[o+1|0]<<8|d[o+2|0]<<16|d[o+3|0]<<24,c[k+4>>2]=d[o+4|0]|d[o+5|0]<<8|d[o+6|0]<<16|d[o+7|0]<<24,+h[k>>3]);n=(s-g)*.5;s=(l-p)*.5;p=g+n;g=l-s;o=d7(2872)|0;h[o+16>>3]=g;h[o+24>>3]=n+p;h[o+32>>3]=g-s;h[o+40>>3]=p;m=a+60|0;c[m>>2]=dN(o)|0;o=c[a+256>>2]|0;if((o|0)<=0){i=b;return}j=e+8|0;f=e+24|0;q=e|0;v=e+16|0;w=0;do{x=c[a+64+(w<<2)>>2]|0;dk(e,x);y=c[r>>2]|0;L705:do{if(+h[y+40>>3]<+h[j>>3]){if(+h[y+24>>3]<=+h[f>>3]){break}if(+h[y+32>>3]>=+h[q>>3]){break}if(+h[y+16>>3]<=+h[v>>3]){break}do{if((c[y+48>>2]|0)==0){z=y+256|0;if((c[z>>2]|0)<48){A=dN(x)|0;B=c[z>>2]|0;c[z>>2]=B+1;c[y+64+(B<<2)>>2]=A;break L705}else{di(y);break}}}while(0);dd(y,x,e)}}while(0);y=c[t>>2]|0;L717:do{if(+h[y+40>>3]<+h[j>>3]){if(+h[y+24>>3]<=+h[f>>3]){break}if(+h[y+32>>3]>=+h[q>>3]){break}if(+h[y+16>>3]<=+h[v>>3]){break}do{if((c[y+48>>2]|0)==0){A=y+256|0;if((c[A>>2]|0)<48){B=dN(x)|0;z=c[A>>2]|0;c[A>>2]=z+1;c[y+64+(z<<2)>>2]=B;break L717}else{di(y);break}}}while(0);dd(y,x,e)}}while(0);y=c[u>>2]|0;L729:do{if(+h[y+40>>3]<+h[j>>3]){if(+h[y+24>>3]<=+h[f>>3]){break}if(+h[y+32>>3]>=+h[q>>3]){break}if(+h[y+16>>3]<=+h[v>>3]){break}do{if((c[y+48>>2]|0)==0){B=y+256|0;if((c[B>>2]|0)<48){z=dN(x)|0;A=c[B>>2]|0;c[B>>2]=A+1;c[y+64+(A<<2)>>2]=z;break L729}else{di(y);break}}}while(0);dd(y,x,e)}}while(0);y=c[m>>2]|0;L741:do{if(+h[y+40>>3]<+h[j>>3]){if(+h[y+24>>3]<=+h[f>>3]){break}if(+h[y+32>>3]>=+h[q>>3]){break}if(+h[y+16>>3]<=+h[v>>3]){break}do{if((c[y+48>>2]|0)==0){z=y+256|0;if((c[z>>2]|0)<48){A=dN(x)|0;B=c[z>>2]|0;c[z>>2]=B+1;c[y+64+(B<<2)>>2]=A;break L741}else{di(y);break}}}while(0);dd(y,x,e)}}while(0);d8(x)|0;w=w+1|0;}while((w|0)<(o|0));i=b;return}function dj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+256|0;b=c[e>>2]|0;f=0;while(1){if((f|0)>=(b|0)){break}if((c[d+64+(f<<2)>>2]|0)==(a|0)){g=604;break}else{f=f+1|0}}do{if((g|0)==604){if((f|0)==-1){break}return}}while(0);f=dN(a)|0;a=c[e>>2]|0;c[e>>2]=a+1;c[d+64+(a<<2)>>2]=f;return}function dk(a,b){a=a|0;b=b|0;var c=0.0,d=0.0,e=0.0;c=+h[b+32>>3];d=+h[b+16>>3];e=+h[b+24>>3];h[a>>3]=c+e;h[a+8>>3]=c+d;h[a+16>>3]=e-c;h[a+24>>3]=d-c;return}function dl(a){a=a|0;var b=0;b=c[a+200>>2]|0;c[a+204>>2]=b;if((b|0)==0){return}c[b>>2]=0;return}function dm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+48>>2]|0;if((e|0)==0){f=a}else{g=a;a=e;while(1){dm(a,b,d);dm(c[g+52>>2]|0,b,d);dm(c[g+56>>2]|0,b,d);e=c[g+60>>2]|0;h=c[e+48>>2]|0;if((h|0)==0){f=e;break}else{g=e;a=h}}}a=c[f+256>>2]|0;if((a|0)>0){i=0}else{return}do{bu[b&63](c[f+64+(i<<2)>>2]|0,d);i=i+1|0;}while((i|0)<(a|0));return}function dn(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;e=c;c=i;i=i+32|0;ew(c,e,32)|0;df(a,b,c);i=d;return}function dp(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=i;f=c;c=i;i=i+32|0;ew(c,f,32)|0;f=d;d=i;i=i+32|0;ew(d,f,32)|0;dh(a,b,c,d);i=e;return}function dq(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[a+48>>2]|0;if((e|0)==0){f=a}else{g=a;a=e;while(1){dq(a,b,d);dq(c[g+52>>2]|0,b,d);dq(c[g+56>>2]|0,b,d);e=c[g+60>>2]|0;h=c[e+48>>2]|0;if((h|0)==0){f=e;break}else{g=e;a=h}}}a=c[f+256>>2]|0;g=a-1|0;if((g|0)>0){i=0}else{return}while(1){h=i+1|0;if((h|0)<(a|0)){e=f+64+(i<<2)|0;j=h;do{bw[b&63](c[e>>2]|0,c[f+64+(j<<2)>>2]|0,d);j=j+1|0;}while((j|0)<(a|0))}if((h|0)<(g|0)){i=h}else{break}}return}function dr(a){a=a|0;ev(a+16|0,0,212);h[a+32>>3]=1.0;h[a+48>>3]=1.0;h[a+56>>3]=1.0e-5;return a|0}function ds(a){a=a|0;dt(c[a+200>>2]|0)|0;dt(c[a+212>>2]|0)|0;dt(c[a+216>>2]|0)|0;return a|0}function dt(a){a=a|0;var b=0;if((a|0)==0){return 0}b=c[a+4>>2]|0;if((b|0)!=0){dt(b)|0}ek(a);return 0}function du(a,b){a=a|0;b=+b;var d=0,e=0,f=0,g=0,j=0,k=0.0,l=0;d=i;i=i+16|0;if((c[a+176>>2]|0)!=0){i=d;return}e=a+16|0;f=d|0;g=e;c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];g=a+24|0;j=a+80|0;k=b*b;l=a+96|0;b=+h[g>>3]*1.9999- +h[a+88>>3]*.9999+k*+h[a+104>>3];h[a+16>>3]=+h[e>>3]*1.9999- +h[j>>3]*.9999+k*+h[l>>3];h[g>>3]=b;g=j;c[g>>2]=c[f>>2];c[g+4>>2]=c[f+4>>2];c[g+8>>2]=c[f+8>>2];c[g+12>>2]=c[f+12>>2];ev(l|0,0,16);i=d;return}function dv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0.0,g=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0;do{if((c[a+176>>2]|0)!=0){if((c[b+176>>2]|0)==0){break}else{e=0}return e|0}}while(0);f=+h[a+32>>3];g=+h[b+32>>3];i=+h[a+16>>3]- +h[b+16>>3];j=+h[a+24>>3]- +h[b+24>>3];k=f+g;l=i*i+j*j;if(l>=k*k){e=0;return e|0}m=a+200|0;n=c[m>>2]|0;L819:do{if((n|0)!=0){o=n;while(1){p=c[o>>2]|0;if((p|0)==0){break L819}if((p|0)==(b|0)){e=0;break}o=c[o+4>>2]|0;if((o|0)==0){break L819}}return e|0}}while(0);n=c[a+212>>2]|0;L827:do{if(!((n|0)==0|(b|0)==0)){o=n;while(1){if((c[o>>2]|0)==(b|0)){e=0;break}o=c[o+4>>2]|0;if((o|0)==0){break L827}}return e|0}}while(0);n=c[b+208>>2]|0;o=c[a+216>>2]|0;L834:do{if(!((o|0)==0|(n|0)==0)){p=o;while(1){if((c[p>>2]|0)==(n|0)){e=0;break}p=c[p+4>>2]|0;if((p|0)==0){break L834}}return e|0}}while(0);n=c[b+212>>2]|0;L841:do{if(!((n|0)==0|(a|0)==0)){o=n;while(1){if((c[o>>2]|0)==(a|0)){e=0;break}o=c[o+4>>2]|0;if((o|0)==0){break L841}}return e|0}}while(0);n=c[a+208>>2]|0;o=c[b+216>>2]|0;L848:do{if(!((o|0)==0|(n|0)==0)){p=o;while(1){if((c[p>>2]|0)==(n|0)){e=0;break}p=c[p+4>>2]|0;if((p|0)==0){break L848}}return e|0}}while(0);n=a+204|0;o=c[n>>2]|0;do{if((o|0)==0){p=eg(8)|0;q=p;c[q>>2]=0;c[q+4>>2]=0;c[n>>2]=p;c[m>>2]=p;if((p|0)!=0){r=p;break}p=eg(8)|0;q=p;c[q>>2]=0;c[q+4>>2]=0;r=p}else{r=o}}while(0);o=r+4|0;m=c[o>>2]|0;if((m|0)==0){p=eg(8)|0;q=p;s=p;c[s>>2]=0;c[s+4>>2]=0;c[o>>2]=q;t=q}else{c[m>>2]=0;t=c[o>>2]|0}c[r>>2]=b;c[n>>2]=t;t=b+204|0;n=c[t>>2]|0;do{if((n|0)==0){r=eg(8)|0;o=r;c[o>>2]=0;c[o+4>>2]=0;c[t>>2]=r;c[b+200>>2]=r;if((r|0)!=0){u=r;break}r=eg(8)|0;o=r;c[o>>2]=0;c[o+4>>2]=0;u=r}else{u=n}}while(0);n=u+4|0;r=c[n>>2]|0;if((r|0)==0){o=eg(8)|0;m=o;q=o;c[q>>2]=0;c[q+4>>2]=0;c[n>>2]=m;v=m}else{c[r>>2]=0;v=c[n>>2]|0}c[u>>2]=a;c[t>>2]=v;w=+N(+l);h[d+24>>3]=k-w;k=w==0.0?1.0e-5:w;w=g/k-(k-f)/k;h[d+8>>3]=i*w;h[d+16>>3]=j*w;c[d>>2]=a;c[d+4>>2]=b;e=1;return e|0}function dw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0.0,f=0.0,g=0.0,i=0.0,j=0.0,k=0,l=0,m=0.0,n=0.0,o=0,p=0,q=0.0,r=0.0,s=0.0,t=0,u=0,v=0.0,w=0,x=0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0;e=+h[d+8>>3]*.5;f=+h[d+16>>3]*.5;g=+h[a+48>>3];i=+h[b+48>>3];j=g+i;k=a+80|0;l=a+16|0;m=+h[l>>3];n=+h[k>>3]-m;o=a+88|0;p=a+24|0;q=+h[p>>3];r=+h[o>>3]-q;s=+N(+(n*n+r*r));t=b+80|0;u=b+16|0;v=+h[t>>3]- +h[u>>3];w=b+88|0;x=b+24|0;y=+h[w>>3]- +h[x>>3];z=+N(+(v*v+y*y));A=+M(+(+h[d+24>>3]));B=A*+h[a+56>>3]*+h[b+56>>3];if(s!=0.0){A=s-B;C=A*(n/s);D=A*(r/s)}else{C=n;D=r}if(z!=0.0){r=z-B;E=r*(y/z);F=r*(v/z)}else{E=y;F=v}if((c[a+176>>2]|0)==0){d=(c[b+176>>2]|0)==0;G=d?i/j:1.0;H=d?g/j:0.0}else{G=0.0;H=1.0}if((c[a+180>>2]|0)!=0){bw[c[a+192>>2]&63](a,b,c[a+196>>2]|0);return}if((c[b+180>>2]|0)==0){h[k>>3]=C+m;h[o>>3]=D+q;h[l>>3]=e*G+m;h[p>>3]=f*G+q;q=+h[u>>3];h[t>>3]=F+q;F=+h[x>>3];h[w>>3]=E+F;h[u>>3]=q-e*H;h[x>>3]=F-f*H;return}else{bw[c[b+192>>2]&63](b,a,c[b+196>>2]|0);return}}function dx(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a+212|0;a=c[d>>2]|0;while(1){if((a|0)==0){e=712;break}f=c[a+4>>2]|0;if((f|0)==0){g=a;break}else{a=f}}do{if((e|0)==712){a=eg(8)|0;f=a;c[f>>2]=0;c[f+4>>2]=0;c[d>>2]=a;if((a|0)==0){f=eg(8)|0;h=f;c[h>>2]=0;c[h+4>>2]=0;g=f;break}else{g=a;break}}}while(0);d=g+4|0;e=c[d>>2]|0;if((e|0)==0){a=eg(8)|0;f=a;c[f>>2]=0;c[f+4>>2]=0;c[d>>2]=a;i=g|0;c[i>>2]=b;return}else{c[e>>2]=0;i=g|0;c[i>>2]=b;return}}function dy(a){a=a|0;var b=0,d=0;b=i;i=i+32|0;d=b|0;ev(d|0,0,32);c[a+48>>2]=dN(c8(d)|0)|0;c[a+52>>2]=dN(d7(2848)|0)|0;d=c4(0)|0;c[a+56>>2]=d;c[a+60>>2]=d;i=b;return a|0}function dz(a){a=a|0;d6(c[a+48>>2]|0)|0;d6(c[a+52>>2]|0)|0;c3(c[a+56>>2]|0)|0;return a|0}function dA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if(+h[a+136>>3]>=+h[b+120>>3]){return}if(+h[a+120>>3]<=+h[b+136>>3]){return}if(+h[a+128>>3]>=+h[b+112>>3]){return}if(+h[a+112>>3]<=+h[b+128>>3]){return}e=d+60|0;if((dv(a,b,c[e>>2]|0)|0)==0){return}c[e>>2]=c4(c[e>>2]|0)|0;return}function dB(a,b){a=a|0;b=b|0;dw(c[a>>2]|0,c[a+4>>2]|0,a);return}function dC(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0;d=i;i=i+64|0;e=d|0;f=d+32|0;g=a;j=a+16|0;k=j;if((aA(+(+h[k>>3]))|0)==0){a8(760,30,2352,1520)}l=j+8|0;if((aA(+(+h[l>>3]))|0)==0){a8(760,30,2352,1520)}du(g,+h[b+8>>3]);dl(g);dk(f,g);m=a+112|0;n=f;c[m>>2]=c[n>>2];c[m+4>>2]=c[n+4>>2];c[m+8>>2]=c[n+8>>2];c[m+12>>2]=c[n+12>>2];c[m+16>>2]=c[n+16>>2];c[m+20>>2]=c[n+20>>2];c[m+24>>2]=c[n+24>>2];c[m+28>>2]=c[n+28>>2];m=e;c[m>>2]=c[n>>2];c[m+4>>2]=c[n+4>>2];c[m+8>>2]=c[n+8>>2];c[m+12>>2]=c[n+12>>2];c[m+16>>2]=c[n+16>>2];c[m+20>>2]=c[n+20>>2];c[m+24>>2]=c[n+24>>2];c[m+28>>2]=c[n+28>>2];n=a+64|0;o=+h[k>>3]- +h[n>>3];p=+h[l>>3]- +h[n+8>>3];if(o*o+p*p<=+h[a+32>>3]/10.0){i=d;return}l=a+144|0;dp(c[(c[b>>2]|0)+48>>2]|0,g,l,e);e=n;n=j;c[e>>2]=c[n>>2];c[e+4>>2]=c[n+4>>2];c[e+8>>2]=c[n+8>>2];c[e+12>>2]=c[n+12>>2];n=l;c[n>>2]=c[m>>2];c[n+4>>2]=c[m+4>>2];c[n+8>>2]=c[m+8>>2];c[n+12>>2]=c[m+12>>2];c[n+16>>2]=c[m+16>>2];c[n+20>>2]=c[m+20>>2];c[n+24>>2]=c[m+24>>2];c[n+28>>2]=c[m+28>>2];i=d;return}function dD(a,b){a=+a;b=+b;g[448]=a;g[449]=b;return}function dE(a,b,c,d){a=+a;b=+b;c=+c;d=+d;g[182]=a;g[183]=b;g[184]=c;g[185]=d;return}function dF(a,b){a=a|0;b=b|0;return 0}function dG(a,b){a=a|0;b=b|0;g[a>>2]=+g[448];g[b>>2]=+g[449];return}function dH(a,b,c,d){a=+a;b=+b;c=c|0;d=d|0;var e=0.0;e=+g[185];g[c>>2]=e+a/+g[448]*(+g[183]-e);e=+g[184];g[d>>2]=e+b/+g[449]*(+g[182]-e);return}function dI(a){a=a|0;return a|0}function dJ(a,b){a=a|0;b=b|0;return(c[a>>2]|0)==(b|0)&1|0}function dK(a,b){a=a|0;b=b|0;var d=0;if((c[a+12>>2]|0)<=(b|0)){d=0;return d|0}d=c[(c[a+20>>2]|0)+(b<<2)>>2]|0;return d|0}function dL(a){a=a|0;return c[a+12>>2]|0}function dM(a){a=a|0;c[a+16>>2]=0;c[a+20>>2]=0;return a|0}function dN(a){a=a|0;var b=0;b=a+4|0;c[b>>2]=(c[b>>2]|0)+1;return a|0}function dO(a){a=a|0;var b=0,d=0;c[a+12>>2]=0;c[a+16>>2]=0;c[a+20>>2]=0;c[a+24>>2]=c[166];b=c[166]|0;if((b|0)==0){d=a|0;c[166]=d;return d|0}c[b+20>>2]=a;d=a|0;c[166]=d;return d|0}function dP(a,b){a=a|0;b=b|0;var c=0,d=0,e=0.0,f=0.0,g=0,j=0.0;c=i;i=i+32|0;d=c|0;dk(d,a);e=+h[d+24>>3];f=+h[b+40>>3];if(e<f){g=a+16|0;h[g>>3]=f-e+ +h[g>>3]}e=+h[d+8>>3];f=+h[b+24>>3];if(e>f){g=a+16|0;h[g>>3]=f-e+ +h[g>>3]}e=+h[d+16>>3];f=+h[b+32>>3];if(e<f){g=a+24|0;j=f-e+ +h[g>>3];h[g>>3]=j;h[a+88>>3]=j}j=+h[d>>3];e=+h[b+16>>3];if(j<=e){i=c;return}b=a+24|0;h[b>>3]=e-j+ +h[b>>3];i=c;return}function dQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=b;b=i;i=i+32|0;ew(b,e,32)|0;e=a+16|0;f=b;c[e>>2]=c[f>>2];c[e+4>>2]=c[f+4>>2];c[e+8>>2]=c[f+8>>2];c[e+12>>2]=c[f+12>>2];c[e+16>>2]=c[f+16>>2];c[e+20>>2]=c[f+20>>2];c[e+24>>2]=c[f+24>>2];c[e+28>>2]=c[f+28>>2];e=(c[a+48>>2]|0)+16|0;c[e>>2]=c[f>>2];c[e+4>>2]=c[f+4>>2];c[e+8>>2]=c[f+8>>2];c[e+12>>2]=c[f+12>>2];c[e+16>>2]=c[f+16>>2];c[e+20>>2]=c[f+20>>2];c[e+24>>2]=c[f+24>>2];c[e+28>>2]=c[f+28>>2];i=d;return a|0}function dR(a,b){a=a|0;b=+b;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d|0;c[e>>2]=a;h[e+8>>3]=b;f=a+52|0;d2(c[f>>2]|0,34,e)|0;e=a;dq(c[a+48>>2]|0,36,e);g=a+56|0;c5(c[g>>2]|0,48,e);cX(c[g>>2]|0);c[a+60>>2]=c[g>>2];d2(c[f>>2]|0,44,e)|0;i=d;return}function dS(a,b){a=a|0;b=b|0;dn(c[a+48>>2]|0,b,b+144|0);d1(c[a+52>>2]|0,b|0)|0;return}function dT(a){a=a|0;ev(a+12|0,0,32);return a|0}function dU(){var a=0,b=0;a=c[186]|0;if((a|0)!=0){b=a;return b|0}a=d5(d3(2920)|0)|0;c[186]=a;b=a;return b|0}function dV(a){a=a|0;ev(a+12|0,0,12);return a|0}function dW(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=a+20|0;d=c[b>>2]|0;if((d|0)==0){return a|0}e=c[a+12>>2]|0;if((e|0)>0){f=0;g=d;while(1){d6(c[g+(f<<2)>>2]|0)|0;h=f+1|0;i=c[b>>2]|0;if((h|0)<(e|0)){f=h;g=i}else{j=i;break}}}else{j=d}ek(j);return a|0}function dX(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;d=a+12|0;e=c[d>>2]|0;f=a+16|0;if((e|0)==(c[f>>2]|0)){g=e+16|0;h=em(g,4)|0;i=a+20|0;j=c[i>>2]|0;if((j|0)!=0){if((e|0)>0){k=0;while(1){l=k+1|0;c[h+(k<<2)>>2]=c[j+(k<<2)>>2];if((l|0)<(e|0)){k=l}else{break}}}ek(j)}c[f>>2]=g;c[i>>2]=h;m=i}else{m=a+20|0}a=dN(b)|0;b=c[d>>2]|0;c[d>>2]=b+1;c[(c[m>>2]|0)+(b<<2)>>2]=a;return 1}function dY(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=a+12|0;e=c[d>>2]|0;f=a+20|0;a=0;while(1){if((a|0)>=(e|0)){g=0;h=812;break}i=a+1|0;if((c[(c[f>>2]|0)+(a<<2)>>2]|0)==(b|0)){break}else{a=i}}if((h|0)==812){return g|0}if((a|0)==-1){g=0;return g|0}d8(b)|0;c[d>>2]=a;if((i|0)>=(e|0)){g=1;return g|0}b=c[f>>2]|0;h=c[b+(i<<2)>>2]|0;c[d>>2]=i;c[b+(a<<2)>>2]=h;h=a+2|0;if((h|0)<(e|0)){j=h}else{g=1;return g|0}while(1){h=c[d>>2]|0;a=c[f>>2]|0;b=c[a+(j<<2)>>2]|0;c[d>>2]=h+1;c[a+(h<<2)>>2]=b;b=j+1|0;if((b|0)<(e|0)){j=b}else{g=1;break}}return g|0}function dZ(a){a=a|0;var b=0;b=c[a>>2]|0;if((b|0)!=0){ek(dZ(b)|0)}d6(c[a+8>>2]|0)|0;return a|0}function d_(a){a=a|0;var b=0;b=c[a+16>>2]|0;if((b|0)==0){return a|0}ek(dZ(b)|0);return a|0}function d$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=eg(12)|0;c[d>>2]=0;e=d+8|0;c[e>>2]=0;f=a+20|0;g=c[f>>2]|0;c[d+4>>2]=g;do{if((g|0)!=0){c[g>>2]=d;h=c[e>>2]|0;if((h|0)==0){break}i=h;d6(i)|0}}while(0);c[e>>2]=0;if((b|0)!=0){c[e>>2]=dN(b)|0}b=a+12|0;c[b>>2]=(c[b>>2]|0)+1;c[f>>2]=d;f=a+16|0;if((c[f>>2]|0)!=0){return a|0}c[f>>2]=d;return a|0}function d0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;if((b|0)==-1){d=0;return d|0}e=a+16|0;f=c[e>>2]|0;g=a+12|0;h=g;i=c[h>>2]|0;j=(f|0)==0;if((b|0)<1|(i|0)<1|j){k=f;l=j}else{j=0;m=f;while(1){n=j+1|0;o=c[m>>2]|0;p=(o|0)==0;if((n|0)>=(b|0)|(n|0)>=(i|0)|p){k=o;l=p;break}else{j=n;m=o}}}if(l){d=0;return d|0}l=a+20|0;if((c[l>>2]|0)==(k|0)){c[l>>2]=c[k+4>>2]}if((f|0)==(k|0)){c[e>>2]=c[f>>2]}f=k+4|0;e=c[f>>2]|0;l=k|0;if((e|0)!=0){c[e>>2]=c[l>>2];c[f>>2]=0}f=c[l>>2]|0;if((f|0)!=0){c[f+4>>2]=0;c[l>>2]=0}l=k+8|0;f=d8(c[l>>2]|0)|0;c[l>>2]=0;ek(dZ(k)|0);c[g>>2]=(c[h>>2]|0)-1;d=f;return d|0}function d1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=c[a+16>>2]|0;L1066:do{if((d|0)==0){e=-1}else{f=0;g=d;while(1){if((c[g+8>>2]|0)==(b|0)){e=f;break L1066}h=c[g>>2]|0;if((h|0)==0){e=-1;break}else{f=f+1|0;g=h}}}}while(0);return d0(a,e)|0}function d2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=c[a+16>>2]|0;if((e|0)==0){return a|0}else{f=e}do{bu[b&63](c[f+8>>2]|0,d);f=c[f>>2]|0;}while((f|0)!=0);return a|0}function d3(a){a=a|0;var b=0;b=eg(c[a+4>>2]|0)|0;c[b>>2]=a;c[b+4>>2]=1;c[b+8>>2]=0;return b|0}function d4(a){a=a|0;if((a|0)==0){return}c[a+4>>2]=0;ek(bv[c[(c[a>>2]|0)+16>>2]&127](a)|0);return}function d5(a){a=a|0;return bv[c[(c[a>>2]|0)+12>>2]&127](a)|0}function d6(a){a=a|0;var b=0,d=0,e=0;if((a|0)==0){b=0;return b|0}d=a+4|0;e=(c[d>>2]|0)-1|0;c[d>>2]=e;if((e|0)!=0){b=a;return b|0}c[d>>2]=0;ek(bv[c[(c[a>>2]|0)+16>>2]&127](a)|0);b=0;return b|0}function d7(a){a=a|0;var b=0,d=0,e=0,f=0;b=eg(c[a+4>>2]|0)|0;c[b>>2]=a;c[b+4>>2]=1;c[b+8>>2]=0;d=bv[c[a+12>>2]&127](b)|0;b=c[166]|0;if((b|0)==0){return d|0}a=eg(8)|0;c[a>>2]=d;c[a+4>>2]=0;e=b+12|0;f=b+16|0;if((c[e>>2]|0)==0){c[f>>2]=a;c[e>>2]=a;return d|0}else{c[(c[f>>2]|0)+4>>2]=a;c[f>>2]=a;return d|0}return 0}function d8(a){a=a|0;var b=0,d=0,e=0,f=0;b=c[166]|0;if((b|0)==0){return a|0}d=eg(8)|0;c[d>>2]=a;c[d+4>>2]=0;e=b+12|0;f=b+16|0;if((c[e>>2]|0)==0){c[f>>2]=d;c[e>>2]=d;return a|0}else{c[(c[f>>2]|0)+4>>2]=d;c[f>>2]=d;return a|0}return 0}function d9(a,b){a=a|0;b=b|0;return by[c[(c[a>>2]|0)+20>>2]&63](a,b)|0}function ea(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;b=c[a+20>>2]|0;if((b|0)!=0){c[b+4>>2]=0;ek(bv[c[(c[b>>2]|0)+16>>2]&127](b)|0)}b=c[a+12>>2]|0;if((b|0)!=0){d=b;while(1){b=c[d+4>>2]|0;e=c[d>>2]|0;f=e;do{if((e|0)!=0){g=e+4|0;h=(c[g>>2]|0)-1|0;c[g>>2]=h;if((h|0)!=0){break}c[g>>2]=0;ek(bv[c[(c[e>>2]|0)+16>>2]&127](f)|0)}}while(0);ek(d);if((b|0)==0){break}else{d=b}}}d=a+24|0;f=c[d>>2]|0;if((f|0)==0){i=0;j=i|0;c[166]=j;k=a|0;return k|0}c[f+20>>2]=0;i=c[d>>2]|0;j=i|0;c[166]=j;k=a|0;return k|0}function eb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+32|0;e=d|0;f=b+16|0;if((aA(+(+h[f>>3]))|0)==0){a8(760,187,2384,1520)}if((aA(+(+h[b+24>>3]))|0)==0){a8(760,187,2384,1520)}else{da(c[a+48>>2]|0,b);g=c[a+52>>2]|0;a=b|0;d$(g,a)|0;h[b+40>>3]=+h[b+32>>3];a=b+64|0;g=f;c[a>>2]=c[g>>2];c[a+4>>2]=c[g+4>>2];c[a+8>>2]=c[g+8>>2];c[a+12>>2]=c[g+12>>2];dk(e,b);g=b+144|0;b=e;c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];c[g+12>>2]=c[b+12>>2];c[g+16>>2]=c[b+16>>2];c[g+20>>2]=c[b+20>>2];c[g+24>>2]=c[b+24>>2];c[g+28>>2]=c[b+28>>2];i=d;return}}function ec(a){a=a|0;c[a+12>>2]=0;c[a+16>>2]=0;return a|0}function ed(a){a=a|0;return c[a+16>>2]|0}function ee(a){a=a|0;var b=0;b=c[a+16>>2]|0;if((b|0)==0){return a|0}ek(b);return a|0}function ef(a){a=a|0;var b=0,d=0,e=0,f=0;b=d7(2664)|0;d=ex(a|0)|0;e=b+12|0;c[e>>2]=d;f=eg(d)|0;c[b+16>>2]=f;ey(f|0,a|0,c[e>>2]|0)|0;return b|0}function eg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;b=a;if(b>>>0<=244){if(b>>>0<11){d=16}else{d=b+11&-8}e=d;d=e>>>3;a=(c[454]|0)>>>(d>>>0);if((a&3|0)!=0){d=d+((a^-1)&1)|0;f=1856+(d<<1<<2)|0;g=c[f+8>>2]|0;h=c[g+8>>2]|0;if((f|0)==(h|0)){c[454]=c[454]&(1<<d^-1)}else{if(h>>>0>=(c[458]|0)>>>0){i=(c[h+12>>2]|0)==(g|0)}else{i=0}if((i&1|0)==0){au();return 0;return 0}c[h+12>>2]=f;c[f+8>>2]=h}c[g+4>>2]=d<<3|1|2;h=g+(d<<3)+4|0;c[h>>2]=c[h>>2]|1;j=g+8|0;k=j;return k|0}do{if(e>>>0>(c[456]|0)>>>0){if((a|0)==0){do{if((c[455]|0)!=0){g=eh(1816,e)|0;j=g;if((g|0)==0){break}k=j;return k|0}}while(0);break}g=a<<d&(1<<d<<1|-(1<<d<<1));h=(g&-g)-1|0;g=h>>>12&16;f=g;h=h>>>(g>>>0);i=h>>>5&8;g=i;f=f+i|0;h=h>>>(g>>>0);i=h>>>2&4;g=i;f=f+i|0;h=h>>>(g>>>0);i=h>>>1&2;g=i;f=f+i|0;h=h>>>(g>>>0);i=h>>>1&1;g=i;f=f+i|0;h=h>>>(g>>>0);g=f+h|0;h=1856+(g<<1<<2)|0;f=c[h+8>>2]|0;i=c[f+8>>2]|0;if((h|0)==(i|0)){c[454]=c[454]&(1<<g^-1)}else{if(i>>>0>=(c[458]|0)>>>0){l=(c[i+12>>2]|0)==(f|0)}else{l=0}if((l&1|0)==0){au();return 0;return 0}c[i+12>>2]=h;c[h+8>>2]=i}i=(g<<3)-e|0;c[f+4>>2]=e|1|2;g=f+e|0;c[g+4>>2]=i|1;c[g+i>>2]=i;h=c[456]|0;if((h|0)!=0){m=c[459]|0;n=h>>>3;h=1856+(n<<1<<2)|0;o=h;if((c[454]&1<<n|0)!=0){if(((c[h+8>>2]|0)>>>0>=(c[458]|0)>>>0&1|0)==0){au();return 0;return 0}o=c[h+8>>2]|0}else{c[454]=c[454]|1<<n}c[h+8>>2]=m;c[o+12>>2]=m;c[m+8>>2]=o;c[m+12>>2]=h}c[456]=i;c[459]=g;j=f+8|0;k=j;return k|0}}while(0)}else{if(b>>>0>=4294967232){e=-1}else{e=b+11&-8;do{if((c[455]|0)!=0){b=ei(1816,e)|0;j=b;if((b|0)==0){break}k=j;return k|0}}while(0)}}if(e>>>0<=(c[456]|0)>>>0){b=(c[456]|0)-e|0;l=c[459]|0;if(b>>>0>=16){d=l+e|0;c[459]=d;a=d;c[456]=b;c[a+4>>2]=b|1;c[a+b>>2]=b;c[l+4>>2]=e|1|2}else{b=c[456]|0;c[456]=0;c[459]=0;c[l+4>>2]=b|1|2;a=l+b+4|0;c[a>>2]=c[a>>2]|1}j=l+8|0;k=j;return k|0}if(e>>>0<(c[457]|0)>>>0){l=(c[457]|0)-e|0;c[457]=l;a=c[460]|0;b=a+e|0;c[460]=b;c[b+4>>2]=l|1;c[a+4>>2]=e|1|2;j=a+8|0;k=j;return k|0}j=ej(1816,e)|0;k=j;return k|0}function eh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=a;a=b;b=(c[d+4>>2]&-(c[d+4>>2]|0))-1|0;e=b>>>12&16;f=e;b=b>>>(e>>>0);g=b>>>5&8;e=g;f=f+g|0;b=b>>>(e>>>0);g=b>>>2&4;e=g;f=f+g|0;b=b>>>(e>>>0);g=b>>>1&2;e=g;f=f+g|0;b=b>>>(e>>>0);g=b>>>1&1;e=g;f=f+g|0;b=b>>>(e>>>0);e=c[d+304+(f+b<<2)>>2]|0;b=e;f=e;e=(c[b+4>>2]&-8)-a|0;while(1){if((c[b+16>>2]|0)!=0){h=c[b+16>>2]|0}else{h=c[b+20>>2]|0}b=h;if((h|0)==0){break}g=(c[b+4>>2]&-8)-a|0;if(g>>>0<e>>>0){e=g;f=b}}if((f>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}b=f+a|0;if((f>>>0<b>>>0&1|0)==0){au();return 0;return 0}h=c[f+24>>2]|0;if((c[f+12>>2]|0)!=(f|0)){g=c[f+8>>2]|0;i=c[f+12>>2]|0;do{if(g>>>0>=(c[d+16>>2]|0)>>>0){if((c[g+12>>2]|0)!=(f|0)){j=0;break}j=(c[i+8>>2]|0)==(f|0)}else{j=0}}while(0);if((j&1|0)==0){au();return 0;return 0}c[g+12>>2]=i;c[i+8>>2]=g}else{g=f+20|0;j=g;k=c[g>>2]|0;i=k;if((k|0)!=0){l=1001}else{k=f+16|0;j=k;g=c[k>>2]|0;i=g;if((g|0)!=0){l=1001}}if((l|0)==1001){while(1){l=i+20|0;g=l;if((c[l>>2]|0)!=0){m=1}else{l=i+16|0;g=l;m=(c[l>>2]|0)!=0}if(!m){break}l=g;j=l;i=c[l>>2]|0}if((j>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[j>>2]=0}}if((h|0)!=0){j=d+304+(c[f+28>>2]<<2)|0;if((f|0)==(c[j>>2]|0)){m=i;c[j>>2]=m;if((m|0)==0){m=d+4|0;c[m>>2]=c[m>>2]&(1<<c[f+28>>2]^-1)}}else{if((h>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}if((c[h+16>>2]|0)==(f|0)){c[h+16>>2]=i}else{c[h+20>>2]=i}}if((i|0)!=0){if((i>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[i+24>>2]=h;h=c[f+16>>2]|0;m=h;if((h|0)!=0){if((m>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[i+16>>2]=m;c[m+24>>2]=i}m=c[f+20>>2]|0;h=m;if((m|0)!=0){if((h>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[i+20>>2]=h;c[h+24>>2]=i}}}if(e>>>0<16){c[f+4>>2]=e+a|1|2;i=f+(e+a)+4|0;c[i>>2]=c[i>>2]|1;n=f;o=n;p=o+8|0;return p|0}c[f+4>>2]=a|1|2;c[b+4>>2]=e|1;c[b+e>>2]=e;a=c[d+8>>2]|0;if((a|0)!=0){i=c[d+20>>2]|0;h=a>>>3;a=d+40+(h<<1<<2)|0;m=a;if((c[d>>2]&1<<h|0)!=0){if(((c[a+8>>2]|0)>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}m=c[a+8>>2]|0}else{j=d|0;c[j>>2]=c[j>>2]|1<<h}c[a+8>>2]=i;c[m+12>>2]=i;c[i+8>>2]=m;c[i+12>>2]=a}c[d+8>>2]=e;c[d+20>>2]=b;n=f;o=n;p=o+8|0;return p|0}function ei(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=a;a=b;b=0;e=-a|0;f=a>>>8;if((f|0)==0){g=0}else{if(f>>>0>65535){g=31}else{h=f;f=(h-256|0)>>>16&8;i=h<<f;h=i;j=(i-4096|0)>>>16&4;f=f+j|0;i=h<<j;h=i;k=(i-16384|0)>>>16&2;j=k;f=f+k|0;k=h<<j;h=k;j=14-f+(k>>>15)|0;g=(j<<1)+(a>>>((j+7|0)>>>0)&1)|0}}j=c[d+304+(g<<2)>>2]|0;k=j;if((j|0)!=0){if((g|0)==31){l=0}else{l=31-((g>>>1)+8-2)|0}j=a<<l;l=0;while(1){f=(c[k+4>>2]&-8)-a|0;if(f>>>0<e>>>0){b=k;h=f;e=h;if((h|0)==0){m=1070;break}}h=c[k+20>>2]|0;k=c[k+16+((j>>>31&1)<<2)>>2]|0;do{if((h|0)!=0){if((h|0)==(k|0)){break}l=h}}while(0);if((k|0)==0){m=1076;break}j=j<<1}if((m|0)==1076){k=l}}do{if((k|0)==0){if((b|0)!=0){break}l=(1<<g<<1|-(1<<g<<1))&c[d+4>>2];if((l|0)!=0){j=(l&-l)-1|0;l=j>>>12&16;h=l;j=j>>>(l>>>0);f=j>>>5&8;l=f;h=h+f|0;j=j>>>(l>>>0);f=j>>>2&4;l=f;h=h+f|0;j=j>>>(l>>>0);f=j>>>1&2;l=f;h=h+f|0;j=j>>>(l>>>0);f=j>>>1&1;l=f;h=h+f|0;j=j>>>(l>>>0);k=c[d+304+(h+j<<2)>>2]|0}}}while(0);while(1){if((k|0)==0){break}g=(c[k+4>>2]&-8)-a|0;if(g>>>0<e>>>0){e=g;b=k}if((c[k+16>>2]|0)!=0){n=c[k+16>>2]|0}else{n=c[k+20>>2]|0}k=n}do{if((b|0)!=0){if(e>>>0>=((c[d+8>>2]|0)-a|0)>>>0){break}if((b>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}n=b+a|0;if((b>>>0<n>>>0&1|0)==0){au();return 0;return 0}k=c[b+24>>2]|0;if((c[b+12>>2]|0)!=(b|0)){g=c[b+8>>2]|0;o=c[b+12>>2]|0;do{if(g>>>0>=(c[d+16>>2]|0)>>>0){if((c[g+12>>2]|0)!=(b|0)){p=0;break}p=(c[o+8>>2]|0)==(b|0)}else{p=0}}while(0);if((p&1|0)==0){au();return 0;return 0}c[g+12>>2]=o;c[o+8>>2]=g}else{j=b+20|0;h=j;l=c[j>>2]|0;o=l;if((l|0)!=0){m=1106}else{l=b+16|0;h=l;j=c[l>>2]|0;o=j;if((j|0)!=0){m=1106}}if((m|0)==1106){while(1){j=o+20|0;l=j;if((c[j>>2]|0)!=0){q=1}else{j=o+16|0;l=j;q=(c[j>>2]|0)!=0}if(!q){break}j=l;h=j;o=c[j>>2]|0}if((h>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[h>>2]=0}}if((k|0)!=0){g=d+304+(c[b+28>>2]<<2)|0;if((b|0)==(c[g>>2]|0)){j=o;c[g>>2]=j;if((j|0)==0){j=d+4|0;c[j>>2]=c[j>>2]&(1<<c[b+28>>2]^-1)}}else{if((k>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}if((c[k+16>>2]|0)==(b|0)){c[k+16>>2]=o}else{c[k+20>>2]=o}}if((o|0)!=0){if((o>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[o+24>>2]=k;j=c[b+16>>2]|0;g=j;if((j|0)!=0){if((g>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[o+16>>2]=g;c[g+24>>2]=o}g=c[b+20>>2]|0;j=g;if((g|0)!=0){if((j>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[o+20>>2]=j;c[j+24>>2]=o}}}if(e>>>0<16){c[b+4>>2]=e+a|1|2;j=b+(e+a)+4|0;c[j>>2]=c[j>>2]|1}else{c[b+4>>2]=a|1|2;c[n+4>>2]=e|1;c[n+e>>2]=e;if(e>>>3>>>0<32){j=e>>>3;g=d+40+(j<<1<<2)|0;l=g;if((c[d>>2]&1<<j|0)!=0){if(((c[g+8>>2]|0)>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}l=c[g+8>>2]|0}else{f=d|0;c[f>>2]=c[f>>2]|1<<j}c[g+8>>2]=n;c[l+12>>2]=n;c[n+8>>2]=l;c[n+12>>2]=g}else{g=n;l=e>>>8;if((l|0)==0){r=0}else{if(l>>>0>65535){r=31}else{j=l;l=(j-256|0)>>>16&8;f=j<<l;j=f;i=(f-4096|0)>>>16&4;l=l+i|0;f=j<<i;j=f;s=(f-16384|0)>>>16&2;i=s;l=l+s|0;s=j<<i;j=s;i=14-l+(s>>>15)|0;r=(i<<1)+(e>>>((i+7|0)>>>0)&1)|0}}i=d+304+(r<<2)|0;c[g+28>>2]=r;c[g+20>>2]=0;c[g+16>>2]=0;if((c[d+4>>2]&1<<r|0)!=0){s=c[i>>2]|0;if((r|0)==31){t=0}else{t=31-((r>>>1)+8-2)|0}l=e<<t;while(1){if((c[s+4>>2]&-8|0)==(e|0)){m=1173;break}u=s+16+((l>>>31&1)<<2)|0;l=l<<1;if((c[u>>2]|0)==0){m=1169;break}s=c[u>>2]|0}do{if((m|0)==1169){if((u>>>0>=(c[d+16>>2]|0)>>>0&1|0)!=0){c[u>>2]=g;c[g+24>>2]=s;l=g;c[g+12>>2]=l;c[g+8>>2]=l;break}else{au();return 0;return 0}}else if((m|0)==1173){l=c[s+8>>2]|0;if(s>>>0>=(c[d+16>>2]|0)>>>0){v=l>>>0>=(c[d+16>>2]|0)>>>0}else{v=0}if((v&1|0)!=0){n=g;c[l+12>>2]=n;c[s+8>>2]=n;c[g+8>>2]=l;c[g+12>>2]=s;c[g+24>>2]=0;break}else{au();return 0;return 0}}}while(0)}else{s=d+4|0;c[s>>2]=c[s>>2]|1<<r;c[i>>2]=g;c[g+24>>2]=i;s=g;c[g+12>>2]=s;c[g+8>>2]=s}}}w=b+8|0;x=w;return x|0}}while(0);w=0;x=w;return x|0}function ej(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=a;a=b;b=-1;e=0;f=0;if((c[26]|0)!=0){g=1}else{g=(eo()|0)!=0}do{if((c[d+444>>2]&0|0)!=0){if(a>>>0<(c[29]|0)>>>0){break}if((c[d+12>>2]|0)==0){break}g=er(d,a)|0;if((g|0)==0){break}h=g;i=h;return i|0}}while(0);g=a+48+((c[28]|0)-1)&((c[28]|0)-1^-1);if(g>>>0<=a>>>0){h=0;i=h;return i|0}L1524:do{if((c[d+440>>2]|0)!=0){j=(c[d+432>>2]|0)+g|0;do{if(j>>>0>(c[d+432>>2]|0)>>>0){if(j>>>0>(c[d+440>>2]|0)>>>0){break}break L1524}}while(0);h=0;i=h;return i|0}}while(0);if((c[d+444>>2]&4|0)==0){j=-1;k=g;if((c[d+24>>2]|0)==0){l=0}else{l=ep(d,c[d+24>>2]|0)|0}m=l;if((m|0)==0){l=bd(0)|0;if((l|0)!=-1){if((l&(c[27]|0)-1|0)!=0){k=k+((l+((c[27]|0)-1)&((c[27]|0)-1^-1))-l)|0}n=(c[d+432>>2]|0)+k|0;do{if(k>>>0>a>>>0){if(k>>>0>=2147483647){break}if((c[d+440>>2]|0)!=0){if(n>>>0<=(c[d+432>>2]|0)>>>0){break}if(n>>>0>(c[d+440>>2]|0)>>>0){break}}o=bd(k|0)|0;j=o;if((o|0)!=(l|0)){break}b=l;e=k}}while(0)}}else{k=a-(c[d+12>>2]|0)+48+((c[28]|0)-1)&((c[28]|0)-1^-1);do{if(k>>>0<2147483647){l=bd(k|0)|0;j=l;if((l|0)!=((c[m>>2]|0)+(c[m+4>>2]|0)|0)){break}b=j;e=k}}while(0)}if((b|0)==-1){if((j|0)!=-1){do{if(k>>>0<2147483647){if(k>>>0>=(a+48|0)>>>0){break}m=a+48-k+((c[28]|0)-1)&((c[28]|0)-1^-1);if(m>>>0<2147483647){if((bd(m|0)|0)!=-1){k=k+m|0}else{m=-k|0;bd(m|0)|0;j=-1}}}}while(0)}if((j|0)!=-1){b=j;e=k}else{k=d+444|0;c[k>>2]=c[k>>2]|4}}}if((b|0)==-1){if(g>>>0<2147483647){k=-1;j=-1;k=bd(g|0)|0;j=bd(0)|0;do{if((k|0)!=-1){if((j|0)==-1){break}if(k>>>0>=j>>>0){break}g=j-k|0;if(g>>>0>(a+40|0)>>>0){b=k;e=g}}}while(0)}}do{if((b|0)!=-1){k=d+432|0;j=(c[k>>2]|0)+e|0;c[k>>2]=j;if(j>>>0>(c[d+436>>2]|0)>>>0){c[d+436>>2]=c[d+432>>2]}if((c[d+24>>2]|0)!=0){j=d+448|0;while(1){if((j|0)!=0){p=(b|0)!=((c[j>>2]|0)+(c[j+4>>2]|0)|0)}else{p=0}if(!p){break}j=c[j+8>>2]|0}do{if((j|0)!=0){if((c[j+12>>2]&8|0)!=0){q=1275;break}if((c[j+12>>2]&0|0)!=(f|0)){q=1275;break}if((c[d+24>>2]|0)>>>0<(c[j>>2]|0)>>>0){q=1275;break}if((c[d+24>>2]|0)>>>0>=((c[j>>2]|0)+(c[j+4>>2]|0)|0)>>>0){q=1275;break}k=j+4|0;c[k>>2]=(c[k>>2]|0)+e;eq(d,c[d+24>>2]|0,(c[d+12>>2]|0)+e|0)}else{q=1275}}while(0);if((q|0)==1275){if(b>>>0<(c[d+16>>2]|0)>>>0){c[d+16>>2]=b}j=d+448|0;while(1){if((j|0)!=0){r=(c[j>>2]|0)!=(b+e|0)}else{r=0}if(!r){break}j=c[j+8>>2]|0}do{if((j|0)!=0){if((c[j+12>>2]&8|0)!=0){break}if((c[j+12>>2]&0|0)!=(f|0)){break}k=c[j>>2]|0;c[j>>2]=b;g=j+4|0;c[g>>2]=(c[g>>2]|0)+e;h=et(d,b,k,a)|0;i=h;return i|0}}while(0);eu(d,b,e,f)}}else{if((c[d+16>>2]|0)==0){q=1259}else{if(b>>>0<(c[d+16>>2]|0)>>>0){q=1259}}if((q|0)==1259){c[d+16>>2]=b}c[d+448>>2]=b;c[d+452>>2]=e;c[d+460>>2]=f;c[d+36>>2]=c[26];c[d+32>>2]=-1;es(d);if((d|0)==1816){eq(d,b,e-40|0)}else{j=d-8+(c[d-8+4>>2]&-8)|0;eq(d,j,b+e-j-40|0)}}if(a>>>0>=(c[d+12>>2]|0)>>>0){break}j=d+12|0;k=(c[j>>2]|0)-a|0;c[j>>2]=k;j=c[d+24>>2]|0;g=j+a|0;c[d+24>>2]=g;c[g+4>>2]=k|1;c[j+4>>2]=a|1|2;h=j+8|0;i=h;return i|0}}while(0);c[(bi()|0)>>2]=12;h=0;i=h;return i|0}function ek(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;b=a;if((b|0)==0){return}a=b-8|0;if(a>>>0>=(c[458]|0)>>>0){d=(c[a+4>>2]&3|0)!=1}else{d=0}L1661:do{if((d&1|0)!=0){b=c[a+4>>2]&-8;e=a+b|0;L1663:do{if((c[a+4>>2]&1|0)!=0){f=1385}else{g=c[a>>2]|0;if((c[a+4>>2]&3|0)==0){b=b+(g+16)|0;break}h=a+(-g|0)|0;b=b+g|0;a=h;if((h>>>0>=(c[458]|0)>>>0&1|0)==0){au()}do{if((a|0)!=(c[459]|0)){if(g>>>3>>>0<32){h=c[a+8>>2]|0;i=c[a+12>>2]|0;j=g>>>3;if((h|0)==(1856+(j<<1<<2)|0)){k=1}else{if(h>>>0>=(c[458]|0)>>>0){l=(c[h+12>>2]|0)==(a|0)}else{l=0}k=l}if((k&1|0)==0){au()}if((i|0)==(h|0)){c[454]=c[454]&(1<<j^-1)}else{if((i|0)==(1856+(j<<1<<2)|0)){m=1}else{if(i>>>0>=(c[458]|0)>>>0){n=(c[i+8>>2]|0)==(a|0)}else{n=0}m=n}if((m&1|0)==0){au()}c[h+12>>2]=i;c[i+8>>2]=h}}else{h=a;i=c[h+24>>2]|0;if((c[h+12>>2]|0)!=(h|0)){j=c[h+8>>2]|0;o=c[h+12>>2]|0;do{if(j>>>0>=(c[458]|0)>>>0){if((c[j+12>>2]|0)!=(h|0)){p=0;break}p=(c[o+8>>2]|0)==(h|0)}else{p=0}}while(0);if((p&1|0)==0){au()}c[j+12>>2]=o;c[o+8>>2]=j}else{q=h+20|0;r=q;s=c[q>>2]|0;o=s;if((s|0)!=0){f=1338}else{s=h+16|0;r=s;q=c[s>>2]|0;o=q;if((q|0)!=0){f=1338}}if((f|0)==1338){while(1){q=o+20|0;s=q;if((c[q>>2]|0)!=0){t=1}else{q=o+16|0;s=q;t=(c[q>>2]|0)!=0}if(!t){break}q=s;r=q;o=c[q>>2]|0}if((r>>>0>=(c[458]|0)>>>0&1|0)==0){au()}c[r>>2]=0}}if((i|0)!=0){j=2120+(c[h+28>>2]<<2)|0;if((h|0)==(c[j>>2]|0)){q=o;c[j>>2]=q;if((q|0)==0){c[455]=c[455]&(1<<c[h+28>>2]^-1)}}else{if((i>>>0>=(c[458]|0)>>>0&1|0)==0){au()}if((c[i+16>>2]|0)==(h|0)){c[i+16>>2]=o}else{c[i+20>>2]=o}}if((o|0)!=0){if((o>>>0>=(c[458]|0)>>>0&1|0)==0){au()}c[o+24>>2]=i;q=c[h+16>>2]|0;j=q;if((q|0)!=0){if((j>>>0>=(c[458]|0)>>>0&1|0)==0){au()}c[o+16>>2]=j;c[j+24>>2]=o}j=c[h+20>>2]|0;q=j;if((j|0)!=0){if((q>>>0>=(c[458]|0)>>>0&1|0)==0){au()}c[o+20>>2]=q;c[q+24>>2]=o}}}}}else{if((c[e+4>>2]&3|0)==3){c[456]=b;q=e+4|0;c[q>>2]=c[q>>2]&-2;c[a+4>>2]=b|1;c[a+b>>2]=b;break L1663}else{break}}}while(0);f=1385}}while(0);do{if((f|0)==1385){if(a>>>0<e>>>0){u=(c[e+4>>2]&1|0)!=0}else{u=0}if((u&1|0)==0){break L1661}if((c[e+4>>2]&2|0)!=0){g=e+4|0;c[g>>2]=c[g>>2]&-2;c[a+4>>2]=b|1;c[a+b>>2]=b}else{if((e|0)==(c[460]|0)){g=(c[457]|0)+b|0;c[457]=g;q=g;c[460]=a;c[a+4>>2]=q|1;if((a|0)==(c[459]|0)){c[459]=0;c[456]=0}if(q>>>0>(c[461]|0)>>>0){el(1816,0)|0}break}if((e|0)==(c[459]|0)){q=(c[456]|0)+b|0;c[456]=q;g=q;c[459]=a;c[a+4>>2]=g|1;c[a+g>>2]=g;break}g=c[e+4>>2]&-8;b=b+g|0;if(g>>>3>>>0<32){q=c[e+8>>2]|0;j=c[e+12>>2]|0;s=g>>>3;if((q|0)==(1856+(s<<1<<2)|0)){v=1}else{if(q>>>0>=(c[458]|0)>>>0){w=(c[q+12>>2]|0)==(e|0)}else{w=0}v=w}if((v&1|0)==0){au()}if((j|0)==(q|0)){c[454]=c[454]&(1<<s^-1)}else{if((j|0)==(1856+(s<<1<<2)|0)){x=1}else{if(j>>>0>=(c[458]|0)>>>0){y=(c[j+8>>2]|0)==(e|0)}else{y=0}x=y}if((x&1|0)==0){au()}c[q+12>>2]=j;c[j+8>>2]=q}}else{q=e;j=c[q+24>>2]|0;if((c[q+12>>2]|0)!=(q|0)){s=c[q+8>>2]|0;z=c[q+12>>2]|0;do{if(s>>>0>=(c[458]|0)>>>0){if((c[s+12>>2]|0)!=(q|0)){A=0;break}A=(c[z+8>>2]|0)==(q|0)}else{A=0}}while(0);if((A&1|0)==0){au()}c[s+12>>2]=z;c[z+8>>2]=s}else{g=q+20|0;B=g;C=c[g>>2]|0;z=C;if((C|0)!=0){f=1426}else{C=q+16|0;B=C;g=c[C>>2]|0;z=g;if((g|0)!=0){f=1426}}if((f|0)==1426){while(1){g=z+20|0;C=g;if((c[g>>2]|0)!=0){D=1}else{g=z+16|0;C=g;D=(c[g>>2]|0)!=0}if(!D){break}g=C;B=g;z=c[g>>2]|0}if((B>>>0>=(c[458]|0)>>>0&1|0)==0){au()}c[B>>2]=0}}if((j|0)!=0){s=2120+(c[q+28>>2]<<2)|0;if((q|0)==(c[s>>2]|0)){g=z;c[s>>2]=g;if((g|0)==0){c[455]=c[455]&(1<<c[q+28>>2]^-1)}}else{if((j>>>0>=(c[458]|0)>>>0&1|0)==0){au()}if((c[j+16>>2]|0)==(q|0)){c[j+16>>2]=z}else{c[j+20>>2]=z}}if((z|0)!=0){if((z>>>0>=(c[458]|0)>>>0&1|0)==0){au()}c[z+24>>2]=j;g=c[q+16>>2]|0;s=g;if((g|0)!=0){if((s>>>0>=(c[458]|0)>>>0&1|0)==0){au()}c[z+16>>2]=s;c[s+24>>2]=z}s=c[q+20>>2]|0;g=s;if((s|0)!=0){if((g>>>0>=(c[458]|0)>>>0&1|0)==0){au()}c[z+20>>2]=g;c[g+24>>2]=z}}}}c[a+4>>2]=b|1;c[a+b>>2]=b;if((a|0)==(c[459]|0)){c[456]=b;break}}if(b>>>3>>>0<32){g=b>>>3;s=1856+(g<<1<<2)|0;C=s;if((c[454]&1<<g|0)!=0){if(((c[s+8>>2]|0)>>>0>=(c[458]|0)>>>0&1|0)==0){au()}C=c[s+8>>2]|0}else{c[454]=c[454]|1<<g}c[s+8>>2]=a;c[C+12>>2]=a;c[a+8>>2]=C;c[a+12>>2]=s}else{s=a;C=b>>>8;if((C|0)==0){E=0}else{if(C>>>0>65535){E=31}else{g=C;C=(g-256|0)>>>16&8;F=g<<C;g=F;G=(F-4096|0)>>>16&4;C=C+G|0;F=g<<G;g=F;H=(F-16384|0)>>>16&2;G=H;C=C+H|0;H=g<<G;g=H;G=14-C+(H>>>15)|0;E=(G<<1)+(b>>>((G+7|0)>>>0)&1)|0}}G=2120+(E<<2)|0;c[s+28>>2]=E;c[s+20>>2]=0;c[s+16>>2]=0;if((c[455]&1<<E|0)!=0){H=c[G>>2]|0;if((E|0)==31){I=0}else{I=31-((E>>>1)+8-2)|0}C=b<<I;while(1){if((c[H+4>>2]&-8|0)==(b|0)){f=1498;break}J=H+16+((C>>>31&1)<<2)|0;C=C<<1;if((c[J>>2]|0)==0){f=1494;break}H=c[J>>2]|0}do{if((f|0)==1494){if((J>>>0>=(c[458]|0)>>>0&1|0)!=0){c[J>>2]=s;c[s+24>>2]=H;C=s;c[s+12>>2]=C;c[s+8>>2]=C;break}else{au()}}else if((f|0)==1498){C=c[H+8>>2]|0;if(H>>>0>=(c[458]|0)>>>0){K=C>>>0>=(c[458]|0)>>>0}else{K=0}if((K&1|0)!=0){q=s;c[C+12>>2]=q;c[H+8>>2]=q;c[s+8>>2]=C;c[s+12>>2]=H;c[s+24>>2]=0;break}else{au()}}}while(0)}else{c[455]=c[455]|1<<E;c[G>>2]=s;c[s+24>>2]=G;H=s;c[s+12>>2]=H;c[s+8>>2]=H}H=(c[462]|0)-1|0;c[462]=H;if((H|0)==0){en(1816)|0}}}}while(0);return}}while(0);au()}function el(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=a;a=b;b=0;if((c[26]|0)!=0){e=1}else{e=(eo()|0)!=0}if(a>>>0>=4294967232){f=b;g=(f|0)!=0;h=g?1:0;return h|0}if((c[d+24>>2]|0)==0){f=b;g=(f|0)!=0;h=g?1:0;return h|0}a=a+40|0;if((c[d+12>>2]|0)>>>0>a>>>0){e=c[28]|0;i=Z(((((c[d+12>>2]|0)-a+(e-1)|0)>>>0)/(e>>>0)>>>0)-1|0,e)|0;a=ep(d,c[d+24>>2]|0)|0;if((c[a+12>>2]&8|0)==0){if((c[a+12>>2]&0|0)==0){if(i>>>0>=2147483647){i=-2147483648-e|0}e=bd(0)|0;if((e|0)==((c[a>>2]|0)+(c[a+4>>2]|0)|0)){j=bd(-i|0)|0;i=bd(0)|0;do{if((j|0)!=-1){if(i>>>0>=e>>>0){break}b=e-i|0}}while(0)}}}if((b|0)!=0){i=a+4|0;c[i>>2]=(c[i>>2]|0)-b;i=d+432|0;c[i>>2]=(c[i>>2]|0)-b;eq(d,c[d+24>>2]|0,(c[d+12>>2]|0)-b|0)}}do{if((b|0)==0){if((c[d+12>>2]|0)>>>0<=(c[d+28>>2]|0)>>>0){break}c[d+28>>2]=-1}}while(0);f=b;g=(f|0)!=0;h=g?1:0;return h|0}function em(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;b=0;if((d|0)!=0){b=Z(d,a)|0;do{if(((d|a)&-65536|0)!=0){if(((b>>>0)/(d>>>0)>>>0|0)==(a|0)){break}b=-1}}while(0)}a=eg(b)|0;if((a|0)==0){e=a;return e|0}if((c[a-8+4>>2]&3|0)==0){e=a;return e|0}ev(a|0,0,b|0);e=a;return e|0}function en(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;b=a;a=0;d=0;e=b+448|0;f=c[e+8>>2]|0;L2008:while(1){if((f|0)==0){g=1647;break}h=c[f>>2]|0;i=c[f+4>>2]|0;j=c[f+8>>2]|0;d=d+1|0;do{if((c[f+12>>2]&0|0)!=0){if((c[f+12>>2]&8|0)!=0){break}if((h+8&7|0)==0){k=0}else{k=8-(h+8&7)&7}l=h+k|0;m=c[l+4>>2]&-8;do{if((c[l+4>>2]&3|0)==1){if((l+m|0)>>>0<(h+i-40|0)>>>0){break}n=l;if((l|0)==(c[b+20>>2]|0)){c[b+20>>2]=0;c[b+8>>2]=0}else{o=c[n+24>>2]|0;if((c[n+12>>2]|0)!=(n|0)){p=c[n+8>>2]|0;q=c[n+12>>2]|0;do{if(p>>>0>=(c[b+16>>2]|0)>>>0){if((c[p+12>>2]|0)!=(n|0)){r=0;break}r=(c[q+8>>2]|0)==(n|0)}else{r=0}}while(0);if((r&1|0)==0){g=1575;break L2008}c[p+12>>2]=q;c[q+8>>2]=p}else{s=n+20|0;t=s;u=c[s>>2]|0;q=u;if((u|0)!=0){g=1579}else{u=n+16|0;t=u;s=c[u>>2]|0;q=s;if((s|0)!=0){g=1579}}if((g|0)==1579){g=0;while(1){s=q+20|0;u=s;if((c[s>>2]|0)!=0){v=1}else{s=q+16|0;u=s;v=(c[s>>2]|0)!=0}if(!v){break}s=u;t=s;q=c[s>>2]|0}if((t>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1586;break L2008}c[t>>2]=0}}if((o|0)!=0){p=b+304+(c[n+28>>2]<<2)|0;if((n|0)==(c[p>>2]|0)){s=q;c[p>>2]=s;if((s|0)==0){s=b+4|0;c[s>>2]=c[s>>2]&(1<<c[n+28>>2]^-1)}}else{if((o>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1599;break L2008}if((c[o+16>>2]|0)==(n|0)){c[o+16>>2]=q}else{c[o+20>>2]=q}}if((q|0)!=0){if((q>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1614;break L2008}c[q+24>>2]=o;s=c[n+16>>2]|0;p=s;if((s|0)!=0){if((p>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1606;break L2008}c[q+16>>2]=p;c[p+24>>2]=q}p=c[n+20>>2]|0;s=p;if((p|0)!=0){if((s>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1611;break L2008}c[q+20>>2]=s;c[s+24>>2]=q}}}}s=m>>>8;if((s|0)==0){w=0}else{if(s>>>0>65535){w=31}else{p=s;s=(p-256|0)>>>16&8;u=p<<s;p=u;x=(u-4096|0)>>>16&4;s=s+x|0;u=p<<x;p=u;y=(u-16384|0)>>>16&2;x=y;s=s+y|0;y=p<<x;p=y;x=14-s+(y>>>15)|0;w=(x<<1)+(m>>>((x+7|0)>>>0)&1)|0}}x=b+304+(w<<2)|0;c[n+28>>2]=w;c[n+20>>2]=0;c[n+16>>2]=0;if((c[b+4>>2]&1<<w|0)!=0){y=c[x>>2]|0;if((w|0)==31){z=0}else{z=31-((w>>>1)+8-2)|0}s=m<<z;while(1){if((c[y+4>>2]&-8|0)==(m|0)){g=1637;break}A=y+16+((s>>>31&1)<<2)|0;s=s<<1;if((c[A>>2]|0)==0){g=1633;break}y=c[A>>2]|0}if((g|0)==1633){g=0;if((A>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1635;break L2008}c[A>>2]=n;c[n+24>>2]=y;s=n;c[n+12>>2]=s;c[n+8>>2]=s}else if((g|0)==1637){g=0;s=c[y+8>>2]|0;if(y>>>0>=(c[b+16>>2]|0)>>>0){B=s>>>0>=(c[b+16>>2]|0)>>>0}else{B=0}if((B&1|0)==0){g=1641;break L2008}o=n;c[s+12>>2]=o;c[y+8>>2]=o;c[n+8>>2]=s;c[n+12>>2]=y;c[n+24>>2]=0}}else{s=b+4|0;c[s>>2]=c[s>>2]|1<<w;c[x>>2]=n;c[n+24>>2]=x;s=n;c[n+12>>2]=s;c[n+8>>2]=s}}}while(0)}}while(0);e=f;f=j}if((g|0)==1614){au();return 0;return 0}else if((g|0)==1575){au();return 0;return 0}else if((g|0)==1599){au();return 0;return 0}else if((g|0)==1635){au();return 0;return 0}else if((g|0)==1606){au();return 0;return 0}else if((g|0)==1611){au();return 0;return 0}else if((g|0)==1641){au();return 0;return 0}else if((g|0)==1586){au();return 0;return 0}else if((g|0)==1647){if(d>>>0>4294967295){C=d;D=b;E=D+32|0;c[E>>2]=C;F=a;return F|0}else{C=-1;D=b;E=D+32|0;c[E>>2]=C;F=a;return F|0}}return 0}function eo(){var a=0,b=0;if((c[26]|0)!=0){return 1}a=a_(8)|0;b=a;if((b&b-1|0)!=0){au();return 0;return 0}if((a&a-1|0)!=0){au();return 0;return 0}c[28]=b;c[27]=a;c[29]=-1;c[30]=2097152;c[31]=0;c[565]=c[31];a=(bn(0)|0)^1431655765;a=a|8;a=a&-8;c[26]=a;return 1}function ep(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=b;b=a+448|0;while(1){if(d>>>0>=(c[b>>2]|0)>>>0){if(d>>>0<((c[b>>2]|0)+(c[b+4>>2]|0)|0)>>>0){e=1666;break}}a=c[b+8>>2]|0;b=a;if((a|0)==0){e=1668;break}}if((e|0)==1666){f=b;g=f;return g|0}else if((e|0)==1668){f=0;g=f;return g|0}return 0}function eq(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;b=d;if((a+8&7|0)==0){f=0}else{f=8-(a+8&7)&7}d=f;a=a+d|0;b=b-d|0;c[e+24>>2]=a;c[e+12>>2]=b;c[a+4>>2]=b|1;c[a+b+4>>2]=40;c[e+28>>2]=c[30];return}function er(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=a;a=b;b=a+31+((c[27]|0)-1)&((c[27]|0)-1^-1);L2157:do{if((c[d+440>>2]|0)!=0){e=(c[d+432>>2]|0)+b|0;do{if(e>>>0>(c[d+432>>2]|0)>>>0){if(e>>>0>(c[d+440>>2]|0)>>>0){break}break L2157}}while(0);f=0;g=f;return g|0}}while(0);do{if(b>>>0>a>>>0){e=-1;if((e|0)==-1){break}if((e+8&7|0)==0){h=0}else{h=8-(e+8&7)&7}i=h;j=b-i-16|0;k=e+i|0;c[k>>2]=i;c[k+4>>2]=j;c[k+j+4>>2]=7;c[k+(j+4)+4>>2]=0;if((c[d+16>>2]|0)==0){l=1689}else{if(e>>>0<(c[d+16>>2]|0)>>>0){l=1689}}if((l|0)==1689){c[d+16>>2]=e}e=d+432|0;j=(c[e>>2]|0)+b|0;c[e>>2]=j;if(j>>>0>(c[d+436>>2]|0)>>>0){c[d+436>>2]=c[d+432>>2]}f=k+8|0;g=f;return g|0}}while(0);f=0;g=f;return g|0}function es(a){a=a|0;var b=0,d=0,e=0;b=a;a=0;while(1){if(a>>>0>=32){break}d=b+40+(a<<1<<2)|0;e=d;c[d+12>>2]=e;c[d+8>>2]=e;a=a+1|0}return}function et(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=a;a=b;b=d;d=e;if((a+8&7|0)==0){g=0}else{g=8-(a+8&7)&7}e=a+g|0;if((b+8&7|0)==0){h=0}else{h=8-(b+8&7)&7}g=b+h|0;h=e+d|0;b=g-e-d|0;c[e+4>>2]=d|1|2;if((g|0)==(c[f+24>>2]|0)){d=f+12|0;a=(c[d>>2]|0)+b|0;c[d>>2]=a;c[f+24>>2]=h;c[h+4>>2]=a|1;i=e;j=i;k=j+8|0;return k|0}if((g|0)==(c[f+20>>2]|0)){a=f+8|0;d=(c[a>>2]|0)+b|0;c[a>>2]=d;a=d;c[f+20>>2]=h;c[h+4>>2]=a|1;c[h+a>>2]=a}else{if((c[g+4>>2]&3|0)==1){a=c[g+4>>2]&-8;if(a>>>3>>>0<32){d=c[g+8>>2]|0;l=c[g+12>>2]|0;m=a>>>3;if((d|0)==(f+40+(m<<1<<2)|0)){n=1}else{if(d>>>0>=(c[f+16>>2]|0)>>>0){o=(c[d+12>>2]|0)==(g|0)}else{o=0}n=o}if((n&1|0)==0){au();return 0;return 0}if((l|0)==(d|0)){n=f|0;c[n>>2]=c[n>>2]&(1<<m^-1)}else{if((l|0)==(f+40+(m<<1<<2)|0)){p=1}else{if(l>>>0>=(c[f+16>>2]|0)>>>0){q=(c[l+8>>2]|0)==(g|0)}else{q=0}p=q}if((p&1|0)==0){au();return 0;return 0}c[d+12>>2]=l;c[l+8>>2]=d}}else{d=g;l=c[d+24>>2]|0;if((c[d+12>>2]|0)!=(d|0)){p=c[d+8>>2]|0;r=c[d+12>>2]|0;do{if(p>>>0>=(c[f+16>>2]|0)>>>0){if((c[p+12>>2]|0)!=(d|0)){s=0;break}s=(c[r+8>>2]|0)==(d|0)}else{s=0}}while(0);if((s&1|0)==0){au();return 0;return 0}c[p+12>>2]=r;c[r+8>>2]=p}else{p=d+20|0;s=p;q=c[p>>2]|0;r=q;if((q|0)!=0){t=1744}else{q=d+16|0;s=q;p=c[q>>2]|0;r=p;if((p|0)!=0){t=1744}}if((t|0)==1744){while(1){p=r+20|0;q=p;if((c[p>>2]|0)!=0){u=1}else{p=r+16|0;q=p;u=(c[p>>2]|0)!=0}if(!u){break}p=q;s=p;r=c[p>>2]|0}if((s>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[s>>2]=0}}if((l|0)!=0){s=f+304+(c[d+28>>2]<<2)|0;if((d|0)==(c[s>>2]|0)){u=r;c[s>>2]=u;if((u|0)==0){u=f+4|0;c[u>>2]=c[u>>2]&(1<<c[d+28>>2]^-1)}}else{if((l>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}if((c[l+16>>2]|0)==(d|0)){c[l+16>>2]=r}else{c[l+20>>2]=r}}if((r|0)!=0){if((r>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[r+24>>2]=l;l=c[d+16>>2]|0;u=l;if((l|0)!=0){if((u>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[r+16>>2]=u;c[u+24>>2]=r}u=c[d+20>>2]|0;d=u;if((u|0)!=0){if((d>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}c[r+20>>2]=d;c[d+24>>2]=r}}}}g=g+a|0;b=b+a|0}a=g+4|0;c[a>>2]=c[a>>2]&-2;c[h+4>>2]=b|1;c[h+b>>2]=b;if(b>>>3>>>0<32){a=b>>>3;g=f+40+(a<<1<<2)|0;r=g;if((c[f>>2]&1<<a|0)!=0){if(((c[g+8>>2]|0)>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){au();return 0;return 0}r=c[g+8>>2]|0}else{d=f|0;c[d>>2]=c[d>>2]|1<<a}c[g+8>>2]=h;c[r+12>>2]=h;c[h+8>>2]=r;c[h+12>>2]=g}else{g=h;h=b>>>8;if((h|0)==0){v=0}else{if(h>>>0>65535){v=31}else{r=h;h=(r-256|0)>>>16&8;a=r<<h;r=a;d=(a-4096|0)>>>16&4;h=h+d|0;a=r<<d;r=a;u=(a-16384|0)>>>16&2;d=u;h=h+u|0;u=r<<d;r=u;d=14-h+(u>>>15)|0;v=(d<<1)+(b>>>((d+7|0)>>>0)&1)|0}}d=f+304+(v<<2)|0;c[g+28>>2]=v;c[g+20>>2]=0;c[g+16>>2]=0;if((c[f+4>>2]&1<<v|0)!=0){u=c[d>>2]|0;if((v|0)==31){w=0}else{w=31-((v>>>1)+8-2)|0}h=b<<w;while(1){if((c[u+4>>2]&-8|0)==(b|0)){t=1811;break}x=u+16+((h>>>31&1)<<2)|0;h=h<<1;if((c[x>>2]|0)==0){t=1807;break}u=c[x>>2]|0}do{if((t|0)==1807){if((x>>>0>=(c[f+16>>2]|0)>>>0&1|0)!=0){c[x>>2]=g;c[g+24>>2]=u;h=g;c[g+12>>2]=h;c[g+8>>2]=h;break}else{au();return 0;return 0}}else if((t|0)==1811){h=c[u+8>>2]|0;if(u>>>0>=(c[f+16>>2]|0)>>>0){y=h>>>0>=(c[f+16>>2]|0)>>>0}else{y=0}if((y&1|0)!=0){b=g;c[h+12>>2]=b;c[u+8>>2]=b;c[g+8>>2]=h;c[g+12>>2]=u;c[g+24>>2]=0;break}else{au();return 0;return 0}}}while(0)}else{u=f+4|0;c[u>>2]=c[u>>2]|1<<v;c[d>>2]=g;c[g+24>>2]=d;d=g;c[g+12>>2]=d;c[g+8>>2]=d}}}i=e;j=i;k=j+8|0;return k|0}function eu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=a;a=b;b=d;d=c[f+24>>2]|0;g=ep(f,d)|0;h=(c[g>>2]|0)+(c[g+4>>2]|0)|0;g=24;i=h+(-(g+23|0)|0)|0;if((i+8&7|0)==0){j=0}else{j=8-(i+8&7)&7}k=i+j|0;if(k>>>0<(d+16|0)>>>0){l=d}else{l=k}k=l;l=k;j=l+8|0;i=l+g|0;m=0;eq(f,a,b-40|0);c[l+4>>2]=g|1|2;g=j;l=f+448|0;c[g>>2]=c[l>>2];c[g+4>>2]=c[l+4>>2];c[g+8>>2]=c[l+8>>2];c[g+12>>2]=c[l+12>>2];c[f+448>>2]=a;c[f+452>>2]=b;c[f+460>>2]=e;c[f+456>>2]=j;while(1){j=i+4|0;c[i+4>>2]=7;m=m+1|0;if((j+4|0)>>>0>=h>>>0){break}i=j}if((k|0)==(d|0)){return}i=d;h=k-d|0;d=i+h+4|0;c[d>>2]=c[d>>2]&-2;c[i+4>>2]=h|1;c[i+h>>2]=h;if(h>>>3>>>0<32){d=h>>>3;k=f+40+(d<<1<<2)|0;m=k;if((c[f>>2]&1<<d|0)!=0){if(((c[k+8>>2]|0)>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){au()}m=c[k+8>>2]|0}else{j=f|0;c[j>>2]=c[j>>2]|1<<d}c[k+8>>2]=i;c[m+12>>2]=i;c[i+8>>2]=m;c[i+12>>2]=k}else{k=i;i=h>>>8;if((i|0)==0){n=0}else{if(i>>>0>65535){n=31}else{m=i;i=(m-256|0)>>>16&8;d=m<<i;m=d;j=(d-4096|0)>>>16&4;i=i+j|0;d=m<<j;m=d;e=(d-16384|0)>>>16&2;j=e;i=i+e|0;e=m<<j;m=e;j=14-i+(e>>>15)|0;n=(j<<1)+(h>>>((j+7|0)>>>0)&1)|0}}j=f+304+(n<<2)|0;c[k+28>>2]=n;c[k+20>>2]=0;c[k+16>>2]=0;if((c[f+4>>2]&1<<n|0)!=0){e=c[j>>2]|0;if((n|0)==31){o=0}else{o=31-((n>>>1)+8-2)|0}i=h<<o;while(1){if((c[e+4>>2]&-8|0)==(h|0)){p=1863;break}q=e+16+((i>>>31&1)<<2)|0;i=i<<1;if((c[q>>2]|0)==0){p=1859;break}e=c[q>>2]|0}do{if((p|0)==1859){if((q>>>0>=(c[f+16>>2]|0)>>>0&1|0)!=0){c[q>>2]=k;c[k+24>>2]=e;i=k;c[k+12>>2]=i;c[k+8>>2]=i;break}else{au()}}else if((p|0)==1863){i=c[e+8>>2]|0;if(e>>>0>=(c[f+16>>2]|0)>>>0){r=i>>>0>=(c[f+16>>2]|0)>>>0}else{r=0}if((r&1|0)!=0){h=k;c[i+12>>2]=h;c[e+8>>2]=h;c[k+8>>2]=i;c[k+12>>2]=e;c[k+24>>2]=0;break}else{au()}}}while(0)}else{e=f+4|0;c[e>>2]=c[e>>2]|1<<n;c[j>>2]=k;c[k+24>>2]=j;j=k;c[k+12>>2]=j;c[k+8>>2]=j}}return}function ev(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function ew(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function ex(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function ey(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;while((e|0)<(d|0)){a[b+e|0]=f?0:a[c+e|0]|0;f=f?1:(a[c+e|0]|0)==0;e=e+1|0}return b|0}function ez(){return a6()|0}function eA(a,b,c){a=a|0;b=b|0;c=+c;br[a&63](b|0,+c)}function eB(a,b){a=a|0;b=+b;ad(0,a|0,+b)}function eC(a,b){a=a|0;b=+b;ad(1,a|0,+b)}function eD(a,b){a=a|0;b=+b;ad(2,a|0,+b)}function eE(a,b){a=a|0;b=+b;ad(3,a|0,+b)}function eF(a,b){a=a|0;b=+b;ad(4,a|0,+b)}function eG(a,b){a=a|0;b=+b;ad(5,a|0,+b)}function eH(a,b){a=a|0;b=+b;ad(6,a|0,+b)}function eI(a,b){a=a|0;b=+b;ad(7,a|0,+b)}function eJ(a,b){a=a|0;b=+b;ad(8,a|0,+b)}function eK(a,b){a=a|0;b=+b;ad(9,a|0,+b)}function eL(a,b){a=a|0;b=+b;ad(10,a|0,+b)}function eM(a,b){a=a|0;b=+b;ad(11,a|0,+b)}function eN(a,b){a=a|0;b=+b;ad(12,a|0,+b)}function eO(a,b){a=a|0;b=+b;ad(13,a|0,+b)}function eP(a,b){a=a|0;b=+b;ad(14,a|0,+b)}function eQ(a,b){a=a|0;b=+b;ad(15,a|0,+b)}function eR(a){a=a|0;return bs[a&63]()|0}function eS(){return ad(0)|0}function eT(){return ad(1)|0}function eU(){return ad(2)|0}function eV(){return ad(3)|0}function eW(){return ad(4)|0}function eX(){return ad(5)|0}function eY(){return ad(6)|0}function eZ(){return ad(7)|0}function e_(){return ad(8)|0}function e$(){return ad(9)|0}function e0(){return ad(10)|0}function e1(){return ad(11)|0}function e2(){return ad(12)|0}function e3(){return ad(13)|0}function e4(){return ad(14)|0}function e5(){return ad(15)|0}function e6(a,b){a=a|0;b=b|0;bt[a&63](b|0)}function e7(a){a=a|0;ad(0,a|0)}function e8(a){a=a|0;ad(1,a|0)}function e9(a){a=a|0;ad(2,a|0)}function fa(a){a=a|0;ad(3,a|0)}function fb(a){a=a|0;ad(4,a|0)}function fc(a){a=a|0;ad(5,a|0)}function fd(a){a=a|0;ad(6,a|0)}function fe(a){a=a|0;ad(7,a|0)}function ff(a){a=a|0;ad(8,a|0)}function fg(a){a=a|0;ad(9,a|0)}function fh(a){a=a|0;ad(10,a|0)}function fi(a){a=a|0;ad(11,a|0)}function fj(a){a=a|0;ad(12,a|0)}function fk(a){a=a|0;ad(13,a|0)}function fl(a){a=a|0;ad(14,a|0)}function fm(a){a=a|0;ad(15,a|0)}function fn(a,b,c){a=a|0;b=b|0;c=c|0;bu[a&63](b|0,c|0)}function fo(a,b){a=a|0;b=b|0;ad(0,a|0,b|0)}function fp(a,b){a=a|0;b=b|0;ad(1,a|0,b|0)}function fq(a,b){a=a|0;b=b|0;ad(2,a|0,b|0)}function fr(a,b){a=a|0;b=b|0;ad(3,a|0,b|0)}function fs(a,b){a=a|0;b=b|0;ad(4,a|0,b|0)}function ft(a,b){a=a|0;b=b|0;ad(5,a|0,b|0)}function fu(a,b){a=a|0;b=b|0;ad(6,a|0,b|0)}function fv(a,b){a=a|0;b=b|0;ad(7,a|0,b|0)}function fw(a,b){a=a|0;b=b|0;ad(8,a|0,b|0)}function fx(a,b){a=a|0;b=b|0;ad(9,a|0,b|0)}function fy(a,b){a=a|0;b=b|0;ad(10,a|0,b|0)}function fz(a,b){a=a|0;b=b|0;ad(11,a|0,b|0)}function fA(a,b){a=a|0;b=b|0;ad(12,a|0,b|0)}function fB(a,b){a=a|0;b=b|0;ad(13,a|0,b|0)}function fC(a,b){a=a|0;b=b|0;ad(14,a|0,b|0)}function fD(a,b){a=a|0;b=b|0;ad(15,a|0,b|0)}function fE(a,b){a=a|0;b=b|0;return bv[a&127](b|0)|0}function fF(a){a=a|0;return ad(0,a|0)|0}function fG(a){a=a|0;return ad(1,a|0)|0}function fH(a){a=a|0;return ad(2,a|0)|0}function fI(a){a=a|0;return ad(3,a|0)|0}function fJ(a){a=a|0;return ad(4,a|0)|0}function fK(a){a=a|0;return ad(5,a|0)|0}function fL(a){a=a|0;return ad(6,a|0)|0}function fM(a){a=a|0;return ad(7,a|0)|0}function fN(a){a=a|0;return ad(8,a|0)|0}function fO(a){a=a|0;return ad(9,a|0)|0}function fP(a){a=a|0;return ad(10,a|0)|0}function fQ(a){a=a|0;return ad(11,a|0)|0}function fR(a){a=a|0;return ad(12,a|0)|0}function fS(a){a=a|0;return ad(13,a|0)|0}function fT(a){a=a|0;return ad(14,a|0)|0}function fU(a){a=a|0;return ad(15,a|0)|0}function fV(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;bw[a&63](b|0,c|0,d|0)}function fW(a,b,c){a=a|0;b=b|0;c=c|0;ad(0,a|0,b|0,c|0)}function fX(a,b,c){a=a|0;b=b|0;c=c|0;ad(1,a|0,b|0,c|0)}function fY(a,b,c){a=a|0;b=b|0;c=c|0;ad(2,a|0,b|0,c|0)}function fZ(a,b,c){a=a|0;b=b|0;c=c|0;ad(3,a|0,b|0,c|0)}function f_(a,b,c){a=a|0;b=b|0;c=c|0;ad(4,a|0,b|0,c|0)}function f$(a,b,c){a=a|0;b=b|0;c=c|0;ad(5,a|0,b|0,c|0)}function f0(a,b,c){a=a|0;b=b|0;c=c|0;ad(6,a|0,b|0,c|0)}function f1(a,b,c){a=a|0;b=b|0;c=c|0;ad(7,a|0,b|0,c|0)}function f2(a,b,c){a=a|0;b=b|0;c=c|0;ad(8,a|0,b|0,c|0)}function f3(a,b,c){a=a|0;b=b|0;c=c|0;ad(9,a|0,b|0,c|0)}function f4(a,b,c){a=a|0;b=b|0;c=c|0;ad(10,a|0,b|0,c|0)}function f5(a,b,c){a=a|0;b=b|0;c=c|0;ad(11,a|0,b|0,c|0)}function f6(a,b,c){a=a|0;b=b|0;c=c|0;ad(12,a|0,b|0,c|0)}function f7(a,b,c){a=a|0;b=b|0;c=c|0;ad(13,a|0,b|0,c|0)}function f8(a,b,c){a=a|0;b=b|0;c=c|0;ad(14,a|0,b|0,c|0)}function f9(a,b,c){a=a|0;b=b|0;c=c|0;ad(15,a|0,b|0,c|0)}function ga(a){a=a|0;bx[a&63]()}function gb(){ad(0)}function gc(){ad(1)}function gd(){ad(2)}function ge(){ad(3)}function gf(){ad(4)}function gg(){ad(5)}function gh(){ad(6)}function gi(){ad(7)}function gj(){ad(8)}function gk(){ad(9)}function gl(){ad(10)}function gm(){ad(11)}function gn(){ad(12)}function go(){ad(13)}function gp(){ad(14)}function gq(){ad(15)}function gr(a,b,c){a=a|0;b=b|0;c=c|0;return by[a&63](b|0,c|0)|0}function gs(a,b){a=a|0;b=b|0;return ad(0,a|0,b|0)|0}function gt(a,b){a=a|0;b=b|0;return ad(1,a|0,b|0)|0}function gu(a,b){a=a|0;b=b|0;return ad(2,a|0,b|0)|0}function gv(a,b){a=a|0;b=b|0;return ad(3,a|0,b|0)|0}function gw(a,b){a=a|0;b=b|0;return ad(4,a|0,b|0)|0}function gx(a,b){a=a|0;b=b|0;return ad(5,a|0,b|0)|0}function gy(a,b){a=a|0;b=b|0;return ad(6,a|0,b|0)|0}function gz(a,b){a=a|0;b=b|0;return ad(7,a|0,b|0)|0}function gA(a,b){a=a|0;b=b|0;return ad(8,a|0,b|0)|0}function gB(a,b){a=a|0;b=b|0;return ad(9,a|0,b|0)|0}function gC(a,b){a=a|0;b=b|0;return ad(10,a|0,b|0)|0}function gD(a,b){a=a|0;b=b|0;return ad(11,a|0,b|0)|0}function gE(a,b){a=a|0;b=b|0;return ad(12,a|0,b|0)|0}function gF(a,b){a=a|0;b=b|0;return ad(13,a|0,b|0)|0}function gG(a,b){a=a|0;b=b|0;return ad(14,a|0,b|0)|0}function gH(a,b){a=a|0;b=b|0;return ad(15,a|0,b|0)|0}function gI(a,b){a=a|0;b=+b;_(0)}function gJ(){_(1);return 0}function gK(a){a=a|0;_(2)}function gL(a,b){a=a|0;b=b|0;_(3)}function gM(a){a=a|0;_(4);return 0}function gN(a,b,c){a=a|0;b=b|0;c=c|0;_(5)}function gO(){_(6)}function gP(a,b){a=a|0;b=b|0;_(7);return 0}
// EMSCRIPTEN_END_FUNCS
var br=[gI,gI,eB,gI,eC,gI,eD,gI,eE,gI,eF,gI,eG,gI,eH,gI,eI,gI,eJ,gI,eK,gI,eL,gI,eM,gI,eN,gI,eO,gI,eP,gI,eQ,gI,b7,gI,cj,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI,gI];var bs=[gJ,gJ,eS,gJ,eT,gJ,eU,gJ,eV,gJ,eW,gJ,eX,gJ,eY,gJ,eZ,gJ,e_,gJ,e$,gJ,e0,gJ,e1,gJ,e2,gJ,e3,gJ,e4,gJ,e5,gJ,ez,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ,gJ];var bt=[gK,gK,e7,gK,e8,gK,e9,gK,fa,gK,fb,gK,fc,gK,fd,gK,fe,gK,ff,gK,fg,gK,fh,gK,fi,gK,fj,gK,fk,gK,fl,gK,fm,gK,b$,gK,cG,gK,co,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK,gK];var bu=[gL,gL,fo,gL,fp,gL,fq,gL,fr,gL,fs,gL,ft,gL,fu,gL,fv,gL,fw,gL,fx,gL,fy,gL,fz,gL,fA,gL,fB,gL,fC,gL,fD,gL,dC,gL,bV,gL,b4,gL,cQ,gL,db,gL,dP,gL,dj,gL,dB,gL,bW,gL,c_,gL,gL,gL,gL,gL,gL,gL,gL,gL,gL,gL];var bv=[gM,gM,fF,gM,fG,gM,fH,gM,fI,gM,fJ,gM,fK,gM,fL,gM,fM,gM,fN,gM,fO,gM,fP,gM,fQ,gM,fR,gM,fS,gM,fT,gM,fU,gM,bY,gM,ck,gM,bX,gM,dW,gM,bT,gM,cf,gM,ea,gM,ee,gM,cl,gM,dM,gM,c7,gM,c6,gM,d_,gM,ct,gM,cD,gM,b8,gM,cq,gM,dy,gM,cu,gM,dO,gM,b1,gM,ec,gM,dr,gM,dV,gM,bU,gM,ds,gM,b0,gM,cC,gM,b9,gM,dz,gM,cp,gM,dI,gM,b5,gM,dT,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM,gM];var bw=[gN,gN,fW,gN,fX,gN,fY,gN,fZ,gN,f_,gN,f$,gN,f0,gN,f1,gN,f2,gN,f3,gN,f4,gN,f5,gN,f6,gN,f7,gN,f8,gN,f9,gN,cJ,gN,dA,gN,cw,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN,gN];var bx=[gO,gO,gb,gO,gc,gO,gd,gO,ge,gO,gf,gO,gg,gO,gh,gO,gi,gO,gj,gO,gk,gO,gl,gO,gm,gO,gn,gO,go,gO,gp,gO,gq,gO,dc,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO,gO];var by=[gP,gP,gs,gP,gt,gP,gu,gP,gv,gP,gw,gP,gx,gP,gy,gP,gz,gP,gA,gP,gB,gP,gC,gP,gD,gP,gE,gP,gF,gP,gG,gP,gH,gP,bQ,gP,dF,gP,ch,gP,cg,gP,bP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP,gP];return{_strlen:ex,_free:ek,_main:c2,_setSpaceLeaperVisitedCallback:cV,_pauseSpaceLeaper:cS,_strncpy:ey,_memset:ev,_malloc:eg,_resumeSpaceLeaper:cT,_memcpy:ew,_calloc:em,_setSpaceLeaperResourceCallback:cW,_setSpaceLeaperEndCallback:cU,stackAlloc:bz,stackSave:bA,stackRestore:bB,setThrew:bC,setTempRet0:bF,setTempRet1:bG,setTempRet2:bH,setTempRet3:bI,setTempRet4:bJ,setTempRet5:bK,setTempRet6:bL,setTempRet7:bM,setTempRet8:bN,setTempRet9:bO,dynCall_vif:eA,dynCall_i:eR,dynCall_vi:e6,dynCall_vii:fn,dynCall_ii:fE,dynCall_viii:fV,dynCall_v:ga,dynCall_iii:gr}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "jsCall": jsCall, "invoke_vif": invoke_vif, "invoke_i": invoke_i, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_llvm_lifetime_end": _llvm_lifetime_end, "_rand": _rand, "_glUseProgram": _glUseProgram, "_glClearColor": _glClearColor, "_snprintf": _snprintf, "_glGetProgramiv": _glGetProgramiv, "_glVertexAttribPointer": _glVertexAttribPointer, "_glGetShaderInfoLog": _glGetShaderInfoLog, "_abort": _abort, "_fprintf": _fprintf, "_send": _send, "_glLinkProgram": _glLinkProgram, "_printf": _printf, "_glGetUniformLocation": _glGetUniformLocation, "___fpclassifyf": ___fpclassifyf, "_SDL_SetVideoMode": _SDL_SetVideoMode, "_fabs": _fabs, "_glDrawArrays": _glDrawArrays, "_fputc": _fputc, "_glEnable": _glEnable, "_llvm_stackrestore": _llvm_stackrestore, "_puts": _puts, "_llvm_lifetime_start": _llvm_lifetime_start, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_glClear": _glClear, "_sqrt": _sqrt, "_sqrtf": _sqrtf, "_write": _write, "_fputs": _fputs, "_glGenBuffers": _glGenBuffers, "_glEnableVertexAttribArray": _glEnableVertexAttribArray, "_glGetAttribLocation": _glGetAttribLocation, "_glBindBuffer": _glBindBuffer, "_exit": _exit, "_glAttachShader": _glAttachShader, "_glCompileShader": _glCompileShader, "_sin": _sin, "_glBlendFunc": _glBlendFunc, "_glCreateProgram": _glCreateProgram, "_sysconf": _sysconf, "_glBufferData": _glBufferData, "_fmax": _fmax, "_glViewport": _glViewport, "__reallyNegative": __reallyNegative, "__formatString": __formatString, "_SDL_GL_SetAttribute": _SDL_GL_SetAttribute, "_sprintf": _sprintf, "_SDL_GetTicks": _SDL_GetTicks, "_glShaderSource": _glShaderSource, "___assert_func": ___assert_func, "_glUniformMatrix4fv": _glUniformMatrix4fv, "_cos": _cos, "_pwrite": _pwrite, "_SDL_PollEvent": _SDL_PollEvent, "_sbrk": _sbrk, "_llvm_stacksave": _llvm_stacksave, "_SDL_Init": _SDL_Init, "_SDL_GetError": _SDL_GetError, "_emscripten_set_main_loop": _emscripten_set_main_loop, "___errno_location": ___errno_location, "_glDeleteBuffers": _glDeleteBuffers, "_atan2": _atan2, "_SDL_Quit": _SDL_Quit, "_fmin": _fmin, "_time": _time, "_glGetShaderiv": _glGetShaderiv, "__exit": __exit, "_glCreateShader": _glCreateShader, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _setSpaceLeaperVisitedCallback = Module["_setSpaceLeaperVisitedCallback"] = asm["_setSpaceLeaperVisitedCallback"];
var _pauseSpaceLeaper = Module["_pauseSpaceLeaper"] = asm["_pauseSpaceLeaper"];
var _strncpy = Module["_strncpy"] = asm["_strncpy"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _resumeSpaceLeaper = Module["_resumeSpaceLeaper"] = asm["_resumeSpaceLeaper"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _setSpaceLeaperResourceCallback = Module["_setSpaceLeaperResourceCallback"] = asm["_setSpaceLeaperResourceCallback"];
var _setSpaceLeaperEndCallback = Module["_setSpaceLeaperEndCallback"] = asm["_setSpaceLeaperEndCallback"];
var dynCall_vif = Module["dynCall_vif"] = asm["dynCall_vif"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
Module['callMain'] = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
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
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module['callMain'](args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
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
