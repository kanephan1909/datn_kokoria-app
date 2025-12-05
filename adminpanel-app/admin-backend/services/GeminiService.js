const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Lấy API key từ biến môi trường
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  logger.warn('GEMINI_API_KEY chưa được cấu hình trong .env file');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// System prompt để chatbot hiểu context của ứng dụng
const SYSTEM_PROMPT = `Bạn là trợ lý ảo thân thiện của ứng dụng Kokoria - một ứng dụng đặt đồ ăn Hàn Quốc.

Nhiệm vụ của bạn:
- Hỗ trợ khách hàng về menu, sản phẩm, đơn hàng
- Khi khách hàng hỏi về món ăn, sản phẩm, bạn sẽ nhận được danh sách sản phẩm thực tế từ hệ thống
- Hãy trình bày thông tin sản phẩm một cách rõ ràng, bao gồm: tên, giá, mô tả
- Trả lời câu hỏi về chính sách giao hàng, thanh toán
- Hướng dẫn sử dụng ứng dụng
- Tư vấn món ăn phù hợp dựa trên sản phẩm có sẵn
- Giải đáp thắc mắc về đơn hàng, địa chỉ giao hàng

QUAN TRỌNG: 
- Khi có danh sách sản phẩm, hãy liệt kê các sản phẩm cụ thể với tên, giá (định dạng VNĐ), và mô tả ngắn gọn
- Đừng chỉ tư vấn chung chung, hãy đề xuất các sản phẩm thực tế có trong hệ thống
- Nếu không có sản phẩm phù hợp, hãy đề xuất các sản phẩm tương tự

Hãy trả lời một cách thân thiện, ngắn gọn và hữu ích. Luôn trả lời bằng tiếng Việt.

Nếu không biết câu trả lời, hãy đề nghị khách hàng liên hệ bộ phận hỗ trợ qua hotline hoặc email.`;

class GeminiService {
  constructor() {
    this.chatSessions = new Map(); // Lưu chat sessions theo userId
    this.workingModelName = null; // Lưu model name đã hoạt động
  }

  /**
   * Liệt kê các model khả dụng
   * @returns {Promise<Array>} Danh sách model names
   */
  async listAvailableModels() {
    if (!genAI) {
      return [];
    }

    try {
      // Note: listModels có thể không có trong version này
      // Nếu không có, sẽ fallback về danh sách hardcoded
      const models = await genAI.listModels();
      const modelNames = models.map(m => m.name);
      logger.info(`Available models: ${modelNames.join(', ')}`);
      return modelNames;
    } catch (error) {
      logger.warn(`Cannot list models: ${error.message}`);
      return [];
    }
  }

  /**
   * Tìm model hoạt động từ danh sách
   * @returns {string|null} Model name hoặc null
   */
  findWorkingModel() {
    if (this.workingModelName) {
      return this.workingModelName;
    }

    // Thử các model names mới nhất trước, sau đó fallback về model cũ
    const modelNames = [
      // Models mới nhất (2024-2025)
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      // Models 1.5 series
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      // Model cũ (fallback)
      'gemini-pro',
    ];

    // Mặc định dùng model đầu tiên
    this.workingModelName = modelNames[0];
    logger.info(`Using default model: ${this.workingModelName}`);
    return this.workingModelName;
  }

  /**
   * Khởi tạo hoặc lấy chat session cho user
   * @param {string} userId - ID của user
   * @returns {Object|null} Chat session hoặc null nếu không có API key
   */
  getOrCreateChatSession(userId) {
    if (!genAI) {
      return null;
    }

    // Nếu đã có session cho user này, trả về
    if (this.chatSessions.has(userId)) {
      return this.chatSessions.get(userId);
    }

    // Tạo session mới
    try {
      const modelName = this.findWorkingModel();
      logger.info(`Creating chat session with model: ${modelName} for user: ${userId}`);
      
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });

      const chat = model.startChat({
        history: [],
      });

