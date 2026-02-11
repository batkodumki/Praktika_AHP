/**
 * Scale calculation utilities
 * Ported from the original Python application
 */

/**
 * Unify gradation index to cardinal scale (1.5 to 9.5)
 *
 * @param {number} gradationIndex - Index of gradation (1 to n)
 * @param {number} totalGradations - Total number of gradations
 * @returns {number} Unified value in range [1.5, 9.5]
 */
export function unifyGradation(gradationIndex, totalGradations) {
  const l = 1.5 // Lower bound
  const p = 9.5 // Upper bound

  // M_i^n = l + (i - 0.5) * (p - l) / n
  const unified = l + (gradationIndex - 0.5) * (p - l) / totalGradations

  return unified
}

/**
 * Transform a grade using the specified scale type
 *
 * @param {number} grade - Grade value (1-9)
 * @param {number} scaleType - Scale type (1-5)
 * @returns {number} Transformed value
 */
export function integerByScale(grade, scaleType) {
  // Clamp grade to 1-9
  grade = Math.max(1, Math.min(9, grade))

  switch (scaleType) {
    case 1: // Integer
      return grade

    case 2: // Balanced
      {
        const w = 0.5 + (grade - 1) * 0.05
        if (w < 1) {
          return w / (1 - w)
        }
        return 9.0
      }

    case 3: // Power
      return Math.pow(9, (grade - 1) / 8)

    case 4: // Ma-Zheng
      return 9 / (9 + 1 - grade)

    case 5: // Donegan
      {
        try {
          let arg = (grade - 1) / 14 * Math.sqrt(3)
          arg = Math.max(-0.999, Math.min(0.999, arg)) // Clamp
          return Math.exp(Math.atanh(arg))
        } catch (e) {
          return 1.0
        }
      }

    default:
      return grade
  }
}

/**
 * Get progressive labels for gradations
 *
 * @param {number} gradations - Number of gradations (3-9)
 * @returns {Array<string>} Array of label strings
 */
export function getProgressiveLabels(gradations) {
  const labelsMap = {
    3: ['Weak', 'Strong', 'Extreme'],
    4: ['Weak', 'Medium', 'Strong', 'Extreme'],
    5: ['Weak', 'Medium', 'Above Medium', 'Strong', 'Extreme'],
    6: ['Weak', 'Medium', 'Above Medium', 'Strong', 'Very Strong', 'Extreme'],
    7: ['Weak', 'Medium', 'Above Medium', 'Strong', 'Very Strong', 'Very Very Strong', 'Extreme'],
    8: ['Weak', 'Medium', 'Above Medium', 'Strong', 'Very Strong', 'Very Very Strong', 'Extremely Strong', 'Absolute'],
    9: ['Weak', 'Medium', 'Above Medium', 'Strong', 'Very Strong', 'Very Very Strong', 'Extremely Strong', 'Nearly Absolute', 'Absolute'],
  }

  return labelsMap[gradations] || labelsMap[3]
}

/**
 * Get the initial scale string based on number of gradations
 * Implements the GRADUAL_SCALE mapping from original implementation
 *
 * @param {number} gradations - Number of gradations (2-8)
 * @returns {string} Scale string representing grades
 */
export function getGradualScale(gradations) {
  const scaleMap = {
    2: '25',
    3: '259',        // Initial: Weak, Strong, Extreme
    4: '3579',
    5: '23579',
    6: '234579',
    7: '2345679',
    8: '23456789'
  }

  return scaleMap[gradations] || '259'
}

/**
 * Calculate proportional button widths for scale grades
 * Matches the original Tkinter implementation
 *
 * @param {string} scaleStr - Scale string (e.g., "259", "23579")
 * @param {number} scaleType - Scale type (1-5)
 * @returns {Array<number>} Array of width percentages
 */
export function calculateButtonWidths(scaleStr, scaleType) {
  const grades = scaleStr.split('').map(c => parseInt(c))
  const li = grades.length

  // For Integer scale: equal widths
  if (scaleType === 1) {
    const equalWidth = 100 / li
    return grades.map(() => equalWidth)
  }

  // For other scales: proportional widths based on transformed values
  // Calculate sum of all transformed values
  let sum_w = 0
  for (let i = 1; i <= li; i++) {
    const unified = 1.5 + (i - 0.5) * (9.5 - 1.5) / li
    sum_w += integerByScale(unified, scaleType)
  }

  // Calculate width for each button (in reverse order from Tkinter)
  const widths = []
  for (let i = 0; i < li; i++) {
    const unified = 1.5 + (li - i - 0.5) * (9.5 - 1.5) / li
    const transformedValue = integerByScale(unified, scaleType)
    const widthPercent = (transformedValue / sum_w) * 100
    widths.push(widthPercent)
  }

  // Reverse to match button order
  return widths.reverse()
}

/**
 * Math.atanh polyfill for older browsers
 */
if (!Math.atanh) {
  Math.atanh = function(x) {
    return 0.5 * Math.log((1 + x) / (1 - x))
  }
}
