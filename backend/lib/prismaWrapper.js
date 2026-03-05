// Prisma wrapper using better-sqlite3 for SQLite database access
const Database = require('better-sqlite3');
const path = require('path');

let dbInstance;

function getDB() {
  if (!dbInstance) {
    dbInstance = new Database(path.join(__dirname, '../../backend/dev.db'));
  }
  return dbInstance;
}

class PrismawrappedClient {
  constructor() {
    this.db = getDB();
  }

  get user() {
    return {
      findUnique: async ({ where }) => {
        const db = this.db;
        if (where?.id) return db.prepare('SELECT * FROM User WHERE id = ?').get(where.id) || null;
        if (where?.email) return db.prepare('SELECT * FROM User WHERE email = ?').get(where.email) || null;
        return null;
      },
      create: async ({ data }) => {
        const db = this.db;
        const { name, email, password } = data;
        const now = new Date().toISOString();
        db.prepare('INSERT INTO User (name, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)').run(name, email, password, now, now);
        const user = db.prepare('SELECT id FROM User WHERE email = ? ORDER BY id DESC LIMIT 1').get(email);
        return { id: user.id, ...data, createdAt: now, updatedAt: now };
      },
      findMany: async () => db.prepare('SELECT * FROM User').all() || [],
      update: async ({ where, data }) => {
        if (where?.id) {
          const now = new Date().toISOString();
          const updateData = { ...data, updatedAt: now };
          const fields = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
          const values = Object.values(updateData);
          this.db.prepare(`UPDATE User SET ${fields} WHERE id = ?`).run(...values, where.id);
        }
        return { ...data };
      }
    };
  }

