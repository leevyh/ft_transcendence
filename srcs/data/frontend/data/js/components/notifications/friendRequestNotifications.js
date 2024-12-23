import wsManager from "../../views/wsManager.js";
import { removeNotification } from "../../views/notifications.js";

export function displayFriendRequests(notification, offcanvas_body) {

    const notification_type_div = document.createElement('div');
    notification_type_div.className = `notification_type_notification_${notification.type} d-flex flex-column gap-2 mb-2`;
    notification_type_div.id = `notification_${notification.id}`;

    const notification_type_header = document.createElement('div');
    notification_type_header.className = 'd-flex gap-2';

    const notification_type_img = document.createElement('img');
    notification_type_img.className = 'rounded-circle img-fluid';
    notification_type_img.src = `data:image/png;base64,${notification.from_avatar}`;
    notification_type_img.alt = 'profile_picture';
    notification_type_img.width = '50';
    notification_type_img.height = '50';
    notification_type_header.appendChild(notification_type_img);

    const notification_type_header_text = document.createElement('div');
    notification_type_header_text.className = 'd-flex flex-column';

    const notification_type_header_text_type = document.createElement('span');
    notification_type_header_text_type.textContent = 'Friend Request';

    const notification_type_header_text_time = document.createElement('span');
    notification_type_header_text_time.textContent = notification.timestamp;
    notification_type_header_text_time.className = 'text-muted time_notif_span';

    notification_type_header_text.appendChild(notification_type_header_text_type);
    notification_type_header_text.appendChild(notification_type_header_text_time);
    notification_type_header.appendChild(notification_type_header_text);

    const notification_type_close_button = document.createElement('button');
    notification_type_close_button.className = 'btn-close ms-auto';
    notification_type_close_button.setAttribute('aria-label', 'Close');
    notification_type_close_button.onclick = async function() {
        removeNotification(notification.id);
        notification_type_div.remove();
    };
    notification_type_header.appendChild(notification_type_close_button);
    notification_type_div.appendChild(notification_type_header);

    const notification_type_body = document.createElement('div');
    notification_type_body.className = 'd-flex flex-column justify-content-center align-items-center notif_container';

    const notification_type_body_content = document.createElement('span');
    notification_type_body_content.textContent = `${notification.from_nickname} wants to be your friend`;
    notification_type_body_content.className = 'p-1';
    notification_type_body.appendChild(notification_type_body_content);

    const notification_type_body_buttons = document.createElement('div');
    notification_type_body_buttons.className = 'd-flex w-100 justify-content-around';

    const notification_type_body_accept_button = document.createElement('button');
    notification_type_body_accept_button.className = 'btn btn-success';
    notification_type_body_accept_button.textContent = 'Accept';
    notification_type_body_accept_button.onclick = async function() {
        removeNotification(notification.id);
        wsManager.send({
            type: 'accept_friend_request',
            nickname:  notification.from_nickname,
        });
        notification_type_div.remove();
    };

    const notification_type_body_decline_button = document.createElement('button');
    notification_type_body_decline_button.className = 'btn btn-danger';
    notification_type_body_decline_button.textContent = 'Decline';
    notification_type_body_decline_button.onclick = async function() {
        removeNotification(notification.id);
        wsManager.send({
            type: 'reject_friend_request',
            nickname:  notification.from_nickname,
        });
        notification_type_div.remove();

    };

    notification_type_body_buttons.appendChild(notification_type_body_accept_button);
    notification_type_body_buttons.appendChild(notification_type_body_decline_button);
    notification_type_body.appendChild(notification_type_body_buttons);

    notification_type_div.appendChild(notification_type_body);
    offcanvas_body.appendChild(notification_type_div);

}