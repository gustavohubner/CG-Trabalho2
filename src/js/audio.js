var analyser;
var filter;
var src;

var scale = 1

window.onload = function () {

    var file = document.getElementById("thefile");
    var audio = document.getElementById("audio");

    file.onchange = function () {
        var files = this.files;
        audio.src = URL.createObjectURL(files[0]);
        audio.load();
        audio.play();
        var context = new AudioContext();
        src = context.createMediaElementSource(audio);
        analyser = context.createAnalyser();

        var canvas = document.getElementById("canvas2");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight/2;
        var ctx = canvas.getContext("2d");

        src.connect(analyser);
        analyser.connect(context.destination);

        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6

        var bufferLength = analyser.frequencyBinCount;
        console.log(bufferLength);

        var dataArray = new Uint8Array(bufferLength);

        var WIDTH = canvas.width;
        var HEIGHT = canvas.height;

        var barWidth = (WIDTH / bufferLength) * 2.5;
        var barHeight;
        var x = 0;

        function renderFrame() {
            requestAnimationFrame(renderFrame);

            x = 20;
            var i = 2
            analyser.getByteFrequencyData(dataArray);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            scale = dataArray[2];

              for (var i = 0; i < bufferLength; i++) {                
                barHeight = dataArray[i];

                var r = barHeight + (25 * (i / bufferLength));
                var g = 250 * (i / bufferLength);
                var b = 50;

                ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
                ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

                x += barWidth + 1;
             }
        }

        audio.play();
        renderFrame();
    };
};