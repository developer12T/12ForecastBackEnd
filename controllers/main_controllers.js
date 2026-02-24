const sql = require("mssql");
require("dotenv").config();
const config = {
  user: process.env.FORECAST_USER,
  password: process.env.FORECAST_PASSWORD,
  server: process.env.FORECAST_HOST,
  database: process.env.FORECAST_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};
exports.getZone = async (req, res) => {
  let channel = (req.query.channel || "").trim();

  await sql.connect(config);
  const request = new sql.Request();
  request.input("channel", sql.VarChar, channel);
  const query = `
            SELECT DISTINCT zone 
			FROM DATA_SALE.dbo.DATA_Area 
			WHERE zone NOT IN('SIX','PC','ON','MT','FS') AND (CHANNEL_NAME = @channel OR @channel = '')
			ORDER BY zone ASC;
    `;
  const result = await request.query(query);
  await sql.close();
  // console.log('getZone called');
  res.json({
    status: 200,
    message: "success",
    data: result.recordset,
  });
};

exports.getArea = async (req, res) => {
  try {
    let channel = (req.query.channel || "").trim();
    let zone = (req.query.zone || "").trim();
    // Validate input
    if (zone.length > 100) {
      return res.status(400).json({
        status: 400,
        message: "Zone parameter too long",
      });
    }

    await sql.connect(config);
    const request = new sql.Request();
    request.input("zone", sql.VarChar, zone);
    request.input("channel", sql.VarChar, channel);
    const query = `
          SELECT DISTINCT AREA
          FROM DATA_SALE.dbo.DATA_Area
          WHERE ZONE NOT IN ('SIX','PC','ON','MT','FS')
            AND (
              (@zone = 'KK' AND ZONE IN (SELECT value FROM STRING_SPLIT('ET,BK', ',')))
              OR
              (@zone <> 'KK' AND (@zone = '' OR ZONE IN (SELECT value FROM STRING_SPLIT(@zone, ','))))
            )
            AND (CHANNEL_NAME = @channel OR @channel = '')
          ORDER BY AREA ASC;
        `;

    const result = await request.query(query);

    res.json({
      status: 200,
      message: "success",
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in getArea:", error);
    res.status(500).json({
      status: 500,
      message: "Database error",
      error: error.message,
    });
  } finally {
    // ปิด connection หลังเสร็จทุกกรณี
    await sql.close();
  }
};

exports.getdata = async (req, res) => {
  let period = (req.query.month || "").trim();
  let channel = (req.query.channel || "").trim();
  let zone = (req.query.zone || "").trim();
  let area = (req.query.area || "").trim();

  await sql.connect(config);
  const request = new sql.Request();
  request.input("channel", sql.VarChar, channel);
  request.input("zone", sql.VarChar, zone);
  request.input("area", sql.VarChar, area);
  request.input("period", sql.VarChar, period);
  console.log("Received parameters:", { channel, zone, area, period });
  const query = `
          	SELECT		a.*,
                  MAX(CASE WHEN b.wk = 'w1' THEN b.qty ELSE NULL END) AS w1,
                  MAX(CASE WHEN b.wk = 'w2' THEN b.qty ELSE NULL END) AS w2,
                  MAX(CASE WHEN b.wk = 'w3' THEN b.qty ELSE NULL END) AS w3,
                  MAX(CASE WHEN b.wk = 'w4' THEN b.qty ELSE NULL END) AS w4,
                  b.sts_summit
            FROM		itemforecast a
            LEFT JOIN	(SELECT itemcode,wk,qty,sts_summit FROM forecast_temp WHERE area = @area) b 
                  ON a.ITEM_CODE = b.itemcode
            WHERE		a.STS_OPEN = 'Y' AND LEFT(a.ITEM_CODE, 3)  IN('100','200')
            GROUP BY	a.ITEM_CODE, a.ITEM_NAME, a.BRAND_CODE, a.GROUP_CODE, 
                  a.FLAVOUR_CODE, a.SIZE_CODE, a.RANGE_CODE, a.Premium, a.STS_OPEN,b.sts_summit
            ORDER BY	a.ITEM_NAME ASC;
        `;
  const result = await request.query(query);

  res.json({
    status: 200,
    message: "success",
    data: result.recordset,
  });
};
