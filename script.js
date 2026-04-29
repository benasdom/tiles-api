let dataset;
let currentState = JSON.parse(localStorage?.getItem("state")) ?? "";
let spacesArray = currentState?.stateData ?? [];
let extrasArray = currentState?.extrasData ?? []; // Global array for non-tile items
console.log(spacesArray);
let printPreview = ``;

fetch("https://benasdom.github.io/tiles-api/static.json")
    .then((res) => res.json())
    .then(res => {
        let data = [...res.data, ...res.bhd];
        dataset = data;
        let mydatalist = document.querySelector("datalist#tiles");

        mydatalist.innerHTML = '';
        if (dataset && dataset.length > 0) {
            dataset.forEach((item) => {
                let option = document.createElement('option');
                option.textContent = `${item.productName} - ${item.squareMeter} - ${item.productDimension} - ${item.brandName} - ${item.productType} - ${item.productPrice}`;
                option.dataset.brand = item.brandName;
                option.dataset.type = item.productType;
                option.dataset.price = item.productPrice;
                option.dataset.squareMeter = item.squareMeter;
                option.dataset.dimension = item.productDimension;
                option.dataset.productName = item.productName;
                option.dataset.fullData = JSON.stringify(item);
                mydatalist.appendChild(option);
            });
        } else {
            mydatalist.innerHTML = `<option value="loading...">loading...</option>`;
        }
    })
    .catch(error => {
        console.error("Error fetching data:", error);
        let mydatalist = document.querySelector("datalist#tiles");
        mydatalist.innerHTML = `<option value="error">Error loading data</option>`;
    });

