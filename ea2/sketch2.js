function setup() {
    noCanvas();
    // Event Listener für den Run-Button
    document.getElementById('runButton').addEventListener('click', async () => {
      // Neue Modelle trainieren und evaluieren
      await document.dispatchEvent(new Event('DOMContentLoaded'));
    });
  }

    // Add accordion functionality
    const accordions = document.getElementsByClassName('accordion');
    for (let accordion of accordions) {
        accordion.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
        });
    }