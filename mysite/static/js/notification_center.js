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
.bottom-banner {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80vw;
    min-width: 300px;
    max-width: 800px;
    background-color: var(--dark3);
    color: white;
    text-align: center;
    padding: 1% 5%;
    z-index: 10000;
    border-radius: 10px 10px 0 0;
    box-shadow: 0px -2px 5px rgba(0,0,0,0.3);
    font-family: Nunito, system-ui, sans-serif;
    display: flex;
    flex-direction: row;
    transition: 0.5s;
}

.bottom-banner p:not(.notification-dot) {
    width: min(600px, 60vw);
    text-align: left;
    transition: 1s;
    font-size: 1.1rem
}

.bottom-banner button {
    background-color: white;
    color: var(--dark3);
    border: none;
    padding: 10px 20px;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 5px;
    margin-left: 10px;
    font-weight: 900;
    font-family: Nunito, system-ui, sans-serif;
    min-width: 8rem;
    transition: 1s;
}

.bottom-banner button:hover {
    scale: 110%;
    transition: 0.25s;
}
.bottom-banner button:active {
    scale: 90%;    
    transition: 0.25s;
}

.notification-center {
    pointer-events: none;
    font-family: Nunito, system-ui, sans-serif;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(60%);
    width: 80vw;
    max-width: 600px;
    height: auto;
    max-height: 80vh;
    background-color: white;
    box-shadow: 0px 0px 15px rgba(0,0,0,0.5);
    z-index: 9999;
    overflow: auto;
    padding: 20px;
    opacity: 0;
    transition: 0.1s ease-in-out;
    border-radius: 15px;
}

.notification-center.active {
    opacity: 1;
    transform: translate(-50%, -50%) scale(100%);
}

.modal-overlay {
    pointer-events: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5); /* Semi-transparent background */
    z-index: 9998;
    opacity: 0;
    transition: 0.2s ease-in-out;
}

.modal-overlay.active {
    opacity: 1;
}

.notification-center .close-button {
    position: absolute;
    top: 10px;
    right: 20px;
    font-size: 1.5rem;
    cursor: pointer;
}

.notification-center .notifications {
    padding: 10px;
    overflow-y: auto;
    max-height: calc(80vh - 100px); /* Adjusted for clear all button */
}

.notification-dot {
    animation: dot 2s infinite ease-in-out;
    margin-right: 1%;
}

@keyframes dot {
    from, to {opacity: 1}
    50% {opacity: 0}
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
    margin-right: 50px;
}

.notification p:not(.bullet-point) {
    margin: 0;
    font-size: 0.8rem;
    margin-right: 50px;
}

.notification-section h3 {
    margin-top: 20px;
    margin-bottom: 10px;
    font-size: 1.2rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
    margin-right: 50px;
}

.notification-section {
    margin-bottom: 20px;
}

.clear-all-button {
    position: absolute;
    bottom: 10px;
    right: 10px;
    font-size: 1rem;
    cursor: pointer;
    color: white;
    font-family: Nunito, system-ui, sans-serif;
    background-color: var(--dusk);
    padding: 1%;
    transition: 1s;
}

.clear-all-button:hover, .clear-all-button:active {
    transition: 0.25s;
}
.clear-all-button:hover {
    scale: 110%;
}
.clear-all-button:active {
    scale: 90%;
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

// Create the bottom banner
const bottomBanner = document.createElement('div');
bottomBanner.classList.add('bottom-banner');

const notificationDot = document.createElement("p");
notificationDot.classList.add('notification-dot');
notificationDot.textContent = "•";
bottomBanner.appendChild(notificationDot);

const notificationText = document.createElement('p');
notificationText.classList.add('notification-text');
bottomBanner.appendChild(notificationText);

// Create the "See more" button
const seeMoreButton = document.createElement('button');
seeMoreButton.textContent = 'See more';
bottomBanner.appendChild(seeMoreButton);

document.body.appendChild(bottomBanner);

// Event listener for the "See more" button
seeMoreButton.addEventListener('click', function(event) {
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

// Create the modal overlay
const modalOverlay = document.createElement('div');
modalOverlay.classList.add('modal-overlay');

// Append the notification center and overlay to the body
document.body.appendChild(modalOverlay);
document.body.appendChild(notificationCenter);

// Event listener for the close button
closeButton.addEventListener('click', hideCenter);

// Event listener for clicking on the overlay to close the modal
modalOverlay.addEventListener('click', hideCenter);

// Function to show the notification center
function showCenter() {
    bottomBanner.style.opacity = 0;
    notificationCenter.classList.add('active');
    notificationCenter.style.pointerEvents = 'auto';
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Function to hide the notification center
function hideCenter() {
    bottomBanner.style.opacity = 1;
    notificationCenter.classList.remove('active');
    notificationCenter.style.pointerEvents = 'none';
    modalOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore background scrolling
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
        countdown.textContent = `${timeRemaining} until expiration`;
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
        // Show the bottom banner
        // bottomBanner.style.opacity = 1;
    } else {
        // Hide the bottom banner
        // bottomBanner.style.opacity = 0;
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

// Update the bottom banner text
let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
const today = new Date();
today.setHours(0, 0, 0, 0);

const futureNotifications = notifications.filter(notification => {
    const notificationDate = new Date(notification.date);
    notificationDate.setHours(0, 0, 0, 0);
    return notificationDate >= today;
});

// Sort notifications by date
futureNotifications.sort((a, b) => new Date(a.date) - new Date(b.date));

if (futureNotifications.length <= 0) {
    notificationText.textContent = "No upcoming notifications.";
} else {
    const nearestNotif = futureNotifications[0];
    const nearestNotifDate = new Date(nearestNotif.date);
    nearestNotifDate.setHours(0, 0, 0, 0);

    // Calculate time remaining between today and nearest notification
    const timeDiff = nearestNotifDate - today;
    const threshold = timeDiff * 1.5;  // 150% of time difference

    var shownNotifications = [];

    futureNotifications.forEach(function(notif) {
        const notifDate = new Date(notif.date);
        notifDate.setHours(0, 0, 0, 0);
        
        // Check if the notification is within 150% of the time difference
        if (notifDate - today <= threshold) {
            shownNotifications.push(notif);
        }
    });

    if (shownNotifications.length > 0) {
        let currentIndex = 0;
        
        // Function to update notification text content
        function updateNotificationText() {
            const currentNotif = shownNotifications[currentIndex];
            const timeRemaining = getTimeRemaining(currentNotif.date);
            notificationText.textContent = 'IN ' + timeRemaining.toUpperCase() + ": " + currentNotif.title;

            // Increment index and reset if at the end of the list
            currentIndex = (currentIndex + 1) % shownNotifications.length;

            notificationText.style.transform = 'translateY(-100%)';
            notificationText.style.opacity = '0';

            setTimeout(function(){
                notificationText.style.transform = 'translateY(0%)';
                notificationText.style.opacity = '1';
            },1000);

            setTimeout(function(){
                notificationText.style.transform = 'translateY(100%)';
                notificationText.style.opacity = '0';
            },3500);
        }

        // Start rotating text content every 5 seconds
        updateNotificationText(); // Initial call
        setInterval(updateNotificationText, 5000); // Rotates every 5 seconds
    } else {
        notificationText.textContent = 'IN ' + getTimeRemaining(nearestNotif.date).toUpperCase() + ": " + nearestNotif.title;
    }
}