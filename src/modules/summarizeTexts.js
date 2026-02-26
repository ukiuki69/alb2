// 構文:
// summarizeTexts = (sourceTexts, targetIndex, charCount) => {}

// 引数:
// sourceTexts:
// テキストの配列です。800文字程度のテキストがn個入ります。テキストは日本語です。<br>タグのみ
// 含みます。タグは正規表現を使って考えうるパターンを除去して下さい。
// targetIndex:
// テキストの配列のうちtargetとなるテキストの位置です。
// charCount:
// commonPart, uniqPartそれぞれの出力するときの長さを指定します。

// 出力:
// {commonPart: 'xxx', uniqPart: 'xxx'}

// 処理:
// 配列の中のテキストには同じ部分と異なる部分があります。
// 同じ部分をcommonPart、異なる部分をuniqPartにcharCount分それぞれ出力して下さい。
// 出力がcharCountに満たない場合は前回に検索終了した位置から再度検索して指定した長さが満ちる
// まで繰り返して下さい。繰り返しの検索を行った場合は文字列を連結するときに・・で繋げて下さい。

// export const summarizeTexts = (sourceTexts, targetIndex, charCount) => {
//   const removeTags = (text) => text.replace(/<[^>]*>?/gm, '');
//   const cleanedTexts = sourceTexts.map(removeTags);

//   const findCommonParts = (texts, charCount) => {
//     let commonParts = '';
//     let currentPosition = 0;
//     let remainingChars = charCount;

//     while (remainingChars > 0 && sourceTexts[targetIndex].length > charCount) {
//       let tempCommonParts = '';
//       for (let i = 0; i < texts.length - 1; i++) {
//         // if(texts[i]==="" || texts[i + 1]==="") continue;
//         const s1 = texts[i].substring(currentPosition);
//         const s2 = texts[i + 1].substring(currentPosition);
//         const currentCommonPart = longestCommonSubstring(s1, s2);
//         tempCommonParts += currentCommonPart;
//       }

//       if (tempCommonParts.length > remainingChars) {
//         tempCommonParts = tempCommonParts.substring(0, remainingChars);
//       }

//       commonParts += tempCommonParts;
//       currentPosition += tempCommonParts.length;

//       if (tempCommonParts.length === 0 && currentPosition < texts[0].length) {
//         currentPosition++;
//         commonParts += '・・';
//       }

//       remainingChars = charCount - commonParts.length;
//     }

//     return commonParts;
//   };

//   const longestCommonSubstring = (s1, s2) => {
//     const m = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(0));

//     let maxLength = 0;
//     let endPosition = 0;

//     for (let i = 1; i <= s1.length; i++) {
//       for (let j = 1; j <= s2.length; j++) {
//         if (s1[i - 1] === s2[j - 1]) {
//           m[i][j] = m[i - 1][j - 1] + 1;
//           if (m[i][j] > maxLength) {
//             maxLength = m[i][j];
//             endPosition = i;
//           }
//         }
//       }
//     }

//     return s1.substring(endPosition - maxLength, endPosition);
//   };

//   const commonPart = findCommonParts(cleanedTexts, charCount);
//   const uniqPart = cleanedTexts[targetIndex].replace(commonPart, '');
//   const truncatedUniqPart = uniqPart.substring(0, charCount);

//   // return { commonPart: commonPart!=="" ?commonPart :truncatedUniqPart, uniqPart: truncatedUniqPart };
//   return { commonPart, uniqPart: truncatedUniqPart};
//   // return { commonPart: commonPart!=="" ?commonPart :truncatedUniqPart, uniqPart: sourceTexts[targetIndex] };
// };

const removeTags = (text) => {
  return text.replace(/<[^>]*>?/gm, '');
};

const findCommonParts = (sourceTexts, minLength) => {
  const commonParts = [];
  for (let i = 0; i < sourceTexts[0].length - minLength + 1; i++) {
    for (let j = i + minLength; j <= sourceTexts[0].length; j++) {
      const candidate = sourceTexts[0].substring(i, j);
      if (sourceTexts.every((text) => text.includes(candidate))) {
        commonParts.push(candidate);
      }
    }
  }
  return commonParts;
};

export const summarizeTexts = (sourceTexts, targetIndex, len) => {
  const sanitizedTexts = sourceTexts.map(removeTags);
  const commonParts = findCommonParts(sanitizedTexts, len).sort((a, b) => b.length - a.length);
  const commonPart = commonParts[0] || '';

  const targetText = sanitizedTexts[targetIndex];
  let uniqPart = targetText.replace(commonPart, '');
  if (uniqPart.length > len) {
    uniqPart = uniqPart.substring(0, len);
  }
  if (!uniqPart) uniqPart = commonPart.slice(0, 100);
  return { commonPart, uniqPart };
};

