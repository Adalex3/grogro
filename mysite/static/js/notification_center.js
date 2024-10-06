// Optionally clear notifications on page load
function clearNotifications() {
    localStorage.removeItem('notifications');
}
// Uncomment the next line to clear notifications on every page load
// clearNotifications();

const style = document.createElement("style");
document.body.appendChild(style);
style.textContent = `
/* Existing CSS styles */
.corner-button {
    position: fixed;
    top: 100px;
    right: 50px;
    width: 75px;
    height: 75px;
    background-color: white;
    border-radius: 30px;
    box-shadow: 0px 0px 15px rgba(0,0,0,0.5);
    z-index: 10000;
    cursor: pointer;
    transition: 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.corner-button:hover {
    transform: scale(1.1);
}

.corner-button:active {
    transform: scale(0.9);
}

.corner-button img {
    width: 50%;
    height: 50%;
    transform: translateY(-5%);
}

.corner-button p {
    border-radius: 20px;
    padding: 2% 10%;
    background-color: red;
    color: white;
    position: absolute;
    font-size: 1rem;
    transform: translate(100%, 100%);
}

.notification-center {
    font-family: Nunito, system-ui, sans-serif;
    position: fixed;
    top: 0;
    right: -300px;
    width: 300px;
    height: 100%;
    background-color: white;
    box-shadow: -2px 0 5px rgba(0,0,0,0.3);
    z-index: 9999;
    transition: right 0.3s ease-in-out;
}

.notification-center.active {
    right: 0;
}

.notification-center .close-button {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 1.5rem;
    cursor: pointer;
}

.notification-center .notifications {
    margin-top: 50px;
    padding: 10px;
    overflow-y: auto;
    max-height: calc(100% - 100px); /* Adjusted for clear all button */
}

.notification {
    display: flex;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid #ddd;
}

.notification h4 {
    margin: 0;
    font-size: 1rem;
}

.notification p:not(.bullet-point) {
    margin: 0;
}

.notification-section h3 {
    margin-top: 20px;
    margin-bottom: 10px;
    font-size: 1.2rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
}

.notification-section {
    margin-bottom: 20px;
}

.clear-all-button {
    position: absolute;
    bottom: 10px;
    left: 10px;
    font-size: 1rem;
    cursor: pointer;
    color: red;
    background-color: white;
    padding: 5%;
}

.countdown {
    font-size: 0.8rem;
    color: #666;
}

.bullet-point {
    color: inherit;
    margin-right: 10px;
    font-size: 1.5rem;
}
`;

const cornerButton = document.createElement("div");
cornerButton.classList.add("corner-button");
document.body.appendChild(cornerButton);

const cornerButtonImg = document.createElement("img");
cornerButton.appendChild(cornerButtonImg);
cornerButtonImg.src = "../static/res/alarm.png";

const cornerButtonBadge = document.createElement("p");
cornerButtonBadge.textContent = "•";
cornerButton.appendChild(cornerButtonBadge);

cornerButton.addEventListener('click', function(event){
    event.stopPropagation();
    showCenter();
});

// Create the notification center container
const notificationCenter = document.createElement('div');
notificationCenter.classList.add('notification-center');

// Create the close button
const closeButton = document.createElement('div');
closeButton.classList.add('close-button');
closeButton.innerHTML = '&times;';
notificationCenter.appendChild(closeButton);

// Create the notifications container
const notificationsContainer = document.createElement('div');
notificationsContainer.classList.add('notifications');
notificationCenter.appendChild(notificationsContainer);

// Append the notification center to the body
document.body.appendChild(notificationCenter);

// Event listener for the close button
closeButton.addEventListener('click', hideCenter);

// Prevent clicks inside the notification center from closing it
notificationCenter.addEventListener('click', function(event) {
    event.stopPropagation();
});

// Function to show the notification center
function showCenter() {
    cornerButton.style.opacity = 0;
    notificationCenter.classList.add('active');
    document.addEventListener('click', outsideClickListener);
}

// Function to hide the notification center
function hideCenter() {
    cornerButton.style.opacity = 1;
    notificationCenter.classList.remove('active');
    document.removeEventListener('click', outsideClickListener);
}

// Function to detect clicks outside the notification center
function outsideClickListener(event) {
    if (!notificationCenter.contains(event.target) && !cornerButton.contains(event.target)) {
        hideCenter();
    }
}

// Function to get time remaining for countdown
function getTimeRemaining(dateString) {
    const now = new Date();
    const targetDate = new Date(dateString);
    const totalSeconds = Math.floor((targetDate - now) / 1000);

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let timeRemaining = '';
    if (days > 0) {
        timeRemaining += days + ' day' + (days !== 1 ? 's' : '');
    } else if (hours > 0) {
        timeRemaining += hours + ' hour' + (hours !== 1 ? 's' : '');
    } else if (minutes > 0) {
        timeRemaining += minutes + ' minute' + (minutes !== 1 ? 's' : '');
    } else {
        timeRemaining = 'less than a minute';
    }
    return timeRemaining;
}

