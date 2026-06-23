const NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '51905679279'

const build = (text) =>
  `https://wa.me/${NUMBER}?text=${encodeURIComponent(text)}`

export const whatsappAcquire = () =>
  build(import.meta.env.VITE_WHATSAPP_ACQUIRE_MESSAGE || 'Hola Chiro Shimokawa, quiero adquirir un plan de alimentación.')

export const whatsappRenew = () =>
  build(import.meta.env.VITE_WHATSAPP_RENEW_MESSAGE || 'Hola Chiro Shimokawa, quiero renovar mi plan.')

export const whatsappClose = ({ weight, fat, note }) => {
  const tpl = import.meta.env.VITE_WHATSAPP_CLOSE_MESSAGE ||
    'Hola Chiro Shimokawa, cerré mi período. Peso: {weight}kg, grasa: {fat}%. Cambios: {note}'
  return build(tpl.replace('{weight}', weight).replace('{fat}', fat).replace('{note}', note || '—'))
}
