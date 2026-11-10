import { trackingStyle } from '../lib/order-tracking-copy';
export default function OrderTrackingSearch({copy,styles={},mode,code,phone,busy,error,onMode,onCode,onPhone,onSubmit,preview=false}){
 const css=key=>trackingStyle(styles,key);
 const Form=preview?'div':'form';
 return <div className="order-tracking-search-layout"><div className="order-tracking-panel">

  <Form className="order-tracking-search-form" onSubmit={preview?undefined:onSubmit} aria-label="Tra cứu đơn hàng" aria-busy={busy}>
   <div className="order-tracking-modes" role="group" aria-label="Tra cứu theo">{[['phone',copy.phoneTab],['code',copy.codeTab]].map(([key,label])=><button key={key} type="button" aria-pressed={mode===key} onClick={()=>onMode(key)}><strong style={css('modeTitle')}>{label}</strong></button>)}</div>
   <p className="order-tracking-mode-hint" style={css('modeBody')}>{mode==='phone'?copy.phoneHint:copy.codeHint}</p>
   {mode==='code'?<label htmlFor={preview?'preview-lookup-code':'lookup-code'} style={css('label')}>{copy.codeLabel}<input id={preview?'preview-lookup-code':'lookup-code'} value={code} onChange={onCode} style={css('input')} required={!preview} minLength={4} maxLength={40} autoCapitalize="characters" autoCorrect="off" spellCheck={false} placeholder={copy.codePlaceholder}/></label>:<label htmlFor={preview?'preview-lookup-phone':'lookup-phone'} style={css('label')}>{copy.phoneLabel}<input id={preview?'preview-lookup-phone':'lookup-phone'} type="tel" inputMode="tel" value={phone} onChange={onPhone} style={css('input')} required={!preview} minLength={7} maxLength={32} autoComplete={preview?'off':'tel'} placeholder={copy.phonePlaceholder}/></label>}
   <button className="order-tracking-submit" aria-busy={busy} type={preview?"button":"submit"} disabled={busy} style={css('button')}><span>{busy?copy.loadingLabel:copy.submitLabel}</span><span aria-hidden="true">→</span></button>
  </Form>
  {error&&<p className="order-tracking-error" role="alert">{error}</p>}

 </div><details className="order-tracking-guide"><summary style={css('guideTitle')}>{copy.guideTitle}</summary><ol>{[['guideFirstTitle','guideFirstBody'],['guideSecondTitle','guideSecondBody'],['guideThirdTitle','guideThirdBody']].map(([title,body],index)=><li key={title}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div><strong style={css('guideBody')}>{copy[title]}</strong><p style={css('guideBody')}>{copy[body]}</p></div></li>)}</ol><div className="order-tracking-guide-support"><p style={css('help')}>{copy.scopeNote}</p><a href={preview?undefined:'/#contact'} style={css('help')}>{copy.contactLabel}<svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12 12 4M4 4h8v8"/></svg></a></div></details></div>;
}
