let dataset;
let spacesArray = []; // Global array to store all spaces

fetch("https://benasdom.github.io/tiles-api/static.json")
    .then((res) => res.json())
    .then(res => {
        let data = res.data;
        dataset = data;
        let mydatalist = document.querySelector("datalist");
        
        // Clear existing options
        mydatalist.innerHTML = '';
        if (dataset && dataset.length > 0) {
            dataset.forEach((item) => {
                let option = document.createElement('option');
                option.value = item.productName;
                option.textContent = `${item.productName} - ${item.squareMeter} - ${item.productDimension} - ${item.brandName} - ${item.productType} - ${item.productPrice}`;
                
                // Store ALL data attributes
                option.dataset.brand = item.brandName;
                option.dataset.type = item.productType;
                option.dataset.price = item.productPrice;
                option.dataset.squareMeter = item.squareMeter;
                option.dataset.dimension = item.productDimension;
                option.dataset.productName = item.productName;
                option.dataset.fullData = JSON.stringify(item); // Store complete object as JSON string
                
                mydatalist.appendChild(option);
            });
        } else {
            mydatalist.innerHTML = `<option value="loading...">loading...</option>`;
        }
    })
    .catch(error => {
        console.error("Error fetching data:", error);
        let mydatalist = document.querySelector("datalist");
        mydatalist.innerHTML = `<option value="error">Error loading data</option>`;
    });

// Function to calculate total price and return complete data object
function calculateTotalWithData(selectedOption, quantity = 1, spaceName = '') {
    // Get values from dataset
    const squareMeter = parseFloat(selectedOption.dataset.squareMeter);
    const pricePerUnit = parseFloat(selectedOption.dataset.price);
    const quantityNum = parseInt(quantity) || 1;
    
    // Calculate total
    let totalPrice = 0;
    let discounted = 0;
    if (!isNaN(squareMeter) && !isNaN(pricePerUnit)) {
        let boxes = Math.ceil((quantityNum / squareMeter));
        totalPrice = boxes * squareMeter * pricePerUnit;
        discounted = totalPrice * (0.9);
    }
    
    // Get all data from the option element
    const productData = {
        spaceName: spaceName || 'Unnamed Space', // Add space name with default
        productName: selectedOption.dataset.productName,
        brandName: selectedOption.dataset.brand,
        productType: selectedOption.dataset.type,
        productDimension: selectedOption.dataset.dimension,
        squareMeter: squareMeter,
        pricePerUnit: pricePerUnit,
        quantity: quantityNum,
        boxes: Math.ceil((quantityNum / squareMeter)),
        totalPrice: totalPrice,
        discountedPrice: discounted,
        timestamp: new Date().toISOString() // Add timestamp for tracking
    };
    
    // If fullData was stored as JSON, parse and include it
    if (selectedOption.dataset.fullData) {
        try {
            const fullData = JSON.parse(selectedOption.dataset.fullData);
            productData.fullDetails = fullData;
        } catch (e) {
            console.error("Error parsing fullData:", e);
        }
    }
    
    return productData;
}

// Function to get current selection with all data
function getCurrentSelectionData() {
    const spaceNameInput = document.getElementById('space-name-input');
    const inputElement = document.getElementById('tile-input');
    const quantityInput = document.getElementById('quantity-input');
    
    const spaceName = spaceNameInput.value.trim();
    const selectedValue = inputElement.value;
    const datalist = document.querySelector('datalist');
    const options = datalist.querySelectorAll('option');
    
    // Find the matching option
    let selectedOption = null;
    for (let option of options) {
        if (option.value === selectedValue) {
            selectedOption = option;
            break;
        }
    }
    
    if (selectedOption && selectedOption.dataset.squareMeter && selectedOption.dataset.price) {
        const quantity = parseInt(quantityInput.value) || 1;
        return calculateTotalWithData(selectedOption, quantity, spaceName);
    }
    
    return null;
}

// Update price display and make data available
function updatePriceDisplay() {
    const priceOutput = document.getElementById('price-output');
    const selectedData = getCurrentSelectionData();
    
    if (selectedData) {
        // Update the price display
        priceOutput.textContent = `₵${selectedData.totalPrice.toFixed(2)} (Discounted: ₵${selectedData.discountedPrice.toFixed(2)})`;
        
        // Store the complete data in a global variable
        window.currentProductData = selectedData;
        
        return selectedData;
    } else {
        priceOutput.textContent = "---";
        window.currentProductData = null;
        return null;
    }
}

// Function to add current space to the array
function addSpaceToList() {
    const selectedData = getCurrentSelectionData();
    
    if (selectedData) {
        // Add to the global array
        spacesArray.push(selectedData);
        
        // Update the display
        updateSpacesListDisplay();
        
        // Optional: Clear the form for next entry (or keep it)
        // clearForm();
        
        // Show confirmation
        alert(`"${selectedData.spaceName}" added to the list! Total spaces: ${spacesArray.length}`);
        
        console.log("Added to array:", selectedData);
    } else {
        alert("Please select a valid tile and enter a space name before adding.");
    }
}