      this.chatSessions.set(userId, chat);
      logger.info(`Chat session created successfully for user: ${userId}`);
      return chat;
    } catch (error) {
      logger.error(`Error creating chat session for user ${userId}:`, {
        message: error.message,
        stack: error.stack,
        modelName: this.workingModelName,
      });
      return null;
    }
  }

  /**
   * Tìm kiếm sản phẩm dựa trên message của user
   * @param {string} message - Message từ user
   * @returns {Promise<Array>} Danh sách sản phẩm
   */
  async searchProducts(message) {
    try {
      // Extract keywords từ message
      const keywords = this.extractProductKeywords(message);
      
      if (keywords.length === 0) {
        // Nếu không có keywords cụ thể, lấy top products
        const products = await prisma.product.findMany({
          where: {
            isActive: true,
          },
          take: 10,
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return this.formatProducts(products);
      }

      // Search products với keywords
      // Tạo regex pattern cho case-insensitive search
      const searchPatterns = keywords.map(keyword => ({
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      }));

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: searchPatterns.length > 0 ? searchPatterns : [
            { name: { contains: keywords[0] || '' } },
            { description: { contains: keywords[0] || '' } },
          ],
        },
        take: 10,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return this.formatProducts(products);
    } catch (error) {
      logger.error(`Error searching products: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract keywords từ message để search products
   * @param {string} message - Message từ user
   * @returns {Array<string>} Keywords
   */
  extractProductKeywords(message) {
    const lowerMessage = message.toLowerCase();
    
    // Common food keywords
    const foodKeywords = [
      'gà', 'chicken', 'thịt', 'meat', 'cá', 'fish', 'tôm', 'shrimp',
      'bò', 'beef', 'heo', 'pork', 'cơm', 'rice', 'mì', 'noodle',
      'phở', 'bún', 'bánh', 'cake', 'pizza', 'burger', 'salad',
      'súp', 'soup', 'nước', 'drink', 'đồ uống', 'trà', 'tea',
      'cà phê', 'coffee', 'kem', 'ice cream', 'bánh mì', 'bread',
    ];

    const foundKeywords = [];
    for (const keyword of foodKeywords) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }

    // Nếu không tìm thấy keyword, thử extract từ message
    if (foundKeywords.length === 0) {
      // Remove common words
      const words = lowerMessage
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['muốn', 'ăn', 'uống', 'có', 'gì', 'nào', 'cho', 'tôi'].includes(word));
      
      if (words.length > 0) {
        foundKeywords.push(...words.slice(0, 3));
      }
    }

    return foundKeywords;
  }

  /**
   * Format products để gửi cho chatbot
   * @param {Array} products - Danh sách products từ database
   * @returns {Array} Formatted products
   */
  formatProducts(products) {
    return products.map(product => {
      let variants = [];
      if (product.variants) {
        if (Array.isArray(product.variants)) {
          variants = product.variants;
        } else if (typeof product.variants === 'string') {
          try {
            variants = JSON.parse(product.variants);
          } catch (e) {
            variants = [];
          }
        }
      }

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        category: product.category?.name || '',
        stock: product.stock || 0,
        variants: variants,
      };
    });
  }

  /**
   * Tạo context message với thông tin sản phẩm
   * @param {string} userMessage - Message từ user
   * @param {Array} products - Danh sách sản phẩm
   * @returns {string} Context message
   */
  createProductContext(userMessage, products) {
    if (products.length === 0) {
      return userMessage;
    }

    const productsInfo = products.map((p, index) => {
      const priceFormatted = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(p.price);

      let info = `${index + 1}. ${p.name} - ${priceFormatted}`;
      if (p.description) {
        info += `\n   Mô tả: ${p.description}`;
      }
      if (p.category) {
        info += `\n   Danh mục: ${p.category}`;
      }
      return info;
    }).join('\n\n');

    return `${userMessage}\n\n[DANH SÁCH SẢN PHẨM CÓ SẴN TRONG HỆ THỐNG KOKORIA:\n${productsInfo}\n\nHãy đề xuất các sản phẩm này cho khách hàng một cách tự nhiên và thân thiện.]`;
  }

  /**
   * Gửi message và nhận response từ Gemini
   * @param {string} userId - ID của user
   * @param {string} message - Nội dung message
   * @param {Array} chatHistory - Lịch sử chat (optional, nếu không có sẽ dùng session)
   * @returns {Promise<Object>} Response từ Gemini
   */
  async sendMessage(userId, message, chatHistory = null) {
    if (!genAI) {
      throw new Error('Gemini API key chưa được cấu hình. Vui lòng liên hệ admin.');
    }

    try {
      // Kiểm tra xem user có hỏi về sản phẩm không
      const isProductQuery = this.isProductRelatedQuery(message);
      let products = [];
      let enhancedMessage = message;

      if (isProductQuery) {
        // Search products
        products = await this.searchProducts(message);
        if (products.length > 0) {
          // Tạo context message với thông tin sản phẩm
          enhancedMessage = this.createProductContext(message, products);
          logger.info(`Found ${products.length} products for query: "${message}"`);
        }
      }

      let chat;

      // Nếu có chatHistory, tạo session mới với history
      if (chatHistory && chatHistory.length > 0) {
        const modelName = this.findWorkingModel();
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });

        // Convert chatHistory sang format của Gemini
        const history = chatHistory.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

        chat = model.startChat({ history });
      } else {
        // Sử dụng session hiện có hoặc tạo mới
        chat = this.getOrCreateChatSession(userId);
        if (!chat) {
          throw new Error('Không thể tạo chat session');
        }
      }

      // Gửi message (có thể đã được enhance với product info)
      const result = await chat.sendMessage(enhancedMessage);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: text,
        products: products.length > 0 ? products : undefined, // Trả về products nếu có
      };
    } catch (error) {
      logger.error(`Error sending message to Gemini for user ${userId}:`, error);
      logger.error(`Error details:`, {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        stack: error.stack?.substring(0, 500),
      });
      
      // Nếu lỗi do model không tồn tại, thử model khác
      const isModelNotFound = 
        error.message?.includes('not found') || 
        error.message?.includes('404') || 
        error.status === 404 ||
        error.message?.includes('is not found for API version');
      
      if (isModelNotFound) {
        const modelNames = [
          // Models mới nhất
          'gemini-2.0-flash-lite',
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.0-flash',
          // Models 1.5 series
          'gemini-1.5-flash',
          'gemini-1.5-pro',
          'gemini-1.5-flash-latest',
          'gemini-1.5-pro-latest',
          // Model cũ
          'gemini-pro',
        ];
        
        // Tìm model hiện tại trong danh sách
        const currentModel = this.workingModelName || modelNames[0];
        const currentIndex = modelNames.indexOf(currentModel);
        
        if (currentIndex >= 0 && currentIndex < modelNames.length - 1) {
          // Thử model tiếp theo
          const nextModel = modelNames[currentIndex + 1];
          this.workingModelName = nextModel;
          logger.info(`Model "${currentModel}" not available, switching to: "${nextModel}"`);
          
          // Clear session để tạo lại với model mới
          this.clearChatSession(userId);
          
          // Retry với model mới (giới hạn retry để tránh vòng lặp vô hạn)
          if (!this._retryCount) this._retryCount = 0;
          if (this._retryCount < 3) {
            this._retryCount++;
            return this.sendMessage(userId, message, chatHistory);
          }
        }
        
        this._retryCount = 0;
        throw new Error('Không thể kết nối đến Gemini API. Vui lòng kiểm tra API key và thử lại sau.');
      }
      
      // Reset retry count nếu không phải lỗi model
      this._retryCount = 0;
      
      // Xử lý các lỗi cụ thể
      if (error.message?.includes('API key') || error.message?.includes('API_KEY')) {
        throw new Error('Lỗi cấu hình API key. Vui lòng liên hệ admin.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('QUOTA') || error.status === 429) {
        throw new Error('Đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.');
      }

      if (error.status === 403) {
        throw new Error('Không có quyền truy cập. Vui lòng kiểm tra API key.');
      }

      // Log chi tiết lỗi để debug
      const errorMessage = error.message || 'Unknown error';
      throw new Error(`Lỗi khi xử lý yêu cầu: ${errorMessage}. Vui lòng thử lại sau.`);
    }
  }

  /**
   * Xóa chat session của user
   * @param {string} userId - ID của user
   */
  clearChatSession(userId) {
    this.chatSessions.delete(userId);
  }

  /**
   * Xóa tất cả chat sessions (dùng khi restart server)
   */
  clearAllSessions() {
    this.chatSessions.clear();
  }

  /**
   * Kiểm tra xem message có liên quan đến sản phẩm không
   * @param {string} message - Message từ user
   * @returns {boolean}
   */
  isProductRelatedQuery(message) {
    const lowerMessage = message.toLowerCase();
    
    // Keywords cho biết user đang hỏi về sản phẩm
    const productKeywords = [
      'muốn ăn', 'muốn uống', 'có gì', 'món gì', 'sản phẩm',
      'menu', 'thực đơn', 'đồ ăn', 'đồ uống', 'món', 'gà', 'thịt',
      'cá', 'tôm', 'bò', 'heo', 'cơm', 'mì', 'phở', 'bún',
      'bánh', 'pizza', 'burger', 'salad', 'súp', 'nước', 'trà',
      'cà phê', 'kem', 'bánh mì', 'giá', 'bao nhiêu', 'tìm',
      'tư vấn', 'gợi ý', 'đề xuất', 'nên ăn', 'nên uống',
    ];

    return productKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Test API key và tìm model hoạt động
   * @returns {Promise<string|null>} Model name hoạt động hoặc null
   */
  async testAndFindWorkingModel() {
    if (!genAI) {
      logger.error('Gemini API key chưa được cấu hình');
      return null;
    }

    // Nếu đã có working model, không cần test lại
    if (this.workingModelName) {
      return this.workingModelName;
    }

    const modelNames = [
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro',
    ];

    logger.info('🔍 Đang tìm model hoạt động...');
    for (const modelName of modelNames) {
      try {
        logger.info(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('test');
        await result.response;
        
        // Nếu đến đây mà không lỗi, model này hoạt động
        this.workingModelName = modelName;
        logger.info(`✅ Found working model: ${modelName}`);
        return modelName;
      } catch (error) {
        const errorMsg = error.message || '';
        logger.warn(`❌ Model ${modelName} failed: ${errorMsg.substring(0, 150)}`);
        continue;
      }
    }

    logger.error('❌ Không tìm thấy model nào hoạt động. Vui lòng kiểm tra API key.');
    return null;
  }
}

// Export singleton instance
module.exports = new GeminiService();
