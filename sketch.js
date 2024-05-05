let mobilenet;
let classifyBtn;
let resetBtn;
let uploadedImage;
let barCharts = {};
const canvasIDs = ['results1', 'results2', 'results3', 'results4', 'results5', 'results6', 'results7'];

// Initialize the MobileNet model and bar charts
function initializeModelAndChart() {
    const options = { version: 1, alpha: 1.0, topk: 6 };
    mobilenet = ml5.imageClassifier('MobileNet', options, () => classifyBtn.disabled = true);

    // Initialize bar charts for each canvas
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
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 159, 64, 1)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                legend: {
                    display: false
                },
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

// Function to toggle loading state
function setLoadingState(isLoading) {
    const loadingContainers = document.querySelectorAll('.loading-container');
    const containers = document.querySelectorAll('.correct, .incorrect');
  
    loadingContainers.forEach(container => {
        container.style.display = isLoading ? 'block' : 'none';
    });

    containers.forEach(container => {
        container.classList.toggle('no-background', isLoading);
    });
}

function handleFileUpload(event) {
    const files = event.target.files || event.dataTransfer.files;
    const file = files[0];
    classifyBtn.disabled = true;

    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onload = e => {
            uploadedImage = new Image();
            uploadedImage.onload = () => {
                const uploadedImageElement = document.getElementById('uploaded-image');
                const uploadedImageLabel = document.getElementById('uploaded-image-label');
                const noImageUploadedDiv = document.getElementById('no-image-uploaded');
                
                uploadedImageElement.src = e.target.result;
                uploadedImageElement.style.display = 'block';
                uploadedImageLabel.style.display = 'block';
                noImageUploadedDiv.style.display = 'none';
                
                classifyBtn.disabled = false;
                resetBtn.disabled = false;
            };
            uploadedImage.src = e.target.result;
        };

        reader.readAsDataURL(file);
    } else {
        alert('Only images are allowed.');
    }
}

// Function to classify an image and display results
function classifyAndDisplayResults(imageElement, canvasId) {
    setLoadingState(true);
    mobilenet.classify(imageElement, (error, results) => {
        setLoadingState(false);
        if (error) return;
        
        const resultDivId = `result${canvasId.replace('results', '')}`;
        const resultDiv = document.getElementById(resultDivId);
        
        if (resultDiv) {
            resultDiv.innerHTML = `Image classified as: ${results[0].label} (Confidence: ${(results[0].confidence * 100).toFixed(2)}%)`;
        }

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

// Function to reset the application state
function reset() {
    const uploadedImageElement = document.getElementById('uploaded-image');
    const noImageUploadedDiv = document.getElementById('no-image-uploaded');

    uploadedImageElement.src = '';
    uploadedImageElement.style.display = 'none';
    noImageUploadedDiv.style.display = 'block';
    
    // Keep the uploaded image label visible
    document.getElementById('uploaded-image-label').style.display = 'block';

    classifyBtn.disabled = true;
    resetBtn.disabled = true;

    // Reset all bar charts
    canvasIDs.forEach(canvasId => {
        const barChart = barCharts[canvasId];
        barChart.data.labels = [];
        barChart.data.datasets[0].data = [];
        barChart.update();
    });

    // Reset the result divs
    canvasIDs.forEach(canvasId => {
        const resultDivId = `result${canvasId.replace('results', '')}`;
        const resultDiv = document.getElementById(resultDivId);
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeModelAndChart();
    
    classifyBtn = document.getElementById('classify-btn');
    resetBtn = document.getElementById('reset-btn');
    
    classifyBtn.addEventListener('click', () => {
        if (uploadedImage) {
            classifyAndDisplayResults(uploadedImage, 'results7');
        }
    });

    const examplesBtn = document.getElementById('examples');
    examplesBtn.addEventListener('click', () => {
        for (let i = 1; i <= 6; i++) {
            const imageElement = document.getElementById(`image${i}`);
            const canvasId = `results${i}`;
            classifyAndDisplayResults(imageElement, canvasId);
        }
    });

    resetBtn.addEventListener('click', reset);

    document.getElementById('upload-link').addEventListener('click', () => {
        const fileInputElement = document.createElement('input');
        fileInputElement.type = 'file';
        fileInputElement.accept = 'image/*';
        fileInputElement.onchange = handleFileUpload;
        fileInputElement.click();
    });

    const dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = '#007BFF';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#cccccc';
    });

    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = '#cccccc';
        handleFileUpload(e);
    });

    // Add accordion functionality
    const accordions = document.getElementsByClassName('accordion');
    for (let accordion of accordions) {
        accordion.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
        });
    }
});
