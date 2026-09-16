import memoryGaugeAsset from '../../assets/template/memory-gauge.png'
import zoneSecurityAsset from '../../assets/template/zone-security.png'
import zoneBreedingAsset from '../../assets/template/zone-breeding.png'
import zoneBattleAsset from '../../assets/template/zone-battle.png'
import zoneDeckAsset from '../../assets/template/zone-deck.png'
import zoneTrashAsset from '../../assets/template/zone-trash.png'
import zoneBreedingEggAsset from '../../assets/template/zone-breeding-egg.png'
import zoneTurnOrderAsset from '../../assets/template/zone-turn-order.png'
import labelSecurityAsset from '../../assets/template/label-security.png'
import labelBreedingAsset from '../../assets/template/label-breeding.png'
import labelBattleAsset from '../../assets/template/label-battle.png'
import labelDeckAsset from '../../assets/template/label-deck.png'
import labelTrashAsset from '../../assets/template/label-trash.png'
import labelTurnOrderAsset from '../../assets/template/label-turn-order.png'
import playerLabelOneAsset from '../../assets/template/player-label-1.png'
import playerLabelTwoAsset from '../../assets/template/player-label-2.png'
import officialPlayerSideLabelOneAsset from '../../assets/template/player-label-side-official-1.svg'
import officialPlayerSideLabelTwoAsset from '../../assets/template/player-label-side-official-2.svg'

export const PSD_ZONE_ASSETS = {
  security: zoneSecurityAsset,
  breeding: zoneBreedingAsset,
  battle: zoneBattleAsset,
  deck: zoneDeckAsset,
  trash: zoneTrashAsset,
  'turn-order': zoneTurnOrderAsset,
}

export const PSD_LABELS = {
  security: { source: labelSecurityAsset, text: 'Security Stack', x: 186, y: 158, width: 246, height: 127, fontSize: 64, naturalWidth: 583, naturalHeight: 890 },
  breeding: { source: labelBreedingAsset, text: 'Breeding area', x: 319, y: 68, width: 408, height: 63, fontSize: 60, naturalWidth: 1046, naturalHeight: 797 },
  battle: { source: labelBattleAsset, text: 'Battle area', x: 144, y: 64, width: 360, height: 61, fontSize: 60, naturalWidth: 648, naturalHeight: 179 },
  deck: { source: labelDeckAsset, text: 'Deck', x: 159, y: 266, width: 140, height: 53, fontSize: 54, naturalWidth: 451, naturalHeight: 600 },
  trash: { source: labelTrashAsset, text: 'Trash', x: 145, y: 268, width: 162, height: 53, fontSize: 54, naturalWidth: 451, naturalHeight: 601 },
  'turn-order': { source: labelTurnOrderAsset, text: 'Turn Order', x: 143, y: 76, width: 196, height: 279, fontSize: 24, naturalWidth: 465, naturalHeight: 469 },
}


export { memoryGaugeAsset, zoneBreedingEggAsset, playerLabelOneAsset, playerLabelTwoAsset, officialPlayerSideLabelOneAsset, officialPlayerSideLabelTwoAsset }
