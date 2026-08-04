// src/components/TransitionEffect.tsx
// 150 تأثير انتقالي — Canvas للمعقد، CSS للبسيط
// تعمل جميعها مستقلة بدون dependencies خارجية

import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import { TransitionSettings } from '../../types';

interface TransitionEffectProps {
  settings: TransitionSettings;
  isActive: boolean;
  onComplete?: () => void;
}

export interface TransitionDef {
  id: string; label: string; category: string; engine: 'canvas'|'css'; preview: string;
}

export const TRANSITION_CATALOG: TransitionDef[] = [
  // Flash/Fade (19)
  {id:'fade',label:'Fade Black',category:'Flash/Fade',engine:'css',preview:'#000'},
  {id:'fade_white',label:'Fade White',category:'Flash/Fade',engine:'css',preview:'#fff'},
  {id:'flash_white',label:'Flash White',category:'Flash/Fade',engine:'css',preview:'#fff'},
  {id:'flash_color',label:'Flash Color',category:'Flash/Fade',engine:'css',preview:'#f00'},
  {id:'flash_strobe',label:'Strobe Flash',category:'Flash/Fade',engine:'canvas',preview:'#fff'},
  {id:'flash_rgb',label:'RGB Flash',category:'Flash/Fade',engine:'canvas',preview:'#f0f'},
  {id:'flash_scanline',label:'Scanline Flash',category:'Flash/Fade',engine:'canvas',preview:'#0ff'},
  {id:'flash_pixel_scatter',label:'Pixel Scatter',category:'Flash/Fade',engine:'canvas',preview:'#ff0'},
  {id:'flash_vhs',label:'VHS Glitch',category:'Flash/Fade',engine:'canvas',preview:'#0f0'},
  {id:'flash_thunder',label:'Thunder Flash',category:'Flash/Fade',engine:'canvas',preview:'#88f'},
  {id:'flash_fire',label:'Fire Flash',category:'Flash/Fade',engine:'canvas',preview:'#f80'},
  {id:'flash_matrix',label:'Matrix Rain',category:'Flash/Fade',engine:'canvas',preview:'#0f0'},
  {id:'fade_horizontal',label:'Fade Horizontal',category:'Flash/Fade',engine:'canvas',preview:'#222'},
  {id:'fade_vertical',label:'Fade Vertical',category:'Flash/Fade',engine:'canvas',preview:'#222'},
  {id:'fade_radial',label:'Fade Radial',category:'Flash/Fade',engine:'canvas',preview:'#222'},
  {id:'fade_diagonal_tl',label:'Fade Diag TL',category:'Flash/Fade',engine:'canvas',preview:'#222'},
  {id:'fade_diagonal_tr',label:'Fade Diag TR',category:'Flash/Fade',engine:'canvas',preview:'#222'},
  {id:'flash_retro_flicker',label:'Retro Flicker',category:'Flash/Fade',engine:'canvas',preview:'#fa0'},
  {id:'seamless_crossfade',label:'Crossfade',category:'Flash/Fade',engine:'css',preview:'#448'},
  // Slide/Push (9)
  {id:'slide_left',label:'Slide Left',category:'Slide/Push',engine:'css',preview:'#248'},
  {id:'slide_right',label:'Slide Right',category:'Slide/Push',engine:'css',preview:'#248'},
  {id:'slide_up',label:'Slide Up',category:'Slide/Push',engine:'css',preview:'#248'},
  {id:'slide_down',label:'Slide Down',category:'Slide/Push',engine:'css',preview:'#248'},
  {id:'slide_bounce_left',label:'Bounce Left',category:'Slide/Push',engine:'css',preview:'#48c'},
  {id:'slide_bounce_right',label:'Bounce Right',category:'Slide/Push',engine:'css',preview:'#48c'},
  {id:'slide_bounce_up',label:'Bounce Up',category:'Slide/Push',engine:'css',preview:'#48c'},
  {id:'slide_bounce_down',label:'Bounce Down',category:'Slide/Push',engine:'css',preview:'#48c'},
  {id:'megaman_slide',label:'Mega Man Slide',category:'Slide/Push',engine:'css',preview:'#06f'},
  // Wipe (10)
  {id:'circle_wipe',label:'Circle Wipe',category:'Wipe',engine:'css',preview:'#242'},
  {id:'diamond_wipe',label:'Diamond Wipe',category:'Wipe',engine:'css',preview:'#424'},
  {id:'star_wipe',label:'Star Wipe',category:'Wipe',engine:'css',preview:'#442'},
  {id:'heart_wipe',label:'Heart Wipe',category:'Wipe',engine:'css',preview:'#a22'},
  {id:'diagonal_wipe',label:'Diagonal Wipe',category:'Wipe',engine:'css',preview:'#224'},
  {id:'mario_iris',label:'Mario Iris',category:'Wipe',engine:'css',preview:'#a52'},
  {id:'radial_wipe_cw',label:'Radial Wipe CW',category:'Wipe',engine:'canvas',preview:'#262'},
  {id:'radial_wipe_ccw',label:'Radial Wipe CCW',category:'Wipe',engine:'canvas',preview:'#262'},
  {id:'starburst_wipe',label:'Starburst Wipe',category:'Wipe',engine:'canvas',preview:'#aa0'},
  {id:'paint_brush_wipe',label:'Paint Brush',category:'Wipe',engine:'canvas',preview:'#8a2'},
  // Grid (7)
  {id:'checkerboard',label:'Checkerboard',category:'Grid',engine:'css',preview:'#444'},
  {id:'grid_wipe',label:'Grid Wipe',category:'Grid',engine:'css',preview:'#446'},
  {id:'mosaic',label:'Mosaic',category:'Grid',engine:'css',preview:'#464'},
  {id:'pixelate',label:'Pixelate',category:'Grid',engine:'css',preview:'#464'},
  {id:'grid_explode',label:'Grid Explode',category:'Grid',engine:'canvas',preview:'#646'},
  {id:'grid_implode',label:'Grid Implode',category:'Grid',engine:'canvas',preview:'#646'},
  {id:'pixel_dissolve',label:'Pixel Dissolve',category:'Grid',engine:'canvas',preview:'#448'},
  // Spiral/Swirl (16)
  {id:'swirl',label:'Swirl Classic',category:'Spiral/Swirl',engine:'canvas',preview:'#80f'},
  {id:'spiral_in_cw',label:'Spiral In CW',category:'Spiral/Swirl',engine:'canvas',preview:'#60c'},
  {id:'spiral_in_ccw',label:'Spiral In CCW',category:'Spiral/Swirl',engine:'canvas',preview:'#60c'},
  {id:'spiral_out_cw',label:'Spiral Out CW',category:'Spiral/Swirl',engine:'canvas',preview:'#80f'},
  {id:'spiral_out_ccw',label:'Spiral Out CCW',category:'Spiral/Swirl',engine:'canvas',preview:'#80f'},
  {id:'spiral_warp_fast',label:'Spiral Fast',category:'Spiral/Swirl',engine:'canvas',preview:'#a0f'},
  {id:'spiral_warp_slow',label:'Spiral Slow',category:'Spiral/Swirl',engine:'canvas',preview:'#a0f'},
  {id:'spiral_double',label:'Double Spiral',category:'Spiral/Swirl',engine:'canvas',preview:'#c0f'},
  {id:'spiral_pinwheel',label:'Pinwheel',category:'Spiral/Swirl',engine:'canvas',preview:'#f0c'},
  {id:'swirl_zoom_in',label:'Swirl Zoom In',category:'Spiral/Swirl',engine:'canvas',preview:'#f08'},
  {id:'swirl_zoom_out',label:'Swirl Zoom Out',category:'Spiral/Swirl',engine:'canvas',preview:'#f08'},
  {id:'swirl_color_bands',label:'Color Bands',category:'Spiral/Swirl',engine:'canvas',preview:'#f40'},
  {id:'swirl_psychedelic',label:'Psychedelic',category:'Spiral/Swirl',engine:'canvas',preview:'#f0f'},
  {id:'spiral_square',label:'Square Spiral',category:'Spiral/Swirl',engine:'canvas',preview:'#80c'},
  {id:'swirl_ripple',label:'Ripple Swirl',category:'Spiral/Swirl',engine:'canvas',preview:'#08f'},
  {id:'ff_swirl',label:'FF7 Swirl',category:'Spiral/Swirl',engine:'css',preview:'#80f'},
  // Zoom/Blur (13)
  {id:'zoom_in',label:'Zoom In',category:'Zoom/Blur',engine:'css',preview:'#224'},
  {id:'zoom_out',label:'Zoom Out',category:'Zoom/Blur',engine:'css',preview:'#224'},
  {id:'zoom_blur_in',label:'Zoom Blur In',category:'Zoom/Blur',engine:'canvas',preview:'#226'},
  {id:'zoom_blur_out',label:'Zoom Blur Out',category:'Zoom/Blur',engine:'canvas',preview:'#226'},
  {id:'radial_blur_cw',label:'Radial Blur CW',category:'Zoom/Blur',engine:'canvas',preview:'#248'},
  {id:'radial_blur_ccw',label:'Radial Blur CCW',category:'Zoom/Blur',engine:'canvas',preview:'#248'},
  {id:'motion_blur_left',label:'Motion Blur L',category:'Zoom/Blur',engine:'canvas',preview:'#28c'},
  {id:'motion_blur_right',label:'Motion Blur R',category:'Zoom/Blur',engine:'canvas',preview:'#28c'},
  {id:'motion_blur_up',label:'Motion Blur Up',category:'Zoom/Blur',engine:'canvas',preview:'#28c'},
  {id:'motion_blur_down',label:'Motion Blur Dn',category:'Zoom/Blur',engine:'canvas',preview:'#28c'},
  {id:'zoom_punch',label:'Zoom Punch',category:'Zoom/Blur',engine:'canvas',preview:'#a00'},
  {id:'lens_flare_zoom',label:'Lens Flare',category:'Zoom/Blur',engine:'canvas',preview:'#ff8'},
  {id:'parallax_zoom',label:'Parallax Zoom',category:'Zoom/Blur',engine:'canvas',preview:'#048'},
  // Vortex (14)
  {id:'vortex_in',label:'Vortex In',category:'Vortex',engine:'canvas',preview:'#008'},
  {id:'vortex_out',label:'Vortex Out',category:'Vortex',engine:'canvas',preview:'#008'},
  {id:'vortex_cw',label:'Vortex CW',category:'Vortex',engine:'canvas',preview:'#028'},
  {id:'vortex_ccw',label:'Vortex CCW',category:'Vortex',engine:'canvas',preview:'#028'},
  {id:'vortex_fire',label:'Fire Vortex',category:'Vortex',engine:'canvas',preview:'#f40'},
  {id:'vortex_ice',label:'Ice Vortex',category:'Vortex',engine:'canvas',preview:'#8cf'},
  {id:'vortex_electric',label:'Electric Vortex',category:'Vortex',engine:'canvas',preview:'#ff0'},
  {id:'vortex_galaxy',label:'Galaxy Vortex',category:'Vortex',engine:'canvas',preview:'#204'},
  {id:'vortex_portal',label:'Portal Vortex',category:'Vortex',engine:'canvas',preview:'#0af'},
  {id:'vortex_dark',label:'Dark Vortex',category:'Vortex',engine:'canvas',preview:'#000'},
  {id:'vortex_paint',label:'Paint Vortex',category:'Vortex',engine:'canvas',preview:'#fa0'},
  {id:'vortex_water',label:'Water Vortex',category:'Vortex',engine:'canvas',preview:'#06a'},
  {id:'vortex_double',label:'Double Vortex',category:'Vortex',engine:'canvas',preview:'#404'},
  {id:'vortex_implosion',label:'Implosion',category:'Vortex',engine:'canvas',preview:'#880'},
  // Hyperdrive (17)
  {id:'hyperdrive',label:'Hyperdrive',category:'Hyperdrive',engine:'canvas',preview:'#004'},
  {id:'hyperdrive_blue',label:'Hyperdrive Blue',category:'Hyperdrive',engine:'canvas',preview:'#06f'},
  {id:'hyperdrive_red',label:'Hyperdrive Red',category:'Hyperdrive',engine:'canvas',preview:'#f00'},
  {id:'hyperdrive_gold',label:'Hyperdrive Gold',category:'Hyperdrive',engine:'canvas',preview:'#fa0'},
  {id:'hyperdrive_green',label:'Hyperdrive Green',category:'Hyperdrive',engine:'canvas',preview:'#0f4'},
  {id:'hyperdrive_rainbow',label:'Rainbow Drive',category:'Hyperdrive',engine:'canvas',preview:'#f0f'},
  {id:'warp_tunnel',label:'Warp Tunnel',category:'Hyperdrive',engine:'canvas',preview:'#008'},
  {id:'warp_rings',label:'Warp Rings',category:'Hyperdrive',engine:'canvas',preview:'#0af'},
  {id:'warp_stars_dense',label:'Dense Stars',category:'Hyperdrive',engine:'canvas',preview:'#002'},
  {id:'warp_stars_sparse',label:'Sparse Stars',category:'Hyperdrive',engine:'canvas',preview:'#002'},
  {id:'warp_hyperspace',label:'Hyperspace',category:'Hyperdrive',engine:'canvas',preview:'#008'},
  {id:'warp_wormhole',label:'Wormhole',category:'Hyperdrive',engine:'canvas',preview:'#404'},
  {id:'warp_time',label:'Time Warp',category:'Hyperdrive',engine:'canvas',preview:'#048'},
  {id:'warp_light_speed',label:'Light Speed',category:'Hyperdrive',engine:'canvas',preview:'#fff'},
  {id:'warp_supernova',label:'Supernova',category:'Hyperdrive',engine:'canvas',preview:'#f80'},
  {id:'warp_black_hole',label:'Black Hole',category:'Hyperdrive',engine:'canvas',preview:'#000'},
  {id:'warp_nebula',label:'Nebula Drift',category:'Hyperdrive',engine:'canvas',preview:'#60c'},
  // Classic Game (10)
  {id:'pokemon_battle',label:'Pokémon Battle',category:'Classic Game',engine:'css',preview:'#fff'},
  {id:'zelda_fade',label:'Zelda Fade',category:'Classic Game',engine:'css',preview:'#000'},
  {id:'gm8_create_center',label:'GM8 Center',category:'Classic Game',engine:'css',preview:'#448'},
  {id:'gm8_create_left',label:'GM8 Left',category:'Classic Game',engine:'css',preview:'#448'},
  {id:'gm8_create_right',label:'GM8 Right',category:'Classic Game',engine:'css',preview:'#448'},
  {id:'gm8_create_top',label:'GM8 Top',category:'Classic Game',engine:'css',preview:'#448'},
  {id:'gm8_create_bottom',label:'GM8 Bottom',category:'Classic Game',engine:'css',preview:'#448'},
  {id:'gm8_rotate_left',label:'GM8 Rotate L',category:'Classic Game',engine:'css',preview:'#284'},
  {id:'gm8_rotate_right',label:'GM8 Rotate R',category:'Classic Game',engine:'css',preview:'#284'},
  {id:'scanline',label:'Scanline',category:'Classic Game',engine:'css',preview:'#222'},
  // GM8 Push (6)
  {id:'gm8_push_left',label:'GM8 Push L',category:'GM8 Push',engine:'css',preview:'#246'},
  {id:'gm8_push_right',label:'GM8 Push R',category:'GM8 Push',engine:'css',preview:'#246'},
  {id:'gm8_push_top',label:'GM8 Push T',category:'GM8 Push',engine:'css',preview:'#246'},
  {id:'gm8_push_bottom',label:'GM8 Push B',category:'GM8 Push',engine:'css',preview:'#246'},
  {id:'gm8_interlace_h',label:'Interlace H',category:'GM8 Push',engine:'css',preview:'#264'},
  {id:'gm8_interlace_v',label:'Interlace V',category:'GM8 Push',engine:'css',preview:'#264'},
  // Curtain/Panel (6)
  {id:'curtain',label:'Curtain',category:'Curtain',engine:'css',preview:'#822'},
  {id:'shutter',label:'Shutter',category:'Curtain',engine:'css',preview:'#282'},
  {id:'curtain_3panel',label:'3-Panel Curtain',category:'Curtain',engine:'canvas',preview:'#624'},
  {id:'curtain_wave',label:'Wave Curtain',category:'Curtain',engine:'canvas',preview:'#248'},
  {id:'page_turn_left',label:'Page Turn L',category:'Curtain',engine:'canvas',preview:'#864'},
  {id:'page_turn_right',label:'Page Turn R',category:'Curtain',engine:'canvas',preview:'#864'},
  // Wave/Distort (7)
  {id:'wave',label:'Wave',category:'Wave',engine:'css',preview:'#048'},
  {id:'noise',label:'Noise',category:'Wave',engine:'css',preview:'#444'},
  {id:'glitch',label:'Glitch',category:'Wave',engine:'css',preview:'#0f0'},
  {id:'tv_off',label:'TV Off',category:'Wave',engine:'css',preview:'#222'},
  {id:'wave_horizontal',label:'Wave Horizontal',category:'Wave',engine:'canvas',preview:'#06a'},
  {id:'wave_vertical',label:'Wave Vertical',category:'Wave',engine:'canvas',preview:'#06a'},
  {id:'water_ripple',label:'Water Ripple',category:'Wave',engine:'canvas',preview:'#08c'},
  // Rotate (5)
  {id:'rotate',label:'Rotate',category:'Rotate',engine:'css',preview:'#428'},
  {id:'rotate_cw_zoom',label:'Rotate+Zoom CW',category:'Rotate',engine:'canvas',preview:'#248'},
  {id:'rotate_ccw_zoom',label:'Rotate+Zoom CCW',category:'Rotate',engine:'canvas',preview:'#248'},
  {id:'rotate_quarter_cw',label:'Quarter CW',category:'Rotate',engine:'canvas',preview:'#462'},
  {id:'rotate_quarter_ccw',label:'Quarter CCW',category:'Rotate',engine:'canvas',preview:'#462'},
  // Shape (4)
  {id:'shape_diamond_out',label:'Diamond Out',category:'Shape',engine:'canvas',preview:'#c4c'},
  {id:'shape_hexagon',label:'Hexagon Wipe',category:'Shape',engine:'canvas',preview:'#4cc'},
  {id:'shape_cross',label:'Cross Wipe',category:'Shape',engine:'canvas',preview:'#cc4'},
  {id:'shape_triangle',label:'Triangle Wipe',category:'Shape',engine:'canvas',preview:'#c44'},
  // Parallax (2)
  {id:'parallax_scroll_left',label:'Parallax Left',category:'Parallax',engine:'canvas',preview:'#046'},
  {id:'parallax_scroll_right',label:'Parallax Right',category:'Parallax',engine:'canvas',preview:'#046'},
  // Zoom Scale (2)
  {id:'zoom_scale_in',label:'Scale In',category:'Zoom/Blur',engine:'css',preview:'#226'},
  {id:'zoom_scale_out',label:'Scale Out',category:'Zoom/Blur',engine:'css',preview:'#226'},
  // Bounce Elastic (3)
  {id:'bounce_elastic_left',label:'Elastic Left',category:'Slide/Push',engine:'css',preview:'#4a8'},
  {id:'bounce_elastic_right',label:'Elastic Right',category:'Slide/Push',engine:'css',preview:'#4a8'},
  {id:'bounce_elastic_up',label:'Elastic Up',category:'Slide/Push',engine:'css',preview:'#4a8'},
];

