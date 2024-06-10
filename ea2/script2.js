// Generiere Daten und füge Rauschen hinzu
function generateData(N, noiseVariance) {
  let data = [];
  let noise = tf.randomNormal([N], 0, Math.sqrt(noiseVariance)).arraySync();
  for (let i = 0; i < N; i++) {
      let x = Math.random() * 4 - 2; // Werte im Bereich [-2, 2]
      let y = calculateFunctionResult(x);
      data.push({ x: x, y: y + noise[i] });
  }
  return data;
}

function splitData(data) {
  tf.util.shuffle(data);
  let trainData = data.slice(0, Math.floor(data.length / 2));
  let testData = data.slice(Math.floor(data.length / 2));
  return { trainData, testData };
}

function calculateFunctionResult(x) {
  return 0.5 * (x + 0.8) * (x + 1.8) * (x - 0.2) * (x - 0.3) * (x - 1.9) + 1;
}

function createModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [1], units: 100, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 100, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));
  return model;
}

async function trainModel(model, data, epochs) {
  const xs = tf.tensor2d(data.map(d => d.x), [data.length, 1]);
  const ys = tf.tensor2d(data.map(d => d.y), [data.length, 1]);
  await model.fit(xs, ys, { epochs, shuffle: true });
}

function evaluateModel(model, data) {
  const xs = tf.tensor2d(data.map(d => d.x), [data.length, 1]);
  const ys = tf.tensor2d(data.map(d => d.y), [data.length, 1]);
  const preds = model.predict(xs);
  return preds.sub(ys).square().mean().dataSync()[0];
}

function getModelParameters(model) {
  let parameters = [];
  model.layers.forEach(layer => {
    let layerParams = layer.getWeights().map(w => w.arraySync());
    parameters.push(layerParams);
  });
  return parameters;
}

function plotData(id, trainData, testData, title) {
  const trainValues = trainData.map(d => ({ x: d.x, y: d.y }));
  const testValues = testData.map(d => ({ x: d.x, y: d.y }));
  tfvis.render.scatterplot(
      document.getElementById(id),
      { values: [trainValues, testValues], series: ['Trainingsdaten', 'Testdaten'] },
      { 
          xLabel: 'x', 
          yLabel: 'y', 
          height: 300, 
          title,
          seriesColors: ['#5ca9fa', 'green'],
          style: { backgroundColor: '#1e1f21' } // Explicitly set the colors for the series
      }
  );
}

function showSpinner(id, message) {
  // Erstelle den Spinner
  const spinner = document.createElement('div');
  spinner.classList.add('spinner');
  document.getElementById(id).appendChild(spinner);

  // Füge die Ladebenachrichtigung hinzu
  const loadingMessage = document.createElement('div');
  loadingMessage.textContent = message;
  document.getElementById(id).appendChild(loadingMessage);
}

// Funktion, um den Lade-Spinner auszublenden
function hideSpinner(id) {
  const spinner = document.getElementById(id).getElementsByClassName('spinner')[0];
  if (spinner) {
    spinner.remove();
  }
}

// Aufruf von showSpinner, bevor ein Plot geladen wird
showSpinner('resultPlotTrainUnraus', 'Daten werden geladen...');
showSpinner('trainDataPlotRaus','Daten werden geladen...');
showSpinner('trainDataPlotUnraus','Daten werden geladen...');
showSpinner('resultPlotTestUnraus','Daten werden geladen...');
showSpinner('resultPlotTrainBestFit','Daten werden geladen...');
showSpinner('resultPlotTestBestFit','Daten werden geladen...');
showSpinner('resultPlotTrainOverFit','Daten werden geladen...');
showSpinner('resultPlotTestOverFit','Daten werden geladen...');

