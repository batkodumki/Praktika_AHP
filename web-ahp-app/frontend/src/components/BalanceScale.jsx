import React from 'react'
import './BalanceScale.css'

export default function BalanceScale({ value }) {
  // Parameters (matching original implementation)
  const fulcrumX = 125
  const fulcrumY = 110
  const beamArmLength = 85

  // Calculate cube sizes and tilt based on value
  let leftCubeSize, rightCubeSize, tiltAngle

  if (value === 1) {
    // Equal
    leftCubeSize = rightCubeSize = 20
    tiltAngle = 0
  } else if (value > 1) {
    // Left (Object A) heavier
    const ratio = Math.min(value, 9)
    leftCubeSize = Math.min(20 + Math.log(ratio) * 10, 50)
    rightCubeSize = Math.max(20 / Math.log(ratio + 1) * 1.5, 15)
    tiltAngle = Math.min(Math.log(ratio) * 8, 25) // Positive = left down
  } else {
    // Right (Object B) heavier
    const ratio = Math.min(1 / value, 9)
    rightCubeSize = Math.min(20 + Math.log(ratio) * 10, 50)
    leftCubeSize = Math.max(20 / Math.log(ratio + 1) * 1.5, 15)
    tiltAngle = -Math.min(Math.log(ratio) * 8, 25) // Negative = right down
  }

  // Calculate tilt positions
  const angleRad = (tiltAngle * Math.PI) / 180
  const leftY = fulcrumY + beamArmLength * Math.sin(angleRad)
  const rightY = fulcrumY - beamArmLength * Math.sin(angleRad)
  const leftX = fulcrumX - beamArmLength * Math.cos(angleRad)
  const rightX = fulcrumX + beamArmLength * Math.cos(angleRad)

  return (
    <svg width="250" height="180" className="balance-scale">
      {/* Fulcrum (triangle) */}
      <polygon
        points={`${fulcrumX},${fulcrumY} ${fulcrumX - 15},${fulcrumY + 25} ${fulcrumX + 15},${fulcrumY + 25}`}
        fill="#7f8c8d"
      />

      {/* Beam */}
      <line
        x1={leftX}
        y1={leftY}
        x2={rightX}
        y2={rightY}
        stroke="#2c3e50"
        strokeWidth="4"
      />

      {/* Left cube (Object A) - Blue */}
      <rect
        x={leftX - leftCubeSize / 2}
        y={leftY - leftCubeSize - 5}
        width={leftCubeSize}
        height={leftCubeSize}
        fill="#4a90e2"
        stroke="#357abd"
        strokeWidth="2"
      />

      {/* Right cube (Object B) - Coral */}
      <rect
        x={rightX - rightCubeSize / 2}
        y={rightY - rightCubeSize - 5}
        width={rightCubeSize}
        height={rightCubeSize}
        fill="#ff6b6b"
        stroke="#ee5a52"
        strokeWidth="2"
      />

      {/* Labels */}
      <text
        x={leftX}
        y={leftY + 25}
        textAnchor="middle"
        fill="#4a90e2"
        fontWeight="600"
        fontSize="14"
      >
        A
      </text>

      <text
        x={rightX}
        y={rightY + 25}
        textAnchor="middle"
        fill="#ff6b6b"
        fontWeight="600"
        fontSize="14"
      >
        B
      </text>

      {/* Value display */}
      <text
        x={fulcrumX}
        y="20"
        textAnchor="middle"
        fill="#2c3e50"
        fontWeight="600"
        fontSize="16"
      >
        Співвідношення: {value.toFixed(2)}
      </text>
    </svg>
  )
}
