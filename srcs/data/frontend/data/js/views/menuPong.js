import { DEBUG, navigateTo } from '../app.js';
import { navigationBar } from './navigation.js';
import { notifications } from './notifications.js';
import { getCookie } from './utils.js';


export async function fetchUserGameSettings() {

    const response = await fetch(`/api/game_settings/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
    });
    if (response.status === 200) {
        const GameSet = await response.json();

        if (GameSet) {
            const GameSettings = {
                background_game: GameSet.background_game,
                pads_color: GameSet.pads_color,
                ball_color: GameSet.ball_color,
            };
            return GameSettings;
        }
    } else if (response.status === 307) {
            localStorage.removeItem('token');
            await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
            });
            navigateTo('/');
            return null;
    } else {
        if (DEBUG) {console.error('Error:', response);}
        return null;
    }
}

export function navigateWithBlur(modalToClose, targetPage) {
    // Ajouter un flou
    document.body.style.filter = 'blur(5px)';

    // Masquer la modal après un délai
    const modalInstance = bootstrap.Modal.getInstance(modalToClose);
    modalInstance.hide();

    setTimeout(() => {
        // Naviguer vers la page cible
        navigateTo(targetPage); // Assurez-vous que cela navigue vers la bonne page
    }, 800); // Délai avant la navigation, peut être ajusté
}

export async function menuPongView(container) {
    container.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'd-flex h-100';
    container.appendChild(div);

    const navBarContainer = await navigationBar(container);
    div.appendChild(navBarContainer);

    try {

        const GameSettings = await fetchUserGameSettings();

        const mainDivMenu = document.createElement('div');
        mainDivMenu.className = 'd-flex flex-grow-1 m-4 d-flex flex-column';
        div.appendChild(mainDivMenu);

        const twoButtons = document.createElement('div');
        twoButtons.className = 'twoButtons h-50 w-100 d-flex justify-content-around align-items-center';
        mainDivMenu.appendChild(twoButtons);

        const ContenerTournament = document.createElement('div');
        ContenerTournament.className = 'ContenerTournament w-100 h-100 d-flex justify-content-center align-items-center';
        mainDivMenu.appendChild(ContenerTournament);

        // Fonction pour créer un bouton avec animation
        function createAnimatedButton(buttonClassName, buttonText, pngSrc, gifSrc, container) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = container;
            twoButtons.appendChild(buttonContainer);

            const button = document.createElement('button');
            button.className = buttonClassName + ' btn p-4 w-75 bg-black gameButton';
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
            button.setAttribute('aria-label', `Play ${buttonText} mode`);
            buttonContainer.appendChild(button);

            const buttonContent = document.createElement('p');
            buttonContent.textContent = buttonText;
            buttonContent.className = buttonClassName + 'Content m-0 w-100 h-100 d-flex justify-content-center align-items-center';
            button.appendChild(buttonContent);

            // Création de l'image statique (PNG)
            const staticImage = document.createElement('img');
            staticImage.src = pngSrc;
            if (buttonClassName === 'DuoButton') {
                staticImage.alt = '1v1 mode';
            }
            else {
                staticImage.alt = 'Solo mode';
            }
            staticImage.classList.add('static-img');
            button.appendChild(staticImage);

            // Création de l'image GIF pour l'animation
            const hoverGif = document.createElement('img');
            hoverGif.src = gifSrc;
            hoverGif.className = 'hoverGif';
            if (buttonClassName === 'DuoButton') {
                hoverGif.alt = '1v1 mode (GIF)';
            } else {
                hoverGif.alt = 'Play Solo mode (GIF)';
            }
            hoverGif.classList.add('hover-gif');
            button.appendChild(hoverGif);

            // Réinitialisation du GIF au survol
            button.addEventListener('mouseenter', () => {
                hoverGif.src = ''; // Vider le chemin de l'image temporairement
                hoverGif.src = gifSrc; // Remettre le même chemin pour redémarrer le GIF
            });

            // Retourner le bouton créé
            return button;
        }

        // Fonction pour créer un bouton Tournament (s'il y a des différences, on peut ajouter ici)
        function createAnimatedButtonTournament(buttonClassName, buttonText, pngSrc, gifSrc, container) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = container;
            ContenerTournament.appendChild(buttonContainer);

            const button = document.createElement('button');
            button.className = buttonClassName + ' btn p-4 w-75 bg-black gameButton';
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
            button.setAttribute('aria-label', `Play ${buttonText} mode`);
            buttonContainer.appendChild(button);

            const buttonContent = document.createElement('p');
            buttonContent.textContent = buttonText;
            buttonContent.className = buttonClassName + 'Content m-0 w-100 h-100 d-flex justify-content-center align-items-center';
            button.appendChild(buttonContent);

            // Création de l'image statique (PNG)
            const staticImage = document.createElement('img');
            staticImage.src = pngSrc;
            staticImage.alt = 'Tournament mode';
            staticImage.classList.add('static-img');
            button.appendChild(staticImage);

            // Création de l'image GIF pour l'animation
            const hoverGif = document.createElement('img');
            hoverGif.src = gifSrc;
            hoverGif.className = 'hoverGif';
            hoverGif.alt = 'Tournament mode (GIF)';
            hoverGif.classList.add('hover-gif');
            button.appendChild(hoverGif);

        // Réinitialisation du GIF au survol
            button.addEventListener('mouseenter', () => {
                hoverGif.src = ''; // Vider le chemin de l'image temporairement
                hoverGif.src = gifSrc; // Remettre le même chemin pour redémarrer le GIF
            });
            return button;
        }

    let redirectTo = '';


    function openModal() {
        modalGameSettings.style.display = 'block';
        modalGameSettings.removeAttribute('aria-hidden');
        modalGameSettings.focus();

        setTimeout(() => {
            modalGameSettings.classList.add('modalGameSettingsBase-show');
            modalGameSettings.setAttribute('tabindex', '-1'); // Rendre la modal focusable
            mainDivMenu.style.backdropFilter = 'blur(10px)';
            mainDivMenu.style.transition = 'backdrop-filter 0.3s ease';
        }, 10);

        // Empêcher le focus de sortir de la modal
        document.addEventListener('focusin', trapFocus);
    }

    // Fonction de gestion du focus pour rester dans la modal
    function trapFocus(event) {
        if (!modalGameSettings.contains(event.target)) {
            event.stopPropagation();
            modalGameSettings.focus();
        }
    }
        // Bouton Solo
        const soloButton = createAnimatedButton(
            'soloButton',               // Classe du bouton
            'Solo',                     // Texte du bouton
            '/js/img/pong1.png',       // PNG pour Solo
            '/js/img/pong.gif',        // GIF pour Solo
            'ContenerSoloButton w-50 h-100 d-flex justify-content-center align-items-end' // Classe du conteneur
        );

        soloButton.addEventListener('click', () => {
            redirectTo = '/pongSolo';
            openModal();
        });

        // Bouton Duo
        const duoButton = createAnimatedButton(
            'DuoButton',               // Classe du bouton
            'Duo',                     // Texte du bouton
            '/js/img/pong1.png',      // PNG pour Duo
            '/js/img/pong.gif',       // GIF pour Duo
            'ContenerDuoButton w-50 h-100 d-flex justify-content-center align-items-end'
        );

        duoButton.addEventListener('click', () => {
            redirectTo = '/pong';
            openModal();
        });

        // Bouton Tournament
        const tournamentButton = createAnimatedButtonTournament(
            'TournamentButton',        // Classe du bouton
            'Tournament',              // Texte du bouton
            '/js/img/pong1.png',      // PNG pour Tournament
            '/js/img/pong.gif',       // GIF pour Tournament
            'ContenerTournamentButton w-50 h-100 d-flex justify-content-center align-items-center'
        );

        tournamentButton.addEventListener('click', () => {
            redirectTo = '/tournament';
            openModal();
        });



    ///////////////////////////////////////////////////////////////
        // ModalGameSettings

        const modalGameSettings = document.createElement('div');
        modalGameSettings.className = 'modal modalGameSettingsBase';
        modalGameSettings.setAttribute('tabindex', '-1');
        modalGameSettings.setAttribute('aria-labelledby', 'modalGameSettingsLabel');
        modalGameSettings.setAttribute('aria-hidden', 'true');
        modalGameSettings.style.display = 'none'; // Initialement caché

        mainDivMenu.appendChild(modalGameSettings);

        const modalGameSettingsDialog = document.createElement('div');
        modalGameSettingsDialog.className = 'modal-dialog-centered d-flex justify-content-center align-items-center modalLoginDialog';
        modalGameSettings.appendChild(modalGameSettingsDialog);

        const modalGameSettingsContent = document.createElement('div');
        modalGameSettingsContent.className = 'modal-content modalLoginContent';
        modalGameSettingsDialog.appendChild(modalGameSettingsContent);

        const modalGameSettingsHeader = document.createElement('div');
        modalGameSettingsHeader.className = 'modal-header pb-2 border-bottom modalLoginHeader';
        modalGameSettingsContent.appendChild(modalGameSettingsHeader);

        const modalGameSettingsTitle = document.createElement('h1');
        modalGameSettingsTitle.textContent = 'Game Settings';
        modalGameSettingsTitle.className = 'modal-title modalLoginTitle';
        modalGameSettingsHeader.appendChild(modalGameSettingsTitle);

        const closeButton = document.createElement('span');
        closeButton.id = 'closeButton';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.setAttribute('role', 'button'); // Make it focusable for accessibility
        closeButton.setAttribute('tabindex', '0'); // Make it focusable for accessibility
        closeButton.className = 'closeButtonMenuPong';
        closeButton.textContent = '×';
        modalGameSettingsHeader.appendChild(closeButton);

        // Add event listener for keyboard accessibility
        closeButton.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Disable the default action
                closeButton.click(); // Simulate a click on the button
            }
        });

        // Add event listener for mouse accessibility
        closeButton.addEventListener('click', () => {
            closeModalActions();
        });

        document.addEventListener('click', (event) => {
            if (!modalGameSettingsContent.contains(event.target) &&
                !soloButton.contains(event.target) &&
                !duoButton.contains(event.target) &&
                !tournamentButton.contains(event.target) &&
                modalGameSettings.style.display === 'block') {

                closeModalActions();
            }
        });

        function closeModalActions() {
            modalGameSettings.classList.remove('modalGameSettingsBase-show');

            setTimeout(() => {
                modalGameSettings.style.display = 'none';
                modalGameSettings.setAttribute('aria-hidden', 'true');
                mainDivMenu.style.backdropFilter = 'none';
            }, 100);

            // Retirer le piège de focus
            document.removeEventListener('focusin', trapFocus);
        }

        let tempBackgroundColor = GameSettings.background_game;
        let tempPadsColor = GameSettings.pads_color;
        let tempBallColor = GameSettings.ball_color;

        let selectTheme = localStorage.getItem('selectTheme') === 'true';
        let selectedThemeName = localStorage.getItem('selectedThemeName') || null;

        const colorMapping = {
            'black': '#000000',
            'white': '#fdfefe',
            'purple': '#7d3c98',
            'pink': '#FFC0CB',
            'yellow': '#f4d03f',
            'green': '#229954',
            'gray': '#a6acaf',
            'blue': '#1a5276',
            'lila': '#d7bde2',
            'red': '#c0392b',
            'brown': '#873600',
            'green_light': '#58d68d',
            'blue_light': '#85c1e9'
        };

        function createImageBlock(imagePath, imageSize, textContent) {
            const blockTheme = document.createElement('div');
            blockTheme.className = 'd-flex justify-content-around align-items-center flex-column w-25 h-100 rounded theme-block';
            blockTheme.id = textContent;
            // Make it focusable for accessibility
            blockTheme.setAttribute('tabindex', '0');
            blockTheme.setAttribute('aria-label', `Select ${textContent} theme`);

            const imgElement = document.createElement('img');
            imgElement.src = imagePath;
            imgElement.alt = `${textContent} theme`;
            imgElement.className = 'ImgSeason';
            imgElement.style.width = imageSize;
            blockTheme.appendChild(imgElement);

            const textElement = document.createElement('p');
            textElement.className = 'w-100 d-flex justify-content-center align-items-center';
            textElement.textContent = textContent;
            textElement.style.color = '#000';
            //ADD textElement.style.color = couleur que tu veux
            blockTheme.appendChild(textElement);

            blockTheme.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault(); // Disable the default action
                    blockTheme.click(); // Simulate a click on the button
                }
            });
            blockTheme.addEventListener('click', (event) => {
                event.stopPropagation();
                selectBlock(blockTheme, textContent);
            });

            if (selectTheme && selectedThemeName === textContent) {
                blockTheme.style.border = '4px solid #F4ED37'; // Applique la bordure si ce thème est sélectionné
            }

            return blockTheme;
        }

        const themeColorMapping = {
            'Winter': { background: 'blue_light', pads: 'white', ball: 'blue' },
            'Spring': { background: 'lila', pads: 'purple', ball: 'green_light' },
            'Summer': { background: 'blue', pads: 'yellow', ball: 'red' },
            'Autumn': { background: 'brown', pads: 'white', ball: 'white' }
        };

        function selectBlock(block, themeName) {
            document.querySelectorAll('.theme-block').forEach(block => {
                block.style.border = '';
            });
            block.style.border = '4px solid #F4ED37';
            selectTheme = true;
            selectedThemeName = themeName;

            // Sauvegarde dans le localStorage
            localStorage.setItem('selectTheme', 'true');
            localStorage.setItem('selectedThemeName', selectedThemeName);
            const blockName = block.textContent.trim();
            localStorage.setItem('selectedThemeBlockName', blockName);
            // Déterminer les couleurs basées sur le thème sélectionné
            const themeColors = themeColorMapping[selectedThemeName];
            if (themeColors) {
                tempBackgroundColor = themeColors.background;
                tempPadsColor = themeColors.pads;
                tempBallColor = themeColors.ball;
                refreshColorOptions();
            }
        }

        function verifySelectedThemeColors() {
            if (!selectTheme || !selectedThemeName)
                return false;
            // Obtenir les couleurs du thème sélectionné
            const themeColors = themeColorMapping[selectedThemeName];
            if (!themeColors)
                return false;

            // Vérifier si les couleurs correspondent
            const isBackgroundColorMatching = themeColors.background === tempBackgroundColor;
            const isPadsColorMatching = themeColors.pads === tempPadsColor;
            const isBallColorMatching = themeColors.ball === tempBallColor;

            if (isBackgroundColorMatching && isPadsColorMatching && isBallColorMatching)
                return true;
            return false;
        }

        function removeThemeBorder()
        {
            let elem = document.getElementById('Winter');
            if (elem)
                elem.style.border = '';
            elem = document.getElementById('Spring');
            if (elem)
                elem.style.border = '';
            elem = document.getElementById('Summer');
            if (elem)
                elem.style.border = '';
            elem = document.getElementById('Autumn');
            if (elem)
                elem.style.border = '';
            selectTheme == false;
            selectedThemeName = null;
            localStorage.setItem('selectTheme', 'false');
            localStorage.setItem('selectedThemeName', '');
        }

        const modalGameSettingsBody = document.createElement('div');
        modalGameSettingsBody.className = 'modal-body mt-2';
        modalGameSettingsContent.appendChild(modalGameSettingsBody);

        const form = document.createElement('form');
        modalGameSettingsBody.appendChild(form);

        const ContenerThemes = document.createElement('div');
        ContenerThemes.className = 'ContenerThemes m-3 rounded p-2 row';
        ContenerThemes.style.backgroundColor = '#d4cbcb '; //#938c8c
        form.appendChild(ContenerThemes);

        const winterBlock = createImageBlock('/js/img/Winter.png', '90px', 'Winter');
        ContenerThemes.appendChild(winterBlock);

        const springBlock = createImageBlock('/js/img/flower.png', '90px', 'Spring');
        ContenerThemes.appendChild(springBlock);

        const summerBlock = createImageBlock('/js/img/iceCream.png', '90px', 'Summer');
        ContenerThemes.appendChild(summerBlock);

        const autumnBlock = createImageBlock('/js/img/leaf.png', '90px', 'Autumn');
        ContenerThemes.appendChild(autumnBlock);

        const TitleBackgroundColor = document.createElement('p');
        TitleBackgroundColor.className = 'TitleBackgroundColor mb-4 fs-5';
        TitleBackgroundColor.textContent = 'Game color';
        TitleBackgroundColor.style.color = '#000';
        form.appendChild(TitleBackgroundColor);

        // Div contenant les options de couleur
        const colorOptionsContainer = document.createElement('div');
        colorOptionsContainer.className = 'd-flex justify-content-center mb-3 colorOptionsContainer';
        form.appendChild(colorOptionsContainer);


        // Fonction pour creer le visuel des couleurs
        const addColorOptions = (container, colorType) => {
            Object.entries(colorMapping).forEach(([colorName, colorValue]) => {
                // Créer un bouton pour chaque option de couleur
                const colorButton = document.createElement('button');
                colorButton.className = 'color-option';
                colorButton.style.backgroundColor = colorValue;
                colorButton.style.width = '40px';
                colorButton.style.height = '40px';
                colorButton.style.borderRadius = '50%';
                colorButton.style.margin = '0 5px';
                colorButton.style.cursor = 'pointer';
                colorButton.style.border = '2px solid transparent'; // Bordure initialement transparente
                colorButton.setAttribute('aria-label', `Select ${colorName} color for ${colorType}`); // Aria label pour l'accessibilité
                colorButton.type = 'button'; // Empêche le comportement de soumission

                // Logique de sélection visuelle
                if (selectTheme === false) {
                    if (colorType === 'background' && GameSettings.background_game === colorName) {
                        colorButton.style.border = '4px solid #F4ED37';
                    } else if (colorType === 'pads' && GameSettings.pads_color === colorName) {
                        colorButton.style.border = '4px solid #F4ED37';
                    } else if (colorType === 'ball' && GameSettings.ball_color === colorName) {
                        colorButton.style.border = '4px solid #F4ED37';
                    }
                } else if (selectTheme === true) {
                    if ((colorType === 'background' && colorName === tempBackgroundColor) ||
                        (colorType === 'pads' && colorName === tempPadsColor) ||
                        (colorType === 'ball' && colorName === tempBallColor)) {
                        colorButton.style.border = '4px solid #F4ED37';
                    }
                }

                // Écouteur d'événements pour le clavier
                colorButton.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault(); // Empêcher l'action par défaut
                        colorButton.click(); // Simule un clic sur le bouton
                    }
                });

                // Écouteur d'événements pour le clic
                colorButton.addEventListener('click', (event) => {
                    event.stopPropagation(); // Empêche la propagation vers le formulaire
                    const isSelected = colorButton.style.border === '4px solid #F4ED37';
                    container.querySelectorAll('.color-option').forEach(option => {
                        option.style.border = '2px solid transparent'; // Réinitialise la bordure des autres options
                    });
                    if (!isSelected) {
                        colorButton.style.border = '4px solid #F4ED37'; // Sélectionne la nouvelle couleur
                    }
                    // Met à jour la couleur temporaire en fonction du type
                    if (colorType === 'background') {
                        tempBackgroundColor = colorName;
                    } else if (colorType === 'pads') {
                        tempPadsColor = colorName;
                    } else if (colorType === 'ball') {
                        tempBallColor = colorName;
                    }
                    const colorsMatch = verifySelectedThemeColors();
                    if (!colorsMatch) {
                        removeThemeBorder();
                    }
                });

                // Ajoute le bouton au conteneur
                container.appendChild(colorButton);
            });
        };



        addColorOptions(colorOptionsContainer, 'background');// Pour le fond du jeu

        const TitlePadsColor = document.createElement('p');
        TitlePadsColor.className = 'TitlePadsColor mb-4 fs-5';
        TitlePadsColor.style.color = '#000';
        TitlePadsColor.textContent = 'Pads Color';
        form.appendChild(TitlePadsColor);

        const colorOptionsContainerPad = document.createElement('div');
        colorOptionsContainerPad.className = 'd-flex justify-content-center mb-3 colorOptionsContainer';
        form.appendChild(colorOptionsContainerPad);

        addColorOptions(colorOptionsContainerPad, 'pads');    // COLOR Pour les pads

        const TitleBallColor = document.createElement('p');
        TitleBallColor.className = 'TitleBallColor mb-4 fs-5';
        TitleBallColor.textContent = 'Ball Color';
        TitleBallColor.style.color = '#000';
        form.appendChild(TitleBallColor);

        const colorOptionsContainerBall = document.createElement('div');
        colorOptionsContainerBall.className = 'd-flex justify-content-center mb-3 colorOptionsContainer';
        form.appendChild(colorOptionsContainerBall);

       addColorOptions(colorOptionsContainerBall, 'ball');  //COLOR Pour la balle


        function refreshColorOptions() {
            // Vider les conteneurs avant de les remplir de nouvelles couleurs
            colorOptionsContainer.innerHTML = '';
            colorOptionsContainerPad.innerHTML = '';
            colorOptionsContainerBall.innerHTML = '';

            // Ajouter les options de couleur mises à jour
            addColorOptions(colorOptionsContainer, 'background');
            addColorOptions(colorOptionsContainerPad, 'pads');
            addColorOptions(colorOptionsContainerBall, 'ball');
        }

        const playButton = document.createElement('button');
        playButton.type = 'submit';
        playButton.className = 'btn btn-primary w-100 Button mb-3';
        playButton.textContent = 'Play';
        playButton.id = 'playButton';
        form.appendChild(playButton);

        function checkColorMatching(tempBackgroundColor, tempPadsColor, tempBallColor)
        {
            if (tempBackgroundColor == tempPadsColor || tempBackgroundColor == tempBallColor)

                return false;
            if (tempBackgroundColor == 'white')
                return false;
            if (tempBackgroundColor == 'purple' && (tempPadsColor === 'blue' || tempBallColor === 'blue') ||
                tempBackgroundColor == 'purple' && (tempPadsColor === 'pink' || tempBallColor === 'pink') ||
                tempBackgroundColor == 'purple' && (tempPadsColor === 'lila' || tempBallColor === 'lila'))
                return false;
            if (tempBackgroundColor == 'pink' && (tempPadsColor === 'lila' || tempBallColor === 'lila') ||
                tempBackgroundColor == 'pink' && (tempPadsColor === 'yellow' || tempBallColor === 'yellow') ||
                tempBackgroundColor == 'pink' && (tempPadsColor === 'blue_light' || tempBallColor === 'blue_light'))
                return false;
            if (tempBackgroundColor == 'yellow' && (tempPadsColor === 'pink' || tempBallColor === 'pink') ||
                tempBackgroundColor == 'yellow' && (tempPadsColor === 'lila' || tempBallColor === 'lila') ||
                tempBackgroundColor == 'yellow' && (tempPadsColor === 'green_light' || tempBallColor === 'green_light') ||
                tempBackgroundColor == 'yellow' && (tempPadsColor === 'blue_light' || tempBallColor === 'blue_light'))
                return false;
            if (tempBackgroundColor == 'green' && (tempPadsColor === 'green_light' || tempBallColor === 'green_light'))
                return false;
            if (tempBackgroundColor == 'gray' && (tempPadsColor === 'green_light' || tempBallColor === 'green_light') ||
                tempBackgroundColor == 'gray' && (tempPadsColor === 'blue_light' || tempBallColor === 'blue_light') ||
                tempBackgroundColor == 'gray' && (tempPadsColor === 'lila' || tempBallColor === 'lila') ||
                tempBackgroundColor == 'gray' && (tempPadsColor === 'pink' || tempBallColor === 'pink'))
                return false;
            if (tempBackgroundColor == 'blue' && (tempPadsColor === 'purple' || tempBallColor === 'purple') ||
                tempBackgroundColor == 'blue' && (tempPadsColor === 'green_light' || tempBallColor === 'green_light'))
                return false;
            if (tempBackgroundColor == 'lila' && (tempPadsColor === 'white' || tempBallColor === 'white') ||
                tempBackgroundColor == 'lila' && (tempPadsColor === 'pink' || tempBallColor === 'pink') ||
                tempBackgroundColor == 'lila' && (tempPadsColor === 'gray' || tempBallColor === 'gray') ||
                tempBackgroundColor == 'lila' && (tempPadsColor === 'blue_light' || tempBallColor === 'blue_light'))
                return false;
            if (tempBackgroundColor == 'red' && (tempPadsColor === 'brown' || tempBallColor === 'brown'))
                return false;
            if (tempBackgroundColor == 'brown' && (tempPadsColor === 'red' || tempBallColor === 'red'))
                return false;
            if (tempBackgroundColor == 'green_light' && (tempPadsColor === 'pink' || tempBallColor === 'pink') ||
                tempBackgroundColor == 'green_light' && (tempPadsColor === 'green' || tempBallColor === 'green') ||
                tempBackgroundColor == 'green_light' && (tempPadsColor === 'yellow' || tempBallColor === 'yellow') ||
                tempBackgroundColor == 'green_light' && (tempPadsColor === 'gray' || tempBallColor === 'gray') ||
                tempBackgroundColor == 'green_light' && (tempPadsColor === 'lila' || tempBallColor === 'lila') ||
                tempBackgroundColor == 'green_light' && (tempPadsColor === 'blue_light' || tempBallColor === 'blue_light'))
                return false;
            if (tempBackgroundColor == 'blue_light' && (tempPadsColor === 'pink' || tempBallColor === 'pink') ||
                tempBackgroundColor == 'blue_light' && (tempPadsColor === 'gray' || tempBallColor === 'gray') ||
                tempBackgroundColor == 'blue_light' && (tempPadsColor === 'lila' || tempBallColor === 'lila') ||
                tempBackgroundColor == 'blue_light' && (tempPadsColor === 'green_light' || tempBallColor === 'green_light'))
                return false;
            return true;
        }

        form.addEventListener('submit', async (event) => {

            event.preventDefault();

            const errorMessages = form.querySelectorAll('.text-danger');
            errorMessages.forEach(message => message.remove());
            const successMessages = form.querySelectorAll('.text-success');
            successMessages.forEach(message => message.remove());

            GameSettings.background_game = tempBackgroundColor;
            GameSettings.pads_color = tempPadsColor;
            GameSettings.ball_color = tempBallColor;

            try {
                const response = await fetch('/api/updateGameSettings/', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify(GameSettings),
                });
                if (response.status === 307) {
                    localStorage.removeItem('token');
                    await fetch('/api/logout/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken'),
                        },
                    });
                    navigateTo('/');
                    return;
                }
                if (!response.ok) {
                    const errorMessage = document.createElement('p');
                    errorMessage.className = 'text-danger';
                    errorMessage.textContent = 'Invalid coulour choices';
                    form.insertBefore(errorMessage, playButton);
                    form.reset();
                }
                else if (response.ok && checkColorMatching(tempBackgroundColor, tempPadsColor, tempBallColor)) {

                    const successMessage = document.createElement('p');
                    successMessage.className = 'text-success';
                    successMessage.textContent = 'Color successfully modified';
                    form.appendChild(successMessage);
                    navigateTo(redirectTo);
                    form.reset();

                } else {
                    const errorMessage = document.createElement('p');
                    errorMessage.className = 'text-danger';
                    errorMessage.textContent = 'Low visibility, try again.';
                    form.insertBefore(errorMessage, playButton);
                    setTimeout(() => errorMessage.remove(), 3000);
                    form.reset();
                }
                // if (!checkColorMatching(tempBackgroundColor, tempPadsColor, tempBallColor))
            } catch (error) {
                const errorMessage = document.createElement('p');
                errorMessage.className = 'text-danger';
                errorMessage.textContent = 'An error has occurred, try again.';
                form.insertBefore(errorMessage, playButton);
                setTimeout(() => errorMessage.remove(), 3000);
                // Reset the form after success
                form.reset();
            }
        });

        const notifications_div = await notifications();
        div.appendChild(notifications_div);
    } catch {
        if (DEBUG) {console.log("Menupong pas charger");}
    }
}
