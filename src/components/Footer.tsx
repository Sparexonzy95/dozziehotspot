import { ExternalLink } from 'lucide-react'
import { LOCATION } from '@/lib/dozzie'

const CREDITS = [
  { label: 'Hero', who: 'Yusufdavid, CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:SUYA_SPOT_AT_JOS_WILDLIFE_PARK.jpg' },
  { label: 'Beef', who: 'Bukky658, CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:Suya_with_pepper_sauce.jpg' },
  { label: 'Chicken', who: 'WhisperToMe, CC0', href: 'https://commons.wikimedia.org/wiki/File:SuyavarietiesTX.JPG' },
  { label: 'Ram', who: 'Kambai Akau, CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:Suya_preparation_for_grilling_5.jpg' },
]

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
      <p className="font-semibold text-fg-soft">Dozzie Hotspot, {LOCATION}</p>
      <p className="mt-1 max-w-xl">
        Arc Testnet demo. Payments use test USDC, which has no real value. Receipts are saved in this browser only.
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {CREDITS.map((c) => (
          <li key={c.label}>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-brand"
            >
              {c.label} photo: {c.who} <ExternalLink size={10} />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
}
