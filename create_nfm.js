const fs = require('fs')
const tilebelt = require('@mapbox/tilebelt')
const rewind = require('@turf/rewind')

const nodeCount = JSON.parse(fs.readFileSync('node-count.geojson'))
const lut = {}
for (const f of nodeCount.features) {
  lut[f.properties.zxy] = f.properties.count
}

const json = { nfm: [] }
const geojson = {
  type: 'FeatureCollection',
  features: []
}

z = 6
for (x = 0; x < 2 ** z; x++) {
  for (y = 0; y < 2 ** z; y++) {
    const key = `${z}-${x}-${y}`
    if (!lut[key]) {
      const zxy = key.split('-').map(v => parseInt(v))
      json.nfm.push(zxy)
      geojson.features.push({
        type: 'Feature',
        geometry: rewind(tilebelt.tileToGeoJSON([
          zxy[1], zxy[2], zxy[0]
        ])),
        properties: { zxy: key }
      })
    }
  }
}

fs.writeFileSync(
  '../nfm/nfm.json',
  JSON.stringify(json, null, 2)
)
fs.writeFileSync(
  '../nfm/nfm.geojson',
  JSON.stringify(geojson, null, 2)
)
