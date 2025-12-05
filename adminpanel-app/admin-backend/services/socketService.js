const logger = require('../utils/logger');

/**
 * Socket Service - Quản lý các socket events
 * Sử dụng để emit events từ các controllers/services khác
 */
class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize socket service với io instance
   */
  initialize(io) {
    this.io = io;
    logger.info('SocketService initialized');
  }

  /**
   * Emit event đến tất cả clients
   */
  emitToAll(eventName, data) {
    if (!this.io) {
      logger.warn('SocketService: io not initialized');
      return;
    }
    this.io.emit(eventName, data);
    logger.info(`SocketService: Emitted ${eventName} to all clients`);
  }

  /**
   * Emit event đến một user cụ thể
   */
  emitToUser(userId, eventName, data) {
    if (!this.io) {
      logger.warn('SocketService: io not initialized');
      return;
    }
    this.io.to(`user:${userId}`).emit(eventName, data);
    logger.info(`SocketService: Emitted ${eventName} to user ${userId}`);
  }

  /**
   * Emit flash sale countdown
   */
  emitFlashSaleCountdown(timeLeft) {
    this.emitToAll('flashSale:countdown', { timeLeft });
  }

  /**
   * Emit flash sale start
   */
  emitFlashSaleStart(duration) {
    this.emitToAll('flashSale:start', { duration });
  }

  /**
   * Emit flash sale end
   */
  emitFlashSaleEnd() {
    this.emitToAll('flashSale:end', {});
  }

  /**
   * Emit new product notification
   */
  emitNewProduct(product) {
    this.emitToAll('product:new', { product });
  }

  /**
   * Emit order status update
   */
  emitOrderStatusUpdate(userId, orderId, status, message) {
    const data = {
      orderId,
      status,
      message,
    };
    this.emitToUser(userId, 'order:statusUpdate', data);
  }

  /**
   * Emit new promotion
   */
  emitNewPromotion(title, description) {
    this.emitToAll('promotion:new', { title, description });
  }

  /**
   * Emit general notification
   */
  emitNotification(userId, message, type = 'info') {
    const data = { message, type };
    if (userId) {
      this.emitToUser(userId, 'notification', data);
    } else {
      this.emitToAll('notification', data);
    }
  }

  /**
   * Emit new message to order participants
   */
  emitNewMessage(orderId, message, recipientId) {
    const data = { message };
    if (recipientId) {
      this.emitToUser(recipientId, 'message:new', data);
    }
    // Also emit to order room for real-time updates
    this.io.to(`order:${orderId}`).emit('message:new', data);
    logger.info(`SocketService: Emitted message:new for order ${orderId} to user ${recipientId}`);
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;
