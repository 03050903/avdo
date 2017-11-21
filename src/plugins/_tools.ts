export function cleanupOutData(
  data: number[],
  params: { leadingZero: boolean; negativeExtraSpace: boolean },
) {
  let str = '';
  let delimiter: string;
  let prev: number | string;

  data.forEach((item, i) => {
    // Space delimiter by default.
    delimiter = ' ';

    // No extra space in front of first number.
    if (i === 0) {
      delimiter = '';
    }

    // Remove floating-point numbers leading zeros.
    // 0.5 → .5
    // -0.5 → -.5
    let itemStr: number | string = item;
    if (params.leadingZero) {
      itemStr = removeLeadingZero(item);
    }

    // No extra space in front of negative number or
    // in front of a floating number if a previous number is floating too.
    if (
      params.negativeExtraSpace &&
      (itemStr < 0 || (String(itemStr).charCodeAt(0) === 46 && +prev % 1 !== 0))
    ) {
      delimiter = '';
    }

    // Save prev item value.
    prev = itemStr;
    str += delimiter + itemStr;
  });

  return str;
}

/**
 * Remove floating-point numbers leading zero.
 *
 * @example
 * 0.5 → .5
 *
 * @example
 * -0.5 → -.5
 *
 * @param {Float} num input number
 *
 * @return {String} output number as string
 */
export function removeLeadingZero(num: number) {
  let strNum = num.toString();
  if (0 < num && num < 1 && strNum.charCodeAt(0) === 48) {
    strNum = strNum.slice(1);
  } else if (-1 < num && num < 0 && strNum.charCodeAt(1) === 48) {
    strNum = strNum.charAt(0) + strNum.slice(2);
  }
  return strNum;
}
