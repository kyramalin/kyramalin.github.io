let mobilenet;
let classifyBtn;
let resetBtn;
let resultDiv;
let uploadedImage;
let barCharts = {};
let selectedImage = null;

// Array of canvas IDs for the six images and one for user-uploaded images
const canvasIDs = ['results1', 'results2', 'results3', 'results4', 'results5', 'results6', 'results7'];

// Initialize the MobileNet model and bar charts
function initializeModelAndChart() {
    const options = { version: 1, alpha: 1.0, topk: 6 };
    mobilenet = ml5.imageClassifier('MobileNet', options, modelReady);

    // Initialize a bar chart for each canvas ID
    canvasIDs.forEach(canvasId => {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        barCharts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Classes',
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
    });
}

// Callback when the MobileNet model is ready
function modelReady() {
    console.log('Model is ready!');
}

// Classify the selected image and display results in the specified canvas
function classifyAndDisplayResults(imageElement, canvasId) {
    mobilenet.classify(imageElement, (error, results) => {
        if (error) {
            console.error(error);
            return;
        }

        // Display the classification result in the result div for the specified canvas
        const resultDivId = `result-${canvasId}`;
        document.getElementById(resultDivId).innerHTML = 
            `Image classified as: ${results[0].label.split(',')[0]} (Confidence: ${(results[0].confidence * 100).toFixed(2)}%)`;

        // Update the bar chart in the specified canvas
        updateChart(results, canvasId);
    });
}

// Update the specified bar chart with classification results
function updateChart(results, canvasId) {
    const labels = results.map(result => result.label.split(',')[0]);
    const data = results.map(result => result.confidence);

    const barChart = barCharts[canvasId];
    barChart.data.labels = labels;
    barChart.data.datasets[0].data = data;
    barChart.update();
}

// Handle file upload and classify the uploaded image
function fileUpload(event) {
    const files = event.target.files || event.dataTransfer.files;
    const file = files[0];
    
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            uploadedImage = new Image();
            
            uploadedImage.onload = function() {
                document.getElementById('uploaded-image').src = e.target.result;
                document.getElementById('uploaded-image').style.display = "block";
                classifyBtn.disabled = false;
                resetBtn.disabled = false;
                
                // Classify the uploaded image and display results in the seventh canvas
                classifyAndDisplayResults(uploadedImage, 'results7');
            };
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        alert("Only images are allowed.");
    }
}

// Reset the dropzone, image, and classification result
function reset() {
    document.getElementById('uploaded-image').src = '';
    document.getElementById('uploaded-image').style.display = 'none';
    classifyBtn.disabled = true;
    resetBtn.disabled = true;
    selectedImage = null;

    // Reset bar chart data for all charts
    canvasIDs.forEach(canvasId => {
        const barChart = barCharts[canvasId];
        barChart.data.labels = [];
        barChart.data.datasets[0].data = [];
        barChart.update();
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the model and charts
    initializeModelAndChart();

    // Event listeners for file upload and classification buttons
    const fileInput = document.getElementById('upload-link');
    
    fileInput.addEventListener('click', function() {
        const fileInputElement = document.createElement('input');
        fileInputElement.type = 'file';
        fileInputElement.accept = 'image/*';
        fileInputElement.onchange = fileUpload;
        fileInputElement.click();
    });

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
        fileUpload(e);
    });

    // Event listeners for classify and reset buttons
    classifyBtn = document.getElementById('classify-btn');
    resetBtn = document.getElementById('reset-btn');
    
    classifyBtn.addEventListener('click', function() {
        classifyAndDisplayResults(selectedImage, 'results7');
    });

    resetBtn.addEventListener('click', reset);

    // Event listeners for the six images on the page
    const imageIds = ['image1', 'image2', 'image3', 'image4', 'image5', 'image6'];
    
    imageIds.forEach((id, index) => {
        const imageElement = document.getElementById(id);
        const canvasId = `results${index + 1}`;

        imageElement.addEventListener('click', function() {
            classifyAndDisplayResults(imageElement, canvasId);
        });
    });
});

var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.display === "block") {
      panel.style.display = "none";
    } else {
      panel.style.display = "block";
    }
  });
}

