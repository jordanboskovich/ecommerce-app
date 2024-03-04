import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  price: Number,
  currentPrice: Number,
  stock: Number,
  sales: [{ 
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    date: { type: Date },
    amount: { type: Number}
  }], 
  type: String,
  imageName: String
});

// Check if the model exists before compiling it
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;
