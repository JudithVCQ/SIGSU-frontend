import Icon from './Icon';

export default function KpiCard({ number, label, change, tone = '', icon }) {
  const defaultIcon = tone === 'gold' ? 'check' : tone === 'dark' ? 'file' : 'layers';

  return (
    <article className="kpi">
      <div className={`kpi-icon ${tone}`.trim()}>
        <Icon name={icon ?? defaultIcon} />
      </div>
      <div>
        <div className="kpi-number">{number}</div>
        <div className="kpi-label">{label}</div>
        {change && <div className="kpi-change">{change}</div>}
      </div>
    </article>
  );
}
