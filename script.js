let dataset;
let spacesArray = []; // Global array to store all spaces
let printPreview = ``;

fetch("https://benasdom.github.io/tiles-api/static.json")
    .then((res) => res.json())
    .then(res => {
        let data = [...res.data,...res.bhd];
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
function calculateTotalWithData(selectedOption, quantity = 1, spaceName = '',discountAmount) {
    // Get values from dataset
    const squareMeter = parseFloat(selectedOption.dataset.squareMeter);
    const pricePerUnit = parseFloat(selectedOption.dataset.price);
    const quantityNum = parseInt(quantity) || 1;
    
    // Calculate total
    let totalPrice = 0;
    let discounted = 0;
    let discount = 0;
    if (!isNaN(squareMeter) && !isNaN(pricePerUnit)) {
        let boxes = Math.ceil((quantityNum / squareMeter));
        totalPrice = boxes * squareMeter * pricePerUnit;
        discount = (discountAmount/100) * totalPrice;
        discounted = totalPrice - discount;
        estimatedQuantity = boxes * squareMeter;
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
        quantity: estimatedQuantity,
        boxes: Math.ceil((quantityNum / squareMeter)),
        totalPrice: totalPrice,
        discount,
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
    const quantityDiscount = document.getElementById('quantity-discount');
    
    const spaceName = spaceNameInput.value.trim();
    const selectedValue = inputElement.value;
    const qdiscount = quantityDiscount.value;
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
        const discountAmount = parseInt(qdiscount)||0;
        return calculateTotalWithData(selectedOption, quantity, spaceName, discountAmount);
    }
    
    return null;
}

// Update price display and make data available
function updatePriceDisplay() {
    const priceOutput = document.getElementById('price-output');
    const labelsElement = document.querySelector('.labels');
    const selectedData = getCurrentSelectionData();
    
    if (selectedData) {
        // Update the price display
        priceOutput.textContent = `₵${selectedData.totalPrice.toFixed(2)} (Discounted: ₵${selectedData.discountedPrice.toFixed(2)})`;
        
        // Update the labels element with tile information separated by "-"
        if (labelsElement) {
            const labelText = `${selectedData.productName} - ${selectedData.fullDetails.productDimension} - ${selectedData.brandName} - (₵ ${selectedData.fullDetails.productPrice})`;
            labelsElement.textContent = labelText;
        }
        
        // Store the complete data in a global variable
        window.currentProductData = selectedData;
        return selectedData;
    } else {
        priceOutput.textContent = "---";
        if (labelsElement) {
            labelsElement.textContent = '';
        }
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
    let printOut = `
    <div class="ms-box">
    <div class="ms-top">
        <div class="ms-top-left">
            <div class="ms-top-left-image">
                <img width="60px" src="./assets/pic.png"/>
            </div>
            <div class="ms-top-left-text">
            <div class="micasso" contenteditable>M<span class="sso">ICASSO</span></div>
                <strong><span>BEAUTIFUL HOME DECOR</span></strong>
                <span>Helping you make the right decision about your home</span>
            </div>
            
        </div>
        <div class="ms-top-right" contenteditable>QUOTATION
            
        </div>
    </div>
    <br>
    <div class="sub-top">
        <span>COSWAY STREET NEAR HAPPY HOME. HAATSO, GE-191-4780</span>
<a href="https://maps.app.goo.gl/WYFcuX3Bc75Wdg8fA"><span class="a">https://maps.app.goo.gl/WYFcuX3Bc75Wdg8fA</span></a>
<span>0302555103| (+233) 0533991885</span>
<i>info.beautifulhomedecor@gmail.com </i>

    </div>
<div class="invoice-info">
    <div class="buyer-info">
        <div class="buyer">${"TO: "} <span contenteditable>_________________</span></div>
        <div class="date" onload="let today=new Date();this.innerHTML='Date:'+(today.getMonth() + 1)+'/'+today.getDate()+'/'+today.getFullYear()"></div>
     </div>
     

</div>
   <div class="table-box">
        <div class="thead">
            <div class="th">TILE</div>            
            <div class="th">DESCRIPTION</div>            
            <div class="th">SIZE</div>            
            <div class="th reduce">QTY</div>            
            <div class="th reduce">SQM</div>            
            <div class="th">TOTAL SQM</div>            
            <div class="th">UNIT PRICE GHS</div>            
            <div class="th">TOTAL GHS</div>
                </div>`

    let html = `<h3 class="no-print">Spaces Added:</h3><ul>
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
    printOut+=`
      <div class="trows">
            <div class="tr">${space.productName}</div>
<div class="tr">${space.spaceName}</div>
<div class="tr">${space.fullDetails.productDimension}</div>
<div class="tr reduce">${space.boxes} bxs</div>
<div class="tr reduce">${space.squareMeter} m²</div>
<div class="tr alignright">${space.quantity.toFixed(2)} </div>
<div class="tr alignright">${space.fullDetails.productPrice}</div>
<div class="tr alignright">${space.totalPrice.toFixed(2)}</div>
        </div>
      `;
    html += `
        <li class="space-row">
            <span contenteditable class="col name">${space.spaceName}</span>
            <span class="col product">${space.productName}</span>
            <span class="col qty">${space.fullDetails.productTexture}</span>
            <span class="col qty ">${space.quantity} m²</span>
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
    const applieddiscount = spacesArray.reduce((sum, space) => sum + space.discount, 0);
    const grandDiscounted = spacesArray.reduce((sum, space) => sum + space.discountedPrice, 0);
        printOut += `
    <div class="trows">
            <div class="tr hide"></div>
            <div class="tr hide"></div>
            <div class="tr hide"></div>
            <div class="tr reduce hide"></div>
            <div class="tr reduce hide"></div>
            <div class="tr hide"></div>
            <div class="tr alignleft">SUBTOTAL</div>
            <div class="tr alignright">${grandTotal.toFixed(2)}</div>
        </div>
        <div class="trows">
            <div class="tr hide"></div>
            <div class="tr hide"></div>
            <div class="tr hide"></div>
            <div class="tr reduce hide"></div>
            <div class="tr reduce hide"></div>
            <div class="tr hide"></div>
            <div class="tr alignleft">DISCOUNT</div>
            <div class="tr alignright">${applieddiscount.toFixed(2)}</div>
        </div>
        <div class="trows">
            <div class="tr hide"></div>
            <div class="tr hide"></div>
            <div class="tr hide"></div>
            <div class="tr reduce hide"></div>
            <div class="tr reduce hide"></div>
            <div class="tr hide"></div>
            <div class="tr alignleft">GRANDTOTAL</div>
            <div class="tr alignright">${grandDiscounted.toFixed(2)}</div>
        </div>
    </div>
<div class="preped">PREPARED BY: BEAUTIFUL HOME DECOR</div>
<div class="quote" contenteditable>If you have any questions, concerning this quotation, please contact us</div>
<div class="thank-u">WE APPRECIATE YOUR BUSINESS WITH US!</div>
</div>
<div class="footer-box">
    <div class="footer">
        <div class="footer-img">
    <img src="./assets/pic2.png" width="40" alt="">

        </div>
    <div class="foot-text">
        
        <div class="div">
            WE DEAL IN TILES, TILING CONTRACTS, TILING MATERIALS, SANITARY WARE,
        </div>
        <div class="div">
            CEMENT BLOCKS AND PROCUREMENT OF BUILDING MATERIALS FOR PROJECTS,
        </div>
        <div class="div">
            FURNITURE, KTICHENS, DOORS, LOCKS AND HANDLES.
        </div>
    </div>

    </div>    
</div>
    `

    html += `<h4 class="no-print">Grand Total: ₵${grandTotal.toFixed(2)} </h4><h4 class="no-print> Discounted Total: ₵${grandDiscounted.toFixed(2)}</h4>`;
    listContainer.innerHTML = html+printOut;
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
    const quantityDiscount = document.getElementById('quantity-discount');
    const clearListBtn = document.getElementById('clear-list-btn');
    
    // Update price when space name changes
    if (spaceNameInput) {
        spaceNameInput.addEventListener('input', updatePriceDisplay);
        spaceNameInput.addEventListener('change', updatePriceDisplay);
    }

    if (inputElement) {
        inputElement.addEventListener('change', updatePriceDisplay);
        inputElement.addEventListener('input', updatePriceDisplay);
    }
    // Update price when quantity changes
    if (quantityInput) {
        quantityInput.addEventListener('input', updatePriceDisplay);
        quantityInput.addEventListener('change', updatePriceDisplay);
    }
    if (quantityDiscount) {
        quantityDiscount.addEventListener('input', updatePriceDisplay);
        quantityDiscount.addEventListener('change', updatePriceDisplay);
    }
    // Update price when tile selection changes
    
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