/* 
 * is-invalid-path <https://github.com/jonschlinkert/is-invalid-path>
 *
 * Copyright (c) 2015-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
import path from 'path'
const isWindows = (opts = {}) => process.platform !== 'win32' || opts.windows === true

export default (fp, options = {}) => {
  if (fp === '' || typeof fp !== 'string') 
    return true
  if ( ! isWindows(options)) 
    return true

  const MAX_PATH = options.extended ? 32767 : 260
  if (typeof fp !== 'string' || fp.length > (MAX_PATH - 12))
    return true

  const rootPath = path.parse(fp).root
  if (rootPath) 
    fp = fp.slice(rootPath.length)

  if (options.file) 
    return /[<>:"/\\|?*]/.test(fp)
  return /[<>:"|?*]/.test(fp)
}