import type Konva from 'konva'
import { Group, Image as KonvaImage } from 'react-konva'
import type { Logo, LogoPatch } from '../../types'
import { useLoadedImage } from '../../hooks/useLoadedImage'

interface LogoNodeProps {
  logo: Logo
  selected: boolean
  registerNode: (id: string, node: Konva.Node | null) => void
  onSelect: () => void
  onDragMove: (node: Konva.Node) => void
  onDragFinish: () => void
  onChange: (patch: LogoPatch) => void
}

export function LogoNode({ logo, selected, registerNode, onSelect, onDragMove, onDragFinish, onChange }: LogoNodeProps) {
  const image = useLoadedImage(logo.dataUrl)
  if (!logo.visible || !image) return null
  return (
    <Group
      ref={(node) => registerNode(logo.id, node)} x={logo.x} y={logo.y} rotation={logo.rotation} draggable={!logo.locked}
      onClick={(event) => { event.cancelBubble = true; onSelect() }}
      onTap={(event) => { event.cancelBubble = true; onSelect() }}
      onDragMove={(event) => onDragMove(event.target)}
      onDragEnd={(event) => { onDragFinish(); onChange({ x: event.target.x(), y: event.target.y() }) }}
      onTransformEnd={(event) => {
        const node = event.target
        const factor = Math.max(node.scaleX(), node.scaleY())
        node.scaleX(1); node.scaleY(1)
        onChange({ x: node.x(), y: node.y(), width: Math.max(80, logo.width * factor), height: Math.max(40, logo.height * factor), rotation: node.rotation() })
      }}
    >
      <KonvaImage image={image} width={logo.width} height={logo.height} opacity={logo.opacity} shadowColor="#000000" shadowBlur={selected ? 22 : 12} shadowOpacity={0.48} shadowOffsetY={5} />
    </Group>
  )
}

