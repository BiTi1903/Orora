import { Link } from "react-router-dom";
import ButtonIcon from "./ButtonIcon";
import "../styles/order-tracking.css";
import { trackingStyle } from "../lib/order-tracking-copy";

const PhoneIcon = () => (
  <svg className="tracking-mode-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="tracking-mode-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </svg>
);

export default function OrderTrackingSearch({ copy, styles = {}, mode, code, phone, busy, error, onMode, onCode, onPhone, onSubmit, preview = false }) {
  const css = (key) => trackingStyle(styles, key);
  const Form = preview ? "div" : "form";
  return (
    <div className="order-tracking-search-layout">
      <div className="order-tracking-panel">
        <div className="tracking-panel-head">
          <h2 className="tracking-search-title" style={css("formTitle")}>{copy.formTitle}</h2>
        </div>

        <Form className="order-tracking-search-form" data-mode={mode} onSubmit={preview ? undefined : onSubmit} aria-label="Tra cứu đơn hàng" aria-busy={busy}>
          <div className="order-tracking-modes" role="group" aria-label="Tra cứu theo">
            {[
              ["phone", copy.phoneTab, PhoneIcon],
              ["code", copy.codeTab, ReceiptIcon],
            ].map(([key, label, Icon]) => (
              <button key={key} type="button" aria-pressed={mode === key} onClick={() => onMode(key)}>
                <Icon />
                <strong style={css("modeTitle")}>{label}</strong>
              </button>
            ))}
          </div>

          <p className="order-tracking-mode-hint" style={css("modeBody")}>
            {mode === "phone" ? copy.phoneHint : copy.codeHint}
          </p>

          {mode === "code" ? (
            <div className="order-tracking-fields-row">
              <label htmlFor={preview ? "preview-lookup-code" : "lookup-code"} style={css("label")}>
                <span>{copy.codeLabel}</span>
                <input
                  id={preview ? "preview-lookup-code" : "lookup-code"}
                  value={code}
                  onChange={onCode}
                  style={css("input")}
                  required={!preview}
                  minLength={4}
                  maxLength={40}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={copy.codePlaceholder}
                />
              </label>
              <label htmlFor={preview ? "preview-lookup-code-phone" : "lookup-code-phone"} style={css("label")}>
                <span>{copy.codePhoneLabel}</span>
                <input
                  id={preview ? "preview-lookup-code-phone" : "lookup-code-phone"}
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={onPhone}
                  style={css("input")}
                  required={!preview}
                  minLength={4}
                  maxLength={32}
                  autoComplete={preview ? "off" : "tel"}
                  placeholder={copy.codePhonePlaceholder}
                />
              </label>
            </div>
          ) : (
            <label htmlFor={preview ? "preview-lookup-phone" : "lookup-phone"} style={css("label")}>
              <span>{copy.phoneLabel}</span>
              <input
                id={preview ? "preview-lookup-phone" : "lookup-phone"}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={onPhone}
                style={css("input")}
                required={!preview}
                minLength={7}
                maxLength={32}
                autoComplete={preview ? "off" : "tel"}
                placeholder={copy.phonePlaceholder}
              />
            </label>
          )}

          <button className="order-tracking-submit" aria-busy={busy} type={preview ? "button" : "submit"} disabled={busy} style={css("button")}>
            <span>{busy ? copy.loadingLabel : copy.submitLabel}</span>
            <ButtonIcon name="trackingSubmit" defaultSize={18}>→</ButtonIcon>
          </button>
        </Form>

        {error && <p className="order-tracking-error" role="alert">{error}</p>}

        {copy.help && (
          <p className="order-tracking-form-help" style={css("help")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{copy.help}</span>
          </p>
        )}
      </div>

      <details className="order-tracking-guide">
        <summary style={css("guideTitle")}>
          <span>{copy.guideTitle}</span>
          <svg className="tracking-guide-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="order-tracking-guide-body">
          <ol>
            {[
              ["guideFirstTitle", "guideFirstBody"],
              ["guideSecondTitle", "guideSecondBody"],
              ["guideThirdTitle", "guideThirdBody"],
            ].map(([title, body], index) => (
              <li key={title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong style={css("guideBody")}>{copy[title]}</strong>
                  <p style={css("guideBody")}>{copy[body]}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="order-tracking-guide-support">
            <p style={css("help")}>{copy.scopeNote}</p>
            {preview ? (
              <span className="tracking-contact-link" style={css("help")}>
                {copy.contactLabel}
                <ButtonIcon name="trackingContact" defaultSize={16} />
              </span>
            ) : (
              <Link className="tracking-contact-link" to="/#contact" style={css("help")}>
                {copy.contactLabel}
                <ButtonIcon name="trackingContact" defaultSize={16} />
              </Link>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
