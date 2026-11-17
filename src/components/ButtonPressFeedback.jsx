import {useEffect} from 'react';
import {installButtonPressFeedback} from '../lib/button-press';
export default function ButtonPressFeedback({settings}) {
  const key = JSON.stringify(settings || {});
  useEffect(()=>installButtonPressFeedback(document,JSON.parse(key)),[key]);
  return null;
}
