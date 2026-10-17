import Icon from './Icon';

export default function Button({
  variant = 'primary',
  icon,
  children,
  onClick,
  type = 'button',
  full = false,
  disabled = false,
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}${full ? ' btn-full' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={18} />}
      {children && <span>{children}</span>}
    </button>
  );
}
