// Function to show the speech bubble with item information
function showSpeechBubble(info) {
  const speechBubble = document.querySelector('.speech-bubble') || createSpeechBubble();
  speechBubble.innerHTML = info;
  speechBubble.style.display = 'block';
}

// Function to create and return a speech bubble element
function createSpeechBubble() {
  const speechBubble = document.createElement('div');
  speechBubble.classList.add('speech-bubble');
  document.body.appendChild(speechBubble);
  return speechBubble;
}

// Event handler for product card clicks
function productClickHandler() {
  const name = this.querySelector('.card-title').innerText;
  const description = this.querySelector('.card-text').innerText;
  const info = `<strong>${name}</strong><br>${description}`;
  showSpeechBubble(info);
}

// Function to attach click event listeners to product cards
function attachProductClickListeners() {
  const products = document.querySelectorAll('.product-card');
  products.forEach(product => {
    product.removeEventListener('click', productClickHandler); // Remove existing listener to avoid duplicates
    product.addEventListener('click', productClickHandler); // Attach new listener
  });
}

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
      attachFormSubmitListeners();
      attachProductClickListeners();

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

// Function to attach form submit listeners
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

// Initialize listeners when DOM content is loaded
document.addEventListener("DOMContentLoaded", function() {
  attachFormSubmitListeners();
  attachProductClickListeners();
});
