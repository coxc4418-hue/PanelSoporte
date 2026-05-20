const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

const LOCAL_DB_PATH = path.join(__dirname, 'local_db.json');
let isFirebase = false;
let db = null;

// Initialize Database connection
function initDb() {
  // Check for firebase config in environment variables or service account file
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      });
      db = admin.firestore();
      isFirebase = true;
      console.log('🔥 Firebase Firestore database initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase with environment variables:', error);
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
      isFirebase = true;
      console.log('🔥 Firebase Firestore initialized via firebase-service-account.json!');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase via service account file:', error);
    }
  }

  if (!isFirebase) {
    console.warn('⚠️ Firebase credentials not found. Falling back to local JSON database (local_db.json)...');
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initialData = {
        sites: [
          {
            id: "site_default_01",
            name: "OroDig Colombia",
            domain: "orodig-col.web.app",
            apiKey: "ORODIG_SITE_001",
            isActive: true,
            themeColor: "#8b5cf6", // Purple neon
            logoUrl: "",
            position: "right",
            welcomeMessage: "¡Hola! Bienvenido a OroDig Colombia. ¿En qué podemos ayudarte hoy?",
            avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80",
            aiModel: "llama3-8b-8192",
            systemPrompt: "Eres un asistente virtual de OroDig Colombia. Eres amable, profesional y hablas en español. Respondes preguntas sobre servicios digitales de desarrollo de software, automatizaciones e IA.",
            faqs: [
              { q: "¿Qué servicios ofrecen?", a: "Ofrecemos desarrollo de software a medida, integración de asistentes IA, automatización de procesos y diseño web premium." },
              { q: "¿Cómo los contacto por WhatsApp?", a: "Puedes contactarnos directamente al +573000000000 para soporte prioritario." }
            ],
            companyInfo: "OroDig es una agencia de software líder en automatización y soluciones de IA.",
            whatsappNumber: "+573000000000",
            supportSchedule: { active: true, start: "08:00", end: "18:00" },
            createdAt: new Date().toISOString()
          },
          {
            id: "site_default_02",
            name: "OroDig Global",
            domain: "oro-dig.web.app",
            apiKey: "ORODIG_SITE_002",
            isActive: true,
            themeColor: "#06b6d4", // Cyan neon
            logoUrl: "",
            position: "right",
            welcomeMessage: "Hello! Welcome to OroDig Global. How can we help you today?",
            avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80",
            aiModel: "llama-3.1-8b-instant",
            systemPrompt: "You are the OroDig Global virtual support assistant. Professional and polite. Assist users with software development inquiries in English.",
            faqs: [
              { q: "What services do you provide?", a: "Custom web applications, AI integrations, automated workflows, and CRM systems." }
            ],
            companyInfo: "OroDig Global builds software solutions for international clients.",
            whatsappNumber: "+15550199",
            supportSchedule: { active: false, start: "09:00", end: "17:00" },
            createdAt: new Date().toISOString()
          }
        ],
        conversations: []
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
    }
  }
}

// Local DB Helpers
function readLocalDb() {
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local database file:', error);
    return { sites: [], conversations: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to local database file:', error);
    return false;
  }
}

// --- DATABASE API ---

