import packager from '@electron/packager'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { cp, mkdir, rm, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staging = path.join(root, '.desktop-build')
const release = path.join(root, 'release')

await rm(staging, { recursive: true, force: true })
await mkdir(staging, { recursive: true })
await cp(path.join(root, 'dist'), path.join(staging, 'dist'), { recursive: true })
await cp(path.join(root, 'desktop'), path.join(staging, 'desktop'), {
  recursive: true,
  filter: source => !/ЗАПУСК\.txt$|icon\.(png|ico)$/.test(source),
})
const iconPng = path.join(staging, 'desktop/icon.png')
const iconIco = path.join(staging, 'desktop/icon.ico')
await sharp(path.join(root, 'desktop/icon.svg')).resize(256, 256).png().toFile(iconPng)
await writeFile(iconIco, await pngToIco(iconPng))
await writeFile(path.join(staging, 'package.json'), JSON.stringify({
  name: 'kotoboynya-utiny-vopros',
  productName: 'Котобойня: Утиный вопрос',
  version: '0.3.1',
  private: true,
  main: 'desktop/main.cjs',
}, null, 2))

const [appPath] = await packager({
  dir: staging,
  out: release,
  name: 'Kotoboynya',
  executableName: 'Kotoboynya',
  platform: 'win32',
  arch: 'x64',
  appVersion: '0.3.1',
  appCopyright: 'Котобойня: Утиный вопрос',
  icon: iconIco,
  asar: true,
  overwrite: true,
  prune: false,
  win32metadata: {
    CompanyName: 'Котобойня',
    FileDescription: 'Котобойня: Утиный вопрос',
    OriginalFilename: 'Kotoboynya.exe',
    ProductName: 'Котобойня: Утиный вопрос',
  },
})

await copyFile(path.join(root, 'desktop/ЗАПУСК.txt'), path.join(appPath, 'ПРОЧТИ_МЕНЯ.txt'))
await rm(staging, { recursive: true, force: true })
console.log(`Windows x64 build: ${appPath}`)
