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
  // Show loading spinner and text
  const loadingContainer = document.getElementById('loading-container');
  loadingContainer.style.display = 'flex';

  mobilenet.classify(imageElement, (error, results) => {
      // Hide loading spinner and text
      loadingContainer.style.display = 'none';

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
            };
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        alert("Only images are allowed.");
    }
}

// Reset the dropzone, image, and classification results
function reset() {
    const uploadedImageElement = document.getElementById('uploaded-image');
    uploadedImageElement.src = '';
    uploadedImageElement.style.display = 'none';
    classifyBtn.disabled = true;
    resetBtn.disabled = true;
    
    // Reset all bar charts
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
                  classifyBtn.disabled = false; // Enable classify button when an image is uploaded
                  resetBtn.disabled = false; // Enable reset button
                  
                  // If you want to classify and display results immediately after uploading, you can uncomment the line below
                  // classifyAndDisplayResults(uploadedImage, 'results7');
              };
              uploadedImage.src = e.target.result;
          };
          reader.readAsDataURL(file);
      } else {
          alert("Only images are allowed.");
      }
  }

  // Event listeners for file input and dropzone
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

  // Classify and display results immediately for images 1 to 6
  for (let i = 1; i <= 6; i++) {
      const imageElement = document.getElementById(`image${i}`);
      const canvasId = `results${i}`;
      classifyAndDisplayResults(imageElement, canvasId);
  }

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

