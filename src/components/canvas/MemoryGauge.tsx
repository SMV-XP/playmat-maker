import { useMemo } from 'react'
import { Group, Image as KonvaImage } from 'react-konva'
import type { PlaymatProject } from '../../types'
import { CANVAS_WIDTH } from '../../types'
import { useLoadedImage } from '../../hooks/useLoadedImage'
import { hexToRgb, recolorPlayerLabelAsset, recolorOfficialPlayerLabelAsset } from '../../utils/recolorAssets'
import { memoryGaugeAsset, playerLabelOneAsset, playerLabelTwoAsset, officialPlayerSideLabelOneAsset, officialPlayerSideLabelTwoAsset } from './templateAssets'

export function MemoryGauge({ project }: { project: PlaymatProject }) {
  const gauge = project.gauge
  const source = useLoadedImage(memoryGaugeAsset)
  const playerOneSource = useLoadedImage(playerLabelOneAsset)
  const playerTwoSource = useLoadedImage(playerLabelTwoAsset)
  const playerSideOneSource = useLoadedImage(officialPlayerSideLabelOneAsset)
  const playerSideTwoSource = useLoadedImage(officialPlayerSideLabelTwoAsset)
  const coloredGauge = useMemo(() => {
    if (!source) return null
    const canvas = document.createElement('canvas')
    canvas.width = source.naturalWidth
    canvas.height = source.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null
    context.drawImage(source, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const colors = {
      leftFill: hexToRgb(gauge.leftFill),
      rightFill: hexToRgb(gauge.rightFill),
      leftText: hexToRgb(gauge.leftText),
      rightText: hexToRgb(gauge.rightText),
    }
    const centerX = canvas.width / 2
    for (let index = 0; index < pixels.data.length; index += 4) {
      const alpha = pixels.data[index + 3]
      if (alpha === 0) continue
      const red = pixels.data[index]
      const green = pixels.data[index + 1]
      const blue = pixels.data[index + 2]
      const x = (index / 4) % canvas.width
      const brightest = Math.max(red, green, blue)
      const darkest = Math.min(red, green, blue)
      const isWhite = brightest > 175 && brightest - darkest < 42
      const isBlue = blue > red * 1.18 && blue > green * 1.12 && brightest - darkest > 34
      if (!isWhite && !isBlue) continue

      let target: { r: number; g: number; b: number }
      if (x < centerX) target = isWhite ? colors.leftFill : colors.leftText
      else target = isWhite ? colors.rightText : colors.rightFill
      pixels.data[index] = target.r
      pixels.data[index + 1] = target.g
      pixels.data[index + 2] = target.b
    }
    context.putImageData(pixels, 0, 0)
    return canvas
  }, [gauge.leftFill, gauge.leftText, gauge.rightFill, gauge.rightText, source])
  const playerOneFill = gauge.playerOneFill ?? gauge.rightFill
  const playerOneText = gauge.playerOneText ?? gauge.rightText
  const playerTwoFill = gauge.playerTwoFill ?? gauge.leftFill
  const playerTwoText = gauge.playerTwoText ?? gauge.leftText
  const coloredPlayerOne = useMemo(
    () => playerOneSource ? recolorPlayerLabelAsset(playerOneSource, 1, playerOneFill, playerOneText) : null,
    [playerOneFill, playerOneSource, playerOneText],
  )
  const coloredPlayerTwo = useMemo(
    () => playerTwoSource ? recolorPlayerLabelAsset(playerTwoSource, 2, playerTwoFill, playerTwoText) : null,
    [playerTwoFill, playerTwoSource, playerTwoText],
  )
  const coloredSidePlayerOne = useMemo(
    () => playerSideOneSource ? recolorOfficialPlayerLabelAsset(playerSideOneSource, 1, playerOneFill, playerOneText) : null,
    [playerOneFill, playerOneText, playerSideOneSource],
  )
  const coloredSidePlayerTwo = useMemo(
    () => playerSideTwoSource ? recolorOfficialPlayerLabelAsset(playerSideTwoSource, 2, playerTwoFill, playerTwoText) : null,
    [playerSideTwoSource, playerTwoFill, playerTwoText],
  )

  const isOfficialSideDesign = gauge.design === 'players-sides'
  if (!gauge.visible || !coloredGauge) return null

  const standardGaugeHeight = gauge.width * (154 / 3337)
  const officialWidthRatio = (CANVAS_WIDTH * (1584 / 2384)) / 3337
  const gaugeWidth = isOfficialSideDesign ? gauge.width * officialWidthRatio : gauge.width
  const gaugeHeight = gaugeWidth * (154 / 3337)
  const gaugeX = gauge.x + (gauge.width - gaugeWidth) / 2
  const gaugeY = isOfficialSideDesign
    ? gauge.y - 10 * (gauge.width / 3337)
    : gauge.y + (standardGaugeHeight - gaugeHeight) / 2
  const designScale = gaugeWidth / 3337

  const playerLabels = isOfficialSideDesign ? (() => {
    const gap = gaugeWidth * (44 / 1584)
    const width = gaugeX - gap
    const height = width * (48 / 346)
    const y = gaugeY + (gaugeHeight - height) / 2
    const leftX = 0
    const rightX = CANVAS_WIDTH - width
    return (
      <>
        {coloredSidePlayerOne && <KonvaImage image={coloredSidePlayerOne} x={leftX} y={y} width={width} height={height} />}
        {coloredSidePlayerTwo && <KonvaImage image={coloredSidePlayerTwo} x={rightX} y={y} width={width} height={height} />}
      </>
    )
  })() : gauge.design === 'players-below' ? (() => {
    const width = Math.max(300, 430 * designScale)
    const height = Math.max(68, 92 * designScale)
    const y = gaugeY + gaugeHeight + Math.max(16, 24 * designScale)
    const leftX = 0
    const rightX = CANVAS_WIDTH - width
    return (
      <>
        {coloredPlayerOne && <KonvaImage image={coloredPlayerOne} x={leftX} y={y} width={width} height={height} />}
        {coloredPlayerTwo && <KonvaImage image={coloredPlayerTwo} x={rightX} y={y} width={width} height={height} />}
      </>
    )
  })() : null

  return (
    <Group opacity={gauge.opacity} listening={false}>
      <KonvaImage
        image={coloredGauge}
        x={gaugeX}
        y={gaugeY}
        width={gaugeWidth}
        height={gaugeHeight}
        shadowColor="#000000"
        shadowBlur={22}
        shadowOpacity={0.58}
        shadowOffsetX={0}
        shadowOffsetY={8}
      />
      {playerLabels}
    </Group>
  )
}

