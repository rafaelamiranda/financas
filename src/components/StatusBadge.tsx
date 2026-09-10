export interface StatusBadgeProps {
  status: 'entrada' | 'saida' | 'diario' | 'economia' | 'cartao' | 'pending' | 'completed';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
}

const statusConfig = {
  entrada: { label: 'Entrada', color: 'bg-entrada', textColor: 'text-entrada', borderColor: 'border-entrada' },
  saida: { label: 'Saída', color: 'bg-saida', textColor: 'text-saida', borderColor: 'border-saida' },
  diario: { label: 'Diário', color: 'bg-diario', textColor: 'text-diario', borderColor: 'border-diario' },
  economia: { label: 'Economia', color: 'bg-economia', textColor: 'text-economia', borderColor: 'border-economia' },
  cartao: { label: 'Cartão', color: 'bg-cartao', textColor: 'text-cartao', borderColor: 'border-cartao' },
  pending: { label: 'Pendente', color: 'bg-diario', textColor: 'text-diario', borderColor: 'border-diario' },
  completed: { label: 'Concluído', color: 'bg-entrada', textColor: 'text-entrada', borderColor: 'border-entrada' },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function StatusBadge({ status, size = 'md', variant = 'solid' }: StatusBadgeProps) {
  const config = statusConfig[status];

  const variantClasses = {
    solid: `${config.color} text-bg-primary font-semibold`,
    outline: `border-2 ${config.borderColor} ${config.textColor} bg-transparent font-semibold`,
    subtle: `${config.color}/10 ${config.textColor} font-semibold border border-${config.color}/20`,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap transition ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {config.label}
    </span>
  );
}
