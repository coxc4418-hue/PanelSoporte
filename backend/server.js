const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const groqService = require('./groq-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes (necessary for third-party widget integration)
app.use(cors());
app.use(express.json());

// Serve widget loader script statically
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database (Firebase or local fallback)
db.initDb();

// --- WIDGET PUBLIC ENDPOINTS ---

/**
 * GET /api/widget/config
 * Retrieves configurations, styling, and welcome options for the floating chat
 */
app.get('/api/widget/config', async (req, res) => {
  const { apiKey } = req.query;
  if (!apiKey) {
    return res.status(400).json({ error: 'Missing apiKey parameter.' });
  }

  try {
    const site = await db.sites.getByApiKey(apiKey);
    if (!site) {
      return res.status(404).json({ error: 'Site not found for the provided apiKey.' });
    }

    // Return configurations (excluding sensitive details like systemPrompt)
    res.json({
      id: site.id,
      name: site.name,
      domain: site.domain,
      isActive: site.isActive,
      themeColor: site.themeColor || '#8b5cf6',
      logoUrl: site.logoUrl || '',
      position: site.position || 'right',
      welcomeMessage: site.welcomeMessage || '¡Hola! ¿En qué puedo ayudarte?',
      avatarUrl: site.avatarUrl || '',
      whatsappNumber: site.whatsappNumber || '',
      supportSchedule: site.supportSchedule || { active: false },
      faqs: site.faqs || []
    });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/widget/chat
 * Handles sending messages from the widget and generating LLM responses via Groq
 */
app.post('/api/widget/chat', async (req, res) => {
  const { apiKey, visitorId, message } = req.body;

  if (!apiKey || !visitorId || !message) {
    return res.status(400).json({ error: 'Missing required parameters: apiKey, visitorId, message.' });
  }

  try {
    const site = await db.sites.getByApiKey(apiKey);
    if (!site) {
      return res.status(404).json({ error: 'Site not found.' });
    }

    if (!site.isActive) {
      return res.json({
        reply: "El servicio de chat de soporte se encuentra temporalmente inactivo.",
        status: "inactive"
      });
    }

    // Find or create conversation
    let conversation = await db.conversations.getByVisitor(site.id, visitorId);
    if (!conversation) {
      conversation = await db.conversations.create({
        siteId: site.id,
        visitorId,
        status: 'active',
        messages: []
      });
    }

    // Add user message
    conversation = await db.conversations.addMessage(conversation.id, {
      sender: 'user',
      text: message
    });

    // Detect if user specifically requests a human / WhatsApp
    const detectsEscalation = groqService.detectsEscalationIntent(message);
    if (detectsEscalation && conversation.status !== 'escalated_whatsapp') {
      conversation = await db.conversations.update(conversation.id, {
        status: 'escalated_whatsapp'
      });
    }

    // Check if conversation is intercepted by a human agent
    if (conversation.status === 'intercepted') {
      // In intercepted mode, the AI remains silent until the agent toggles back
      return res.json({
        reply: "Un agente humano ha tomado el control del chat. Te responderemos en breve.",
        status: conversation.status
      });
    }

    // Generate AI response
    const botReply = await groqService.generateResponse(site, conversation.messages, message);

    // Save bot reply
    await db.conversations.addMessage(conversation.id, {
      sender: 'bot',
      text: botReply
    });

    res.json({
      reply: botReply,
      status: conversation.status
    });
  } catch (error) {
    console.error('Error handling widget chat message:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- ADMIN APIS (AUTH & CRUD) ---

/**
 * POST /api/admin/login
 * Dummy login endpoint for local testing fallback (until Firebase Auth is configured)
 */
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@orodig.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (email === adminEmail && password === adminPassword) {
    res.json({
      success: true,
      token: 'mock-jwt-token-orodig-ai',
      user: { email, role: 'admin', name: 'OroDig Administrator' }
    });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas.' });
  }
});

// Admin Sites CRUD
app.get('/api/admin/sites', async (req, res) => {
  try {
    const list = await db.sites.getAll();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/sites', async (req, res) => {
  try {
    const { name, domain, themeColor, logoUrl, position, welcomeMessage, avatarUrl, aiModel, systemPrompt, faqs, companyInfo, whatsappNumber, supportSchedule } = req.body;
    
    if (!name || !domain) {
      return res.status(400).json({ error: 'Name and domain are required.' });
    }

    // Generate unique API key
    const apiKey = 'ORODIG_SITE_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const siteObj = {
      name,
      domain,
      apiKey,
      isActive: true,
      themeColor: themeColor || '#8b5cf6',
      logoUrl: logoUrl || '',
      position: position || 'right',
      welcomeMessage: welcomeMessage || '¡Hola! ¿En qué podemos ayudarte?',
      avatarUrl: avatarUrl || '',
      aiModel: aiModel || 'llama3-8b-8192',
      systemPrompt: systemPrompt || 'Eres un asistente de soporte.',
      faqs: faqs || [],
      companyInfo: companyInfo || '',
      whatsappNumber: whatsappNumber || '',
      supportSchedule: supportSchedule || { active: false }
    };

    const newSite = await db.sites.create(siteObj);
    res.status(201).json(newSite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/sites/:id', async (req, res) => {
  try {
    const updated = await db.sites.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Site not found.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/sites/:id', async (req, res) => {
  try {
    const deleted = await db.sites.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Site not found.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Conversations Endpoints
app.get('/api/admin/conversations', async (req, res) => {
  try {
    const list = await db.conversations.getAll();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/conversations/:id/message', async (req, res) => {
  const { sender, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  try {
    // Add manual agent response and auto-intercept conversation
    let conv = await db.conversations.getById(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

    // Set status to intercepted so AI shuts up while human is talking
    await db.conversations.update(req.params.id, {
      status: 'intercepted'
    });

    conv = await db.conversations.addMessage(req.params.id, {
      sender: sender || 'agent',
      text
    });

    res.json(conv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/conversations/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const updated = await db.conversations.update(req.params.id, { status });
    if (!updated) return res.status(404).json({ error: 'Conversation not found.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SPA FRONTEND HOSTING FALLBACK ---

// Serve React production build statically in production mode
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback HTML router for frontend client side navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 OroDig AI Support backend running at http://localhost:${PORT}`);
  console.log(`📡 Integrated Loader script served at http://localhost:${PORT}/widget.js`);
});
