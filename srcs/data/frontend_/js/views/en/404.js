import { navigateTo } from '../../app.js';

export function notFoundViewEN(container) {
    container.innerHTML = '';

    const h1 = document.createElement('h1');
    h1.textContent = '404 - Page Not Found';

    const p = document.createElement('p');
    p.textContent = 'The page you are looking for does not exist.';

    const homeButton = document.createElement('button');
    homeButton.textContent = 'Go to Home';
    homeButton.className = 'btn btn-primary';
    homeButton.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/');
    });

    container.appendChild(h1);
    container.appendChild(p);
    container.appendChild(homeButton);
}