// Array to hold favorite food items
let favorites = [];

// Function to display stored food items from localStorage
function displayStoredFoodItems(searchTerm = '') {

    const foodItems = [];

    // Loop through localStorage and collect stored food items
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('food-')) {
            const foodItem = JSON.parse(localStorage.getItem(key));
            foodItems.push({ key, ...foodItem });
        }
    }

    console.log(foodItems);

    // Filter items based on the search term
    const filteredItems = foodItems.filter(item => item.food.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filteredItems.length === 0) {
        document.querySelector("#nothing-stored").style.display = 'block';
        return;
    }
}

// Function to display food names only (List) using the template
function displayFoodNamesList() {
    const foodNamesUl = document.getElementById('foodNamesList');
    const foodDetailsTableBody = document.querySelector('#foodDetailsTable tbody');
    const itemTemplate = document.getElementById('item-template');

    foodNamesUl.innerHTML = ''; // Clear the previous list
    foodDetailsTableBody.innerHTML = ''; // Clear previous table rows

    // Loop through localStorage and collect stored food items
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('food-')) {
            const foodItem = JSON.parse(localStorage.getItem(key));

            // Clone the template for each food item
            const clonedItem = itemTemplate.cloneNode(true);
            clonedItem.style.display = 'flex'; // Make sure the cloned item is visible
            clonedItem.querySelector('.name').textContent = foodItem.food; // Set the food name
            clonedItem.querySelector('.price').textContent = `$${parseFloat(foodItem.price).toFixed(2)}`; // Set the price
            clonedItem.querySelector('.favorite').addEventListener('click', () => addToList(foodItem.food)); // Add to list functionality

            foodNamesUl.appendChild(clonedItem);

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
    let price = 0;
    let store = 0;

    // Instead of grabbing price and store as user input, refer to data
    fetch('/get_price_store', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ food:food })
    }).then(response => response.json())
    .then(data => {
        console.log('Success:', data);

        // Check if the status is 'success'
        if (data.status === 'success') {
            // Extracting price and store from the response
            price = data.price; // Get the minimum price
            store = data.store; // Get the store name

            // Log or display the minimum price and store name
            console.log('Minimum Price:', price);
            console.log('Store:', store);


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
            
            // Optionally alert the user with the details
            // alert(`Grocery list submitted successfully!\nMinimum Price: ${minPrice}\nStore: ${storeName}`);
        } else {
            console.log('Food not added');
        }




    }).catch(error => {
        console.error('Error:', error);
    });

    
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

// Handle clear localStorage button
document.getElementById('clearStorage').addEventListener('click', function() {
    // Collect keys to remove
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('food-')) {
            keysToRemove.push(key);
        }
    }
    // Remove the collected keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    displayStoredFoodItems();  // Update the displayed data
    displayFoodNamesList();    // Update the food names list
});

// Display stored food items on page load
displayStoredFoodItems();
displayFoodNamesList(); // Display the food names list on page load
displayFavorites();     // Display the favorites list on page load
