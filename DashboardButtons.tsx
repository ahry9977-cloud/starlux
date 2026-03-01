/**
 * أزرار لوحة التحكم المحسنة - STAR LUX
 * جميع الأزرار تعمل 100% مع معالجة الأخطاء
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<typeof Button>;
import { toast } from 'sonner';
import { Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// حالات الزر
type ButtonState = 'idle' | 'loading' | 'success' | 'error';

// Props للزر الذكي
interface SmartButtonProps extends Omit<ButtonProps, 'onClick' | 'onError'> {
  onClick: () => Promise<void> | void;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showFeedback?: boolean;
  confirmMessage?: string;
  onSuccess?: () => void;
  onErrorCallback?: (error: Error) => void;
}

/**
 * زر ذكي مع معالجة الأخطاء والتحميل
 */
export function SmartButton({
  onClick,
  loadingText = 'جاري التنفيذ...',
  successText = 'تم بنجاح',
  errorText = 'حدث خطأ',
  showFeedback = true,
  confirmMessage,
  onSuccess,
  onErrorCallback,
  children,
  disabled,
  className,
  ...props
}: SmartButtonProps) {
  const [state, setState] = useState<ButtonState>('idle');

  const handleClick = useCallback(async () => {
    // التأكيد إذا كان مطلوباً
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setState('loading');

    try {
      await onClick();
      setState('success');
      
      if (showFeedback) {
        toast.success(successText);
      }
      
      onSuccess?.();

      // إعادة الحالة بعد 2 ثانية
      setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      setState('error');
      
      const errorMessage = error instanceof Error ? error.message : errorText;
      
      if (showFeedback) {
        toast.error(errorMessage);
      }
      
      onErrorCallback?.(error instanceof Error ? error : new Error(errorMessage));

      // إعادة الحالة بعد 3 ثواني
      setTimeout(() => setState('idle'), 3000);
    }
  }, [onClick, confirmMessage, showFeedback, successText, errorText, onSuccess, onErrorCallback]);

  const isDisabled = disabled || state === 'loading';

  const getIcon = () => {
    switch (state) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin mr-2" />;
      case 'success':
        return <Check className="h-4 w-4 mr-2 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return null;
    }
  };

  const getText = () => {
    switch (state) {
      case 'loading':
        return loadingText;
      case 'success':
        return successText;
      case 'error':
        return errorText;
      default:
        return children;
    }
  };

  return (
    <Button
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        'transition-all',
        state === 'success' && 'bg-green-600 hover:bg-green-700',
        state === 'error' && 'bg-red-600 hover:bg-red-700',
        className
      )}
    >
      {getIcon()}
      {getText()}
    </Button>
  );
}

/**
 * زر الحفظ مع التحقق
 */
interface SaveButtonProps extends Omit<SmartButtonProps, 'onClick'> {
  onSave: () => Promise<boolean>;
  validateBeforeSave?: () => boolean | string;
}

export function SaveButton({
  onSave,
  validateBeforeSave,
  children = 'حفظ',
  ...props
}: SaveButtonProps) {
  const handleSave = async () => {
    // التحقق قبل الحفظ
    if (validateBeforeSave) {
      const validationResult = validateBeforeSave();
      if (validationResult !== true) {
        throw new Error(typeof validationResult === 'string' ? validationResult : 'فشل التحقق');
      }
    }

    const success = await onSave();
    if (!success) {
      throw new Error('فشل في الحفظ');
    }
  };

  return (
    <SmartButton
      onClick={handleSave}
      loadingText="جاري الحفظ..."
      successText="تم الحفظ"
      errorText="فشل الحفظ"
      {...props}
    >
      {children}
    </SmartButton>
  );
}

/**
 * زر الحذف مع التأكيد
 */
interface DeleteButtonProps extends Omit<SmartButtonProps, 'onClick'> {
  onDelete: () => Promise<void>;
  itemName?: string;
}