export const TRANSITION_TYPES = TRANSITION_CATALOG.map(t => t.id);

// ─── Canvas Engine ────────────────────────────────────────────────────────────
const CanvasTransition: React.FC<{type:string;duration:number;color:string;onDone:()=>void}> = ({type,duration,color,onDone}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);
  const t0  = useRef<number>(0);

  const rgb = (hex:string):[number,number,number] => {
    const n=parseInt(hex.replace('#','').padEnd(6,'0'),16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  };

  const draw = useCallback((cv:HTMLCanvasElement,t:number,col:string,type:string)=>{
    const ctx=cv.getContext('2d')!,W=cv.width,H=cv.height,cx=W/2,cy=H/2;
    const [r,g,b]=rgb(col);
    ctx.clearRect(0,0,W,H);

    const solid=(a=1)=>{ctx.fillStyle=`rgba(${r},${g},${b},${a})`;ctx.fillRect(0,0,W,H);};
    const spiral=(dir:1|-1,tIn:number,turns=3)=>{
      const mR=Math.hypot(W,H);
      ctx.fillStyle=`rgb(${r},${g},${b})`;
      ctx.beginPath();ctx.moveTo(cx,cy);
      for(let i=0;i<=400;i++){
        const a=dir*(i/400)*turns*Math.PI*2;
        const rd=(i/400)*mR*tIn;
        ctx.lineTo(cx+Math.cos(a)*rd,cy+Math.sin(a)*rd);
      }
      ctx.closePath();ctx.fill();
    };
    const stars=(tsp:number,sr:number,sg:number,sb:number)=>{
      ctx.fillStyle=`rgba(0,0,0,${Math.min(t*2,1)})`;ctx.fillRect(0,0,W,H);
      for(let s=0;s<200;s++){
        const sd=s*0.618033,ang=(sd*Math.PI*2)%(Math.PI*2);
        const d=((sd*7+s*0.1)%1)*Math.hypot(W,H)*0.5;
        const spd=tsp*tsp*3,len=d*spd*0.4;
        const x1=cx+Math.cos(ang)*d,y1=cy+Math.sin(ang)*d;
        const x2=cx+Math.cos(ang)*(d+len),y2=cy+Math.sin(ang)*(d+len);
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
        ctx.strokeStyle=`rgba(${sr},${sg},${sb},${Math.min(spd*2,1)})`;
        ctx.lineWidth=1+spd;ctx.stroke();
      }
    };
    const vortex=(dir:1|-1,tIn:number,vr=r,vg=g,vb=b)=>{
      const mR=Math.hypot(W,H)*0.7;
      for(let a=0;a<60;a++){
        const ba=(a/60)*Math.PI*2,rot=dir*tIn*Math.PI*3;
        const ang=ba+rot,rad=mR*tIn*(1-a/60/2),al=(1-a/60)*0.6;
        ctx.beginPath();ctx.moveTo(cx,cy);
        ctx.lineTo(cx+Math.cos(ang)*rad,cy+Math.sin(ang)*rad);
        ctx.strokeStyle=`rgba(${vr},${vg},${vb},${al})`;ctx.lineWidth=2;ctx.stroke();
      }
      const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,mR*tIn);
      grd.addColorStop(0,`rgba(${vr},${vg},${vb},${tIn})`);
      grd.addColorStop(1,`rgba(${vr},${vg},${vb},0)`);
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(cx,cy,mR*tIn,0,Math.PI*2);ctx.fill();
    };

    // Dispatch
    if(type==='swirl'||type==='spiral_in_cw'||type==='spiral_warp_fast'||type==='spiral_warp_slow')
      spiral(1,t,type==='spiral_warp_fast'?5:type==='spiral_warp_slow'?2:3);
    else if(type==='spiral_in_ccw') spiral(-1,t);
    else if(type==='spiral_out_cw') spiral(1,1-t);
    else if(type==='spiral_out_ccw') spiral(-1,1-t);
    else if(type==='spiral_double'){spiral(1,t);spiral(-1,t);}
    else if(type==='spiral_pinwheel'){
      for(let b2=0;b2<6;b2++){
        const ba=(b2/6)*Math.PI*2,mR=Math.hypot(W,H)*t;
        ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();ctx.moveTo(cx,cy);
        for(let i=0;i<=200;i++){const f=i/200;ctx.lineTo(cx+Math.cos(ba+f*Math.PI)*f*mR,cy+Math.sin(ba+f*Math.PI)*f*mR);}
        ctx.closePath();ctx.fill();
      }
    }
    else if(type==='swirl_zoom_in'){
      ctx.save();ctx.translate(cx,cy);ctx.rotate(t*Math.PI*4);ctx.scale(t*3,t*3);
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();
      solid(t);
    }
    else if(type==='swirl_zoom_out'){
      ctx.save();ctx.translate(cx,cy);ctx.rotate((1-t)*Math.PI*4);ctx.scale((1-t)*3,(1-t)*3);
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();
      solid(1-t);
    }
    else if(type==='swirl_color_bands'){
      for(let i=0;i<8;i++){
        const ang=(i/8)*Math.PI*2+t*Math.PI*4;
        ctx.beginPath();ctx.moveTo(cx,cy);
        ctx.arc(cx,cy,Math.hypot(W,H)*t,ang,ang+Math.PI/4);
        ctx.fillStyle=`rgba(${(r+i*30)%255},${(g+i*20)%255},${(b+i*25)%255},0.85)`;ctx.fill();
      }
    }
    else if(type==='swirl_psychedelic'){
      for(let i=0;i<12;i++){
        const f=i/12,sz=f*Math.hypot(W,H)*t,ang=f*Math.PI*6+t*Math.PI*2;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,sz,ang,ang+Math.PI/3);
        ctx.fillStyle=`rgba(${Math.abs(Math.sin(f*Math.PI+t))*255|0},${Math.abs(Math.cos(f*Math.PI*2+t))*255|0},${Math.abs(Math.sin(f*Math.PI*3+t))*255|0},0.7)`;ctx.fill();
      }
    }
    else if(type==='spiral_square'){
      for(let l=0;l<8;l++){
        ctx.save();ctx.translate(cx,cy);ctx.rotate(l/8*Math.PI*4+t*Math.PI);
        const s=Math.hypot(W,H)*t*(1-l/8);
        ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(-s/2,-s/2,s,s);ctx.restore();
      }
    }
    else if(type==='swirl_ripple'){
      for(let i=1;i<=16;i++){
        const p=Math.max(0,Math.min(1,(t*16-(i-1))/1));
        ctx.beginPath();ctx.arc(cx,cy,(i/16)*Math.hypot(W,H)*p,0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},${(1-i/16)*0.9})`;ctx.fill();
      }
    }
    else if(type==='zoom_blur_in'||type==='zoom_blur_out'){
      const ti=type==='zoom_blur_in'?t:1-t;
      for(let i=0;i<12;i++){
        ctx.save();ctx.translate(cx,cy);ctx.scale(1+i/12*ti*3,1+i/12*ti*3);
        ctx.fillStyle=`rgba(${r},${g},${b},${(1-i/12)*0.12*ti})`;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();
      }
      solid(ti);
    }
    else if(type==='radial_blur_cw'||type==='radial_blur_ccw'){
      const d=type.includes('ccw')?-1:1;
      for(let i=0;i<16;i++){
        ctx.save();ctx.translate(cx,cy);ctx.rotate(d*(i/16)*t*Math.PI);
        ctx.fillStyle=`rgba(${r},${g},${b},${(1-i/16)*0.12})`;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();
      }
      solid(t);
    }
    else if(type.startsWith('motion_blur_')){
      const di=type.replace('motion_blur_','');
      const dx=di==='left'?-1:di==='right'?1:0,dy=di==='up'?-1:di==='down'?1:0;
      for(let i=0;i<14;i++){
        const off=i/14*200*t;
        ctx.fillStyle=`rgba(${r},${g},${b},${(1-i/14)*0.1})`;ctx.fillRect(dx*off,dy*off,W,H);
      }
      solid(t);
    }
    else if(type==='zoom_punch'){
      const sc=1+Math.sin(t*Math.PI)*2;
      ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);
      ctx.fillStyle=`rgba(${r},${g},${b},${Math.sin(t*Math.PI)})`;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();
    }
    else if(type==='lens_flare_zoom'){
      const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.hypot(W,H)*t);
      grd.addColorStop(0,`rgba(255,255,200,${t})`);grd.addColorStop(0.3,`rgba(${r},${g},${b},${t*0.8})`);grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
      for(let s=0;s<8;s++){
        const a=(s/8)*Math.PI*2;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*W*t,cy+Math.sin(a)*H*t);
        ctx.strokeStyle=`rgba(255,255,200,${t*0.4})`;ctx.lineWidth=3;ctx.stroke();
      }
    }
    else if(type==='parallax_zoom'){
      for(let l=5;l>=0;l--){
        ctx.save();ctx.translate(cx,cy);ctx.scale(1+l*0.3*t,1+l*0.3*t);
        ctx.fillStyle=`rgba(${r},${g},${b},${l/5*t})`;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();
      }
    }
    else if(type.startsWith('vortex_')){
      const tI=type==='vortex_out'?(1-t):t,di=type.includes('ccw')?-1:1;
      let vr=r,vg=g,vb=b;
      if(type==='vortex_fire'){vr=255;vg=t*100|0;vb=0;}
      if(type==='vortex_ice'){vr=t*100|0;vg=200;vb=255;}
      if(type==='vortex_electric'){vr=255;vg=255;vb=0;}
      if(type==='vortex_galaxy'){vr=20;vg=0;vb=80;}
      if(type==='vortex_portal'){vr=0;vg=160;vb=255;}
      if(type==='vortex_implosion'){
        for(let i=20;i>=0;i--){
          const p=Math.max(0,t*20-(20-i)),rad=(i/20)*Math.hypot(W,H)*0.7*(1-p);
          if(rad<=0)continue;
          ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);
          ctx.strokeStyle=`rgba(${r},${g},${b},${p*0.8})`;ctx.lineWidth=4;ctx.stroke();
        }
        solid(t);
      } else if(type==='vortex_double'){
        [W*0.25,W*0.75].forEach((ox,v)=>{
          const d2=v===0?1:-1;
          for(let a=0;a<40;a++){
            const ang=(a/40)*Math.PI*2+d2*t*Math.PI*3,rad=Math.hypot(W,H)*0.4*t;
            ctx.beginPath();ctx.moveTo(ox,cy);ctx.lineTo(ox+Math.cos(ang)*rad,cy+Math.sin(ang)*rad);
            ctx.strokeStyle=`rgba(${r},${g},${b},${(1-a/40)*0.5})`;ctx.lineWidth=2;ctx.stroke();
          }
        });solid(t*0.5);
      } else {vortex(di,tI,vr,vg,vb);}
    }
    else if(type.startsWith('hyperdrive')||type.startsWith('warp_')){
      let sr=255,sg=255,sb=255;
      if(type.includes('blue')||type==='warp_rings'){sr=100;sg=150;sb=255;}
      if(type.includes('red')||type==='warp_supernova'){sr=255;sg=80;sb=80;}
      if(type.includes('gold')||type==='warp_light_speed'){sr=255;sg=220;sb=100;}
      if(type.includes('green')){sr=100;sg=255;sb=120;}
      if(type==='warp_nebula'){sr=180;sg=80;sb=220;}
      if(type==='warp_black_hole'){sr=0;sg=0;sb=0;}
      stars(t,sr,sg,sb);
      if(type==='warp_tunnel'||type==='warp_rings'){
        for(let i=0;i<8;i++){
          const ph=(t*3+i/8)%1,rad=ph*Math.hypot(W,H)*0.6;
          ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);
          ctx.strokeStyle=`rgba(${sr},${sg},${sb},${(1-ph)*0.6})`;ctx.lineWidth=2;ctx.stroke();
        }
      }
      if(type==='warp_black_hole'){
        const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.hypot(W,H)*0.5*t);
        grd.addColorStop(0,'rgba(0,0,0,1)');grd.addColorStop(0.5,`rgba(${r},${g},${b},0.3)`);grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
      }
      if(type==='warp_supernova'&&t>0.5){
        const bl=(t-0.5)*2,grd=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.hypot(W,H)*bl);
        grd.addColorStop(0,`rgba(255,200,100,${1-bl})`);grd.addColorStop(0.5,`rgba(255,80,0,${(1-bl)*0.6})`);grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
      }
      if(t>0.8)solid((t-0.8)*5);
    }
    else if(type==='radial_wipe_cw'||type==='radial_wipe_ccw'){
      const d=type.includes('ccw')?-1:1,sa=-Math.PI/2;
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,Math.hypot(W,H),sa,sa+d*t*Math.PI*2,type.includes('ccw'));ctx.closePath();ctx.fill();
    }
    else if(type==='starburst_wipe'){
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();ctx.moveTo(cx,cy);
      for(let i=0;i<=24;i++){
        const a=(i/24)*Math.PI*2-Math.PI/2,outer=i%2===0;
        ctx.lineTo(cx+Math.cos(a)*Math.hypot(W,H)*t*(outer?1:0.4),cy+Math.sin(a)*Math.hypot(W,H)*t*(outer?1:0.4));
      }
      ctx.closePath();ctx.fill();
    }
    else if(type==='paint_brush_wipe'){
      ctx.fillStyle=`rgb(${r},${g},${b})`;
      for(let i=0;i<20;i++){
        const p=Math.max(0,Math.min(1,t*20-i)),y=(i/20)*H,wb=Math.sin(i)*15;
        ctx.beginPath();ctx.ellipse(W*p/2+wb,y+H/20/2,W*p/2+20,H/20*0.7,Math.sin(i)*0.3,0,Math.PI*2);ctx.fill();
      }
    }
    else if(type==='grid_explode'||type==='grid_implode'){
      const cols=8,rows=6,cW=W/cols,rH=H/rows;
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        const d=Math.hypot(col-cols/2,row-rows/2)/Math.hypot(cols/2,rows/2);
        const del=type==='grid_explode'?d:1-d,p=Math.max(0,Math.min(1,(t-del*0.5)/0.5));
        if(p<=0)continue;
        const ox=type==='grid_explode'?(col-cols/2)*p*20:-(col-cols/2)*(1-p)*20;
        const oy=type==='grid_explode'?(row-rows/2)*p*20:-(row-rows/2)*(1-p)*20;
        ctx.fillStyle=`rgba(${r},${g},${b},${p})`;ctx.fillRect(col*cW+ox,row*rH+oy,cW-1,rH-1);
      }
    }
    else if(type==='pixel_dissolve'){
      const ps=8,cols=Math.ceil(W/ps),rows=Math.ceil(H/ps),total=cols*rows;
      const filled=Math.floor(t*total);
      let lcg=12345;const visited=new Set<number>();let count=0;
      while(count<filled){
        lcg=(lcg*1664525+1013904223)&0xFFFFFFFF;
        const idx=Math.abs(lcg)%total;
        if(!visited.has(idx)){visited.add(idx);const c=idx%cols,ro=Math.floor(idx/cols);
          ctx.fillStyle=`rgba(${r},${g},${b},1)`;ctx.fillRect(c*ps,ro*ps,ps,ps);count++;}
      }
    }
    else if(type==='wave_horizontal'){
      const amp=30*(1-t),freq=0.03,ph=t*Math.PI*4;
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();ctx.moveTo(0,H);
      for(let x=0;x<=W;x+=2)ctx.lineTo(x,H*(1-t)+Math.sin(x*freq+ph)*amp);
      ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
    }
    else if(type==='wave_vertical'){
      const amp=30*(1-t),freq=0.03,ph=t*Math.PI*4;
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();ctx.moveTo(W,0);
      for(let y=0;y<=H;y+=2)ctx.lineTo(W*(1-t)+Math.sin(y*freq+ph)*amp,y);
      ctx.lineTo(W,H);ctx.lineTo(W,0);ctx.closePath();ctx.fill();
    }
    else if(type==='water_ripple'){
      for(let i=0;i<12;i++){
        const ph=(t+i/12)%1,rad=ph*Math.hypot(W,H)*0.7;
        ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);
        ctx.strokeStyle=`rgba(${r},${g},${b},${(1-ph)*0.5})`;ctx.lineWidth=3;ctx.stroke();
      }
      ctx.fillStyle=`rgba(${r},${g},${b},${t})`;ctx.beginPath();ctx.arc(cx,cy,Math.hypot(W,H)*t*0.5,0,Math.PI*2);ctx.fill();
    }
    else if(type==='flash_strobe'){
      const on=((t*6)%1)<0.5;
      solid(on?t:t*0.3);
      if(on){ctx.fillStyle=`rgba(255,255,255,${t*0.5})`;ctx.fillRect(0,0,W,H);}
    }
    else if(type==='flash_rgb'){
      const h=t*360*3;
      ctx.fillStyle=`rgba(${Math.abs(Math.sin(h*Math.PI/180))*255|0},${Math.abs(Math.sin((h+120)*Math.PI/180))*255|0},${Math.abs(Math.sin((h+240)*Math.PI/180))*255|0},${t})`;
      ctx.fillRect(0,0,W,H);
    }
    else if(type==='flash_scanline'){
      const off=Math.floor(t*H*2)%(8);
      for(let y=-4;y<H;y+=8){ctx.fillStyle=`rgba(${r},${g},${b},${t*0.9})`;ctx.fillRect(0,y+off,W,4);}
      solid(t*0.3);
    }
    else if(type==='flash_pixel_scatter'){
      for(let p=0;p<2000*t;p++){
        const sd=p*0.618033;
        ctx.fillStyle=`rgba(${r},${g},${b},${(sd%1)*t})`;
        ctx.fillRect((sd*7777)%W,(sd*5555)%H,2+(sd*4)%4,2+(sd*4)%4);
      }
    }
    else if(type==='flash_vhs'){
      solid(t*0.7);
      for(let i=0;i<8;i++){
        const ly=((t*H*3+i*67)%(H*1.5)),sh=Math.sin(t*10+i)*20;
        ctx.fillStyle=`rgba(255,255,255,${0.3*t})`;ctx.fillRect(sh,ly,W,2);
        ctx.fillStyle=`rgba(0,255,255,${0.2*t})`;ctx.fillRect(sh-3,ly,W,1);
        ctx.fillStyle=`rgba(255,0,255,${0.2*t})`;ctx.fillRect(sh+3,ly,W,1);
      }
    }
    else if(type==='flash_thunder'){
      const on=Math.sin(t*Math.PI*8)>0.3;
      if(on){
        ctx.fillStyle=`rgba(180,180,255,${t*0.9})`;ctx.fillRect(0,0,W,H);
        ctx.strokeStyle=`rgba(255,255,255,${t})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,0);
        for(let i=1;i<=8;i++)ctx.lineTo(cx+Math.sin(t*13+i)*80,i/8*H);
        ctx.stroke();
      }else solid(t*0.5);
    }
    else if(type==='flash_fire'){
      for(let x=0;x<W;x+=4){
        const h2=(Math.sin(x*0.05+t*8)*0.5+0.5)*H*t;
        ctx.fillStyle=`rgba(${h2/H*255|0},${(h2/H*(1-h2/H)*150)|0},0,${t})`;ctx.fillRect(x,H-h2,4,h2);
      }
    }
    else if(type==='flash_matrix'){
      ctx.fillStyle='rgba(0,0,0,0.1)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle=`rgba(0,255,0,${t})`;ctx.font='10px monospace';
      for(let c=0;c<W/12;c++)ctx.fillText(String.fromCharCode(0x30A0+c*37%96),c*12,(t*H*3+c*67)%(H*1.5));
    }
    else if(type==='fade_horizontal'){
      const grd=ctx.createLinearGradient(0,0,W,0);
      grd.addColorStop(0,`rgba(${r},${g},${b},${t})`);grd.addColorStop(t,`rgba(${r},${g},${b},${t})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
    }
    else if(type==='fade_vertical'){
      const grd=ctx.createLinearGradient(0,0,0,H);
      grd.addColorStop(0,`rgba(${r},${g},${b},${t})`);grd.addColorStop(t,`rgba(${r},${g},${b},${t})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
    }
    else if(type==='fade_radial'){
      const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.hypot(W,H)*0.5);
      grd.addColorStop(0,`rgba(${r},${g},${b},${t})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
    }
    else if(type==='fade_diagonal_tl'||type==='fade_diagonal_tr'){
      const grd=ctx.createLinearGradient(type==='fade_diagonal_tl'?0:W,0,type==='fade_diagonal_tl'?W:0,H);
      grd.addColorStop(0,`rgba(${r},${g},${b},${t})`);grd.addColorStop(t*0.8,`rgba(${r},${g},${b},${t})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
    }
    else if(type==='flash_retro_flicker'){
      const fl=Math.abs(Math.sin(t*Math.PI*20))*t;
      ctx.fillStyle=`rgba(255,200,50,${fl})`;ctx.fillRect(0,0,W,H);
      for(let y=0;y<H;y+=4){ctx.fillStyle=`rgba(0,0,0,${0.3*fl})`;ctx.fillRect(0,y,W,2);}
    }
    else if(type==='curtain_3panel'){
      for(let i=0;i<3;i++){
        const p=Math.max(0,Math.min(1,(t-i/3*0.3)/(1-i/3*0.3)));
        ctx.fillStyle=`rgba(${r},${g},${b},1)`;ctx.fillRect(i*(W/3),H*(1-p),W/3,H*p);
      }
    }
    else if(type==='curtain_wave'){
      for(let i=0;i<16;i++){
        const dl=(Math.sin(i*0.5)*0.5+0.5)*0.3,p=Math.max(0,Math.min(1,(t-dl)/(1-dl)));
        ctx.fillStyle=`rgba(${r},${g},${b},1)`;ctx.fillRect(i*(W/16),H*(1-p),W/16,H*p);
      }
    }
    else if(type==='page_turn_left'||type==='page_turn_right'){
      const dir=type==='page_turn_right'?1:-1,fold=t*W;
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();
      if(dir>0){ctx.moveTo(fold,0);ctx.lineTo(W,0);ctx.lineTo(W,H);ctx.lineTo(fold,H);}
      else{ctx.moveTo(0,0);ctx.lineTo(W-fold,0);ctx.lineTo(W-fold,H);ctx.lineTo(0,H);}
      ctx.closePath();ctx.fill();
      const sx=dir>0?fold:W-fold,grd=ctx.createLinearGradient(sx-20,0,sx+20,0);
      grd.addColorStop(0,'rgba(0,0,0,0)');grd.addColorStop(0.5,'rgba(0,0,0,0.3)');grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grd;ctx.fillRect(sx-20,0,40,H);
    }
    else if(type==='rotate_cw_zoom'||type==='rotate_ccw_zoom'){
      const d=type.includes('ccw')?-1:1;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(d*t*Math.PI*2);ctx.scale(t,t);
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();
    }
    else if(type==='rotate_quarter_cw'||type==='rotate_quarter_ccw'){
      const d=type.includes('ccw')?-1:1;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(d*t*Math.PI/2);ctx.scale(0.5+t*0.5,0.5+t*0.5);
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(-W,-H,W*2,H*2);ctx.restore();
    }
    else if(type==='shape_diamond_out'){
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();
      const s=Math.hypot(W,H)*t;
      ctx.moveTo(cx,cy-s);ctx.lineTo(cx+s,cy);ctx.lineTo(cx,cy+s);ctx.lineTo(cx-s,cy);ctx.closePath();ctx.fill();
    }
    else if(type==='shape_hexagon'){
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();
      const s=Math.hypot(W,H)*t;
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2-Math.PI/6;ctx.lineTo(cx+Math.cos(a)*s,cy+Math.sin(a)*s);}
      ctx.closePath();ctx.fill();
    }
    else if(type==='shape_cross'){
      ctx.fillStyle=`rgb(${r},${g},${b})`;
      const arm=Math.hypot(W,H)*t*0.5,thick=arm*0.4;
      ctx.fillRect(cx-thick/2,cy-arm,thick,arm*2);
      ctx.fillRect(cx-arm,cy-thick/2,arm*2,thick);
    }
    else if(type==='shape_triangle'){
      ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.beginPath();
      const s=Math.hypot(W,H)*t;
      ctx.moveTo(cx,cy-s);ctx.lineTo(cx+s*0.866,cy+s*0.5);ctx.lineTo(cx-s*0.866,cy+s*0.5);ctx.closePath();ctx.fill();
    }
    else if(type==='parallax_scroll_left'||type==='parallax_scroll_right'){
      const d=type==='parallax_scroll_right'?1:-1;
      for(let l=0;l<5;l++){
        const speed=1+l*0.5,off=d*t*W*speed;
        ctx.fillStyle=`rgba(${r},${g},${b},${(l+1)/5})`;ctx.fillRect(off,0,W,H);
        ctx.fillRect(off-d*W,0,W,H);
      }
    }
    else { solid(t); }
  },[]);

  useEffect(()=>{
    const cv=ref.current; if(!cv)return;
    cv.width=cv.offsetWidth||window.innerWidth;cv.height=cv.offsetHeight||window.innerHeight;
    t0.current=performance.now();
    const ei=(t:number)=>t<0.5?2*t*t:-1+(4-2*t)*t;
    const loop=(now:number)=>{
      const raw=Math.min((now-t0.current)/duration,1);
      draw(cv,ei(raw),color,type);
      if(raw<1)raf.current=requestAnimationFrame(loop);
      else{draw(cv,1,color,type);onDone();}
    };
    raf.current=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(raf.current);
  },[type,duration,color,draw,onDone]);

  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:10000,pointerEvents:'none'}}/>;
};

