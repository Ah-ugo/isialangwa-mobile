import * as SQLite from 'expo-sqlite';
import { INITIAL_WARDS, INITIAL_POLLING_UNITS } from './initialData';

let db = null;

function getDB() {
  if (!db) {
    db = SQLite.openDatabaseSync('isialangwa.db');
  }
  return db;
}

export async function initDB() {
  const database = getDB();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS auth_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS wards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      updated_at TEXT,
      synced INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS polling_units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      ward_id TEXT NOT NULL,
      description TEXT,
      updated_at TEXT,
      synced INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      ward_id TEXT NOT NULL,
      polling_unit_id TEXT NOT NULL,
      address TEXT,
      notes TEXT,
      preferred_contact TEXT,
      image TEXT,
      voter_card_number TEXT,
      contactable INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      synced INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS pending_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT DEFAULT 'person',
      local_id TEXT,
      payload TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT,
      error TEXT,
      retry_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_people_ward ON people(ward_id);
    CREATE INDEX IF NOT EXISTS idx_people_pu ON people(polling_unit_id);
    CREATE INDEX IF NOT EXISTS idx_people_phone ON people(phone);
    CREATE INDEX IF NOT EXISTS idx_pu_ward ON polling_units(ward_id);
    CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_uploads(status);
  `);

  // Seed real initial wards and polling units if local wards table is empty
  const countRow = await database.getFirstAsync('SELECT COUNT(*) as count FROM wards');
  if (!countRow || countRow.count === 0) {
    await seedInitialData(database);
  }
}

async function seedInitialData(database) {
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    for (const w of INITIAL_WARDS) {
      await database.runAsync(
        `INSERT OR IGNORE INTO wards (id, name, code, description, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [w.id, w.name, w.code || null, w.description || null, now]
      );
    }

    for (const pu of INITIAL_POLLING_UNITS) {
      await database.runAsync(
        `INSERT OR IGNORE INTO polling_units (id, name, code, ward_id, description, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [pu.id, pu.name, pu.code || null, pu.wardId, null, now]
      );
    }
  });
}

// ---- Wards ----

export async function upsertWards(wards) {
  if (!wards || wards.length === 0) return;
  const database = getDB();
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    for (const w of wards) {
      await database.runAsync(
        `INSERT INTO wards (id, name, code, description, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           code = excluded.code,
           description = excluded.description,
           updated_at = excluded.updated_at,
           synced = 1`,
        [w._id || w.id, w.name, w.code || null, w.description || null, w.updatedAt || w.updated_at || now]
      );
    }
  });
}

export async function insertWard(ward) {
  const database = getDB();
  const id = ward.id || `ward_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO wards (id, name, code, description, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [id, ward.name.trim(), ward.code ? ward.code.trim() : null, ward.description || null, now]
  );

  const payload = {
    name: ward.name.trim(),
    code: ward.code ? ward.code.trim() : undefined,
    description: ward.description || undefined,
  };
  await insertPendingUpload('ward', id, payload);
  return id;
}

export async function getWards() {
  const database = getDB();
  return database.getAllAsync('SELECT * FROM wards ORDER BY code ASC, name ASC');
}

export async function getWardsWithCounts() {
  const database = getDB();
  const sql = `
    SELECT w.*,
      (SELECT COUNT(*) FROM polling_units pu WHERE pu.ward_id = w.id) as polling_unit_count,
      (SELECT COUNT(*) FROM people p WHERE p.ward_id = w.id) as people_count
    FROM wards w
    ORDER BY w.code ASC, w.name ASC
  `;
  return database.getAllAsync(sql);
}

// ---- Polling Units ----

export async function upsertPollingUnits(units) {
  if (!units || units.length === 0) return;
  const database = getDB();
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    for (const u of units) {
      await database.runAsync(
        `INSERT INTO polling_units (id, name, code, ward_id, description, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           code = excluded.code,
           ward_id = excluded.ward_id,
           description = excluded.description,
           updated_at = excluded.updated_at,
           synced = 1`,
        [
          u._id || u.id,
          u.name,
          u.code || null,
          u.wardId || u.ward_id || (u.ward && (u.ward._id || u.ward)) || null,
          u.description || null,
          u.updatedAt || u.updated_at || now,
        ]
      );
    }
  });
}

