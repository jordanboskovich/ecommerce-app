document.getElementById('searchInput').addEventListener('input', updateProducts);

async function updateProducts() {
  const name = document.getElementById('searchInput').value;
  const paginationFooter = document.querySelector('.pagination-footer');

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const products = await response.json();
      const container = document.getElementById('productsList');
      container.innerHTML = '';
      
      let row = container.querySelector('.row');
      if (!row) {
        row = document.createElement('div');
        row.className = 'row';
      } else {
        row.innerHTML = '';
      }

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

        row.innerHTML += productElement;
      });
      
      container.appendChild(row);
      attachFormSubmitListeners(); // Attach event listeners to the newly added forms

      paginationFooter.style.display = name.trim() ? 'none' : 'flex';
      if (!name.trim()) {
        location.reload();
      }

    } else {
      console.error('Response not ok with status:', response.status);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

function attachFormSubmitListeners() {
  document.querySelectorAll('form').forEach(form => {
    form.onsubmit = function(e) {
      const stock = parseInt(this.querySelector('input[type=hidden][name="productId"]').dataset.stock, 10);
      const quantityInput = this.querySelector('input[type=number][name="quantity"]');
      const quantity = parseInt(quantityInput.value, 10);

      const flashMessages = document.getElementById('flash-messages');

      if (quantity < 1) {
        e.preventDefault(); 
        flashMessages.innerHTML = '<div class="alert alert-danger" role="alert">Quantity cannot be less than 1.</div>';
        setTimeout(() => flashMessages.innerHTML = '', 3000);
        return false;
      }

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

document.addEventListener("DOMContentLoaded", function() {
  attachFormSubmitListeners();
});


