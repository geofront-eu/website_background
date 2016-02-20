/**
 * Reads a GeoCast text file on the local webserver via AJAX
 * @param {filePath} The local path to the text file to be read
 * @param {callback} A callback function which accepts the text as input parameter
 * @return {void}
 *
 * Example usage:
 *
 *     <img id="debug-img" />
 *
 *     var callback = function (output) {
 *        // do something with output..
 *     };
 *     var res = readGeoCastFile("textfile.txt", callback);
 */
function readGeoCastFile(filePath, callback) {
  var rawFile = new XMLHttpRequest();  
  rawFile.open("GET", filePath, true);
  rawFile.overrideMimeType('text/plain');
  rawFile.onreadystatechange = function () {
    if(rawFile.readyState === 4) {
      if(rawFile.status === 200 || rawFile.status == 0) {
        var content = rawFile.responseText;
        var geoCastObj = parseGeoCastContent(content);
        callback(geoCastObj);
      }
    }
  }
  rawFile.send();
}

/**
 * Parse the contents of a GeoCast file and returns a GeoCast object similar to the following
 *
 *  geoCastObject = {
 *    version = "1.5";
 *    cameraType = "DynamicCamera";
 *    cameraPosition = [1.2, 3.4, 0.22];
 *    viewSlice_FODAngle = 145.0;
 *    viewSlice_Size = 100.0;
 *    // Row-major
 *    modelviewMatrix = [1.0, 0.0, 0.0, 0.0,
 *                       0.0, 1.0, 0.0, 0.0,
 *                       0.0, 0.0, 1.0, 0.0,
 *                       0.0, 0.0, 0.0, 1.0];
 *    ------ varying part -------
 *    dataProject = "Ortho";
 *    windowSize = [12.0, 43.2];
 *    projRange = [0.10, 200.0];
 *    ---------------------------
 *    dataProject = "Perspective";
 *    Fovy = 45.0; (degrees)
 *    Aspect = 1.0;
 *    ClipRange = [1.0, 200.0];
 *    --- end of varying part ---
 *    
 *    *optional* worldSpaceDepth = true;
 *    ZDataRange = [0.0, 100.0];
 *  }
 *
 * @param {content} The string content of the GeoCast file
 * @return {object} The GeoCast object
 */

function parseGeoCastContent(content) {
  var output = {};
  var arrayOfLines = content.split("\n");
  var i = 0;

  var skipCommentLines = function(index) {
    var patt = /^\s*#.*/g;    
    while(patt.test(arrayOfLines[index]))
      ++index;
    return index;
  };

  // Check signature
  i = skipCommentLines(i);
  var patt = /GeoCast V(\d+\.\d+)/g;
  var res = patt.exec(arrayOfLines[i++].trim());
  if (!res) {
    alert("Not a GeoCast file");
    return;
  }
  output.version = res[1];

  var cameraType = arrayOfLines[i++].trim();
  if (cameraType != "DynamicCamera" && cameraType != "StaticCamera") {
    alert("Unrecognized camera type");
    return;
  }
  output.cameraType = cameraType;

  // Pos
  i = skipCommentLines(i);
  var parts = arrayOfLines[i++].trim().split(' ');
  if (parts[0] != "Pos") {
    alert("Unrecognized camera position");
    return;
  }
  var cameraPosition = [];
  cameraPosition.push(parseFloat(parts[1]));
  cameraPosition.push(parseFloat(parts[2]));
  cameraPosition.push(parseFloat(parts[3]));
  output.cameraPosition = cameraPosition;

  // ViewSlice
  i = skipCommentLines(i);
  parts = arrayOfLines[i++].trim().split(' ');
  if (parts[0] != "ViewSlice") {
    alert("Unrecognized ViewSlice tag");
    return;
  }
  output.viewSlice_FODAngle = parseFloat(parts[2]);
  output.viewSlice_Size = parseFloat(parts[4]);

  // ModelviewMatrix
  i = skipCommentLines(i);
  if (arrayOfLines[i++].trim() != "ModelviewMatrix") {
    alert("Unrecognized MVM type");
    return;
  }
  output.modelviewMatrix = [];
  var readMatrixRow = function(line) {
    parts = line.trim().split(' ');
    output.modelviewMatrix.push(parseFloat(parts[0]));
    output.modelviewMatrix.push(parseFloat(parts[1]));
    output.modelviewMatrix.push(parseFloat(parts[2]));
    output.modelviewMatrix.push(parseFloat(parts[3]));
  };
  for (var j = 0; j < 4; j++) {
    readMatrixRow(arrayOfLines[i++]);
  }

  // DataProject
  i = skipCommentLines(i);
  parts = arrayOfLines[i++].trim().split(' ');
  if (parts[0] != "DataProject") {
    alert("Unrecognized DataProject tag");
    return;
  }
  output.dataProject = parts[1];
  if (output.dataProject == "Ortho") {
    if (parts[2] != "WindowSize") {
      alert("Unrecognized WindowSize tag");
      return;
    }
    output.windowSize = [parseFloat(parts[3]), parseFloat(parts[4])];
    if (parts[5] != "ProjRange") {
      alert("Unrecognized ProjRange tag");
      return;
    }
    output.projRange = [parseFloat(parts[6]), parseFloat(parts[7])];
  } else if (output.dataProject == "Perspective") {
    if (parts[2] != "Fovy") {
      alert("Unrecognized Fovy tag");
      return;
    }
    output.Fovy = parseFloat(parts[3]);
    if (parts[4] != "Aspect") {
      alert("Unrecognized Aspect tag");
      return;
    }
    output.Aspect = parseFloat(parts[5]);
    if (parts[6] != "ClipRange") {
      alert("Unrecognized ClipRange tag");
      return;
    }
    output.ClipRange = [parseFloat(parts[7]), parseFloat(parts[8])];    
  } else {
    alert("Unrecognized DataProject camera type");
    return;
  }

  // WorldSpaceDepth - optional
  output.worldSpaceDepth = false;
  i = skipCommentLines(i);
  var line = arrayOfLines[i].trim();
  if (line == "WorldSpaceDepth") {
    output.worldSpaceDepth = true;
    ++i;
  }

  // ZDataRange
  parts = arrayOfLines[i].trim().split(' ');
  if (parts[0] != "ZDataRange") {
    alert("Unrecognized ZDataRange tag");
    return;
  }
  output.ZDataRange = [parseFloat(parts[1]), parseFloat(parts[2])];

  return output;
}