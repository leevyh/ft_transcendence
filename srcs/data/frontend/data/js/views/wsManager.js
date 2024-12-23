import { isAuthenticated } from "./utils.js";
import { DEBUG } from "../app.js";

class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.callbacks = [];
        this.isConnected = false;
        this.token = localStorage.getItem('token');

        // Ajout d'un listener pour attendre que le token soit disponible
        window.addEventListener('userAuthenticated', () => {
            this.token = localStorage.getItem('token');  // Rafraîchir le token
            this.connect();  // Tenter de se connecter au WebSocket
        });
    }

    async connect(){
        if (this.token) {
            //Check token validity with backend
            const status_token = await isAuthenticated();
            // if (DEBUG) {console.log('Token status:', status_token);}
            if (!status_token) {
                // if (DEBUG) {console.error('Invalid token');}
                return;
            }
            try {
                this.socket = new WebSocket(this.url);
            } catch (error) {
                // if (DEBUG) {console.error('WSManager WebSocket connection error:', error);}
                return;
            }
            this.socket.onopen = () => {
                // if (DEBUG) {console.log('WSManager WebSocket connection established');}
                this.isConnected = true;
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.callbacks.forEach(callback => callback(data));
            };

            this.socket.onclose = () => {
                // if (DEBUG) {console.log('WSManager WebSocket connection closed');}
                this.isConnected = false;
                setTimeout(() => this.connect(), 1000);
            };
            this.socket.onerror = error => {
                // if (DEBUG) {console.error('WSManager WebSocket error:', error);}
            };
        } else {
            // if (DEBUG) {console.error('No token found');}
        }
    }

    send(data){
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // if (DEBUG) {console.log("Sending data: ", data);}
            this.socket.send(JSON.stringify(data));
        }
    }

    AddNotificationListener(callback) {
        this.callbacks.push(callback);
    }

    RemoveNotificationListener(callback) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }
}

const wsManager = new WebSocketManager(`wss://${window.location.host}/ws/notifications/`);

export default wsManager;
wsManager.connect();