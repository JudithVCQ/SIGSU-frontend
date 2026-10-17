const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
export default function Badge({ texto }) { return <span className={`badge badge-${slug(texto)}`}>{texto}</span>; }
