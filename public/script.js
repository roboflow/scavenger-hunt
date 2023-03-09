// if user is on mobile resolution

function getWidth() {
    if (self.innerWidth) {
      return self.innerWidth;
    }
  
    if (document.documentElement && document.documentElement.clientWidth) {
      return document.documentElement.clientWidth;
    }
  
    if (document.body) {
      return document.body.clientWidth;
    }
  }

  function getHeight () {
    if (self.innerHeight) {
      return self.innerHeight;
    }
  
    if (document.documentElement && document.documentElement.clientHeight) {
      return document.documentElement.clientHeight;
    }
  
    if (document.body) {
      return document.body.clientHeight;
    }

  }
  
if (window.matchMedia("(max-width: 500px)").matches) {
  var width = window.innerWidth;
  // 50% of viewport
  var height = window.innerHeight; //* 0.5;
  // change canvas height
  document.getElementById("video_canvas").height = getHeight();
  document.getElementById("video_canvas").width = getWidth();
  // update styles

  document.getElementById("video_canvas").style.height = getHeight();
  document.getElementById("video_canvas").style.width = getWidth();
  // apply 75 px margin on top of video_canvas and video1
} else {
  var width = 640;
  var height = 480;
}

var all_predictions = [];
var found_all = false;

var color_choices = [
  "#C7FC00",
  "#FF00FF",
  "#8622FF",
  "#FE0056",
  "#00FFCE",
  "#FF8000",
  "#00B7EB",
  "#FFFF00",
  "#0E7AFE",
  "#FFABAB",
  "#0000FF",
  "#CCCCCC",
];

var current_model_name = "microsoft-coco";
const API_KEY = "rf_U7AD2Mxh39N7jQ3B6cP8xAyufLH3";
const CONFIDENCE_THRESHOLD = 0.7;
const CAMERA_ACCESS_URL =
  "https://uploads-ssl.webflow.com/5f6bc60e665f54545a1e52a5/63d40cd1de273045d359cf9a_camera-access2.png";
const LOADING_URL =
  "https://uploads-ssl.webflow.com/5f6bc60e665f54545a1e52a5/63d40cd2210b56e0e33593c7_loading-camera2.gif";
var current_model_version = 9;
var webcamLoop = false;
var bounding_box_colors = {};

// on pause-camera click, pause webcam

function pauseCamera() {
    if (!webcamLoop) {
        webcamInference();
    } else {
        webcamLoop = false;
        document.getElementById("video_canvas").style.display = "none";
        document.getElementById("webcam-predict").style.display = "none";
        document.getElementById("video1").style.display = "none";
        document.getElementById("disclaimer").style.display = "none";
        document.getElementById("pause-camera").innerHTML = "Start Camera";
    }
}

document.getElementById("pause-camera").addEventListener("click", pauseCamera);

function foundObject(object, canvas, x, y, w, h) {
  if (!to_find.includes(object)) {
    return;
  }

  fetch("/found", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object: object
    }),
  });

  var scavenger_id = "scavenger_" + object;
  var scavenger = document.getElementById(scavenger_id);
  scavenger.innerHTML = "✅ " + object;

  var toast = document.getElementById("toast");

  toast.innerHTML = "<p>Found " + object + " 🎉!</p>";

  toast.style.display = "block";

  // hide in 3 seconds
  setTimeout(function () {
    toast.style.display = "none";
  }, 3000);

  // remove item from user list
  for (var i = 0; i < to_find.length; i++) {
    if (to_find[i] == object) {
      to_find.splice(i, 1);
    }
  }

  if (to_find.length == 0) {
    var success = document.getElementById("completion_buttons");
    success.style.display = "block";
    const jsConfetti = new JSConfetti();
    jsConfetti.addConfetti();
    // hide inference widget
    document.getElementById("video_canvas").style.display = "none";
    webcamLoop = false;
    found_all = true;
    // hide video1
    document.getElementById("video1").style.display = "none";
  }

  var objects_identified_count = document.getElementById(
    "objects_identified_count"
);

objects_identified_count.innerHTML = parseInt(objects_identified_count.innerHTML) + 1;

  if (username == "") {
    document.getElementById("set_username").style.display = "block";
  }

  return;
}

if (
  localStorage.getItem("hide_desktop_message") == "true" &&
  window.innerWidth > 600
) {
  document.getElementById("desktop_message").style.display = "none";
}

