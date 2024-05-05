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
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
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

// Function to toggle loading state
function setLoadingState(isLoading) {
  // Get all loading container elements
  const loadingContainers = document.querySelectorAll('.loading-container');
  
  // Get all correct and incorrect containers
  const containers = document.querySelectorAll('.correct, .incorrect');
  
  // Iterate over all loading containers and set their display based on the loading state
  loadingContainers.forEach(container => {
      if (isLoading) {
          container.style.display = 'block'; // Show loading spinner
      } else {
          container.style.display = 'none'; // Hide loading spinner
      }
  });

  // Iterate over all correct and incorrect containers
  containers.forEach(container => {
      if (isLoading) {
          container.classList.add('no-background'); // Hide background and border while loading
      } else {
          container.classList.remove('no-background'); // Show background and border after loading
      }
  });
}


// Function to show the loading message and spinner
function showLoading() {
  const loadingSpinner = document.querySelector('.loading-container');
  if (loadingSpinner) {
      loadingSpinner.style.display = 'block';
  }
}

// Function to hide the loading message and spinner
function hideLoading() {
  const loadingSpinner = document.querySelector('.loading-container');
  if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
  }
}


// Function to classify an image and display results
function classifyAndDisplayResults(imageElement, canvasId) {
    // Set loading state to active
    setLoadingState(true);

    mobilenet.classify(imageElement, (error, results) => {
        // Set loading state to inactive
        setLoadingState(false);

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
                const uploadedImageLabel = document.getElementById('uploaded-image-label');
                
                if (uploadedImageElement && uploadedImageLabel) {
                    uploadedImageElement.src = e.target.result;
                    uploadedImageElement.style.display = 'block';
                    uploadedImageLabel.style.display = 'block';
                    
                    // Enable classify button once image is loaded
                    classifyBtn.disabled = false;
                    resetBtn.disabled = false;
                }
            };
            uploadedImage.src = e.target.result;
        };

        reader.readAsDataURL(file);
    } else {
        alert('Only images are allowed.');
    }
}

// Function to reset the application state
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
        }
    });

    // Reset the result divs
    canvasIDs.forEach(canvasId => {
        const resultDivId = `result${canvasId.replace('results', '')}`;
        const resultDiv = document.getElementById(resultDivId);
        if (resultDiv) {
            resultDiv.innerHTML = ''; // Clear the inner HTML of the result div
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

    // Event listener for examples button
    const examplesBtn = document.getElementById('examples');
    examplesBtn.addEventListener('click', function() {
        // Load images onto canvas 1 to 6 when the button is clicked
        for (let i = 1; i <= 6; i++) {
            const imageElement = document.getElementById(`image${i}`);
            const canvasId = `results${i}`;
            classifyAndDisplayResults(imageElement, canvasId);
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

    // Event listeners for dropzone
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

    // Add accordion functionality
    const accordions = document.getElementsByClassName('accordion');
    for (let i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
        });
    }
});
