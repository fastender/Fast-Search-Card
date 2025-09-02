// src/components/AnimatedDeviceIcons.jsx
import { h } from 'preact';

// Diese Komponente nutzt ALLE ORIGINAL SVG-Animationen aus fast-search-card.js
// 1:1 übernommen - keine Änderungen!
export const AnimatedDeviceIcons = ({ domain, state, attributes = {}, size = 39 }) => {
  const isOn = state === 'on' || state === 'open' || state === 'playing' || state === 'home' || state === 'unlocked';
  const deviceClass = attributes?.device_class;
  
  // LIGHT ICONS - 1:1 aus fast-search-card.js
  if (domain === 'light') {
    if (isOn) {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>@keyframes bulbGlow{0%{stroke:#FFD54F;filter:drop-shadow(0 0 0 #FFD54F);transform:scale(1)}50%{stroke:#FFD54F;filter:drop-shadow(0 0 8px #FFD54F);transform:scale(1.05)}100%{stroke:#FFD54F;filter:drop-shadow(0 0 2px #FFD54F);transform:scale(1)}}@keyframes fadeInStep2{0%{opacity:0;transform:translateY(2px)}100%{opacity:1;transform:translateY(0)}}@keyframes fadeInStep3{0%{opacity:0;transform:translateY(2px)}100%{opacity:1;transform:translateY(0)}}#segment1{animation:bulbGlow 1s ease-in-out 1;transform-origin:center}#segment2{opacity:0;animation:fadeInStep2 1s ease-out 300ms forwards}#segment3{opacity:0;animation:fadeInStep3 1s ease-out 600ms forwards}</style>
            <g id="segment1"><path d="M9.00082 15C9.00098 13 8.50098 12.5 7.50082 11.5C6.50067 10.5 6.02422 9.48689 6.00082 8C5.95284 4.95029 8.00067 3 12.0008 3C16.001 3 18.0488 4.95029 18.0008 8C17.9774 9.48689 17.5007 10.5 16.5008 11.5C15.501 12.5 15.001 13 15.0008 15" stroke="#FFD54F" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
            <g id="segment2"><path d="M9 18H15" stroke="#42A5F5" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></g>
            <g id="segment3"><path d="M10 21H14" stroke="#42A5F5" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></g>
          </svg>
        `}} />
      );
    } else {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>@keyframes bulbDimOut{0%{stroke:#FFD54F;filter:drop-shadow(0 0 2px #FFD54F);transform:scale(1)}50%{stroke:#F0F4F8;filter:drop-shadow(0 0 0 #F0F4F8);transform:scale(.95)}100%{stroke:#F0F4F8;filter:none;transform:scale(1)}}@keyframes fadeOutStep2{0%{opacity:1;stroke:#42A5F5;transform:translateY(0)}50%{opacity:.3;stroke:#42A5F5;transform:translateY(1px)}100%{opacity:1;stroke:#B0BEC5;transform:translateY(0)}}@keyframes fadeOutStep3{0%{opacity:1;stroke:#42A5F5;transform:translateY(0)}50%{opacity:.3;stroke:#42A5F5;transform:translateY(1px)}100%{opacity:1;stroke:#B0BEC5;transform:translateY(0)}}#segment1{stroke:#F0F4F8;animation:bulbDimOut 1s ease-in-out 1;transform-origin:center}#segment2{stroke:#B0BEC5;opacity:1;animation:fadeOutStep2 1s ease-in 0s forwards}#segment3{stroke:#B0BEC5;opacity:1;animation:fadeOutStep3 1s ease-in 300ms forwards}</style>
            <g id="segment1"><path d="M9.00082 15C9.00098 13 8.50098 12.5 7.50082 11.5C6.50067 10.5 6.02422 9.48689 6.00082 8C5.95284 4.95029 8.00067 3 12.0008 3C16.001 3 18.0488 4.95029 18.0008 8C17.9774 9.48689 17.5007 10.5 16.5008 11.5C15.501 12.5 15.001 13 15.0008 15" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
            <g id="segment2"><path d="M9 18H15" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></g>
            <g id="segment3"><path d="M10 21H14" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></g>
          </svg>
        `}} />
      );
    }
  }
  
  // COVER - GARAGE DOOR
  if (domain === 'cover' && (deviceClass === 'garage' || attributes?.friendly_name?.toLowerCase().includes('garage'))) {
    if (isOn) {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg id="garage_door_system" width="${size}px" height="${size}px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>@keyframes fade_out_bottom{0%{opacity:1}25%{opacity:0}100%{opacity:0}}@keyframes fade_out_middle{0%{opacity:1}25%{opacity:0}100%{opacity:0}}@keyframes fade_out_top{0%{opacity:1}25%{opacity:0}100%{opacity:0}}#bottom_slat_fill{animation:fade_out_bottom 2s ease-in-out forwards;animation-delay:500ms;opacity:1}#middle_slat_fill{animation:fade_out_middle 2s ease-in-out forwards;animation-delay:1s;opacity:1}#top_slat_fill{animation:fade_out_top 2s ease-in-out forwards;animation-delay:1.5s;opacity:1}#garage_door_system{filter:drop-shadow(0 0 2px rgba(93,64,55,.4))}</style>
            <path d="M6 20H3V6L12 4L21 6V20H18M6 20H18M6 20V16M18 20V16M6 12V8L18 8V12M6 12L18 12M6 12V16M18 12V16M6 16H18" stroke="#388E3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <rect id="top_slat_fill" x="6" y="8" width="12" height="4" fill="rgba(56,142,60,0.3)" stroke="none"/><rect id="middle_slat_fill" x="6" y="12" width="12" height="4" fill="rgba(56,142,60,0.3)" stroke="none"/><rect id="bottom_slat_fill" x="6" y="16" width="12" height="4" fill="rgba(56,142,60,0.3)" stroke="none"/>
          </svg>
        `}} />
      );
    } else {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg id="garage_door_system" width="${size}px" height="${size}px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style>@keyframes fade_in_top{0%{opacity:0}25%{opacity:1}100%{opacity:1}}@keyframes fade_in_middle{0%{opacity:0}25%{opacity:1}100%{opacity:1}}@keyframes fade_in_bottom{0%{opacity:0}25%{opacity:1}100%{opacity:1}}#top_slat_fill{animation:fade_in_top 2s ease-in-out forwards;animation-delay:500ms;opacity:0}#middle_slat_fill{animation:fade_in_middle 2s ease-in-out forwards;animation-delay:1s;opacity:0}#bottom_slat_fill{animation:fade_in_bottom 2s ease-in-out forwards;animation-delay:1.5s;opacity:0}#garage_door_system{filter:none}</style>
            <path d="M6 20H3V6L12 4L21 6V20H18M6 20H18M6 20V16M18 20V16M6 12V8L18 8V12M6 12L18 12M6 12V16M18 12V16M6 16H18" stroke="#B0BEC5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <rect id="top_slat_fill" x="6" y="8" width="12" height="4" fill="rgba(176,190,197,0.15)" stroke="none"/><rect id="middle_slat_fill" x="6" y="12" width="12" height="4" fill="rgba(176,190,197,0.15)" stroke="none"/><rect id="bottom_slat_fill" x="6" y="16" width="12" height="4" fill="rgba(176,190,197,0.15)" stroke="none"/>
          </svg>
        `}} />
      );
    }
  }
  
  // DOOR SENSOR
  if ((domain === 'binary_sensor' || domain === 'sensor') && (deviceClass === 'door' || deviceClass === 'window')) {
    if (isOn) {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
            <style><![CDATA[ @keyframes door_open{0%{transform:translateX(0);opacity:.4}100%{transform:translateX(-1.5px);opacity:.8}}@keyframes door_side_open{0%{transform:translateX(-5px);opacity:0}100%{transform:translateX(-10px);opacity:1}}#door_frame{animation:door_open 1.5s ease-out forwards;transform-origin:2px 12px}#door_opening_side{animation:door_side_open 1.5s ease-out forwards;transform-origin:16px 12px} ]]></style>
            <path id="door_frame" d="M2 18V6C2 4.34315 3.34315 3 5 3H7C8.65685 3 10 4.34315 10 6V18C10 19.6569 8.65685 21 7 21H5C3.34315 21 2 19.6569 2 18Z" stroke="#42A5F5" fill="rgba(66, 165, 245, 0.2)" stroke-width="1.5"/>
            <path id="door_opening_side" d="M16 3H18C20.2091 3 22 4.79086 22 7V17C22 19.2091 20.2091 21 18 21H16" stroke="#42A5F5" fill="rgba(66, 165, 245, 0.1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}} />
      );
    } else {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
            <style><![CDATA[ @keyframes door_close{0%{transform:translateX(-1.5px);opacity:.8}100%{transform:translateX(0);opacity:.4}}@keyframes door_side_close{0%{transform:translateX(-10px);opacity:1}100%{transform:translateX(-5px);opacity:0}}#door_frame{animation:door_close 1.5s ease-out forwards;transform-origin:2px 12px}#door_opening_side{animation:door_side_close 1.5s ease-out forwards;transform-origin:16px 12px} ]]></style>
            <path id="door_frame" d="M2 18V6C2 4.34315 3.34315 3 5 3H7C8.65685 3 10 4.34315 10 6V18C10 19.6569 8.65685 21 7 21H5C3.34315 21 2 19.6569 2 18Z" stroke="#B0BEC5" fill="rgba(176, 190, 197, 0.1)" stroke-width="1.5"/>
            <path id="door_opening_side" d="M16 3H18C20.2091 3 22 4.79086 22 7V17C22 19.2091 20.2091 21 18 21H16" stroke="#B0BEC5" fill="rgba(176, 190, 197, 0.05)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}} />
      );
    }
  }
  
  // LOCK SENSOR
  if (domain === 'lock' || (domain === 'binary_sensor' && deviceClass === 'lock')) {
    if (state === 'unlocked' || state === 'on') {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
            <style><![CDATA[ @keyframes shackle_opening{0%{transform:rotate(0)}100%{transform:rotate(45deg)}}#shackle{animation:shackle_opening 2s ease-out 1 normal forwards;transform-origin:16px 12px} ]]></style>
            <path d="M16 12H17.4C17.7314 12 18 12.2686 18 12.6V19.4C18 19.7314 17.7314 20 17.4 20H6.6C6.26863 20 6 19.7314 6 19.4V12.6C6 12.2686 6.26863 12 6.6 12H8M16 12H8" stroke="#FFD54F" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="shackle" d="M16 12V8C16 6.66667 15.2 4 12 4C8.8 4 8 6.66667 8 8V12" stroke="#1976D2" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}} />
      );
    } else {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
            <style><![CDATA[ @keyframes shackle_closing{0%{transform:rotate(45deg)}100%{transform:rotate(0)}}#shackle{animation:shackle_closing 2s ease-out 1 normal forwards;transform-origin:16px 12px} ]]></style>
            <path d="M16 12H17.4C17.7314 12 18 12.2686 18 12.6V19.4C18 19.7314 17.7314 20 17.4 20H6.6C6.26863 20 6 19.7314 6 19.4V12.6C6 12.2686 6.26863 12 6.6 12H8M16 12H8" stroke="#FFD54F" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="shackle" d="M16 12V8C16 6.66667 15.2 4 12 4C8.8 4 8 6.66667 8 8V12" stroke="#1976D2" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}} />
      );
    }
  }
  
  // MOTION SENSOR
  if (domain === 'binary_sensor' && deviceClass === 'motion') {
    if (isOn) {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg id="motion_icon" width="${size}px" height="${size}px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style><![CDATA[ @keyframes motion_wave{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}#motion_diamond1{animation:motion_wave 2s ease-in-out infinite;animation-delay:0s;transform-origin:8px 12px}#motion_diamond2{animation:motion_wave 2s ease-in-out infinite;animation-delay:300ms;transform-origin:15.4px 12px}#motion_diamond3{animation:motion_wave 2s ease-in-out infinite;animation-delay:600ms;transform-origin:19.4px 12px}#motion_icon{filter:drop-shadow(0 0 2px rgba(66,165,245,.3))} ]]></style>
            <path id="motion_diamond1" d="M13.8476 13.317L9.50515 18.2798C8.70833 19.1905 7.29167 19.1905 6.49485 18.2798L2.15238 13.317C1.49259 12.563 1.49259 11.437 2.15238 10.683L6.49485 5.72018C7.29167 4.80952 8.70833 4.80952 9.50515 5.72017L13.8476 10.683C14.5074 11.437 14.5074 12.563 13.8476 13.317Z" stroke="#42A5F5" fill="rgba(66, 165, 245, 0.15)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="motion_diamond2" d="M13 19L17.8844 13.3016C18.5263 12.5526 18.5263 11.4474 17.8844 10.6984L13 5" stroke="#42A5F5" fill="rgba(66, 165, 245, 0.1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="motion_diamond3" d="M17 19L21.8844 13.3016C22.5263 12.5526 22.5263 11.4474 21.8844 10.6984L17 5" stroke="#42A5F5" fill="rgba(66, 165, 245, 0.05)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}} />
      );
    } else {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg id="motion_icon" width="${size}px" height="${size}px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style><![CDATA[ @keyframes motion_fade_out{0%{opacity:1;stroke:#42A5F5}100%{opacity:.4;stroke:#B0BEC5}}#motion_diamond1,#motion_diamond2,#motion_diamond3{animation:motion_fade_out 1.5s ease-out forwards}#motion_icon{filter:none} ]]></style>
            <path id="motion_diamond1" d="M13.8476 13.317L9.50515 18.2798C8.70833 19.1905 7.29167 19.1905 6.49485 18.2798L2.15238 13.317C1.49259 12.563 1.49259 11.437 2.15238 10.683L6.49485 5.72018C7.29167 4.80952 8.70833 4.80952 9.50515 5.72017L13.8476 10.683C14.5074 11.437 14.5074 12.563 13.8476 13.317Z" stroke="#B0BEC5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="motion_diamond2" d="M13 19L17.8844 13.3016C18.5263 12.5526 18.5263 11.4474 17.8844 10.6984L13 5" stroke="#B0BEC5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="motion_diamond3" d="M17 19L21.8844 13.3016C22.5263 12.5526 22.5263 11.4474 21.8844 10.6984L17 5" stroke="#B0BEC5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}} />
      );
    }
  }
  
  // PRESENCE SENSOR
  if (domain === 'binary_sensor' && (deviceClass === 'presence' || deviceClass === 'occupancy')) {
    if (!isOn) {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg id="presence_sensor" width="${size}px" height="${size}px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <style><![CDATA[ @keyframes presence_fade_out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.95)}}@keyframes presence_stay_visible{0%{opacity:1;transform:scale(1)}100%{opacity:.4;transform:scale(.98)}}#outer_ring{animation:presence_fade_out 1.5s ease-out forwards;animation-delay:0s;transform-origin:12px 11px}#middle_ring{animation:presence_fade_out 1.5s ease-out forwards;animation-delay:200ms;transform-origin:12px 11px}#person_figure{animation:presence_stay_visible 1.5s ease-out forwards;animation-delay:400ms;transform-origin:12px 18px}#presence_sensor{filter:none} ]]></style>
            <path id="outer_ring" d="M6 19.0007C3.57111 17.1763 2 14.2716 2 11C2 5.47715 6.47715 1 12 1C17.5228 1 22 5.47715 22 11C22 14.2716 20.4289 17.1763 18 19.0007" stroke="#B0BEC5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="middle_ring" d="M7.52779 15C6.57771 13.9385 6 12.5367 6 11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11C18 12.5367 17.4223 13.9385 16.4722 15" stroke="#B0BEC5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <g id="person_figure">
              <path d="M12 13C13.1046 13 14 12.1046 14 11C14 9.89543 13.1046 9 12 9C10.8954 9 10 9.89543 10 11C10 12.1046 10.8954 13 12 13Z" stroke="#B0BEC5" fill="rgba(176, 190, 197, 0.1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10.076 16.2827L10.8906 15.7396C11.5624 15.2917 12.4376 15.2917 13.1094 15.7396L13.924 16.2827C14.5789 16.7192 14.9168 17.4993 14.7874 18.2756L14.2785 21.3288C14.1178 22.2932 13.2834 23 12.3057 23H11.6943C10.7166 23 9.8822 22.2932 9.72147 21.3288L9.2126 18.2756C9.08321 17.4993 9.42114 16.7192 10.076 16.2827Z" stroke="#B0BEC5" fill="rgba(176, 190, 197, 0.05)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
          </svg>
        `}} />
      );
    }
  }
  
  // SIREN/ALERT
  if (domain === 'siren' || domain === 'alert') {
    if (isOn) {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
            <style>@keyframes bell_ring{0%,100%{transform:rotate(-5deg)}25%{transform:rotate(5deg)}75%{transform:rotate(-5deg)}}@keyframes clapper_swing{0%,100%{transform:translateX(-2px)}50%{transform:translateX(2px)}}@keyframes alert_pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}#bell{animation:bell_ring 1.5s ease-in-out infinite;transform-origin:12px 6px}#clapper{animation:clapper_swing 1.5s ease-in-out infinite;transform-origin:12px 19px}#alert_icon{animation:alert_pulse 2s ease-in-out infinite;transform-origin:12px 12px}</style>
            <g id="alert_icon">
              <g id="bell"><path d="M18 8.4C18 6.70261 17.3679 5.07475 16.2426 3.87452C15.1174 2.67428 13.5913 2 12 2C10.4087 2 8.88258 2.67428 7.75736 3.87452C6.63214 5.07475 6 6.70261 6 8.4C6 15.8667 3 18 3 18H21C21 18 18 15.8667 18 8.4Z" stroke="#F44336" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>
              <g id="clapper"><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>
            </g>
          </svg>
        `}} />
      );
    } else {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
            <style>@keyframes alert_fade_out{0%{opacity:1}100%{opacity:.4}}#alert_icon{animation:alert_fade_out 1s ease-out 1 normal forwards}</style>
            <g id="alert_icon">
              <path d="M18 8.4C18 6.70261 17.3679 5.07475 16.2426 3.87452C15.1174 2.67428 13.5913 2 12 2C10.4087 2 8.88258 2.67428 7.75736 3.87452C6.63214 5.07475 6 6.70261 6 8.4C6 15.8667 3 18 3 18H21C21 18 18 15.8667 18 8.4Z" stroke="#9E9E9E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#BDBDBD" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
          </svg>
        `}} />
      );
    }
  }
  
  // MEDIA_PLAYER - TV
  if (domain === 'media_player' && deviceClass === 'tv') {
    if (isOn) {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg id="tv_system" width="${size}px" height="${size}px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 21L17 21" stroke="#1976D2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 16.4V3.6C2 3.26863 2.26863 3 2.6 3H21.4C21.7314 3 22 3.26863 22 3.6V16.4C22 16.7314 21.7314 17 21.4 17H2.6C2.26863 17 2 16.7314 2 16.4Z" stroke="#1976D2" fill="rgba(25, 118, 210, 0.1)" stroke-width="1.5"/>
          </svg>
        `}} />
      );
    }
  }
  
  // CLIMATE - mit den Original HVAC Icons aus fast-search-card.js
  if (domain === 'climate') {
    const hvacMode = attributes?.hvac_mode || state;
    if (hvacMode === 'heat') {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
            <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M22 12L23 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M12 2V1" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M12 23V22" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M20 20L19 19" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M20 4L19 5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M4 20L5 19" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M4 4L5 5" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M1 12L2 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `}} />
      );
    } else if (hvacMode === 'cool') {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
            <path d="M3 7.4V3.6C3 3.26863 3.26863 3 3.6 3H20.4C20.7314 3 21 3.26863 21 3.6V7.4M3 16.6V20.4C3 20.7314 3.26863 21 3.6 21H20.4C20.7314 21 21 20.7314 21 20.4V16.6M9 12V7M9 17V12M9 12L6 9M9 12L12 9M9 12L6 15M9 12L12 15M15 12V7M15 17V12M15 12L12 9M15 12L18 9M15 12L12 15M15 12L18 15M3 12H7M17 12H21" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `}} />
      );
    } else if (hvacMode === 'dry') {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
            <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M12 22C16.418 22 20 18.418 20 14C20 10 12 2 12 2C12 2 4 10 4 14C4 18.418 7.582 22 12 22Z" stroke="currentColor" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `}} />
      );
    } else if (hvacMode === 'fan_only') {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
            <path d="M8 15.0004C8 15.0004 8.12941 15.0004 8.12941 14.3889C8.12941 11.3002 5.71765 8.61109 4 6.29172C4 6.29172 4 2 4 2C4 2 8.375 2.38889 9.875 4.60001C11.375 6.81113 10.75 10 10.75 10L11.7491 10L13.625 4.50001C13.625 4.50001 17.5 4.38889 19 7.80555C20.5 11.2222 17.3721 13.7854 16 14.5004L16 16L20 16L20 20L16 20M8 15.0004L8 20L4 20L4 16L8 16L8 15.0004Z" stroke="currentColor" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M12 11C14.2091 11 16 12.7909 16 15C16 17.2091 14.2091 19 12 19C9.79086 19 8 17.2091 8 15C8 12.7909 9.79086 11 12 11Z" stroke="currentColor" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M12 15.0001L12.0071 15.0072" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `}} />
      );
    } else if (hvacMode === 'auto') {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
            <path d="M21 3.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H20.4C20.7314 3 21 3.26863 21 3.6Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M8 10V14L10.5 11.5L12 14L13.5 11.5L16 14V10" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M12 7C12.5523 7 13 6.55228 13 6C13 5.44772 12.5523 5 12 5C11.4477 5 11 5.44772 11 6C11 6.55228 11.4477 7 12 7Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M17.5228 6.47715 22 12 17.5228 17.5228" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M6.47715 6.47715 2 12 6.47715 17.5228" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        `}} />
      );
    }
  }
  
  // FAN
  if (domain === 'fan') {
    const fanSpeed = attributes?.percentage || 0;
    const rotationSpeed = fanSpeed > 0 ? 3 - (fanSpeed / 50) : 0;
    return (
      <div dangerouslySetInnerHTML={{ __html: `
        <svg width="${size}px" height="${size}px" viewBox="0 0 24 24" fill="none">
          <style>
            @keyframes fan-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .fan-blades {
              transform-origin: center;
              animation: ${isOn ? `fan-spin ${rotationSpeed}s linear infinite` : 'none'};
            }
          </style>
          <g class="fan-blades">
            <path d="M12 12C12 8 14 6 14 6S16 8 16 12C19 12 21 10 21 10S19 8 15 8C15 5 13 3 13 3S11 5 11 8C8 8 6 10 6 10S8 12 11 12C11 15 13 17 13 17S15 15 15 12" stroke="currentColor" stroke-width="2" fill="${isOn ? 'rgba(255, 255, 255, 0.1)' : 'none'}"/>
          </g>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      `}} />
    );
  }
  
  // VACUUM
  if (domain === 'vacuum') {
    const isCleaning = state === 'cleaning';
    return (
      <div dangerouslySetInnerHTML={{ __html: `
        <svg width="${size}px" height="${size}px" viewBox="0 0 24 24" fill="none">
          <style>
            @keyframes vacuum-move {
              0%, 100% { transform: translateX(0) rotate(0deg); }
              25% { transform: translateX(2px) rotate(5deg); }
              75% { transform: translateX(-2px) rotate(-5deg); }
            }
            @keyframes dust-particle {
              0% { opacity: 1; transform: scale(1) translateX(0); }
              100% { opacity: 0; transform: scale(0.5) translateX(-10px); }
            }
            .vacuum-body {
              animation: ${isCleaning ? 'vacuum-move 1s ease-in-out infinite' : 'none'};
              transform-origin: center;
            }
            .dust-particles circle {
              animation: dust-particle 1s ease-out infinite;
            }
            .dust-particles circle:nth-child(2) {
              animation-delay: 0.3s;
            }
            .dust-particles circle:nth-child(3) {
              animation-delay: 0.6s;
            }
          </style>
          <g class="vacuum-body">
            <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1" opacity="0.5"/>
            <g opacity="${isCleaning ? 1 : 0.3}">
              <line x1="8" y1="18" x2="8" y2="20" stroke="currentColor" stroke-width="1"/>
              <line x1="10" y1="18" x2="10" y2="20" stroke="currentColor" stroke-width="1"/>
              <line x1="12" y1="18" x2="12" y2="20" stroke="currentColor" stroke-width="1"/>
              <line x1="14" y1="18" x2="14" y2="20" stroke="currentColor" stroke-width="1"/>
              <line x1="16" y1="18" x2="16" y2="20" stroke="currentColor" stroke-width="1"/>
            </g>
          </g>
          ${isCleaning ? `
            <g class="dust-particles" fill="currentColor" opacity="0.4">
              <circle cx="20" cy="10" r="1"/>
              <circle cx="21" cy="14" r="0.8"/>
              <circle cx="20" cy="18" r="0.6"/>
            </g>
          ` : ''}
        </svg>
      `}} />
    );
  }
  
  // SWITCH
  if (domain === 'switch') {
    return (
      <div dangerouslySetInnerHTML={{ __html: `
        <svg width="${size}px" height="${size}px" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="6" stroke="currentColor" stroke-width="2" fill="${isOn ? 'rgba(0, 255, 0, 0.2)' : 'none'}"/>
          <circle cx="${isOn ? '15' : '9'}" cy="12" r="3" fill="currentColor"/>
        </svg>
      `}} />
    );
  }
  
  // SENSOR - verschiedene device_class Typen
  if (domain === 'sensor') {
    // Temperature sensor
    if (deviceClass === 'temperature') {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 3C10.343 3 9 4.343 9 6V12C6.79 13.066 5.34 15.424 5.34 18.142C5.34 21.882 8.41 24 12.15 24C15.89 24 19 21.882 19 18.142C19 15.424 17.51 13.066 15.34 12V6C15.34 4.343 13.657 3 12 3Z" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="18" r="3" fill="${isOn ? '#ff6b6b' : '#868e96'}"/>
          </svg>
        `}} />
      );
    }
    // Humidity sensor
    else if (deviceClass === 'humidity') {
      return (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="${size}px" height="${size}px" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C16.418 22 20 18.418 20 14C20 10 12 2 12 2C12 2 4 10 4 14C4 18.418 7.582 22 12 22Z" stroke="currentColor" stroke-width="2" fill="${isOn ? 'rgba(66, 165, 245, 0.2)' : 'none'}"/>
          </svg>
        `}} />
      );
    }
  }
  
  // DEFAULT FALLBACK
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
};

// Helper function um die Icons in DeviceCard zu nutzen
export const getDeviceIcon = (device) => {
  return (
    <AnimatedDeviceIcons 
      domain={device.domain}
      state={device.state || (device.isActive ? 'on' : 'off')}
      attributes={device.attributes || {}}
      size={36}
    />
  );
};