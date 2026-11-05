import {useEffect} from 'react';
import {Platform} from 'react-native';

const styles = `
  :is(button, [role="button"], [role="tab"], [role="checkbox"], a[href]) {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  :is(button, [role="button"], [role="tab"], [role="checkbox"], a[href]):active:not(:disabled):not([aria-disabled="true"]):not(:has(:active)) {
    opacity: 0.78;
  }
  @media (prefers-reduced-motion: no-preference) {
    :is(button, [role="button"], [role="tab"], [role="checkbox"], a[href]) {
      transition: opacity 110ms ease-out, background-color 140ms ease-out;
    }

  }
`;

export function WebInteractionStyles(){
  useEffect(()=>{
    if(Platform.OS!=='web')return;
    const element=document.createElement('style');
    element.textContent=styles;
    document.head.appendChild(element);
    return ()=>element.remove();
  },[]);
  return null;
}
