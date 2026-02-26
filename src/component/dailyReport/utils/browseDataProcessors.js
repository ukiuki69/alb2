import { getUser } from '../../../commonModule';
import {
  formatDate, renderTransferItemsGeneral, formatActualCostContent,
  getNoticeKeysWithContent, appendNoticeData,
  formatGoalEvaluationContent, getGoalEvaluationFilterLabel, formatGoalEvaluationItemLabel,
  formatTwoCharsWithBr, getGoalEvaluationId
} from './browseHelpers';

export const makeProcessData = (props) => {
  let processedData = [];
  const { data, users, filters, schedule, userList, classes } = props;
  const uida = userList.filter(e=>e.checked).map(e => 'UID' + e.uid);
  uida.forEach((uid) => {
    const userDt = data[uid];
    if (!userDt) return;
    const user = getUser(uid, users);
    const nuid = uid.replace('UID', '');
    const monthlyGoalMap = new Map();
    Object.keys(userDt).sort((a, b)=> (a < b ? -1: 1)).forEach((did) => {
      const entry = userDt[did];
      const sch = schedule[uid]?.[did];
      const date = formatDate(did);
      if (!sch) return;
      if (filters.利用時間) {
        if (!sch.absence){
          processedData.push({
            uid: nuid ,date, name: user.name,ageStr: user.ageStr,
            item: '利用時間',
            content: '利用時間: ' 
             + (entry.start || sch.start) + ' - ' + (entry.end || sch.end)
          });
        }
      }
      if (filters.送迎 && !sch.absence) {
        let content = '';
        if (sch?.transfer?.[0]) {
          content += renderTransferItemsGeneral(entry, classes, 'pickup');
        }
        if (sch?.transfer?.[1]) {
          content += renderTransferItemsGeneral(entry, classes, 'dropoff');
        }
        if (content){
          processedData.push({
            uid: nuid ,date, name: user.name,ageStr: user.ageStr,
            item: '送迎',
            content,
          });
        };
      }
      if (entry.notice && filters.療育記録) {
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: '療育<br>記録',
          content: entry.notice.replace(/\n/g, '<br>'),
        });
      }
      if (entry.kessekiNotice && filters.欠席) {
        if (!sch?.dAddiction?.欠席時対応加算) return;
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: '欠席時<br>対応',
          content: entry.kessekiNotice.replace(/\n/g, '<br>'),
        });
      }
      if (Array.isArray(entry.activities) && entry.activities.length && filters.活動) {
        if (sch.absence) return;
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: '活動',
          content: entry.activities.join(' ').replace(/\n/g, '<br>'),
        });
      }
      if (entry.senmonShienNotice && filters.専門支援) {
        if (!sch?.dAddiction?.専門的支援実施加算) return;
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: '専門的<br>支援',
          content: entry.senmonShienNotice.replace(/\n/g, '<br>'),
        });
      }
      if (entry.kosodateNotice && filters.子育て) {
        if (!sch?.dAddiction?.子育てサポート加算) return;
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: '子育て<br>サポ',
          content: entry.kosodateNotice.replace(/\n/g, '<br>'),
        });
      }
      if (entry.kazokuShienNotice && filters.家族支援) {
        if (!Object.keys(sch.dAddiction || []).some(e => e.includes('家族支援'))) return;
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: '家族<br>支援',
          content: entry.kazokuShienNotice.replace(/\n/g, '<br>'),
        });
      }
      if (entry.kankeiKikanNotice && filters.関係連携) {
        if (!Object.keys(sch.dAddiction || []).some(e => e.includes('関係機関連携'))) return;
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: '関係<br>連携',
          content: entry.kankeiKikanNotice.replace(/\n/g, '<br>'),
        });
      }
      if (entry.jigyosyoKanNotice && filters.事業所間連携) {
        if (!Object.keys(sch.dAddiction || []).some(e => e.includes('事業所間連携'))) return;
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: '事業所<br>連携',
          content: entry.jigyosyoKanNotice.replace(/\n/g, '<br>'),
        });
      }
      if (filters.実費) {
        const actualCostContent = formatActualCostContent(sch?.actualCost);
        if (actualCostContent) {
          processedData.push({
            uid: nuid ,date, name: user.name,ageStr: user.ageStr,
            item: '実費',
            content: actualCostContent,
          });
        }
      }
      if (Array.isArray(entry.goalEvaluations) && entry.goalEvaluations.length) {
        ["personalSupport", "senmonShien", "personalSupportHohou"].forEach((goalItem) => {
          const filterLabel = getGoalEvaluationFilterLabel(goalItem);
          if (!filterLabel || !filters[filterLabel]) return;
          const content = formatGoalEvaluationContent(entry.goalEvaluations, goalItem);
          const itemLabel = formatGoalEvaluationItemLabel(goalItem);
          if (!content) return;
          processedData.push({
            uid: nuid, date, name: user.name, ageStr: user.ageStr,
            item: itemLabel || filterLabel,
            content,
          });
        });

        entry.goalEvaluations.forEach((ev) => {
          const evalId = getGoalEvaluationId(ev);
          if (!evalId) return;
          const goalItem = ev?.item;
          const filterLabel = getGoalEvaluationFilterLabel(goalItem);
          if (!goalItem || !filterLabel || !filters[filterLabel]) return;
          const score = Number(ev?.score);
          if (!Number.isFinite(score)) return;

          if (!monthlyGoalMap.has(evalId)) {
            monthlyGoalMap.set(evalId, {
              item: goalItem,
              target: ev?.target || "",
              domains: ev?.domains || "",
              sum: 0,
              count: 0,
            });
          }
          const agg = monthlyGoalMap.get(evalId);
          agg.sum += score;
          agg.count += 1;
          if (!agg.target && ev?.target) agg.target = ev.target;
          if (!agg.domains && ev?.domains) agg.domains = ev.domains;
        });
      }
      if (entry.hiyariHatto && filters.ヒヤリハット) {
        processedData.push({
          uid: nuid ,date, name: user.name,ageStr: user.ageStr,
          item: 'ヒヤリ<br>ハット',
          content: entry.hiyariHatto.replace(/\n/g, '<br>'),
        });
      }
    });

    const monthlyDateLabel = formatTwoCharsWithBr('月間評価');
    const monthlyByItemMap = new Map();
    monthlyGoalMap.forEach((agg) => {
      if (!agg.count) return;
      const filterLabel = getGoalEvaluationFilterLabel(agg.item);
      const itemLabel = formatGoalEvaluationItemLabel(agg.item);
      if (!filterLabel || !filters[filterLabel]) return;
      const avgScore = Math.round(agg.sum / agg.count);
      const content = formatGoalEvaluationContent([{
        item: agg.item,
        target: agg.target,
        domains: agg.domains,
        score: avgScore,
      }], agg.item);
      if (!content) return;

      if (!monthlyByItemMap.has(agg.item)) {
        monthlyByItemMap.set(agg.item, {
          item: itemLabel || filterLabel,
          contents: [],
        });
      }
      monthlyByItemMap.get(agg.item).contents.push(content);
    });

    monthlyByItemMap.forEach((grouped) => {
      processedData.push({
        uid: nuid,
        date: monthlyDateLabel || '月間評価',
        name: user.name,
        ageStr: user.ageStr,
        item: grouped.item,
        content: grouped.contents.join('<br>'),
      });
    });
  });

  return processedData;
};

