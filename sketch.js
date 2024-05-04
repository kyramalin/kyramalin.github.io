let mobilenet;
let classifyBtn;
let resetBtn;
let resultDiv;
let uploadedImage;
let barChart;
let selectedImage = null;
let barCharts = {};

// Initialize the MobileNet model and bar charts
function initializeModelAndChart() {
    const options = { version: 1, alpha: 1.0, topk: 6 };
    mobilenet = ml5.imageClassifier('MobileNet', options, modelReady);

    // Initialize six bar charts for each canvas (results1 to results6)
    for (let i = 1; i <= 6; i++) {
        const canvasId = `results${i}`;
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
    }
}

// Callback when the MobileNet model is ready
function modelReady() {
    console.log('Model is ready!');
}

// Classify the selected image and update the specified canvas with results
function classifyAndDisplayResults(imageElement, canvasId) {
    mobilenet.classify(imageElement, (error, results) => {
        if (error) {
            console.error(error);
            return;
        }

        // Display the classification result in the corresponding resultDiv
        document.getElementById(`result-${canvasId}`).innerHTML = 
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

// Function to classify an image and display results in the corresponding canvas
function classifyImage(imageElement, canvasId) {
    classifyAndDisplayResults(imageElement, canvasId);
}

// Event listeners for image selection and classification
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the model and charts
    initializeModelAndChart();

    // Event listeners for selecting and classifying images
    const imageIds = ['image1', 'image2', 'image3', 'image4', 'image5', 'image6'];

    imageIds.forEach((id, index) => {
        const imageElement = document.getElementById(id);
        const canvasId = `results${index + 1}`;

        imageElement.addEventListener('click', function() {
            classifyImage(imageElement, canvasId);
        });
    });
});

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
