/**
 * This is the preload script for the screen grabber
 * 
 */


const { contextBridge, ipcRenderer, desktopCapturer } = require("electron");

const temp = require("temp");
const os = require("os");
const fs = require("fs");
const fsPromises = fs.promises;
const asyncMutex = require("async-mutex").Mutex;

const mutex = new asyncMutex();

/** 
 * look for an element in the DOM and create it if it doesn't exist 
 */
var findOrCreate = function(type, screen_id) {
  const id = `${type}${screen_id}`;

  let el = document.getElementById(id);
  if ( el === null ) {
    el = document.createElement(type);
    el.id = id;
    
    document.body.appendChild(el);
  }
  
  return el;    
};

/**
 * Apply the video stream to the canvas. Return a context with a screenshot
 * 
 * @param {*} video 
 * @param {*} canvas 
 */
var applyVideoToCanvas = function(video, canvas) {
  const width = video.videoWidth;
  const height = video.videoHeight;

  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, width, height);

  return context;
};

/**
 * Given a media stream, take a screenshot and save it to a file
 * @param {*} video 
 */
var screenToFile = async function(video) {
  const tempName = temp.path({dir: os.tmpdir(), suffix:".png"});
  const canvas = findOrCreate("canvas", tempName);
  const context = applyVideoToCanvas(video, canvas);
  
  const data = canvas.toDataURL("image/png", 1.0);
  
  context.clearRect(0, 0, canvas.width, canvas.height);
    
  const buffer = Buffer.from(data.split(",")[1], "base64");
  await fsPromises.writeFile(tempName, buffer);

  canvas.remove();

  return tempName;
}; // screenToFile

/**
 * cleanup video/media stream
 * @param {*} video 
 * @param {*} s 
 */
var cleanup = function(video, s) {
  //
  // stop video capture
  // this seems to handle a problem where CPU load spikes
  // after capture
  //
  if ( s !== undefined ) {
    s.getVideoTracks().forEach((track) => {
      track.stop();
    });
  }
  
  // https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video
  video.pause();
  video.src = "";
  video.load();
  video.remove();
};

/**
 * capture the screen
 * @param {*} id ID of the screen to capture
 * @param {*} width 
 * @param {*} height 
 */
var captureScreen = async function(id, width, height) {
  const screen_opts = {
    audio: false,
    video: {
      mandatory: {
        // fun fact -- you need to use max here
        // @see https://groups.google.com/a/chromium.org/forum/#!topic/chromium-apps/TP_rsnYVQWg
        maxWidth: width,
        maxHeight: height,
        chromeMediaSource: "desktop"
      }
    }
  };
  
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 0, height: 0 }
  });

  let screen = sources.find((s) => { return s.display_id.toString() === id.toString(); });
  if ( ! screen ) {
    screen = sources[0];
  }
  screen_opts.video.mandatory.chromeMediaSourceId = screen.id;

 
  
  const video = findOrCreate("video", id);

  // adding muted helps with some security errors
  // @see https://stackoverflow.com/questions/49930680/
  // how-to-handle-uncaught-in-promise-domexception-play-failed-because-the-use
  video.muted = "muted";
  
  const mediaStream = await navigator.mediaDevices.getUserMedia(screen_opts);
  video.srcObject = mediaStream;

  await video.play();
  
  const result = await screenToFile(video, mediaStream);

  cleanup(video, mediaStream);

  return result;
}; // captureScreen


contextBridge.exposeInMainWorld(
  "grabber",
  {
    init: () => {
      ipcRenderer.on("request-screenshot", async (_event, opts) => {
        const release = await mutex.acquire();
        try {
          const result = await captureScreen(opts.id, opts.width, opts.height);
          ipcRenderer.send("screenshot-" + opts.id, {url:result});
        }
        finally {
          release();
        }
      });
    }
  }
);
