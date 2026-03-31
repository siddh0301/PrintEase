import Settlement from '../models/Settlement.js';
import Earning from '../models/Earning.js';
import Shop from '../models/Shop.js';
import Notification from '../models/Notification.js';

// Get shop earnings
export const getShopEarnings = async (req, res) => {
  try {
    const { shopId } = req.query;
    
    let query = {};

    if (shopId) {
      // If shopId provided, get earnings for that specific shop
      // Verify shop belongs to this user
      const shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
      if (!shop) {
        return res.status(403).json({ message: 'Unauthorized: Shop not found' });
      }
      query = { shop: shopId };
    } else {
      // Otherwise, get all shops owned by user and get earnings for all of them
      const shops = await Shop.find({ owner: req.user._id }, '_id');
      const shopIds = shops.map(s => s._id);
      
      if (shopIds.length === 0) {
        return res.json({ 
          success: true, 
          earnings: [], 
          totalEarnings: 0, 
          totalUnsettled: 0, 
          settledCount: 0, 
          unsettledCount: 0 
        });
      }
      
      query = { shop: { $in: shopIds } };
    }

    const earnings = await Earning.find(query)
      .populate('shop', 'shopName')
      .populate({
        path: 'order',
        select: 'orderNumber totalAmount status freePages discountedAmount totalPages'
      })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const unsettledEarnings = earnings.filter(e => e.status === 'unsettled');
    const totalUnsettled = unsettledEarnings.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      earnings,
      totalEarnings,
      totalUnsettled,
      settledCount: earnings.filter(e => e.status === 'settled').length,
      unsettledCount: unsettledEarnings.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch earnings', error: error.message });
  }
};

// Create settlement
export const createSettlement = async (req, res) => {
  try {
    const { earningIds, settlementDate, shopId } = req.body;

    if (!earningIds || earningIds.length === 0) {
      return res.status(400).json({ message: 'Select earnings to settle' });
    }

    console.log('🔄 Settlement request:', { earningIds, shopId, userId: req.user._id });

    // Get the first earning to determine shop if not provided
    let finalShopId = shopId;
    if (!finalShopId) {
      const firstEarning = await Earning.findById(earningIds[0]);
      if (!firstEarning) {
        return res.status(404).json({ message: 'Earning not found' });
      }
      finalShopId = firstEarning.shop;
      console.log('📍 Shop ID from earning:', finalShopId);
    }

    // Get shop and verify it belongs to current user
    const shop = await Shop.findOne({ 
      _id: finalShopId,
      owner: req.user._id 
    });
    
    if (!shop) {
      console.log('❌ Shop not found or unauthorized:', { finalShopId, userId: req.user._id });
      return res.status(404).json({ message: 'Shop not found or unauthorized' });
    }

    console.log('✅ Shop found:', shop.shopName);

    // Get earnings and verify they belong to this shop
    const earnings = await Earning.find({ _id: { $in: earningIds }, shop: finalShopId });
    if (earnings.length !== earningIds.length) {
      console.log('❌ Earnings mismatch:', { expected: earningIds.length, found: earnings.length });
      return res.status(400).json({ message: 'Some earnings do not belong to this shop' });
    }
    
    const totalAmount = earnings.reduce((sum, e) => sum + e.amount, 0);
    console.log('💰 Total settlement amount:', totalAmount);

    // Create settlement
    const settlement = await Settlement.create({
      shop: finalShopId,
      earnings: earningIds,
      totalAmount,
      settlementDate: settlementDate || new Date(),
      status: 'completed'
    });

    console.log('✅ Settlement created:', settlement._id);

    // Mark earnings as settled
    await Earning.updateMany(
      { _id: { $in: earningIds } },
      { status: 'settled' }
    );

    // Create notification
    await Notification.create({
      user: req.user._id,
      title: 'Settlement Created',
      message: `Settlement of ₹${totalAmount} created successfully`,
      type: 'settlement'
    });

    res.json({
      success: true,
      message: 'Settlement created successfully',
      settlement,
      totalAmount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create settlement', error: error.message });
  }
};

// Get settlements
export const getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find({ shop: req.user._id })
      .populate('earnings')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      settlements
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settlements', error: error.message });
  }
};
