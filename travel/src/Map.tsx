import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point } from './model';
type Props={points:Point[];numbers?:number[];active?:number;onPick?:(p:Point)=>void;current?:Point|null;focus?:Point|null;large?:boolean};
export default function TripMap({points,numbers,active=-1,onPick,current,focus,large=false}:Props){
 const container=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),layer=useRef<L.LayerGroup|null>(null),user=useRef<L.CircleMarker|null>(null),pick=useRef(onPick);pick.current=onPick;
 const [error,setError]=useState(false);
 useEffect(()=>{const m=L.map(container.current!,{scrollWheelZoom:false,zoomControl:true}).setView([37.5445,127.039],15);map.current=m;
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(m);
 tiles.on('tileerror',()=>setError(true));tiles.on('tileload',()=>setError(false));
 layer.current=L.layerGroup().addTo(m);m.on('click',(e:L.LeafletMouseEvent)=>pick.current?.({lat:e.latlng.lat,lng:e.latlng.lng}));
 const ro=new ResizeObserver(()=>m.invalidateSize());ro.observe(container.current!);
 return()=>{ro.disconnect();m.remove();map.current=null;};},[]);
 const signature=JSON.stringify(points);
 useEffect(()=>{if(!map.current||!layer.current)return;layer.current.clearLayers();const coords=points.map(p=>[p.lat,p.lng] as L.LatLngTuple);
 points.forEach((p,i)=>L.marker([p.lat,p.lng],{icon:L.divIcon({className:'trip-marker',html:`<span class="${active===i?'is-active':''}">${numbers?.[i]??i+1}</span>`,iconSize:[34,42],iconAnchor:[17,36]})}).addTo(layer.current!));
 if(coords.length>1)L.polyline(coords,{color:'#187d6b',weight:3,dashArray:'5 9',opacity:.65}).addTo(layer.current);
 if(coords.length&&!pick.current)map.current.fitBounds(L.latLngBounds(coords),{padding:[48,48],maxZoom:16});
 },[signature,active,JSON.stringify(numbers)]);
 useEffect(()=>{if(!map.current)return;if(user.current){user.current.remove();user.current=null;}if(current)user.current=L.circleMarker([current.lat,current.lng],{radius:8,color:'#fff',weight:3,fillColor:'#397ee3',fillOpacity:1}).addTo(map.current);},[current?.lat,current?.lng]);
 useEffect(()=>{if(focus&&map.current)map.current.setView([focus.lat,focus.lng],16);},[focus]);
 return <div className={`map-wrap ${large?'large':''}`}><div ref={container} className="map-canvas" aria-label={onPick?'장소를 눌러 선택하는 지도':'코스의 세 장소 지도'}/>{error&&<div className="map-error" role="status">지도를 불러오지 못했어요. 네트워크를 확인해주세요.</div>}<div className="map-caption">{onPick?'지도를 눌러 장소를 선택하세요':'점선은 장소의 순서입니다 · 실제 보행 경로 아님'}</div></div>;
}
