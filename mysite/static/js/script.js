// Array to hold favorite food items
let favorites = [];

// Function to display stored food items from localStorage
function displayStoredFoodItems(searchTerm = '') {
    const foodItemsUl = document.getElementById('foodItems');
    foodItemsUl.innerHTML = ''; // Clear the previous display

    const foodItems = [];

    // Loop through localStorage and collect stored food items
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const foodItem = JSON.parse(localStorage.getItem(key));

        foodItems.push({ key, ...foodItem });
    }

    // Filter items based on the search term
    const filteredItems = foodItems.filter(item => item.food.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filteredItems.length === 0) {
        foodItemsUl.innerHTML = '<li>No food items stored.</li>';
        return;
    }

    // Create list items for each food
    filteredItems.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>Food:</strong> ${item.food} | 
            <strong>Price:</strong> $${parseFloat(item.price).toFixed(2)} | 
            <strong>Store:</strong> ${item.store}
        `;
        foodItemsUl.appendChild(li);
    });
}

// Function to display food names only (List)
function displayFoodNamesList() {
    const foodNamesUl = document.getElementById('foodNamesList');
    const foodDetailsTableBody = document.querySelector('#foodDetailsTable tbody');

    foodNamesUl.innerHTML = ''; // Clear the previous list
    foodDetailsTableBody.innerHTML = ''; // Clear previous table rows

    // Loop through localStorage and collect stored food items
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const foodItem = JSON.parse(localStorage.getItem(key));

        // Create list item for food name only
        const li = document.createElement('li');
        li.textContent = foodItem.food; // Only display the food name
        foodNamesUl.appendChild(li);

        // Create a row in the table for full details (hidden by default)
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${foodItem.food}</td>
            <td>$${parseFloat(foodItem.price).toFixed(2)}</td>
            <td>${foodItem.store}</td>
        `;
        foodDetailsTableBody.appendChild(tr);
    }
}

// Function to display favorite items
function displayFavorites() {
    const favoritesUl = document.getElementById('favoritesList');
    favoritesUl.innerHTML = ''; // Clear the previous display

    if (favorites.length === 0) {
        favoritesUl.innerHTML = '<li>No favorite items added.</li>';
        return;
    }

    // Create list items for each favorite
    favorites.forEach(item => {
        const li = document.createElement('li');
        
        // Display only the food name
        li.textContent = item.food; 

        // Add a button to each favorite to add the food to the "List"
        const addButton = document.createElement('button');
        addButton.textContent = `Add ${item.food} to List`;
        addButton.addEventListener('click', () => {
            addToList(item.food); // Function to add food name to the list
        });
        
        li.appendChild(addButton); // Append the button to the list item
        favoritesUl.appendChild(li);
    });
}

// Function to add a food name to the "List" list without duplicates
function addToList(foodName) {
    const listOfFoodNames = document.getElementById('foodNamesList');
    
    // Check if the food name is already in the list
    const isFoodInList = Array.from(listOfFoodNames.children).some(li => li.textContent === foodName);
    
    if (!isFoodInList) {
        const li = document.createElement('li');
        li.textContent = foodName;
        listOfFoodNames.appendChild(li);
    } else {
        alert(`${foodName} is already in the list.`);
    }
}

// Handle form submission to store food object in localStorage
document.getElementById('foodForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form from refreshing the page

    // Get values from the form
    const food = document.getElementById('food').value;
    const price = document.getElementById('price').value;
    const store = document.getElementById('store').value || 'aldi';

    // Create food object with the three key-value pairs
    const foodItem = { food, price, store };

    // Save the food object to localStorage (convert to string)
    const key = `food-${food}-${Date.now()}`; // Unique key for each food item
    localStorage.setItem(key, JSON.stringify(foodItem));

    // Update the displayed stored food items
    displayStoredFoodItems();
    displayFoodNamesList(); // Update the food names list

    // Reset the form
    document.getElementById('foodForm').reset();
});

// Handle Add to Favorites button
document.getElementById('addToFavorites').addEventListener('click', function() {
    // Get values from the form
    const food = document.getElementById('food').value;
    const price = document.getElementById('price').value;
    const store = document.getElementById('store').value || 'aldi';

    // Create food object with the three key-value pairs
    const foodItem = { food, price, store };

    // Check if the food already exists in the favorites array
    const isFavoriteExists = favorites.some(fav => fav.food.toLowerCase() === food.toLowerCase());

    if (!isFavoriteExists) {
        favorites.push(foodItem); // Add the food object to the favorites array
        displayFavorites();       // Update the displayed favorites list
    } else {
        alert('This food is already in your favorites.');
    }

    // Reset the form
    document.getElementById('foodForm').reset();
});

// Handle search input
document.getElementById('searchBar').addEventListener('input', function() {
    const searchTerm = document.getElementById('searchBar').value;
    displayStoredFoodItems(searchTerm); // Display items filtered by search term
});

// Handle clear localStorage button
document.getElementById('clearStorage').addEventListener('click', function() {
    localStorage.clear(); // Clear all data from localStorage
    displayStoredFoodItems();  // Update the displayed data
    displayFoodNamesList();    // Update the food names list
});

// Display stored food items on page load
displayStoredFoodItems();
displayFoodNamesList(); // Display the food names list on page load
displayFavorites();     // Display the favorites list on page load