export function DeleteButton({
  onDelete,
  itemName = 'هذا العنصر',
  children = 'حذف',
  ...props
}: DeleteButtonProps) {
  return (
    <SmartButton
      onClick={onDelete}
      confirmMessage={`هل أنت متأكد من حذف ${itemName}؟`}
      loadingText="جاري الحذف..."
      successText="تم الحذف"
      errorText="فشل الحذف"
      variant="destructive"
      {...props}
    >
      {children}
    </SmartButton>
  );
}

/**
 * زر التفعيل/التعطيل
 */
interface ToggleButtonProps extends Omit<SmartButtonProps, 'onClick'> {
  isActive: boolean;
  onToggle: () => Promise<void>;
  activeText?: string;
  inactiveText?: string;
}

export function ToggleButton({
  isActive,
  onToggle,
  activeText = 'تعطيل',
  inactiveText = 'تفعيل',
  ...props
}: ToggleButtonProps) {
  return (
    <SmartButton
      onClick={onToggle}
      loadingText="جاري التحديث..."
      successText={isActive ? 'تم التعطيل' : 'تم التفعيل'}
      variant={isActive ? 'destructive' : 'default'}
      {...props}
    >
      {isActive ? activeText : inactiveText}
    </SmartButton>
  );
}

/**
 * زر التنقل
 */
interface NavigationButtonProps extends ButtonProps {
  href: string;
  external?: boolean;
  children?: React.ReactNode;
}

export function NavigationButton({
  href,
  external = false,
  children,
  ...props
}: NavigationButtonProps) {
  const handleClick = () => {
    if (external) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = href;
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}

/**
 * زر الإضافة
 */
interface AddButtonProps extends Omit<SmartButtonProps, 'onClick'> {
  onAdd: () => Promise<void> | void;
}

export function AddButton({
  onAdd,
  children = 'إضافة',
  ...props
}: AddButtonProps) {
  return (
    <SmartButton
      onClick={onAdd}
      loadingText="جاري الإضافة..."
      successText="تمت الإضافة"
      errorText="فشل الإضافة"
      {...props}
    >
      {children}
    </SmartButton>
  );
}

/**
 * زر التعديل
 */
interface EditButtonProps extends Omit<SmartButtonProps, 'onClick'> {
  onEdit: () => Promise<void> | void;
}

export function EditButton({
  onEdit,
  children = 'تعديل',
  ...props
}: EditButtonProps) {
  return (
    <SmartButton
      onClick={onEdit}
      loadingText="جاري التعديل..."
      successText="تم التعديل"
      errorText="فشل التعديل"
      variant="outline"
      {...props}
    >
      {children}
    </SmartButton>
  );
}

/**
 * زر التحديث
 */
interface RefreshButtonProps extends Omit<SmartButtonProps, 'onClick'> {
  onRefresh: () => Promise<void>;
}

export function RefreshButton({
  onRefresh,
  children = 'تحديث',
  ...props
}: RefreshButtonProps) {
  return (
    <SmartButton
      onClick={onRefresh}
      loadingText="جاري التحديث..."
      successText="تم التحديث"
      errorText="فشل التحديث"
      variant="outline"
      {...props}
    >
      {children}
    </SmartButton>
  );
}

/**
 * مجموعة أزرار الإجراءات
 */
interface ActionButtonGroupProps {
  onView?: () => void;
  onEdit?: () => Promise<void> | void;
  onDelete?: () => Promise<void>;
  onToggle?: () => Promise<void>;
  isActive?: boolean;
  itemName?: string;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showToggle?: boolean;
}

export function ActionButtonGroup({
  onView,
  onEdit,
  onDelete,
  onToggle,
  isActive = true,
  itemName,
  showView = true,
  showEdit = true,
  showDelete = true,
  showToggle = false,
}: ActionButtonGroupProps) {
  return (
    <div className="flex items-center gap-2">
      {showView && onView && (
        <Button variant="ghost" size="sm" onClick={onView}>
          عرض
        </Button>
      )}
      {showEdit && onEdit && (
        <EditButton onEdit={onEdit} size="sm" />
      )}
      {showToggle && onToggle && (
        <ToggleButton isActive={isActive} onToggle={onToggle} size="sm" />
      )}
      {showDelete && onDelete && (
        <DeleteButton onDelete={onDelete} itemName={itemName} size="sm" />
      )}
    </div>
  );
}
