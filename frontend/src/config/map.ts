// 高德地图配置
export const AMAP_CONFIG = {
  key: '0236671cfb04ddf41d952d0a47b78106', // 高德地图API密钥
  version: '2.0',
  plugins: [
    'AMap.MarkerCluster',
    'AMap.InfoWindow',
    'AMap.Geocoder',
    'AMap.Scale',
    'AMap.ToolBar',
    'AMap.OverView',
    'AMap.MapType',
    'AMap.Geolocation'
  ]
}

// 地图默认配置
export const MAP_DEFAULT_CONFIG = {
  zoom: 11,
  center: [116.397428, 39.90923], // 北京天安门坐标
  mapStyle: 'amap://styles/light'
}