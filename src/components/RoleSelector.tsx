import React from 'react';
import { ROLE_TEMPLATES, type RoleTemplate } from '../templates';
import { toast } from 'react-toastify';
import { Briefcase } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: string;
  onSelectRole: (template: RoleTemplate) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = () => {
  return null;
};
