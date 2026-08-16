const paymentService = require('../services/payment')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const Order = require('../models/Order')
const UserAddress = require('../models/UserAddress')
const { logger } = require('../services/logger')

exports.createPaymentIntent = async (req, res) => {
  try {
    if (!paymentService.isConfigured()) {
      return paymentService.sendNotConfiguredResponse(res)
    }

    const userId = req.user.id
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || undefined

    let totalAmount = 0
    let items = []

    if (req.body && req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      // Direct Purchase Mode
      for (const item of req.body.items) {
        const product = await Product.findById(item.productId)
        if (!product) {
          return res.status(400).json({
            success: false,
            message: 'Product not found.',
          })
        }
        const qty = parseInt(item.quantity, 10) || 1
        if (qty > product.stockCount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product: ${product.title}`,
          })
        }
        const price = product.salePrice ?? product.price
        totalAmount += qty * price
      }
      const deliveryFee = totalAmount >= 500 ? 0 : 40
      totalAmount += deliveryFee
    } else {
      // Regular Cart Checkout Mode
      const cart = await Cart.findOne({ ownerId: userId }).populate({
        path: 'items.productId',
        select: 'price salePrice stockCount title',
      })

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty. Add items to your cart before proceeding to payment.',
        })
      }

      for (const item of cart.items) {
        if (item.quantity > item.productId.stockCount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product: ${item.productId.title}`,
          })
        }

        const price = item.productId.salePrice ?? item.productId.price

        if (typeof price !== 'number') {
          return res.status(400).json({
            success: false,
            message: `Invalid price for product: ${item.productId.title}`,
          })
        }

        totalAmount += item.quantity * price
      }

      if (typeof cart.cargoFee !== 'number' || cart.cargoFee < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cargo fee. Please check your cart.',
        })
      }

      totalAmount += cart.cargoFee
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount. Please check your cart.',
      })
    }

    const paymentIntent = await paymentService.createPaymentIntent({
      amount: totalAmount,
      currency: 'usd',
      description: 'E-commerce Payment',
      idempotencyKey,
      metadata: {
        userId: userId,
        cartId: cart._id.toString(),
      },
    })

    res.status(200).json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
    })
  } catch (error) {
    logger.error({ event: 'payment_intent_create_error', requestId: req.id, error: error.message }, 'Error creating payment intent')
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message,
    })
  }
}

exports.fetchCartAndCreateOrder = async (userId, paymentIntent) => {
  try {
    const paymentIntentId = paymentIntent.id

    // 1. Idempotency Check: Pre-query existing order for paymentIntentId
    const existingOrder = await Order.findOne({ paymentIntentId })
    if (existingOrder) {
      logger.info({ event: 'order_creation_idempotent_duplicate_prevented', paymentIntentId, orderId: existingOrder._id }, 'Order already exists for paymentIntentId')
      return { success: true, order: existingOrder, alreadyProcessed: true }
    }

    const defaultAddress = await fetchUserDefaultAddress(userId)
    if (!defaultAddress) {
      return { success: false, message: 'Default address not found' }
    }

    const cart = await Cart.findOne({ ownerId: userId }).populate({
      path: 'items.productId',
      select: 'price salePrice title stockCount',
    })

    if (!cart || cart.items.length === 0) {
      return { success: false, message: 'Cart is empty' }
    }

    const orderItems = cart.items.map((item) => {
      const price = item.productId.salePrice ?? item.productId.price
      return {
        productId: item.productId._id,
        quantity: item.quantity,
        price,
      }
    })

    // 2. Atomic Stock Deduction before Order Persistence
    const deductedItems = []
    for (const item of orderItems) {
      const updateResult = await Product.updateOne(
        { _id: item.productId, stockCount: { $gte: item.quantity } },
        { $inc: { stockCount: -item.quantity } }
      )

      if (updateResult.modifiedCount === 0) {
        // Atomic Rollback for previously deducted items in this order
        for (const prevItem of deductedItems) {
          await Product.updateOne(
            { _id: prevItem.productId },
            { $inc: { stockCount: prevItem.quantity } }
          )
        }
        logger.warn({ event: 'stock_deduction_insufficient', productId: item.productId, requested: item.quantity }, 'Insufficient stock during atomic deduction')
        return { success: false, message: `Insufficient stock for product ID: ${item.productId}` }
      }

      deductedItems.push(item)
    }

    // 3. Create Order Document
    const newOrder = new Order({
      userId: userId,
      deliveryAddress: defaultAddress._id,
      paymentIntentId: paymentIntentId,
      amount: paymentIntent.amount ? paymentIntent.amount / 100 : cart.cargoFee,
      currency: paymentIntent.currency || 'usd',
      status: 'pending',
      items: orderItems,
    })

    try {
      await newOrder.save()
    } catch (saveError) {
      // Catch MongoDB Duplicate Key Error (code 11000) for race conditions
      if (saveError.code === 11000) {
        // Rollback deducted stock
        for (const prevItem of deductedItems) {
          await Product.updateOne({ _id: prevItem.productId }, { $inc: { stockCount: prevItem.quantity } })
        }
        const racerOrder = await Order.findOne({ paymentIntentId })
        logger.info({ event: 'order_creation_race_resolved', paymentIntentId }, 'Duplicate key caught; returned existing order')
        return { success: true, order: racerOrder, alreadyProcessed: true }
      }

      // Rollback deducted stock on any other DB save failure
      for (const prevItem of deductedItems) {
        await Product.updateOne({ _id: prevItem.productId }, { $inc: { stockCount: prevItem.quantity } })
      }
      throw saveError
    }

    // 4. Clear User Cart ONLY after order and stock deduction succeed
    cart.items = []
    await cart.save()

    logger.info({ event: 'order_created_successfully', orderId: newOrder._id, paymentIntentId }, 'Order created and stock deducted atomically')
    return { success: true, order: newOrder }
  } catch (error) {
    logger.error({ event: 'fetch_cart_create_order_error', userId, error: error.message }, 'Error in fetchCartAndCreateOrder')
    return { success: false, message: error.message }
  }
}

const fetchUserDefaultAddress = async (userId) => {
  try {
    const defaultAddress = await UserAddress.findOne({
      userId: userId,
      isDefault: true,
    })
    if (!defaultAddress) {
      throw new Error('No default address found for the user.')
    }
    return defaultAddress
  } catch (error) {
    throw error
  }
}

exports.checkOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const { paymentIntentId } = req.query
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'PaymentIntent ID is required.',
      })
    }
    const order = await Order.findOne({ userId, paymentIntentId })
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found. Payment might still be processing.',
      })
    }
    res.status(200).json({
      success: true,
      message: 'Order found.',
      order,
    })
  } catch (error) {
    logger.error({ event: 'check_order_status_error', requestId: req.id, error: error.message }, 'Failed to check order status')
    res.status(500).json({
      success: false,
      message: 'Failed to check order status.',
      error: error.message,
    })
  }
}