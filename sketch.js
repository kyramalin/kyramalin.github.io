let mobilenet;
let classifyBtn;
let resetBtn;
let resultDiv;
let uploadedImage;
let barChart;
let selectedImage = null;

// Initialize the MobileNet model and bar chart
function initializeModelAndChart() {
    const options = { version: 1, alpha: 1.0, topk: 6 };
    mobilenet = ml5.imageClassifier('MobileNet', options, modelReady);
    
    const ctx = document.getElementById('results').getContext('2d');

    barChart = new Chart(ctx, {
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
}

// Callback when the MobileNet model is ready
function modelReady() {
    console.log('Model is ready!');
}

// Handle file selection through file input or drag-and-drop
function fileUpload(event) {
    const files = event.target.files || event.dataTransfer.files;
    const file = files[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Set the uploaded image and enable classify button
            uploadedImage = new Image();
            uploadedImage.onload = function() {
                document.getElementById('uploaded-image').src = e.target.result;
                document.getElementById('uploaded-image').style.display = "block";
                classifyBtn.disabled = false;
                resetBtn.disabled = false;
                selectedImage = uploadedImage;
            };
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        alert("Only images are allowed.");
    }
}

// Classify the selected image and display results
function classifyImage() {
    if (selectedImage) {
        mobilenet.classify(selectedImage, (error, results) => {
            if (error) {
                console.error(error);
                return;
            }
            // Display the classification result
            resultDiv.innerHTML = `Image classified as: ${results[0].label.split(',')[0]} (Confidence: ${(results[0].confidence * 100).toFixed(2)}%)`;

            // Update the bar chart with classification results
            updateChart(results);
        });
    }
}

// Update the bar chart with classification results
function updateChart(results) {
    const labels = results.map(result => result.label.split(',')[0]);
    const data = results.map(result => result.confidence);

    barChart.data.labels = labels;
    barChart.data.datasets[0].data = data;
    barChart.update();

    // Show the results bar chart
    document.getElementById("results").style.display = "block";
}

// Reset the dropzone, image, and classification result
function reset() {
    document.getElementById('uploaded-image').src = '';
    document.getElementById('uploaded-image').style.display = 'none';
    classifyBtn.disabled = true;
    resetBtn.disabled = true;
    resultDiv.innerHTML = '';
    selectedImage = null;
    // Clear bar chart data
    barChart.data.labels = [];
    barChart.data.datasets[0].data = [];
    barChart.update();
  //  document.getElementById('results').style.display = 'none';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the model and chart
    initializeModelAndChart();

    // Set up elements and event listeners
    classifyBtn = document.getElementById('classify-btn');
    resetBtn = document.getElementById('reset-btn');
    resultDiv = document.getElementById('result');

    // Handle file input
    const fileInput = document.getElementById('upload-link');
    fileInput.addEventListener('click', function() {
        const fileInputElement = document.createElement('input');
        fileInputElement.type = 'file';
        fileInputElement.accept = 'image/*';
        fileInputElement.onchange = fileUpload;
        fileInputElement.click();
    });

    // Drag-and-drop functionality
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

    // Classify button click
    classifyBtn.addEventListener('click', classifyImage);

    // Reset button click
    resetBtn.addEventListener('click', reset);
});

function selectImage(imageElement) {
  // Set the clicked image as the selected image
  selectedImage = new Image();
  selectedImage.onload = function() {
      // Display the selected image in the uploaded image element
      document.getElementById('uploaded-image').src = imageElement.src;
      document.getElementById('uploaded-image').style.display = "block";
      classifyBtn.disabled = false;
      resetBtn.disabled = false;
      
      // Trigger classification for the selected image
      classifyImage();
  };
  selectedImage.src = imageElement.src;
}

function selectImage(imageElement) {
  // Set the clicked image as the selected image
  selectedImage = new Image();
  selectedImage.onload = function() {
      // Display the selected image in the uploaded image element
      document.getElementById('uploaded-image').src = imageElement.src;
      document.getElementById('uploaded-image').style.display = "block";

      // Enable classify and reset buttons
      classifyBtn.disabled = false;
      resetBtn.disabled = false;

      // Classify the selected image
      classifyImage();
  };
  
  // Set the image source to the clicked image's source
  selectedImage.src = imageElement.src;
}
