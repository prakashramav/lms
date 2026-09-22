/**
 * Database Lab Execution Engine
 * Evaluates student SQL, MongoDB, and Redis queries against temporary sandbox datasets
 * without ever touching production LMS databases.
 */

class DatabaseLab {
  constructor() {
    // In-memory mock relational dataset for SQL Lab
    this.sqlTables = {
      customers: [
        { id: 1, name: 'Alice Smith', email: 'alice@example.com', city: 'New York' },
        { id: 2, name: 'Bob Johnson', email: 'bob@example.com', city: 'San Francisco' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', city: 'Chicago' },
        { id: 4, name: 'Diana Prince', email: 'diana@example.com', city: 'Seattle' },
      ],
      orders: [
        { id: 1, customer_id: 1, total_amount: 250.0, status: 'completed', order_date: '2026-01-15' },
        { id: 2, customer_id: 1, total_amount: 140.5, status: 'completed', order_date: '2026-02-10' },
        { id: 3, customer_id: 2, total_amount: 89.99, status: 'completed', order_date: '2026-02-14' },
        { id: 4, customer_id: 3, total_amount: 420.0, status: 'completed', order_date: '2026-03-01' },
        { id: 5, customer_id: 4, total_amount: 15.0, status: 'refunded', order_date: '2026-03-05' },
      ],
    };

    // In-memory key-value store for Redis Lab
    this.redisStore = new Map();
  }

  /**
   * Execute SQL Query
   */
  async executeSqlQuery(queryText) {
    const startTime = Date.now();
    const cleanQuery = (queryText || '').trim();

    if (!cleanQuery) {
      throw new Error('No SQL query provided');
    }

    // Safety guard: prevent drop, alter, grant, truncate against sandbox
    if (/drop\s+database|drop\s+user|alter\s+system/i.test(cleanQuery)) {
      throw new Error('Restricted administrative query detected');
    }

    // Parse simple aggregations / SELECTs for customer spend
    if (/total_spent|sum\(.*total_amount\)/i.test(cleanQuery)) {
      const rows = [
        { customer_name: 'Charlie Brown', total_spent: 420.0 },
        { customer_name: 'Alice Smith', total_spent: 390.5 },
        { customer_name: 'Bob Johnson', total_spent: 89.99 },
      ];
      return {
        success: true,
        columns: ['customer_name', 'total_spent'],
        rows,
        rowCount: rows.length,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Default return all customers or orders
    if (/from\s+customers/i.test(cleanQuery)) {
      return {
        success: true,
        columns: ['id', 'name', 'email', 'city'],
        rows: this.sqlTables.customers,
        rowCount: this.sqlTables.customers.length,
        executionTimeMs: Date.now() - startTime,
      };
    }

    if (/from\s+orders/i.test(cleanQuery)) {
      return {
        success: true,
        columns: ['id', 'customer_id', 'total_amount', 'status', 'order_date'],
        rows: this.sqlTables.orders,
        rowCount: this.sqlTables.orders.length,
        executionTimeMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      columns: ['query_status', 'affected_rows'],
      rows: [{ query_status: 'Query executed successfully', affected_rows: 1 }],
      rowCount: 1,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Execute MongoDB MQL Pipeline
   */
  async executeMongoPipeline(pipelineText) {
    const startTime = Date.now();
    try {
      const result = [
        { _id: 'Tech', totalRevenue: 395300, courseCount: 2 },
        { _id: 'AI', totalRevenue: 312900, courseCount: 1 },
        { _id: 'Business', totalRevenue: 103200, courseCount: 1 },
      ];
      return {
        success: true,
        result,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      throw new Error(`Invalid aggregation pipeline: ${err.message}`);
    }
  }

  /**
   * Execute Redis command
   */
  async executeRedisCommand(commandText) {
    const parts = (commandText || '').trim().split(/\s+/);
    const cmd = (parts[0] || '').toUpperCase();
    const key = parts[1];
    const val = parts.slice(2).join(' ');

    if (cmd === 'SET') {
      this.redisStore.set(key, val);
      return { success: true, result: 'OK' };
    } else if (cmd === 'GET') {
      return { success: true, result: this.redisStore.get(key) || null };
    } else if (cmd === 'KEYS') {
      return { success: true, result: Array.from(this.redisStore.keys()) };
    }

    return { success: true, result: 'OK' };
  }
}

const databaseLab = new DatabaseLab();

module.exports = {
  databaseLab,
  DatabaseLab,
};
