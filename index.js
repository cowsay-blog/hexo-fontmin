const Fontmin = require('fontmin')
const minimatch = require('minimatch')
const Promise = require('bluebird')
const streamToArrayAsync = Promise.promisify(require('stream-to-array'))

const options = Object.assign({}, hexo.config.fontmin)

function compressTTF () {
  const routes = hexo.route.list().filter(function (path) {
    return minimatch(path, '**/*.ttf', { nocase: true })
  })

  hexo.log.info('[fontmin] %d fonts found.', routes.length)

  return Promise.map(routes, function (route) {
    streamToArrayAsync(hexo.route.get(route))
      .then(function (arr) {
        return Buffer.concat(arr)
      })
      .then(function (buffer) {
        const fontmin = new Fontmin()

        if (options.text) {
          fontmin.use(Fontmin.glyph({
            text: options.text
          }))
        }

        fontmin.src(buffer)

        return Promise.fromNode(function (cb) {
          fontmin.run(cb)
        })
          .then(function (files) {
            const file = files.shift()
            const length = buffer.length
            if (file && length > file.contents.length) {
              hexo.route.set(route, file.contents)
              hexo.log.info('[fontmin] %s (%d -> %d = -%s%)', route, length, file.contents.length, Number(file.contents.length * 100 / length).toFixed(2))
            }
          })
      })
  })
}

/* global hexo */
hexo.extend.filter.register('after_generate', compressTTF)
