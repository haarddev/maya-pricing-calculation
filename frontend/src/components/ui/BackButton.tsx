import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

type BackButtonProps = {
  to: string;
  label: string;
};

export function BackButton({ to, label }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button variant="ghost" onClick={() => navigate(to)} className="!px-0 self-start">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
