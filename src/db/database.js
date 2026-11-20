import * as SQLite from 'expo-sqlite';

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
      name TEXT,
      code TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS polling_units (
      id TEXT PRIMARY KEY,
      name TEXT,
      code TEXT,
      ward_id TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      full_name TEXT,
      phone TEXT,
      ward_id TEXT,
      polling_unit_id TEXT,
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
}

// ---- Wards ----

export async function upsertWards(wards) {
  if (!wards || wards.length === 0) return;
  const database = getDB();
  await database.withTransactionAsync(async () => {
    for (const w of wards) {
      await database.runAsync(
        `INSERT INTO wards (id, name, code, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           code = excluded.code,
           updated_at = excluded.updated_at`,
        [w._id || w.id, w.name, w.code || null, w.updatedAt || w.updated_at || new Date().toISOString()]
      );
    }
  });
}

export async function getWards() {
  const database = getDB();
  return database.getAllAsync('SELECT * FROM wards ORDER BY name ASC');
}

// ---- Polling Units ----

export async function upsertPollingUnits(units) {
  if (!units || units.length === 0) return;
  const database = getDB();
  await database.withTransactionAsync(async () => {
    for (const u of units) {
      await database.runAsync(
        `INSERT INTO polling_units (id, name, code, ward_id, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           code = excluded.code,
           ward_id = excluded.ward_id,
           updated_at = excluded.updated_at`,
        [
          u._id || u.id,
          u.name,
          u.code || null,
          u.wardId || u.ward_id || (u.ward && (u.ward._id || u.ward)) || null,
          u.updatedAt || u.updated_at || new Date().toISOString(),
        ]
      );
    }
  });
}

export async function getPollingUnits(wardId) {
  const database = getDB();
  if (wardId) {
    return database.getAllAsync(
      'SELECT * FROM polling_units WHERE ward_id = ? ORDER BY name ASC',
      [wardId]
    );
  }
  return database.getAllAsync('SELECT * FROM polling_units ORDER BY name ASC');
}

// ---- People ----

export async function upsertPeople(people) {
  if (!people || people.length === 0) return;
  const database = getDB();
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
           image = excluded.image,
           voter_card_number = excluded.voter_card_number,
           contactable = excluded.contactable,
           updated_at = excluded.updated_at,
           synced = 1`,
        [
          p._id || p.id,
          p.fullName || p.full_name,
          p.phone,
          p.wardId || p.ward_id || (p.ward && (p.ward._id || p.ward)) || null,
          p.pollingUnitId || p.polling_unit_id || (p.pollingUnit && (p.pollingUnit._id || p.pollingUnit)) || null,
          p.address || null,
          p.notes || null,
          p.preferredContact || p.preferred_contact || null,
          p.image || null,
          p.voterCardNumber || p.voter_card_number || null,
          p.contactable !== undefined ? (p.contactable ? 1 : 0) : 1,
          p.createdAt || p.created_at || new Date().toISOString(),
          p.updatedAt || p.updated_at || new Date().toISOString(),
        ]
      );
    }
  });
}

export async function insertPerson(person) {
  const database = getDB();
  const id = person.id || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO people (id, full_name, phone, ward_id, polling_unit_id, address, notes, preferred_contact, image, voter_card_number, contactable, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      person.full_name,
      person.phone,
      person.ward_id || null,
      person.polling_unit_id || null,
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
           pu.name AS polling_unit_name
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
            pu.name AS polling_unit_name
     FROM people p
     LEFT JOIN wards w ON w.id = p.ward_id
     LEFT JOIN polling_units pu ON pu.id = p.polling_unit_id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function getPeopleCount() {
  const database = getDB();
  const row = await database.getFirstAsync('SELECT COUNT(*) as count FROM people');
  return row ? row.count : 0;
}

export async function checkPhoneDuplicate(phone, excludeId) {
  const database = getDB();
  let sql = 'SELECT id FROM people WHERE phone = ?';
  const params = [phone];
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  const row = await database.getFirstAsync(sql, params);
  return !!row;
}

// ---- Pending Uploads ----

export async function insertPendingUpload(localId, payload) {
  const database = getDB();
  await database.runAsync(
    `INSERT INTO pending_uploads (local_id, payload, status, created_at, retry_count)
     VALUES (?, ?, 'pending', ?, 0)`,
    [localId, JSON.stringify(payload), new Date().toISOString()]
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
  await database.runAsync(
    "UPDATE pending_uploads SET status = 'done' WHERE id = ?",
    [id]
  );
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

export async function markPersonSynced(localId, serverId) {
  const database = getDB();
  if (serverId && serverId !== localId) {
    await database.runAsync(
      'UPDATE people SET id = ?, synced = 1 WHERE id = ?',
      [serverId, localId]
    );
  } else {
    await database.runAsync('UPDATE people SET synced = 1 WHERE id = ?', [localId]);
  }
}

// ---- Sync Meta ----

export async function getSyncMeta(key) {
  const database = getDB();
  const row = await database.getFirstAsync(
    'SELECT value FROM sync_meta WHERE key = ?',
    [key]
  );
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
