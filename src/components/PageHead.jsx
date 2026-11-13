export default function PageHead({ eyebrow, title, text, action }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