  get product() {
    return {
      findMany: async ({where,include} = {}) => this.db.prepare('SELECT * FROM Product').all() || [],
      create: async ({ data }) => {
        const { code, description, price, barcode, userId } = data;
        const now = new Date().toISOString();
        this.db.prepare('INSERT INTO Product (code, description, price, barcode, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(code, description, price, barcode, userId, now, now);
        return { ...data, createdAt: now, updatedAt: now };
      },
      update: async ({ where, data }) => {
        if (where?.id) {
          const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
          const values = Object.values(data);
          this.db.prepare(`UPDATE Product SET ${fields} WHERE id = ?`).run(...values, where.id);
        }
        return { ...data };
      },
      delete: async ({ where }) => {
        if (where?.id) this.db.prepare('DELETE FROM Product WHERE id = ?').run(where.id);
      }
    };
  }

  get client() {
    return {
      findMany: async ({where,include} = {}) => this.db.prepare('SELECT * FROM Client').all() || [],
      create: async ({ data }) => {
        const { name, address, tel, email, userId } = data;
        const now = new Date().toISOString();
        this.db.prepare('INSERT INTO Client (name, address, tel, email, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, address, tel, email, userId, now, now);
        return { ...data, createdAt: now, updatedAt: now };
      },
      update: async ({ where, data }) => {
        if (where?.id) {
          const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
          const values = Object.values(data);
          this.db.prepare(`UPDATE Client SET ${fields} WHERE id = ?`).run(...values, where.id);
        }
        return { ...data };
      }
    };
  }

  get invoice() {
    return {
      findMany: async ({where,include} = {}) => this.db.prepare('SELECT * FROM Invoice').all() || [],
      findUnique: async ({ where, include }) => {
        if (where?.id) return this.db.prepare('SELECT * FROM Invoice WHERE id = ?').get(where.id) || null;
        return null;
      },
      create: async ({ data, include }) => {
        const { number, clientId, userId, status, discount, discountType, subtotal, vat, total, signature } = data;
        const now = new Date().toISOString();
        this.db.prepare(`
          INSERT INTO Invoice (number, clientId, userId, status, discount, discountType, subtotal, vat, total, signature, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(number, clientId, userId, status, discount, discountType, subtotal, vat, total, signature || null, now, now);
        return { ...data, createdAt: now, updatedAt: now };
      },
      update: async ({ where, data }) => {
        if (where?.id) {
          const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
          const values = Object.values(data);
          this.db.prepare(`UPDATE Invoice SET ${fields} WHERE id = ?`).run(...values, where.id);
        }
        return { ...data };
      }
    };
  }

  get quote() {
    return {
      findMany: async ({where,include} = {}) => this.db.prepare('SELECT * FROM Quote').all() || [],
      create: async ({ data, include }) => {
        const { number, clientId, userId, status, discount, discountType, subtotal, vat, total, signature } = data;
        const now = new Date().toISOString();
        this.db.prepare(`
          INSERT INTO Quote (number, clientId, userId, status, discount, discountType, subtotal, vat, total, signature, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(number, clientId, userId, status, discount, discountType, subtotal, vat, total, signature || null, now, now);
        return { ...data, createdAt: now, updatedAt: now };
      }
    };
  }

  get item() {
    return {
      createMany: async ({ data }) => ({ count: data.length }),
      deleteMany: async ({ where }) => {}
    };
  }

  get company() {
    return {
      findFirst: async ({where,include} = {}) => this.db.prepare('SELECT * FROM Company LIMIT 1').get() || null,
      findUnique: async ({ where, include }) => {
        if (where?.userId) return this.db.prepare('SELECT * FROM Company WHERE userId = ?').get(where.userId) || null;
        return null;
      },
      create: async ({ data }) => {
        const { userId, tradingName, legalName, regNo, address, tel, email, vatNo, bankName, bankAccountNo, bankAccountHolder } = data;
        const now = new Date().toISOString();
        this.db.prepare(`
          INSERT INTO Company (userId, tradingName, legalName, regNo, address, tel, email, vatNo, bankName, bankAccountNo, bankAccountHolder, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, tradingName, legalName, regNo, address, tel, email, vatNo, bankName, bankAccountNo, bankAccountHolder, now, now);
        return { ...data, createdAt: now, updatedAt: now };
      },
      update: async ({ where, data }) => {
        if (where?.id) {
          const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
          const values = Object.values(data);
          this.db.prepare(`UPDATE Company SET ${fields} WHERE id = ?`).run(...values, where.id);
        } else if (where?.userId) {
          const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
          const values = Object.values(data);
          this.db.prepare(`UPDATE Company SET ${fields} WHERE userId = ?`).run(...values, where.userId);
        }
        return { ...data };
      },
      upsert: async ({ where, create, update }) => {
        const existing = await this.company.findUnique({ where });
        if (existing) return this.company.update({ where, data: update });
        return this.company.create({ data: create });
      }
    };
  }

  get settings() {
    return {
      findFirst: async ({where,include} = {}) => this.db.prepare('SELECT * FROM Settings LIMIT 1').get() || null,
      findUnique: async ({ where, include }) => {
        if (where?.userId) return this.db.prepare('SELECT * FROM Settings WHERE userId = ?').get(where.userId) || null;
        return null;
      },
      create: async ({ data }) => {
        const { userId, enableVat, vatPercentage, invoicePrefix, invoiceNumber, quotePrefix, quoteNumber } = data;
        const now = new Date().toISOString();
        this.db.prepare(`
          INSERT INTO Settings (userId, enableVat, vatPercentage, invoicePrefix, invoiceNumber, quotePrefix, quoteNumber, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, enableVat ?? true, vatPercentage ?? 15, invoicePrefix ?? 'INV', invoiceNumber ?? 1, quotePrefix ?? 'QUOTE', quoteNumber ?? 1, now, now);
        return { ...data, createdAt: now, updatedAt: now };
      },
      update: async ({ where, data }) => {
        if (where?.id) {
          const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
          const values = Object.values(data);
          this.db.prepare(`UPDATE Settings SET ${fields} WHERE id = ?`).run(...values, where.id);
        } else if (where?.userId) {
          const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
          const values = Object.values(data);
          this.db.prepare(`UPDATE Settings SET ${fields} WHERE userId = ?`).run(...values, where.userId);
        }
        return { ...data };
      },
      upsert: async ({ where, create, update }) => {
        const existing = await this.settings.findUnique({ where });
        if (existing) return this.settings.update({ where, data: update });
        return this.settings.create({ data: create });
      }
    };
  }

  async $disconnect() {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
  }
}

module.exports = { PrismaClient: PrismawrappedClient };