export async function insertPollingUnit(pu) {
  const database = getDB();
  const id = pu.id || `pu_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO polling_units (id, name, code, ward_id, description, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [id, pu.name.trim(), pu.code ? pu.code.trim() : null, pu.wardId, pu.description || null, now]
  );

  const payload = {
    name: pu.name.trim(),
    code: pu.code ? pu.code.trim() : undefined,
    wardId: pu.wardId,
    description: pu.description || undefined,
  };
  await insertPendingUpload('polling_unit', id, payload);
  return id;
}

export async function getPollingUnits(wardId, q) {
  const database = getDB();
  const params = [];
  let where = '1=1';

  if (wardId) {
    where += ' AND pu.ward_id = ?';
    params.push(wardId);
  }
  if (q && q.trim()) {
    where += ' AND (pu.name LIKE ? OR pu.code LIKE ?)';
    const term = `%${q.trim()}%`;
    params.push(term, term);
  }

  const sql = `
    SELECT pu.*, w.name as ward_name, w.code as ward_code,
      (SELECT COUNT(*) FROM people p WHERE p.polling_unit_id = pu.id) as people_count
    FROM polling_units pu
    LEFT JOIN wards w ON w.id = pu.ward_id
    WHERE ${where}
    ORDER BY pu.code ASC, pu.name ASC
  `;
  return database.getAllAsync(sql, params);
}

// ---- People ----

export async function upsertPeople(people) {
  if (!people || people.length === 0) return;
  const database = getDB();
  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    for (const p of people) {
      await database.runAsync(
        `INSERT INTO people (id, full_name, phone, ward_id, polling_unit_id, address, notes, preferred_contact, image, voter_card_number, contactable, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET
           full_name = excluded.full_name,
           phone = excluded.phone,
           ward_id = excluded.ward_id,
           polling_unit_id = excluded.polling_unit_id,
           address = excluded.address,
           notes = excluded.notes,
           preferred_contact = excluded.preferred_contact,
           image = COALESCE(excluded.image, people.image),
           voter_card_number = excluded.voter_card_number,
           contactable = excluded.contactable,
           updated_at = excluded.updated_at,
           synced = 1`,
        [
          p._id || p.id,
          p.fullName || p.full_name,
          p.phone,
          p.wardId || p.ward_id || (p.ward && (p.ward._id || p.ward.id)),
          p.pollingUnitId || p.polling_unit_id || (p.pollingUnit && (p.pollingUnit._id || p.pollingUnit.id)),
          p.address || null,
          p.notes || null,
          p.preferredContact || p.preferred_contact || null,
          p.image || null,
          p.voterCardNumber || p.voter_card_number || null,
          p.contactable !== undefined ? (p.contactable ? 1 : 0) : 1,
          p.createdAt || p.created_at || now,
          p.updatedAt || p.updated_at || now,
        ]
      );
    }
  });
}

export async function insertPerson(person, payload) {
  const database = getDB();
  const id = person.id || `person_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO people (id, full_name, phone, ward_id, polling_unit_id, address, notes, preferred_contact, image, voter_card_number, contactable, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      person.full_name,
      person.phone,
      person.ward_id,
      person.polling_unit_id,
      person.address || null,
      person.notes || null,
      person.preferred_contact || null,
      person.image || null,
      person.voter_card_number || null,
      person.contactable !== undefined ? (person.contactable ? 1 : 0) : 1,
      now,
      now,
    ]
  );

  await insertPendingUpload('person', id, payload);
  return id;
}

export async function searchPeople(q, wardId, pollingUnitId) {
  const database = getDB();
  const params = [];
  let where = '1=1';

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    where += ' AND (p.full_name LIKE ? OR p.phone LIKE ? OR p.voter_card_number LIKE ?)';
    params.push(term, term, term);
  }
  if (wardId) {
    where += ' AND p.ward_id = ?';
    params.push(wardId);
  }
  if (pollingUnitId) {
    where += ' AND p.polling_unit_id = ?';
    params.push(pollingUnitId);
  }

  const sql = `
    SELECT p.*,
           w.name AS ward_name,
           w.code AS ward_code,
           pu.name AS polling_unit_name,
           pu.code AS polling_unit_code
    FROM people p
    LEFT JOIN wards w ON w.id = p.ward_id
    LEFT JOIN polling_units pu ON pu.id = p.polling_unit_id
    WHERE ${where}
    ORDER BY p.created_at DESC
    LIMIT 200
  `;
  return database.getAllAsync(sql, params);
}

