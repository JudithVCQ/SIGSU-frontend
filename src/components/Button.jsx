import Icon from './Icon';

export default function Button({
  variant = 'primary',
  icon,
  children,
  onClick,
  type = 'button',
  full = false,
  disabled = false,
  size = 'md', // 'md' (42px) | 'sm' (32px, para acciones dentro de tablas)
  title,
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''}${full ? ' btn-full' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon && <Icon name={icon} size={18} />}
      {children && <span>{children}</span>}
    </button>
  );
}