function hideMobileMessage() {
  document.getElementById("desktop_message").style.display = "none";
  localStorage.setItem("hide_desktop_message", "true");
}

document
  .getElementById("webcam-predict")
  .addEventListener("click", function () {
    webcamInference();
    document.getElementById("pause-camera").style.display = "block";
    // hide play button
    // hide button
    document.getElementById("webcam-predict").style.display = "none";
  });

function setImageState(src, canvas = "picture_canvas") {
  var canvas = document.getElementById(canvas);
  var ctx = canvas.getContext("2d");
  var img = new Image();
  img.src = src;
  img.crossOrigin = "anonymous";
  img.style.width = canvas.width + "px";
  img.style.height = canvas.height + "px";
  img.style.maxWidth = width + "px";
    img.style.maxHeight = height + "px";
canvas.style.width = width + "px";
  img.height = canvas.height;
  img.width = canvas.width;
  img.onload = function () {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
}

function drawBoundingBoxes(
  predictions,
  canvas,
  ctx,
  scalingRatio,
  sx,
  sy,
  fromDetectAPI = false
) {
  for (var i = 0; i < predictions.length; i++) {
    var confidence = predictions[i].confidence;
    // var ctx = canvas.getContext("2d");
    ctx.scale(1, 1);

    if (predictions[i].class in bounding_box_colors) {
      ctx.strokeStyle = bounding_box_colors[predictions[i].class];
    } else {
      // random color
      var color =
        color_choices[Math.floor(Math.random() * color_choices.length)];
      ctx.strokeStyle = color;
      // remove color from choices
      color_choices.splice(color_choices.indexOf(color), 1);

      bounding_box_colors[predictions[i].class] = color;
    }

    var prediction = predictions[i];
    var x = prediction.bbox.x - prediction.bbox.width / 2;
    var y = prediction.bbox.y - prediction.bbox.height / 2;
    var width = prediction.bbox.width;
    var height = prediction.bbox.height;

    if (!fromDetectAPI) {
      x -= sx;
      y -= sy;

      x *= scalingRatio;
      y *= scalingRatio;
      width *= scalingRatio;
      height *= scalingRatio;
    }

    // if box is partially outside 640x480, clip it
    if (x < 0) {
      width += x;
      x = 0;
    }

    if (y < 0) {
      height += y;
      y = 0;
    }

    // if first prediction, double label size

    ctx.rect(x, y, width, width);

    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fill();

    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = "4";
    ctx.strokeRect(x, y, width, height);
    // put colored background on text
    var text = ctx.measureText(
      prediction.class + " " + Math.round(confidence * 100) + "%"
    );
    // if (i == 0) {
    //     text.width *= 2;
    // }

    // set x y fill text to be within canvas x y, even if x is outside
    // if (y < 0) {
    //     y = -40;
    // }
    if (y < 20) {
      y = 30;
    }

    // make sure label doesn't leave canvas

    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(x - 2, y - 30, text.width + 4, 30);
    // use monospace font
    ctx.font = "15px monospace";
    // use black text
    ctx.fillStyle = "black";

    ctx.fillText(
      prediction.class + " " + Math.round(confidence * 100) + "%",
      x,
      y - 10
    );
  }
}

function drawBbox(canvas, ctx, video) {
  ctx.beginPath();
  var [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, scalingRatio] =
    getCoordinates(video);
//   ctx.drawImage(video, 0, 0, width, height, 0, 0, width, height);
  drawBoundingBoxes(all_predictions, video, ctx, scalingRatio, sx, sy);
}

function processFrame (predictions, canvas, ctx, model, no_detection_count) {
        if (predictions.length > 0) {
          all_predictions = predictions;
        }

        if (no_detection_count > 2) {
          all_predictions = predictions;
          no_detection_count = 0;
        }

        if (predictions.length == 0) {
          no_detection_count += 1;
        }

        for (var i = 0; i < predictions.length; i++) {
          // if in user_list
          var class_name = predictions[i]["class"].toLowerCase();

          var x = predictions[i].bbox.x - predictions[i].bbox.width / 2;
          var y = predictions[i].bbox.y - predictions[i].bbox.height / 2;
          var width = predictions[i].bbox.width;
          var height = predictions[i].bbox.height;

          if (user_list.includes(class_name)) {
            foundObject(class_name, canvas, x, y, width, height);
          } else if (
            class_name == "person" &&
            user_list.includes("friend")
          ) {
            foundObject("friend", canvas, x, y, width, height);
          }
        }
      ;

      return no_detection_count;
}

var model = null;
var video = null;
var canvas_painted = false;
var canvas = document.getElementById("video_canvas");

var ctx = canvas.getContext("2d");
var no_detection_count = 0;

function detectFrame() {
    if (!model) return requestAnimationFrame(detectFrame);
    // clear canvas
    if (!canvas_painted) {
        console.log("painting canvas 1");
        var video_start = document.getElementById("video1");
        canvas.style.width = video_start.width + "px";
        canvas.style.height = video_start.height + "px";
        canvas.width = video_start.width;
        canvas.height = video_start.height;
        canvas.top = video_start.top;
        canvas.left = video_start.left;
        canvas.style.top = video_start.top + "px";
        canvas.style.left = video_start.left + "px";
        canvas.style.position = "absolute";
        video_start.style.display = "block";
        canvas.style.display = "absolute";
        canvas_painted = true;
    }

    if (webcamLoop) {
    model.detect(video).then(function (predictions) {
        requestAnimationFrame(detectFrame);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBbox(canvas, ctx, video);
            no_detection_count = processFrame(predictions, canvas, ctx, model, no_detection_count);
        });
    } else {
        return true;
    }
}

function webcamInference() {
  setImageState(LOADING_URL, "video_canvas");
  webcamLoop = true;
  var disclaimer = document.getElementById("disclaimer");
  disclaimer.style.display = "none";
  document.getElementById("video_canvas").style.display = "block";

  if (
    document.getElementById("video1") &&
    document.getElementById("video1").style
  ) {
    document.getElementById("video1").style.display = "block";
  } else {
    navigator.mediaDevices
      // not user facing camera
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(function (stream) {
        // change to front-facing camera
        video = document.createElement("video");
        video.srcObject = stream;
        video.id = "video1";
        // hide video
        video.style.display = "none";
        video.setAttribute("playsinline", "");

        // add after canvas
        document.getElementById("video_canvas").after(video);

        var canvas = document.getElementById("video_canvas");
        var ctx = canvas.getContext("2d");

        video.onloadedmetadata = function () {
            video.play();
            setImageState(LOADING_URL, "video_canvas");
        }
        // on full load
        video.onplay = function () {
            height = video.videoHeight;
            width = video.videoWidth;
    
            video.setAttribute("width", width);
            video.setAttribute("height", height);
            video.style.width = width + "px";
            video.style.height = height + "px";

            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            canvas.width = width;
            canvas.height = height;
            
            roboflow
              .auth({
                publishable_key: API_KEY,
              })
              .load({
                model: current_model_name,
                version: current_model_version,
              })
              .then(function (m) {
                model = m;
                // images must have confidence > 0.7 to be returned by the model
                m.configure({ threshold: CONFIDENCE_THRESHOLD });
                var result = detectFrame();

                if (result) {
                    m.teardown();
                    // disable webcam
                    stream.getTracks().forEach(function (track) {
                        track.stop();
                        });
                }
              })
              .catch(function (err) {
                setImageState(CAMERA_ACCESS_URL, "video_canvas");
              });
        };

        ctx.scale(1, 1);
      })
      .catch(function (err) {
        alert("Camera access was not granted.");
    });
  }
}

function getCoordinates(img) {
  var dx = 0;
  var dy = 0;
  var dWidth = width;
  var dHeight = height;

  var sy;
  var sx;
  var sWidth = 0;
  var sHeight = 0;

  var imageWidth = img.width;
  var imageHeight = img.height;

  const canvasRatio = dWidth / dHeight;
  const imageRatio = imageWidth / imageHeight;

  // scenario 1 - image is more vertical than canvas
  if (canvasRatio >= imageRatio) {
    var sx = 0;
    var sWidth = imageWidth;
    var sHeight = sWidth / canvasRatio;
    var sy = (imageHeight - sHeight) / 2;
  } else {
    // scenario 2 - image is more horizontal than canvas
    var sy = 0;
    var sHeight = imageHeight;
    var sWidth = sHeight * canvasRatio;
    var sx = (imageWidth - sWidth) / 2;
  }

  var scalingRatio = dWidth / sWidth;

  if (scalingRatio == Infinity) {
    scalingRatio = 1;
  }

  return [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, scalingRatio];
}
