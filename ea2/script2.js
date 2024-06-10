// Generiere Daten und füge Rauschen hinzu
function generateData(N, noiseVariance, seed) {
  let data = [];
  let rng = new Math.seedrandom(seed); // Verwende einen Seed für die Zufallszahlengenerierung
  let noise = tf.randomNormal([N], 0, Math.sqrt(noiseVariance), null, seed).arraySync();
  for (let i = 0; i < N; i++) {
    let x = rng() * 4 - 2; // Werte im Bereich [-2, 2]
    let y = calculateFunctionResult(x);
    data.push({ x: x, y: y + noise[i] });
  }
  return data;
}

function splitData(data, seed) {
  let rng = new Math.seedrandom(seed); // Verwende einen Seed für das Shuffeln
  tf.util.shuffle(data, () => rng()); // Shuffle-Daten mit dem Seed
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
  const valuesPredictions = xs.map((x, i) => ({ x: x, y: ys[i][0] }));
  const valuesOriginal = data.map(d => ({ x: d.x, y: d.y }));

  tfvis.render.scatterplot(
    document.getElementById(id),
    { values: [valuesOriginal, valuesPredictions], series: ['Originaldaten', 'Vorhersagen'] },
    { 
      xLabel: 'x', 
      yLabel: 'y', 
      height: 300, 
      title, 
      seriesColors: ['orange', color], 
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
  const seed = 123; // Fester Seed für Reproduzierbarkeit

  // Unverrauschte Daten generieren und aufteilen
  const dataUnraus = generateData(N, 0, seed);
  const { trainData: trainDataUnraus, testData: testDataUnraus } = splitData(dataUnraus, seed);

  // Verrauschte Daten generieren und aufteilen
  const dataRaus = generateData(N, noiseVariance, seed);
  const { trainData: trainDataRaus, testData: testDataRaus } = splitData(dataRaus, seed);

  // Visualisiere die Datensätze
  plotData('trainDataPlotUnraus', trainDataUnraus, testDataUnraus, 'Unverrauschte Trainings- und Testdaten');
  plotData('trainDataPlotRaus', trainDataRaus, testDataRaus, 'Verrauschte Trainings- und Testdaten');

  const optimizer = 'adam';
  const lossFn = 'meanSquaredError';

  // Modell für unverrauschte Daten trainieren
  let modelUnraus = createModel();
  modelUnraus.compile({ optimizer: tf.train.adam(0.01), loss: lossFn });
  const epochsUnraus = 150;
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

  // Modell für verrauschte Daten (Over-Fit) trainieren
  let modelOverFit = createModel();
  modelOverFit.compile({ optimizer: tf.train.adam(0.01), loss: lossFn });
  const epochsOverFit = 800;
  await trainModel(modelOverFit, trainDataRaus, epochsOverFit);

  // Modell auf Testdaten evaluieren
  let lossTrainOverFit = evaluateModel(modelOverFit, trainDataRaus);
  let lossTestOverFit = evaluateModel(modelOverFit, testDataRaus);
  
  // Visualisierung der Vorhersagen
  plotPredictions('resultPlotTrainOverFit', modelOverFit, trainDataRaus, 'Over-Fit Vorhersagen auf Trainingsdaten', '#5ca9fa');
  plotPredictions('resultPlotTestOverFit', modelOverFit, testDataRaus, 'Over-Fit Vorhersagen auf Testdaten', 'green');
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
document.getElementById('model-btn').addEventListener('click', async function() {
    showSpinner('trainDataPlot', 'Daten werden geladen...');
    showSpinner('testDataPlot', 'Daten werden geladen...');

    const N = 100;
    const noiseVariance = gaussianNoiseCheckbox.checked ? 0.05 : 0;

    const data = generateData(N, noiseVariance);
    const { trainData, testData } = splitData(data);

    const modelParams = {
        numLayers: parseInt(numberLayersRange.value),
        numEpochs: parseInt(numberEpochsRange.value),
        activationFunction: activationFunctionSelect.value,
        optimizer: optimizerSelect.value,
        gaussianNoise: gaussianNoiseCheckbox.checked
    };

    // Trainings- und Testdaten plotten
    plotScatterplots(trainData, testData, modelParams);

    // Modell trainieren und Loss-Werte berechnen
    const { trainLoss, testLoss } = await trainAndEvaluateModel(trainData, testData, modelParams);

    // Loss-Werte anzeigen
    document.getElementById('lossTrain').textContent = `Trainings-Loss: ${trainLoss.toFixed(4)}`;
    document.getElementById('lossTest').textContent = `Test-Loss: ${testLoss.toFixed(4)}`;

    hideSpinner('trainDataPlot');
    hideSpinner('testDataPlot');
});

function plotScatterplots(trainData, testData, modelParams) {
    const trainDataValues = trainData.map(d => ({ x: d.x, y: d.y }));
    tfvis.render.scatterplot(
        document.getElementById('trainDataPlot'),
        { values: [trainDataValues], series: ['Trainingsdaten'] },
        { xLabel: 'x', yLabel: 'y', height: 300, title: 'Trainingsdaten' }
    );

    const testDataValues = testData.map(d => ({ x: d.x, y: d.y }));
    tfvis.render.scatterplot(
        document.getElementById('testDataPlot'),
        { values: [testDataValues], series: ['Testdaten'] },
        { xLabel: 'x', yLabel: 'y', height: 300, title: 'Testdaten' }
    );
}

async function trainAndEvaluateModel(trainData, testData, modelParams) {
    // Ein einfaches Modell erstellen (dies ist ein Platzhalter - passen Sie diesen Teil an Ihre Bedürfnisse an)
    const model = tf.sequential();
    for (let i = 0; i < modelParams.numLayers; i++) {
        model.add(tf.layers.dense({
            units: 10,
            activation: modelParams.activationFunction,
            inputShape: [1]
        }));
    }
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
        optimizer: modelParams.optimizer,
        loss: 'meanSquaredError'
    });

    const trainX = tf.tensor2d(trainData.map(d => [d.x]));
    const trainY = tf.tensor2d(trainData.map(d => [d.y]));
    const testX = tf.tensor2d(testData.map(d => [d.x]));
    const testY = tf.tensor2d(testData.map(d => [d.y]));

    // Modell trainieren
    await model.fit(trainX, trainY, {
        epochs: modelParams.numEpochs
    });

    // Loss-Werte berechnen
    const trainLoss = model.evaluate(trainX, trainY).dataSync()[0];
    const testLoss = model.evaluate(testX, testY).dataSync()[0];

    return { trainLoss, testLoss };
}
