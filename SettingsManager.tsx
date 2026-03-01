/**
 * نظام حفظ الإعدادات المحسن - STAR LUX
 * حفظ موثوق 100% مع التحقق والتأكيد
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Save, Check, AlertTriangle, RotateCcw, History } from 'lucide-react';
import { cn } from '@/lib/utils';

// أنواع الإعدادات
export interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'switch' | 'select';
  value: any;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  required?: boolean;
  validation?: (value: any) => string | null;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
}

export interface SettingsGroup {
  id: string;
  title: string;
  description?: string;
  fields: SettingField[];
}

// حالة الحفظ
type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

// Props للمكون
interface SettingsManagerProps {
  groups: SettingsGroup[];
  onSave: (settings: Record<string, any>) => Promise<boolean>;
  onReset?: () => void;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

/**
 * مدير الإعدادات الرئيسي
 */
export function SettingsManager({
  groups,
  onSave,
  onReset,
  autoSave = false,
  autoSaveDelay = 3000,
}: SettingsManagerProps) {
  // حالة الإعدادات
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    groups.forEach((group) => {
      group.fields.forEach((field) => {
        initial[field.key] = field.value;
      });
    });
    return initial;
  });

  // حالة الحفظ
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // مرجع للقيم الأصلية
  const originalSettings = useRef<Record<string, any>>({ ...settings });
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // التحقق من وجود تغييرات غير محفوظة
  const hasUnsavedChanges = useCallback(() => {
    return Object.keys(settings).some(
      (key) => settings[key] !== originalSettings.current[key]
    );
  }, [settings]);

  // تحديث حالة الحفظ عند التغيير
  useEffect(() => {
    if (hasUnsavedChanges()) {
      setSaveState('unsaved');
    }
  }, [settings, hasUnsavedChanges]);

  // الحفظ التلقائي
  useEffect(() => {
    if (autoSave && hasUnsavedChanges()) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        handleSave();
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [settings, autoSave, autoSaveDelay, hasUnsavedChanges]);

  // التحقق من الإعدادات
  const validateSettings = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    groups.forEach((group) => {
      group.fields.forEach((field) => {
        const value = settings[field.key];

        // التحقق من الحقول المطلوبة
        if (field.required && (value === '' || value === null || value === undefined)) {
          newErrors[field.key] = `${field.label} مطلوب`;
          isValid = false;
        }

        // التحقق المخصص
        if (field.validation && value) {
          const error = field.validation(value);
          if (error) {
            newErrors[field.key] = error;
            isValid = false;
          }
        }

        // التحقق من الحد الأدنى والأقصى للأرقام
        if (field.type === 'number' && value !== '') {
          const numValue = Number(value);
          if (field.min !== undefined && numValue < field.min) {
            newErrors[field.key] = `القيمة يجب أن تكون ${field.min} على الأقل`;
            isValid = false;
          }
          if (field.max !== undefined && numValue > field.max) {
            newErrors[field.key] = `القيمة يجب أن تكون ${field.max} كحد أقصى`;
            isValid = false;
          }
        }
      });
    });

    setErrors(newErrors);
    return isValid;
  }, [groups, settings]);

  // حفظ الإعدادات
  const handleSave = useCallback(async () => {
    // التحقق أولاً
    if (!validateSettings()) {
      toast.error('يرجى تصحيح الأخطاء قبل الحفظ');
      return;
    }

    setSaveState('saving');

    try {
      const success = await onSave(settings);

      if (success) {
        setSaveState('saved');
        originalSettings.current = { ...settings };
        toast.success('تم حفظ الإعدادات بنجاح');

        // إعادة الحالة بعد 2 ثانية
        setTimeout(() => setSaveState('idle'), 2000);
      } else {
        throw new Error('فشل في الحفظ');
      }
    } catch (error) {
      setSaveState('error');
      toast.error('فشل في حفظ الإعدادات');

      // إعادة الحالة بعد 3 ثواني
      setTimeout(() => setSaveState('unsaved'), 3000);
    }
  }, [settings, onSave, validateSettings]);

  // إعادة تعيين الإعدادات
  const handleReset = useCallback(() => {
    const defaultSettings: Record<string, any> = {};
    groups.forEach((group) => {
      group.fields.forEach((field) => {
        defaultSettings[field.key] = field.defaultValue ?? field.value;
      });
    });
    setSettings(defaultSettings);
    setErrors({});
    onReset?.();
    toast.info('تم إعادة تعيين الإعدادات');
  }, [groups, onReset]);

  // التراجع عن التغييرات
  const handleRevert = useCallback(() => {
    setSettings({ ...originalSettings.current });
    setErrors({});
    setSaveState('idle');
    toast.info('تم التراجع عن التغييرات');
  }, []);

  // تحديث قيمة إعداد
  const updateSetting = useCallback((key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // مسح الخطأ عند التعديل
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  // رندر حقل الإعداد
  const renderField = (field: SettingField) => {
    const value = settings[field.key];
    const error = errors[field.key];

    const commonProps = {
      id: field.key,
      value: value ?? '',
      onChange: (e: any) => updateSetting(field.key, e.target?.value ?? e),
      placeholder: field.placeholder,
      className: cn(error && 'border-destructive'),
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <Input
            {...commonProps}
            type={field.type}
            min={field.min}
            max={field.max}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={4}
          />
        );

      case 'switch':
        return (
          <Switch
            id={field.key}
            checked={value ?? false}
            onCheckedChange={(checked) => updateSetting(field.key, checked)}
          />
        );

      case 'select':
        return (
          <Select
            value={value ?? ''}
            onValueChange={(val) => updateSetting(field.key, val)}
          >
            <SelectTrigger className={cn(error && 'border-destructive')}>
              <SelectValue placeholder={field.placeholder || 'اختر...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  // أيقونة حالة الحفظ
  const getSaveIcon = () => {
    switch (saveState) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'saved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Save className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* مجموعات الإعدادات */}
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            {group.description && (
              <CardDescription>{group.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {group.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.key} className="flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.type === 'switch' && renderField(field)}
                </div>
                {field.type !== 'switch' && renderField(field)}
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
                {errors[field.key] && (
                  <p className="text-xs text-destructive">{errors[field.key]}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-between sticky bottom-4 bg-background/95 backdrop-blur p-4 rounded-lg border shadow-lg">
        <div className="flex items-center gap-2">
          {hasUnsavedChanges() && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              تغييرات غير محفوظة
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges() && (
            <Button variant="outline" onClick={handleRevert}>
              <RotateCcw className="h-4 w-4 mr-2" />
              تراجع
            </Button>
          )}
          <Button variant="outline" onClick={handleReset}>
            <History className="h-4 w-4 mr-2" />
            إعادة تعيين
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveState === 'saving' || !hasUnsavedChanges()}
            className={cn(
              saveState === 'saved' && 'bg-green-600 hover:bg-green-700',
              saveState === 'error' && 'bg-red-600 hover:bg-red-700'
            )}
          >
            {getSaveIcon()}
            <span className="mr-2">
              {saveState === 'saving' ? 'جاري الحفظ...' :
               saveState === 'saved' ? 'تم الحفظ' :
               saveState === 'error' ? 'فشل الحفظ' : 'حفظ الإعدادات'}
            </span>
          </Button>
        </div>
      </div>

      {/* حوار التغييرات غير المحفوظة */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تغييرات غير محفوظة</AlertDialogTitle>
            <AlertDialogDescription>
              لديك تغييرات غير محفوظة. هل تريد حفظها قبل المغادرة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedDialog(false);
              if (pendingNavigation) {
                window.location.href = pendingNavigation;
              }
            }}>
              تجاهل
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await handleSave();
              setShowUnsavedDialog(false);
              if (pendingNavigation) {
                window.location.href = pendingNavigation;
              }
            }}>
              حفظ ومتابعة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Hook لاستخدام الإعدادات
export function useSettings<T extends Record<string, any>>(
  initialSettings: T,
  onSave: (settings: T) => Promise<boolean>
) {
  const [settings, setSettings] = useState<T>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const originalRef = useRef<T>(initialSettings);

  const updateSetting = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalRef.current));
      return newSettings;
    });
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const success = await onSave(settings);
      if (success) {
        originalRef.current = { ...settings };
        setHasChanges(false);
        return true;
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [settings, onSave]);

  const reset = useCallback(() => {
    setSettings({ ...originalRef.current });
    setHasChanges(false);
  }, []);

  return {
    settings,
    updateSetting,
    save,
    reset,
    isSaving,
    hasChanges,
  };
}
