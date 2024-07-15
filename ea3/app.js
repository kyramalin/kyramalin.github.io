let model;
let tokenizer;
let isAutoPredicting = false;

async function loadModel() {
    try {
        console.log('Loading tokenizer...');
        const tokenizerResponse = await fetch('tokenizer.json');
        if (!tokenizerResponse.ok) {
            throw new Error(`Failed to load tokenizer: ${tokenizerResponse.statusText}`);
        }
        tokenizer = await tokenizerResponse.json();
        console.log('Tokenizer loaded successfully:', tokenizer);

        console.log('Loading model...');
        model = await tf.loadLayersModel('model/model.json');
        console.log('Model loaded successfully.');
    } catch (error) {
        console.error('Error loading model or tokenizer:', error);
    }
}

loadModel();

function preprocessInput(text) {
    if (!tokenizer?.config?.word_index) {
        console.error('Tokenizer not loaded or incorrectly structured');
        return null;
    }

    const wordIndex = JSON.parse(tokenizer.config.word_index);
    let sequence = text.split(' ').map(word => wordIndex[word.toLowerCase()] || 0);

    console.log('Original Sequence:', sequence);

    return tf.tensor([sequence]);
}

async function predictNextWord() {
    const inputText = document.getElementById('inputText').value;
    const messageDiv = document.getElementById('message');
    const messageContainer = document.getElementById('message1');

    if (!inputText) {
        messageDiv.innerText = 'Bitte gib zur Generierung einer Vorhersage zunächst etwas in das Textfeld ein.';
        messageContainer.style.display = 'block';
        return;
    }

    const inputTensor = preprocessInput(inputText);
    if (!inputTensor) return;

    try {
        const predictions = await model.predict(inputTensor).data();
        console.log('Raw Predictions:', predictions);

        const topK = 5;
        const { values, indices } = tf.topk(predictions, topK);

        const valuesArray = await values.data();
        const indicesArray = await indices.data();

        console.log('TopK Indices:', indicesArray);
        console.log('TopK Values:', valuesArray);

        displayPredictions(indicesArray, valuesArray);
    } catch (error) {
        console.error('Error predicting next word:', error);
    }
}

function sample(preds, temperature = 1.0) {
    preds = preds.map(p => Math.log(p) / temperature);
    const exp_preds = preds.map(p => Math.exp(p));
    const sum_exp_preds = exp_preds.reduce((a, b) => a + b);
    const softmax_preds = exp_preds.map(p => p / sum_exp_preds);
    let index = 0;
    let r = Math.random();
    while (r > 0) {
        r -= softmax_preds[index];
        index++;
    }
    return index - 1;
}

async function appendNextWord() {
    const inputText = document.getElementById('inputText').value;
    const messageDiv = document.getElementById('message');
    const messageContainer = document.getElementById('message1');

    if (!inputText) {
        messageDiv.innerText = 'Bitte gib zur Generierung einer Vorhersage zunächst etwas in das Textfeld ein.';
        messageContainer.style.display = 'block';
        return;
    }

    const inputTensor = preprocessInput(inputText);
    if (!inputTensor) return;

    try {
        const predictions = await model.predict(inputTensor).data();
        const nextWordIndex = sample(predictions, 0.7);
        const indexWord = JSON.parse(tokenizer.config.index_word);
        const nextWord = indexWord[nextWordIndex] || 'Undefined';

        appendWord(nextWord);

        // Display predictions after appending the word
        const topK = 5;
        const { values, indices } = tf.topk(predictions, topK);

        const valuesArray = await values.data();
        const indicesArray = await indices.data();

        console.log('TopK Indices:', indicesArray);
        console.log('TopK Values:', valuesArray);

        displayPredictions(indicesArray, valuesArray);
    } catch (error) {
        console.error('Error appending next word:', error);
    }
}


function displayPredictions(indices, values) {
    const predictionsContainer = document.getElementById('predictionsContainer');
    const predictionsDiv = document.getElementById('predictions');
    predictionsDiv.innerHTML = '';

    if (!tokenizer?.config?.index_word) {
        console.error('Tokenizer not loaded or incorrectly structured');
        return;
    }

    const indexWord = JSON.parse(tokenizer.config.index_word);

    indices.forEach((index, i) => {
        const word = indexWord[index] || 'Undefined';
        const probability = (values[i] * 100).toFixed(2);  // Convert probability to percentage

        console.log(`Index: ${index}, Word: ${word}, Probability: ${probability}%`);

        const button = document.createElement('button');
        button.innerHTML = `${word} (${probability}%)`;
        button.classList.add('prediction-button'); // Apply the new class
        button.addEventListener('click', () => appendWord(word));
        predictionsDiv.appendChild(button);
    });

    predictionsContainer.style.display = indices.length > 0 ? 'block' : 'none';
}

function appendWord(word) {
    const inputText = document.getElementById('inputText');
    inputText.value += ' ' + word;
    predictNextWord(); // Refresh predictions after appending a word
}

function startAutoPrediction() {
    const inputText = document.getElementById('inputText').value;
    const messageDiv = document.getElementById('message');
    const messageContainer = document.getElementById('message1');

    if (!inputText) {
        messageDiv.innerText = 'Bitte gib zur Generierung einer Vorhersage zunächst etwas in das Textfeld ein.';
        messageContainer.style.display = 'block';
        return;
    }

    document.getElementById('predictions').innerHTML = ''; // Reset predictions
    document.getElementById('predictionsContainer').style.display = 'none'; // Hide predictions container

    isAutoPredicting = true;
    autoPredict();
}

function stopAutoPrediction() {
    isAutoPredicting = false;
}

async function autoPredict() {
    for (let i = 0; i < 10; i++) {
        if (!isAutoPredicting) break;
        await autoAppendNextWord();
        await new Promise(r => setTimeout(r, 500));
    }
}

function resetText() {
    document.getElementById('inputText').value = '';
    document.getElementById('predictions').innerHTML = '';
    document.getElementById('predictionsContainer').style.display = 'none';
    document.getElementById('message').innerText = '';
    document.getElementById('message1').style.display = 'none';
}

document.getElementById('predictButton').addEventListener('click', () => {
    console.log('Predict Button Clicked');
    predictNextWord();
});

document.getElementById('nextButton').addEventListener('click', () => {
    console.log('Next Button Clicked');
    appendNextWord();
});

document.getElementById('autoButton').addEventListener('click', () => {
    console.log('Auto Button Clicked');
    startAutoPrediction();
});

document.getElementById('stopButton').addEventListener('click', () => {
    console.log('Stop Button Clicked');
    stopAutoPrediction();
});

document.getElementById('resetButton').addEventListener('click', () => {
    console.log('Reset Button Clicked');
    resetText();
});

document.getElementById('inputText').addEventListener('input', () => {
    document.getElementById('message').innerText = '';
    document.getElementById('message1').style.display = 'none';
});

const accordions = document.getElementsByClassName('accordion');
Array.from(accordions).forEach(accordion => {
    accordion.addEventListener('click', function () {
        this.classList.toggle('active');
        const panel = this.nextElementSibling;
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
});