// Sites CRUD
const sites = {
  async getAll() {
    if (isFirebase) {
      const snapshot = await db.collection('sites').get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } else {
      return readLocalDb().sites;
    }
  },

  async getById(id) {
    if (isFirebase) {
      const doc = await db.collection('sites').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } else {
      const list = readLocalDb().sites;
      return list.find(s => s.id === id) || null;
    }
  },

  async getByApiKey(apiKey) {
    if (isFirebase) {
      const snapshot = await db.collection('sites').where('apiKey', '==', apiKey).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      const list = readLocalDb().sites;
      return list.find(s => s.apiKey === apiKey) || null;
    }
  },

  async create(data) {
    const newId = isFirebase ? db.collection('sites').doc().id : 'site_' + Math.random().toString(36).substring(2, 9);
    const siteObj = {
      ...data,
      createdAt: new Date().toISOString()
    };
    
    if (isFirebase) {
      await db.collection('sites').doc(newId).set(siteObj);
      return { id: newId, ...siteObj };
    } else {
      const dbData = readLocalDb();
      siteObj.id = newId;
      dbData.sites.push(siteObj);
      writeLocalDb(dbData);
      return siteObj;
    }
  },

  async update(id, data) {
    if (isFirebase) {
      await db.collection('sites').doc(id).update(data);
      const updated = await this.getById(id);
      return updated;
    } else {
      const dbData = readLocalDb();
      const idx = dbData.sites.findIndex(s => s.id === id);
      if (idx === -1) return null;
      dbData.sites[idx] = { ...dbData.sites[idx], ...data };
      writeLocalDb(dbData);
      return dbData.sites[idx];
    }
  },

  async delete(id) {
    if (isFirebase) {
      await db.collection('sites').doc(id).delete();
      return true;
    } else {
      const dbData = readLocalDb();
      const filtered = dbData.sites.filter(s => s.id !== id);
      if (filtered.length === dbData.sites.length) return false;
      dbData.sites = filtered;
      writeLocalDb(dbData);
      return true;
    }
  }
};

// Conversations CRUD
const conversations = {
  async getAll() {
    if (isFirebase) {
      const snapshot = await db.collection('conversations').orderBy('updatedAt', 'desc').get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } else {
      const list = readLocalDb().conversations;
      return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
  },

  async getById(id) {
    if (isFirebase) {
      const doc = await db.collection('conversations').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } else {
      const list = readLocalDb().conversations;
      return list.find(c => c.id === id) || null;
    }
  },

  async getByVisitor(siteId, visitorId) {
    if (isFirebase) {
      const snapshot = await db.collection('conversations')
        .where('siteId', '==', siteId)
        .where('visitorId', '==', visitorId)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      const list = readLocalDb().conversations;
      return list.find(c => c.siteId === siteId && c.visitorId === visitorId) || null;
    }
  },

  async create(data) {
    const newId = isFirebase ? db.collection('conversations').doc().id : 'conv_' + Math.random().toString(36).substring(2, 9);
    const convObj = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: data.messages || []
    };

    if (isFirebase) {
      await db.collection('conversations').doc(newId).set(convObj);
      return { id: newId, ...convObj };
    } else {
      const dbData = readLocalDb();
      convObj.id = newId;
      dbData.conversations.push(convObj);
      writeLocalDb(dbData);
      return convObj;
    }
  },

  async update(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    if (isFirebase) {
      await db.collection('conversations').doc(id).update(updateData);
      return this.getById(id);
    } else {
      const dbData = readLocalDb();
      const idx = dbData.conversations.findIndex(c => c.id === id);
      if (idx === -1) return null;
      dbData.conversations[idx] = { ...dbData.conversations[idx], ...updateData };
      writeLocalDb(dbData);
      return dbData.conversations[idx];
    }
  },

  async addMessage(id, message) {
    const messageObj = {
      sender: message.sender, // 'user' | 'bot' | 'agent'
      text: message.text,
      timestamp: new Date().toISOString()
    };

    if (isFirebase) {
      const sfRef = db.collection('conversations').doc(id);
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(sfRef);
        if (!doc.exists) {
          throw new Error("Conversation does not exist!");
        }
        const currentMessages = doc.data().messages || [];
        transaction.update(sfRef, {
          messages: [...currentMessages, messageObj],
          updatedAt: new Date().toISOString()
        });
      });
      return this.getById(id);
    } else {
      const dbData = readLocalDb();
      const idx = dbData.conversations.findIndex(c => c.id === id);
      if (idx === -1) return null;
      dbData.conversations[idx].messages.push(messageObj);
      dbData.conversations[idx].updatedAt = new Date().toISOString();
      writeLocalDb(dbData);
      return dbData.conversations[idx];
    }
  }
};

module.exports = {
  initDb,
  sites,
  conversations,
  getIsFirebase: () => isFirebase
};
