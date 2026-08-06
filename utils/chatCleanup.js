const Chat = require('../models/Chat');

/**
 * Automatically closes chats that have been inactive for more than 24 hours.
 * Inactive is defined by the lastMessageAt field.
 */
const cleanupInactiveChats = async (io) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find chats that are NOT closed and haven't had a message in 24 hours
    const inactiveChats = await Chat.find({
      status: { $ne: 'closed' },
      lastMessageAt: { $lt: oneDayAgo }
    });

    if (inactiveChats.length > 0) {
      console.log(`[Cleanup] Found ${inactiveChats.length} inactive chats to close.`);
      
      for (const chat of inactiveChats) {
        chat.status = 'closed';
        await chat.save();
        
        // Notify admins so their dashboards update
        if (io) {
          io.to('admin_room').emit('chat_updated', chat);
        }
        
        // Optionally notify the user room if they are still connected (unlikely after 24h)
        if (io) {
          io.to(chat.visitorId).emit('chat_closed');
        }
      }
      
      console.log(`[Cleanup] Successfully closed ${inactiveChats.length} chats.`);
    }
  } catch (err) {
    console.error('[Cleanup Error] Failed to clean up inactive chats:', err);
  }
};

/**
 * Starts the cleanup interval.
 * Recommended to run every hour.
 */
const startChatCleanupTask = (io) => {
  // Run once on startup
  cleanupInactiveChats(io);
  
  // Run every hour (3600000 ms)
  setInterval(() => {
    cleanupInactiveChats(io);
  }, 3600000);
  
  console.log('🕒 Inactive chat cleanup task scheduled (Hourly)'.cyan);
};

module.exports = { startChatCleanupTask };