// ─── CSS Engine ───────────────────────────────────────────────────────────────
const CSSTransition: React.FC<{type:string;duration:number;color:string;easing:string;isActive:boolean;onComplete?:()=>void}> = ({type,duration,color,easing,isActive,onComplete}) => {
  const [active, setActive] = React.useState(false);

  useEffect(() => {
    if (isActive) {
      // Need a tiny delay for browser to apply "from" state before transitioning to "to" state
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setActive(true));
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setActive(false);
    }
  }, [isActive]);

  const s=duration/1000,e=easing,onEnd=()=>isActive&&onComplete?.();
  const base:React.CSSProperties={position:'absolute',inset:0,zIndex:10000,pointerEvents:'none',backgroundColor:color};
  const anim=(from:React.CSSProperties,to:React.CSSProperties)=>({...base,...(active?to:from),transition:`all ${s}s ${e}`});
  const kf=(name:string,frames:string,extra='')=>(
    <div style={{...base,animation:active?`${name} ${s}s ${e} forwards`:'none'}} onAnimationEnd={onEnd}>
      <style>{`@keyframes ${name}{${frames}}`+extra}</style>
    </div>
  );
  switch(type){
    case 'fade': return <div style={anim({opacity:0},{opacity:1})} onTransitionEnd={onEnd}/>;
    case 'fade_white': return <div style={{...anim({opacity:0},{opacity:1}),backgroundColor:'#fff'}} onTransitionEnd={onEnd}/>;
    case 'flash_white': return kf('fw','0%{opacity:0}30%{opacity:1}70%{opacity:1}100%{opacity:0}');
    case 'flash_color': return kf('fc','0%{opacity:0}30%{opacity:1}70%{opacity:1}100%{opacity:0}');
    case 'seamless_crossfade': return <div style={anim({opacity:0},{opacity:0.95})} onTransitionEnd={onEnd}/>;
    case 'slide_left': return <div style={anim({transform:'translateX(100%)'},{transform:'translateX(0)'})} onTransitionEnd={onEnd}/>;
    case 'slide_right': return <div style={anim({transform:'translateX(-100%)'},{transform:'translateX(0)'})} onTransitionEnd={onEnd}/>;
    case 'slide_up': return <div style={anim({transform:'translateY(100%)'},{transform:'translateY(0)'})} onTransitionEnd={onEnd}/>;
    case 'slide_down': return <div style={anim({transform:'translateY(-100%)'},{transform:'translateY(0)'})} onTransitionEnd={onEnd}/>;
    case 'slide_bounce_left': return kf('sbl','0%{transform:translateX(100%)}60%{transform:translateX(-5%)}80%{transform:translateX(3%)}100%{transform:translateX(0)}');
    case 'slide_bounce_right': return kf('sbr','0%{transform:translateX(-100%)}60%{transform:translateX(5%)}80%{transform:translateX(-3%)}100%{transform:translateX(0)}');
    case 'slide_bounce_up': return kf('sbu','0%{transform:translateY(100%)}60%{transform:translateY(-5%)}80%{transform:translateY(3%)}100%{transform:translateY(0)}');
    case 'slide_bounce_down': return kf('sbd','0%{transform:translateY(-100%)}60%{transform:translateY(5%)}80%{transform:translateY(-3%)}100%{transform:translateY(0)}');
    case 'megaman_slide': return <div style={anim({transform:'translateX(-100%)'},{transform:'translateX(0)'})} onTransitionEnd={onEnd}/>;
    case 'bounce_elastic_left': return kf('bel','0%{transform:translateX(120%)}50%{transform:translateX(-8%)}75%{transform:translateX(5%)}90%{transform:translateX(-2%)}100%{transform:translateX(0)}');
    case 'bounce_elastic_right': return kf('ber','0%{transform:translateX(-120%)}50%{transform:translateX(8%)}75%{transform:translateX(-5%)}90%{transform:translateX(2%)}100%{transform:translateX(0)}');
    case 'bounce_elastic_up': return kf('beu','0%{transform:translateY(120%)}50%{transform:translateY(-8%)}75%{transform:translateY(5%)}90%{transform:translateY(-2%)}100%{transform:translateY(0)}');
    case 'circle_wipe': return <div style={anim({clipPath:'circle(0% at 50% 50%)'},{clipPath:'circle(150% at 50% 50%)'})} onTransitionEnd={onEnd}/>;
    case 'diamond_wipe': return <div style={anim({clipPath:'polygon(50% 50%,50% 50%,50% 50%,50% 50%)'},{clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)'})} onTransitionEnd={onEnd}/>;
    case 'star_wipe': return <div style={anim({clipPath:'polygon(50% 50%,50% 50%,50% 50%,50% 50%,50% 50%,50% 50%,50% 50%,50% 50%,50% 50%,50% 50%)'},{clipPath:'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'})} onTransitionEnd={onEnd}/>;
    case 'heart_wipe': return <div style={anim({clipPath:'circle(0% at 50% 50%)'},{clipPath:'circle(150% at 50% 50%)'})} onTransitionEnd={onEnd}/>;
    case 'diagonal_wipe': return <div style={anim({clipPath:'polygon(0% 0%,0% 0%,0% 100%)'},{clipPath:'polygon(0% 0%,200% 0%,0% 200%)'})} onTransitionEnd={onEnd}/>;
    case 'mario_iris': return kf('mi','0%{clip-path:circle(0% at 50% 50%)}80%{clip-path:circle(120% at 50% 50%)}100%{clip-path:circle(100% at 50% 50%)}');
    case 'zoom_in': return <div style={anim({transform:'scale(0)',opacity:0},{transform:'scale(1)',opacity:1})} onTransitionEnd={onEnd}/>;
    case 'zoom_out': return <div style={anim({transform:'scale(2)',opacity:0},{transform:'scale(1)',opacity:1})} onTransitionEnd={onEnd}/>;
    case 'zoom_scale_in': return kf('zsi','0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}');
    case 'zoom_scale_out': return kf('zso','0%{transform:scale(1.5);opacity:0}100%{transform:scale(1);opacity:1}');
    case 'rotate': return <div style={anim({transform:'rotate(-180deg) scale(0)',opacity:0},{transform:'rotate(0) scale(1)',opacity:1})} onTransitionEnd={onEnd}/>;
    case 'ff_swirl': return <div style={anim({transform:'rotate(0) scale(0)',opacity:0},{transform:'rotate(1080deg) scale(1.5)',opacity:1})} onTransitionEnd={onEnd}/>;
    case 'scanline': return kf('scl','0%{opacity:0}100%{opacity:1}',`@keyframes scl{}`);
    case 'glitch': return kf('gl','0%{opacity:0;transform:translate(0)}20%{opacity:1;transform:translate(-5px,3px)}40%{opacity:0.8;transform:translate(5px,-2px)}60%{opacity:1;transform:translate(-3px,1px)}100%{opacity:1;transform:translate(0)}');
    case 'noise': return kf('ns','0%{opacity:0}100%{opacity:1}');
    case 'wave': return kf('wv','0%{opacity:0;transform:skewX(20deg)}50%{opacity:1;transform:skewX(-10deg)}100%{opacity:1;transform:skewX(0)}');
    case 'mosaic': return kf('mo','0%{opacity:0;filter:blur(20px)}100%{opacity:1;filter:blur(0)}');
    case 'pixelate': return kf('px','0%{opacity:0;filter:blur(30px)contrast(200%)}100%{opacity:1;filter:blur(0)contrast(100%)}');
    case 'tv_off': return kf('tv','0%{transform:scaleY(0.005)scaleX(0)}50%{transform:scaleY(0.005)scaleX(1)}100%{transform:scaleY(1)scaleX(1)}');
    case 'pokemon_battle': return kf('pk',`0%,40%,80%{background:#fff;opacity:1}20%,60%{opacity:0}100%{background:${color};opacity:1}`);
    case 'zelda_fade': return <div style={anim({opacity:0},{opacity:1})} onTransitionEnd={onEnd}/>;
    case 'gm8_create_center': return <div style={anim({transform:'scale(0)',opacity:0},{transform:'scale(1)',opacity:1})} onTransitionEnd={onEnd}/>;
    case 'gm8_create_left': return <div style={{...base,transform:active?'scaleX(1)':'scaleX(0)',transformOrigin:'left center',transition:`transform ${s}s ${e}`}} onTransitionEnd={onEnd}/>;
    case 'gm8_create_right': return <div style={{...base,transform:active?'scaleX(1)':'scaleX(0)',transformOrigin:'right center',transition:`transform ${s}s ${e}`}} onTransitionEnd={onEnd}/>;
    case 'gm8_create_top': return <div style={{...base,transform:active?'scaleY(1)':'scaleY(0)',transformOrigin:'center top',transition:`transform ${s}s ${e}`}} onTransitionEnd={onEnd}/>;
    case 'gm8_create_bottom': return <div style={{...base,transform:active?'scaleY(1)':'scaleY(0)',transformOrigin:'center bottom',transition:`transform ${s}s ${e}`}} onTransitionEnd={onEnd}/>;
    case 'gm8_rotate_left': return <div style={anim({transform:'rotate(-180deg)scale(0)',opacity:0},{transform:'rotate(0)scale(1)',opacity:1})} onTransitionEnd={onEnd}/>;
    case 'gm8_rotate_right': return <div style={anim({transform:'rotate(180deg)scale(0)',opacity:0},{transform:'rotate(0)scale(1)',opacity:1})} onTransitionEnd={onEnd}/>;
    case 'gm8_push_left': return <div style={anim({transform:'translateX(100%)'},{transform:'translateX(0)'})} onTransitionEnd={onEnd}/>;
    case 'gm8_push_right': return <div style={anim({transform:'translateX(-100%)'},{transform:'translateX(0)'})} onTransitionEnd={onEnd}/>;
    case 'gm8_push_top': return <div style={anim({transform:'translateY(100%)'},{transform:'translateY(0)'})} onTransitionEnd={onEnd}/>;
    case 'gm8_push_bottom': return <div style={anim({transform:'translateY(-100%)'},{transform:'translateY(0)'})} onTransitionEnd={onEnd}/>;
    case 'gm8_interlace_h': return (
      <div style={{...base,backgroundColor:'transparent',display:'flex',flexDirection:'column'}}>
        {Array.from({length:16}).map((_,i)=><div key={i} style={{flex:1,backgroundColor:color,transform:active?'scaleX(1)':'scaleX(0)',transformOrigin:i%2===0?'left center':'right center',transition:`transform ${s*0.7}s ${e} ${(i%2)*0.1}s`}} onTransitionEnd={i===15?onEnd:undefined}/>)}
      </div>
    );
    case 'gm8_interlace_v': return (
      <div style={{...base,backgroundColor:'transparent',display:'flex'}}>
        {Array.from({length:16}).map((_,i)=><div key={i} style={{flex:1,height:'100%',backgroundColor:color,transform:active?'scaleY(1)':'scaleY(0)',transformOrigin:i%2===0?'center top':'center bottom',transition:`transform ${s*0.7}s ${e} ${(i%2)*0.1}s`}} onTransitionEnd={i===15?onEnd:undefined}/>)}
      </div>
    );
    case 'curtain': return (
      <div style={{...base,backgroundColor:'transparent',display:'flex'}}>
        <div style={{width:'50%',height:'100%',backgroundColor:color,transform:active?'translateX(0)':'translateX(-100%)',transition:`transform ${s/2}s ${e}`}}/>
        <div style={{width:'50%',height:'100%',backgroundColor:color,transform:active?'translateX(0)':'translateX(100%)',transition:`transform ${s/2}s ${e}`}} onTransitionEnd={onEnd}/>
      </div>
    );
    case 'shutter': return (
      <div style={{...base,backgroundColor:'transparent',display:'flex',flexDirection:'column'}}>
        <div style={{width:'100%',height:'50%',backgroundColor:color,transform:active?'translateY(0)':'translateY(-100%)',transition:`transform ${s/2}s ${e}`}}/>
        <div style={{width:'100%',height:'50%',backgroundColor:color,transform:active?'translateY(0)':'translateY(100%)',transition:`transform ${s/2}s ${e}`}} onTransitionEnd={onEnd}/>
      </div>
    );
    case 'checkerboard': {
      const N=8;
      return (
        <div style={{...base,backgroundColor:'transparent',display:'grid',gridTemplateColumns:`repeat(${N},1fr)`,gridTemplateRows:`repeat(${N},1fr)`}}>
          {Array.from({length:N*N}).map((_,i)=>(
            <div key={i} style={{backgroundColor:color,opacity:active?1:0,transform:active?'scale(1)':'scale(0)',transition:`opacity 0.3s ${e} ${((i%N)+(Math.floor(i/N)))*0.04}s,transform 0.3s ${e} ${((i%N)+(Math.floor(i/N)))*0.04}s`}} onTransitionEnd={i===N*N-1?onEnd:undefined}/>
          ))}
        </div>
      );
    }
    default: return <div style={anim({opacity:0},{opacity:1})} onTransitionEnd={onEnd}/>;
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TransitionEffect: React.FC<TransitionEffectProps> = ({settings,isActive,onComplete}) => {
  if(!isActive) return null;
  const {type,duration,color,easing} = settings;
  const def = TRANSITION_CATALOG.find(t=>t.id===type);
  if(def?.engine==='canvas')
    return <CanvasTransition type={type} duration={duration} color={color} onDone={()=>onComplete?.()}/>;
  return <CSSTransition type={type} duration={duration} color={color} easing={easing} isActive={isActive} onComplete={onComplete}/>;
};

export default TransitionEffect;
