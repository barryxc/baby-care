const cloud = require('wx-server-sdk');
const {
  createIfNotExist,
  fetchUserInfo
} = require('../util/dbutils');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const tableName = "records";

// 查询数据库集合云函数入口函数
exports.main = async (event, context) => {
  let {
    OPENID,
    APPID,
  } = cloud.getWXContext()
  await createIfNotExist(tableName);
  if (!event.childId) {
    return [];
  }

  try {
    let result = await db.collection(tableName).where({
      date: event.date,
      childId: event.childId,
      appId: APPID
    }).limit(100).get();

    return result;
  } catch (error) {
    console.log(error)
  }
};