export async function getPersonById(id) {
  const database = getDB();
  const rows = await database.getAllAsync(
    `SELECT p.*,
            w.name AS ward_name,
            w.code AS ward_code,
            pu.name AS polling_unit_name,
            pu.code AS polling_unit_code
     FROM people p
     LEFT JOIN wards w ON w.id = p.ward_id
     LEFT JOIN polling_units pu ON pu.id = p.polling_unit_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function getRecentPeople(limit = 5) {
  const database = getDB();
  const sql = `
    SELECT p.*,
           w.name AS ward_name,
           pu.name AS polling_unit_name
    FROM people p
    LEFT JOIN wards w ON w.id = p.ward_id
    LEFT JOIN polling_units pu ON pu.id = p.polling_unit_id
    ORDER BY p.created_at DESC
    LIMIT ?
  `;
  return database.getAllAsync(sql, [limit]);
}

export async function checkPhoneDuplicate(phone, excludeId) {
  const database = getDB();
  let sql = 'SELECT id, full_name FROM people WHERE phone = ?';
  const params = [phone];
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  return database.getFirstAsync(sql, params);
}

export async function getDashboardStats() {
  const database = getDB();
  const [peopleRow, wardsRow, puRow, pendingRow] = await Promise.all([
    database.getFirstAsync('SELECT COUNT(*) as count FROM people'),
    database.getFirstAsync('SELECT COUNT(*) as count FROM wards'),
    database.getFirstAsync('SELECT COUNT(*) as count FROM polling_units'),
    database.getFirstAsync("SELECT COUNT(*) as count FROM pending_uploads WHERE status = 'pending'"),
  ]);

  return {
    totalPeople: peopleRow?.count || 0,
    totalWards: wardsRow?.count || 0,
    totalPollingUnits: puRow?.count || 0,
    pendingCount: pendingRow?.count || 0,
  };
}

// ---- Pending Uploads Queue ----

export async function insertPendingUpload(type, localId, payload) {
  const database = getDB();
  await database.runAsync(
    `INSERT INTO pending_uploads (type, local_id, payload, status, created_at, retry_count)
     VALUES (?, ?, ?, 'pending', ?, 0)`,
    [type, localId, JSON.stringify(payload), new Date().toISOString()]
  );
}

export async function getPendingUploads() {
  const database = getDB();
  return database.getAllAsync(
    "SELECT * FROM pending_uploads WHERE status = 'pending' AND retry_count < 3 ORDER BY created_at ASC"
  );
}

export async function getPendingCount() {
  const database = getDB();
  const row = await database.getFirstAsync(
    "SELECT COUNT(*) as count FROM pending_uploads WHERE status = 'pending'"
  );
  return row ? row.count : 0;
}

export async function markUploadDone(id) {
  const database = getDB();
  await database.runAsync("UPDATE pending_uploads SET status = 'done' WHERE id = ?", [id]);
}

export async function markUploadFailed(id, error) {
  const database = getDB();
  await database.runAsync(
    `UPDATE pending_uploads
     SET status = CASE WHEN retry_count + 1 >= 3 THEN 'failed' ELSE 'pending' END,
         retry_count = retry_count + 1,
         error = ?
     WHERE id = ?`,
    [error, id]
  );
}

export async function markRecordSynced(type, localId, serverId) {
  const database = getDB();
  const table = type === 'ward' ? 'wards' : type === 'polling_unit' ? 'polling_units' : 'people';
  if (serverId && serverId !== localId) {
    await database.runAsync(
      `UPDATE ${table} SET id = ?, synced = 1 WHERE id = ?`,
      [serverId, localId]
    );
    // If ward changed ID, update child polling units and people
    if (type === 'ward') {
      await database.runAsync('UPDATE polling_units SET ward_id = ? WHERE ward_id = ?', [serverId, localId]);
      await database.runAsync('UPDATE people SET ward_id = ? WHERE ward_id = ?', [serverId, localId]);
    } else if (type === 'polling_unit') {
      await database.runAsync('UPDATE people SET polling_unit_id = ? WHERE polling_unit_id = ?', [serverId, localId]);
    }
  } else {
    await database.runAsync(`UPDATE ${table} SET synced = 1 WHERE id = ?`, [localId]);
  }
}

// ---- Sync Meta ----

export async function getSyncMeta(key) {
  const database = getDB();
  const row = await database.getFirstAsync('SELECT value FROM sync_meta WHERE key = ?', [key]);
  return row ? row.value : null;
}

export async function setSyncMeta(key, value) {
  const database = getDB();
  await database.runAsync(
    `INSERT INTO sync_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}
