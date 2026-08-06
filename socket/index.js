const Chat = require('../models/Chat');
const User = require('../models/User');
const ChatSetting = require('../models/ChatSetting');
const sendEmail = require('../utils/sendEmail');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`.blue);

    // User joins chat
    socket.on('join_chat', async (visitorId) => {
      socket.visitorId = visitorId; // Store for disconnect handling
      socket.join(visitorId);
      console.log(`User joined room: ${visitorId}`);
      
      try {
        let chat = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
        if (chat) {
          socket.emit('chat_history', chat.messages);
        }
      } catch (err) {
        console.error(err);
      }
    });

    /* 
    // Admin joins chat dashboard
    socket.on('admin_join', async () => {
      // Verify admin token here if possible, or assume protected by frontend/middleware/handshake
      // For simplicity, we trust the event if the handshake auth is done (we'll add that later)
      socket.join('admin_room');
      console.log(`Admin joined: ${socket.id}`);

      // Send active chats to this admin immediately
      try {
          const activeChats = await Chat.find({ status: { $ne: 'closed' } }).sort({ lastMessageAt: -1 });
          socket.emit('active_chats_initial', activeChats);
      } catch (err) {
          console.error("Error fetching active chats for admin:", err);
      }
    });
    */

    // Handle bot flow data collection
    socket.on('update_visitor_info', async ({ visitorId, name, email, phone, message }) => {
      try {
        let chat = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
        if (!chat) {
          chat = new Chat({ visitorId, name, email, phone, status: 'pending' });
        } else {
            chat.name = name || chat.name;
            chat.email = email || chat.email;
            chat.phone = phone || chat.phone;
        }

        if (message) {
            chat.messages.push(message);
            chat.lastMessageAt = new Date();
        }

        await chat.save();
        
        // Notify admins via socket
        io.to('admin_room').emit('chat_updated', chat);

        // NEW: Email Notification for completed leads
        if (name && email && phone && !chat.leadNotificationSent) {
            try {
                // Fetch all admins and superadmins
                const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
                const adminEmails = admins.map(a => a.email).filter(Boolean);

                if (adminEmails.length > 0) {
                    const dashboardUrl = (process.env.ADMIN_PANEL_URL || 'http://localhost:5173') + '/live-chat';
                    
                    await sendEmail({
                        email: adminEmails.join(','),
                        subject: `New Lead Captured: ${name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                                <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 25px; text-align: center;">
                                    <h2 style="margin: 0; color: #ffffff; font-size: 24px;">New Lead Detected!</h2>
                                    <p style="margin: 5px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">A visitor is engaging with SEMI Assistant</p>
                                </div>
                                <div style="padding: 30px; background-color: #ffffff;">
                                    <p>Hello Admin,</p>
                                    <p>A new visitor has provided their contact details through the automated chat widget.</p>
                                    
                                    <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 25px 0;">
                                        <h3 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Visitor Details</h3>
                                        <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
                                        <p style="margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>
                                        <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                                    </div>
 
                                    <p style="color: #64748b; font-size: 14px;">You can view the full conversation history and respond via the Live Chat dashboard.</p>
                                    
                                    <div style="text-align: center; margin-top: 35px;">
                                        <a href="${dashboardUrl}" style="background-color: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);">View in Dashboard</a>
                                    </div>
                                </div>
                                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} SEMI India. All rights reserved.</p>
                                    <p style="margin: 5px 0 0;">This is an automated system notification.</p>
                                </div>
                            </div>
                        `
                    });

                    // Mark as sent to avoid duplicates in this session
                    chat.leadNotificationSent = true;
                    await chat.save();
                    console.log(`[Email] Lead notification sent to ${adminEmails.length} admins for: ${name}`);
                }
            } catch (emailErr) {
                console.error("Error sending admin lead email:", emailErr);
            }
        }
      } catch (err) {
        console.error(err);
      }
    });

    // User/Admin sends message
    socket.on('send_message', async ({ visitorId, text, sender, isAdmin, adminId }) => {
      try {
        let chat;
        let isNewClaim = false;

        /*
        if (isAdmin) {
            // Attempt to claim if unassigned, or find if already assigned to me
            // We use { new: false } to see the PREVIOUS state
            const oldChat = await Chat.findOneAndUpdate(
                { visitorId, status: { $ne: 'closed' }, $or: [{ assignedTo: null }, { assignedTo: adminId }] },
                { $set: { assignedTo: adminId, status: 'active', lastMessageAt: new Date() } },
                { new: false }
            );

            if (!oldChat) {
                // Check if it exists but is assigned to someone else
                const existing = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
                if (existing && existing.assignedTo && existing.assignedTo.toString() !== adminId) {
                    return socket.emit('error', { message: 'This chat is being handled by another agent.' });
                }
                // Create new
                chat = new Chat({ visitorId, assignedTo: adminId, status: 'active', lastMessageAt: new Date() });
                isNewClaim = true; 
            } else {
                chat = await Chat.findById(oldChat._id); // Get the updated one
                if (!oldChat.assignedTo) isNewClaim = true;
            }
            
            if (isNewClaim) {
                const joinMsg = { 
                    sender: 'bot', 
                    text: `Connected to Live Support! Our agent is now here to assist you.`, 
                    timestamp: new Date() 
                };
                chat.messages.push(joinMsg);
                io.to(visitorId).emit('receive_message', joinMsg);
            }
        } else {
            chat = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
            if (!chat) chat = new Chat({ visitorId, status: 'pending' });
        }
        */
        chat = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
        if (!chat) chat = new Chat({ visitorId, status: 'pending' });

        /*
        if (isAdmin || text === 'request_live_chat') {
            chat.isLive = true;
        }
        */

        const newMessage = { 
            sender, 
            text: text === 'request_live_chat' ? 'Requesting live support... Currently, our agents are offline. We will get back to you soon!' : text, 
            isAdmin: false, // Force false for now
            timestamp: new Date() 
        };
        chat.messages.push(newMessage);
        chat.lastMessageAt = new Date();
        
        await chat.save();

        io.to(visitorId).emit('receive_message', newMessage);
        
        // Notify admin ONLY if the user has requested live chat or if it's an admin message
        /*
        if (chat.isLive) {
            io.to('admin_room').emit('chat_updated', chat);
        }
        */

        // --- AUTOMATION: Check for Admin Commands (Shortcuts) ---
        if (isAdmin) {
            try {
                const commandSettings = await ChatSetting.findOne({ key: 'admin_commands' });
                if (commandSettings && commandSettings.value) {
                    const matchedCmd = commandSettings.value.find(cmd => 
                        cmd.label.toLowerCase().trim() === text.toLowerCase().trim()
                    );

                    if (matchedCmd && matchedCmd.value) {
                        // Deliver bot response immediately after the admin command trigger
                        const botResponse = {
                            sender: 'bot',
                            text: matchedCmd.value,
                            timestamp: new Date()
                        };
                        
                        chat.messages.push(botResponse);
                        chat.lastMessageAt = new Date();
                        await chat.save();
                        
                        io.to(visitorId).emit('receive_message', botResponse);
                        io.to('admin_room').emit('chat_updated', chat);
                    }
                }
            } catch (cmdErr) {
                console.error("Error processing admin command:", cmdErr);
            }
        }

        // --- AUTOMATION: Check for predefined FAQ responses ---
        if (!isAdmin) {
            try {
                const settings = await ChatSetting.findOne({ key: 'visitor_faqs' });
                if (settings && settings.value) {
                    const normalizedInput = text.toLowerCase().trim();
                    
                    // Recursive function to find match in nested structure
                    const findMatchedFaq = (faqs) => {
                        for (const faq of faqs) {
                            const trigger = (faq.value || '').toLowerCase().trim();
                            const label = (faq.label || '').toLowerCase().trim();
                            
                            // Check match
                            const isMatch = (trigger === normalizedInput || label === normalizedInput) ||
                                           (trigger.length > 3 && normalizedInput.includes(trigger)) ||
                                           (normalizedInput.length > 3 && trigger.includes(normalizedInput)) ||
                                           (label.length > 3 && normalizedInput.includes(label));
                            
                            if (isMatch) return faq;
                            
                            // Search in children
                            if (faq.followUps && faq.followUps.length > 0) {
                                const childMatch = findMatchedFaq(faq.followUps);
                                if (childMatch) return childMatch;
                            }
                        }
                        return null;
                    };

                    const matchedFaq = findMatchedFaq(settings.value);

                    if (matchedFaq) {
                        // Case A: FAQ has an answer (Standard flow)
                        if (matchedFaq.answer) {
                            io.to(visitorId).emit('bot_typing', { visitorId, isTyping: true });

                            setTimeout(async () => {
                                const updatedChat = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
                                
                                const rawAnswer = matchedFaq.answer || "";
                                const personalizedAnswer = rawAnswer.replace(/{name}/g, updatedChat ? (updatedChat.name || "there") : "there");

                                const botResponse = {
                                    sender: 'bot',
                                    text: personalizedAnswer,
                                    timestamp: new Date()
                                };
                                
                                if (updatedChat) {
                                    // Update category if the FAQ has one
                                    if (matchedFaq.category) {
                                        updatedChat.category = matchedFaq.category;
                                    }

                                    updatedChat.messages.push(botResponse);
                                    updatedChat.lastMessageAt = new Date();
                                    await updatedChat.save();
                                    
                                    io.to(visitorId).emit('bot_typing', { visitorId, isTyping: false });
                                    io.to(visitorId).emit('receive_message', botResponse);
                                    io.to('admin_room').emit('chat_updated', updatedChat);

                                    // Send follow-ups after the message
                                    if (matchedFaq.followUps && matchedFaq.followUps.length > 0) {
                                        io.to(visitorId).emit('new_quick_replies', matchedFaq.followUps);
                                    }
                                }
                            }, 1000);
                        } 
                        // Case B: FAQ has no answer but has follow-ups (Menu-only flow)
                        else if (matchedFaq.followUps && matchedFaq.followUps.length > 0) {
                            io.to(visitorId).emit('bot_typing', { visitorId, isTyping: true });
                            
                            setTimeout(async () => {
                                const updatedChat = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
                                if (updatedChat) {
                                    if (matchedFaq.category) {
                                        updatedChat.category = matchedFaq.category;
                                        await updatedChat.save();
                                    }
                                }
                                io.to(visitorId).emit('bot_typing', { visitorId, isTyping: false });
                                io.to(visitorId).emit('new_quick_replies', matchedFaq.followUps);
                            }, 800);
                        }
                    }
                }
            } catch (autoErr) {
                console.error("Error in automated response logic:", autoErr);
            }
        }

      } catch (err) {
        console.error(err);
      }
    });

    /*
     // Admin claims a chat
     socket.on('admin_claim', async ({ visitorId, adminId }) => {
        try {
            // Use findOneAndUpdate to ensure atomic "first-come-first-served" claim
            const chat = await Chat.findOneAndUpdate(
                { visitorId, status: { $ne: 'closed' }, assignedTo: null },
                { $set: { assignedTo: adminId, status: 'active' } },
                { new: true }
            );

            if (chat) {
                // Successful claim
                // Professional Join Message
                const joinMsg = { 
                    sender: 'bot', 
                    text: `Chat Assistant has joined the chat to assist you.`, 
                    timestamp: new Date() 
                };
                chat.messages.push(joinMsg);
                await chat.save();
                
                io.to(visitorId).emit('receive_message', joinMsg);
                io.to('admin_room').emit('chat_updated', chat); // Broadcast update
            } else {
                // If already assigned or doesn't exist, send the current state back to sync UI
                const currentChat = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
                if (currentChat) {
                    socket.emit('chat_updated', currentChat);
                }
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Admin closes a chat
    socket.on('close_chat', async ({ visitorId, adminId }) => {
        try {
            const chat = await Chat.findOne({ visitorId, status: { $ne: 'closed' } });
            if (chat) {
                // Security: only the assigned admin (or a superadmin) can close? 
                // For now, allow the assigned admin to close.
                if (chat.assignedTo && chat.assignedTo.toString() === adminId) {
                    chat.status = 'closed';
                    await chat.save();
                    io.to('admin_room').emit('chat_updated', chat);
                    io.to(visitorId).emit('chat_closed'); // Notify user
                }
            }
        } catch (err) {
            console.error(err);
        }
    });   
    */

    // Typing Indicators
    socket.on('visitor_typing', ({ visitorId }) => {
        io.to('admin_room').emit('visitor_typing', { visitorId });
    });

    socket.on('visitor_stop_typing', ({ visitorId }) => {
        io.to('admin_room').emit('visitor_stop_typing', { visitorId });
    });

    /*
    socket.on('admin_typing', ({ visitorId }) => {
        io.to(visitorId).emit('admin_typing', { visitorId });
    });

    socket.on('admin_stop_typing', ({ visitorId }) => {
        io.to(visitorId).emit('admin_stop_typing', { visitorId });
    });
    */

    socket.on('disconnect', async (reason) => {
      console.log(`Disconnected: ${socket.id} Reason: ${reason}`.red);
      
      // If a user (visitor) disconnects, mark their chat as closed
      // This ensures reloads start fresh and orphans don't stay in Admin "Active" list
      // Data is still preserved in DB with status: 'closed'
      if (socket.visitorId) {
        try {
          const chat = await Chat.findOne({ visitorId: socket.visitorId, status: { $ne: 'closed' } });
          if (chat) {
            // Add a record in the chat log that the user disconnected
            const leaveMsg = {
              sender: 'bot',
              text: 'The visitor has left the session. This chat is now closed.',
              timestamp: new Date()
            };
            chat.messages.push(leaveMsg);
            chat.status = 'closed';
            await chat.save();
            
            // Notify admins so their dashboards update and they see the final message
            // io.to('admin_room').emit('chat_updated', chat);
            console.log(`Auto-closed orphaned chat and notified admin for: ${socket.visitorId}`);
          }
        } catch (err) {
          console.error("Error auto-closing chat on disconnect:", err);
        }
      }
    });
  });
};

module.exports = socketHandler;
