import { build } from 'esbuild'
import { resolve } from 'node:path'
// Test the same renderer in a real browser without adding a debug endpoint to the site.
export async function irisBundle() {
  const result=await build({entryPoints:[resolve('app/utils/iris-renderer.ts')],bundle:true,write:false,format:'iife',globalName:'IrisTest',platform:'browser'})
  return result.outputFiles[0]!.text
}
