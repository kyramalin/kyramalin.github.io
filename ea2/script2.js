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
  let trainData = data.slice(0, data.length / 2);
  let testData = data.slice(data.length / 2);
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

function plotData(id, data, title, color) {
  const values = data.map(d => ({ x: d.x, y: d.y }));
  tfvis.render.scatterplot(
      document.getElementById(id),
      { values, series: ['data'], color: color },
      { xLabel: 'x', yLabel: 'y', height: 300, title }
  );
}

function plotPredictions(id, model, data, title) {
  const xs = data.map(d => d.x);
  const ys = model.predict(tf.tensor2d(xs, [xs.length, 1])).arraySync();
  const values = xs.map((x, i) => ({ x: x, y: ys[i][0] }));
  tfvis.render.scatterplot(
      document.getElementById(id),
      { values, series: ['predictions'] },
      { xLabel: 'x', yLabel: 'y', height: 300, title }
  );
}

function plotLoss(id, loss, title) {
  document.getElementById(id).innerHTML = `${title}: ${loss.toFixed(4)}`;
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
  plotData('trainDataPlotUnraus', trainDataUnraus, 'Unverrauschte Trainingsdaten', 'blue');
  plotData('trainDataPlotRaus', trainDataRaus, 'Verrauschte Trainingsdaten', 'red');

  // Modell für unverrauschte Daten trainieren
  let modelUnraus = createModel();
  modelUnraus.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
  await trainModel(modelUnraus, trainDataUnraus, 100);

  // Modell auf Testdaten evaluieren
  let lossTrainUnraus = evaluateModel(modelUnraus, trainDataUnraus);
  let lossTestUnraus = evaluateModel(modelUnraus, testDataUnraus);
  
  // Visualisierung der Vorhersagen
  plotPredictions('resultPlotTrainUnraus', modelUnraus, trainDataUnraus, 'Unverrauschte Vorhersagen auf Trainingsdaten');
  plotPredictions('resultPlotTestUnraus', modelUnraus, testDataUnraus, 'Unverrauschte Vorhersagen auf Testdaten');
  plotLoss('lossTrainUnraus', lossTrainUnraus, 'Train Loss');
  plotLoss('lossTestUnraus', lossTestUnraus, 'Test Loss');

  // Modell für verrauschte Daten (Best-Fit) trainieren
  let modelBestFit = createModel();
  modelBestFit.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
  await trainModel(modelBestFit, trainDataRaus, 100);

  // Modell auf Testdaten evaluieren
  let lossTrainBestFit = evaluateModel(modelBestFit, trainDataRaus);
  let lossTestBestFit = evaluateModel(modelBestFit, testDataRaus);
  
  // Visualisierung der Vorhersagen
  plotPredictions('resultPlotTrainBestFit', modelBestFit, trainDataRaus, 'Best-Fit Vorhersagen auf Trainingsdaten');
  plotPredictions('resultPlotTestBestFit', modelBestFit, testDataRaus, 'Best-Fit Vorhersagen auf Testdaten');
  plotLoss('lossTrainBestFit', lossTrainBestFit, 'Train Loss');
  plotLoss('lossTestBestFit', lossTestBestFit, 'Test Loss');

  // Modell für verrauschte Daten (Overfit) trainieren
  let modelOverFit = createModel();
  modelOverFit.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
  await trainModel(modelOverFit, trainDataRaus, 500);  // Übermäßiges Training für Overfitting

  // Modell auf Testdaten evaluieren
  let lossTrainOverFit = evaluateModel(modelOverFit, trainDataRaus);
  let lossTestOverFit = evaluateModel(modelOverFit, testDataRaus);
  
  // Visualisierung der Vorhersagen
  plotPredictions('resultPlotTrainOverFit', modelOverFit, trainDataRaus, 'Overfit Vorhersagen auf Trainingsdaten');
  plotPredictions('resultPlotTestOverFit', modelOverFit, testDataRaus, 'Overfit Vorhersagen auf Testdaten');
  plotLoss('lossTrainOverFit', lossTrainOverFit, 'Train Loss');
  plotLoss('lossTestOverFit', lossTestOverFit, 'Test Loss');
});
