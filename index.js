const config = require('config')
const { spawn } = require('child_process')
const tilebelt = require('@mapbox/tilebelt')
const byline = require('byline')
const fs = require('fs')
const rewind = require('@turf/rewind')

const src = config.get('src')
const Z = config.get('Z')

const iso = () => {
  return `${new Date().toISOString()}`
}

const key2xyz = (key) => {
  zxy = key.split('-').map(v => parseInt(v))
  return [zxy[1], zxy[2], zxy[0]]
}

const dump = (dict, count) => {
  let geojson = {
    type: 'FeatureCollection',
    features: []
  }
  for (let key in dict) {
    geojson.features.push({
      type: 'Feature',
      geometry: rewind(tilebelt.tileToGeoJSON(key2xyz(key))),
      properties: { zxy: key, count: dict[key] }
    })
  }
  fs.writeFile('node-count.geojson', 
    JSON.stringify(geojson, null, 2),
    err => {
      if (err) throw err
    }
  )
  console.log(`${iso()}: ${count}`)
}

const count = () => {
  return new Promise((resolve, reject) => {
    let dict = {}
    let count = 0
    const osmium = spawn('osmium', [
      'cat', '--object-type=node', src,
      '--output-format=opl,add_metadata=false'
    ], { stdio: ['inherit', 'pipe', 'inherit'] })
    osmium.on('close', () => {
      dump(dict, count)
      resolve()
    })
    const stream = byline(osmium.stdout)
    stream.on('data', (line) => {
      count++
      const r = line.toString().split(' ')
      const lng = Number(r[2].slice(1))
      const lat = Number(r[3].slice(1))
      const xyz = tilebelt.pointToTile(lng, lat, Z) 
      const key = `${xyz[2]}-${xyz[0]}-${xyz[1]}`
      if (dict[key]) {
        dict[key] += 1
      } else {
        dict[key] = 1
      }
      if (count % 10000000 === 0) dump(dict, count)
    })
  })
}

const main = async () => {
  await count()
}

main()
