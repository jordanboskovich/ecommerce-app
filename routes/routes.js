import express from 'express';
import * as ctrl from '../controllers/mainController.js';
import * as auth from '../controllers/authController.js';
import { upload } from '../controllers/uploadConfig.js'; // 

const router = express.Router();

// Define routes
router.get('/login', auth.login);
router.post('/login', auth.verifyLogin);
router.get('/register', auth.register);
router.post('/register', auth.verifyRegister);
router.get('/logout', auth.logout);

router.get('/', auth.isAuthenticated, ctrl.home);
router.get('/product/:type', auth.isAuthenticated, ctrl.showType);
router.post('/api/products', auth.isAuthenticated, ctrl.getProducts);
router.get('/showCart', auth.isAuthenticated, ctrl.showCart);
router.post('/addToCart', auth.isAuthenticated, ctrl.addToCart);
router.get('/clearCart', auth.isAuthenticated, ctrl.clearCart);
router.post('/purchase', auth.isAuthenticated, ctrl.purchase);
router.get('/customer', auth.isAuthenticated, ctrl.customer);

router.post('/upload-profile-picture', auth.isAuthenticated, upload.single('profilePicture'), ctrl.uploadProfilePicture);

router.post('/removeFromCart/:productId', ctrl.removeFromCart);


export default router;