function calculateTotalWithData(selectedOption, quantity = 1, spaceName = '', discountAmount) {
    const squareMeter = parseFloat(selectedOption.dataset.squareMeter);
    const pricePerUnit = parseFloat(selectedOption.dataset.price);
    const brandName = selectedOption.dataset.brand;
    const quantityNum = parseInt(quantity) || 1;

    let totalPrice = 0;
    let discounted = 0;
    let discount = 0;
    let estimatedQuantity = 0;
    if (!isNaN(squareMeter) && !isNaN(pricePerUnit)) {
        let boxes = Math.ceil((quantityNum / squareMeter));
        let VatInclusiveTotal = (boxes * squareMeter * pricePerUnit);
        totalPrice = /micasso/i.test(brandName) ? VatInclusiveTotal : VatInclusiveTotal / 1.2;
        discount = (discountAmount / 100) * totalPrice;
        discounted = totalPrice - discount;
        estimatedQuantity = boxes * squareMeter;
    }

    const productData = {
        spaceName: spaceName || 'Unnamed Space',
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
        timestamp: new Date().toISOString()
    };

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

function getCurrentSelectionData() {
    const spaceNameInput = document.getElementById('space-name-input');
    const inputElement = document.getElementById('tile-input');
    const quantityInput = document.getElementById('quantity-input');
    const quantityDiscount = document.getElementById('quantity-discount');

    const spaceName = spaceNameInput.value.trim();
    const selectedValue = inputElement.value;
    const qdiscount = quantityDiscount.value;
    const datalist = document.querySelector('datalist#tiles');
    const options = datalist.querySelectorAll('option');

    let selectedOption = null;
    for (let option of options) {
        if (option.value === selectedValue) {
            selectedOption = option;
            break;
        }
    }

    if (selectedOption && selectedOption.dataset.squareMeter && selectedOption.dataset.price) {
        const quantity = parseInt(quantityInput.value) || 1;
        const discountAmount = parseInt(qdiscount) || 0;
        return calculateTotalWithData(selectedOption, quantity, spaceName, discountAmount);
    }

    return null;
}

function updatePriceDisplay() {
    const priceOutput = document.getElementById('price-output');
    const labelsElement = document.querySelector('.labels');
    const selectedData = getCurrentSelectionData();

    if (selectedData) {
        priceOutput.textContent = `₵${selectedData.totalPrice.toFixed(2)} (Discounted: ₵${selectedData.discountedPrice.toFixed(2)})`;

        if (labelsElement) {
            let pic = (selectedData?.fullDetails?.productImages?.length > 0)
                ? selectedData.fullDetails.productImages[0]
                : "";
            const labelText = `
            <span class='br'>${selectedData.brandName}</span> - <span class='br'>${selectedData.productName}</span> - <span class='br'>(${selectedData.fullDetails.productDimension})</span> - <span class='br'>(${selectedData.fullDetails.squareMeter}m2)</span> - <span class='br'>(₵ ${selectedData.fullDetails.productPrice}</span>)
            <span><a class='link' href='${!/http/.test(pic) ? 'https://benasdom.github.io/tiles-api' + pic : pic}' target='_blank'>
            <img src='${!/http/.test(pic) ? 'https://benasdom.github.io/tiles-api' + pic : pic}' class='imgshow' /></a></span>
            `;
            labelsElement.innerHTML = labelText;
        }

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

function addSpaceToList() {
    const selectedData = getCurrentSelectionData();

    if (selectedData) {
        spacesArray.push(selectedData);
        updateSpacesListDisplay();
        alert(`"${selectedData.spaceName}" added to the list! Total spaces: ${spacesArray.length}`);
        console.log("Added to array:", selectedData);
    } else {
        alert("Please select a valid tile and enter a space name before adding.");
    }
}

// ─── NON-TILE EXTRAS ───────────────────────────────────────────────────────────

function getExtraItemData() {
    const nameInput = document.getElementById('extra-item-name');
    const qtyInput = document.getElementById('extra-item-qty');
    const priceInput = document.getElementById('extra-item-price');
    const discountInput = document.getElementById('extra-item-discount');

    const itemName = nameInput.value.trim();
    const quantity = parseFloat(qtyInput.value) || 1;
    const unitPrice = parseFloat(priceInput.value) || 0;
    const discountPct = parseFloat(discountInput.value) || 0;

    if (!itemName || unitPrice <= 0) return null;

    const totalPrice = quantity * unitPrice;
    const discount = (discountPct / 100) * totalPrice;
    const discountedPrice = totalPrice - discount;

    return {
        itemName,
        quantity,
        unitPrice,
        totalPrice,
        discountPct,
        discount,
        discountedPrice,
        timestamp: new Date().toISOString()
    };
}

function updateExtraPriceDisplay() {
    const output = document.getElementById('extra-price-output');
    if (!output) return;
    const nameInput = document.getElementById('extra-item-name');
    const qtyInput = document.getElementById('extra-item-qty');
    const priceInput = document.getElementById('extra-item-price');
    const discountInput = document.getElementById('extra-item-discount');

    const quantity = parseFloat(qtyInput.value) || 0;
    const unitPrice = parseFloat(priceInput.value) || 0;
    const discountPct = parseFloat(discountInput.value) || 0;

    if (unitPrice > 0 && quantity > 0) {
        const total = quantity * unitPrice;
        const discounted = total - (discountPct / 100) * total;
        output.textContent = `₵${total.toFixed(2)} (Discounted: ₵${discounted.toFixed(2)})`;
    } else {
        output.textContent = '---';
    }
}

function addExtraItem() {
    const data = getExtraItemData();
    if (!data) {
        alert("Please enter a valid item name and price.");
        return;
    }
    extrasArray.push(data);
    updateSpacesListDisplay();
    alert(`"${data.itemName}" added to extras! Total extras: ${extrasArray.length}`);
    console.log("Extra item added:", data);
}

function removeExtra(index) {
    if (index >= 0 && index < extrasArray.length) {
        const removed = extrasArray.splice(index, 1)[0];
        updateSpacesListDisplay();
        console.log(`Removed extra: ${removed.itemName}`);
    }
}

// ─── MAIN DISPLAY ──────────────────────────────────────────────────────────────

function updateSpacesListDisplay() {
    const listContainer = document.getElementById('spaces-list');
    if (!listContainer) return;

    let today = new Date();
    let mydated = (today.getDate()) + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();

    // ── UI list (no-print) ──────────────────────────────────────────────────────
    let html = `<h3 class="no-print">Spaces Added:</h3><ul>
        <li class="space-row">
            <span class="col product">Space Name</span>
            <span class="col qty">Tile Name</span>
            <span class="col qty">Space Area(m²)</span>
            <span class="col qty">SQM (m²)</span>
            <span class="col boxes">Boxes</span>
            <span class="col total">Total Price</span>
            <span class="col discounted">After Discount</span>
            <span class="remove-btn">Action</span>
        </li>`;

    if (spacesArray.length === 0 && extrasArray.length === 0) {
        html += '<p>No items added yet.</p>';
    }

    spacesArray.forEach((space, index) => {
        html += `
        <li class="space-row">
            <span contenteditable class="col name">${space.spaceName}</span>
            <span class="col product">${space.productName}</span>
            <span class="col qty">${space.quantity.toFixed(2)} m²</span>
            <span class="col qty">${space.squareMeter} m²</span>
            <span class="col boxes">${space.boxes} boxes</span>
            <span class="col total">₵${(! /micasso/i.test(space.brandName)?space.totalPrice * 1.2:space.totalPrice).toFixed(2)}</span>
            <span class="col discounted">₵${space.discountedPrice.toFixed(2)}</span>
            <button onclick="removeSpace(${index})" class="remove-btn">Remove</button>
        </li>`;
    });

    if (extrasArray.length > 0) {
        html += `<li class="space-row extras-header no-print"><span style="font-weight:bold;padding:4px 0;">── Other Items ──</span></li>`;
        extrasArray.forEach((extra, index) => {
            html += `
            <li class="space-row extra-row">
                <span contenteditable class="col name">${extra.itemName}</span>
                <span class="col product">—</span>
                <span class="col qty">—</span>
                <span class="col qty">Qty: ${extra.quantity}</span>
                <span class="col boxes">—</span>
                <span class="col qty">—</span>
                <span class="col total">₵${extra.totalPrice.toFixed(2)}</span>
                <span class="col discounted">₵${extra.discountedPrice.toFixed(2)}</span>
                <button onclick="removeExtra(${index})" class="remove-btn">Remove</button>
            </li>`;
        });
    }

    html += '</ul>';
    // Totals
    const grandTotal = spacesArray.reduce((sum, s) => sum + ((! /micasso/i.test(s.brandName)?s.totalPrice / 1.2:s.totalPrice)), 0);
    const totalBoxes = spacesArray.reduce((sum, s) => sum + s.boxes, 0);
    const totalQuantity = spacesArray.reduce((sum, s) => sum + s.quantity, 0);
    const appliedDiscount = spacesArray.reduce((sum, s) => sum + s.discount, 0);
    const grandDiscounted = spacesArray.reduce((sum, s) => sum + s.discountedPrice, 0);

    const extrasTotal = extrasArray.reduce((sum, e) => sum + e.totalPrice, 0);
    const extrasDiscount = extrasArray.reduce((sum, e) => sum + e.discount, 0);
    const extrasDiscounted = extrasArray.reduce((sum, e) => sum + e.discountedPrice, 0);

    const combinedTotal = grandTotal + extrasTotal;
    const combinedDiscount = appliedDiscount + extrasDiscount;
    const combinedDiscounted = grandDiscounted + extrasDiscounted;

    // Save state
    localStorage?.setItem("state", JSON.stringify({ stateData: spacesArray, extrasData: extrasArray }));

    // ── PRINT / INVOICE ─────────────────────────────────────────────────────────
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
        <div class="ms-top-right"><span class="f-end" contenteditable>PROFORMA</span>
            <span class="inv-id" contenteditable>invoice#</span>
        </div>
    </div>
    <br>
    <div class="sub-top">
        <span>COSWAY STREET NEAR HAPPY HOME. HAATSO, GE-191-4780</span>
        <div href="https://maps.app.goo.gl/WYFcuX3Bc75Wdg8fA"><span class="a">https://maps.app.goo.gl/WYFcuX3Bc75Wdg8fA</span></div>
        <span>0302555103| (+233) 0533991885</span>
        <i>info.beautifulhomedecor@gmail.com</i>
    </div>
    <div class="invoice-info">
        <div class="buyer-info">
            <div class="buyer">${"TO: "} <span contenteditable>_________________</span></div>
            <div class="date" contenteditable>DATE: ${mydated}</div>
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
        </div>`;

    // Tile rows
    spacesArray.forEach((space) => {
        printOut += `
        <div class="trows">
            <div class="tr">${space.productName}</div>
            <div class="tr" contenteditable>${space.spaceName}</div>
            <div class="tr">${space.fullDetails.productDimension}</div>
            <div class="tr reduce">${space.squareMeter} m²</div>
            <div class="tr reduce">${space.boxes} bxs</div>
            <div class="tr alignright">${space.quantity.toFixed(2)}</div>
            <div class="tr alignright">${space.fullDetails.productPrice}</div>
            <div class="tr alignright">${(( /micasso/i.test(space.brandName)?space.totalPrice:space.totalPrice * 1.2)).toFixed(2)}</div>
        </div>`;
    });

    // Extra (non-tile) rows — after tile rows
    if (extrasArray.length > 0) {
        // printOut += `
        // <div class="trows extras-section-header">
        //     <div class="tr" style="font-weight:bold;grid-column:1/-1;text-align:left;padding-left:8px;">OTHER ITEMS</div>
        // </div>`;
        extrasArray.forEach((extra) => {
            printOut += `
            <div class="trows extra-invoice-row">
                <div class="tr " contenteditable>${extra.itemName}</div>
                <div class="tr hideleft" contenteditable>—</div>
                <div class="tr hideleft" contenteditable>—</div>
                <div class="tr reduce">${extra.quantity}</div>
                <div class="tr reduce">—</div>
                <div class="tr alignright">—</div>
                <div class="tr alignright">${extra.unitPrice.toFixed(2)}</div>
                <div class="tr alignright">${extra.totalPrice.toFixed(2)}</div>
            </div>`;
        });
    }

    // Totals rows
    printOut += `
        <div class="trows">
            <div class="tr">TOTAL SQM &amp; BOX</div>
            <div class="tr"></div>
            <div class="tr"></div>
            <div class="tr reduce"></div>
            <div class="tr reduce">${totalBoxes} bxs</div>
            <div class="tr alignright">${totalQuantity.toFixed(2)}</div>
            <div class="tr alignright"></div>
            <div class="tr alignright"></div>
        </div>
        <div class="trows">
            <div class="tr hide"></div><div class="tr hide"></div><div class="tr hide"></div>
            <div class="tr reduce hide"></div><div class="tr reduce hide"></div><div class="tr hide"></div>
            <div class="tr alignleft">SUBTOTAL</div>
            <div class="tr alignright">${(combinedDiscounted+combinedDiscount).toFixed(2)}</div>
        </div>
        <div class="trows">
            <div class="tr hide"></div><div class="tr hide"></div><div class="tr hide"></div>
            <div class="tr reduce hide"></div><div class="tr reduce hide"></div><div class="tr hide"></div>
            <div class="tr alignleft">DISCOUNT</div>
            <div class="tr alignright">${combinedDiscount.toFixed(2)}</div>
        </div>
        <div class="trows">
            <div class="tr hide"></div><div class="tr hide"></div><div class="tr hide"></div>
            <div class="tr reduce hide"></div><div class="tr reduce hide"></div><div class="tr hide"></div>
            <div class="tr alignleft">PRE-TAX TOTAL</div>
            <div class="tr alignright">${(combinedDiscounted).toFixed(2)}</div>
        </div>
        <div class="trows">
            <div class="tr hide"></div><div class="tr hide"></div><div class="tr hide"></div>
            <div class="tr reduce hide"></div><div class="tr reduce hide"></div><div class="tr hide"></div>
            <div class="tr alignleft petit">
                <p>NHIS (2.5%)</p>
                <p>GETFUND (2.5%)</p>
                <p>VAT (15%)</p>
            </div>
            <div class="tr alignright petit2">
                <p>${((0.025) * combinedDiscounted).toFixed(2)}</p>
                <p>${((0.025) * combinedDiscounted).toFixed(2)}</p>
                <p>${((0.15) * combinedDiscounted).toFixed(2)}</p>
            </div>
        </div>
        <div class="trows">
            <div class="tr hide"></div><div class="tr hide"></div><div class="tr hide"></div>
            <div class="tr reduce hide"></div><div class="tr reduce hide"></div><div class="tr hide"></div>
            <div class="tr alignleft">GRANDTOTAL</div>
            <div class="tr alignright">${(combinedDiscounted+ (0.2 * combinedDiscounted)).toFixed(2)}</div>
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
                <div class="div">WE DEAL IN TILES, TILING CONTRACTS, TILING MATERIALS, SANITARY WARE,</div>
                <div class="div">CEMENT BLOCKS AND PROCUREMENT OF BUILDING MATERIALS FOR PROJECTS,</div>
                <div class="div">FURNITURE, KTICHENS, DOORS, LOCKS AND HANDLES.</div>
            </div>
        </div>
    </div>`;

    html += `<h4 class="no-print">Grand Total: ₵${combinedTotal.toFixed(2)}</h4><h4 class="no-print">Discounted Total: ₵${combinedDiscounted.toFixed(2)}</h4>`;
    listContainer.innerHTML = html + printOut;
}

function removeSpace(index) {
    if (index >= 0 && index < spacesArray.length) {
        const removedSpace = spacesArray.splice(index, 1)[0];
        updateSpacesListDisplay();
        console.log(`Removed: ${removedSpace.spaceName}`);
    }
}

function viewAllSpaces() {
    if (spacesArray.length === 0 && extrasArray.length === 0) {
        alert("No items have been added yet.");
        return;
    }
    console.log("=== ALL SPACES ===", spacesArray);
    console.log("=== ALL EXTRAS ===", extrasArray);
    alert(`Viewing ${spacesArray.length} tile spaces and ${extrasArray.length} extra items in console.`);
}

function clearAllSpaces() {
    if (spacesArray.length === 0 && extrasArray.length === 0) {
        alert("The list is already empty.");
        return;
    }
    if (confirm(`Are you sure you want to remove all ${spacesArray.length + extrasArray.length} items?`)) {
        spacesArray = [];
        extrasArray = [];
        updateSpacesListDisplay();
        console.log("All items cleared.");
        alert("All items have been removed.");
    }
    localStorage.clear();
}

function clearForm() {
    document.getElementById('space-name-input').value = '';
    document.getElementById('tile-input').value = '';
    document.getElementById('quantity-input').value = '1';
    document.getElementById('price-output').textContent = '---';
    window.currentProductData = null;
}

document.addEventListener('DOMContentLoaded', function () {
    const spaceNameInput = document.getElementById('space-name-input');
    const inputElement = document.getElementById('tile-input');
    const quantityInput = document.getElementById('quantity-input');
    const addSpaceBtn = document.getElementById('add-space-btn');
    const viewListBtn = document.getElementById('view-list-btn');
    const quantityDiscount = document.getElementById('quantity-discount');
    const clearListBtn = document.getElementById('clear-list-btn');

    // Extra item listeners
    const addExtraBtn = document.getElementById('add-extra-btn');
    const extraName = document.getElementById('extra-item-name');
    const extraQty = document.getElementById('extra-item-qty');
    const extraPrice = document.getElementById('extra-item-price');
    const extraDiscount = document.getElementById('extra-item-discount');

    if (spaceNameInput) {
        spaceNameInput.addEventListener('input', updatePriceDisplay);
        spaceNameInput.addEventListener('change', updatePriceDisplay);
    }
    if (inputElement) {
        inputElement.addEventListener('change', updatePriceDisplay);
        inputElement.addEventListener('input', updatePriceDisplay);
    }
    if (quantityInput) {
        quantityInput.addEventListener('input', updatePriceDisplay);
        quantityInput.addEventListener('change', updatePriceDisplay);
    }
    if (quantityDiscount) {
        quantityDiscount.addEventListener('input', updatePriceDisplay);
        quantityDiscount.addEventListener('change', updatePriceDisplay);
    }
    if (addSpaceBtn) addSpaceBtn.addEventListener('click', addSpaceToList);
    if (viewListBtn) viewListBtn.addEventListener('click', viewAllSpaces);
    if (clearListBtn) clearListBtn.addEventListener('click', clearAllSpaces);

    // Extra item real-time price preview
    [extraName, extraQty, extraPrice, extraDiscount].forEach(el => {
        if (el) {
            el.addEventListener('input', updateExtraPriceDisplay);
            el.addEventListener('change', updateExtraPriceDisplay);
        }
    });

    if (addExtraBtn) addExtraBtn.addEventListener('click', addExtraItem);

    updateSpacesListDisplay();
});

window.removeSpace = removeSpace;
window.removeExtra = removeExtra;