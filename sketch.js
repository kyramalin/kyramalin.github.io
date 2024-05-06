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
                       'rgba(100,149,237, 0.2)',
                        'rgba(95,158,160, 0.2)',
                        'rgba(70,130,180, 0.2)',
                        'rgba(65,105,225, 0.2)',
                        'rgba(60,179,113, 0.2)',
                        'rgba(60,179,113, 0.2)',
                        'rgba(189,183,107, 0.2)',
                    ],
                    borderColor: [
                        'rgba(100,149,237, 1)',
                        'rgba(95,158,160, 1)',
                        'rgba(70,130,180, 1)',
                        'rgba(65,105,225, 1)',
                        'rgba(60,179,113, 1)',
                        'rgba(60,179,113, 1)',
                        'rgba(189,183,107, 1)',
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
                        suggestedMax: 100,
                        title: {
                            display: true,
                            text: 'Confidence (%)'
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
  // Reset the uploaded image display and other UI elements
  const uploadedImageElement = document.getElementById('uploaded-image');
  const noImageUploadedDiv = document.getElementById('no-image-uploaded');
  const noImageClassifiedDiv = document.getElementById('no-image-classified');

  // Clear the uploaded image
  uploadedImageElement.src = '';
  uploadedImageElement.style.display = 'none';

  // Display the "no image uploaded" and "no image classified" divs
  noImageUploadedDiv.style.display = 'block';
  if (noImageClassifiedDiv) {
      noImageClassifiedDiv.style.display = 'block';
  }
  
  // Keep the uploaded image label visible
  document.getElementById('uploaded-image-label').style.display = 'block';

  // Disable classify and reset buttons
  classifyBtn.disabled = true;
  resetBtn.disabled = true;
  
//Reset bar chart for custom upload
if(barCharts["results7"]) {
  barCharts["results7"].data.labels = [];
  barCharts["results7"].data.datasets[0].data = [];
  barCharts["results7"].update();
}

//Reset result div for custom upload
const resultDiv = document.getElementById("result7");
if(resultDiv) {
  resultDiv.innerHTML = ''; // Clear the inner HTML of the result div
}
}


document.addEventListener('DOMContentLoaded', function() {
  initializeModelAndChart();

  classifyBtn = document.getElementById('classify-btn');
  resetBtn = document.getElementById('reset-btn');

  classifyBtn.addEventListener('click', () => {
      if (uploadedImage) {
          // Remove the "no-image-classified" div when classify button is clicked
          const noImageClassifiedDiv = document.getElementById('no-image-classified');
          if (noImageClassifiedDiv) {
              noImageClassifiedDiv.style.display = 'none';
          }

          classifyAndDisplayResults(uploadedImage, 'results7');
      }
  });

  // Automatically classify and display results for each image when the document is loaded
  for (let i = 1; i <= 6; i++) {
      const imageElement = document.getElementById(`image${i}`);
      const canvasId = `results${i}`;
      classifyAndDisplayResults(imageElement, canvasId);
  }

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