// Plot-Funktionen anpassen, um hideSpinner aufzurufen, sobald der Plot geladen ist
async function plotPredictions(id, model, data, title, color) {
  // Show spinner
  showSpinner(id);

  const xs = data.map(d => d.x);
  const ys = model.predict(tf.tensor2d(xs, [xs.length, 1])).arraySync();
  const values = xs.map((x, i) => ({ x: x, y: ys[i][0] }));
  tfvis.render.scatterplot(
      document.getElementById(id),
      { values, series: ['Vorhersagen'] },
      { 
        xLabel: 'x', 
        yLabel: 'y', 
        height: 300, 
        title, 
        seriesColors: [color], 
        style: { backgroundColor: '#1e1f21' } 
      }
  );

  // Hide spinner once the plot is loaded
  hideSpinner(id);
}

function plotLossAndInfo(id, loss, title, noise, optimizer, epochs, lossFn) {
  const noiseInfo = noise ? `Yes (Variance ${noise})` : "No";
  document.getElementById(id).innerHTML = `
  <div style="padding-top: 10px; font-size: 14px;">
    ${title}Loss: ${loss.toFixed(4)}<br>
    Gaussian Noise:  ${noiseInfo}<br>
    Optimizer:  ${optimizer}<br>
    Epochs: ${epochs}<br>
    Loss Function:  ${lossFn}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const N = 100;
  const noiseVariance = 0.05;

  // Unverrauschte Daten generieren und aufteilen
  const dataUnraus = generateData(N, 0);
  const { trainData: trainDataUnraus, testData: testDataUnraus } = splitData(dataUnraus);

  // Verrauschte Daten generieren und aufteilen
  const dataRaus = generateData(N, noiseVariance);
  const { trainData: trainDataRaus, testData: testDataRaus } = splitData(dataRaus);

  // Visualisiere die Datensätze
  plotData('trainDataPlotUnraus', trainDataUnraus, testDataUnraus, 'Unverrauschte Trainings- und Testdaten');
  plotData('trainDataPlotRaus', trainDataRaus, testDataRaus, 'Verrauschte Trainings- und Testdaten');

  const optimizer = 'adam';
  const lossFn = 'meanSquaredError';

  // Modell für unverrauschte Daten trainieren
  let modelUnraus = createModel();
  modelUnraus.compile({ optimizer: tf.train.adam(0.01), loss: lossFn });
  const epochsUnraus = 100;
  await trainModel(modelUnraus, trainDataUnraus, epochsUnraus);

  // Modell auf Testdaten evaluieren
  let lossTrainUnraus = evaluateModel(modelUnraus, trainDataUnraus);
  let lossTestUnraus = evaluateModel(modelUnraus, testDataUnraus);
  
  // Visualisierung der Vorhersagen
  plotPredictions('resultPlotTrainUnraus', modelUnraus, trainDataUnraus, 'Unverrauschte Vorhersagen auf Trainingsdaten', '#5ca9fa');
  plotPredictions('resultPlotTestUnraus', modelUnraus, testDataUnraus, 'Unverrauschte Vorhersagen auf Testdaten', 'green');
  plotLossAndInfo('lossTrainUnraus', lossTrainUnraus, 'Train', 0, optimizer, epochsUnraus, lossFn);
  plotLossAndInfo('lossTestUnraus', lossTestUnraus, 'Test', 0, optimizer, epochsUnraus, lossFn);

  // Modell für verrauschte Daten (Best-Fit) trainieren
  let modelBestFit = createModel();
  modelBestFit.compile({ optimizer: tf.train.adam(0.01), loss: lossFn });
  const epochsBestFit = 100;
  await trainModel(modelBestFit, trainDataRaus, epochsBestFit);

  // Modell auf Testdaten evaluieren
  let lossTrainBestFit = evaluateModel(modelBestFit, trainDataRaus);
  let lossTestBestFit = evaluateModel(modelBestFit, testDataRaus);
  
  // Visualisierung der Vorhersagen
  plotPredictions('resultPlotTrainBestFit', modelBestFit, trainDataRaus, 'Best-Fit Vorhersagen auf Trainingsdaten', '#5ca9fa');
  plotPredictions('resultPlotTestBestFit', modelBestFit, testDataRaus, 'Best-Fit Vorhersagen auf Testdaten', 'green');
  plotLossAndInfo('lossTrainBestFit', lossTrainBestFit, 'Train', noiseVariance, optimizer, epochsBestFit, lossFn);
  plotLossAndInfo('lossTestBestFit', lossTestBestFit, 'Test', noiseVariance, optimizer, epochsBestFit, lossFn);

  // Modell für verrauschte Daten (Overfit) trainieren
  let modelOverFit = createModel();
  modelOverFit.compile({ optimizer: tf.train.adam(0.01), loss: lossFn });
  const epochsOverFit = 800;  // Übermäßiges Training für Overfitting
  await trainModel(modelOverFit, trainDataRaus, epochsOverFit);

  // Modell auf Testdaten evaluieren
  let lossTrainOverFit = evaluateModel(modelOverFit, trainDataRaus);
  let lossTestOverFit = evaluateModel(modelOverFit, testDataRaus);
  
  // Visualisierung der Vorhersagen
  plotPredictions('resultPlotTrainOverFit', modelOverFit, trainDataRaus, 'Overfit Vorhersagen auf Trainingsdaten', '#5ca9fa');
  plotPredictions('resultPlotTestOverFit', modelOverFit, testDataRaus, 'Overfit Vorhersagen auf Testdaten', 'green');
  plotLossAndInfo('lossTrainOverFit', lossTrainOverFit, 'Train', noiseVariance, optimizer, epochsOverFit, lossFn);
  plotLossAndInfo('lossTestOverFit', lossTestOverFit, 'Test', noiseVariance, optimizer, epochsOverFit, lossFn);
});

// Range-Elemente auswählen
const numberLayersRange = document.getElementById('numberLayers');
const numberEpochsRange = document.getElementById('numberEpochs');
const activationFunctionSelect = document.getElementById('activationFunction');
const optimizerSelect = document.getElementById('optimizer');
const gaussianNoiseCheckbox = document.getElementById('gaussianNoiseCheckbox');

// Funktion zum Aktualisieren des Anzeigewerts
function updateRangeValueLabel(rangeElement, labelId) {
    document.getElementById(labelId).textContent = `${rangeElement.value}`;
}

// Event-Listener hinzufügen, um den Anzeigewert beim Ändern des Range-Wertes zu aktualisieren
numberLayersRange.addEventListener('input', () => {
    updateRangeValueLabel(numberLayersRange, 'numberLayersValue');
});

numberEpochsRange.addEventListener('input', () => {
    updateRangeValueLabel(numberEpochsRange, 'numberEpochsValue');
});

// Event-Listener für den "Ausführen"-Button hinzufügen
document.getElementById('model-btn').addEventListener('click', function() {
  // Hier rufst du die Funktion plotScatterplots auf und übergibst die erforderlichen Parameter
  const modelParams = {
    numLayers: parseInt(numberLayersRange.value),
    numEpochs: parseInt(numberEpochsRange.value),
    activationFunction: activationFunctionSelect.value,
    optimizer: optimizerSelect.value,
    gaussianNoise: gaussianNoiseCheckbox.checked
  };

  // Hier rufst du die Funktion zur Generierung der Plots auf
  plotScatterplots(trainData, testData, modelParams);
});

// Funktion zur Erstellung von Scatterplots für Trainings- und Testdaten
function plotScatterplots(trainData, testData, modelParams) {
  // Trainingsdaten
  const trainDataValues = trainData.map(d => ({ x: d.x, y: d.y }));
  tfvis.render.scatterplot(
    document.getElementById('trainDataPlot'),
    { values: [trainDataValues], series: ['Trainingsdaten'] },
    { xLabel: 'x', yLabel: 'y', height: 300, title: 'Trainingsdaten' }
  );

  // Testdaten
  const testDataValues = testData.map(d => ({ x: d.x, y: d.y }));
  tfvis.render.scatterplot(
    document.getElementById('testDataPlot'),
    { values: [testDataValues], series: ['Testdaten'] },
    { xLabel: 'x', yLabel: 'y', height: 300, title: 'Testdaten' }
  );
}

