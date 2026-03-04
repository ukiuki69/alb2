import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocalStorageState } from "../common/HashimotoComponents";
import { univApiCall } from "../../modules/api";
import { changeUserReportDtValue } from "./DailyReportCommon";
import { Button, Checkbox, TextField } from "@material-ui/core";
import { blue, grey, pink, teal } from "@material-ui/core/colors";
import { DomainBadges, toDomainsArray } from "../common/DomainBadges";
import FavoriteIcon from "@material-ui/icons/Favorite";
import FavoriteBorderIcon from "@material-ui/icons/FavoriteBorder";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import { Rating } from "@material-ui/lab";
import { brtoLf } from "../../commonModule";

const PLAN_ITEMS_FOR_GOAL_EVAL = ["personalSupport", "personalSupportHohou", "senmonShien"];
const EMPTY_EVALUATIONS = [];
const getEvaluationKey = (entry) => String(entry?.goalId || entry?.goalKey || "").trim();

const toYmd8 = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 8) return digits.slice(0, 8);
  return "";
};

const parseStartDateFromGoalId = (goalId) => {
  if (!goalId || typeof goalId !== "string") return null;
  const match = goalId.match(/^(.+)-(\d{8})-(\d{8})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return match[3];
};

const twoDigits = (value) => String(value).padStart(2, "0");

const makeFallbackGoalId = ({ uid, created, startDateYmd8, goal, index, usedIds }) => {
  const uidPart = uid || "";
  const createdPart = toYmd8(created);
  const startPart = startDateYmd8 || createdPart;
  const lineNo = goal?.LineNo ? twoDigits(goal.LineNo) : twoDigits(index + 1);
  let lineIdNum = Number.parseInt(goal?.LineID, 10);
  if (Number.isNaN(lineIdNum) || lineIdNum <= 0) lineIdNum = index + 1;

  let candidate = `${uidPart}-${createdPart}-${startPart}-${lineNo}-${twoDigits(lineIdNum)}`;
  while (usedIds.has(candidate)) {
    lineIdNum += 1;
    candidate = `${uidPart}-${createdPart}-${startPart}-${lineNo}-${twoDigits(lineIdNum)}`;
  }
  usedIds.add(candidate);
  return candidate;
};

const getGoalIdAndStartDate = ({ goal, uid, created, planStartDateYmd8, index, usedIds }) => {
  const existingId = String(goal?.ID || "").trim();
  if (existingId) {
    const startDate = parseStartDateFromGoalId(existingId);
    if (startDate) {
      usedIds.add(existingId);
      return { goalId: existingId, startDateYmd8: startDate };
    }
  }
  if (!planStartDateYmd8) return null;
  const fallbackId = makeFallbackGoalId({
    uid, created, startDateYmd8: planStartDateYmd8, goal, index, usedIds
  });
  return { goalId: fallbackId, startDateYmd8: planStartDateYmd8 };
};

const toGoalDomainsText = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join("、");
  if (typeof value === "string") return value;
  return "";
};

const toGoalDomainsArray = toDomainsArray;


const getDisplayWidth = (text) => {
  if (!text) return 0;
  return Array.from(String(text)).reduce((sum, ch) => {
    const code = ch.charCodeAt(0);
    const isHalfWidth =
      (code >= 0x0020 && code <= 0x007e) ||
      (code >= 0xff61 && code <= 0xff9f);
    return sum + (isHalfWidth ? 1 : 2);
  }, 0);
};

const truncateByFullWidth25 = (text) => {
  const source = String(text || "");
  if (!source) return "";
  const maxWidth = 50; // 全角25文字相当
  let width = 0;
  let result = "";
  for (const ch of Array.from(source)) {
    const code = ch.charCodeAt(0);
    const isHalfWidth =
      (code >= 0x0020 && code <= 0x007e) ||
      (code >= 0xff61 && code <= 0xff9f);
    const add = isHalfWidth ? 1 : 2;
    if (width + add > maxWidth) break;
    result += ch;
    width += add;
  }
  if (getDisplayWidth(source) <= maxWidth) return source;
  return `${result}…`;
};

