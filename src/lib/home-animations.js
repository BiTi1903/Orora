import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export function startHomeAnimations(root){
 const motion=gsap.matchMedia();
 motion.add('(prefers-reduced-motion: no-preference) and (min-width: 769px) and (pointer: fine)',()=>{
  const context=gsap.context(()=>{
   const below=selector=>Array.from(root.querySelectorAll(selector)).filter(node=>node.getBoundingClientRect().top>=window.innerHeight);
   // Never hide content that is already visible when this deferred module loads.
   if(root.querySelector('.hero-media img')&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    gsap.to('.hero-media img',{objectPosition:'50% 60%',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
   }
   below('.collection').forEach(section=>{
    const label=section.querySelector('.collection-label'),titles=section.querySelectorAll('.collection-title-line');
    const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:'top 82%',end:'top 45%',scrub:1}});
    if(label)timeline.from(label,{x:-24,opacity:0});
    if(titles.length)timeline.from(titles,{y:40,opacity:0,stagger:.12},label?'-=0.15':0);
   });
   below('.gallery-item').forEach(node=>{
    gsap.from(node,{y:42,opacity:0,scrollTrigger:{trigger:node,start:'top 92%',end:'top 65%',scrub:1}});
    const image=node.querySelector('img');
    if(image)gsap.fromTo(image,{scale:1.06},{scale:1,scrollTrigger:{trigger:node,start:'top 92%',end:'top 50%',scrub:1}});
   });
   below('.collection-bottom').forEach(node=>gsap.from(node,{y:24,opacity:0,scrollTrigger:{trigger:node,start:'top 92%',end:'top 68%',scrub:1}}));
   ScrollTrigger.refresh();
  },root);
  return()=>context.revert();
 });
 return()=>motion.revert();
}
