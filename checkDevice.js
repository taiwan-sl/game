// $.htmlPrefilter = function(html) {
//     return (html + '').replace(/ style=/gi, ' data-style=');
// };

if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    // Firefox 38+ seems having support of enumerateDevicesx
    navigator.enumerateDevices = function(callback) {
        navigator.mediaDevices.enumerateDevices().then(callback);
    };
}

var MediaDevices = [];
var isHTTPs = location.protocol === 'https:';
var canEnumerate = false;

if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
    canEnumerate = true;
} else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
    canEnumerate = true;
}

var hasMicrophone = false;
var hasSpeakers = false;
var hasWebcam = false;
var hasStorage = false;

var isMicrophoneAlreadyCaptured = false;
var isWebcamAlreadyCaptured = false;

function checkDeviceSupport(callback) {
    if (!canEnumerate) {
        return;
    }

    if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
        navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
    }

    if (!navigator.enumerateDevices && navigator.enumerateDevices) {
        navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator);
    }

    if (!navigator.enumerateDevices) {
        if (callback) {
            callback();
        }
        return;
    }

    MediaDevices = [];
    navigator.enumerateDevices(function(devices) {
        devices.forEach(function(_device) {
            var device = {};
            for (var d in _device) {
                device[d] = _device[d];
            }

            if (device.kind === 'audio') {
                device.kind = 'audioinput';
            }

            if (device.kind === 'video') {
                device.kind = 'videoinput';
            }

            var skip;
            MediaDevices.forEach(function(d) {
                if (d.id === device.id && d.kind === device.kind) {
                    skip = true;
                }
            });

            if (skip) {
                return;
            }

            if (!device.deviceId) {
                device.deviceId = device.id;
            }

            if (!device.id) {
                device.id = device.deviceId;
            }

            if (!device.label) {
                device.label = 'Please invoke getUserMedia once.';
                if (!isHTTPs) {
                    device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
                }
            } else {
                if (device.kind === 'videoinput' && !isWebcamAlreadyCaptured) {
                    isWebcamAlreadyCaptured = true;
                }

                if (device.kind === 'audioinput' && !isMicrophoneAlreadyCaptured) {
                    isMicrophoneAlreadyCaptured = true;
                }
            }

            if (device.kind === 'audioinput') {
                hasMicrophone = true;
            }

            if (device.kind === 'audiooutput') {
                hasSpeakers = true;
            }

            if (device.kind === 'videoinput') {
                hasWebcam = true;
            }

            // there is no 'videoouput' in the spec.

            MediaDevices.push(device);
        });
        //check storage
        if(typeof(localStorage) != "undefined"){
            hasStorage = true;
        }else{
            hasStorage = false;
        }

        if (callback) {
            callback();
        }
    });
}

// check for microphone/camera support!
// checkDeviceSupport(function() {
    // document.write('hasWebCam: ', hasWebcam, '<br>');
    // document.write('hasMicrophone: ', hasMicrophone, '<br>');
    // document.write('isMicrophoneAlreadyCaptured: ', isMicrophoneAlreadyCaptured, '<br>');
    // document.write('isWebcamAlreadyCaptured: ', isWebcamAlreadyCaptured, '<br>');
// });
checkDeviceSupport();

/*tracker*/
const isResucedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;
const isTrack = !isResucedMotion && !isTouch;
let mouseX = 0;
let mouseY = 0;
if (isTrack) {
    const ball = document.getElementById('ball');
 
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        ballAnimation();
    });
    function ballAnimation() {
        ball.style.setProperty("--mouseX", `${mouseX}px`);
        ball.style.setProperty("--mouseY", `${mouseY}px`);
        requestAnimationFrame(ballAnimation);
    }
   
}

//nav
$("body").on("keydown", (e) => {
  if (e.altKey && e.keyCode == 85) {//alt-u
    $("#aU")[0].focus();
  }
  if (e.altKey && e.keyCode == 67) {//alt-c
    //$(".hexcontainer div:first-child")[0].scrollIntoView({
    $("#AC")[0].scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    $("#btnClass").focus();
  }
  if (e.altKey && e.keyCode == 90) {//alt-z
    $("#aZ")[0].focus();
  }
});

//prevent the modal's attrib 'ari-hidden' been blocked
$(function(){
document.querySelectorAll('.modal').forEach((modalElement) => {
  modalElement.addEventListener('hide.bs.modal', () => {
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
});
})