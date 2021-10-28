var context = new AudioContext();
var analyser = context.createAnalyser();
var filter;
var src;
var dataArray;

window.onload = function () {

    var file = document.getElementById("thefile");
    var audio = document.getElementById("audio");
    // var files = this.files;
    // audio.src = URL.createObjectURL(files[0]);
    audio.load();

    // var WIDTH = canvas.width;
    // var HEIGHT = canvas.height;

    // var barWidth = (WIDTH / bufferLength) * 2.5;
    // var barHeight;
    // var x = 0;
    file.onchange = function () {
        var files = this.files;
        audio.src = URL.createObjectURL(files[0]);
        audio.load();
    };

};

function updateAudioData() {
    analyser.getByteFrequencyData(dataArray);
}

function initAnaliser() {
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6

    src = context.createMediaElementSource(audio);
    analyser = context.createAnalyser();
    var bufferLength = analyser.frequencyBinCount;
    console.log(bufferLength);
    dataArray = new Uint8Array(bufferLength);

    src.connect(analyser);
    analyser.connect(context.destination);
}