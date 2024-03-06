// Add event listener to search input field to update products on input change
document.getElementById('searchInput').addEventListener('input', updateProducts);

// Function to update products based on search input
async function updateProducts() {
  // Get the search input value
  const name = document.getElementById('searchInput').value;
  // Select pagination footer element
  const paginationFooter = document.querySelector('.pagination-footer');

  try {
    // Fetch products based on search input
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    // Check if response is ok
    if (response.ok) {
      // Parse response to JSON
      const products = await response.json();
      // Get the container element to display products
      const container = document.getElementById('productsList');
      container.innerHTML = '';
      
      // Create a row for products display
      let row = container.querySelector('.row');
      if (!row) {
        row = document.createElement('div');
        row.className = 'row';
      } else {
        row.innerHTML = '';
      }

      // Iterate through products and create product elements
      products.forEach(product => {
        const productElement = `
          <div class="col-md-4">
            <div class="card product-card">
              <img src="/images/${product.imageName}" class="card-img-top" alt="${product.name}">
              <div class="card-body">
                <h4 class="card-title">${product.name}</h4>
                <p class="card-text"><i>${product.description}</i></p>
                <p class="card-text">$${product.price} &nbsp;|&nbsp; ${product.stock} available</p>
                <form class="mt-3" action="/addToCart" method="POST">
                  <div class="form-row align-items-center">
                    <div class="col-auto">
                      <label class="sr-only" for="quantity-${product.name.replace(/\s+/g, '-')}" >Quantity:</label>
                      <div class="input-group mb-2">
                        <div class="input-group-prepend">
                          <div class="input-group-text">Quantity:</div>
                        </div>
                        <input type="number" class="form-control" id="quantity-${product.name.replace(/\s+/g, '-')}" name="quantity" value="1">
                      </div>
                    </div>
                    <input type="hidden" name="productId" value="${product._id}" data-stock="${product.stock}">
                    <button type="submit" class="btn btn-primary mb-2" id="addToCart">Add to Cart</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        `;

        // Append product element to the row
        row.innerHTML += productElement;
      });
      
      // Append row to the container
      container.appendChild(row);
      // Attach form submit listeners to the newly added forms
      attachFormSubmitListeners();

      // Toggle pagination footer visibility based on search input
      paginationFooter.style.display = name.trim() ? 'none' : 'flex';
      if (!name.trim()) {
        // Reload page if search input is empty
        location.reload();
      }

    } else {
      console.error('Response not ok with status:', response.status);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

// Function to attach form submit listeners
function attachFormSubmitListeners() {
  document.querySelectorAll('form').forEach(form => {
    form.onsubmit = function(e) {
      // Get product stock and quantity input value
      const stock = parseInt(this.querySelector('input[type=hidden][name="productId"]').dataset.stock, 10);
      const quantityInput = this.querySelector('input[type=number][name="quantity"]');
      const quantity = parseInt(quantityInput.value, 10);

      // Get flash messages container
      const flashMessages = document.getElementById('flash-messages');

      // Validate quantity input
      if (quantity < 1) {
        e.preventDefault(); 
        flashMessages.innerHTML = '<div class="alert alert-danger" role="alert">Quantity cannot be less than 1.</div>';
        setTimeout(() => flashMessages.innerHTML = '', 3000);
        return false;
      }

      // Check if quantity exceeds stock
      if (quantity > stock) {
        e.preventDefault(); 
        flashMessages.innerHTML = '<div class="alert alert-danger" role="alert">Exceeds maximum stock.</div>';
        setTimeout(() => flashMessages.innerHTML = '', 3000);
        return false;
      }
      
      return true;
    };
  });
}

// Attach form submit listeners when DOM content is loaded
document.addEventListener("DOMContentLoaded", function() {
  attachFormSubmitListeners();
});
