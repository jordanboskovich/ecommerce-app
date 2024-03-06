// Importing required modules and dependencies
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

// Controller function to display products
export const displayProducts = async (req, res) => {
  // Parse page number from request query, default to 1 if not provided
  const page = parseInt(req.query.page) || 1; 
  // Count total number of products
  const totalProducts = await Product.countDocuments();
  // Calculate last page based on total number of products and page size
  const lastPage = Math.ceil(totalProducts / 9);
  
  // Find products for the current page, sorted by name, limit to 9 products per page
  const products = await Product.find()
    .sort({name: 1})
    .limit(9)
    .skip((page - 1) * 9);
  
  // Render index page with product data and pagination information
  res.render('index', {title: 'Product List', products, page, lastPage}); 
};

// Controller function for home page
export const home = async (req, res) => {
  // Parse page number from request query, default to 1 if not provided
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 9; 
  // Count total number of products
  const totalProducts = await Product.countDocuments(); 
  // Calculate last page based on total number of products and page size
  const lastPage = Math.ceil(totalProducts / pageSize); 

  // Find the current user's cart and purchases, initialize if not exists
  let customer = await Customer.findById(req.user._id);
  if (!customer.cart) {
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
  }
  if (!customer.purchases) {
    customer.purchases = { items: [], totalQuantity: 0, totalPrice: 0 };
  }
  customer.save();

  // Find products for the current page, sorted by name, limit to pageSize products per page
  const products = await Product.find()
    .sort({name: 1}) 
    .limit(pageSize) 
    .skip((page - 1) * pageSize); 

  // Render index page with product data and pagination information
  res.render('index', {
    title: 'Product List',
    products,
    page,
    lastPage
  });
};

// Controller function to get products
export const getProducts = async (req, res) => {
  const { name } = req.body;
  let query = {};

  // If name is provided in request body, perform case-insensitive search
  if (name) {
    query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
  }

  try {
    // Find products matching the query, sorted by price in descending order
    const products = await Product.find(query).sort({price: -1});
    res.json(products); // Send back JSON response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send(error);
  }
};

// Controller function to add product to cart
export const addToCart = async (req, res) => {
  try {
    let { productId, quantity } = req.body;
    quantity = parseInt(quantity);
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }
    const price = product.price;
  
    const userId = req.user._id;
    let customer = await Customer.findOne({ _id: userId });
    
    // Check if the product is already in the cart
    const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      customer.cart.items[itemIndex].quantity += quantity;
      customer.cart.items[itemIndex].price = price;
    } else {
      customer.cart.items.push({ productId, quantity, price });
    }
    customer.cart.totalQuantity += quantity;
    customer.cart.totalPrice += price * quantity;
    
    // Save the updated cart and redirect to showCart page
    await customer.save();
    res.redirect('/showCart');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

// Controller function to show cart
export const showCart = async (req, res) => {
  try {
    // Find the current user's cart and populate product details
    const populatedCustomer = await Customer.findOne({ _id: req.user }).populate('cart.items.productId');
    res.render('cart', {user: populatedCustomer});
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

// Controller function to clear cart
export const clearCart = async (req, res) => {
  try {
    // Find the current user and reset their cart
    const customer = await Customer.findOne({ _id: req.user });
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    customer.save();
    res.redirect('/showCart');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

// Controller function to handle purchase
export const purchase = async (req, res) => {
  try {
    // Find the current user and populate their cart items
    const customer = await Customer.findOne({ _id: req.user }).populate('cart.items.productId');
    
    // Iterate through cart items and update product stock, then update user's purchases
    for (let cartItem of customer.cart.items) {
      const { productId, quantity } = cartItem; 

      const product = await Product.findById(productId);
      if (product && product.stock >= quantity) {
        product.stock -= quantity;
        await product.save();
      } else {
        return res.status(400).send('Not enough stock for product: ' + product.name);
      }
      
      const itemIndex = customer.purchases.items.findIndex(purchaseItem => purchaseItem.productId.toString() === productId.toString());
      if (itemIndex > -1) {
        customer.purchases.items[itemIndex].quantity += quantity;
      } else {
        customer.purchases.items.push({ productId: productId, quantity: quantity, price: product.price });
      }
      customer.purchases.totalQuantity += quantity;
      customer.purchases.totalPrice += product.price * quantity;
    }

    // Save the updated user data and reset their cart
    await customer.save();
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    await customer.save();

    // Redirect to clearCart page
    res.redirect('/clearCart'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

// Controller function to render customer page
export const customer = async (req, res) => {
  try {
    // Find the current user and populate their purchases
    const customer = await Customer.findOne({ _id: req.user }).populate('purchases.items.productId');

    // Render the customer page with user data
    res.render('customer', {user: customer}); 
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

// Controller function to upload profile picture
export const uploadProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Get the user ID and file path from the request
    const userId = req.user.id; // Ensure this matches how you store the user's ID in the session
    const filePath = req.file.path;

    // Update the Customer model with the profile picture URL
    await Customer.findByIdAndUpdate(userId, { profilePictureUrl: filePath });

    // Redirect to the customer page
    res.redirect('/customer');
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).send('Error uploading profile picture');
  }
};

// Controller function to remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    // Get the product ID and user ID from the request
    const productId = req.params.productId;
    const userId = req.user._id;

    // Find the current user and update their cart
    let customer = await Customer.findOne({ _id: userId });
    const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      // If the item is found, remove it from the cart and update totals
      const [removedItem] = customer.cart.items.splice(itemIndex, 1);
      customer.cart.totalQuantity -= removedItem.quantity;
      customer.cart.totalPrice -= removedItem.price * removedItem.quantity;
      await customer.save();
    }

    // Redirect to showCart page
    res.redirect('/showCart');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

// Controller function to show products by type
export const showType = async (req, res) => {
  const type = req.params.type;
  // Find products of the specified type
  const products = await Product.find({ type: type });
  
  // Render the type page with the products
  res.render('type', {type, products});
}