// Load notifications from localStorage
function loadNotifications() {
    let notifications = JSON.parse(localStorage.getItem('notifications'));
    if (!notifications || notifications.length === 0) {
        // No notifications, initialize with default ones
        notifications = [
            {
                title: 'Milk Expiration',
                subtitle: 'Your Milk item purchased at Walmart has expired.',
                date: '2024-10-01',
                color: '#4a94c2', // Light blue
            },
            {
                title: 'Eggs Expiration',
                subtitle: 'Your Eggs item purchased at Aldi has expired',
                date: '2024-10-02', // Future date
                color: '#67889c', // Slightly yellow
            },
            {
                title: 'Bread Expiration',
                subtitle: 'Your Bread item purchased at Walmart has expired.',
                date: '2024-10-04', // Past date
                color: '#917200', // Blue
            }
        ];
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    notificationsContainer.innerHTML = ''; // Clear existing notifications

    // Sort notifications into future and past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to compare dates without time
    const futureNotifications = [];
    const pastNotifications = [];

    notifications.forEach(notification => {
        const notificationDate = new Date(notification.date);
        notificationDate.setHours(0, 0, 0, 0);
        if (notificationDate >= today) {
            futureNotifications.push(notification);
        } else {
            pastNotifications.push(notification);
        }
    });

    // Sort each group by date
    futureNotifications.sort((a, b) => new Date(a.date) - new Date(b.date));
    pastNotifications.sort((a, b) => new Date(b.date) - new Date(a.date)); // Descending order

    // Create sections in the desired order
    if (futureNotifications.length > 0) {
        const futureSection = document.createElement('div');
        futureSection.classList.add('notification-section');
        const futureHeader = document.createElement('h3');
        futureHeader.textContent = 'Upcoming Notifications';
        futureSection.appendChild(futureHeader);
        futureNotifications.forEach(notification => {
            addNotificationElement(notification, futureSection, true);
        });
        notificationsContainer.appendChild(futureSection);
    }

    if (pastNotifications.length > 0) {
        const pastSection = document.createElement('div');
        pastSection.classList.add('notification-section');
        const pastHeader = document.createElement('h3');
        pastHeader.textContent = 'Past Notifications';
        pastSection.appendChild(pastHeader);
        pastNotifications.forEach(notification => {
            addNotificationElement(notification, pastSection, false);
        });
        notificationsContainer.appendChild(pastSection);
    }

    updateBadge();
}

// Function to add a notification element to the DOM
function addNotificationElement(notification, container, isFuture) {
    const notificationDiv = document.createElement('div');
    notificationDiv.classList.add('notification');

    // Bullet point
    const bulletPoint = document.createElement('p');
    bulletPoint.textContent = '•';
    bulletPoint.style.color = notification.color;
    bulletPoint.classList.add('bullet-point');

    // Content div
    const contentDiv = document.createElement('div');
    contentDiv.style.display = 'inline-block';

    // Title
    const title = document.createElement('h4');
    title.textContent = notification.title;

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = notification.subtitle;

    // Append title and subtitle
    contentDiv.appendChild(title);
    contentDiv.appendChild(subtitle);

    if (isFuture) {
        // Countdown for future notifications
        const timeRemaining = getTimeRemaining(notification.date);
        const countdown = document.createElement('p');
        countdown.textContent = `${timeRemaining} until ${notification.title}`;
        countdown.classList.add('countdown');
        contentDiv.appendChild(countdown);
    } else {
        // Date for past notifications
        const date = document.createElement('p');
        date.textContent = `Date: ${notification.date}`;
        date.style.fontSize = '0.8rem';
        date.style.color = '#666';
        contentDiv.appendChild(date);
    }

    notificationDiv.appendChild(bulletPoint);
    notificationDiv.appendChild(contentDiv);

    container.appendChild(notificationDiv);
}

// Function to add a new notification
function addNotification(notification) {
    // Save the notification to localStorage
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.push(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));

    // Reload notifications to update the display
    loadNotifications();
}

// Function to update the notification badge
function updateBadge() {
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureNotifications = notifications.filter(notification => {
        const notificationDate = new Date(notification.date);
        notificationDate.setHours(0, 0, 0, 0);
        return notificationDate >= today;
    });
    if (futureNotifications.length > 0) {
        cornerButtonBadge.textContent = futureNotifications.length;
        cornerButtonBadge.style.padding = '';
    } else {
        cornerButtonBadge.textContent = '';
        cornerButtonBadge.style.padding = '0';
    }
}

// Listen for storage events to update notifications in other tabs/pages
window.addEventListener('storage', function(event) {
    if (event.key === 'notifications') {
        loadNotifications();
    }
});

// Initialize notifications on page load
loadNotifications();

// Create the clear all button
const clearAllButton = document.createElement('div');
clearAllButton.classList.add('clear-all-button');
clearAllButton.textContent = 'Clear All Notifications';
notificationCenter.appendChild(clearAllButton);

// Event listener for the clear all button
clearAllButton.addEventListener('click', function() {
    localStorage.removeItem('notifications');
    notificationsContainer.innerHTML = '';
    updateBadge();
});