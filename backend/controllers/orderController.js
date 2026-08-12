const Order = require('../models/Order')
const Product = require('../models/Product')
const Cart = require('../models/Cart')
const UserAddress = require('../models/UserAddress')
const { logger } = require('../services/logger')

exports.createCodOrder = async (req, res) => {
  try {
    const userId = req.user.id

    const cart = await Cart.findOne({ ownerId: userId })
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty.',
      })
    }

    const defaultAddress = await UserAddress.findOne({ userId, isDefault: true })
    if (!defaultAddress) {
      return res.status(400).json({
        success: false,
        message: 'No default address found.',
      })
    }

    let amount = 0
    const items = []
    
    for (const item of cart.items) {
      const product = await Product.findById(item.productId)
      if (product) {
        const itemPrice = product.price || 0
        items.push({
          productId: item.productId,
          quantity: item.quantity,
          price: itemPrice
        })
        amount += (itemPrice * item.quantity)
      }
    }

    const paymentId = 'COD-' + Date.now()
    const order = new Order({
      userId,
      items,
      amount,
      currency: 'INR',
      paymentMethod: 'COD',
      paymentId,
      paymentIntentId: paymentId,
      deliveryAddress: defaultAddress._id,
      status: 'pending'
    })

    await order.save()
    
    // Clear cart
    cart.items = []
    await cart.save()

    res.status(201).json({
      success: true,
      order,
      message: 'COD order placed successfully'
    })
  } catch (error) {
    logger.error({ event: 'create_cod_order_error', requestId: req.id, error: error.message }, 'Error creating COD order')
    res.status(500).json({
      success: false,
      message: 'Failed to create COD order.',
    })
  }
}

// Valid Order State Machine Transition Matrix
const ALLOWED_TRANSITIONS = {
  pending: ['shipping', 'cancelled', 'failed'],
  shipping: ['delivered', 'cancelled'],
  delivered: ['returned'],
  returned: [],
  cancelled: [],
  failed: [],
}

exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)

    const [orders, totalOrders] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: 'items.productId',
          select: 'title price imageURLs',
        })
        .populate({
          path: 'deliveryAddress',
          select: '_id city state country address',
        })
        .lean(),
      Order.countDocuments({ userId }),
    ])

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
    })
  } catch (error) {
    logger.error({ event: 'get_user_orders_error', requestId: req.id, error: error.message }, 'Error fetching user orders')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders.',
    })
  }
}

exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id
    const { orderId } = req.params

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        userId,
        status: { $in: ['pending', 'shipping'] },
      },
      {
        $set: { status: 'cancelled' },
      },
      { new: true }
    )

    if (!order) {
      const existingOrder = await Order.findOne({ _id: orderId, userId })
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found.',
        })
      }
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled from current status "${existingOrder.status}".`,
      })
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stockCount: item.quantity } }
      )
    }

    logger.info({ event: 'order_cancelled_stock_restored', orderId: order._id, userId }, 'Order cancelled successfully and stock restored')

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored.',
      order,
    })
  } catch (error) {
    logger.error({ event: 'cancel_order_error', requestId: req.id, error: error.message }, 'Error cancelling order')
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order.',
    })
  }
}

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params
    const { status } = req.body

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from "${order.status}" to "${status}".`,
      })
    }

    order.status = status
    await order.save()

    logger.info({ event: 'order_status_updated', orderId: order._id, status }, 'Order status updated successfully')

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order,
    })
  } catch (error) {
    logger.error({ event: 'update_order_status_error', requestId: req.id, error: error.message }, 'Error updating order status')
    res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
    })
  }
}

exports.getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id
    const { orderId } = req.params

    const order = await Order.findOne({ _id: orderId, userId })
      .populate({
        path: 'items.productId',
        select: '_id title imageURLs price',
      })
      .populate({
        path: 'deliveryAddress',
        select: '_id fullName phoneNumber address city state postalCode country',
      })
      .lean()

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to the user.',
      })
    }

    const orderDetails = {
      orderId: order._id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      paymentMethod: order.paymentMethod || 'CARD',
      paymentId: order.paymentId || null,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress ? order.deliveryAddress : null,
      items: order.items.map((item) => ({
        productId: item.productId ? item.productId._id : null,
        productTitle: item.productId ? item.productId.title : 'Product unavailable',
        productImage: item.productId && item.productId.imageURLs ? item.productId.imageURLs[0] : null,
        quantity: item.quantity,
        price: item.price,
      })),
    }

    res.status(200).json({
      success: true,
      order: orderDetails,
    })
  } catch (error) {
    logger.error({ event: 'get_order_details_error', requestId: req.id, error: error.message }, 'Error fetching order details')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details.',
    })
  }
}

exports.getLatestOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id

    const order = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.productId',
        select: '_id title imageURLs price',
      })
      .populate({
        path: 'deliveryAddress',
        select: '_id fullName phoneNumber address city state postalCode country',
      })
      .lean()

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for this user.',
      })
    }

    const orderDetails = {
      orderId: order._id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((item) => ({
        productId: item.productId ? item.productId._id : null,
        productTitle: item.productId ? item.productId.title : 'Product unavailable',
        productImage: item.productId && item.productId.imageURLs ? item.productId.imageURLs[0] : null,
        quantity: item.quantity,
        price: item.price,
      })),
    }

    res.status(200).json({
      success: true,
      order: orderDetails,
    })
  } catch (error) {
    logger.error({ event: 'get_latest_order_details_error', requestId: req.id, error: error.message }, 'Error fetching latest order details')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest order details.',
    })
  }
}