export const makeProcessDataByDate = (props) => {
  const { data, users, filters, schedule, userList, specifiedDate, classes, service, classroom} = props;
  const uida = userList.filter(e => e.checked).map(e => 'UID' + e.uid);
  
  // 日付ごとにデータをグループ化
  const dateGroupedData = {};

  uida.forEach((uid) => {
    const userDt = data[uid];
    if (!userDt) return;
    const user = getUser(uid, users);
    Object.keys(userDt).forEach((did) => {
      const entry = userDt[did];
      const sch = schedule[uid]?.[did];
      const date = formatDate(did);
      if (!sch) return;

      if (!dateGroupedData[date]) {
        dateGroupedData[date] = [];
      }
      // 日付指定があるときは単独日付のみ処理を行う
      // if (specifiedDate && specifiedDate !== did) return;
      if (filters.利用時間) {
        if (!sch.absence){
          dateGroupedData[date].push({
            uid, date, name: user.name,ageStr: user.ageStr,
            item: '利用時間',
            content: '利用時間: ' + (entry.start || sch.start) + ' - ' + (entry.end || sch.end),
          });
        }
      }
      if (filters.送迎 && !sch.absence) {
        let content = '';
        if (sch?.transfer?.[0]) {
          content += renderTransferItemsGeneral(entry, classes, 'pickup');
        }
        if (sch?.transfer?.[1]) {
          content += renderTransferItemsGeneral(entry, classes, 'dropoff');
        }
        if (content){
          dateGroupedData[date].push({
            uid, date, name: user.name,ageStr: user.ageStr,
            item: '送迎',
            content,
          });
        };
      }


      if (entry.notice && filters.療育記録) {
        dateGroupedData[date].push({
          uid, date, name: user.name, ageStr: user.ageStr,
          item: '療育<br>記録',
          content: entry.notice.replace(/\n/g, '<br>'),
        });
      }

      if (entry.kessekiNotice && filters.欠席) {
        if (!sch?.dAddiction?.欠席時対応加算) return;
        dateGroupedData[date].push({
          uid, date, name: user.name, ageStr: user.ageStr,
          item: '欠席時<br>対応',
          content: entry.kessekiNotice.replace(/\n/g, '<br>'),
        });
      }

      if (Array.isArray(entry.activities) && entry.activities.length && filters.活動) {
        if (sch.absence) return;
        dateGroupedData[date].push({
          uid, date, name: user.name, ageStr: user.ageStr,
          item: '活動',
          content: entry.activities.join(' ').replace(/\n/g, '<br>'),
        });
      }

      if (entry.senmonShienNotice && filters.専門支援) {
        if (!sch?.dAddiction?.専門的支援実施加算) return;
        dateGroupedData[date].push({
          uid, date, name: user.name, ageStr: user.ageStr,
          item: '専門的<br>支援',
          content: entry.senmonShienNotice.replace(/\n/g, '<br>'),
        });
      }

      if (entry.kosodateNotice && filters.子育て) {
        if (!sch?.dAddiction?.子育てサポート加算) return;
        dateGroupedData[date].push({
          uid, date, name: user.name, ageStr: user.ageStr,
          item: '子育て<br>サポ',
          content: entry.kosodateNotice.replace(/\n/g, '<br>'),
        });
      }

      if (entry.kazokuShienNotice && filters.家族支援) {
        if (!Object.keys(sch.dAddiction || []).some(e => e.includes('家族支援'))) return;
        dateGroupedData[date].push({
          uid, date, name: user.name, ageStr: user.ageStr,
          item: '家族<br>支援',
          content: entry.kazokuShienNotice.replace(/\n/g, '<br>'),
        });
      }
      // 新たに追加する処理
      if (entry.kankeiKikanNotice && filters.関係連携) {
        dateGroupedData[date].push({
          uid, date, name: user.name, ageStr: user.ageStr,
          item: '関係<br>連携',
          content: entry.kankeiKikanNotice.replace(/\n/g, '<br>'),
        });
      }
      if (entry.jigyosyoKanNotice && filters.事業所間連携) {
        dateGroupedData[date].push({
          uid, date, name: user.name, ageStr: user.ageStr,
          item: '事業所<br>連携',
          content: entry.jigyosyoKanNotice.replace(/\n/g, '<br>'),
        });
      }
      if (filters.実費) {
        const actualCostContent = formatActualCostContent(sch?.actualCost);
        if (actualCostContent) {
          dateGroupedData[date].push({
            uid, date, name: user.name, ageStr: user.ageStr,
            item: '実費',
            content: actualCostContent,
          });
        }
      }
      if (Array.isArray(entry.goalEvaluations) && entry.goalEvaluations.length) {
        ["personalSupport", "senmonShien", "personalSupportHohou"].forEach((goalItem) => {
          const filterLabel = getGoalEvaluationFilterLabel(goalItem);
          if (!filterLabel || !filters[filterLabel]) return;
          const content = formatGoalEvaluationContent(entry.goalEvaluations, goalItem);
          const itemLabel = formatGoalEvaluationItemLabel(goalItem);
          if (!content) return;
          dateGroupedData[date].push({
            uid, date, name: user.name, ageStr: user.ageStr,
            item: itemLabel || filterLabel,
            content,
          });
        });
      }
      if (entry.hiyariHatto && filters.ヒヤリハット) {
        dateGroupedData[date].push({
          uid: uid ,date, name: user.name,ageStr: user.ageStr,
          item: 'ヒヤリ<br>ハット',
          content: entry.hiyariHatto.replace(/\n/g, '<br>'),
        });
      }

    });
  });

  // Notice系データの処理
  const noticeKeys = getNoticeKeysWithContent(data, service, classroom).sort((a, b) => {
    // jNotice, jTrainingNotice を各グループの先頭に配置
    if (a === 'jNotice') return -1;
    if (b === 'jNotice') return 1;
    if (a === 'jTrainingNotice') return -1;
    if (b === 'jTrainingNotice') return 1;
    return a.localeCompare(b);
  });
  console.log('service:', service, 'classroom:', classroom, 'noticeKeys:', noticeKeys);
  const generalNoticeKeys = noticeKeys.filter(key => !key.includes("TrainingNotice"));
  const trainingNoticeKeys = noticeKeys.filter(key => key.includes("TrainingNotice"));

  const shouldIncludeGeneralNotice = filters.jNotice ?? filters.事業所の記録;
  const shouldIncludeTrainingNotice = filters.jTrainingNotice ?? filters.法定研修記録;

  if (shouldIncludeGeneralNotice && generalNoticeKeys.length) {
    appendNoticeData(generalNoticeKeys, data, dateGroupedData, '事業所の記録');
  }
  if (shouldIncludeTrainingNotice && trainingNoticeKeys.length) {
    appendNoticeData(trainingNoticeKeys, data, dateGroupedData, '法定研修記録');
  }

  return dateGroupedData;
};
