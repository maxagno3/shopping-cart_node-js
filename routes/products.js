let express = require("express");
let router = express.Router();
let Product = require("../models/product");
let path = require("path");
let multer = require("multer");
let Cart = require("../models/cart");
let User = require("../models/user");
let Review = require("../models/review");

// Multer
const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, path.join(__dirname, "../public/images/uploads"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({ storage: storage });

// Show Single Product.
router.get("/:id/singleProduct", async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id).populate({
      path: "reviews",
      populate: { path: "author", model: "User" },
    });
    res.render("singleProduct", { product });
  } catch (error) {
    return next(error);
  }
});

// Add products.
router.get("/addProduct", (req, res, next) => {
  res.render("addProduct");
});

router.post("/addProduct", upload.single("image"), async (req, res, next) => {
  try {
    req.body.image = req.file.filename;
    let product = await Product.create(req.body);
    res.redirect("/shopping");
  } catch (error) {
    return next(error);
  }
});

// Edit/update product.
router.get("/:id/editProduct", async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    res.render("editProduct", { product });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/editProduct", async (req, res, next) => {
  try {
    let product = await Product.findByIdAndUpdate(req.params.id, req.body);
    res.redirect(`/products/${req.params.id}/singleProduct`);
  } catch (error) {
    return next(error);
  }
});

// View Cart.
router.get("/cart", async (req, res, next) => {
  try {
    let cart = await Cart.find({ userId: req.userId }).populate(
      "product",
      "-createdAt -updatedAt -description"
    );
    res.render("cart", { cart });
  } catch (error) {
    next(error);
  }
});

// Add to cart.
router.post("/:id/cart/add", async (req, res, next) => {
  try {
    let productId = req.params.id;
    console.log(req.user || req.userId, "hello");

    let product = await Product.findById(productId);

    // let cart = await Cart.findOneAndUpdate(
    //   { userId: req.userId || req.user },
    //   { $addToSet: { product: product.id } },
    //   { new: true }
    // ).populate("product");

    let cart = await Cart.findOne({userId: req.userId || req.user});

    if (cart.product.includes(productId)) {
      // let producted = cart.product.quantity
      let cart = await Cart.update(
        { _id : productId },
        { $inc: { 'product.quantity': 1 } },
        { new: true }
      ).populate("product");
      
      console.log(cart,'jijijijiji')
      
    } else {
      let cart = await Cart.findOneAndUpdate(
      { userId: req.userId || req.user },
      { $addToSet: { product: product._id } },
      { new: true }
    ).populate("product");
    console.log(cart, "jiji");
    }

  } catch (error) {
    return next(error);
  }
});

// Add Reviews.
router.get("/:id/review/add", async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  res.render("review", { product });
});

router.post("/:id/review/add", async (req, res, next) => {
  try {
    req.body.author = req.userId;
    req.body.productId = req.params.id;
    console.log(req.body, "jojoj");

    let review = await Review.create(req.body);

    let product = await Product.findByIdAndUpdate(req.params.id, {
      $push: { reviews: review.id },
    });

    res.redirect(`/products/${req.params.id}/singleProduct`);
  } catch (error) {
    return next(error);
  }
});

// Edit Reviews.
router.get("/:id/review/:reviewId/edit", async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    let review = await Review.findById(req.params.reviewId);
    res.render("editReview", { review, product });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/review/:reviewId/edit", async (req, res, next) => {
  try {
    let reviewId = req.params.reviewId;
    let review = await Review.findByIdAndUpdate(reviewId, req.body, {
      new: true,
    });
    res.redirect(`/products/${req.params.id}/singleProduct`);
  } catch (error) {
    next(error);
  }
});

// Search by category.
router.get('/:category', async (req,res,next) => {
  
  try {
    let products = await Product.find({category: req.params.category});
    console.log(products, 'hi im products.');
    res.render('filter', {products});
  } catch (error) {
    next(error);
  }

})

// Delete Product.
router.get("/:id/delete", async (req, res, next) => {
  try {
    console.log(req.params.id, "products");
    let product = await Product.findByIdAndDelete(req.params.id);

    let review = await Review.deleteMany({ productId: req.params.id });

    let cart = await Cart.findOne({ product: req.params.id });
    console.log(cart, "viewing deleted items in cart.");

    res.redirect('/shopping');
    
  } catch (error) {
    next(error);
  }
});

// Deleting reviews.
router.get("/:id/review/:reviewId/delete", async (req, res, next) => {
  let reviewId = req.params.reviewId;
  let review = await Review.findByIdAndDelete(reviewId);
  let product = await Product.findByIdAndUpdate(req.params.id, {
    $pull: { reviews: review.id },
  });
  res.redirect(`/products/${req.params.id}/singleProduct`);
});

module.exports = router;