// Function to display the list of spaces
function updateSpacesListDisplay() {
    const listContainer = document.getElementById('spaces-list');
    if (!listContainer) return;
    
    if (spacesArray.length === 0) {
        listContainer.innerHTML = '<p>No spaces added yet.</p>';
        return;
    }
    
    let html = `<h3 >Spaces Added:</h3><ul>
            <li class="space-row">
            <span class="col product">Product Name</span>
            <span class="col qty"> Texture </span>
            <span class="col qty">Space Area(m²)</span>
            <span class="col qty">SQM (m²)</span>
            <span class="col boxes"> Boxes </span>
            <span class="col total">Total Price</span>
            <span class="col discounted">After Discount</span>
            <span class="remove-btn">Action</span>
        </li>`

    ;
    
 spacesArray.forEach((space, index) => {
    html += `
        <li class="space-row">
            <span contenteditable class="col name">${space.spaceName}</span>
            <span class="col product">${space.productName}</span>
            <span class="col qty">${space.fullDetails.productTexture}</span>
            <span class="col qty">${space.quantity} m²</span>
            <span class="col qty">${space.squareMeter} m²</span>
            <span class="col boxes">${space.boxes} boxes</span>
            <span class="col total">₵${space.totalPrice.toFixed(2)}</span>
            <span class="col discounted">₵${space.discountedPrice.toFixed(2)}</span>
            <button onclick="removeSpace(${index})" class="remove-btn">Remove</button>
        </li>
    `;
});

    
    html += '</ul>';
    
    // Calculate totals
    const grandTotal = spacesArray.reduce((sum, space) => sum + space.totalPrice, 0);
    const grandDiscounted = spacesArray.reduce((sum, space) => sum + space.discountedPrice, 0);
    
    html += `<h4>Grand Total: ₵${grandTotal.toFixed(2)} </h4><h4> Discounted Total: ₵${grandDiscounted.toFixed(2)}</h4>`;
    
    listContainer.innerHTML = html;
}

// Function to remove a space from the array
function removeSpace(index) {
    if (index >= 0 && index < spacesArray.length) {
        const removedSpace = spacesArray.splice(index, 1)[0];
        updateSpacesListDisplay();
        console.log(`Removed: ${removedSpace.spaceName}`);
    }
}

// Function to view all spaces in console
function viewAllSpaces() {
    if (spacesArray.length === 0) {
        console.log("No spaces in the array.");
        alert("No spaces have been added yet.");
        return;
    }
    
    console.log("=== ALL SPACES ===");
    console.log("Total spaces:", spacesArray.length);
    
    // Log each space
    spacesArray.forEach((space, index) => {
        console.log(`\nSpace #${index + 1}:`);
        console.log(space);
    });
    
    // Calculate and log totals
    const grandTotal = spacesArray.reduce((sum, space) => sum + space.totalPrice, 0);
    const grandDiscounted = spacesArray.reduce((sum, space) => sum + space.discountedPrice, 0);
    
    console.log("\n=== TOTALS ===");
    console.log(`Grand Total: ₵${grandTotal.toFixed(2)}`);
    console.log(`Discounted Total: ₵${grandDiscounted.toFixed(2)}`);
    
    // You can also show this in an alert
    alert(`Viewing ${spacesArray.length} spaces in console.\nCheck browser console (F12) for details.`);
}

// Function to clear all spaces
function clearAllSpaces() {
    if (spacesArray.length === 0) {
        alert("The list is already empty.");
        return;
    }
    
    if (confirm(`Are you sure you want to remove all ${spacesArray.length} spaces?`)) {
        spacesArray = [];
        updateSpacesListDisplay();
        console.log("All spaces cleared.");
        alert("All spaces have been removed.");
    }
}

// Optional: Function to clear the form
function clearForm() {
    document.getElementById('space-name-input').value = '';
    document.getElementById('tile-input').value = '';
    document.getElementById('quantity-input').value = '1';
    document.getElementById('price-output').textContent = '---';
    window.currentProductData = null;
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    const spaceNameInput = document.getElementById('space-name-input');
    const inputElement = document.getElementById('tile-input');
    const quantityInput = document.getElementById('quantity-input');
    const addSpaceBtn = document.getElementById('add-space-btn');
    const viewListBtn = document.getElementById('view-list-btn');
    const clearListBtn = document.getElementById('clear-list-btn');
    
    // Update price when space name changes
    if (spaceNameInput) {
        spaceNameInput.addEventListener('input', updatePriceDisplay);
        spaceNameInput.addEventListener('change', updatePriceDisplay);
    }
    
    // Update price when tile selection changes
    if (inputElement) {
        inputElement.addEventListener('change', updatePriceDisplay);
        inputElement.addEventListener('input', updatePriceDisplay);
    }
    
    // Update price when quantity changes
    if (quantityInput) {
        quantityInput.addEventListener('input', updatePriceDisplay);
        quantityInput.addEventListener('change', updatePriceDisplay);
    }
    
    // Button event listeners
    if (addSpaceBtn) {
        addSpaceBtn.addEventListener('click', addSpaceToList);
    }
    
    if (viewListBtn) {
        viewListBtn.addEventListener('click', viewAllSpaces);
    }
    
    if (clearListBtn) {
        clearListBtn.addEventListener('click', clearAllSpaces);
    }
    
    // Initialize the display
    updateSpacesListDisplay();
});

// Make functions available globally for onclick attributes
window.removeSpace = removeSpace;