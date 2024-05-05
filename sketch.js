let mobilenet;
let classifyBtn;
let resetBtn;
let uploadedImage;
let barCharts = {};
const canvasIDs = ['results1', 'results2', 'results3', 'results4', 'results5', 'results6', 'results7'];

// Initialize the MobileNet model and bar charts
function initializeModelAndChart() {
    const options = { version: 1, alpha: 1.0, topk: 6 };
    mobilenet = ml5.imageClassifier('MobileNet', options, modelReady);

    // Initialize bar charts for each canvas
    canvasIDs.forEach((canvasId) => {
        const ctx = document.getElementById(canvasId);
        
        if (!ctx) {
            console.error(`Canvas element with ID '${canvasId}' not found.`);
            return;
        }

        const chartContext = ctx.getContext('2d');
        if (!chartContext) {
            console.error(`Context for canvas ID '${canvasId}' not found.`);
            return;
        }

        barCharts[canvasId] = new Chart(chartContext, {
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
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 159, 64, 1)'
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

// Callback when the MobileNet model is ready
function modelReady() {
    console.log('Model is ready!');
    // Disable classify button initially until an image is uploaded
    classifyBtn.disabled = true;
}

function classifyAndDisplayResults(imageElement, canvasId) {
  if (!mobilenet) {
      console.error('MobileNet model is not ready yet.');
      return;
  }
  mobilenet.classify(imageElement, (error, results) => {
      if (error) {
          console.error(error);
          return;
      }
        // Find the appropriate result div
        const resultDivId = `result${canvasId.replace('results', '')}`;
        const resultDiv = document.getElementById(resultDivId);
        if (resultDiv) {
            resultDiv.innerHTML = `Image classified as: ${results[0].label} (Confidence: ${(results[0].confidence * 100).toFixed(2)}%)`;
        } else {
            console.error(`Could not find result div with ID: ${resultDivId}`);
        }

        // Update the bar chart in the specified canvas
        updateChart(results, canvasId);
    });
}

// Update the specified bar chart with classification results
function updateChart(results, canvasId) {
    const labels = results.map(result => result.label.split(',')[0]);
    const data = results.map(result => result.confidence);

    const barChart = barCharts[canvasId];
    if (barChart) {
        barChart.data.labels = labels;
        barChart.data.datasets[0].data = data;
        barChart.update();
    } else {
        console.error(`Could not find bar chart with ID: ${canvasId}`);
    }
}

// Handle file upload and classify the uploaded image
function handleFileUpload(event) {
    const files = event.target.files || event.dataTransfer.files;
    const file = files[0];
    
    // Ensure the classify button is disabled until the image is uploaded and loaded
    classifyBtn.disabled = true;

    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        
        reader.onload = function (e) {
            uploadedImage = new Image();
            uploadedImage.onload = function () {
                const uploadedImageElement = document.getElementById('uploaded-image');
                const uploadedImageLabel = document.getElementById('uploaded-image-label'); // Get the label element
                
                // Log the elements to check if they are null
                console.log('Uploaded image element:', uploadedImageElement);
                console.log('Uploaded image label:', uploadedImageLabel);

                if (uploadedImageElement && uploadedImageLabel) {
                    uploadedImageElement.src = e.target.result;
                    uploadedImageElement.style.display = "block";
                    uploadedImageLabel.style.display = "block"; // Show the label
                    // Enable classify button once image is loaded
                    classifyBtn.disabled = false;
                    resetBtn.disabled = false;
                } else {
                    console.error('Either uploaded image element or label is missing.');
                }
            };
            uploadedImage.src = e.target.result;
        };

        reader.readAsDataURL(file);
    } else {
        alert("Only images are allowed.");
    }
}

function reset() {
    const uploadedImageElement = document.getElementById('uploaded-image');
    const uploadedImageLabel = document.getElementById('uploaded-image-label');

    // Hide the uploaded image and label
    if (uploadedImageElement) {
        uploadedImageElement.src = '';
        uploadedImageElement.style.display = 'none';
    }
    if (uploadedImageLabel) {
        uploadedImageLabel.style.display = 'none';
    }
    
    // Disable classify and reset buttons
    classifyBtn.disabled = true;
    resetBtn.disabled = true;

    // Reset all bar charts
    canvasIDs.forEach(canvasId => {
        const barChart = barCharts[canvasId];
        if (barChart) {
            barChart.data.labels = [];
            barChart.data.datasets[0].data = [];
            barChart.update();
        } else {
            console.error(`Bar chart with ID '${canvasId}' not found.`);
        }
    });

    // Reset the result divs
    canvasIDs.forEach(canvasId => {
        const resultDivId = `result${canvasId.replace('results', '')}`;
        const resultDiv = document.getElementById(resultDivId);
        if (resultDiv) {
            resultDiv.innerHTML = ''; // Clear the inner HTML of the result div
        } else {
            console.error(`Result div with ID '${resultDivId}' not found.`);
        }
    });
}


// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the model and charts
    initializeModelAndChart();

    // Get classify and reset buttons
    classifyBtn = document.getElementById('classify-btn');
    resetBtn = document.getElementById('reset-btn');
    
    // Event listener for classify button
    classifyBtn.addEventListener('click', function() {
        if (uploadedImage) {
            // Classify the uploaded image and display results in the seventh canvas
            classifyAndDisplayResults(uploadedImage, 'results7');
        } else {
            console.error('No uploaded image to classify.');
        }
    });

    // Event listener for reset button
    resetBtn.addEventListener('click', reset);

    // Event listener for file upload
    const fileInput = document.getElementById('upload-link');
    fileInput.addEventListener('click', function() {
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

    dropzone.addEventListener('dragleave', function() {
        dropzone.style.borderColor = '#cccccc';
    });

    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = '#cccccc';
        handleFileUpload(e);
    });

    // Event listener for the examples button
    const examplesBtn = document.getElementById('examples');
    examplesBtn.addEventListener('click', function() {
        // Load images onto canvas 1 to 6 when the button is clicked
        for (let i = 1; i <= 6; i++) {
            const imageElement = document.getElementById(`image${i}`);
            const canvasId = `results${i}`;
            classifyAndDisplayResults(imageElement, canvasId);
        }
    });

    // Add accordion functionality
    const accordions = document.getElementsByClassName("accordion");
    for (let i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener('click', function() {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
        });
    }
});
