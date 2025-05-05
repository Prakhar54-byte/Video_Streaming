// pages/api/image-count.ts (in Next.js)
import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  const imageDir = path.join(process.cwd(), 'public', 'images')
  const files = fs.readdirSync(imageDir)
  const thumbs = files.filter((file) => /^thumb\d+\.jpg$/.test(file))
  res.status(200).json({ count: thumbs.length })
}
