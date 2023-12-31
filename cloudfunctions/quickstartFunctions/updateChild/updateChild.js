const cloud = require('wx-server-sdk');
const {
  createIfNotExist,
  fetchUserInfo
} = require('../util/dbutils');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command
const tableName = "userInfo";

exports.main = async (event, context) => {
  let {
    OPENID
  } = cloud.getWXContext();
  try {
    await createIfNotExist(tableName);
    //查询用户记录
    let userinfo = await fetchUserInfo();
    let childs = userinfo.childs;

    if (!childs) {
      childs = [];
    }

    childs.push(event.child);

    return db.collection(tableName).where({
      openId: OPENID,
    }).update({
      data: {
        childs: childs,
      }
    });

  } catch (e) {
    console.error(e)
  }
}