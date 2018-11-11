import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import { Component } from 'react'
import PropTypes from 'prop-types'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { FlyToInterpolator } from 'react-map-gl'
import { getAccessToken } from 'react-map-gl/dist/mapbox/mapbox'
import WebMercatorViewport from 'viewport-mercator-project'

function fitBounds(bounds, viewport) {
  return new WebMercatorViewport(viewport).fitBounds(bounds)
}

class Geocoder extends Component {
  componentDidMount() {
    // mapRef is undefined on initial page load, so force an update to initialize geocoder
    this.forceUpdate()
  }

  componentDidUpdate() {
    if (this.geocoder !== undefined) {
      return
    }

    const { mapRef, onViewportChange, mapboxApiAccessToken, options } = this.props

    this.geocoder = new MapboxGeocoder({ accessToken: mapboxApiAccessToken, ...options })
    this.geocoder.on('result', ({ result: { id, bbox, center } }) => {
      const [longitude, latitude] = center
      const bboxExceptions = {
        'country.3148': {
          name: 'France',
          bbox: [[-4.59235, 41.380007], [9.560016, 51.148506]]
        },
        'country.3145': {
          name: 'United States',
          bbox: [[-171.791111, 18.91619], [-66.96466, 71.357764]]
        },
        'country.330': {
          name: 'Russia',
          bbox: [[19.66064, 41.151416], [190.10042, 81.2504]]
        },
        'country.3179': {
          name: 'Canada',
          bbox: [[-140.99778, 41.675105], [-52.648099, 83.23324]]
        }
      }
      const width = mapRef.current.props.width
      const height = mapRef.current.props.height
      let zoom = this.geocoder.options.zoom

      if (!bboxExceptions[id] && bbox) {
        zoom = fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { width, height }).zoom
      } else if (bboxExceptions[id]) {
        zoom = fitBounds(bboxExceptions[id].bbox, { width, height }).zoom
      }

      if (this.geocoder.options.flyTo) {
        onViewportChange({
          longitude,
          latitude,
          zoom,
          transitionInterpolator: new FlyToInterpolator(),
          transitionDuration: 3000
        })
      } else {
        onViewportChange({ longitude, latitude, zoom })
      }
    })

    mapRef.current.getMap().addControl(this.geocoder)
  }

  getGeocoder() {
    return this.geocoder
  }

  render() {
    return null
  }

  static propTypes = {
    mapRef: PropTypes.object.isRequired,
    onViewportChange: PropTypes.func.isRequired,
    mapboxApiAccessToken: PropTypes.string,
    options: PropTypes.object
  }

  static defaultProps = {
    mapboxApiAccessToken: getAccessToken()
  }
}

export default Geocoder
