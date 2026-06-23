const NUMBER = process.env.VITE_WHATSAPP_NUMBER || '51905679279'

const build = (text) => `https://wa.me/${NUMBER}?text=${encodeURIComponent(text)}`

export const buildAcquire = () => build(process.env.VITE_WHATSAPP_ACQUIRE_MESSAGE || 'Hola Chiro Shimokawa, quiero adquirir un plan de alimentacion.')
export const buildRenew = () => build(process.env.VITE_WHATSAPP_RENEW_MESSAGE || 'Hola Chiro Shimokawa, quiero renovar mi plan.')
export const buildClose = ({ weight, fat, note }) => {
  const tpl = process.env.VITE_WHATSAPP_CLOSE_MESSAGE ||
    'Hola Chiro Shimokawa, cerre mi periodo. Peso: {weight}kg, grasa: {fat}%. Cambios: {note}'
  return build(tpl.replace('{weight}', weight).replace('{fat}', fat).replace('{note}', note || '-'))
}
