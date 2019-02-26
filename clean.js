// create node-count-clean.geojson from node-count.geojson
const fs = require('fs')

let src = JSON.parse(fs.readFileSync('node-count.geojson'))
let dst = { type: 'FeatureCollection', features: [] }

for (const f of src.features) {
  const zxy = f.properties.zxy.split('-').map(v => parseInt(v))
  if ( zxy[1] > 0 && zxy[1] < 64 && zxy[2] > 0 && zxy[2] < 64 ) {
    dst.features.push(f)
  }
}

fs.writeFileSync(
  'node-count-clean.geojson',
  JSON.stringify(dst, null, 2)
)
