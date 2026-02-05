const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const alertBox = document.getElementById("alertBox");
const startBtn = document.getElementById("startBtn");
const ctx = canvas.getContext("2d");

// Create a log container in HTML dynamically
const logContainer = document.createElement("div");
logContainer.id = "logContainer";
logContainer.style.maxHeight = "200px";
logContainer.style.overflowY = "auto";
logContainer.style.background = "#222";
logContainer.style.color = "#fff";
logContainer.style.padding = "10px";
logContainer.style.marginTop = "20px";
document.body.appendChild(logContainer);

let objectModel, poseModel;

// Suspicious objects
const suspiciousObjects = ["person", "cell phone", "bag", "backpack", "knife", "gun"];

// Pose smoothing
const poseHistory = [];
const maxHistory = 5;
const minSuspiciousFrames = 3;

// Movement tracking for running/loitering
let lastNoseX = null;
let lastNoseY = null;
let movementHistory = [];

// Start camera
startBtn.addEventListener("click", () => {
    startBtn.disabled = true;
    loadModels();
});

// Load models
async function loadModels() {
    alert("Loading models. Please wait...");
    objectModel = await cocoSsd.load();
    poseModel = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
    );
    startVideo();
}

// Start webcam
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: false
        });
        video.srcObject = stream;
        video.style.display = "block";
        video.onloadedmetadata = () => {
            video.play();
            detectLoop();
        };
    } catch (err) {
        console.error("Camera error:", err);
        alert("Cannot access webcam.");
    }
}

// Play alert sound
function playAlert() {
    if (!alertBox.dataset.playing) {
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
        audio.play();
        alertBox.dataset.playing = true;
        setTimeout(() => alertBox.dataset.playing = false, 2000);
    }
}

// Analyze pose for suspicious activity
function analyzePose(pose) {
    if (!pose || !pose.keypoints) return null;
    const k = pose.keypoints;

    const nose = k.find(p => p.name === "nose");
    const leftHip = k.find(p => p.name === "left_hip");
    const rightHip = k.find(p => p.name === "right_hip");
    const leftWrist = k.find(p => p.name === "left_wrist");
    const rightWrist = k.find(p => p.name === "right_wrist");

    if (!nose || !leftHip || !rightHip) return null;
    if (nose.score < 0.7 || leftHip.score < 0.7 || rightHip.score < 0.7) return null;

    const hipY = (leftHip.y + rightHip.y) / 2;

    // Falling: nose significantly below hips
    const falling = nose.y - hipY > 50;

    // Raised hands
    const handsUp = leftWrist && rightWrist &&
        leftWrist.score > 0.7 && rightWrist.score > 0.7 &&
        leftWrist.y < nose.y && rightWrist.y < nose.y;

    // Movement analysis
    let running = false;
    let loitering = false;
    if (lastNoseX !== null && lastNoseY !== null) {
        const dx = Math.abs(nose.x - lastNoseX);
        const dy = Math.abs(nose.y - lastNoseY);
        const speed = Math.sqrt(dx*dx + dy*dy);

        movementHistory.push(speed);
        if (movementHistory.length > 10) movementHistory.shift();

        const avgSpeed = movementHistory.reduce((a,b)=>a+b,0)/movementHistory.length;

        if (avgSpeed > 10) running = true;
        if (avgSpeed < 2) loitering = true;
    }

    lastNoseX = nose.x;
    lastNoseY = nose.y;

    // Return an array of active suspicious activities
    const activities = [];
    if(falling) activities.push("Falling");
    if(handsUp) activities.push("Raised Hands");
    if(running) activities.push("Running");
    if(loitering) activities.push("Loitering");

    return activities.length > 0 ? activities : null;
}

// Smooth pose history
function updatePoseHistory(isSuspicious) {
    poseHistory.push(isSuspicious ? 1 : 0);
    if (poseHistory.length > maxHistory) poseHistory.shift();
    const sum = poseHistory.reduce((a,b)=>a+b,0);
    return sum >= minSuspiciousFrames;
}

// Log detection with timestamp
function logDetection(type) {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement("div");
    entry.textContent = `[${time}] Suspicious Activity Detected: ${type}`;
    logContainer.prepend(entry); // newest on top
}

// Main detection loop
async function detectLoop() {
    if (video.readyState < 2) {
        requestAnimationFrame(detectLoop);
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    let threatDetected = false;
    let detectedActivities = [];

    // Object detection
    try {
        const predictions = await objectModel.detect(video);
        predictions.forEach(pred => {
            if(pred.score < 0.75) return;
            const [x, y, w, h] = pred.bbox;
            ctx.strokeStyle = "lime";
            ctx.lineWidth = 2;
            ctx.strokeRect(x,y,w,h);
            ctx.fillStyle = "yellow";
            ctx.font = "16px Arial";
            ctx.fillText(`${pred.class} (${pred.score.toFixed(2)})`, x+5, y+20);

            if(suspiciousObjects.includes(pred.class)) {
                threatDetected = true;
                detectedActivities.push(`Suspicious Object: ${pred.class}`);
            }
        });
    } catch(err){ console.warn("Object detection failed:",err); }

    // Pose detection
    try {
        const poses = await poseModel.estimatePoses(video, { maxPoses:1 });
        poses.forEach(pose => {
            const activities = analyzePose(pose);
            if(activities && updatePoseHistory(true)) {
                threatDetected = true;
                detectedActivities.push(...activities);
            }

            // Draw keypoints
            pose.keypoints.forEach(kp => {
                if(kp.score > 0.7){
                    ctx.fillStyle="red";
                    ctx.beginPath();
                    ctx.arc(kp.x, kp.y,5,0,2*Math.PI);
                    ctx.fill();
                }
            });
        });
    } catch(err){ console.warn("Pose detection failed:",err); }

    // Show alert & log
    if(threatDetected){
        alertBox.style.display = "block";
        playAlert();
        detectedActivities.forEach(act => logDetection(act));
    } else {
        alertBox.style.display = "none";
    }

    requestAnimationFrame(detectLoop);
}
