const { getDatabaseConnection } = require('../../../config/turso');
const { generateNotFoundError, generateValidationError } = require('../../../utils/error-classes');
const logger = require('../../../utils/logger');

/**
 * Get stats for admin dashboard
 * @route GET /api/v1/stats
 */
const getStats = async (req, res) => {
  try {
    const ordersDb = await getDatabaseConnection('orders');

    // Get today's aggregates (Kolkata timezone)
    const todayStart = await ordersDb.execute({
      sql: "SELECT datetime('now', 'start of day', '-5 hours', '-30 minutes') as start",
    });
    const todayEnd = await ordersDb.execute({
      sql: "SELECT datetime('now', 'start of day', '+1 day', '-5 hours', '-30 minutes') as end",
    });
    const startToday = todayStart.rows[0].start;
    const endToday = todayEnd.rows[0].end;

    // Get yesterday's aggregates
    const yesterdayStart = await ordersDb.execute({
      sql: "SELECT datetime('now', 'start of day', '-1 day', '-5 hours', '-30 minutes') as start",
    });
    const yesterdayEnd = await ordersDb.execute({
      sql: "SELECT datetime('now', 'start of day', '0 days', '-5 hours', '-30 minutes') as end",
    });
    const startYesterday = yesterdayStart.rows[0].start;
    const endYesterday = yesterdayEnd.rows[0].end;

    // Query for today's confirmed orders
    const todayResult = await ordersDb.execute({
      sql: `
        SELECT
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE status IN ('approved', 'completed')
          AND created_at >= ?
          AND created_at < ?
      `,
      args: [startToday, endToday],
    });

    // Query for yesterday's confirmed orders
    const yesterdayResult = await ordersDb.execute({
      sql: `
        SELECT
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE status IN ('approved', 'completed')
          AND created_at >= ?
          AND created_at < ?
      `,
      args: [startYesterday, endYesterday],
    });

    // Query for pending orders (needs attention)
    const pendingResult = await ordersDb.execute({
      sql: `
        SELECT COUNT(*) as pending_count
        FROM orders
        WHERE status = 'pending'
      `,
    });

    const todayOrderCount = todayResult.rows[0].order_count;
    const todayRevenue = parseFloat(todayResult.rows[0].revenue) || 0;
    const yesterdayOrderCount = yesterdayResult.rows[0].order_count;
    const yesterdayRevenue = parseFloat(yesterdayResult.rows[0].revenue) || 0;
    const pendingCount = pendingResult.rows[0].pending_count;

    // Calculate average order value for today
    const avgOrderValue = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;

    // Calculate trend percentages
    const orderTrend = yesterdayOrderCount > 0 ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount * 100) : 0;
    const revenueTrend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

    // Format values
    const formatINR = (num) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    const stats = [
      {
        label: "Orders today",
        value: todayOrderCount.toString(),
        trend: `${orderTrend >= 0 ? '+' : ''}${orderTrend.toFixed(1)}%`,
        tone: orderTrend >= 0 ? "green" : "red",
      },
      {
        label: "Revenue today",
        value: formatINR(todayRevenue),
        trend: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`,
        tone: revenueTrend >= 0 ? "green" : "red",
      },
      {
        label: "Avg. order value",
        value: formatINR(avgOrderValue),
        trend: "--",
        tone: "amber",
      },
      {
        label: "Needs attention",
        value: pendingCount.toString(),
        trend: `${pendingCount} pending`,
        tone: pendingCount > 0 ? "amber" : "neutral",
      },
    ];

    res.status(200).json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get revenue time series data for analytics
 * @route GET /api/v1/stats/revenue
 */
const getRevenueStats = async (req, res) => {
  try {
    const { range, bucket, from, to } = req.query;
    const ordersDb = await getDatabaseConnection('orders');

    // Validate bucket
    const validBuckets = ['day', 'week', 'month'];
    if (bucket && !validBuckets.includes(bucket)) {
      return res.status(400).json({ success: false, message: 'Invalid bucket parameter' });
    }

    // Determine date range
    let startDate, endDate;
    if (from && to) {
      // Validate format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(from) || !dateRegex.test(to)) {
        return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      startDate = from;
      endDate = to; // inclusive, we'll make exclusive by adding 1 day
    } else {
      // Use range parameter
      const now = new Date();
      let rangeStart, rangeEnd;
      switch (range) {
        case 'lifetime':
          // No lower bound, use earliest order date
          rangeStart = null; // we'll handle in query
          rangeEnd = now.toISOString().split('T')[0];
          break;
        case '12m':
          rangeStart = new Date(now);
          rangeStart.setMonth(rangeStart.getMonth() - 12);
          break;
        case '6m':
          rangeStart = new Date(now);
          rangeStart.setMonth(rangeStart.getMonth() - 6);
          break;
        case '30d':
          rangeStart = new Date(now);
          rangeStart.setDate(rangeStart.getDate() - 30);
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid range parameter' });
      }
      if (rangeStart) {
        startDate = rangeStart.toISOString().split('T')[0];
      }
      endDate = now.toISOString().split('T')[0];
    }

    // Convert to Kolkata time UTC boundaries
    // Helper to convert Kolkata date string to UTC start of day
    const kolkataDateToUTCStart = (dateStr) => {
      // dateStr is YYYY-MM-DD, represents start of day in Kolkata
      // Convert to UTC: subtract 5 hours 30 minutes
      return `datetime('${dateStr}', '-5 hours', '-30 minutes')`;
    };
    const kolkataDateToUTCEnd = (dateStr) => {
      // end exclusive: start of next day in Kolkata, converted to UTC
      return `datetime('${dateStr}', '+1 day', '-5 hours', '-30 minutes')`;
    };

    let startUTC, endUTC;
    if (startDate) {
      startUTC = kolkataDateToUTCStart(startDate);
    } else {
      // lifetime: no lower bound, we'll use a very early date or null
      startUTC = null;
    }
    endUTC = kolkataDateToUTCEnd(endDate);

    // Build base query
    let sql = `
      SELECT
        `;
    // Depending on bucket, we need to group by period
    if (bucket === 'day') {
      sql += `strftime('%Y-%m-%d', datetime(created_at, '+5 hours', '+30 minutes')) as period,`;
    } else if (bucket === 'week') {
      sql += `strftime('%Y-%W', datetime(created_at, '+5 hours', '+30 minutes')) as period,`;
    } else if (bucket === 'month') {
      sql += `strftime('%Y-%m', datetime(created_at, '+5 hours', '+30 minutes')) as period,`;
    } else {
      // default to month if bucket not specified
      sql += `strftime('%Y-%m', datetime(created_at, '+5 hours', '+30 minutes')) as period,`;
    }
    sql += `
      COUNT(*) as order_count,
      SUM(total_amount) as revenue
      FROM orders
      WHERE status IN ('approved', 'completed')
    `;
    const args = [];

    // Add date filters
    if (startUTC) {
      sql += ` AND created_at >= ${startUTC}`;
    }
    if (endUTC) {
      sql += ` AND created_at < ${endUTC}`;
    }

    // Add grouping
    sql += ` GROUP BY period ORDER BY period`;

    // Execute query
    const result = await ordersDb.execute({ sql, args });

    // Format series
    const series = result.rows.map((row) => {
      let label = row.period;
      if (bucket === 'day') {
        // period is YYYY-MM-DD
        label = new Date(row.period).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      } else if (bucket === 'week') {
        // period is YYYY-WW (week number)
        // We'll approximate label as year and week number
        label = `Week ${row.period.split('-')[1]} ${row.period.split('-')[0]}`;
      } else if (bucket === 'month') {
        // period is YYYY-MM
        label = new Date(`${row.period}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      }
      return {
        period: row.period,
        label: label,
        revenue: parseFloat(row.revenue) || 0,
        orders: parseInt(row.order_count) || 0,
      };
    });

    // Determine overall summary for the range
    const totalRevenue = series.reduce((sum, s) => sum + s.revenue, 0);
    const totalOrders = series.reduce((sum, s) => sum + s.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const summary = {
      lifetimeRevenue: Math.round(totalRevenue),
      periodRevenue: Math.round(totalRevenue),
      orderCount: totalOrders,
      averageOrderValue: Math.round(avgOrderValue),
      todayRevenue: 0, // we could compute today separately but not required for this endpoint
      thisMonthRevenue: 0,
      previousPeriodRevenue: 0,
      periodChangePercent: 0,
    };

    // If range is not lifetime, we could compute previous period for comparison, but skip for simplicity.

    res.status(200).json({
      success: true,
      data: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        range: range || 'custom',
        from: startDate || '',
        to: endDate,
        bucket: bucket || 'month',
        includedStatuses: ['approved', 'completed'],
        summary: summary,
        series: series,
      },
    });
  } catch (error) {
    logger.error('Error fetching revenue stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getStats,
  getRevenueStats,
};
