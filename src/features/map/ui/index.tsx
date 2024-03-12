import React, { useRef, useEffect, useState } from 'react';
import classNames from "./styles.module.scss"
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import 'ol/ol.css';
import { getMvtLayers } from './../../../shared/MvtLogicFunctios';
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import RegularShape from 'ol/style/RegularShape';
import Interaction from 'ol/interaction/Interaction';

interface Layerfilters {
  regions: boolean,
  municipals: boolean,
  settlement: boolean,
}

export const MapModule = (props: { onLayers: Layerfilters, mapOpened: boolean, drawEnabled: boolean, setInfoBlock: Function, setContactState: Function }) => {
  const mapElement = React.useRef<HTMLInputElement>(null)
  const mapRef = useRef<Map>();
  const [tiles, setTiles] = useState<any>({
    vectorLayerRegions: {},
    vectorLayerMunicipals: {},
    vectorLayerSettlement: {},
  })
  const [draw, setDraw] = useState<Interaction | undefined>()
  const [drawLayer, setDrawLayer] = useState<VectorLayer<VectorSource> | undefined>()

  let remove = (map: Map, name: string) => {
    map && map?.getLayers().getArray().forEach(layer => {
      if (layer.get('name') === name) {
        map.removeLayer(layer)
      }
    })
  }

  function stopDrawing(draw: Interaction | undefined, drawlayer: VectorLayer<VectorSource> | undefined) {
    draw && mapRef.current?.removeInteraction(draw)
    drawlayer && drawlayer.getSource()?.clear()
  }

  function check(map: Map, name: string) {
    let need = true
    map && map?.getLayers().getArray().forEach(layer => {
      if (layer.get('name') === name) need = false
    })
    return need
  }

  useEffect(() => {
    if (draw) {
      // mapRef.current.removeInteraction(draw)
      props.drawEnabled ? mapRef.current?.addInteraction(draw) : stopDrawing(draw, drawLayer)
    }
    // eslint-disable-next-line
  }, [props.drawEnabled])

  useEffect(() => {

    if (tiles && mapRef.current) {
      if (props.onLayers.regions && tiles.vectorLayerRegions.get)
        check(mapRef.current, 'RN_1_143') && mapRef.current.addLayer(tiles.vectorLayerRegions)
      else
        remove(mapRef.current, 'RN_1_143')

      if (props.onLayers.municipals && tiles.vectorLayerMunicipals.get)
        check(mapRef.current, 'RN_1_144') && mapRef.current.addLayer(tiles.vectorLayerMunicipals)
      else
        remove(mapRef.current, 'RN_1_144')

      if (props.onLayers.settlement && tiles.vectorLayerSettlement.get)
        check(mapRef.current, 'RN_1_145') && mapRef.current.addLayer(tiles.vectorLayerSettlement)
      else
        remove(mapRef.current, 'RN_1_145')
    }
  }, [tiles, props, mapRef])

  useEffect(() => {
    let tilesArray = getMvtLayers()
    tilesArray.forEach(tile => {

      switch (tile.get('name')) {
        case 'RN_1_143':
          tiles.vectorLayerRegions = tile
          tile.setZIndex(5)
          break;

        case 'RN_1_144':
          tiles.vectorLayerMunicipals = tile
          tile.setZIndex(5)
          break;

        case 'RN_1_145':
          tiles.vectorLayerSettlement = tile
          tile.setZIndex(5)
          break;

        default:
          break;
      }

      setTiles(tiles)

    })

  // eslint-disable-next-line
  }, [])

  useEffect(() => {

    if (mapElement.current && !mapRef.current) {

      const osmLayer = new TileLayer({
        preload: Infinity,
        source: new OSM(),
      })

      const sourceDraw = new VectorSource({ wrapX: false });

      const vectorDraw = new VectorLayer({
        source: sourceDraw,
        zIndex: 100,
        style: new Style({
          stroke: new Stroke({
            color: "black",
            width: 3
          }),
          fill: new Fill({
            color: [255, 255, 255, 0]
          }),
        })
      });

      vectorDraw.set('name', 'draw')

      mapRef.current = new Map({
        target: mapElement.current ? mapElement.current : undefined,
        layers: [osmLayer, vectorDraw],
        view: new View({
          center: [5346197.040548416, 7470999.886310182],
          zoom: 6,
        })
      });

      mapRef.current.addEventListener('click', (e: any) => {
        
        let drawing = false
        
          e.map.getInteractions().getArray().forEach((inter:any) => {
            if(inter.get('name')==='draw') drawing = true
          });
        if (!drawing) {
          const pixel = e.map.getEventPixel(e.originalEvent);
          let features = e.map.getFeaturesAtPixel(pixel);
          if (features.length === 1) props.setInfoBlock(features[0])
        }
      })

      let draw = new Draw({
        source: sourceDraw,
        type: "Polygon",
        style: new Style({
          stroke: new Stroke({
            color: "black",
            width: 3
          }),
          fill: new Fill({
            color: [255, 255, 255, 0]
          }),

          image: new RegularShape({
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: 'black', width: 1 }),
            points: 100,
            radius: 5,
            rotation: 0,
            angle: 0
          }),
        })
      });
      draw.on('drawend', function (e) {
        props.setContactState(true)
        // const boxExtent = e.feature.getGeometry()?.getExtent();
        // console.log(boxExtent, e)
        // let arrayLayer = mapRef.current?.getAllLayers()
      });

      draw.on('drawstart', function (e) {
        console.log(e, vectorDraw)
        sourceDraw && sourceDraw.clear()
      });

      draw.set('name', 'draw')
      setDraw(draw)
      setDrawLayer(vectorDraw)
    }
   //eslint-disable-next-line
  }, [mapElement, mapRef]);


  return (
    <div ref={mapElement} style={{pointerEvents: props.mapOpened?'unset':'none'}} className={classNames.map} />
  );

}


