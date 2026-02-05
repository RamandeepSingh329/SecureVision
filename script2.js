/**
 * OXYGENOS 16 - FLUID INTERACTION ENGINE
 * Version: 1.0
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const startBtn = document.querySelector('.start-btn');
    const statusText = document.querySelector('.output-status');
    const predictionBox = document.querySelector('.prediction-box');
    const cards = document.querySelectorAll('.label-card, .prediction-box, .camera-card');

    // --- 1. MAGNETIC SENSORY EFFECT ---
    // Elements tilt slightly based on cursor position for depth
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate tilt (subtle 2deg max)
        const moveX = (clientX - centerX) / centerX;
        const moveY = (clientY - centerY) / centerY;

        cards.forEach(card => {
            const speed = card.classList.contains('camera-card') ? 4 : 8;
            card.style.transform = `
                perspective(1000px) 
                rotateY(${moveX * speed}deg) 
                rotateX(${-moveY * speed}deg)
                translateY(${-moveY * 5}px)
            `;
        });
    });

    // --- 2. THE AQUAMORPHIC RIPPLE ---
    startBtn.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        this.appendChild(ripple);

        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        setTimeout(() => ripple.remove(), 700);
        
        // Pulse animation on click
        this.style.transform = 'scale(0.95)';
        setTimeout(() => this.style.transform = 'scale(1.02)', 100);
        
        initCamera(); // Start the system
    });

    // --- 3. CAMERA INITIALIZATION ---
    async function initCamera() {
        statusText.innerText = "Initializing System...";
        statusText.style.color = "var(--secondary-teal)";

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user", width: 1280, height: 720 } 
            });
            
            // If you are using a <video> element to feed a <canvas>
            // Replace 'canvas' logic here depending on your AI framework (TensorFlow, etc.)
            statusText.innerText = "System Active";
            showSystemAlert("Success", "Camera stream established successfully.");
        } catch (err) {
            statusText.innerText = "Access Denied";
            statusText.style.color = "#ff3b30";
            showSystemAlert("Error", "Camera permission was rejected.");
        }
    }

    // --- 4. DATA UPDATE SIMULATION ---
    // Call this function when your AI model gets a result
    window.updateDetections = function(label, confidence) {
        statusText.innerText = label;
        
        // Create a new prediction row with OxygenOS styling
        const row = document.createElement('div');
        row.innerHTML = `<span>${label}</span> <b>${Math.round(confidence * 100)}%</b>`;
        
        // Keep only top 4 predictions
        if (predictionBox.children.length > 3) {
            predictionBox.removeChild(predictionBox.lastChild);
        }
        
        predictionBox.prepend(row);
        
        // Add entrance animation for the new row
        row.style.animation = "oxygenEntrance 0.5s ease-out forwards";
    };

    // --- 5. SYSTEM ALERT LOGIC ---
    function showSystemAlert(title, message) {
        const alert = document.querySelector('.alert-popup');
        alert.querySelector('.alert-title').innerText = title;
        alert.querySelector('.alert-subtitle').innerText = message;
        
        alert.classList.add('show');
        setTimeout(() => alert.classList.remove('show'), 4000);
    }
});