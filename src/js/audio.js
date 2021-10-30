var filter;
var src;
var dataArray;
var analyser;
var context;

var soundScale = [0,0,0]

var bassBuffer;
var midBuffer;
var highBuffer;

window.onload = function () {
    bassBuffer = new Queue(5)
    midBuffer = new Queue(5)
    highBuffer = new Queue(5)

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
        console.log("CRIOOUUUUUUUU")
        context = new AudioContext();
        initAnaliser();
    } else {
        analyser.getByteFrequencyData(dataArray);

        valBass = sumArrayFromTo(dataArray, 1, 3)
        valMid = sumArrayFromTo(dataArray, 200, 300)
        valHigh = sumArrayFromTo(dataArray, 480, 511)

        bassBuffer.enqueue(valBass);
        midBuffer.enqueue(valMid)
        highBuffer.enqueue(valHigh)

        valBassAvg = bassBuffer.avg()
        valMidAvg = midBuffer.avg()
        valHighAvg = highBuffer.avg()

        soundScale[0] = ((valBass - valBassAvg) > 0 ? (valBass - valBassAvg) : 0)/25
        soundScale[1] = ((valMid - valMidAvg) > 0 ? (valMid - valMidAvg) : 0)/700
        soundScale[2] =  ((valHigh - valHighAvg) > 0 ? (valHigh - valHighAvg) : 0)/100
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
        console.log(bufferLength);
        dataArray = new Uint8Array(bufferLength);

        src.connect(analyser);
        analyser.connect(context.destination);
    }
}
