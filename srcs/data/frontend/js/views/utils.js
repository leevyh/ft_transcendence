import { DEBUG, navigateTo } from '../app.js';
import wsManager from './wsManager.js';

// Helper function to get CSRF token from cookies
export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const translations = {
	en: {
		// Home page
		home: 'Welcome',
		homeText: 'This is our transcendence homepage. This project involves creating a website for the mighty Pong competition! We hope you enjoy your visit to our site.',
		login: "Login",
		register: "Register",
		logout: "Log out",
		settings: "Settings",
        language_selector: "Language: ",
	},
	fr: {
		// Home page
		home: 'Bienvenue',
		homeText: 'Voici notre page d\'accueil transcendance. Ce projet consiste en la création d\'un site web pour le concours « Pong » ! Nous espérons que vous apprécierez votre visite sur notre site',
		login: "Se connecter",
		register: "S'inscrire",
		logout: "Se déconnecter",
		settings: "Paramètres",
        language_selector: "Langue: ",
	},
	sp: {
		// Home page
		home: '¡Bienvenido!',
		homeText: 'Esta es nuestra página web de trascendencia. Este proyecto consiste en crear un sitio web para la poderosa competición Pong. Esperamos que disfrute de su visita a nuestro sitio.',
		login: "Iniciar sesión",
		register: "Registrarse",
		logout: "Cerrar sesión",
		settings: "Ajustes",
        language_selector: "Idioma: ",
	},
};

// Change the language of the page
export function changeLanguage(lang) {
	const elements = document.querySelectorAll('[data-i18n]');
	elements.forEach(element => {
		const key = element.getAttribute('data-i18n');
		const translation = translations[lang][key];

		if (translation) {
			element.childNodes[0].nodeValue = translation;
		}
	});
}
// if check_auth open websocket
// const friendRequestSocket = new WebSocket('ws://' + window.location.host + '/ws/friend_request/');
//
// friendRequestSocket.onopen = function() {
// 	console.log('Friend request socket opened');
// }
//
// friendRequestSocket.onmessage = function(event) {
// 	const data = JSON.parse(event.data);
// 	console.log('Friend request socket message:', data);
// 	if (data.type === 'friend_request') {
//         console.log('Enter in displayFriendRequestNotification');
// 		displayFriendRequestNotification(data.from_nickname);
// 	}
//     else if (data.type === 'error') {
//         alert(data.message);
//     }
// };
//
// friendRequestSocket.onclose = function() {
// 	console.log('Friend request socket closed');
// }

wsManager.AddNotificationListener((data) => {
    if (data.type === 'friend_request') {
        if (DEBUG) {console.log('New friend request received from ', data.from_nickname);}
        displayFriendRequestNotification(data.from_nickname);
    }
})



function displayFriendRequestNotification(nickname) {
    const friendRequestNotificationModal = document.createElement('div');
    friendRequestNotificationModal.className = 'modal';


    const modalDialog = document.createElement('div');
    modalDialog.className = 'modal-dialog';
    friendRequestNotificationModal.appendChild(modalDialog);

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    friendRequestNotificationModal.appendChild(modalContent);

    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalContent.appendChild(modalHeader);

    const modalTitle = document.createElement('h5');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = 'Friend request';
    modalHeader.appendChild(modalTitle);

    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.textContent = `${nickname} sent you a friend request`;
    modalContent.appendChild(modalBody);

    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    modalContent.appendChild(modalFooter);


    const acceptButton = document.createElement('button');
    acceptButton.className = 'btn btn-success';
    acceptButton.textContent = 'Accept';
    acceptButton.style = 'display: block; margin: 0 auto; width: 50%;';
    // Add event listener to accept the friend request with websocket, remove the modal
    acceptButton.addEventListener('click', () => {
        wsManager.send({
            type: 'accept_friend_request',
            nickname: nickname,
        });
        friendRequestNotificationModal.remove();
    });
    modalFooter.appendChild(acceptButton);

    const rejectButton = document.createElement('button');
    rejectButton.className = 'btn btn-danger';
    rejectButton.textContent = 'Reject';
    rejectButton.style = 'display: block; margin: 0 auto; width: 50%;';
    rejectButton.addEventListener('click', () => {
        wsManager.send({
            type: 'reject_friend_request',
            nickname: nickname,
        });
        friendRequestNotificationModal.remove();
    });
    modalFooter.appendChild(rejectButton);

    //Add button close to the modal
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.textContent = 'Close';
    closeButton.style = 'display: block; margin: 0 auto; width: 50%;';
    closeButton.addEventListener('click', () => {
        friendRequestNotificationModal.remove();
    });

    modalFooter.appendChild(closeButton);
    // Close the modal when the user clicks on the close button and remove the modal from the DOM
    document.body.appendChild(friendRequestNotificationModal);
    friendRequestNotificationModal.style.display = 'block';
}

// Récupérer le token CSRF depuis les cookies et vérifier si l'utilisateur est authentifié
export async function isAuthenticated() {
    try {
        const response = await fetch('/api/check_auth/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
        });
        if (response.ok) {
            const data = await response.json();
            return data.value;
        } else {
            return false;
        }
    }
    catch (error) {
        if (DEBUG) {console.error('Error checking authentication:', error);}
        return false;
    }
}

// Récupérer les paramètres d'accessibilité de l'utilisateur
export async function getAccessibility() {
    try {
        const response = await fetch('/api/settings/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
        });
        if (response.status === 200) {
            const data = await response.json();
            const userData = {
                language: data.language,
                font_size: data.font_size,
                theme: data.dark_mode,
            };
            return userData;
        } else if (response.status === 307) {
            localStorage.removeItem('token');

            const logoutResponse = await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
            });

            await logoutResponse.json(); // Traiter la réponse de logout si nécessaire
            navigateTo('/login');
            return null;
        } else {
            throw new Error('Something went wrong');
        }
    } catch (error) {
        if (DEBUG) {console.error('Error fetching accessibility settings:', error);}
        return null;
    }
}

export function applyAccessibilitySettings(userSettings) {
    const rootElement = document.documentElement;
    if (!userSettings) {
        document.documentElement.setAttribute('lang', 'fr');
        rootElement.style.fontSize = '16px';
        document.body.classList.remove('dark-mode');
        return;
    }

    // Appliquer le langage
    if (userSettings.language) {
        document.documentElement.setAttribute('lang', userSettings.language);
    }

    // Appliquer la taille de police
    switch (userSettings.font_size) {
        case 1:
            rootElement.style.fontSize = '12px';
            break;
        case 2:
            rootElement.style.fontSize = '16px'; // Taille par défaut
            break;
        case 3:
            rootElement.style.fontSize = '20px';
            break;
        default:
            rootElement.style.fontSize = '16px'; // Valeur par défaut
    }

    // Appliquer le mode sombre
    if (userSettings.theme) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}