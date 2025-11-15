/**
 * Artillery Processor
 * 부하 테스트용 헬퍼 함수
 */

module.exports = {
  // 랜덤 문자열 생성 (문서명 등에 사용)
  randomString: function (context, events, done) {
    const randomStr = Math.random().toString(36).substring(7);
    context.vars.randomString = randomStr;
    return done();
  },

  // 커스텀 메트릭 추가
  logMetrics: function (requestParams, response, context, ee, next) {
    if (response.statusCode === 200 || response.statusCode === 201) {
      // 성공 메트릭
      ee.emit('counter', 'api.success', 1);
    } else {
      // 실패 메트릭
      ee.emit('counter', 'api.error', 1);
    }
    return next();
  },
};
