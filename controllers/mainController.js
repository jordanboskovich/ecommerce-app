import Customer from '../models/Customer.js';
import Product from '../models/Product.js';


export const displayProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const totalProducts = await Product.countDocuments();
  const lastPage = Math.ceil(totalProducts / 9);
  
  const products = await Product.find()
    .sort({name: 1})
    .limit(9)
    .skip((page - 1) * 9);
  
  res.render('index', {title: 'Product List', products, page, lastPage}); 
};

export const home = async (req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 9; 
  const totalProducts = await Product.countDocuments(); 
  const lastPage = Math.ceil(totalProducts / pageSize); 

  let customer = await Customer.findById(req.user._id);
  if (!customer.cart) {
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
  }
  if (!customer.purchases) {
    customer.purchases = { items: [], totalQuantity: 0, totalPrice: 0 };
  }
  customer.save();

  const products = await Product.find()
    .sort({name: 1}) 
    .limit(pageSize) 
    .skip((page - 1) * pageSize); 

  res.render('index', {
    title: 'Product List',
    products,
    page,
    lastPage
  });
};


export const getProducts = async (req, res) => {
  const { name } = req.body;
  let query = {};

  if (name) {
    query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
  }

  try {
    const products = await Product.find(query).sort({price: -1});
    res.json(products); // Send back JSON response
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send(error);
  }
};

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
    console.log(customer);
    
    const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      customer.cart.items[itemIndex].quantity += quantity;
      customer.cart.items[itemIndex].price = price;
    } else {
      customer.cart.items.push({ productId, quantity, price });
    }
    customer.cart.totalQuantity += quantity;
    customer.cart.totalPrice += price * quantity;
    

    await customer.save();
    const populatedCustomer = await Customer.findOne({ _id: userId }).populate('cart.items.productId');
    res.redirect('/showCart');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

export const showCart = async (req, res) => {
  try {
    const populatedCustomer = await Customer.findOne({ _id: req.user }).populate('cart.items.productId');
    res.render('cart', {user: populatedCustomer});
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

export const clearCart = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user });
    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    customer.save();
    res.redirect('/showCart');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

export const purchase = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user }).populate('cart.items.productId');
    
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

    await customer.save();
    await customer.cart.items.forEach(async cartItem => {
      const product = await Product.findById(cartItem.productId);
      if (!product) {
        return res.status(404).send('Product not found');
      }
      await product.save();
    });

    customer.cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    await customer.save();

    res.redirect('/clearCart'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};


export const customer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.user }).populate('purchases.items.productId');

    res.render('customer', {user: customer}); 
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}


export const uploadProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const userId = req.user.id; // Ensure this matches how you store the user's ID in the session
    const filePath = req.file.path;

    // Update the Customer model
    await Customer.findByIdAndUpdate(userId, { profilePictureUrl: filePath });

    // Redirect or send a response
    res.redirect('/customer'); // Assuming you want to redirect back to the customer page
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).send('Error uploading profile picture');
  }
};


export const removeFromCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user._id;
    let customer = await Customer.findOne({ _id: userId });

    const itemIndex = customer.cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      const [removedItem] = customer.cart.items.splice(itemIndex, 1);
      
      customer.cart.totalQuantity -= removedItem.quantity;
      customer.cart.totalPrice -= removedItem.price * removedItem.quantity;

      await customer.save();
    }

    res.redirect('/showCart');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};


export const showType = async (req, res) => {
  const type = req.params.type;
  const products = await Product.find({ type: type });
  
  res.render('type', {type, products});
}