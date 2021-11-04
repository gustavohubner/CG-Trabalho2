var filter;
var src;
var dataArray;
var analyser;
var context;

var soundScale = [0, 0, 0, 0]

var bassBuffer;
var midBuffer;
var highBuffer;
var allBuffer;

window.onload = function () {
    bassBuffer = new Queue(5)
    midBuffer = new Queue(5)
    highBuffer = new Queue(5)
    // allBuffer = new Queue(300)

    var file = document.getElementById("thefile");
    var audio = document.getElementById("audio");
    audio.load();
    file.onchange = function () {
        var files = this.files;
        audio.src = URL.createObjectURL(files[0]);
        audio.load();
    };

};

function updateAudioData() {
    if (!context) {
        context = new AudioContext();
        initAnaliser();
    } else {
        analyser.getByteFrequencyData(dataArray);

        valBass = sumArrayFromTo(dataArray, 1, 3) / 20
        valMid = sumArrayFromTo(dataArray, 200, 300) / 350
        valHigh = sumArrayFromTo(dataArray, 480, 511) / 45
        valAll = sumArrayFromTo(dataArray, 0, 511) / 51200

        bassBuffer.enqueue(valBass);
        midBuffer.enqueue(valMid)
        highBuffer.enqueue(valHigh)
        // allBuffer.enqueue(valAll)

        valBassAvg = bassBuffer.avg()
        valMidAvg = midBuffer.avg()
        valHighAvg = highBuffer.avg()
        // valAllAvg = allBuffer.avg() 


        soundScale[0] = lerp(soundScale[0], ((valBass - valBassAvg) > 0 ? (valBass - valBassAvg) : 0), 0.1)
        soundScale[1] = lerp(soundScale[1], ((valMid - valMidAvg) > 0 ? (valMid - valMidAvg) : 0), 0.1)
        soundScale[2] = lerp(soundScale[2], ((valHigh - valHighAvg) > 0 ? (valHigh - valHighAvg) : 0), 0.1)
        // soundScale[3] = ((valAll) - valAllAvg) > 0 ? ((valAll) - valAllAvg) : 0
        soundScale[3] = lerp(soundScale[3], valAll, 1)
        // console.log(soundScale)

    }
}

function initAnaliser() {
    if (context) {
        analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0

        src = context.createMediaElementSource(audio);
        analyser = context.createAnalyser();
        var bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        src.connect(analyser);
        analyser.connect(context.destination);
    }
}