export const GoalEvaluationForm = (props) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const { uids, userReportDt, setUserReportDt, dDate, date } = props;
  const uid = uids?.[0];
  const evaluations = useMemo(() => {
    const raw = userReportDt?.[dDate]?.goalEvaluations;
    if (!Array.isArray(raw)) return EMPTY_EVALUATIONS;
    return raw
      .map((entry) => {
        const goalId = getEvaluationKey(entry);
        if (!goalId) return null;
        return {
          ...entry,
          goalId,
        };
      })
      .filter(Boolean);
  }, [userReportDt, dDate]);
  const [showGoalEvaluation, setShowGoalEvaluation] = useLocalStorageState(false, "dailyReportGoalEvaluationVisible");
  const [goalRows, setGoalRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedGoalKey, setExpandedGoalKey] = useState(null);
  const [ratingVisibleMap, setRatingVisibleMap] = useState({});
  const [commentVisibleMap, setCommentVisibleMap] = useState({});

  useEffect(() => {
    if (!showGoalEvaluation) {
      setGoalRows([]);
      setLoading(false);
      return;
    }
    if (!hid || !bid || !uid || !date) return;
    const beforeYmd8 = toYmd8(date);
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const responses = await Promise.all(PLAN_ITEMS_FOR_GOAL_EVAL.map((item) => {
          return univApiCall({
            a: "fetchUsersPlan",
            hid,
            bid,
            uid,
            before: date,
            item,
            target_key: "支援目標,開始日",
            limit: 20,
          });
        }));

        const nextRows = [];
        const usedIds = new Set();
        responses.forEach((res, idx) => {
          const item = PLAN_ITEMS_FOR_GOAL_EVAL[idx];
          const plans = Array.isArray(res?.data?.dt) ? res.data.dt : [];
          const latestPlan = plans[0];
          if (!latestPlan) return;
          const planStartDateYmd8 = toYmd8(latestPlan?.["開始日"]);
          const goals = Array.isArray(latestPlan?.["支援目標"]) ? latestPlan["支援目標"] : [];
          goals.forEach((goal, goalIndex) => {
            const meta = getGoalIdAndStartDate({
              goal,
              uid,
              created: latestPlan.created,
              planStartDateYmd8,
              index: goalIndex,
              usedIds
            });
            if (!meta) return; // 目標IDが無い/不正なものは対象外
            const { goalId, startDateYmd8 } = meta;
            if (startDateYmd8 > beforeYmd8) return;
            const goalKey = goalId;
            nextRows.push({
              goalKey,
              item,
              created: latestPlan.created || "",
              goalId,
              lineId: goal?.LineID || "",
              lineNo: goal?.LineNo || "",
              section: goal?.["項目"] || "",
              target: brtoLf(goal?.["支援目標"] || goal?.["達成目標"] || ""),
              supportContent: brtoLf(goal?.["支援内容"] || goal?.["実施内容"] || ""),
              domainsArray: toGoalDomainsArray(goal?.["五領域"]),
              domains: toGoalDomainsText(goal?.["五領域"]),
            });
          });
        });

        if (mounted) setGoalRows(nextRows);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showGoalEvaluation, hid, bid, uid, date]);

  const evalMap = useMemo(() => {
    return new Map(evaluations.map(e => [getEvaluationKey(e), e]));
  }, [evaluations]);
  const scoreMap = useMemo(() => {
    return new Map(evaluations.map(e => [getEvaluationKey(e), e.score]));
  }, [evaluations]);

  const mergedGoalRows = useMemo(() => {
    const beforeYmd8 = toYmd8(date);
    const existingEvalMap = new Map(evaluations.map(e => [getEvaluationKey(e), e]));
    const mergedRows = goalRows.map((row) => {
      const saved = existingEvalMap.get(row.goalKey);
      if (!saved) return row;
      return {
        ...row,
        item: saved.item || row.item,
        created: saved.created || row.created,
        goalId: saved.goalId || row.goalId,
        lineId: saved.lineId || row.lineId,
        lineNo: saved.lineNo || row.lineNo,
        section: saved.section || row.section,
        target: saved.target || row.target,
        supportContent: saved.supportContent || row.supportContent || "",
        domains: saved.domains || row.domains,
        domainsArray: toGoalDomainsArray(saved.domains || row.domains),
      };
    });
    const mergedKeySet = new Set(mergedRows.map(r => r.goalKey));
    evaluations.forEach((saved) => {
      const savedKey = getEvaluationKey(saved);
      if (!saved?.goalId || !savedKey || mergedKeySet.has(savedKey)) return;
      const savedStartDate = parseStartDateFromGoalId(saved.goalId);
      if (!savedStartDate || savedStartDate > beforeYmd8) return;
      mergedRows.push({
        goalKey: savedKey,
        item: saved.item || "",
        created: saved.created || "",
        goalId: saved.goalId || savedKey,
        lineId: saved.lineId || "",
        lineNo: saved.lineNo || "",
        section: saved.section || "",
        target: saved.target || "",
            supportContent: brtoLf(saved.supportContent || ""),
        domains: saved.domains || "",
        domainsArray: toGoalDomainsArray(saved.domains || ""),
      });
    });
    return mergedRows;
  }, [goalRows, evaluations, date]);

  useEffect(() => {
    if (!mergedGoalRows.length) return;
    setRatingVisibleMap(prev => {
      const next = { ...prev };
      let changed = false;
      mergedGoalRows.forEach(goal => {
        if (goal.section === "本人支援" || scoreMap.has(goal.goalKey)) {
          if (!next[goal.goalKey]) {
            next[goal.goalKey] = true;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [mergedGoalRows, dDate, evaluations.length]);

  useEffect(() => {
    if (!mergedGoalRows.length) return;
    setCommentVisibleMap(prev => {
      const next = { ...prev };
      let changed = false;
      mergedGoalRows.forEach(goal => {
        const comment = String(evalMap.get(goal.goalKey)?.comment || "").trim();
        if (comment && !next[goal.goalKey]) {
          next[goal.goalKey] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [mergedGoalRows, evalMap]);

  const upsertGoalEvaluation = (goal, patch = {}) => {
    const existing = evalMap.get(goal.goalKey) || {};
    const nextEvaluations = evaluations.filter(e => getEvaluationKey(e) !== goal.goalKey);
    const nextEntry = {
      item: goal.item,
      created: goal.created,
      goalId: goal.goalId,
      lineId: goal.lineId,
      lineNo: goal.lineNo,
      section: goal.section,
      target: goal.target,
      supportContent: goal.supportContent || "",
      domains: goal.domains,
      ...existing,
      ...patch,
      evaluatedAt: new Date().getTime(),
    };
    const score = nextEntry.score;
    const comment = String(nextEntry.comment || "").trim();
    // rating未設定かつコメント未入力なら送信対象から除外
    if ((score === null || score === undefined || Number.isNaN(score)) && !comment) {
      const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, "goalEvaluations", nextEvaluations);
      setUserReportDt(newUserReportDt);
      return;
    }
    nextEvaluations.push(nextEntry);
    const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, "goalEvaluations", nextEvaluations);
    setUserReportDt(newUserReportDt);
  };

  const handleScoreChange = (goal, score) => {
    upsertGoalEvaluation(goal, { score });
  };

  const itemLabel = (item) => {
    if (item === "personalSupport") return "個別支援計画";
    if (item === "personalSupportHohou") return "保育所等訪問支援計画";
    if (item === "senmonShien") return "専門支援計画";
    return item;
  };

  const showRating = (goal) => {
    if (goal.section === "本人支援") return true;
    return !!ratingVisibleMap[goal.goalKey];
  };

  const toggleCommentInput = (goal) => {
    setCommentVisibleMap(prev => {
      const isOpen = !!prev[goal.goalKey];
      const hasComment = String(evalMap.get(goal.goalKey)?.comment || "").trim() !== "";
      if (isOpen && hasComment) {
        return prev;
      }
      return { ...prev, [goal.goalKey]: !isOpen };
    });
  };

  if (uids.length >= 2) return null;

  return (
    <div className="form">
      <div className="formTitle" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>支援計画に対する評価</span>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
          <Checkbox
            color="primary"
            size="small"
            checked={!!showGoalEvaluation}
            onChange={(e) => setShowGoalEvaluation(!!e.target.checked)}
          />
          表示する
        </label>
      </div>
      {showGoalEvaluation && (
      <div className="contents" style={{ display: "block", padding: '0 8px' }}>
        {loading && <div style={{ padding: "4px 8px" }}>目標を取得中です...</div>}
        {!loading && mergedGoalRows.length === 0 && (
          <div style={{ padding: "4px 8px" }}>個別支援計画などを登録するとここに目標が表示されるようになります</div>
        )}
        {!loading && mergedGoalRows.map((goal) => (
          <div key={goal.goalKey} style={{ padding: "10px 0", margin: "4px 0" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
              {itemLabel(goal.item)} / 作成日: {goal.created || "-"}
            </div>
            <div
              style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", cursor: "pointer" }}
              onClick={() => setExpandedGoalKey(prev => (prev === goal.goalKey ? null : goal.goalKey))}
            >
              <span
                style={{
                  color: goal.section === "本人支援" ? teal[600] : blue[600],
                  fontWeight: goal.section === "本人支援" ? 700 : 400,
                }}
              >
                {goal.section || "-"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", color: teal[500] }}>
                {expandedGoalKey === goal.goalKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </span>
              {expandedGoalKey !== goal.goalKey && (
                <span title={goal.target || ""}>
                  {truncateByFullWidth25(goal.target || "-")}
                </span>
              )}
              {goal.domainsArray.length > 0
                ? <DomainBadges domains={goal.domainsArray} />
                : <span>-</span>}
            </div>
            {expandedGoalKey === goal.goalKey && (
              <div style={{ marginBottom: 8, padding: "6px 8px", backgroundColor: grey[50], borderRadius: 4 }}>
                <div style={{ marginBottom: 4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {goal.target || "-"}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: grey[800], whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {goal.supportContent || "支援内容なし"}
                </div>
              </div>
            )}
            {showRating(goal) ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Rating
                  name={`goal-eval-${goal.goalKey}`}
                  value={scoreMap.has(goal.goalKey) ? scoreMap.get(goal.goalKey) : null}
                  max={10}
                  precision={1}
                  onChange={(_, newValue) => {
                    if (newValue === null) {
                      upsertGoalEvaluation(goal, { score: undefined });
                      return;
                    }
                    handleScoreChange(goal, Number(newValue));
                  }}
                  icon={<FavoriteIcon fontSize="inherit" style={{ color: pink[200] }} />}
                  emptyIcon={<FavoriteBorderIcon fontSize="inherit" style={{ color: grey[400] }} />}
                />
                <Button
                  size="small"
                  onClick={() => toggleCommentInput(goal)}
                  startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
                >
                  コメント
                </Button>
              </div>
            ) : (
              <Button
                size="small"
                startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                onClick={() => setRatingVisibleMap(prev => ({ ...prev, [goal.goalKey]: true }))}
              >
                評価を行う
              </Button>
            )}
            {commentVisibleMap[goal.goalKey] && (
              <div style={{ marginTop: 8 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                  size="small"
                  placeholder="コメントを入力"
                  value={String(evalMap.get(goal.goalKey)?.comment || "")}
                  onChange={(e) => {
                    upsertGoalEvaluation(goal, { comment: e.target.value });
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

