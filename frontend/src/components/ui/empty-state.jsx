import React from 'react';
import { Button } from './button';
import { FileQuestion, Plus } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = FileQuestion,
  title, 
  description, 
  actionLabel, 
  onAction,
  secondaryLabel,
  onSecondaryAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-neutral-light" />
      </div>
      
      <h3 className="text-lg font-semibold text-neutral-dark mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-neutral-light max-w-md mb-6">
        {description}
      </p>
      
      <div className="flex gap-3">
        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        )}
        
        {secondaryLabel && onSecondaryAction && (
          <Button 
            onClick={onSecondaryAction}
            variant="outline"
          >
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
