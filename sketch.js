let mobilenet;
let classifyBtn;
let resetBtn;
let resultClickedDiv;
let resultUploadedDiv;
let clickedImageChart;
let uploadedImageChart;
let selectedImageClicked = null;
let selectedImageUploaded = null;

// Initialize the MobileNet model and bar charts
function initializeModelAndCharts() {
    const options = { version: 1, alpha: 1.0, topk: 6 };
    mobilenet = ml5.imageClassifier('MobileNet', options, modelReady);

    // Create chart for clicked images
    const ctxClicked = document.getElementById('results-clicked').getContext('2d');
    clickedImageChart = new Chart(ctxClicked, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Confidence',
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            legend: { display: false },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 1,
                    title: {
                        display: true,
                        text: 'Confidence'
                    }
                }
            }
        }
    });

    // Create chart for uploaded images
    const ctxUploaded = document.getElementById('results-uploaded').getContext('2d');
    uploadedImageChart = new Chart(ctxUploaded, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Confidence',
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            legend: { display: false },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 1,
                    title: {
                        display: true,
                        text: 'Confidence'
                    }
                }
            }
        }
    });
}

// Callback when the MobileNet model is ready
function modelReady() {
    console.log('Model is ready!');
}

// Handle file change and classify uploaded image
function handleFileChange(event) {
    const files = event.target.files || event.dataTransfer.files;
    const file = files[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            selectedImageUploaded = new Image();
            selectedImageUploaded.onload = function() {
                classifyUploadedImage();
            };
            selectedImageUploaded.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        alert("Only images are allowed.");
    }
}

// Classify the uploaded image and display results
function classifyUploadedImage() {
    if (selectedImageUploaded) {
        mobilenet.classify(selectedImageUploaded, (error, results) => {
            if (error) {
                console.error(error);
                return;
            }
            
            // Display results for uploaded image
            resultUploadedDiv.innerHTML = `Image classified as: ${results[0].label.split(',')[0]} (Confidence: ${(results[0].confidence * 100).toFixed(2)}%)`;
            
            // Update the uploaded image chart
            updateUploadedChart(results);
        });
    }
}

// Classify clicked image and display results
function classifyClickedImage(imageElement) {
    selectedImageClicked = new Image();
    selectedImageClicked.src = imageElement.src;

    selectedImageClicked.onload = function() {
        mobilenet.classify(selectedImageClicked, (error, results) => {
            if (error) {
                console.error(error);
                return;
            }
            
            // Display results for clicked image
            resultClickedDiv.innerHTML = `Image classified as: ${results[0].label.split(',')[0]} (Confidence: ${(results[0].confidence * 100).toFixed(2)}%)`;
            
            // Update the clicked image chart
            updateClickedChart(results);
        });
    };
}

// Update chart for clicked images
function updateClickedChart(results) {
    const labels = results.map(result => result.label.split(',')[0]);
    const data = results.map(result => result.confidence);

    clickedImageChart.data.labels = labels;
    clickedImageChart.data.datasets[0].data = data;
    clickedImageChart.update();
}

// Update chart for uploaded images
function updateUploadedChart(results) {
    const labels = results.map(result => result.label.split(',')[0]);
    const data = results.map(result => result.confidence);

    uploadedImageChart.data.labels = labels;
    uploadedImageChart.data.datasets[0].data = data;
    uploadedImageChart.update();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the model and charts
    initializeModelAndCharts();

    // Set up result containers
    resultClickedDiv = document.getElementById('result-clicked');
    resultUploadedDiv = document.getElementById('result-uploaded');

    // Set up file input handler
    const fileInput = document.getElementById('upload-link');
    fileInput.addEventListener('click', function() {
        const fileInputElement = document.createElement('input');
        fileInputElement.type = 'file';
        fileInputElement.accept = 'image/*';
        fileInputElement.onchange = handleFileChange;
        fileInputElement.click();
    });

    // Set up dropzone
    const dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = '#007BFF';
    });

    dropzone.addEventListener('dragleave', function() {
        dropzone.style.borderColor = '#cccccc';
    });

    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = '#cccccc';
        handleFileChange(e);
    });
});
