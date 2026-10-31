const legacyCaptureFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
})

export function formatCaptureTime(value?: string): string | undefined {
  if (!value || !Number.isFinite(Date.parse(value))) return undefined
  // Earlier uploads serialized local camera dates as UTC. New uploads retain
  // the camera's wall time and explicit offset, independent of the viewer.
  if (/Z$/i.test(value)) {
    const parts = Object.fromEntries(legacyCaptureFormatter.formatToParts(new Date(value)).map(part => [part.type, part.value]))
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
  }
  return value.replace('T', ' ').slice(0, 16)
}
